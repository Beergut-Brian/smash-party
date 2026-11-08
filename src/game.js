/* Smash Party — game logic: debris, smashing, respawn, players, input, collisions, camera, loop. Owner: Claude Code (logic). */
/* ---------- debris & particles ---------- */
const debris=[],parts=[],DEBRIS_MAX=IS_PHONE?220:420;
/* Box debris (shatter chunks, blast bits, confetti) all draw from one InstancedMesh with per-instance colors:
   hundreds of flying boxes cost one draw call. debrisBox(color) returns a stand-in Object3D to position/scale. */
const DBOX_CAP=1200,dbox=new THREE.InstancedMesh(GEO.box,litMat({color:'#ffffff'}),DBOX_CAP),dboxOwner=[];
dbox.setColorAt(0,new THREE.Color('#ffffff'));dbox.count=0;dbox.castShadow=dbox.receiveShadow=true;dbox.frustumCulled=false;scene.add(dbox);
function debrisBox(color){const o=new THREE.Object3D();o.isBox=true;o.col=color;return o;}
function dboxFree(d){const i=d.slot,last=--dbox.count;
  if(i!==last){dbox.getMatrixAt(last,_dm);dbox.setMatrixAt(i,_dm);dbox.getColorAt(last,_dc);dbox.setColorAt(i,_dc);const mv=dboxOwner[last];mv.slot=i;dboxOwner[i]=mv;}
  dboxOwner[last]=undefined;dbox.instanceMatrix.needsUpdate=true;dbox.instanceColor.needsUpdate=true;}
const _dm=new THREE.Matrix4(),_dc=new THREE.Color();
function addDebris(m,half,vx,vy,vz,opts={}){
  let slot=-1;if(m.isBox){if(dbox.count>=DBOX_CAP)return;slot=dbox.count++;dbox.setColorAt(slot,m.col);dbox.instanceColor.needsUpdate=true;}
  else if(!m.parent)scene.add(m);
  const d={m,half,vx,vy,vz,ax:rand(-9,9),ay:rand(-9,9),az:rand(-9,9),life:opts.life||rand(6,9),settled:false,s0:m.scale.clone(),g:opts.g||32,confetti:!!opts.confetti,slot,whole:!!opts.whole};
  if(slot>=0)dboxOwner[slot]=d;debris.push(d);
  if(debris.length>DEBRIS_MAX)for(let i=0;i<debris.length-DEBRIS_MAX;i++)debris[i].life=Math.min(debris[i].life,0.6);
}
function updateDebris(dt){
  for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;
    if(d.life<=0){if(d.slot>=0)dboxFree(d);else{scene.remove(d.m);if(d.whole)wholeN--;}debris.splice(i,1);continue;}
    if(d.life<0.8){const k=Math.max(0.01,d.life/0.8);d.m.scale.set(d.s0.x*k,d.s0.y*k,d.s0.z*k);}
    const p=d.m.position;
    if(d.settled){
      for(const pl of players){const dx=p.x-pl.x,dz=p.z-pl.z,r=pl.r+d.half;
        if(dx*dx+dz*dz<r*r&&Math.abs(pl.speed)>4*pl.sm&&pl.y<2*S){const f=Math.abs(pl.speed);d.settled=false;
          d.vx=Math.sin(pl.heading)*f*0.7+dx*2;d.vz=Math.cos(pl.heading)*f*0.7+dz*2;d.vy=rand(4,9);d.ax=rand(-10,10);d.ay=rand(-10,10);d.az=rand(-10,10);d.life=Math.max(d.life,3);}}
      continue;}
    if(d.confetti){d.vy=Math.max(d.vy-d.g*dt,-5);d.vx*=0.985;d.vz*=0.985;}else d.vy-=d.g*dt;
    p.x+=d.vx*dt;p.y+=d.vy*dt;p.z+=d.vz*dt;
    d.m.rotation.x+=d.ax*dt;d.m.rotation.y+=d.ay*dt;d.m.rotation.z+=d.az*dt;
    if(Math.abs(p.x)>WB){p.x=Math.sign(p.x)*WB;d.vx*=-0.4;}
    if(Math.abs(p.z)>WB){p.z=Math.sign(p.z)*WB;d.vz*=-0.4;}
    const gh=groundH(p.x,p.z)+d.half*0.8;
    if(p.y<gh){p.y=gh;
      if(d.confetti){d.settled=true;continue;}
      d.vy=-d.vy*0.35;d.vx*=0.6;d.vz*=0.6;d.ax*=0.5;d.ay*=0.5;d.az*=0.5;
      if(Math.abs(d.vy)<2&&d.vx*d.vx+d.vz*d.vz<2){d.settled=true;d.vy=0;}}
  }
  for(const d of debris)if(d.slot>=0){d.m.updateMatrix();dbox.setMatrixAt(d.slot,d.m.matrix);}
  if(dbox.count)dbox.instanceMatrix.needsUpdate=true;
}
function addPart(m,life,vx=0,vy=0,vz=0,grow=0,fade=false){scene.add(m);parts.push({m,life,max:life,vx,vy,vz,grow,fade,s0:m.scale.x});}
function updateParts(dt){
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;
    if(p.life<=0){scene.remove(p.m);if(p.fade)p.m.material.dispose();parts.splice(i,1);continue;}
    const k=p.life/p.max;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;
    p.m.scale.setScalar(p.grow?p.s0*(1+p.grow*(1-k)):p.s0*k);if(p.fade)p.m.material.opacity=k*0.75;}
}
/* L25: puffs and flashes all draw from one InstancedMesh (color + fading opacity per instance) instead of a mesh and
   material each: a big explosion was ~30 draw calls of smoke on its own. */
const PUFF_CAP=700,puffs=[],puffGeo=GEO.sph.clone(),puffOp=new THREE.InstancedBufferAttribute(new Float32Array(PUFF_CAP),1);
puffGeo.setAttribute('iOp',puffOp);
const puffMat=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,depthWrite:false});
puffMat.onBeforeCompile=sh=>{sh.vertexShader='attribute float iOp;\nvarying float vOp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOp=iOp;');
  sh.fragmentShader='varying float vOp;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vOp;');};
const puffIM=new THREE.InstancedMesh(puffGeo,puffMat,PUFF_CAP);puffIM.setColorAt(0,new THREE.Color('#ffffff'));puffIM.count=0;
puffIM.frustumCulled=false;puffIM.castShadow=false;puffIM.receiveShadow=false;scene.add(puffIM);
const _pfc=new THREE.Color(),_pfm=new THREE.Matrix4(),_pfq=new THREE.Quaternion(),_pfv=new THREE.Vector3(),_pfs=new THREE.Vector3();
function addPuff(x,y,z,s,color,life,vx,vy,vz,grow){
  if(puffs.length>=PUFF_CAP)return; // plenty of smoke already
  puffs.push({x,y,z,s0:s,life,max:life,vx,vy,vz,grow});puffIM.setColorAt(puffs.length-1,_pfc.set(color));puffIM.instanceColor.needsUpdate=true;}
function updatePuffs(dt){
  for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];p.life-=dt;
    if(p.life<=0){const last=puffs.length-1;if(i!==last){puffs[i]=puffs[last];puffIM.getColorAt(last,_pfc);puffIM.setColorAt(i,_pfc);puffIM.instanceColor.needsUpdate=true;}puffs.pop();continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}
  for(let i=0;i<puffs.length;i++){const p=puffs[i],k=p.life/p.max,sc=p.s0*(1+p.grow*(1-k));
    _pfm.compose(_pfv.set(p.x,p.y,p.z),_pfq,_pfs.set(sc,sc,sc));puffIM.setMatrixAt(i,_pfm);puffOp.array[i]=k*0.75;}
  puffIM.count=puffs.length;if(puffs.length){puffIM.instanceMatrix.needsUpdate=true;puffOp.needsUpdate=true;}}
function puff(x,y,z,n,size,color='#f4ecdf'){
  const k=Math.min(1.6,size/1.2);
  for(let i=0;i<n;i++)addPuff(x+rand(-1,1)*k,y+rand(0,1)*k,z+rand(-1,1)*k,size*rand(.7,1.3),color,rand(.5,.9),rand(-3,3)*k,rand(1,3)*k,rand(-3,3)*k,1.6);
}
function flash(x,y,z,color,size,life){addPuff(x,y,z,size,color,life,0,2,0,6);}

/* ---------- smashing ---------- */
let score=0,levelScore=0,level=1,goal=100,smashCount=0,shake=0;
const queue=[];
let WB=ARENA; // world bound: the arena outside, the room indoors (L20)
const _wp=new THREE.Vector3(),_q=new THREE.Quaternion(),_ws=new THREE.Vector3();
function partMat(m){if(m.material&&!Array.isArray(m.material))return m.material;let f=null;m.traverse(x=>{if(!f&&x.isMesh)f=Array.isArray(x.material)?x.material[0]:x.material;});return f||M('#cccccc');}
// send one part flying: whole parts fly off intact, others shatter into `n` boxes. vyK scales the upward kick.
const WHOLE_MAX=40;let wholeN=0; // L25: at most this many intact parts fly at once (each is its own draw call); past that they shatter into boxes
function breakPart(o,part,nx,nz,power,vyK=1){
  if(part.gone)return;if(part.bm)for(const rec of part.bm)bossSplit(o,rec); // L28: merged boss parts come back as real meshes first
  part.gone=true;const m=part.mesh,k=sizeK(o);power*=k;vyK*=k;
  m.traverse(x=>x.userData.dead=true); // keeps it hidden in the chunk's instanced copy
  m.getWorldPosition(_wp);const out=Math.atan2(_wp.x-o.x,_wp.z-o.z);
  if(part.whole&&wholeN<WHOLE_MAX){wholeN++;
    m.getWorldQuaternion(_q);m.getWorldScale(_ws);
    scene.add(m);m.position.copy(_wp);m.quaternion.copy(_q);m.scale.copy(_ws);
    const f=power*rand(.4,1.0);
    addDebris(m,part.half,nx*f+(Math.sin(out)*rand(1,5)+rand(-3,3))*k,rand(4,11)*(0.6+power/45)*vyK,nz*f+(Math.cos(out)*rand(1,5)+rand(-3,3))*k,{whole:true});
  }else{
    m.getWorldScale(_ws);const s=_ws,vol=s.x*s.y*s.z/part.n;const cs0=clamp(Math.cbrt(vol),0.3*k*k,2.0);
    for(let i=0;i<part.n;i++){const cs=cs0*rand(.7,1.15);
      const c=debrisBox(partMat(m).color);c.scale.set(cs*rand(.8,1.2),cs*rand(.6,1.1),cs*rand(.8,1.2));
      c.position.set(_wp.x+rand(-s.x/2,s.x/2)*.8,_wp.y+rand(-s.y/2,s.y/2)*.8,_wp.z+rand(-s.z/2,s.z/2)*.8);c.rotation.set(rand(0,3),rand(0,3),rand(0,3));
      const f=power*rand(.3,.85),oa=Math.atan2(c.position.x-o.x,c.position.z-o.z);
      addDebris(c,cs*0.4,nx*f+Math.sin(oa)*rand(2,7)*k,rand(5,13)*(0.6+power/45)*vyK,nz*f+Math.cos(oa)*rand(2,7)*k);}
    if(m.parent)m.parent.remove(m);
  }
}
function smash(o,vx,vz,power){
  if(!o.alive)return;
  if(o.bld){collapse(o,0,vx,vz,power,true);return;}
  o.alive=false;wakeObj(o);if(isBreakout(o))breakOut(o);
  if(o.rec){o.rec.dead=true;o.rec.back=T+rand(REGROW[0],REGROW[1]);}
  const dl=Math.hypot(vx,vz)||1,nx=vx/dl,nz=vz/dl;
  for(const part of o.parts)breakPart(o,part,nx,nz,power);
  scene.remove(o.g);
  const k=sizeK(o);puff(o.x,0.5*k,o.z,o.big?7:3,(o.big?2.2:1.2)*k);
  sfxIn(zoneXZ(o.x,o.z),'crash',o.sfx,o.big);shake=Math.min(1.5,shake+(o.big?0.6:0.2));
  smashCount++;addScore(o.points);grow(GROW_VAL[o.sz]);comboHit();
  if(o.explosive)queue.push({t:0.07,fn:()=>explode(o.x,o.z,GROW_S[o.sz]/GROW_S[TYPE_SIZE.barrel])});
  if(o.gold)goldFound(o);
}
function explode(x,z,e=1){ // e = blast size (1 = a normal barrel); shrunken barrels make little pops
  const q=Math.sqrt(e);sfxIn(zoneXZ(x,z),'boom');shake=Math.min(2,shake+1.2*Math.min(1,e));
  flash(x,2*e,z,'#ffd166',3*e,0.4);flash(x,2*e,z,'#ff5400',2*e,0.55);puff(x,e,z,8,2.5*e,'#666666');
  for(let i=0;i<16;i++){const c=debrisBox(M(pick(['#ff7b00','#ffd60a','#333333','#e63946'])).color);const s=rand(.4,1.1)*e;c.scale.set(s,s,s);
    c.position.set(x,1.5*e,z);const a=rand(0,Math.PI*2),f=rand(12,24)*q;addDebris(c,s*.4,Math.sin(a)*f,rand(8,18)*q,Math.cos(a)*f);}
  for(const o of objects){if(!o.alive||o.falling)continue;const dx=o.x-x,dz=o.z-z,d=Math.hypot(dx,dz);
    if(o.boss)continue;
    if(o.bld){if(d<9*e+o.r)queue.push({t:0.06+d*0.012,fn:()=>damageBuilding(o,x,z,9*e,99,-1,7*e,dx/(d||1),dz/(d||1),24*q)});continue;}
    if(d<8*e+o.r&&o.sz<=tier+1)queue.push({t:0.06+d*0.012,fn:()=>smash(o,dx,dz,26*q)});}
  for(const p of players){const dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz)||1;
    if(d<10*e){p.air=true;p.vy=Math.max(p.vy,12*q);p.kx+=dx/d*14*q;p.kz+=dz/d*14*q;}}
  for(const a of animals){const dx=a.x-x,dz=a.z-z,d=Math.hypot(dx,dz);if(d<10*e)launchAnimal(a,dx||1,dz,18*q);}
}
function slam(p,big){ // landing hard (or from a launch pad: big) smashes what's around the car
  const R=big?p.r*3.2:p.r+Math.max(3*S,1);
  shake=Math.min(2,shake+(big?1.1:0.7));const zn=zoneXZ(p.x,p.z);sfxIn(zn,'thud');if(big){sfxIn(zn,'boom');flash(p.x,S,p.z,'#ffffff',R*0.6,0.35);}
  puff(p.x,0.3,p.z,big?14:8,(big?R*0.35:1.8*Math.max(S,.3)));
  for(const o of objects){if(!o.alive||o.falling||o.boss)continue;const dx=o.x-p.x,dz=o.z-p.z;
    if(o.sz<=tier&&Math.hypot(dx,dz)<R+o.r)smash(o,dx,dz,18*Math.sqrt(Math.max(S,0.3)));}
  for(const a of animals){const dx=a.x-p.x,dz=a.z-p.z;if(a.sz<=tier&&Math.hypot(dx,dz)<R+a.r)launchAnimal(a,dx||1,dz,14*p.sm);}
}
function addScore(n){
  score+=n;levelScore+=n;
  if(levelScore>=goal){levelScore-=goal;level++;goal=100+level*40;mega();}
}

/* ---------- buildings: staged destruction ---------- */
/* A building is made with makeObj(..., {building:true}) and its parts are tagged with BP(mesh,floor,kind) (core.js).
   Hits knock parts out. When a floor loses too many walls, everything above it drops, tilts and pancakes floor by
   floor, then the stump crumbles. Size decides the hit: way smaller = boing, smaller = chip 1–2 pieces,
   same size = plow straight through, bigger = flatten in one hit. */
const SUPPORT=0.5; // a floor holds up the rest while at least this share of its walls stand
const collapsing=[];
function initBld(o){
  if(!o.building&&!o.parts.some(p=>p.mesh.userData.kind))return;
  o.g.updateMatrixWorld(true);const bx=new THREE.Box3(),c=new THREE.Vector3(),fl={};
  for(const p of o.parts){p.floor=p.mesh.userData.floor|0;p.kind=p.mesh.userData.kind||'extra';
    bx.setFromObject(p.mesh);bx.getCenter(c);p.wx=c.x;p.wz=c.z;p.y0=bx.min.y;p.y1=bx.max.y;
    const F=fl[p.floor]||(fl[p.floor]={walls:0,y0:1e9,y1:-1e9});F.walls+=p.kind==='wall';F.y0=Math.min(F.y0,p.y0);F.y1=Math.max(F.y1,p.y1);}
  o.bld={fl};o.paid=0;
}
function killBld(o){ // the building is done for: score what's left, remember it, regrow later
  comboHit(3);
  o.alive=false;wakeObj(o);if(isBreakout(o))breakOut(o);
  if(o.rec){o.rec.dead=true;o.rec.gone=[];o.rec.back=T+rand(REGROW[0],REGROW[1]);}
  const rest=Math.max(0,1-o.paid);smashCount++;addScore(o.points*rest);grow((GROW_VAL[o.sz]||0)*rest);
}
function damageBuilding(o,x,z,rad,max,y0,y1,nx,nz,power){
  if(!o.alive)return 0;wakeObj(o);
  const hit=o.parts.filter(p=>!p.gone&&p.y1>y0&&p.y0<y1).map(p=>[p,Math.hypot(p.wx-x,p.wz-z)]).filter(a=>a[1]<rad).sort((a,b)=>a[1]-b[1]).slice(0,max);
  if(!hit.length)return 0;
  for(const [p] of hit){breakPart(o,p,nx,nz,power);if(o.rec)(o.rec.gone||(o.rec.gone=[])).push(o.parts.indexOf(p));}
  const fr=hit.length/o.parts.length;o.paid+=fr;addScore(o.points*fr);grow((GROW_VAL[o.sz]||0)*fr);
  sfxIn(zoneXZ(o.x,o.z),'crash',o.sfx,hit.length>2);puff(x,1,z,2+hit.length,1.2,'#e8dcc8');shake=Math.min(1.5,shake+0.1*hit.length);
  if(o.parts.every(p=>p.gone)){killBld(o);scene.remove(o.g);return hit.length;}
  // lost too many walls on a floor? everything above it comes down
  for(const f of Object.keys(o.bld.fl).map(Number).sort((a,b)=>a-b)){const F=o.bld.fl[f];
    if(F.walls&&o.parts.filter(p=>!p.gone&&p.floor===f&&p.kind==='wall').length/F.walls<SUPPORT&&
       o.parts.some(p=>!p.gone&&(p.floor>f||(p.floor===f&&p.kind==='roof')))){collapse(o,f,nx,nz,power*0.5);break;}}
  return hit.length;
}
function dust(o,n){for(let i=0;i<n;i++)puff(o.x+rand(-o.r,o.r),rand(0.5,2.5),o.z+rand(-o.r,o.r),3,1.4+o.r*0.35,'#d9c9a8');}
function collapse(o,k,vx,vz,power,fast){
  if(!o.alive)return;killBld(o);bossUnmerge(o);
  const dl=Math.hypot(vx,vz)||1,nx=vx/dl,nz=vz/dl,ry=o.g.rotation.y;
  const fs=[...new Set(o.parts.filter(p=>!p.gone).map(p=>p.floor))].sort((a,b)=>a-b);
  const up=new THREE.Group();o.g.add(up);
  for(const p of o.parts)if(!p.gone&&p.floor>=k)up.add(p.mesh);
  o.col={up,upper:fs.filter(f=>f>=k),lower:fs.filter(f=>f<k).reverse(),need:0,fallen:0,vy:0,tilt:0,t:0,
    lx:nx*Math.cos(ry)-nz*Math.sin(ry),lz:nx*Math.sin(ry)+nz*Math.cos(ry),g:fast?70:34,nx,nz,power:Math.max(8,power)};
  crumbleFloor(o,o.col.upper.shift()); // the floor that gave way goes first
  collapsing.push(o);sfx.rumble();sfxIn(zoneXZ(o.x,o.z),'crash',o.sfx,true);shake=Math.min(2,shake+(fast?1.3:0.8));dust(o,fast?6:3);
}
function crumbleFloor(o,f){const c=o.col;
  for(const p of o.parts)if(!p.gone&&p.floor===f)breakPart(o,p,c.nx,c.nz,c.power*0.5,0.4);
  const F=o.bld.fl[f];c.need+=F?Math.max(0.6,F.y1-F.y0):1;}
function updateCollapses(dt){
  for(let i=collapsing.length-1;i>=0;i--){const o=collapsing[i],c=o.col;
    if(c.upper.length){ // the upper floors fall as one block, tilting, and pancake when they land
      c.vy+=c.g*dt;c.fallen=Math.min(c.need,c.fallen+c.vy*dt);c.tilt=Math.min(0.3,c.tilt+dt*0.3);
      c.up.position.y=-c.fallen/(o.s0||1);c.up.rotation.x=c.tilt*c.lz;c.up.rotation.z=-c.tilt*c.lx;
      if(c.fallen>=c.need){sfx.thud();shake=Math.min(2,shake+0.35);dust(o,2);crumbleFloor(o,c.upper.shift());c.vy*=0.2;}
      continue;}
    if(c.lower.length){if((c.t-=dt)<=0){c.t=0.16;crumbleFloor(o,c.lower.shift());dust(o,2);}continue;}
    dust(o,4);scene.remove(o.g);collapsing.splice(i,1);
  }
}
function hitBuilding(p,o,dx,dz,rr,spd,vx,vz){
  const diff=o.sz-tier;
  if(diff>=3||(spd<4*p.sm&&!p.air)){bump(p,o,dx,dz,rr,spd);return;}
  const dozer=p.perk==='bulldozer',pow=p.power+(dozer?1:0);
  if(diff>0&&pow<POWER_CHIP[diff]){bump(p,o,dx,dz,rr,spd);return;}                   // too weak for something this big: boing
  const pw=Math.max(spd,10)*Math.sqrt(Math.max(1,S))*(0.8+0.08*p.power),nx=vx/(spd||1),nz=vz/(spd||1);
  if(diff<0){collapse(o,0,vx||dx,vz||dz,pw,true);p.speed*=0.95;return;}               // bigger: flatten it
  const d=Math.hypot(dx,dz)||1,y0=p.y-0.3,y1=p.y+(p.model.h+1)*S;                       // what the car can reach
  if(diff===0&&dozer){collapse(o,0,vx||dx,vz||dz,pw,true);p.speed*=0.9;return;}      // bulldozer: down in one hit
  if(diff===0){if(o.hitT>T)return;o.hitT=T+0.1;                                       // same size: plow through
    damageBuilding(o,p.x+dx/d*p.r,p.z+dz/d*p.r,p.r+2.5,99,y0,y1,nx,nz,pw);p.speed*=0.85;return;}
  if(!(o.hitT>T)){o.hitT=T+0.3;damageBuilding(o,p.x,p.z,99,(diff===1?2:1)+(pow>=5?1:0),y0,y1,nx,nz,pw*0.6);} // smaller: chip (strong cars chip more)
  bump(p,o,dx,dz,rr,spd);
}
// Reference building for D2 and testing (__sp.building). Design's real buildings live in objects.js.
function demoBuilding(x,z,floors=3){
  const fh=3,w=6.4;
  const o=makeObj(x,z,w*0.62,floors*fh+2.5,10+floors*8,(P,g)=>{
    for(let f=0;f<floors;f++){const y=f*fh,col=pick(PASTEL);
      for(let s=0;s<4;s++)for(let k=0;k<3;k++){const a=-w/2+w/6+k*w/3,e=w/2-0.25;
        P(BP(s<2?mk('box',w/3,fh,0.5,col,a,y+fh/2,s?e:-e):mk('box',0.5,fh,w/3,col,s==2?e:-e,y+fh/2,a),f,'wall'),3);}
      P(BP(mk('box',1,1.1,0.2,'#a0e7ff',-1.6,y+fh*0.55,w/2),f,'extra'),1,true,0.5);P(BP(mk('box',1,1.1,0.2,'#a0e7ff',1.6,y+fh*0.55,w/2),f,'extra'),1,true,0.5);
      P(BP(mk('box',w,0.3,w,'#dddddd',0,y+fh,0),f,'slab'),4);}
    P(BP(mk('pyr',w*1.4,2.4,w*1.4,pick(ROOF),0,floors*fh+1.35,0),floors,'roof'),8);
  },{building:true,size:'large',big:true});
  o.type='demo';o.chunk=chunkOf(x,z).k;o.sz=sizeClass(o);initBld(o);o.fr=footprint(o);return o;
}

/* ---------- car tiers ---------- */
// Cooler cars unlock as you grow: a new car tier every 2 sizes, picked in the level-up garage (L17). ` (backquote) cycles cars for testing.
// Design can set `tier` (0–3) and `weapon` ('bubble' | 'cannon' | 'rocket') on CARS entries; until then these decide.
const CAR_TIER={'Bubble Buggy':0,'Ice Cream Smasher':0,'Hot Dog Hot Rod':1,'Big Bouncer':1,'Fire Truck':2,'Dino Dozer':2,'Shark Attack':3,'Rocket Racer':3};
const WEAPON_BY_TIER=['bubble','bubble','cannon','rocket'];
const carTierOf=c=>c.tier??CAR_TIER[c.name]??1;
const carTierNow=()=>Math.min(3,Math.floor((giant?SIZES.length:tier)/2));
const carWeapon=c=>c.weapon!==undefined?c.weapon:WEAPON_BY_TIER[carTierOf(c)];
/* L18 car stats + perks. Design sets them on CARS entries: `power` 1–5 (what it can break above its size), `handling` 1–5
   (turning + grip), `perk`: 'autoRockets' | 'magnet' | 'bulldozer' | 'bouncy' (or none). `speed` stays the real top speed.
   Missing ones come from tier/size/speed (bigger + higher tier = stronger, faster + smaller = nimbler, so faster cars are weaker).
   Power rules: anything up to your size smashes as before; buildings 1 size bigger need power 3+ to chip, 2 sizes bigger
   need 4+; 3+ sizes bigger always boing. bulldozer: same-size buildings fall in one hit and it counts as +1 power. */
const CAR_PERK={'Big Bouncer':'bouncy','Dino Dozer':'bulldozer','Snow Pusher':'bulldozer','Stomp King':'bulldozer','Rex Rammer':'bulldozer',
  'Rocket Racer':'autoRockets','Spinny Mixer':'magnet','Cart Crash':'magnet','Shark Attack':'magnet'};
const PERK_ICON={autoRockets:'🚀',magnet:'🧲',bulldozer:'🚜',bouncy:'🦘'};
const POWER_CHIP=[0,3,4]; // power needed to chip a building 1 or 2 sizes bigger
const carPower=c=>c.power??clamp(Math.round(1+carTierOf(c)*1.1+((c.r||2.3)-2.3)*2-((c.speed||25)-25)/6),1,5);
const carHandling=c=>c.handling??clamp(Math.round(3+(2.4-(c.r||2.3))*2.5+((c.speed||25)-25)/5),1,5);
const carPerk=c=>c.perk!==undefined?c.perk:(CAR_PERK[c.name]||null);
function carStats(c){return {speed:c.speed,power:carPower(c),handling:carHandling(c),perk:carPerk(c),weapon:carWeapon(c),tier:carTierOf(c)};}
function carsInTier(t){for(let d=0;d<4;d++){const l=CARS.map((c,i)=>i).filter(i=>carTierOf(CARS[i])===t-d);if(l.length)return l;}return [0];}
function newCars(quiet){const l=carsInTier(carTierNow());
  for(const p of players)p.setCar(l[p.idx%l.length],false);
  if(quiet)return;showBig('NEW CAR!');sfxClip('levelup',0.7,1.2)||sfx.fanfare();say('New car!');
  for(const p of players){puff(p.x,S,p.z,10,1.5*Math.max(S,.3),'#ffffff');p.nameT=3;p.markT=3;}
  if(players[0])queue.push({t:1.2,fn:()=>say(players[0].stats.name+'!')});}

/* ---------- shooting (X or Y / F / . / 🎯) ---------- */
// bubbles (small cars) float and pop one thing your size; cannonballs bounce and plow through small stuff;
// rockets fly straight and explode. Cannonballs and rockets can hit boss weak spots.
const BUBBLE_MAT=new THREE.MeshBasicMaterial({color:'#9bf6ff',transparent:true,opacity:0.6,depthWrite:false});
const shots=[];
function shoot(p,aim,weapon){const w=weapon||carWeapon(p.stats);if(!w||(!weapon&&T<(p.shotT||0)))return;
  const rk=w==='rocket',bub=w==='bubble';if(!weapon)p.shotT=T+(rk?0.55:bub?0.22:0.28);
  const hd=aim??p.heading,fx=Math.sin(hd),fz=Math.cos(hd),sp=(rk?75:bub?22:60)*p.sm+Math.max(0,p.speed),r=(rk?0.5:bub?0.45:0.6)*S;
  const m=rk?mk('cone',r*1.2,r*3,r*1.2,'#e63946'):bub?mk('sph',r*2,r*2,r*2,null,0,0,0,BUBBLE_MAT):mk('sph',r*2,r*2,r*2,'#333333');
  if(rk){m.rotation.order='YXZ';m.rotation.set(Math.PI/2,hd,0);}if(bub)m.castShadow=false;
  const x=p.x+fx*(p.r+r*2),z=p.z+fz*(p.r+r*2),y=p.y+1.1*S;m.position.set(x,y,z);scene.add(m);
  shots.push({m,rk,bub,x,y,z,y0:y,vx:fx*sp,vz:fz*sp,vy:rk||bub?0:5*Math.sqrt(S),life:rk?2.2:bub?1.1:1.8,r,p,bounced:false,hits:0,ph:rand(0,6)});
  if(bub){if(!sfxClip('bubble',0.6,rand(0.9,1.2)))tone('sine',rand(500,700),rand(900,1200),0.12,0.12);}
  else{sfxClip(rk?'rocket':'cannon',0.7,rand(0.95,1.05))||sfx.pop();p.kx-=fx*3*p.sm;p.kz-=fz*3*p.sm;}}
// perks that act on their own (autoRockets, magnet); bouncy + bulldozer live in the jump and hitBuilding code
const _wpK=new THREE.Vector3();
function updatePerks(dt){if(state!=='play'||garage)return;
  for(const p of players){if(!p.perk||(p.perkT-=dt)>0)continue;
    if(p.perk==='autoRockets'){p.perkT=2.4;const R=p.r*22;let best=null,bd=R;
      if(boss&&boss.state!=='dead'&&boss.state!=='drop')for(const q of boss.o.parts){if(q.kind!=='weak'||q.gone||q.phase!==boss.phase)continue;
        q.mesh.getWorldPosition(_wpK);const d=Math.hypot(_wpK.x-p.x,_wpK.z-p.z);if(d<bd*3){bd=d;best={x:_wpK.x,z:_wpK.z};}}
      if(!best)for(const o of objects){if(!o.alive||o.boss||o.falling||o.sz>tier||o.sz<=tier-3)continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<bd&&d>p.r*1.5){bd=d;best=o;}}
      if(best){shoot(p,Math.atan2(best.x-p.x,best.z-p.z),'rocket');}else p.perkT=0.6;}
    else if(p.perk==='magnet'){p.perkT=0.2;const R=p.r*3.5;let n=0;
      for(const o of objects){if(n>=2)break;if(!o.alive||o.boss||o.bld||o.gold||o.falling||o.rolling||o.sz>=tier)continue;const dx=p.x-o.x,dz=p.z-o.z;
        if(dx*dx+dz*dz>R*R)continue;n++;if(o.sz<=tier-3)squish(o);else smash(o,dx,dz,12*Math.sqrt(Math.max(1,S)));
        puff(o.x,0.5*S,o.z,2,0.6*Math.max(S,.3),'#bde0fe');}
      if(n)tone('sine',rand(900,1300),rand(1400,1800),0.05,0.05);}}}
function shotEnd(s,i){if(s.rk)explode(s.x,s.z,clamp(S*0.55,0.6,2.4));else puff(s.x,s.y,s.z,3,s.r*2,s.bub?'#cdf7ff':'#dddddd');
  if(s.bub)tone('sine',900,1600,0.06,0.08);scene.remove(s.m);shots.splice(i,1);}
function updateShots(dt){
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life-=dt;
    if(!s.rk&&!s.bub)s.vy-=20*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;if(s.bub)s.y=s.y0+Math.sin(T*8+s.ph)*s.r;
    const gh=groundH(s.x,s.z)+s.r;if(s.y<gh){if(s.rk||s.bounced){shotEnd(s,i);continue;}s.y=gh;s.vy=Math.abs(s.vy)*0.5+3*Math.sqrt(S);s.bounced=true;sfx.thud();}
    if(s.rk&&Math.random()<0.6)addPart(mk('box',s.r,s.r,s.r,null,s.x,s.y,s.z,E(pick(['#ff7b00','#ffd60a']))),0.3);
    s.m.position.set(s.x,s.y,s.z);if(!s.rk)s.m.rotation.x+=dt*10;
    if(s.life<=0||Math.abs(s.x)>WB||Math.abs(s.z)>WB){shotEnd(s,i);continue;}
    let done=false;
    if(boss&&!s.bub&&boss.state!=='dead'&&boss.state!=='drop'){const o=boss.o;
      for(const q of o.parts){if(q.kind!=='weak'||q.gone||q.phase!==boss.phase)continue;q.mesh.getWorldPosition(_wpB);
        if(Math.hypot(s.x-_wpB.x,s.z-_wpB.z)<s.r+q.s0.x*BOSS_SCALE*0.5+2){const d=Math.hypot(s.vx,s.vz)||1;hitWeak(q,s.p,s.vx/d,s.vz/d);done=true;break;}}
      if(!done&&Math.hypot(s.x-o.x,s.z-o.z)<o.r*0.6&&s.y<o.h){o.wob=Math.max(o.wob||0,0.5);done=true;}}
    if(!done)for(const o of objects){if(!o.alive||o.boss)continue;const dx=o.x-s.x,dz=o.z-s.z,rr=o.r+s.r;
      if(dx*dx+dz*dz>rr*rr||s.y>o.h+o.fy+s.r)continue;
      if(s.rk){done=true;break;}
      if(s.bub){if(o.bld)damageBuilding(o,s.x,s.z,s.r*3+S,1,s.y-S,s.y+S,s.vx,s.vz,12);else if(o.sz<=tier)smash(o,s.vx,s.vz,12*Math.sqrt(S));else{o.wob=1;wakeObj(o);}done=true;break;}
      if(o.bld)damageBuilding(o,s.x,s.z,s.r*4+2*S,3,s.y-2*S,s.y+2*S,s.vx,s.vz,30);
      else if(o.sz<=tier+1)smash(o,s.vx,s.vz,30*Math.sqrt(S));else{o.wob=1;wakeObj(o);}
      if(o.bld||o.sz>=tier||++s.hits>4){done=true;break;}}
    if(!done)for(const a of animals){if(a.state==='fly')continue;if(Math.hypot(a.x-s.x,a.z-s.z)<a.r+s.r*1.5){if(a.sz<=tier)launchAnimal(a,s.vx,s.vz,s.bub?8:20);if(s.bub){done=true;break;}}}
    if(done)shotEnd(s,i);}
}

/* ---------- smash combos (shared) ---------- */
// Smashes (and animal launches) in quick succession build one shared combo: a growing "×N COMBO!" over the cars,
// each crash a little higher in pitch, a small meter bonus that grows with the combo, and a voice cheer at
// milestones. When the smashing stops the combo just fades out with a little cheer: never a penalty.
const COMBO_WINDOW=1.6,COMBO_SHOW=3,COMBO_CHEERS={10:'Ten combo!',25:'Twenty five! Unstoppable!',50:'Fifty! Smashtacular!',100:'One hundred! Combo king!'};
let combo=0,comboT=0,comboBest=0;
const comboEl=document.createElement('div');comboEl.id='combo';$('hud').appendChild(comboEl);
{const st=document.createElement('style');st.textContent=`
:where(#combo){position:absolute;transform:translate(-50%,calc(-100% - 46px));font:34px 'Lilita One',sans-serif;color:#fff;white-space:nowrap;pointer-events:none;opacity:0;
  text-shadow:0 4px 0 rgba(0,0,0,.3),0 0 18px rgba(255,214,10,.8);transition:opacity .25s}
:where(#combo.on){opacity:1}
:where(#combo.pop){animation:comboPop .25s ease-out}
@keyframes comboPop{0%{scale:1.45}100%{scale:1}}`;document.head.appendChild(st);}
function comboHit(n=1){
  combo+=n;comboT=COMBO_WINDOW;comboBest=Math.max(comboBest,combo);sfxPitch=1+Math.min(combo,25)*0.03;
  if(combo>=COMBO_SHOW)addScore(Math.min(combo,30)*0.15); // a little extra meter, more the longer it runs
  for(const m in COMBO_CHEERS)if(combo-n<+m&&combo>=+m){say(COMBO_CHEERS[m]);sfx.pop();shake=Math.min(1.5,shake+0.4);}
  if(combo>=COMBO_SHOW){comboEl.classList.remove('pop');void comboEl.offsetWidth;comboEl.classList.add('pop');}}
function updateCombo(dt){if(combo&&(comboT-=dt)<=0){if(combo>=10)sfx.pop();combo=0;sfxPitch=1;}}
function updateComboHUD(){
  if(combo<COMBO_SHOW||!players.length){comboEl.classList.remove('on');return;}
  let x=0,y=0,z=0;for(const p of players){x+=p.x;y+=p.y;z+=p.z;}const n=players.length;
  v3.set(x/n,y/n+players[0].model.h*S*1.2,z/n).project(camera); // just above the car(s); CSS lifts it a fixed bit more
  comboEl.style.left=((v3.x+1)/2*innerWidth)+'px';comboEl.style.top=((1-v3.y)/2*innerHeight)+'px';
  const hue=(combo*14)%360;comboEl.style.color=`hsl(${hue},95%,62%)`;comboEl.style.fontSize=Math.min(34+combo*1.2,80)+'px';
  comboEl.textContent=`×${combo} COMBO!`;comboEl.classList.add('on');}

/* ---------- growth (shared by both players) ---------- */
// Smashing grows both cars together. Your size tier decides what you can smash (object size class <= tier);
// bigger things wobble and boing you back; things 3+ sizes below get squished flat and don't count.
// Objects set `size` in makeObj opts ('micro'…'mega' or 0–7), else TYPE_SIZE / a guess from their size.
// Growing fills the bar; when it's full a LEVEL UP button appears (Y / Q / / / tap) and pressing it grows you.
const SIZES=['micro','mini','tiny','small','medium','large','huge','mega'];
const SIZE_STEP=1.65;                                // each size is ~1.65× the one before
const GROW_S=[0.07,0.12,0.2,0.33,0.55,0.9,1.5,2.5,4.0]; // car scale at each size; last = GIANT. 1 = the original car
const GROW_VAL=SIZES.map((_,i)=>2**i);               // growth from smashing one thing of each size
const SMASHES_PER_SIZE=35;                           // ~that many same-size smashes to grow one size (tune in L5)
const GROW_AT=[0];for(let i=0;i<SIZES.length;i++)GROW_AT.push(GROW_AT[i]+SMASHES_PER_SIZE*GROW_VAL[i]);
const TYPE_SIZE={cone:3,melon:3,fence:3,pin:3,barrel:4,crates:4,snowman:4,tree:5,tower:5,house:6};
const sizeK=o=>clamp(Math.sqrt(GROW_S[Math.min(o.sz,GROW_S.length-1)]/0.9),0.2,1.6); // debris/puff scale for an object's size
let growth=0,tier=0,S=GROW_S[0],giant=false,popT=0,worldSeed=0,levelReady=false,lastReadySay=0;
function sizeClass(o){
  if(o.size!=null){const i=typeof o.size==='number'?o.size:SIZES.indexOf(o.size);if(i>=0)return i;}
  if(o.type in TYPE_SIZE)return TYPE_SIZE[o.type];
  return clamp(Math.round(4+Math.log(Math.max(o.r,o.h/3)/1.1)/Math.log(SIZE_STEP)),0,SIZES.length-1);}
// shrink/grow any object to another size (placeholder minis until design's D0 v2 props land)
// how far the object really reaches on the ground (roofs overhang their collision radius)
const _bx=new THREE.Box3();
function footprint(o){_bx.setFromObject(o.g);return Math.max(o.r,Math.max(o.x-_bx.min.x,_bx.max.x-o.x,o.z-_bx.min.z,_bx.max.z-o.z)*1.05);}
function scaleObj(o,f){
  if(!f||f===1)return o;o.g.scale.multiplyScalar(f);o.s0=f;o.r*=f;o.h*=f;for(const p of o.parts)p.half*=f;
  o.sz=clamp(Math.round(o.sz+Math.log(f)/Math.log(SIZE_STEP)),0,SIZES.length-1);if(o.bld)initBld(o);return o;}
const MAX_GROW=GROW_AT[GROW_AT.length-1];
function grow(n){
  if(giant)return;const next=GROW_AT[tier+1];growth=Math.min(next,growth+n);
  if(growth>=next&&!levelReady){levelReady=true;lastReadySay=0;sfxClip('levelup_ready',0.8)||sfx.pop();}}
function levelUp(){
  if(!levelReady||giant)return;levelReady=false;
  if(tier>=SIZES.length-1){giant=true;goGiant();return;}
  const ct=carTierNow();tier++;sizeUp();clearPads();
  if(carTierNow()!==ct)queue.push({t:1.6,fn:openGarage});} // new car tier: off to the garage to pick one
function updateGrowth(dt){S+=((giant?GROW_S[GROW_S.length-1]:GROW_S[tier])-S)*Math.min(1,dt*3);popT=Math.max(0,popT-dt);
  lvBtn.style.display=levelReady&&state==='play'?'block':'none';
  const n=performance.now();if(levelReady&&n-lastReadySay>14000){lastReadySay=n;say('Level up ready! Press X or Y!');}}
const dispScale=()=>S*(1+0.3*popT*Math.sin(popT*22));
function showBig(txt){const el=$('big');el.textContent=txt;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function sizeUp(){
  camKick=0.4;sfx.turbo(); // the camera whooshes back a little past the new size, then settles
  showBig('LEVEL UP!');greenT=4;scatterRain(Math.round(SCAT_N*0.4));sfxClip('levelup',1)||sfx.fanfare();say('LEVEL UP!');shake=Math.min(2,shake+1.2);popT=1.2;
  for(const p of players){puff(p.x,S,p.z,12,1.2*Math.max(S,.3),'#ffd60a');flash(p.x,S,p.z,'#ffd60a',3*Math.max(S,.3),0.5);}}
// the big glowing LEVEL UP button (also Y on a controller, Q or / on the keyboard)
const lvBtn=document.createElement('button');lvBtn.id='levelUp';lvBtn.innerHTML='⬆️ LEVEL UP!<small>press X or Y</small>';
lvBtn.onclick=e=>{e.stopPropagation();levelUp();};lvBtn.addEventListener('touchstart',e=>{e.stopPropagation();},{passive:true});document.body.appendChild(lvBtn);
function goGiant(){
  showBig('GIANT!');sfx.fanfare();queue.push({t:1.3,fn:()=>sfx.fanfare()});say("You're GIANT! Smash everything!");shake=2;popT=1;confetti(220);
  queue.push({t:4,fn:()=>{if(roomZ)nwBtn.style.display='block';else summonBoss();}});} // the NEW WORLD button comes after the boss is beaten
// NEW WORLD: shrink back to tiny and roll a fresh, procedurally zoned world. Only ever by choice.
function newWorld(){
  if(!giant||nwBtn.style.display!=='block')return;
  rollWorld(false,'outside');
  music('drive');showBig('NEW WORLD!');sfx.fanfare();say('New world! Smash it!');confetti(150);players.forEach(p=>introCar(p,2.4));
}
// a fresh procedurally zoned world; keepSize (after the garage) keeps the players' size and cars
function rollWorld(keepSize,kind){ // kind: 'bedroom' | 'outside' | undefined = the same kind as now
  if(boss)bossUnmerge(boss.o);boss=null;updateBossHud();bossArrows.forEach(s=>s.visible=false);
  for(const c of chunks.values())if(c.loaded)unloadChunk(c);
  for(const c of chunks.values())for(const r of c.rampList)r.mesh.geometry.dispose();
  chunks.clear();for(const o of objects){poolRelease(o);scene.remove(o.g);}objects=[];queue.length=0;
  for(const o of collapsing)scene.remove(o.g);collapsing.length=0;
  for(const a of animals)animalHide(a);animals.length=0;
  for(const d of debris)if(!d.confetti){scene.remove(d.m);d.life=0;}
  worldSeed=(Math.random()*1e9)|0;setRoom(kind==='bedroom'?ZONES.bedroom:kind==='outside'?null:roomZ);
  if(roomZ){const n=CHUNKS_HALF*2+1;setZoneMap(Array.from({length:n},()=>roomZ.letter.repeat(n)));}
  else{setZoneMap(randomZoneMap(mulberry(worldSeed),'TFP',pickThemedZones()));buildWorld();captureHome();}
  if(!keepSize){growth=0;tier=0;giant=false;levelReady=false;popT=1;goldCount=0;goldHud.style.display='none';}
  clearPads();nwBtn.style.display='none';
  players.forEach(p=>{const st=spawnSpot(p.idx);p.x=st[0];p.z=st[1];p.y=groundH(st[0],st[1]);p.vy=0;p.speed=0;p.kx=p.kz=0;p.air=false;p.heading=Math.PI;});
  if(players.length===2&&Math.hypot(players[0].x-players[1].x,players[0].z-players[1].z)<players[0].r*2.5)besideCar(players[1],players[0]); // big cars: room for both
  {const a=spawnSpot(0);camT.set(a[0],0,a[1]);}updateStreaming(0,true);if(!keepSize)newCars(true);
}
const nwBtn=document.createElement('button');nwBtn.id='newWorld';nwBtn.innerHTML='🌍 NEW WORLD!<small>START / N / tap</small>';
nwBtn.onclick=e=>{e.stopPropagation();newWorld();};nwBtn.addEventListener('touchstart',e=>{e.stopPropagation();},{passive:true});
document.body.appendChild(nwBtn);
// size HUD: a row of cars getting bigger, lit up as you grow (a picture, not a number)
const sizeHud=document.createElement('div');sizeHud.id='sizeHud';
sizeHud.innerHTML=SIZES.map((_,i)=>`<span style="font-size:${11+i*6}px">🚙</span>`).join('')+'<span class="crown">👑</span><div id="sizeBar"><div id="sizeFill"></div></div>';
$('hud').appendChild(sizeHud);
/* Default look for the new HUD bits. :where() has zero specificity, so anything in style.css wins.
   TODO(design): style #sizeHud, #sizeBar/#sizeFill and #newWorld (.lit / .now / .crown) in style.css. */
{const st=document.createElement('style');st.textContent=`
:where(#sizeHud){position:absolute;left:18px;top:14px;display:flex;align-items:flex-end;gap:4px;padding:6px 12px 14px;border-radius:18px;background:rgba(0,0,0,.25)}
:where(#sizeHud span){opacity:.25;transition:opacity .3s,transform .3s;line-height:1}
:where(#sizeHud span.lit){opacity:1}
:where(#sizeHud span.now){transform:translateY(-4px) scale(1.15)}
:where(#sizeHud .crown){display:none;font-size:34px;opacity:1}
:where(#sizeHud.giant .crown){display:inline}
:where(#sizeBar){position:absolute;left:12px;right:12px;bottom:5px;height:6px;border-radius:3px;background:rgba(255,255,255,.3)}
:where(#sizeFill){height:100%;width:0;border-radius:3px;background:#ffd60a;transition:width .2s}
:where(#sizeHud.ready){box-shadow:0 0 18px #ffd60a;animation:nwPulse .7s ease-in-out infinite alternate}
:where(#newWorld){display:none;position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:20;font:32px 'Lilita One',sans-serif;color:#fff;
  background:#06d6a0;border:6px solid #fff;border-radius:28px;padding:14px 34px;box-shadow:0 8px 0 rgba(0,0,0,.25);cursor:pointer;animation:nwPulse 1s ease-in-out infinite}
:where(#newWorld small){display:block;font:14px Nunito,sans-serif;font-weight:900;opacity:.9}
:where(#levelUp){display:none;position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:20;font:40px 'Lilita One',sans-serif;color:#fff;
  background:linear-gradient(#ffd60a,#ff9f1c);border:6px solid #fff;border-radius:30px;padding:14px 40px;box-shadow:0 0 30px #ffd60a,0 8px 0 rgba(0,0,0,.25);cursor:pointer;
  text-shadow:0 3px 0 rgba(0,0,0,.25);animation:nwPulse .7s ease-in-out infinite}
:where(#levelUp small){display:block;font:16px Nunito,sans-serif;font-weight:900}
@keyframes nwPulse{50%{transform:translateX(-50%) scale(1.08)}}`;document.head.appendChild(st);}
let hudTier=-1;
function updateSizeHUD(){
  const t=giant?SIZES.length:tier;
  if(t!==hudTier){hudTier=t;const sp=sizeHud.querySelectorAll('span:not(.crown)');sp.forEach((e,i)=>{e.className=(i<=t?'lit':'')+(i===t?' now':'');});sizeHud.classList.toggle('giant',giant);}
  sizeHud.classList.toggle('ready',levelReady);const a=GROW_AT[tier],b=giant?MAX_GROW:(GROW_AT[tier+1]||MAX_GROW);$('sizeFill').style.width=(giant?100:Math.min(100,(growth-a)/(b-a)*100))+'%';
}

/* ---------- respawn ---------- */
function pickType(){let tot=0;SPAWN_W.forEach(w=>tot+=w[1]);let r=Math.random()*tot;for(const [t,w] of SPAWN_W){if((r-=w)<0)return t;}return 'crates';}
function spawnFalling(cx,cz,spread,type){
  type=type||pickType();
  for(let tries=0;tries<12;tries++){
    const x=cx!=null?cx+rand(-spread,spread):rand(-WB+4,WB-4),z=cz!=null?cz+rand(-spread,spread):rand(-WB+4,WB-4);
    if(!spotOK(x,z,3.6))continue;
    if(players.some(p=>Math.hypot(p.x-x,p.z-z)<(cx!=null?8:16)))continue;
    if(objects.some(o=>o.alive&&Math.hypot(o.x-x,o.z-z)<o.r+3.8))continue;
    const o=OBJ[type](x,z);o.falling=true;o.fy=rand(28,60);o.vy=0;o.g.position.y=o.fy;return o;}
  return null;
}
function updateObjects(dt){
  for(const o of objects){if(!o.wob)continue;if(o.sleep)wakeObj(o);o.wob=Math.max(0,o.wob-dt*1.6);const w=o.wob;
    o.g.rotation.x=Math.sin(T*23)*0.07*w;o.g.rotation.z=Math.cos(T*19)*0.09*w;const f=o.s0||1;o.g.scale.set(f*(1+0.05*w*Math.sin(T*31)),f*(1-0.08*w*Math.sin(T*31)),f*(1+0.05*w*Math.sin(T*31)));}
  for(const o of objects){if(!o.alive||!o.falling)continue;
    o.vy-=40*dt;o.fy+=o.vy*dt;
    if(o.fy<=0){o.fy=0;o.falling=false;if(o.scat)queue.push({t:0,fn:()=>poolAdopt(o)});const k=sizeK(o);if(o.sz>=tier-1)sfxIn(zoneXZ(o.x,o.z),'thud');puff(o.x,0.4*k,o.z,4,1.4*k);
      if(o.sz>=tier)for(const p of players)if(Math.hypot(p.x-o.x,p.z-o.z)<p.r+o.r){p.air=true;p.vy=10*p.sm;}}
    o.g.position.y=o.fy;}
  if(Math.random()<0.02){for(const o of objects)if(!o.alive)poolRelease(o);objects=objects.filter(o=>o.alive);}
}

/* ---------- world streaming (chunks) ---------- */
/* Each chunk remembers its objects as records {type,x,z,arg,r,seed,dead,back}, so leaving and coming back
   keeps what you smashed. Only chunks near the players are built. Built objects "sleep" in the shared instanced
   pools (one draw call per shape for the whole world) and wake into real meshes only when something happens to
   them (smashed, hit, wobbling, rolling), then fall asleep again once the cars are far away.
   Smashed records regrow after REGROW seconds (dropping from the sky if the chunk is loaded). */
const REGROW=[90,160];
const wakeR=()=>3+7*S; // woken things (hit, wobbling) go back to sleep once the cars are this far away (minus their radius)
const chunks=new Map();
const chunkKey=(ci,cj)=>ci+','+cj;
function getChunk(ci,cj){const k=chunkKey(ci,cj);let c=chunks.get(k);
  if(!c){c={k,ci,cj,zone:zoneAt(ci,cj),x0:ci*CHUNK-CHUNK/2,z0:cj*CHUNK-CHUNK/2,recs:[],rampList:[],herds:[],spots:[],gen:false,loaded:false,group:null,box:null};chunks.set(k,c);}
  return c;}
const chunkOf=(x,z)=>getChunk(chunkIdx(x),chunkIdx(z));
const zoneXZ=(x,z)=>zoneAt(chunkIdx(x),chunkIdx(z)); // L22: which zone a sound happens in
// tag every object with its type/arg/chunk so it can be rebuilt and streamed
/* ---------- L20: Inside the House (indoor zone) ---------- */
/* An indoor zone is a themed zone with `indoor:{half:80,wallH:44,floor,wall}`: the whole world becomes one room
   (2·half square, centered on the origin) with no roads, home arena or edge walls. Optional: room(half) → THREE.Group
   shell (floor top at y≈0, walls just outside ±half, open/low toward +Z where the camera is), start:[[x,z],[x,z]],
   breakout:['type',…] (or makeObj opts {breakout:true}): smashing one breaks out into a fresh outdoor world at the
   same size. Logic's placeholder below stands in until a design zone file registers 'bedroom' (Z3). */
const ROOM_DEFAULT={half:80,wallH:44,floor:'#d9a66b',wall:'#ffd6e0',trim:'#ffffff'};
function roomShell(z){const I=Object.assign({},ROOM_DEFAULT,z.indoor),h=I.half,H=I.wallH,W=h*2+8,g=new THREE.Group();
  const flat=m=>{m.castShadow=false;g.add(m);return m;};
  flat(mk('box',W,1,W,I.floor,0,-0.49,0));flat(mk('cyl',h*0.9,0.06,h*0.7,'#8ecae6',0,0.03,h*0.15));
  g.add(mk('box',W,H,4,I.wall,0,H/2,-h-2),mk('box',4,H,W,I.wall,-h-2,H/2,0),mk('box',4,H,W,I.wall,h+2,H/2,0),
    mk('box',W,3,4,I.trim,0,1.5,h+2)); // the wall toward the camera is only a baseboard (dollhouse view)
  flat(mk('box',W-8,2,0.6,I.trim,0,1,-h+0.3));flat(mk('box',0.6,2,W-8,I.trim,-h+0.3,1,0));flat(mk('box',0.6,2,W-8,I.trim,h-0.3,1,0));
  g.add(mk('box',30,20,1,'#bde0fe',h*0.45,H*0.55,-h+0.2),mk('box',31,1.2,1.4,I.trim,h*0.45,H*0.55,-h+0.3),mk('box',1.2,21,1.4,I.trim,h*0.45,H*0.55,-h+0.3)); // a window
  return g;}
const BEDROOM_DEFAULT={id:'bedroom',ground:'#d9a66b',weight:0,sky:{top:'#fff1e6',horizon:'#ffd6e0'},herds:[],
  indoor:{half:80},breakout:['room_door'],
  props:{room_door:(x,z)=>makeObj(x,z,5,30,50,P=>{ // TODO(design): Z3 replaces the placeholder door
    P(mk('box',16,30,1.2,'#f4a261',0,15,-5.4),4);P(mk('box',18,1.4,1.8,'#ffffff',0,30.5,-5.4),2,true);
    P(mk('box',1.2,30,1.8,'#ffffff',-8.6,15,-5.4),2,true);P(mk('box',1.2,30,1.8,'#ffffff',8.6,15,-5.4),2,true);
    P(mk('sph',1.4,1.4,1.4,'#ffd60a',5.6,14,-4.4),1,true);P(mk('box',10,8,0.4,'#e76f51',0,22,-4.7),2);P(mk('box',10,8,0.4,'#e76f51',0,8,-4.7),2);},
    {size:'large',breakout:true})},
  layout(ctx){const h=WB;ctx.place('room_door',0,-(h-7.5),0,5);
    for(let i=0;i<8;i++)ctx.place(pick(['crates','tower','pin','melon','barrel','snowman']),rand(ctx.x0+4,ctx.x1-4),rand(ctx.z0+4,ctx.z1-4));}};
if(!ZONES.bedroom)registerZone(BEDROOM_DEFAULT);
let roomZ=null,roomG=null,breakT=0,breakFly=0,doorT=0,doorSaid=false,doorArrow=null;
const isBreakout=o=>!!(roomZ&&(o.breakout||(roomZ.breakout||[]).includes(o.type)));
function setRoom(z){
  if(roomG){scene.remove(roomG);roomG=null;}
  roomZ=z||null;WB=roomZ?((roomZ.indoor&&roomZ.indoor.half)||ROOM_DEFAULT.half):ARENA;doorSaid=false;
  setOutdoor(!roomZ);if(typeof streetDecor!=='undefined'&&streetDecor)streetDecor.visible=!roomZ;
  if(roomZ){roomG=(typeof roomZ.room==='function'&&roomZ.room(WB))||roomShell(roomZ);scene.add(roomG);}}
// smashing the door (or window): a big crash, the camera pulls way back, then a fresh outdoor world at the same size
function breakOut(o){if(breakT>0)return;breakT=2;
  showBig('BREAK OUT!');sfx.rumble();sfx.crash(true);sfx.boom();shake=2;popT=1;confetti(220);say('Break out!');
  flash(o.x,o.h*0.5,o.z,'#ffffff',o.r*4,0.5);puff(o.x,o.h*0.3,o.z,16,o.r*1.5,'#ffffff');}
function updateRoom(dt){
  if(breakT>0){breakT-=dt;breakFly=Math.min(1,breakFly+dt*0.6);if(doorArrow)doorArrow.visible=false;
    if(breakT<=0){breakFly=0;rollWorld(true,'outside');camDist*=4; // the camera swoops back down over town
      music('drive');showBig("WE'RE OUTSIDE!");sfx.fanfare();say("We're outside!");confetti(150);players.forEach(p=>introCar(p,1.6));}
    return;}
  if(!roomZ){if(doorArrow)doorArrow.visible=false;return;}
  if((doorT-=dt)<=0){doorT=0.5;const d=objects.find(o=>o.alive&&!o.falling&&isBreakout(o)),ok=d&&d.sz<=tier;
    if(!doorArrow){doorArrow=new THREE.Mesh(MARK_ARROW_GEO,new THREE.MeshBasicMaterial({color:'#ffd60a',transparent:true,opacity:0.95,depthTest:false}));doorArrow.renderOrder=10;scene.add(doorArrow);}
    doorArrow.visible=!!ok;doorArrow.userData.o=ok?d:null;
    if(ok&&!doorSaid&&state==='play'){doorSaid=true;showBig('BREAK OUT!');say('Smash the door!');}}
  const d=doorArrow&&doorArrow.userData.o;
  if(d){const k=Math.max(d.h*0.25,4*S);doorArrow.scale.set(k,k*1.5,k);doorArrow.position.set(d.x,d.h*(d.s0||1)+k*(0.6+0.3*Math.sin(T*5)),d.z+2);}}
for(const t in OBJ){const f=OBJ[t];OBJ[t]=(x,z,arg,sc)=>{const o=f(x,z,arg);o.type=t;o.arg=arg;o.chunk=chunkOf(x,z).k;o.sz=sizeClass(o);initBld(o);scaleObj(o,sc);o.fr=footprint(o);setupSpin(o);return o;};}
// deterministic randomness, so a chunk (and each house in it) looks the same every time it's rebuilt
function mulberry(a){return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function withSeed(seed,fn){const r=Math.random;Math.random=mulberry(seed);try{return fn();}finally{Math.random=r;}}

/* Zone layout contract (design fills this in objects.js as `const ZONE_LAYOUT={town(ctx){…},farm(ctx){…},park(ctx){…}}`):
   ctx = {zone, ci, cj, x0, z0, x1, z1, cx, cz, size,
          place(type,x,z,arg,r) → true if placed (stays inside the chunk, off roads, off ramps, no overlaps),
          ramp(x,z,th,L,W,H)    → true if placed,
          free(x,z,r)           → would a spot of radius r fit?,
          spot(kind,x,z,w,d,th) → marks a w×d area (turned th radians) where the size-matched filler of that kind goes (L19)}
   Math.random (and rand/pick) is seeded while a layout runs, so layouts can use them freely. */
const REC_R={house:3.6,crates:1.5,tower:1.4,pin:1.1,snowman:1.3,fence:1.8,barrel:1.0,cone:0.7,melon:1.1,tree:1.1};
function spotFree(c,x,z,r){
  if(x-r<c.x0||x+r>c.x0+CHUNK||z-r<c.z0||z+r>c.z0+CHUNK)return false;
  if(Math.abs(x)>WB-r-2||Math.abs(z)>WB-r-2)return false;
  if(!roomZ&&Math.abs(x)<HOME+r&&Math.abs(z)<HOME+r)return false; // hand-built home arena
  if(onRoad(x,z,r))return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(rampsH(c.rampList,x+a,z+b)>0)return false;
  for(const q of c.recs)if(Math.hypot(q.x-x,q.z-z)<q.r+r+0.6)return false;
  return true;}
function chunkPlace(c,type,x,z,arg,r){
  if(!OBJ[type])return false;r=r||REC_R[type]||(typeof RAD!=='undefined'&&RAD[type])||1.5;
  if(!spotFree(c,x,z,r))return false;
  c.recs.push({type,x,z,arg,r,seed:(Math.random()*1e9)|0,dead:false,back:0});return true;}
/* L19 spots: a layout marks yards, sidewalks, fields, sand, parking, porches… with ctx.spot(kind,x,z,w,d,th).
   The size-matched filler then mostly lands inside spots near the cars (SPOT_LEFTOVER of it still goes anywhere),
   using that kind's props: registerZone({spots:{yard:{tiny:[…]}}}) → SPOT_PROPS.yard.tiny (objects.js) → the
   zone's normal size list. Spots are clipped to the chunk; they don't block place(). */
function chunkSpot(c,kind,x,z,w,d,th=0){
  if(!kind||!(w>0)||!(d>0))return false;const cs=Math.cos(th),sn=Math.sin(th),hx=w/2,hz=d/2;
  const ex=Math.abs(cs)*hx+Math.abs(sn)*hz,ez=Math.abs(sn)*hx+Math.abs(cs)*hz; // world-space half extents
  if(x+ex<c.x0||x-ex>c.x0+CHUNK||z+ez<c.z0||z-ez>c.z0+CHUNK)return false;
  c.spots.push({kind,x,z,hx,hz,cs,sn,ex,ez,area:w*d});return true;}
function chunkRamp(c,x,z,th,L=11,W=7,H=3.6){
  const m=W+2,sx=Math.sin(th),sz=Math.cos(th);
  for(let k=0;k<=2;k++){const px=x+sx*L*k/2,pz=z+sz*L*k/2;
    if(px<c.x0+m||px>c.x0+CHUNK-m||pz<c.z0+m||pz>c.z0+CHUNK-m||onRoad(px,pz,W/2)||(!roomZ&&Math.abs(px)<HOME+m&&Math.abs(pz)<HOME+m))return false;}
  const r=makeRamp(x,z,th,L,W,H);
  for(const q of [...c.recs,...c.rampList.map(o=>({x:o.x,z:o.z,r:o.L}))])
    for(const [a,b] of [[0,0],[q.r+1,0],[-q.r-1,0],[0,q.r+1],[0,-q.r-1]])if(rampsH([r],q.x+a,q.z+b)>0)return false;
  c.rampList.push(r);return true;}
function genChunk(c){
  c.gen=true;
  withSeed((c.ci+50)*7919+(c.cj+50)*104729+worldSeed,()=>{
    const ctx={zone:c.zone,ci:c.ci,cj:c.cj,x0:c.x0,z0:c.z0,x1:c.x0+CHUNK,z1:c.z0+CHUNK,cx:c.ci*CHUNK,cz:c.cj*CHUNK,size:CHUNK,
      place:(type,x,z,arg,r)=>chunkPlace(c,type,x,z,arg,r),ramp:(x,z,th,L,W,H)=>chunkRamp(c,x,z,th,L,W,H),free:(x,z,r)=>spotFree(c,x,z,r),spot:(kind,x,z,w,d,th)=>chunkSpot(c,kind,x,z,w,d,th),herd:(kind,x,z,n)=>chunkHerd(c,kind,x,z,n)};
    // TODO(design): ZONE_LAYOUT.town/farm/park/home in objects.js replaces these placeholder fillers (D1)
    const lay=(ZONES[c.zone]&&ZONES[c.zone].layout)||(typeof ZONE_LAYOUT!=='undefined'&&ZONE_LAYOUT[c.zone])||DEFAULT_LAYOUT[c.zone]||DEFAULT_LAYOUT.park;
    lay(ctx);
    if(Math.random()<0.3&&c.recs.length){const r=pick(c.recs);r.gold=true;}
    if(!c.herds.length)defaultHerds(c);
    if(!roomZ&&c.ci===0&&c.cj===0){chunkHerd(c,'chicken',16,36,5);chunkHerd(c,'duck',-16,34,4);} // say hi at the start line
  });
}
// placeholder zone fillers using today's OBJ types, so the big world isn't empty before D1
function scatter(ctx,n,types,pad=4){for(let i=0;i<n;i++)ctx.place(pick(types),rand(ctx.x0+pad,ctx.x1-pad),rand(ctx.z0+pad,ctx.z1-pad));}
function maybeRamp(ctx,ch){if(Math.random()<ch)for(let t=0;t<8;t++)if(ctx.ramp(rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),(Math.random()*4|0)*Math.PI/2))break;}
const DEFAULT_LAYOUT={
  town(ctx){maybeRamp(ctx,.4);
    for(let x=ctx.x0+10;x<ctx.x1-6;x+=14)for(let z=ctx.z0+10;z<ctx.z1-6;z+=14){
      if(Math.random()<.6)ctx.place('house',x+rand(-1,1),z+rand(-1,1));else ctx.place(pick(['crates','tower','barrel','tree']),x+rand(-3,3),z+rand(-3,3));}
    scatter(ctx,14,['cone','crates','barrel']);},
  farm(ctx){maybeRamp(ctx,.5);const fx=ctx.x0+rand(8,40),fz=ctx.z0+rand(8,40);
    for(let i=0;i<6;i++)for(let j=0;j<6;j++)ctx.place('melon',fx+i*3.4,fz+j*3.4);
    for(let x=ctx.x0+6;x<ctx.x1-6;x+=4.2)ctx.place('fence',x,ctx.z0+rand(6,10));
    scatter(ctx,14,['crates','tree','barrel','snowman','crates']);},
  park(ctx){maybeRamp(ctx,.6);const px=ctx.cx+rand(-20,20),pz=ctx.cz+rand(-20,20);
    for(let row=0;row<4;row++)for(let k=0;k<=row;k++)ctx.place('pin',px+(k-row/2)*3.4,pz-row*3.2);
    scatter(ctx,22,['tree','tree','snowman','tower','cone','melon','barrel']);}
};
DEFAULT_LAYOUT.home=DEFAULT_LAYOUT.park;
// the hand-built home arena (buildWorld) becomes records in its chunks
function captureHome(){
  for(const o of objects){chunkOf(o.x,o.z).recs.push({type:o.type,x:o.x,z:o.z,arg:o.arg,r:o.r,seed:(Math.random()*1e9)|0,dead:false,back:0});scene.remove(o.g);}
  objects=[];
  for(const r of ramps.slice()){removeRamp(r);chunkOf(r.x,r.z).rampList.push(r);}
}
function buildRec(rec){const o=withSeed(rec.seed,()=>OBJ[rec.type](rec.x,rec.z,rec.arg,rec.f));o.rec=rec;
  if(o.bld&&rec.gone)for(const i of rec.gone){const p=o.parts[i];if(p&&!p.gone){p.gone=true;p.mesh.parent.remove(p.mesh);o.paid+=1/o.parts.length;}}
  return o;}

const HIDE=new THREE.Matrix4().makeTranslation(0,-9999,0),instMats={};
const instMat=m=>instMats[m.id]||(instMats[m.id]=m.clone()); // own material so plain + instanced meshes don't swap shader programs
// Plain M() colors batch by shape alone: one InstancedMesh per shape with the color per instance (instead of one
// per shape+color), which cuts sleeping-object draw calls several times over.
const PLAIN_INST=litMat({color:'#ffffff'});
// vertex-colored materials that differ only by color (design's kit buildings: userData.plainVC) batch the same way
const VC_INST=litMat({color:'#ffffff',vertexColors:true});
const batchKey=m=>m.material.userData.plain?'g'+m.geometry.id:m.material.userData.plainVC?'vc'+m.geometry.id:m.geometry.id+'_'+m.material.id;
const batchMat=m=>m.material.userData.plain?PLAIN_INST:m.material.userData.plainVC?VC_INST:instMat(m.material);
const colorBatched=m=>!!(m.material.userData.plain||m.material.userData.plainVC);
/* What a sleeping object looks like in a batch: its meshes, or, for an undamaged building with a design-made sleep
   proxy (o.proxy: a couple of meshes in the object's local space, see kitProxy in objects.js), just the proxy, so a
   building costs ~2 batches per model however finely it's sliced. Returns [[mesh, worldMatrix], …]. */
function sleepLook(o){o.g.updateMatrixWorld(true);const out=[];
  if(o.proxy&&o.proxy.length&&!o.parts.some(p=>p.gone)){o.proxied=true;for(const pm of o.proxy){pm.updateMatrix();out.push([pm,o.g.matrixWorld.clone().multiply(pm.matrix)]);}return out;}
  o.proxied=false;o.g.traverse(m=>{if(m.isMesh)out.push([m,m.matrixWorld.clone()]);});return out;}
/* Shared pools for objects that come and go (size-matched scatter): same shape batching, but long-lived and with
   free slots, so a sleeping scatter prop costs nothing extra to draw. */
const pools=new Map();
// Slots stay packed (a freed slot takes the last one in), and im.count only draws the slots in use.
function poolIM(geo,mat,plain,cap){const im=new THREE.InstancedMesh(geo,mat,cap);if(plain)im.setColorAt(0,new THREE.Color('#ffffff'));im.count=0;
  im.castShadow=im.receiveShadow=true;im.frustumCulled=false;scene.add(im);return im;}
function poolFor(m){const k=batchKey(m);let p=pools.get(k);
  if(!p){const plain=colorBatched(m),cap=plain?512:64;p={im:poolIM(m.geometry,batchMat(m),plain,cap),plain,cap,owner:[]};pools.set(k,p);}
  if(p.im.count>=p.cap&&p.cap<16384)poolGrow(p);
  return p;}
function poolGrow(p){ // full: swap in one twice the size (copies every slot; owners point at the new mesh)
  const old=p.im,im=poolIM(old.geometry,old.material,p.plain,p.cap*=2);im.count=old.count;
  im.instanceMatrix.array.set(old.instanceMatrix.array);if(p.plain)im.instanceColor.array.set(old.instanceColor.array);
  im.instanceMatrix.needsUpdate=true;if(p.plain)im.instanceColor.needsUpdate=true;
  for(let i=0;i<old.count;i++)if(p.owner[i])p.owner[i][0]=im;
  scene.remove(old);old.dispose();p.im=im;}
const _pm=new THREE.Matrix4(),_pc=new THREE.Color();
function poolAdopt(o){ // move an awake object into the pools and let it sleep (it wakes again when a car gets close)
  if(o.inst||!o.alive||o.spin||o.rolling||o.gold)return;const ent=[];let ok=true;
  for(const [m,mat] of sleepLook(o)){if(!ok)break;if(Array.isArray(m.material)){ok=false;break;}const p=poolFor(m);if(p.im.count>=p.cap){ok=false;break;}
    const i=p.im.count++;const e=[p.im,i,mat,m,p];p.owner[i]=e;p.im.setMatrixAt(i,HIDE);
    if(p.plain){p.im.setColorAt(i,m.material.color);p.im.instanceColor.needsUpdate=true;}ent.push(e);}
  o.inst=ent;o.pooled=true;
  if(!ok){poolRelease(o);return;}
  o.sleep=false;sleepObj(o);}
function poolRelease(o){if(!o.pooled)return;o.pooled=false;
  for(const e of o.inst){const im=e[0],p=e[4],i=e[1],last=--im.count;
    if(i!==last){im.getMatrixAt(last,_pm);im.setMatrixAt(i,_pm);if(p.plain){im.getColorAt(last,_pc);im.setColorAt(i,_pc);im.instanceColor.needsUpdate=true;}
      const moved=p.owner[last];moved[1]=i;p.owner[i]=moved;}
    p.owner[last]=undefined;im.instanceMatrix.needsUpdate=true;}
  o.inst=null;o.sleep=false;} // not drawn by a pool any more: a later wakeObj must not touch it (or re-add a removed prop)
function loadChunk(c){
  if(!c.gen)genChunk(c);
  c.loaded=true;c.group=new THREE.Group();scene.add(c.group);
  c.box=new THREE.Box3(new THREE.Vector3(c.x0-12,-1,c.z0-12),new THREE.Vector3(c.x0+CHUNK+12,40,c.z0+CHUNK+12));
  for(const r of c.rampList){c.group.add(r.mesh);ramps.push(r);}
  /* L25: sleepers go into the shared pools (one InstancedMesh per shape for the whole world, like the scatter props)
     instead of a batch per shape per chunk: at GIANT size ~70 chunks are loaded, which was ~850 batches (most holding
     1–3 copies) and the same again in the shadow pass. Drawing every loaded chunk's sleepers costs a few hundred
     thousand extra triangles, which is far cheaper than the draw calls. */
  for(const rec of c.recs){
    if(rec.dead){if(T<rec.back)continue;rec.dead=false;}
    const o=buildRec(rec);scene.remove(o.g);
    if(rec.gold&&!o.bld)goldify(o,60);
    if(!o.spin&&!o.gold)poolAdopt(o);
    if(!o.pooled){o.inst=null;o.sleep=false;scene.add(o.g);}} // spinning, gold or multi-material: stays a real mesh
}
function unloadChunk(c){
  c.loaded=false;for(const h of c.herds)if(h.on)herdOff(h);
  for(const r of c.rampList)removeRamp(r);
  objects=objects.filter(o=>{if(o.chunk!==c.k)return true;poolRelease(o);scene.remove(o.g);return false;}); // alive records stay alive
  c.group.traverse(m=>{if(m.isInstancedMesh)m.dispose();});scene.remove(c.group);c.group=null;
}
function wakeObj(o){if(!o.sleep)return;o.sleep=false;for(const [im,i] of o.inst){im.setMatrixAt(i,HIDE);im.instanceMatrix.needsUpdate=true;}scene.add(o.g);}
function sleepObj(o){if(o.proxied&&o.parts.some(p=>p.gone)){if(o.pooled)poolRelease(o);else o.inst=null;return;} // damaged: stays awake as real parts
  o.sleep=true;for(const [im,i,m,mesh] of o.inst){im.setMatrixAt(i,mesh.userData.dead?HIDE:m);im.instanceMatrix.needsUpdate=true;}scene.remove(o.g);}
function streamR(){return (IS_PHONE?0.7:1)*(110+camDist*1.1);} // camDist already grows with car size
function rectDist(c,x,z){return Math.hypot(Math.max(c.x0-x,0,x-c.x0-CHUNK),Math.max(c.z0-z,0,z-c.z0-CHUNK));}
let regrowT=0;
function updateStreaming(dt,all){
  const R=streamR(),wr=wakeR(),pts=players.length?players.map(p=>[p.x,p.z]):[[camT.x,camT.z]];
  let best;
  do{best=null;let bd=1e9; // load the nearest missing chunk (one per frame, no hitches); drop far ones
    for(let cj=-CHUNKS_HALF;cj<=CHUNKS_HALF;cj++)for(let ci=-CHUNKS_HALF;ci<=CHUNKS_HALF;ci++){const c=getChunk(ci,cj);
      let d=1e9;for(const [x,z] of pts)d=Math.min(d,rectDist(c,x,z));
      if(!c.loaded&&d<R&&d<bd){bd=d;best=c;}else if(c.loaded&&d>R+40)unloadChunk(c);}
    if(best)loadChunk(best);
  }while(all&&best);
  // wake objects near a car, put far ones back to sleep
  for(const o of objects){if(!o.inst||!o.alive)continue;let d=1e9;
    for(const p of players)d=Math.min(d,Math.hypot(o.x-p.x,o.z-p.z)-o.r);
    if(!o.sleep&&d>wr+2+4*S&&!o.falling&&!o.wob&&!o.rolling)sleepObj(o);}
  // L25: nothing wakes just for being near a car; it stays in its batch until something happens to it (smash, hit,
  // wobble, roll: those call wakeObj), so an untouched house or tree costs no draw calls of its own at any size.
  // regrow smashed things in loaded chunks: they drop back in from the sky
  if((regrowT-=dt)>0)return;regrowT=1;let n=0;
  for(const c of chunks.values()){if(!c.loaded)continue;
    for(const rec of c.recs){if(!rec.dead||T<rec.back)continue;
      if(players.some(p=>Math.hypot(p.x-rec.x,p.z-rec.z)<14))continue;
      if(objects.some(o=>o.alive&&Math.hypot(o.x-rec.x,o.z-rec.z)<o.r+rec.r))continue;
      rec.dead=false;const o=buildRec(rec);o.falling=true;o.fy=rand(28,50);o.vy=0;o.g.position.y=o.fy;
      if(++n>=3)return;}}
}
const frustum=new THREE.Frustum(),projM=new THREE.Matrix4();
function cullChunks(){
  camera.updateMatrixWorld();projM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projM);
  for(const c of chunks.values())if(c.loaded)c.group.visible=frustum.intersectsBox(c.box);
}

/* ---------- celebration ---------- */
let camT=new THREE.Vector3(0,0,30),camDist=40,camKick=0;
/* L21: the camera distance follows the car's size so each car stays about the same size on screen at every size;
   the world (giant flowers, curbs, mailboxes) is what makes you feel small. Two players far apart: zoom out up to
   CAM_ZOOM × the base, then the trailing car gets pulled along instead of both cars shrinking to specks. */
const CAM_K=38,CAM_ZOOM=2.1;
const camBase=s=>CAM_K*(s<=1?s:Math.pow(s,0.8)); // linear while small; a bit less above size 1 so GIANT still feels huge
function spreadOf(pts){let m=0;for(const a of pts)for(const b of pts)m=Math.max(m,Math.abs(a[0]-b[0])/Math.max(1,camera.aspect)*1.25,Math.abs(a[1]-b[1])*1.35);return m;}
function mega(){
  const txt=pick(['MEGA SMASH!','SUPER SMASH!','KABOOM!','AWESOME!','SMASHTASTIC!']);
  showBig(txt);sfx.fanfare();say(txt);confetti(170);
  scatterRain(22);
}
function confetti(n){
  const cols=['#ff006e','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#fb5607','#ffffff'],w=Math.max(0.06,camDist/40); // sized to the view, not the world
  for(let i=0;i<n;i++){const c=debrisBox(M(pick(cols)).color);c.scale.set(.6,.06,.4);
    c.scale.multiplyScalar(w);c.position.set(camT.x+rand(-35,35)*w,rand(18,40)*w,camT.z+rand(-30,20)*w);addDebris(c,.05*w,rand(-3,3)*w,rand(-2,2)*w,rand(-3,3)*w,{confetti:true,g:6*w,life:rand(5,8)});}
}

/* ---------- players ---------- */
const players=[];
const PCOL=['#ff9f1c','#2ec4f6'];
/* L25: a block-built car is ~30–40 meshes; merge everything that doesn't move on its own (not the wheels) into one
   mesh per material, so a car is ~10 draw calls instead of ~37 (each pass). Shapes that can't merge stay as they are. */
function carMerge(model){
  if(!THREE.mergeGeometries||!model||!model.g)return model;const g=model.g;g.updateMatrixWorld(true);
  const keep=new Set();for(const w of model.wheels||[])w.traverse(x=>keep.add(x));
  const inv=new THREE.Matrix4().copy(g.matrixWorld).invert(),groups=new Map();
  g.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh||m.isInstancedMesh||keep.has(m)||m.children.length||Array.isArray(m.material)||m.morphTargetInfluences)return;
    for(let x=m;x&&x!==g;x=x.parent)if(keep.has(x)||Object.keys(x.userData).length)return; // spinning / tagged parts stay live
    const geo=m.geometry,sig=m.material.uuid+'|'+(geo.index?'i':'n')+'|'+Object.keys(geo.attributes).sort().join(',');
    (groups.get(sig)||groups.set(sig,[]).get(sig)).push(m);});
  for(const list of groups.values()){if(list.length<2)continue;
    const geos=list.map(m=>m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld)));
    let merged=null;try{merged=THREE.mergeGeometries(geos);}catch(e){}
    if(!merged)continue;const mm=new THREE.Mesh(merged,list[0].material);mm.castShadow=list.some(m=>m.castShadow);mm.receiveShadow=true;
    for(const m of list)m.parent.remove(m);g.add(mm);(model.merged||(model.merged=[])).push(merged);}
  return model;}
function carUnmerge(model){if(model&&model.merged)for(const geo of model.merged)geo.dispose();}
class Player{
  constructor(idx,src){
    this.idx=idx;this.src=src;this.color=PCOL[idx];
    this.root=new THREE.Group();this.root.rotation.order='YXZ';scene.add(this.root);
    this.ring=new THREE.Mesh(new THREE.RingGeometry(2.5,3.1,40),new THREE.MeshBasicMaterial({color:this.color,transparent:true,opacity:.9,depthWrite:false}));
    this.ring.rotation.x=-Math.PI/2;scene.add(this.ring);
    // "where's my car?": a bobbing arrow in the player's color (seen through buildings) and a spotlight beam on spawn
    const am=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,depthTest:false,fog:false});
    this.arrowO=new THREE.Mesh(MARK_ARROW_GEO,am('#ffffff',1));this.arrowO.renderOrder=20;scene.add(this.arrowO);
    this.arrow=new THREE.Mesh(MARK_ARROW_GEO,am(this.color,1));this.arrow.renderOrder=21;scene.add(this.arrow);
    this.beam=new THREE.Mesh(MARK_BEAM_GEO,new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));this.beam.visible=false;scene.add(this.beam);
    this.markT=4;this.idleT=0;this.markTop=0;
    const s=spawnSpot(idx);this.x=s[0];this.z=s[1];this.y=groundH(s[0],s[1]);this.vy=0;this.heading=Math.PI;this.speed=0;this.kx=0;this.kz=0;
    this.air=false;this.pitch=0;this.wasBoost=false;this.flameT=0;this.nameT=0;this.wallT=0;
    this.tag=document.createElement('div');this.tag.className='tag';this.tag.style.background=this.color;$('tags').appendChild(this.tag);
    const l=carsInTier(carTierNow());this.setCar(l[idx%l.length],true);this.trail=[];this.trailT=0;this.lastBump=-9;this.stuck=false;
  }
  get r(){return this.stats.r*S;}
  get sm(){return clamp(S<1?Math.pow(S,0.95):Math.pow(S,0.6),0.07,2.3);} // speed scale: slow when small, same as before from size 1 up
  setCar(i,announce){
    if(this.model){this.root.remove(this.model.g);carUnmerge(this.model);}
    this.carIdx=i;this.stats=CARS[i];const cs=carStats(this.stats);this.power=cs.power;this.handling=cs.handling;this.perk=cs.perk;this.perkT=1;this.model=carMerge(this.stats.build());this.root.add(this.model.g);
    this.nameT=2.5;
    if(announce){sfx.pop();say(this.stats.name+'!');puff(this.x,S,this.z,6,1.6*Math.max(S,.3),'#ffffff');}
    updatePanels();
  }
  ensureEngine(){
    if(this.eng||!AC)return;
    try{const o=AC.createOscillator();o.type='sawtooth';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;const g=AC.createGain();g.gain.value=0;
      o.connect(f);f.connect(g);g.connect(master);o.start();this.eng={o,g};}catch(e){}
  }
  update(dt,inp){
    const st=this.stats,sm=this.sm,ds=dispScale();let ix=inp.x||0,iz=inp.z||0;const mag=Math.min(1,Math.hypot(ix,iz));
    let target=0;
    if(mag>0.2){const want=Math.atan2(ix,iz);const d=angDiff(want,this.heading);const tr=(this.air?1.6:4.3)*(0.7+0.1*this.handling)*dt;
      this.heading+=clamp(d,-tr,tr);target=st.speed*sm*mag*Math.max(0.25,(1+Math.cos(d))/2);
      if(inp.boost)target=st.speed*sm*1.65*Math.max(0.3,(1+Math.cos(d))/2);}
    else if(inp.boost)target=st.speed*sm*1.65;
    const boosting=inp.boost&&this.speed>5;
    if(inp.boost&&!this.wasBoost)sfx.turbo();this.wasBoost=inp.boost;
    if(!this.air){const a=(target>this.speed?30:18)*sm*(0.85+0.05*this.handling);this.speed+=clamp(target-this.speed,-a*dt,a*dt);}
    const fx=Math.sin(this.heading),fz=Math.cos(this.heading);
    this.x+=(fx*this.speed+this.kx)*dt;this.z+=(fz*this.speed+this.kz)*dt;
    const kd=Math.pow(0.05,dt);this.kx*=kd;this.kz*=kd;
    const lim=garage?1e9:WB-2.5*S;this.wallT-=dt; // the garage sits outside the arena and has its own wall
    if(Math.abs(this.x)>lim||Math.abs(this.z)>lim){
      if(Math.abs(this.x)>lim){this.x=Math.sign(this.x)*lim;this.kx=-Math.sign(this.x)*6;}
      if(Math.abs(this.z)>lim){this.z=Math.sign(this.z)*lim;this.kz=-Math.sign(this.z)*6;}
      if(this.speed>10&&this.wallT<=0){sfx.thud();shake=Math.min(1,shake+.3);this.wallT=.4;}this.speed*=0.6;}
    const gh=groundH(this.x,this.z);
    if(!this.air){
      if(gh<this.y-0.4){this.air=true;this.vy=Math.max(5,this.speed*0.5+3);}
      else this.y=gh;
      if(inp.jumpP&&!this.air&&this.stuck){boomOut(this);}
      else if(inp.jumpP&&!this.air){this.air=true;this.vy=13*clamp(Math.pow(S,0.4),0.33,1.8);sfx.jump();
        if(this.perk==='bouncy'){this.vy*=1.42;sfx.boing();puff(this.x,0.3*S,this.z,5,Math.max(S,.3),'#ffffff');}}
    }else{
      this.vy-=(this.padG||32)*dt;this.y+=this.vy*dt;
      if(this.y<=gh){const imp=-this.vy;this.y=gh;this.air=false;this.vy=0;
        if(this.padG){this.padG=0;slam(this,true);}
        else if(imp>15)slam(this);else if(imp>6){sfxIn(zoneXZ(this.x,this.z),'thud');puff(this.x,0.3,this.z,3,1.2*Math.max(S,.3));}}
    }
    let pitch;
    if(!this.air){pitch=Math.atan2(groundH(this.x+fx*1.6,this.z+fz*1.6)-groundH(this.x-fx*1.6,this.z-fz*1.6),3.2);}
    else pitch=clamp(this.vy*0.03,-0.45,0.45);
    this.pitch+=(pitch-this.pitch)*Math.min(1,dt*10);
    this.root.position.set(this.x,this.y,this.z);this.root.rotation.set(-this.pitch,this.heading,0);this.root.scale.setScalar(ds);
    this.model.g.position.y=Math.abs(Math.sin(performance.now()*0.02))*0.05*Math.min(1,Math.abs(this.speed)/20);
    for(const w of this.model.wheels)w.rotation.x+=this.speed*dt/w.userData.r;
    this.ring.position.set(this.x,groundH(this.x,this.z)+0.08,this.z);this.ring.scale.setScalar(st.r/2.6*ds);
    this.ring.material.opacity=this.air?0.4:0.9;
    this.updateMarker(dt,ds);
    if(boosting){this.flameT-=dt;if(this.flameT<=0){this.flameT=0.025;
      const p=this.model.g.localToWorld(this.model.ex.clone());
      const fs=.7*S,m=mk('box',fs,fs,fs,null,p.x+rand(-.3,.3),p.y+rand(-.2,.2),p.z+rand(-.3,.3),E(pick(['#ff7b00','#ffd60a','#ff006e'])));m.castShadow=false;
      addPart(m,rand(.2,.4),-fx*6+rand(-1,1),rand(0,2),-fz*6+rand(-1,1));}}
    this.nameT-=dt;
    // stuck? trying to drive, bumping into things, but not getting anywhere for ~1.5s → jump becomes BOOM
    if((this.trailT-=dt)<=0){this.trailT=0.25;this.trail.push([this.x,this.z]);if(this.trail.length>6)this.trail.shift();}
    const trying=mag>0.3||inp.boost,t0=this.trail[0],moved=t0?Math.hypot(this.x-t0[0],this.z-t0[1]):99;
    if(!this.stuck){if(trying&&this.trail.length>=6&&moved<this.r*1.5+0.2&&T-this.lastBump<1){this.stuck=[this.x,this.z]; // sticky until BOOM or driven clear
        const n=performance.now();if(n-lastStuckSay>10000){lastStuckSay=n;say('Stuck? Press jump to go BOOM!');}}}
    else if(Math.hypot(this.x-this.stuck[0],this.z-this.stuck[1])>this.r*4+0.5||T-this.lastBump>2.5)this.stuck=false;
    this.ensureEngine();
    if(this.eng){const t=AC.currentTime;this.eng.o.frequency.setTargetAtTime((42+Math.abs(this.speed)/sm*3.2+(boosting?25:0))/Math.sqrt(Math.max(S,0.3)),t,0.06);this.eng.g.gain.setTargetAtTime(0.025+Math.min(1,Math.abs(this.speed)/30)*0.03,t,0.1);}
  }
}
Player.prototype.updateMarker=function(dt,ds){
  // strong right after spawn / teleport / new car, a little when parked a while, subtle while driving
  this.markT=Math.max(0,this.markT-dt);this.idleT=Math.abs(this.speed)<0.5*this.sm?this.idleT+dt:0;
  const e=Math.max(clamp(this.markT/1.5,0,1),clamp((this.idleT-3)/2,0,0.5)),pulse=0.5+0.5*Math.sin(T*9);
  this.ring.scale.multiplyScalar(1+0.7*e*pulse);
  const h=camDist*0.045*(1+0.7*e),roof=this.y+this.model.h*ds,y=roof+h*(0.35+0.25*Math.sin(T*5)),o=0.3+0.7*e;
  this.arrow.position.set(this.x,y,this.z);this.arrow.scale.set(h*0.6,h,h*0.6);this.arrow.material.opacity=o;this.arrow.rotation.y=T*2;
  this.arrowO.position.set(this.x,y-h*0.12,this.z);this.arrowO.scale.set(h*0.8,h*1.25,h*0.8);this.arrowO.material.opacity=o*0.9;this.arrowO.rotation.y=T*2;
  this.markTop=y+h*1.15;
  const b=clamp((this.markT-1.5)/1,0,1);this.beam.visible=b>0;
  if(b>0){const r=this.stats.r*ds*1.8;this.beam.position.set(this.x,this.y,this.z);this.beam.scale.set(r,camDist*0.9,r);this.beam.material.opacity=0.3*b*(0.85+0.15*pulse);}};
const MARK_ARROW_GEO=new THREE.ConeGeometry(0.5,1,12).rotateX(Math.PI).translate(0,0.5,0); // tip down at y=0
const MARK_BEAM_GEO=new THREE.CylinderGeometry(0.3,1,1,24,1,true).translate(0,0.5,0);
/* Start on a street (L21): both cars in the right lane of the north–south road by the home arena, facing up the screen.
   Design can move it: define `const START_STREET=[[x,z],[x,z]]` in objects.js (and dress the spot: curb, mailbox, clutter). */
const SPAWN_DEFAULT=[[2.6,48],[3.8,48.6]];
const spawnSpot=i=>roomZ?((roomZ.start&&roomZ.start[i])||[[-1.2,WB*0.55],[1.2,WB*0.55]][i]):(typeof START_STREET!=='undefined'&&START_STREET[i])||SPAWN_DEFAULT[i];
// spotlight + "beep beep!" so each player sees which car is theirs
let lastBeepT=-9;
function introCar(p,delay=1.4){p.markT=4;queue.push({t:delay,fn:()=>{if(T-lastBeepT<1)return;lastBeepT=T;sfx.beep();say('Beep beep!');}});}
// put a car next to another one (joining mid-game, or pulled back after drifting way off)
function besideCar(p,ld){const off=ld.r*2.5+0.4*Math.max(S,0.3);
  p.x=ld.x+Math.cos(ld.heading)*off;p.z=ld.z-Math.sin(ld.heading)*off;p.y=groundH(p.x,p.z);p.heading=ld.heading;
  p.speed=0;p.kx=p.kz=0;p.vy=0;p.air=false;p.stuck=false;p.trail.length=0;p.markT=3;}
let lastStuckSay=0;
const soundHint=document.createElement('div');soundHint.id='soundHint';soundHint.textContent='🔊 Press a key, click or tap for sound';$('hud').appendChild(soundHint);
{const st=document.createElement('style');st.textContent=`:where(#soundHint){display:none;position:absolute;right:16px;top:74px;font:18px 'Lilita One',sans-serif;color:#fff;background:rgba(0,0,0,.45);padding:6px 14px;border-radius:14px}`;document.head.appendChild(st);}
// BOOM out of a tight spot: blast away whatever is hemming the car in (no points), and pop the car up
function boomOut(p){const R=p.r*3+2*S;
  p.stuck=false;p.trail.length=0;p.air=true;p.vy=14*Math.sqrt(Math.max(S,0.3));sfx.boom();say('BOOM!');shake=Math.min(2,shake+1);
  flash(p.x,S,p.z,'#ffd166',R,0.4);flash(p.x,S,p.z,'#ff5400',R*0.7,0.5);puff(p.x,S,p.z,10,R*0.5,'#888888');
  for(const o of objects){if(!o.alive||o.boss)continue;const dx=o.x-p.x,dz=o.z-p.z;if(Math.hypot(dx,dz)>R+o.r)continue;
    o.alive=false;wakeObj(o);if(o.rec){o.rec.dead=true;o.rec.gone=[];o.rec.back=T+rand(REGROW[0],REGROW[1]);}
    for(const part of o.parts)breakPart(o,part,dx,dz,20);scene.remove(o.g);}
  for(const a of animals){const dx=a.x-p.x,dz=a.z-p.z;if(Math.hypot(dx,dz)<R+a.r)launchAnimal(a,dx||1,dz,15);}}
function addPlayer(src){
  const idx=players.length===0?0:(players[0].idx===0?1:0);
  const p=new Player(idx,src);const o=players[0];players.push(p);sfx.join();updatePanels();
  if(o&&Math.hypot(o.x-p.x,o.z-p.z)>o.r*6+1)besideCar(p,o); // join next to your buddy, not back at the start
  introCar(p);
  if(garage){garage.ready=false;garage.goT=0;goBtn.style.display='none';garageRows();} // joined in the garage: gets a row of cars too
}
function updatePanels(){
  for(let i=0;i<2;i++){const el=$('p'+i);const p=players.find(q=>q.idx===i);
    if(p){el.className='pPanel';el.innerHTML=`P${i+1} ${p.stats.emoji} ${p.stats.name}<small>${(p.src==='touch'?'🎯 = shoot':(p.src.startsWith('gp')?'X/Y = shoot':(i==0?'R = shoot':'. = shoot')))}</small>`;}
    else{el.className='pPanel empty';el.innerHTML=`Player ${i+1}: press A<small>or ${i==0?'Space':'Enter'} to join!</small>`;}}
}

/* ---------- input ---------- */
const keys=new Set(),pressed=new Set();
let state='start';
addEventListener('keydown',e=>{
  initAudio();
  if(!keys.has(e.code))pressed.add(e.code);keys.add(e.code);
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Slash','Enter'].includes(e.code))e.preventDefault();
  if(state==='start'&&(e.code==='Space'||e.code==='Enter'))startGame();
  if(state==='start'&&/^(ArrowLeft|KeyA)$/.test(e.code))setPick('bedroom');if(state==='start'&&/^(ArrowRight|KeyD)$/.test(e.code))setPick('outside');
  if(e.code==='Escape'){if(state==='play')pause();else if(state==='pause')resume();}
  if(e.code==='KeyN'&&state==='play')newWorld();
  if(e.code==='Backquote'&&state==='play'&&!garage)for(const p of players){const l=carsInTier(carTierNow());p.setCar(l[(l.indexOf(p.carIdx)+1)%l.length],true);} // debug: cycle cars (play uses the garage)if(e.code==='KeyM')toggleMute();if(e.code==='KeyF')toggleFS();
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());
const KB={kb1:{u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',b:'Space',j:'KeyE',s:'KeyQ',f:'KeyR'},kb2:{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',b:'Enter',j:'ShiftRight',s:'Slash',f:'Period'}};
function readKB(m){return {x:(keys.has(m.r)?1:0)-(keys.has(m.l)?1:0),z:(keys.has(m.d)?1:0)-(keys.has(m.u)?1:0),boost:keys.has(m.b),jumpP:pressed.has(m.j),swapP:pressed.has(m.s),fire:keys.has(m.f),levelP:pressed.has(m.s)||pressed.has(m.f),joinP:pressed.has(m.b)||pressed.has(m.j)};}
const gpPrev={},padInfo=[];
function readGP(){
  const res={};let gps=[];try{gps=navigator.getGamepads?navigator.getGamepads():[];}catch(e){}
  padInfo.length=0;
  for(const gp of gps){if(!gp)continue;const prev=gpPrev[gp.index]||[];
    const b=gp.buttons.map(x=>x&&(x.pressed||x.value>0.5));const P=i=>b[i]&&!prev[i];
    let x=gp.axes[0]||0,z=gp.axes[1]||0;if(Math.hypot(x,z)<0.22){x=0;z=0;}
    if(b[14])x=-1;if(b[15])x=1;if(b[12])z=-1;if(b[13])z=1;
    // X and Y both shoot: 8BitDo / Nintendo-style pads swap the X and Y labels, so either one works.
    const ay=gp.axes[1]||0,pay=prev.ay||0,up=P(12)||(ay<-0.6&&pay>=-0.6),down=P(13)||(ay>0.6&&pay<=0.6);
    res['gp'+gp.index]={x,z,boost:!!(b[0]||b[7]),jumpP:P(1),swapP:P(4)||P(5),fire:!!(b[2]||b[3]),levelP:P(2)||P(3)||P(4)||P(5),joinP:P(0)||P(1)||P(9),
      startP:P(9),upP:up,downP:down,okP:P(0),backP:P(1)};b.ay=ay;gpPrev[gp.index]=b;
    padInfo.push({id:gp.id,mapping:gp.mapping,pressed:b.map((v,i)=>v?i:-1).filter(i=>i>=0),axes:[...gp.axes].map(a=>+a.toFixed(1))});
    if(b.some(Boolean)&&AC&&AC.state!=='running')AC.resume().catch(()=>{});}
  return res;
}
// touch
const touch={x:0,z:0,boost:false,jumpP:false,swapP:false,joinP:false,id:null,ox:0,oy:0};let touchUsed=false;
addEventListener('touchstart',e=>{touchUsed=true;if(state==='play'){$('touch').style.display='block';
  for(const t of e.changedTouches){if(t.target.classList&&t.target.classList.contains('tbtn'))continue;
    if(t.clientX<innerWidth*0.6&&touch.id===null){touch.id=t.identifier;touch.ox=t.clientX;touch.oy=t.clientY;
      const b=$('stickBase');b.style.left=(t.clientX-65)+'px';b.style.top=(t.clientY-65)+'px';b.style.bottom='auto';}}}},{passive:true});
addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===touch.id){let dx=t.clientX-touch.ox,dy=t.clientY-touch.oy;const d=Math.hypot(dx,dy),mx=60;
  if(d>mx){dx=dx/d*mx;dy=dy/d*mx;}touch.x=dx/mx;touch.z=dy/mx;$('stickKnob').style.transform=`translate(${dx}px,${dy}px)`;}},{passive:true});
const endT=e=>{for(const t of e.changedTouches)if(t.identifier===touch.id){touch.id=null;touch.x=0;touch.z=0;$('stickKnob').style.transform='';}};
addEventListener('touchend',endT);addEventListener('touchcancel',endT);
const btn=(id,down,up)=>{const el=$(id);el.addEventListener('touchstart',e=>{e.preventDefault();initAudio();down();},{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();up&&up();},{passive:false});};
const bFire=document.createElement('div');bFire.className='tbtn';bFire.id='bFire';bFire.textContent='🎯';bFire.style.display='none';$('touch').appendChild(bFire);
btn('bFire',()=>touch.fire=true,()=>touch.fire=false);
btn('bGo',()=>touch.boost=true,()=>touch.boost=false);btn('bJump',()=>touch.jumpP=true);btn('bSwap',()=>touch.swapP=true);

/* Start screen: pick where to play with pictures (L20): 🛏️ the bedroom or 🌳 outside. Stick / arrows / A D to switch. */
let startPick='outside';try{startPick=localStorage.getItem('sp_world')||'outside';}catch(e){}
const worldPick=document.createElement('div');worldPick.id='worldPick';
worldPick.innerHTML='<button class="wp" data-w="bedroom" title="Bedroom">🛏️</button><button class="wp" data-w="outside" title="Outside">🌳</button>';
$('play').before(worldPick);
{const st=document.createElement('style'); // default look; style.css (loaded after) can restyle #worldPick .wp / .wp.sel
  st.textContent='#worldPick{display:flex;gap:24px;justify-content:center;margin:10px 0 14px}#worldPick .wp{font-size:64px;line-height:1;padding:14px 26px;border-radius:24px;border:5px solid transparent;background:rgba(255,255,255,.18);cursor:pointer;transition:transform .15s}#worldPick .wp.sel{border-color:#ffd60a;background:rgba(255,214,10,.3);transform:scale(1.12)}';
  document.head.prepend(st);}
function markPick(){for(const b of worldPick.children)b.classList.toggle('sel',b.dataset.w===startPick);}
function setPick(w){if(w!==startPick){startPick=w;sfx.pop();}try{localStorage.setItem('sp_world',w);}catch(e){}markPick();}
for(const b of worldPick.children)b.onclick=e=>{e.stopPropagation();initAudio();setPick(b.dataset.w);startGame();};
markPick();let pickX=0;
function startGame(){
  if(state!=='start')return;state='play';initAudio();if(startPick==='bedroom'&&ZONES.bedroom)rollWorld(true,'bedroom');music('drive');
  $('start').style.display='none';$('hud').style.display='block';updatePanels();
  if(touchUsed){$('touch').style.display='block';addPlayer('touch');}
}
$('play').onclick=e=>{e.stopPropagation();startGame();};

/* ---------- pause menu (Esc / START / ⏸) + version ---------- */
const VERSION=window.GAME_VERSION||'dev';
{const v=document.createElement('div');v.id='version';v.textContent='v'+VERSION;$('startInner').appendChild(v);}
const pauseMenu=document.createElement('div');pauseMenu.id='pauseMenu';
pauseMenu.innerHTML='<div class="pm"><h2>⏸ PAUSED</h2><div id="pmBtns"></div><div id="pmVer"></div><div id="pmPad"></div></div>';document.body.appendChild(pauseMenu);
const pauseBtn=document.createElement('button');pauseBtn.id='pauseBtn';pauseBtn.title='Pause (Esc / START)';pauseBtn.textContent='⏸';$('corner').prepend(pauseBtn);
pauseBtn.onclick=e=>{e.stopPropagation();if(state==='play')pause();else if(state==='pause')resume();};
let pmSel=0,pmItems=[];
function pmBuild(){pmItems=[['▶ RESUME',resume]];if(nwBtn.style.display==='block')pmItems.push(['🌍 NEW WORLD',()=>{resume();newWorld();}]);pmItems.push([HIGH?'✨ LOOKS: BEST (switch to FAST)':'⚡ LOOKS: FAST (switch to BEST)',()=>setQuality(HIGH?'phone':'high')]);pmItems.push(['🏠 MAIN MENU',mainMenu]);
  const box=$('pmBtns');box.innerHTML='';pmItems.forEach(([t,f],i)=>{const b=document.createElement('button');b.textContent=t;b.onclick=e=>{e.stopPropagation();f();};
    b.onmouseenter=()=>{pmSel=i;pmMark();};box.appendChild(b);});pmSel=0;pmMark();}
function pmMark(){[...$('pmBtns').children].forEach((b,i)=>b.classList.toggle('sel',i===pmSel));}
function pause(){if(state!=='play')return;state='pause';pmBuild();pauseMenu.style.display='flex';sfx.pop();
  if(AC)for(const p of players)if(p.eng)p.eng.g.gain.setTargetAtTime(0,AC.currentTime,0.05);
  $('pmVer').textContent='v'+VERSION;
  fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.version&&j.version!==VERSION)$('pmVer').textContent=`v${VERSION} · 🆕 v${j.version} is ready: pick MAIN MENU to load it`;}).catch(()=>{});}
function resume(){if(state!=='pause')return;state='play';pauseMenu.style.display='none';}
function mainMenu(){location.reload();} // a fresh start (and it picks up any new version)
function pauseInput(gpIn){
  for(const g of Object.values(gpIn)){if(g.upP)pmSel=(pmSel+pmItems.length-1)%pmItems.length;if(g.downP)pmSel=(pmSel+1)%pmItems.length;
    if(g.okP){pmItems[pmSel][1]();return;}if(g.backP||g.startP){resume();return;}}
  if(pressed.has('ArrowUp')||pressed.has('KeyW'))pmSel=(pmSel+pmItems.length-1)%pmItems.length;
  if(pressed.has('ArrowDown')||pressed.has('KeyS'))pmSel=(pmSel+1)%pmItems.length;
  if(pressed.has('Enter')||pressed.has('Space')){pmItems[pmSel][1]();return;}
  pmMark();
  // controller tester: press buttons while paused to see what the browser reports
  $('pmPad').innerHTML=padInfo.length?padInfo.map((p,i)=>`🎮 ${i+1}: ${p.id.slice(0,46)}<br>mapping: <b>${p.mapping||'NOT standard'}</b> · pressed: <b>${p.pressed.join(', ')||'–'}</b>`).join('<br>')
    :'🎮 No controller seen yet: press any button on it';}
{const st=document.createElement('style');st.textContent=`
:where(#version){margin-top:14px;font:14px Nunito,sans-serif;font-weight:900;opacity:.75}
:where(#pauseMenu){display:none;position:fixed;inset:0;z-index:30;align-items:center;justify-content:center;background:rgba(10,20,40,.55)}
:where(#pauseMenu .pm){background:#fff;border-radius:28px;padding:22px 34px;text-align:center;font-family:Nunito,sans-serif;max-width:90vw;box-shadow:0 10px 0 rgba(0,0,0,.2)}
:where(#pauseMenu h2){font:44px 'Lilita One',sans-serif;margin:0 0 12px;color:#3a86ff}
:where(#pmBtns button){display:block;width:100%;margin:10px 0;font:28px 'Lilita One',sans-serif;color:#fff;background:#8338ec;border:5px solid transparent;border-radius:20px;padding:10px 26px;cursor:pointer}
:where(#pmBtns button.sel){background:#ff006e;border-color:#ffd60a;transform:scale(1.05)}
:where(#pmVer){margin-top:10px;font-weight:900;color:#555}
:where(#pmPad){margin-top:10px;font-size:13px;color:#777;line-height:1.5}`;document.head.appendChild(st);}

/* ---------- themed zones (L15) ---------- */
const _skyT=new THREE.Color(),_skyB=new THREE.Color();
// a NEW WORLD mixes in up to two registered themed zones (weight = how likely each is to show up)
function pickThemedZones(){let s='';for(const z of Object.values(ZONES).filter(z=>!z.indoor).sort(()=>Math.random()-0.5)){if(s.length>=2)break;if(Math.random()<Math.min(1,0.6*z.weight))s+=z.letter;}return s;}
// test helper: paint a 3×3 block of chunks next to the car as that zone, rebuild them and drive the car in
function testZone(id){const z=ZONES[id];if(!z)return 'unknown zone: '+id+' (registered: '+Object.keys(ZONES).join(', ')+')';
  const p=players[0]||{x:camT.x,z:camT.z};let ci=clamp(chunkIdx(p.x)+3,-CHUNKS_HALF+1,CHUNKS_HALF-1),cj=clamp(chunkIdx(p.z),-CHUNKS_HALF+1,CHUNKS_HALF-1);
  if(Math.abs(ci)<=2&&Math.abs(cj)<=2)ci=clamp(chunkIdx(p.x)-3,-CHUNKS_HALF+1,CHUNKS_HALF-1);
  const rows=zoneRows.map(r=>[...r]);for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++)rows[j+CHUNKS_HALF][i+CHUNKS_HALF]=z.letter;setZoneMap(rows.map(r=>r.join('')));
  for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){const c=chunks.get(chunkKey(i,j));if(!c)continue;if(c.loaded)unloadChunk(c);for(const r of c.rampList)r.mesh.geometry.dispose();chunks.delete(c.k);}
  const x=ci*CHUNK,zz=cj*CHUNK;if(players[0]){for(const q of players){q.x=x+(q.idx?6:0);q.z=zz;q.y=groundH(q.x,q.z);}}camT.set(x,0,zz);updateStreaming(0,true);return id+' zone around '+x+','+zz;}

/* ---------- collisions ---------- */
let lastBoing=0;
function collisions(){
  if(players.length===2){const a=players[0],b=players[1];const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||0.01,rr=a.r+b.r;
    if(d<rr&&Math.abs(a.y-b.y)<3*S){const nx=dx/d,nz=dz/d,ov=(rr-d)/2;a.x-=nx*ov;a.z-=nz*ov;b.x+=nx*ov;b.z+=nz*ov;
      const kb=9*a.sm;a.kx-=nx*kb;a.kz-=nz*kb;b.kx+=nx*kb;b.kz+=nz*kb;a.speed*=0.7;b.speed*=0.7;
      const n=performance.now();if(n-lastBoing>300){lastBoing=n;sfx.boing();puff((a.x+b.x)/2,1,(a.z+b.z)/2,3,1,'#ffffff');}}
    if(d>95){const nx=dx/d,nz=dz/d;a.kx+=nx*30*0.016;a.kz+=nz*30*0.016;b.kx-=nx*30*0.016;b.kz-=nz*30*0.016;}}
  for(const p of players){const vx=Math.sin(p.heading)*p.speed+p.kx,vz=Math.cos(p.heading)*p.speed+p.kz,spd=Math.hypot(vx,vz);
    for(const o of objects){if(!o.alive||o.boss||(o.falling&&o.fy>p.y+3*S))continue;const dx=o.x-p.x,dz=o.z-p.z,rr=p.r+o.r;
      if(dx*dx+dz*dz<rr*rr&&p.y<o.h+o.fy){
        if(o.rolling)continue;
        if(o.roll&&o.sz<=tier&&(spd>4*p.sm||p.air)){startRoll(o,vx||dx,vz||dz,Math.max(spd,10*p.sm));continue;}
        if(o.sz<=tier-3&&!o.gold){squish(o);continue;}
        if(o.bld){hitBuilding(p,o,dx,dz,rr,spd,vx,vz);continue;}
        if(o.sz>tier){bump(p,o,dx,dz,rr,spd);continue;}
        if(spd>4*p.sm||p.air){smash(o,vx||dx,vz||dz,Math.max(spd,10)*Math.sqrt(Math.max(1,S)));p.speed*=o.big&&o.sz>=tier?0.8:0.96;}
        else{const d=Math.hypot(dx,dz)||1;p.x-=dx/d*(rr-d);p.z-=dz/d*(rr-d);p.lastBump=T;}}}
    animalHits(p,vx,vz,spd);}
}

// too big to smash (yet): wobble it and boing the car back. Never a fail, just "grow more!"
function bump(p,o,dx,dz,rr,spd){
  const d=Math.hypot(dx,dz)||1,nx=dx/d,nz=dz/d;p.x-=nx*(rr-d);p.z-=nz*(rr-d);p.lastBump=T;
  if(spd<3*p.sm&&!p.air)return;
  p.lastBump=T;p.kx-=nx*(8*p.sm+spd*0.6);p.kz-=nz*(8*p.sm+spd*0.6);p.speed*=0.2;wakeObj(o);o.wob=1;
  growHint(o);const n=performance.now();if(n-(o.lastBoing||0)>350){o.lastBoing=n;sfx.boing();puff(o.x-nx*o.r,S,o.z-nz*o.r,3,Math.max(S,.3),'#ffffff');shake=Math.min(1,shake+.15);}
}

// way smaller than you (3+ sizes): squish it flat as you roll over. No growth, no slowdown, just a tiny pop.
const squished=[];let lastSquish=0;
function squish(o){
  o.alive=false;o.wob=0;wakeObj(o);if(o.rec){o.rec.dead=true;o.rec.back=T+rand(REGROW[0],REGROW[1]);}
  squished.push({o,t:0.25});const n=performance.now();if(n-lastSquish>70){lastSquish=n;tone('sine',rand(700,1000),250,0.08,0.06);}}
function updateSquish(dt){for(let i=squished.length-1;i>=0;i--){const q=squished[i];q.t-=dt;const f=q.o.s0||1;
  q.o.g.scale.set(f*1.3,f*Math.max(0.04,q.t/0.25),f*1.3);if(q.t<=-0.6){scene.remove(q.o.g);squished.splice(i,1);}}}

/* ---------- rolling hay & spinning windmills (design flags: {roll:true} / mesh.userData.spin) ---------- */
// A roll:true object (hay bale) doesn't shatter when a car hits it: it tumbles off in that direction, plowing through
// smaller stuff, launching animals and bouncing off bigger things, then bursts when it slows down (that's the smash).
const rollers=[];
function startRoll(o,vx,vz,spd){
  wakeObj(o);poolRelease(o);o.rolling=true;o.wob=0;const d=Math.hypot(vx,vz)||1;o.vx=vx/d*spd*1.3;o.vz=vz/d*spd*1.3;o.rollT=0;
  // spin around the middle of the bale: move its pieces into a pivot at half height
  const cy=o.h*0.5/(o.s0||1),piv=new THREE.Group();piv.position.y=cy;for(const c of [...o.g.children]){c.position.y-=cy;piv.add(c);}o.g.add(piv);o.piv=piv;
  o.g.rotation.order='YXZ';rollers.push(o);sfx.boing();puff(o.x,o.h*0.3,o.z,4,o.r,'#e9c46a');}
function updateRollers(dt){
  for(let i=rollers.length-1;i>=0;i--){const o=rollers[i];
    if(!o.alive){rollers.splice(i,1);continue;}
    o.rollT+=dt;const f=Math.pow(0.7,dt);o.vx*=f;o.vz*=f;const sp=Math.hypot(o.vx,o.vz);
    o.x+=o.vx*dt;o.z+=o.vz*dt;
    if(Math.abs(o.x)>WB-o.r){o.x=Math.sign(o.x)*(WB-o.r);o.vx*=-0.6;}if(Math.abs(o.z)>WB-o.r){o.z=Math.sign(o.z)*(WB-o.r);o.vz*=-0.6;}
    o.g.position.set(o.x,groundH(o.x,o.z)+Math.abs(Math.sin(o.rollT*9))*o.r*0.12,o.z);o.g.rotation.y=Math.atan2(o.vx,o.vz);o.piv.rotation.x+=sp*dt/Math.max(0.2,o.h*0.5);
    for(const q of objects){if(q===o||!q.alive||q.boss||q.rolling)continue;const dx=q.x-o.x,dz=q.z-o.z,rr=o.r+q.r;if(dx*dx+dz*dz>rr*rr)continue;
      if(q.sz<=o.sz&&!q.bld)smash(q,o.vx,o.vz,sp);
      else{const d=Math.hypot(dx,dz)||1,nx=dx/d,nz=dz/d,dot=o.vx*nx+o.vz*nz;if(dot>0){o.vx-=2*dot*nx*0.8;o.vz-=2*dot*nz*0.8;}o.x-=nx*(rr-d);o.z-=nz*(rr-d);
        wakeObj(q);q.wob=1;sfx.boing();if(q.bld)damageBuilding(q,o.x,o.z,o.r*2,1,0,o.h*1.5,nx,nz,sp);}}
    for(const a of animals){if(a.state==='fly')continue;if(Math.hypot(a.x-o.x,a.z-o.z)<a.r+o.r)launchAnimal(a,o.vx||1,o.vz,Math.max(sp,8));}
    if(sp<1.5*Math.max(S,0.3)||o.rollT>6){o.rolling=false;rollers.splice(i,1);smash(o,o.vx,o.vz,Math.max(sp,8));}}}
// Spinning parts: design can set mesh.userData.spin = {axis:'z', speed:1.2} (radians/s) on parts to spin around the
// part's own position; windmills get their blades spun automatically (the four boards in front of the hub).
function setupSpin(o){
  let list=o.parts.filter(p=>p.mesh.userData.spin);
  if(!list.length&&o.type==='windmill'){const blades=o.parts.filter(p=>p.mesh.geometry===GEO.box&&p.mesh.scale.y>3&&p.mesh.position.z>1.5);
    if(blades.length){const hub=new THREE.Group(),b0=blades[0].mesh;hub.position.set(b0.position.x,b0.position.y,b0.position.z);hub.userData.spin={axis:'z',speed:1.1};
      o.g.add(hub);for(const b of blades){b.mesh.position.sub(hub.position);hub.add(b.mesh);}o.spin=[hub];return;}}
  if(list.length)o.spin=list.map(p=>p.mesh);}
function updateSpin(dt){for(const o of objects){if(!o.spin||!o.alive)continue;for(const m of o.spin){const s=m.userData.spin;if(m.parent)m.rotation[s.axis||'z']+=(s.speed||1)*dt;}}}

/* ---------- size-matched scatter ---------- */
/* Keeps the area around the cars stocked with props near your size: mostly your size, some a size or two
   bigger (red-ringed goals), a few smaller, and nothing 3+ sizes below. Spawns just off screen as you drive,
   rains in after a size-up, and quietly drops props left far behind. Landmarks from zone layouts stay put.
   Design fills `const ZONE_PROPS={town:{mini:['flower',…],tiny:[…],…},farm:{…},park:{…}}` in objects.js;
   until then today's props are shrunk or grown to the size needed. */
const SCAT_N=IS_PHONE?50:90,SCAT_MIX=[[0,.6],[-1,.2],[1,.12],[-2,.05],[2,.03]]; // mostly your size; bigger things are rarer
const DEFAULT_PROPS={town:['crates','cone','barrel','house','tower','pin'],farm:['melon','fence','crates','tree','barrel','snowman'],
  park:['tree','snowman','pin','cone','tower','melon'],bedroom:['crates','pin','tower','melon','barrel','snowman'],home:['crates','cone','barrel','tower','pin','melon','snowman','tree']};
const scatR=()=>Math.max(3,Math.min(camBase(S)*1.5,47.5*Math.pow(S,0.75))); // about the visible radius at this size (the base camera, not the two-player zoom); same as before from size ~0.5 up
function scatterSize(){
  for(let t=0;t<10;t++){let r=Math.random();for(const [d,w] of SCAT_MIX){if((r-=w)<0){const k=tier+d;if(k>=0&&k<SIZES.length&&k>tier-3)return k;break;}}}
  return tier;}
function scatterProp(zone,k){ // → [type, scale]
  const zp=(ZONES[zone]&&ZONES[zone].sizes&&ZONES[zone].sizes[SIZES[k]])||(typeof ZONE_PROPS!=='undefined'&&ZONE_PROPS[zone]&&ZONE_PROPS[zone][SIZES[k]]);
  if(zp&&zp.length)return [pick(zp),1];
  const t=pick(DEFAULT_PROPS[zone]||DEFAULT_PROPS.home);return [t,Math.pow(SIZE_STEP,k-(TYPE_SIZE[t]??4))];}
const SPOT_LEFTOVER=0.15; // share of the filler that ignores spots (a little mess looks lived-in)
const DEFAULT_SPOT_PROPS={road:['cone','barrel'],sidewalk:['cone','pin','barrel'],parking:['crates','cone','barrel'],yard:['tree','snowman','pin'],
  porch:['crates','pin'],field:['melon','fence','tree'],sand:['pin','tower','snowman'],path:['cone','pin']};
const inSpot=(q,x,z)=>{const dx=x-q.x,dz=z-q.z;return Math.abs(dx*q.cs-dz*q.sn)<=q.hx&&Math.abs(dx*q.sn+dz*q.cs)<=q.hz;};
function spotAt(x,z){const c=chunks.get(chunkKey(chunkIdx(x),chunkIdx(z)));if(!c)return null;for(const q of c.spots)if(inSpot(q,x,z))return q;return null;}
// a point inside a spot that lies in the ring [d0,d1] around (px,pz), or null when no spot is in reach
function spotPoint(px,pz,d0,d1){const near=[];let tot=0;
  for(let ci=chunkIdx(px-d1);ci<=chunkIdx(px+d1);ci++)for(let cj=chunkIdx(pz-d1);cj<=chunkIdx(pz+d1);cj++){const c=chunks.get(chunkKey(ci,cj));if(!c)continue;
    for(const q of c.spots){const bx0=Math.max(q.x-q.ex,px-d1),bx1=Math.min(q.x+q.ex,px+d1),bz0=Math.max(q.z-q.ez,pz-d1),bz1=Math.min(q.z+q.ez,pz+d1);
      if(bx0<bx1&&bz0<bz1){const w=(bx1-bx0)*(bz1-bz0);near.push([q,bx0,bx1,bz0,bz1,w]);tot+=w;}}}
  if(!near.length)return null;
  for(let t=0;t<8;t++){let r=Math.random()*tot,n=near[near.length-1];for(const e of near)if((r-=e[5])<0){n=e;break;}
    const x=rand(n[1],n[2]),z=rand(n[3],n[4]),d=Math.hypot(x-px,z-pz);if(d>=d0&&d<=d1&&inSpot(n[0],x,z))return [x,z,n[0]];}
  return null;}
function spotProp(zone,kind,k){ // → [type, scale] or null when nothing is listed for this spot kind
  const zs=ZONES[zone]&&ZONES[zone].spots,l=(zs&&zs[kind]&&zs[kind][SIZES[k]])||(typeof SPOT_PROPS!=='undefined'&&SPOT_PROPS[kind]&&SPOT_PROPS[kind][SIZES[k]]);
  if(l&&l.length)return [pick(l),1];
  if(zs||typeof SPOT_PROPS!=='undefined')return null; // design owns spots now: use the zone's own size list
  const d=DEFAULT_SPOT_PROPS[kind];if(!d)return null;const t=pick(d);return [t,Math.pow(SIZE_STEP,k-(TYPE_SIZE[t]??4))];}
function spawnScatter(p,fill){
  const Rs=scatR(),moving=Math.abs(p.speed)>2*p.sm;
  for(let tries=0;tries<6;tries++){
    const a=fill||!moving?rand(0,Math.PI*2):p.heading+rand(-1.4,1.4),d=fill?rand(0.2,1)*Rs:rand(1.0,1.4)*Rs;
    let x=p.x+Math.sin(a)*d,z=p.z+Math.cos(a)*d,sp=null;const k=scatterSize(),r=GROW_S[k]*2.5+0.1;
    if(Math.random()>SPOT_LEFTOVER){sp=spotAt(x,z);  // L19: land in a spot when there's one nearby
      if(!sp){const q=spotPoint(p.x,p.z,fill?0.2*Rs:Rs,1.4*Rs);if(q)[x,z,sp]=q;}}
    if(Math.abs(x)>WB-r-2||Math.abs(z)>WB-r-2||groundH(x,z)>0||groundH(x+r,z)>0||groundH(x-r,z)>0||groundH(x,z+r)>0||groundH(x,z-r)>0)continue;
    if(k>tier&&(onRoad(x,z,r)||(!roomZ&&typeof startLane==='function'&&startLane(x,z))))continue; // L26: nothing too big to smash lands on the road or in the start lane
    if(objects.some(o=>o.alive&&Math.abs(o.x-x)<o.r+r+0.3&&Math.abs(o.z-z)<o.r+r+0.3&&Math.hypot(o.x-x,o.z-z)<o.r+r+0.3))continue;
    if(players.some(q=>Math.hypot(q.x-x,q.z-z)<q.r+r+1))continue;
    const zn=zoneAt(chunkIdx(x),chunkIdx(z)),[t,f]=(sp&&spotProp(zn,sp.kind,k))||scatterProp(zn,k);
    const o=OBJ[t](x,z,t==='fence'?rand(0,Math.PI):undefined,f);o.scat=true;
    if(fill){o.falling=true;o.fy=rand(6,16)*Math.max(S,0.4);o.vy=0;o.g.position.y=o.fy;}else poolAdopt(o);
    return o;}
  return null;}
let scatT=0;
function updateScatter(dt){
  if(state!=='play'||!players.length||(scatT-=dt)>0)return;scatT=0.2;
  const Rs=scatR();let n=0;
  for(const o of objects){if(!o.scat||!o.alive)continue;let d=1e9;for(const p of players)d=Math.min(d,Math.hypot(o.x-p.x,o.z-p.z));
    if(o.gold)continue;
    if(d>Rs*1.8||(o.sz<=tier-3&&d>Rs)){o.alive=false;poolRelease(o);scene.remove(o.g);continue;}n++;}
  const fill=n<SCAT_N*0.4; // nearly empty (game start, new world): rain props into view
  for(let i=0;i<6&&n<SCAT_N;i++,n++)spawnScatter(pick(players),fill);
}
function scatterRain(n){for(let i=0;i<n;i++)queue.push({t:0.3+i*0.05,fn:()=>{if(players.length)spawnScatter(pick(players),true);}});}


/* ---------- animals: never hurt, just launched ---------- */
/* Animals wander in herds and scoot away from cars. A hit launches them in a big spinning arc with their sound
   and a puff of feathers/fluff; they land, get dizzy, shake it off and wander again. Too-big animals boing you
   back (red ring like any too-big thing), way-smaller ones hop out of the way. A launch gives a small meter bonus,
   never growth. If one lands far from home it sneaks back while nobody's looking.
   Design: `const ANIMAL={chicken:{build(){…return group},fluff:'#fff'},…}` in src/world/animals.js replaces these placeholders.
   build() returns a THREE.Group facing +Z, feet at y=0, real-ish size (a chicken ~0.7 long, a cow ~2.6).
   Herds: zone layouts call ctx.herd(kind,x,z,n); chunks without any get a default mix from ZONE_HERDS.
   Sound: sfxClip(kind) from tools/sfx-lines.json. */
function animalEyes(g,x,y,z,s){g.add(mk('sph',s,s,s,'#ffffff',x,y,z),mk('sph',s,s,s,'#ffffff',-x,y,z),mk('sph',s*.5,s*.5,s*.5,'#111111',x,y,z+s*.35),mk('sph',s*.5,s*.5,s*.5,'#111111',-x,y,z+s*.35));}
function quadAnimal(L,col,headCol,legCol,extra){const g=new THREE.Group(),W=L*.5,H=L*.42,leg=L*.32;
  g.add(mk('box',W,H,L*.72,col,0,leg+H/2,0),mk('box',W*.72,H*.8,L*.34,headCol||col,0,leg+H*.95,L*.44));
  for(const [x,z] of [[1,1],[-1,1],[1,-1],[-1,-1]])g.add(mk('box',W*.22,leg,W*.22,legCol||col,x*W*.3,leg/2,z*L*.25));
  animalEyes(g,W*.2,leg+H*1.12,L*.6,L*.12);if(extra)extra(g,L,W,H,leg);return g;}
function birdAnimal(L,col,beak,extra){const g=new THREE.Group();
  g.add(mk('sph',L*.8,L*.7,L,col,0,L*.55,0),mk('sph',L*.55,L*.55,L*.55,col,0,L*.95,L*.35));
  const b=mk('cone',L*.16,L*.28,L*.16,beak,0,L*.92,L*.7);b.rotation.x=Math.PI/2;g.add(b);
  g.add(mk('box',L*.08,L*.25,L*.08,beak,L*.15,L*.12,0),mk('box',L*.08,L*.25,L*.08,beak,-L*.15,L*.12,0));
  animalEyes(g,L*.14,L*1.05,L*.55,L*.15);if(extra)extra(g,L);return g;}
const ANIMAL_DEFAULT={
  chick:{fluff:'#ffe14d',build:()=>birdAnimal(.35,'#ffe14d','#ff9f1c')},
  chicken:{fluff:'#ffffff',build:()=>birdAnimal(.7,'#ffffff','#ff9f1c',(g,L)=>g.add(mk('box',L*.08,L*.2,L*.3,'#e63946',0,L*1.28,L*.35)))},
  duck:{fluff:'#fff3b0',build:()=>birdAnimal(.8,'#fff3b0','#ff9f1c')},
  goose:{fluff:'#ffffff',build:()=>birdAnimal(1.1,'#f2f2f2','#ff7b00')},
  bunny:{fluff:'#ffffff',build:()=>quadAnimal(.7,'#f1f1f1',0,0,(g,L,W,H,leg)=>g.add(mk('box',L*.1,L*.45,L*.06,'#ffc6ff',W*.15,leg+H*1.6,L*.42),mk('box',L*.1,L*.45,L*.06,'#ffc6ff',-W*.15,leg+H*1.6,L*.42)))},
  cat:{fluff:'#f4a259',build:()=>quadAnimal(1.0,'#f4a259',0,0,(g,L,W,H,leg)=>{const t=mk('box',L*.08,L*.45,L*.08,'#f4a259',0,leg+H*1.2,-L*.4);t.rotation.x=-0.4;g.add(t,mk('cone',L*.12,L*.16,L*.08,'#f4a259',W*.22,leg+H*1.5,L*.44),mk('cone',L*.12,L*.16,L*.08,'#f4a259',-W*.22,leg+H*1.5,L*.44));})},
  dog:{fluff:'#b5835a',build:()=>quadAnimal(1.4,'#b5835a',0,0,(g,L,W,H,leg)=>g.add(mk('box',L*.08,L*.22,L*.12,'#7f4f24',W*.4,leg+H*1.1,L*.44),mk('box',L*.08,L*.22,L*.12,'#7f4f24',-W*.4,leg+H*1.1,L*.44),mk('sph',L*.1,L*.1,L*.1,'#111111',0,leg+H*.9,L*.62)))},
  pig:{fluff:'#ffc6d9',build:()=>quadAnimal(1.6,'#ffadc6',0,0,(g,L,W,H,leg)=>g.add(mk('cyl',L*.16,L*.06,L*.16,'#ff8fab',0,leg+H*.9,L*.62).rotateX(Math.PI/2)))},
  sheep:{fluff:'#ffffff',build:()=>quadAnimal(1.6,'#ffffff','#333333','#333333',(g,L,W,H,leg)=>{for(let i=0;i<5;i++)g.add(mk('sph',W*.7,H*.8,W*.7,'#ffffff',rand(-.15,.15)*L,leg+H*rand(.7,1.1),(i-2)*L*.13));})},
  goat:{fluff:'#d8cfc0',build:()=>quadAnimal(1.6,'#d8cfc0',0,0,(g,L,W,H,leg)=>g.add(mk('cone',L*.06,L*.22,L*.06,'#6d6875',W*.2,leg+H*1.5,L*.38),mk('cone',L*.06,L*.22,L*.06,'#6d6875',-W*.2,leg+H*1.5,L*.38)))},
  cow:{fluff:'#ffffff',build:()=>quadAnimal(2.6,'#ffffff',0,0,(g,L,W,H,leg)=>{g.add(mk('box',W*1.02,H*.5,L*.2,'#222222',0,leg+H*.7,L*.1),mk('box',W*1.02,H*.4,L*.15,'#222222',0,leg+H*.55,-L*.2),
    mk('box',W*.5,H*.3,L*.1,'#ffadc6',0,leg+H*.75,L*.62),mk('cone',L*.05,L*.12,L*.05,'#fff3b0',W*.3,leg+H*1.4,L*.42),mk('cone',L*.05,L*.12,L*.05,'#fff3b0',-W*.3,leg+H*1.4,L*.42));})},
  horse:{fluff:'#8d5524',build:()=>quadAnimal(2.8,'#8d5524',0,'#5c3a1a',(g,L,W,H,leg)=>g.add(mk('box',W*.15,H*.8,L*.3,'#3b2412',0,leg+H*1.3,L*.3)))}
};
const ZONE_HERDS={farm:[['chicken',6],['chick',5],['cow',3],['pig',4],['sheep',5],['goat',3],['horse',2]],
  park:[['duck',5],['goose',3],['bunny',4],['dog',2],['chick',4]],town:[['dog',2],['cat',3],['chicken',3]],home:[['chicken',5],['duck',4],['bunny',3],['chick',5]]};
const animalDef=k=>(typeof ANIMAL!=='undefined'&&ANIMAL[k])||ANIMAL_DEFAULT[k];
const animals=[];
function chunkHerd(c,kind,x,z,n=4){
  if(!animalDef(kind)||x<c.x0+4||x>c.x0+CHUNK-4||z<c.z0+4||z>c.z0+CHUNK-4||onRoad(x,z,3))return false;
  c.herds.push({kind,x,z,n,list:[],on:false});return true;}
function defaultHerds(c){const opts=(ZONES[c.zone]&&ZONES[c.zone].herds)||ZONE_HERDS[c.zone]||ZONE_HERDS.park;if(!opts.length)return;const n=c.zone==='farm'?3:c.zone==='town'?1:2;
  for(let i=0,t=0;i<n&&t<20;t++){const [k,m]=pick(opts);if(chunkHerd(c,k,rand(c.x0+8,c.x0+CHUNK-8),rand(c.z0+8,c.z0+CHUNK-8),m))i++;}}
// Each kind is built once and merged into one mesh per material, then copied (shared geometry) for every animal.
const animalTemplates={};
function animalModel(kind,def){
  if(!animalTemplates[kind]){const src=def.build();src.updateMatrixWorld(true);const byMat=new Map();
    src.traverse(m=>{if(!m.isMesh||Array.isArray(m.material))return;const l=byMat.get(m.material)||[];l.push(m.geometry.clone().applyMatrix4(m.matrixWorld));byMat.set(m.material,l);});
    const t=new THREE.Group();let ok=true;
    for(const [mat,geos] of byMat){const g=THREE.mergeGeometries?THREE.mergeGeometries(geos):null;if(!g){ok=false;break;}
      const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;t.add(mesh);}
    t.userData.merged=ok;animalTemplates[kind]=ok?t:src;}
  return animalTemplates[kind].clone();}
/* L25: animals draw from one InstancedMesh per kind and material (a farm full of animals is a handful of draw calls,
   not one per animal per material per pass). a.g stays the animal's transform, just not in the scene; a gold animal
   (its own material + beam) or a kind that couldn't be merged is a real mesh in the scene instead. */
const animalBatches=new Map(),ANIMAL_CAP=256;
function animalShow(a){animalHide(a);a.shown=true;const t=animalTemplates[a.kind];
  if(a.gold||!t||!t.userData.merged){scene.add(a.g);return;}
  const ent=[];
  for(const tm of t.children){let b=animalBatches.get(tm);
    if(!b){const im=new THREE.InstancedMesh(tm.geometry,instMat(tm.material),ANIMAL_CAP);im.count=0;im.castShadow=im.receiveShadow=true;im.frustumCulled=false;
      scene.add(im);animalBatches.set(tm,b={im,owner:[]});}
    if(b.im.count>=ANIMAL_CAP){a.inst=ent;animalHide(a);a.shown=true;scene.add(a.g);return;}
    const i=b.im.count++;const e=[b,i];b.owner[i]=e;ent.push(e);}
  a.inst=ent;a.g.updateMatrix();for(const e of ent)e[0].im.setMatrixAt(e[1],a.g.matrix);}
function animalHide(a){a.shown=false;scene.remove(a.g);if(!a.inst)return;
  for(const e of a.inst){const b=e[0],im=b.im,i=e[1],last=--im.count;
    if(i!==last){im.getMatrixAt(last,_pm);im.setMatrixAt(i,_pm);const mv=b.owner[last];mv[1]=i;b.owner[i]=mv;}
    b.owner[last]=undefined;im.instanceMatrix.needsUpdate=true;}
  a.inst=null;}
function animalBatchSync(){for(const a of animals)if(a.inst){a.g.updateMatrix();for(const e of a.inst)e[0].im.setMatrixAt(e[1],a.g.matrix);}
  for(const b of animalBatches.values())if(b.im.count)b.im.instanceMatrix.needsUpdate=true;}
function spawnAnimal(h,x,z,kind=h.kind){
  const def=animalDef(kind),g=animalModel(kind,def);_bx.setFromObject(g);
  const r=Math.max(_bx.max.z-_bx.min.z,_bx.max.x-_bx.min.x)/2*0.85,hgt=_bx.max.y;
  const a={kind,def,g,herd:h,x,z,y:0,vx:0,vz:0,vy:0,heading:rand(0,Math.PI*2),state:'idle',t:rand(0,2),r,h:hgt,fr:r*1.2,
    alive:true,falling:false,ph:rand(0,9),spin:[0,0,0]};
  a.sz=clamp(Math.round(4+Math.log(Math.max(r,hgt/3)/1.1)/Math.log(SIZE_STEP)),0,SIZES.length-1);
  a.speed=clamp(1.2+r*1.6,1,5);g.position.set(x,groundH(x,z),z);g.rotation.y=a.heading;animals.push(a);h.list.push(a);return a;}
function herdOn(h){h.on=true;if(h.goldIdx===undefined)h.goldIdx=Math.random()<0.15?0:-1;
  // every chicken flock gets a rooster (when design has made one)
  for(let i=0;i<h.n;i++){const k=h.kind==='chicken'&&i===h.n-1&&animalDef('rooster')?'rooster':h.kind;
    const a=spawnAnimal(h,h.x+rand(-3,3),h.z+rand(-3,3),k);if(i===h.goldIdx)goldify(a,30);animalShow(a);}}
function herdOff(h){h.on=false;for(const a of h.list){animalHide(a);const i=animals.indexOf(a);if(i>=0)animals.splice(i,1);}h.list.length=0;}
function launchAnimal(a,vx,vz,power){
  if(a.state==='fly')return;if(a.gold){goldFound(a,true);ungold(a);a.herd.goldIdx=-1;animalShow(a);}const d=Math.hypot(vx,vz)||1,H=rand(3,6)*Math.max(S,0.25)+a.r*2;
  a.state='fly';a.bounced=false;a.vy=Math.sqrt(64*H);a.vx=vx/d*power*0.5+rand(-2,2)*S;a.vz=vz/d*power*0.5+rand(-2,2)*S;
  a.spin=[rand(-12,12),rand(-12,12),rand(-12,12)];a.falling=true;
  if(!sfxClip(a.kind,0.9,rand(0.92,1.12)))tone('square',rand(500,900),rand(1200,1800),0.25,0.12);sfxClip('whee',0.35,rand(.9,1.2));
  puff(a.x,a.y+a.h*.5,a.z,6,Math.max(0.3,a.r*0.9),a.def.fluff||'#ffffff');addScore(2);comboHit();
  const n=performance.now();if(n-lastAnimalSay>9000&&Math.random()<0.35){lastAnimalSay=n;
    say(a.kind==='chicken'||a.kind==='chick'?pick(['Fly, chicken, fly!','Wheee!']):a.kind==='cow'?'Moo-ve over!':a.kind==='duck'||a.kind==='goose'?'Bye bye, birdie!':pick(['Wheee!','Up, up and away!']));}
}
let lastAnimalSay=0;
function hopAside(a,dx,dz){if(a.state==='fly')return;const d=Math.hypot(dx,dz)||1;a.state='fly';a.hop=true;a.bounced=true;a.vy=6;a.vx=dx/d*3;a.vz=dz/d*3;a.spin=[0,0,0];a.falling=true;}
// cars meet animals (called from collisions)
function animalHits(p,vx,vz,spd){
  for(const a of animals){if(a.state==='fly')continue;const dx=a.x-p.x,dz=a.z-p.z,rr=p.r+a.r;
    if(dx*dx+dz*dz>=rr*rr||p.y>a.y+a.h)continue;
    if(a.sz<=tier-3){hopAside(a,dx,dz);continue;}
    if(a.sz>tier){bump(p,a,dx,dz,rr,spd);if(a.state!=='dizzy'){sfxClip(a.kind,0.6,0.8);hopAside(a,dx,dz);}continue;}
    if(spd>2*p.sm||p.air)launchAnimal(a,vx||dx,vz||dz,Math.max(spd,8*p.sm));
    else{const d=Math.hypot(dx,dz)||1;a.x=p.x+dx/d*rr;a.z=p.z+dz/d*rr;}}
}
const _pv=new THREE.Vector3();let herdT=0;
function updateAnimals(dt){
  if((herdT-=dt)<=0){herdT=0.5;const R=clamp(scatR()*1.6,55,170); // herds wake near the cars, not across the whole world
    for(const c of chunks.values()){if(!c.loaded)continue;for(const h of c.herds){let d=1e9;
      for(const p of players.length?players:[{x:camT.x,z:camT.z}])d=Math.min(d,Math.hypot(h.x-p.x,h.z-p.z));
      if(!h.on&&d<R)herdOn(h);else if(h.on&&d>R+30)herdOff(h);}}}
  for(const a of animals){const g=a.g;
    if(a.state==='fly'){a.vy-=32*dt;a.x+=a.vx*dt;a.z+=a.vz*dt;a.y+=a.vy*dt;
      g.rotation.x+=a.spin[0]*dt;g.rotation.y+=a.spin[1]*dt;g.rotation.z+=a.spin[2]*dt;
      if(Math.abs(a.x)>WB-1){a.x=Math.sign(a.x)*(WB-1);a.vx*=-0.5;}if(Math.abs(a.z)>WB-1){a.z=Math.sign(a.z)*(WB-1);a.vz*=-0.5;}
      const gh=groundH(a.x,a.z);
      if(a.y<=gh&&a.vy<0){a.y=gh;
        if(!a.bounced){a.bounced=true;a.vy*=-0.35;a.vx*=0.5;a.vz*=0.5;sfxClip('poof',0.45,rand(.9,1.1));puff(a.x,gh+0.2,a.z,4,Math.max(0.3,a.r),'#f4ecdf');}
        else{a.falling=false;g.rotation.set(0,a.heading,0);
          if(a.hop){a.hop=false;a.state='idle';a.t=rand(0.5,1.5);}
          else{a.state='dizzy';a.t=1.4;sfxClip('dizzy',0.3,rand(.9,1.2));}}}
      g.position.set(a.x,a.y,a.z);continue;}
    a.t-=dt;
    let near=null,nd=1e9;for(const p of players){const d=Math.hypot(a.x-p.x,a.z-p.z)-p.r;if(d<nd){nd=d;near=p;}}
    if(a.state!=='dizzy'&&near&&tier>=a.sz-1&&nd<2+a.r*3+near.r){if(a.state!=='flee')a.t=0.9;a.state='flee';a.heading=Math.atan2(a.x-near.x,a.z-near.z)+Math.sin(T*3+a.ph)*0.4;}
    let moving=false;
    if(a.state==='dizzy'){g.rotation.set(Math.sin(T*18)*0.15,a.heading+Math.sin(T*9)*0.6,Math.cos(T*14)*0.15);
      if(a.t<=0){a.state='walk';a.t=rand(1,2.5);a.heading=Math.atan2(a.herd.x-a.x,a.herd.z-a.z);
        // landed far from home? sneak back while nobody is looking
        if(Math.hypot(a.x-a.herd.x,a.z-a.herd.z)>45&&!frustum.containsPoint(_pv.set(a.x,a.y+1,a.z))){a.x=a.herd.x+rand(-3,3);a.z=a.herd.z+rand(-3,3);}}}
    else if(a.state==='idle'){if(a.t<=0){a.state='walk';a.t=rand(1,3);const hr=4+a.r*4;
      a.heading=Math.atan2(a.herd.x+rand(-hr,hr)-a.x,a.herd.z+rand(-hr,hr)-a.z);}}
    else{const sp=a.speed*(a.state==='flee'?2.4:1);a.x+=Math.sin(a.heading)*sp*dt;a.z+=Math.cos(a.heading)*sp*dt;moving=true;
      if(a.t<=0){a.state='idle';a.t=rand(0.8,2.5);}}
    if(Math.abs(a.x)>WB-2)a.x=Math.sign(a.x)*(WB-2);if(Math.abs(a.z)>WB-2)a.z=Math.sign(a.z)*(WB-2);
    a.y=groundH(a.x,a.z);
    g.position.set(a.x,a.y+(moving?Math.abs(Math.sin(T*14+a.ph))*0.12*a.r:0),a.z);
    if(a.state!=='dizzy')g.rotation.set(0,a.heading,moving?Math.sin(T*14+a.ph)*0.12:0);}
  animalBatchSync();
}


/* ---------- boss (L6): shows up when you're GIANT ---------- */
/* A random boss drops in each world once you reach max size. It strolls around, stomps (harmless: cars bounce,
   stuff around it smashes) and has glowing weak spots in phases. Drive into the glowing spots together; when a
   phase's spots are gone the boss gets mad and the next ones light up. Beat the last phase and it collapses floor
   by floor, then the celebration and the NEW WORLD button. No timer, no damage, no losing.
   Design: `const BOSSES=[{id,name,emoji,sway,zone?,taunts?,defeat?,build(P,g){…}},…]` in src/world/bosses.js replaces the placeholders below.
   build() works like makeObj's: register parts with P(BP(mesh,floor,kind),chunks,whole,half) at "1x" scale
   (about 11 tall, radius ~3.6; logic scales it up ×BOSS_SCALE). Weak spots: P(bossWeak(mesh,floor,phase),3) with
   phase 1, 2, 3…, placed low (under ~3.5 tall at 1x) and on the outside so a giant car can reach them. */
const BOSS_SCALE=7;
function bossWeak(mesh,floor,phase){mesh.userData.floor=floor;mesh.userData.kind='weak';mesh.userData.phase=phase;return mesh;}
const BOSS_DEFAULT=[
  {id:'clankzilla',name:'Clankzilla',emoji:'🤖',sway:0.05,build(P){
    for(const sx of [-1.4,1.4]){P(BP(mk('box',1.4,3,1.6,'#6c757d',sx,1.5,0),0,'wall'),6);P(BP(mk('box',1.9,0.8,2.6,'#495057',sx,0.4,0.3),0,'wall'),4);}
    for(const sx of [-1.4,1.4]){P(bossWeak(mk('sph',1,1,1,'#ffd60a',sx,1.8,0.95),0,1),3);P(bossWeak(mk('sph',1,1,1,'#ffd60a',sx,1.8,-0.95),0,2),3);}
    P(BP(mk('box',5,2.6,3.2,'#8d99ae',0,4.3,0),1,'wall'),10);P(BP(mk('box',4.6,2.2,2.8,'#b5651d',0,6.6,0),1,'wall'),10);
    P(bossWeak(mk('sph',1.4,1.4,1.4,'#ffd60a',0,3.3,1.7),1,3),4);
    for(const sx of [-1,1]){const t=mk('cyl',1.4,0.6,1.4,'#222222',sx*1.6,5.6,1.5);t.rotation.x=Math.PI/2;P(BP(t,1,'extra'),2,true,0.7);
      P(BP(mk('box',0.9,3.2,0.9,'#6c757d',sx*3,5,0),1,'extra'),3,true,1.6);P(BP(mk('box',1.3,0.9,1.3,'#e76f51',sx*3,3.2,0.3),1,'extra'),2,true,0.6);}
    P(BP(mk('box',2.8,2,2.3,'#adb5bd',0,8.7,0),2,'wall'),6);
    for(const sx of [-0.6,0.6]){P(BP(mk('sph',0.8,0.8,0.4,'#ffffff',sx,9,1.15),2,'extra'),1,true,0.4);P(BP(mk('sph',0.35,0.35,0.3,'#111111',sx,9,1.35),2,'extra'),1,true,0.2);}
    P(BP(mk('box',1.6,0.35,0.2,'#333333',0,8.1,1.2),2,'extra'),1,true,0.3);
    P(BP(mk('cyl',0.15,1.5,0.15,'#333333',0,10.4,0),3,'roof'),1,true,0.7);P(BP(mk('sph',0.6,0.6,0.6,'#ff006e',0,11.2,0),3,'roof'),1,true,0.3);}},
  {id:'shelldozer',name:'Shelldozer',emoji:'🦀',sway:0.03,build(P){
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const b=mk('box',2.7,2,1.2,'#e85d04',Math.sin(a)*2.5,1.4,Math.cos(a)*2.5);b.rotation.y=a;P(BP(b,0,'wall'),5);}
    P(BP(mk('cyl',5.4,0.6,5.4,'#dc2f02',0,2.6,0),0,'slab'),8);
    for(const sx of [-1,1]){for(let k=0;k<3;k++){const l=mk('box',2.2,0.35,0.35,'#9d0208',sx*3.6,0.6,(k-1)*1.3);l.rotation.z=sx*0.5;P(BP(l,0,'extra'),2,true,0.3);}
      P(BP(mk('box',1.3,1.1,2.2,'#e85d04',sx*2.6,1.4,3),0,'extra'),3,true,0.6);P(bossWeak(mk('sph',1.3,1.1,1.3,'#ffd60a',sx*2.8,1.4,4.2),0,1),3);
      P(bossWeak(mk('sph',1,1,1,'#ffd60a',sx*3.6,1.0,-0.4),0,2),3);
      P(BP(mk('cyl',0.2,1.6,0.2,'#9d0208',sx*0.8,2.8,2.2),0,'extra'),1,true,0.8);P(bossWeak(mk('sph',0.9,0.9,0.9,'#ffd60a',sx*0.8,3.6,2.3),0,3),3);}
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const w=mk('box',2.6,1.6,0.6,'#f4d58d',Math.sin(a)*1.4,3.7,Math.cos(a)*1.4);w.rotation.y=a;P(BP(w,1,'wall'),5);}
    for(const [x,z] of [[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]]){P(BP(mk('cyl',1,2.4,1,'#e9c46a',x,5.4,z),2,'wall'),4);P(BP(mk('cone',1.3,1.2,1.3,'#e63946',x,7.2,z),3,'roof'),2,true,0.6);}
    P(BP(mk('box',0.1,1.4,0.1,'#333333',0,8,0),3,'roof'),1,true,0.7);P(BP(mk('box',0.9,0.5,0.06,'#06d6a0',0.45,8.5,0),3,'roof'),1,true,0.3);}},
  {id:'kingwobbles',name:'King Wobbles',emoji:'👑',sway:0.12,build(P){
    for(const sx of [-1,1]){P(BP(mk('box',1.5,2,1.5,'#3a86ff',sx,1,0),0,'wall'),4);P(bossWeak(mk('box',1.6,0.9,1.4,'#ffd60a',sx,0.45,1.3),0,1),3);}
    P(BP(mk('box',3.8,1.6,2.8,'#8338ec',0,2.8,0),1,'wall'),8);P(BP(mk('box',3.6,1.6,2.6,'#ff006e',0,4.4,0),1,'wall'),8);
    for(const sx of [-1,1]){P(BP(mk('box',0.9,2.6,0.9,'#ffbe0b',sx*2.5,3.4,0),1,'extra'),3,true,1.3);P(bossWeak(mk('box',1.3,1.3,1.3,'#ffd60a',sx*2.6,2.2,0.6),1,2),3);}
    P(bossWeak(mk('sph',1.4,1.4,1.4,'#ffd60a',0,3.3,1.5),1,3),4);
    P(BP(mk('box',2.8,2.4,2.4,'#06d6a0',0,6.4,0),2,'wall'),8);
    for(const sx of [-0.6,0.6]){P(BP(mk('sph',0.9,0.9,0.4,'#ffffff',sx,6.8,1.2),2,'extra'),1,true,0.4);P(BP(mk('sph',0.4,0.4,0.3,'#111111',sx,6.8,1.42),2,'extra'),1,true,0.2);}
    P(BP(mk('box',1.2,0.3,0.2,'#e63946',0,5.8,1.22),2,'extra'),1,true,0.2);
    P(BP(mk('cyl',2.6,0.6,2.6,'#ffd60a',0,7.9,0),3,'roof'),4);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;P(BP(mk('cone',0.5,1,0.5,'#ffd60a',Math.sin(a)*1.1,8.7,Math.cos(a)*1.1),3,'roof'),1,true,0.5);}}}
];
let boss=null,lastBossSay=0;
const _c1=new THREE.Color(),_c2=new THREE.Color('#ffd60a'),_c3=new THREE.Color('#ff006e'),_wpB=new THREE.Vector3();
const bossArrowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle='#ffd60a';x.strokeStyle='#ffffff';x.lineWidth=8;x.beginPath();x.moveTo(64,118);x.lineTo(112,58);x.lineTo(82,58);x.lineTo(82,10);x.lineTo(46,10);x.lineTo(46,58);x.lineTo(16,58);x.closePath();x.fill();x.stroke();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const bossArrows=[0,1,2,3].map(()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:bossArrowTex,depthTest:false,transparent:true}));s.renderOrder=3;s.visible=false;scene.add(s);return s;});
const bossHud=document.createElement('div');bossHud.id='bossHud';$('hud').appendChild(bossHud);
{const st=document.createElement('style');st.textContent=`
:where(#bossHud){display:none;position:absolute;left:50%;bottom:22px;transform:translateX(-50%);text-align:center;font:26px 'Lilita One',sans-serif;color:#fff;
  background:rgba(0,0,0,.35);border-radius:20px;padding:6px 18px;white-space:nowrap;text-shadow:0 3px 0 rgba(0,0,0,.35)}
:where(#bossHud i){font-style:normal;display:inline-block;margin:0 3px;font-size:30px;opacity:.35;transition:opacity .2s,transform .2s}
:where(#bossHud i.on){opacity:1;animation:bossStar .6s ease-in-out infinite alternate}
:where(#bossHud i.gone){opacity:.9}
@keyframes bossStar{to{transform:scale(1.25)}}`;document.head.appendChild(st);}
function bossList(){return typeof BOSSES!=='undefined'&&BOSSES.length?BOSSES:BOSS_DEFAULT;}
/* L23 themed bosses: a boss with zone:'<id>' belongs to that themed zone. At GIANT we pick from the zone the players
   are in; else from a themed zone somewhere in this world; else a general (zone-less) boss. Never the same boss twice
   in a row when there's a choice. The zone also sets the boss music (music.boss) and the landing-dust color. */
let lastBossId=null;
function worldBossZones(){const seen=new Set(zoneRows.join(''));return Object.values(ZONES).filter(z=>seen.has(z.letter)).map(z=>z.id);}
function bossPool(zone){const l=bossList();return zone?l.filter(d=>d.zone===zone):l.filter(d=>!d.zone||!ZONES[d.zone]);}
function pickBoss(id,cx,cz){const l=bossList(),freshPick=a=>{const f=a.filter(d=>d.id!==lastBossId);return pick(f.length?f:a);};
  if(id&&id.startsWith('zone:')){const a=bossPool(id.slice(5));if(a.length)return freshPick(a);}
  else if(id){const d=l.find(d=>d.id===id);if(d)return d;}
  const here=zoneAt(chunkIdx(cx),chunkIdx(cz));let a=bossPool(here);
  if(!a.length)a=worldBossZones().flatMap(bossPool);
  if(!a.length)a=bossPool(null);
  return freshPick(a.length?a:l);}
function bossZone(def){return def.zone&&ZONES[def.zone]||null;}
function bossDust(){const z=boss&&bossZone(boss.def);return (z&&(z.bossDust||z.ground))||'#d9c9a8';}
function bossMusic(def){const z=bossZone(def),id=z&&z.music&&z.music.boss;return id&&musicBank.index[id]?id:'boss';}
/* L28: a boss is ~50–200 parts and each one is its own draw call (per pass). Draw the untouched parts merged per
   material into a few meshes under o.g (they move, sway and wobble with it); the real part meshes stay in place,
   hidden. When a part breaks (or the boss collapses), its merge group splits back into the real meshes, so smashing
   looks exactly as before. Weak spots (own pulsing material) and spinning bits stay live. */
function bossMerge(o){
  if(!THREE.mergeGeometries)return;o.g.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(o.g.matrixWorld).invert(),groups=new Map();
  for(const part of o.parts){if(part.kind==='weak'||part.gone)continue;
    part.mesh.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh||m.isInstancedMesh||!m.visible||Array.isArray(m.material)||m.morphTargetInfluences)return;
      for(let x=m;x&&x!==o.g;x=x.parent)if(x.userData.spin||!x.visible)return;
      const geo=m.geometry,sig=m.material.uuid+'|'+(geo.index?'i':'n')+'|'+Object.keys(geo.attributes).sort().join(',')+'|'+(m.castShadow?1:0);
      (groups.get(sig)||groups.set(sig,{meshes:[],parts:new Set()}).get(sig)).meshes.push(m);groups.get(sig).parts.add(part);});}
  o.bmerge=[];
  for(const grp of groups.values()){if(grp.meshes.length<2)continue;
    const geos=grp.meshes.map(m=>{const g=m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld));
      for(const k of Object.keys(g.morphAttributes))delete g.morphAttributes[k];return g;});
    let merged=null;try{merged=THREE.mergeGeometries(geos);}catch(e){}for(const g of geos)g.dispose();
    if(!merged)continue;const mm=new THREE.Mesh(merged,grp.meshes[0].material);mm.castShadow=grp.meshes[0].castShadow;mm.receiveShadow=true;
    o.g.add(mm);const rec={mm,meshes:grp.meshes};o.bmerge.push(rec);
    for(const m of grp.meshes)m.visible=false;
    for(const part of grp.parts)(part.bm||(part.bm=[])).push(rec);}
}
function bossSplit(o,rec){ // bring one merge group back as real meshes
  if(!rec.mm)return;for(const m of rec.meshes)m.visible=true;if(rec.mm.parent)rec.mm.parent.remove(rec.mm);rec.mm.geometry.dispose();rec.mm=null;}
function bossUnmerge(o){if(o&&o.bmerge){for(const rec of o.bmerge)bossSplit(o,rec);o.bmerge=null;}}
function summonBoss(id){
  if(boss||!players.length)return;
  let cx=0,cz=0;players.forEach(p=>{cx+=p.x;cz+=p.z;});cx/=players.length;cz/=players.length;
  const def=pickBoss(id,cx,cz);lastBossId=def.id;
  const x=clamp(cx,-ARENA+90,ARENA-90),z=clamp(cz-100,-ARENA+90,ARENA-90);
  const o=makeObj(x,z,3.6,11,200,(P,g,ob)=>def.build(P,g,ob),{building:true,big:true});
  o.type='boss';o.boss=true;o.sz=99;o.s0=BOSS_SCALE;o.g.scale.setScalar(BOSS_SCALE);o.r*=BOSS_SCALE;o.h*=BOSS_SCALE;for(const p of o.parts)p.half*=BOSS_SCALE;
  initBld(o);
  for(const p of o.parts)if(p.kind==='weak'){p.phase=p.mesh.userData.phase||1;p.s0=p.mesh.scale.clone();p.mesh.material=new THREE.MeshBasicMaterial({color:'#777777'});}
  bossMerge(o);
  boss={o,def,state:'drop',y:260,vy:0,phase:1,t:0,heading:0,stompT:7,hitT:0,speed:10,smashT:0,
    phases:Math.max(...o.parts.filter(p=>p.kind==='weak').map(p=>p.phase))};
  o.g.position.y=boss.y;music(bossMusic(def));say(`Here comes ${def.name}!`);sfxClip('boss_roar',0.9)||sfx.boom();updateBossHud();
}
function bossLand(big){const o=boss.o,dust=bossDust();shake=2;sfxClip('stomp',1)||(sfx.thud(),sfx.boom());
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;puff(o.x+Math.sin(a)*o.r,1,o.z+Math.cos(a)*o.r,2,5,dust);}
  const R=o.r+(big?30:22);
  for(const p of players){const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz)||1;if(d<R){p.air=true;p.vy=Math.max(p.vy,15);p.kx+=dx/d*25;p.kz+=dz/d*25;}}
  for(const q of objects){if(q===o||!q.alive||q.boss)continue;const dx=q.x-o.x,dz=q.z-o.z,d=Math.hypot(dx,dz);if(d<R-6)queue.push({t:d*0.004,fn:()=>q.bld?collapse(q,0,dx,dz,40,true):smash(q,dx,dz,30)});}
  for(const a of animals){const dx=a.x-o.x,dz=a.z-o.z;if(Math.hypot(dx,dz)<R)launchAnimal(a,dx||1,dz,20);}
}
function updateBossHud(){
  if(!boss||boss.state==='dead'){bossHud.style.display='none';return;}
  const w=boss.o.parts.filter(p=>p.kind==='weak');bossHud.style.display='block';
  bossHud.innerHTML=`${boss.def.emoji||'👾'} ${boss.def.name}<br>`+w.sort((a,b)=>a.phase-b.phase).map(p=>p.gone?'<i class="gone">💥</i>':`<i class="${p.phase===boss.phase?'on':''}">⭐</i>`).join('');
}
function bossSay(lines,gap=2500){const n=performance.now();if(n-lastBossSay<gap)return;lastBossSay=n;say(pick(lines));}
function hitWeak(part,p,nx,nz){const b=boss,o=b.o;b.hitT=T+0.3;
  part.mesh.getWorldPosition(_wpB);breakPart(o,part,nx,nz,45,1.3);
  flash(_wpB.x,_wpB.y,_wpB.z,'#ffd60a',8,0.5);puff(_wpB.x,_wpB.y,_wpB.z,8,4,'#ffffff');
  sfxClip('bonk',1)||sfx.crash(true);sfx.boom();shake=Math.min(2,shake+1.3);o.wob=1;addScore(10);p.kx-=nx*20;p.kz-=nz*20;
  const left=o.parts.filter(q=>q.kind==='weak'&&!q.gone&&q.phase===b.phase).length;
  if(left){bossSay(b.def.taunts&&b.def.taunts.length?b.def.taunts:['Ouch!','Bonk!','Again! Again!']);updateBossHud();return;}
  if(b.phase<b.phases){b.phase++;b.speed*=1.3;b.stompT=1.2;lastBossSay=0;bossSay([b.phase===b.phases?'One more time!':"He's getting mad!"]);
    sfxClip('boss_roar',0.9)||sfx.boom();updateBossHud();return;}
  // beaten!
  b.state='dead';updateBossHud();music('victory',{loop:false,then:'drive'});bossArrows.forEach(s=>s.visible=false);lastBossSay=0;
  const dl=b.def.defeat?3.4:0;if(dl){say(b.def.defeat);queue.push({t:dl,fn:()=>say('You beat the boss!')});}else say('You beat the boss!');
  collapse(o,0,nx,nz,60,true);
  queue.push({t:2.6,fn:()=>{showBig('BOSS BEATEN!');sfx.fanfare();confetti(260);nwBtn.style.display='block';}});
  queue.push({t:4.0+dl,fn:()=>{sfx.fanfare();say('Hooray! You did it together!');}});
}
function updateBoss(dt){
  if(!boss||boss.state==='dead')return;const b=boss,o=b.o;
  if(b.state==='drop'){b.vy-=70*dt;b.y+=b.vy*dt;if(b.y<=0){b.y=0;bossLand(true);b.state='intro';b.t=2.2;}o.g.position.y=b.y;return;}
  // weak spots pulse; active ones get a bouncing arrow
  const pulse=0.5+0.5*Math.sin(T*8);let na=0;
  for(const p of o.parts){if(p.kind!=='weak'||p.gone)continue;const on=p.phase===b.phase;
    p.mesh.material.color.copy(on?_c1.copy(_c2).lerp(_c3,pulse):_c1.set('#777777'));p.mesh.scale.copy(p.s0).multiplyScalar(on?1+0.18*pulse:1);
    if(on&&na<bossArrows.length){p.mesh.getWorldPosition(_wpB);const s=bossArrows[na++],k=16;s.visible=true;s.scale.set(k,k,1);s.position.set(_wpB.x,_wpB.y+14+Math.abs(Math.sin(T*5))*5,_wpB.z);}}
  for(let i=na;i<bossArrows.length;i++)bossArrows[i].visible=false;
  if(b.state==='intro'){if((b.t-=dt)<=0){b.state='walk';bossSay(['Hit the glowing spots!'],0);}}
  else if(b.state==='walk'){
    let cx=0,cz=0;players.forEach(p=>{cx+=p.x;cz+=p.z;});cx/=players.length;cz/=players.length;
    const tx=cx+Math.sin(T*0.25)*40,tz=cz+Math.cos(T*0.25)*40,want=Math.atan2(tx-o.x,tz-o.z);
    b.heading+=clamp(angDiff(want,b.heading),-1.2*dt,1.2*dt);
    if(Math.hypot(tx-o.x,tz-o.z)>12){o.x+=Math.sin(b.heading)*b.speed*dt;o.z+=Math.cos(b.heading)*b.speed*dt;}
    o.x=clamp(o.x,-ARENA+o.r,ARENA-o.r);o.z=clamp(o.z,-ARENA+o.r,ARENA-o.r);
    b.y=Math.abs(Math.sin(T*3.5))*1.5;
    if((b.stompT-=dt)<=0){b.state='stomp';b.vy=20;}
  }else if(b.state==='stomp'){b.vy-=55*dt;b.y+=b.vy*dt;if(b.y<=0){b.y=0;bossLand(false);b.state='walk';b.stompT=rand(6,10)/(1+0.3*(b.phase-1));}}
  o.g.position.set(o.x,b.y,o.z);o.g.rotation.y=b.heading;
  if(!o.wob){o.g.rotation.x=0;o.g.rotation.z=Math.sin(T*3.5)*(b.def.sway||0.05);}
  // feet flatten whatever they walk over
  if((b.smashT-=dt)<=0){b.smashT=0.25;for(const q of objects){if(q===o||!q.alive||q.boss)continue;const dx=q.x-o.x,dz=q.z-o.z;if(Math.hypot(dx,dz)<o.r*0.85)q.bld?collapse(q,0,dx,dz,30,true):smash(q,dx,dz,25);}}
  // cars vs boss: glowing spots break, the rest of the boss boings you away
  for(const p of players){const vx=Math.sin(p.heading)*p.speed+p.kx,vz=Math.cos(p.heading)*p.speed+p.kz,spd=Math.hypot(vx,vz);
    // weak spots are placed low by design, so reach is only checked across the ground
    if((spd>3*p.sm||p.air)&&T>b.hitT)for(const q of o.parts){if(q.kind!=='weak'||q.gone||q.phase!==b.phase)continue;q.mesh.getWorldPosition(_wpB);
      const reach=p.r+q.s0.x*BOSS_SCALE*0.5+o.r*0.35;if(Math.hypot(p.x-_wpB.x,p.z-_wpB.z)<reach){const d=Math.hypot(_wpB.x-p.x,_wpB.z-p.z)||1;hitWeak(q,p,(_wpB.x-p.x)/d,(_wpB.z-p.z)/d);break;}}
    if(!boss||b.state==='dead')return;
    const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz)||1,rr=o.r*0.6+p.r;
    if(d<rr&&p.y<o.h){p.x=o.x+dx/d*rr;p.z=o.z+dz/d*rr;p.lastBump=T;p.kx+=dx/d*14;p.kz+=dz/d*14;p.speed*=0.4;o.wob=Math.max(o.wob||0,0.4);
      const n=performance.now();if(n-lastBoing>400){lastBoing=n;sfx.boing();}bossSay(['Hit the glowing spots!'],6000);}}
}


/* ---------- golden surprises (L11) ---------- */
/* Rare shiny gold things to hunt for. A golden prop at your size shows up just off screen every so often, some
   world chunks hide one (maybe too big at first: something to grow for), and some herds have a golden animal.
   Gold sparkles, sends up a light beam you can see from afar, twinkles as you get near, and a gold arrow at the
   screen edge points to the nearest one. Smashing / launching it: coins + confetti, treasure fanfare, voice, a big
   meter bonus and a ⭐ on the counter. Design can make real gold models later; this tints the normal ones. */
const GOLD_MAT=HIGH?new THREE.MeshStandardMaterial({color:'#ffc93c',metalness:0.85,roughness:0.28,emissive:'#5a3d00',emissiveIntensity:0.6})
  :new THREE.MeshLambertMaterial({color:'#ffd24d',emissive:'#7a5200'});
const BEAM_MAT=new THREE.MeshBasicMaterial({color:'#fff3a0',transparent:true,opacity:0.32,depthWrite:false,blending:THREE.AdditiveBlending});
const SPARK_MAT=E('#fff6b0');
let goldCount=0,goldT=rand(25,40);
const goldHud=document.createElement('div');goldHud.id='goldCount';$('hud').appendChild(goldHud);
const goldArrow=document.createElement('div');goldArrow.id='goldArrow';goldArrow.textContent='⭐';$('hud').appendChild(goldArrow);
{const st=document.createElement('style');st.textContent=`
:where(#goldCount){display:none;position:absolute;left:22px;top:96px;font:28px 'Lilita One',sans-serif;color:#ffd60a;text-shadow:0 3px 0 rgba(0,0,0,.35)}
:where(#goldArrow){display:none;position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;font-size:44px;line-height:64px;text-align:center;border-radius:50%;
  background:radial-gradient(#fff3a0,#ffbe0b);box-shadow:0 0 24px #ffd60a;animation:nwPulse .8s ease-in-out infinite}`;document.head.appendChild(st);}
function goldify(o,beamH){ // swap to gold and add a light beam (o.g is scaled by o.s0, so undo that on the beam)
  o.gold=true;o.g.traverse(m=>{if(m.isMesh){m.userData.origMat=m.material;m.material=GOLD_MAT;}});
  const f=o.s0||1,h=beamH||Math.max(12,40*Math.max(S,0.3)),beam=new THREE.Mesh(GEO.cyl,BEAM_MAT);
  beam.scale.set(Math.max(0.3,o.r*0.5)/f,h/f,Math.max(0.3,o.r*0.5)/f);beam.position.y=h/2/f;beam.castShadow=false;beam.userData.beam=true;o.g.add(beam);o.beam=beam;}
function ungold(o){o.gold=false;o.g.traverse(m=>{if(m.isMesh&&m.userData.origMat){m.material=m.userData.origMat;delete m.userData.origMat;}});if(o.beam){o.beam.parent&&o.beam.parent.remove(o.beam);o.beam=null;}}
function spawnGold(){ // a golden prop at the players' size, just off screen
  for(let t=0;t<8;t++){const o=spawnScatter(pick(players),false);if(!o)continue;
    if(o.bld||o.sz!==tier){o.alive=false;poolRelease(o);scene.remove(o.g);continue;}
    wakeObj(o);poolRelease(o);scene.add(o.g);goldify(o);return o;}
  return null;}
function goldFound(o,isAnimal){
  goldCount++;addScore(30);comboHit(5);grow((GROW_VAL[tier]||0)*2);if(o.rec)o.rec.gold=false;
  const x=o.x,z=o.z,y=(o.y||0)+o.h*0.6,k=Math.max(S,0.25);
  for(let i=0;i<28;i++){const c=debrisBox(GOLD_MAT.color);c.scale.set(0.6*k,0.12*k,0.6*k);c.position.set(x,y,z);const a=rand(0,Math.PI*2),f=rand(4,10)*Math.sqrt(k);
    addDebris(c,0.06*k,Math.sin(a)*f,rand(10,18)*Math.sqrt(k),Math.cos(a)*f,{life:rand(3,5)});}
  flash(x,y,z,'#ffd60a',3*k,0.5);confetti(90);sfxClip('treasure',1)||sfx.fanfare();shake=Math.min(1.5,shake+0.5);
  showBig('GOLDEN! ⭐');say(isAnimal?`You found a golden ${o.kind}!`:pick(['Golden treasure!','Shiny gold!','You found gold!']));
  goldHud.textContent='⭐ × '+goldCount;goldHud.style.display='block';}
let goldSparkT=0,goldTwinkleAt=0;
function updateGold(dt){
  if(state!=='play'||!players.length)return;
  if((goldT-=dt)<=0){goldT=rand(35,60);if(!objects.some(o=>o.gold&&o.alive&&o.scat))spawnGold();}
  const R=scatR(),view=R*1.3;let near=null,nd=1e9;const spark=(goldSparkT-=dt)<=0;if(spark)goldSparkT=0.12;
  for(const list of [objects,animals])for(const o of list){if(!o.gold||!o.alive)continue;
    let d=1e9;for(const p of players)d=Math.min(d,Math.hypot(o.x-p.x,o.z-p.z));
    if(d<nd){nd=d;near=o;}
    if(o.scat&&d>R*4){o.alive=false;scene.remove(o.g);continue;} // lost track of it: another one will turn up
    if(spark&&d<view*2){const k=Math.max(0.15,o.r*0.25),m=new THREE.Mesh(GEO.box,SPARK_MAT);m.scale.setScalar(k);
      m.position.set(o.x+rand(-o.r,o.r),(o.y||0)+rand(0,o.h),o.z+rand(-o.r,o.r));m.rotation.set(rand(0,3),rand(0,3),0);addPart(m,rand(0.4,0.8),0,rand(1,3)*Math.max(S,0.3),0);}}
  // twinkle when one comes into view
  const n=performance.now();if(near&&nd<view&&n-goldTwinkleAt>5000){goldTwinkleAt=n;sfxClip('twinkle',0.6)||sfx.pop();}
  // arrow at the screen edge toward the nearest gold when it's off screen
  goldArrow.style.display='none';if(!near||nd>R*4)return;
  v3.set(near.x,(near.y||0)+near.h*0.5,near.z).project(camera);
  if(v3.z<1&&Math.abs(v3.x)<0.92&&Math.abs(v3.y)<0.85)return;
  let ax=v3.x,ay=v3.y;if(v3.z>1){ax=-ax;ay=-ay;}const m=Math.max(Math.abs(ax)/0.88,Math.abs(ay)/0.8,1e-3);ax/=m;ay/=m;
  goldArrow.style.left=((ax+1)/2*innerWidth)+'px';goldArrow.style.top=((1-ay)/2*innerHeight)+'px';goldArrow.style.display='block';}


/* ---------- launch pads (L12) ---------- */
/* Big bouncy pads that turn up near clusters of things you can smash, sized to the cars so they matter at every
   size. Drive over one: BOING, the car flies up in a slow floaty arc (about as high as a third of the view) and
   lands with a big slam that smashes everything around it. Pads come and go like scatter and are rebuilt after a
   LEVEL UP. Design can supply the look: define buildLaunchPad() in objects.js returning a Group ~1 unit radius,
   facing up, top at y≈0.3 (logic scales it). */
const PAD_N=3,pads=[];let padT=0;
function defaultPad(){const g=new THREE.Group(),cols=['#ff006e','#ffbe0b','#06d6a0','#3a86ff','#8338ec'];
  g.add(mk('cyl',2.15,0.22,2.15,'#ffffff',0,0.11,0));
  cols.forEach((c,i)=>{const r=2-i*0.38;const m=mk('cyl',r,0.06,r,c,0,0.24+i*0.012,0);m.castShadow=false;g.add(m);});
  const top=new THREE.Group();top.position.y=0.9;top.userData.arrow=true;
  const cone=mk('cone',0.55,0.6,0.55,'#ffffff',0,0.3,0),stem=mk('box',0.22,0.5,0.22,'#ffffff',0,-0.15,0);cone.castShadow=stem.castShadow=false;top.add(cone,stem);g.add(top);
  return g;}
const padR=()=>Math.max(0.5,2.3*2.2*S); // about twice a car's width so it reads as 'drive here!' from afar
function placePad(){
  const R=scatR();
  for(let t=0;t<20;t++){const p=pick(players);
    // a cluster: a smashable thing with a few more around it
    const near=objects.filter(o=>o.alive&&!o.boss&&o.sz<=tier&&!o.falling&&Math.hypot(o.x-p.x,o.z-p.z)<R*1.4);if(!near.length)return;
    const c=pick(near);if(objects.filter(o=>o.alive&&o.sz<=tier&&Math.hypot(o.x-c.x,o.z-c.z)<10*Math.max(S,0.15)).length<3)continue;
    // the pad sits between the car and the cluster, so driving toward the stuff hits the pad first
    const r=padR(),dx=c.x-p.x,dz=c.z-p.z,d=Math.hypot(dx,dz)||1,off=Math.min(d*0.5,r*3+c.r);const x=c.x-dx/d*off,z=c.z-dz/d*off;
    if(Math.abs(x)>WB-r-2||Math.abs(z)>WB-r-2||groundH(x,z)>0)continue;
    if(objects.some(o=>o.alive&&o.sz>=tier-1&&Math.hypot(o.x-x,o.z-z)<o.r+r*0.9)||pads.some(q=>Math.hypot(q.x-x,q.z-z)<q.r*4)||players.some(q=>Math.hypot(q.x-x,q.z-z)<q.r+r*2))continue;
    const g=(typeof buildLaunchPad!=='undefined'?buildLaunchPad():defaultPad());g.scale.setScalar(r/2.15);g.position.set(x,0,z);scene.add(g);
    pads.push({g,x,z,r,sq:0});return;}}
function clearPads(){for(const q of pads)scene.remove(q.g);pads.length=0;}
function launchFromPad(p,q){
  const H=0.35*Math.max(4.5,38*Math.pow(S,0.75)),t=1.8; // height relative to the view; always ~1.8s in the air
  p.padG=8*H/(t*t);p.vy=p.padG*t/2;p.air=true;p.padT=T+1;p.trail&&(p.trail.length=0);
  const fx=Math.sin(p.heading),fz=Math.cos(p.heading);p.kx+=fx*6*p.sm;p.kz+=fz*6*p.sm;p.speed=Math.max(p.speed,p.stats.speed*p.sm*0.8);
  q.sq=1;sfxClip('pad',1)||sfx.boing();sfx.jump();puff(q.x,0.3,q.z,8,q.r*0.4,'#ffffff');shake=Math.min(1.2,shake+0.3);
  const n=performance.now();if(n-lastPadSay>8000&&Math.random()<0.6){lastPadSay=n;say(pick(['Super bounce!','Big jump!','Wheee!']));}}
let lastPadSay=0;
function updatePads(dt){
  if(state!=='play'||!players.length)return;
  const R=scatR();
  for(let i=pads.length-1;i>=0;i--){const q=pads[i];let d=1e9;for(const p of players)d=Math.min(d,Math.hypot(q.x-p.x,q.z-p.z));
    if(d>R*2.4){scene.remove(q.g);pads.splice(i,1);continue;}
    q.sq=Math.max(0,q.sq-dt*3);const k=q.r/2.15;q.g.scale.set(k*(1+0.15*q.sq),k*(1-0.5*q.sq*Math.sin(q.sq*12)),k*(1+0.15*q.sq));
    q.g.traverse(m=>{if(m.userData.arrow){m.position.y=0.9+Math.abs(Math.sin(T*3+i))*0.5;m.rotation.y+=dt*2;}});
    for(const p of players)if(!p.air&&T>(p.padT||0)&&Math.hypot(p.x-q.x,p.z-q.z)<q.r*0.9)launchFromPad(p,q);}
  if((padT-=dt)<=0){padT=2;if(pads.length<PAD_N)placePad();}}

/* ---------- "can I smash it?" signals ---------- */
// Pulsing red ring = too big for you, grow first. Green flash = you just got big enough for these.
// Close to a too-big thing you also get a floating "grow first" badge; bumping one pops "GROW BIGGER!".
const SIGNAL_COL={no:'#ff2d55',yes:'#3ddc84'},RING_MAX=80; // TODO(design): tune signal colors
const ringGeo=(()=>{const g=new THREE.RingGeometry(0.77,1,40);g.rotateX(-Math.PI/2);return g;})();
function ringLayer(color){const m=new THREE.InstancedMesh(ringGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}),RING_MAX);
  m.frustumCulled=false;m.count=0;m.renderOrder=2;scene.add(m);return m;}
const redRings=ringLayer(SIGNAL_COL.no),greenRings=ringLayer(SIGNAL_COL.yes);
const badgeTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle=SIGNAL_COL.no;x.beginPath();x.arc(64,64,60,0,Math.PI*2);x.fill();x.lineWidth=8;x.strokeStyle='#fff';x.stroke();
  x.fillStyle='#fff';x.beginPath();x.moveTo(64,14);x.lineTo(98,52);x.lineTo(76,52);x.lineTo(76,70);x.lineTo(52,70);x.lineTo(52,52);x.lineTo(30,52);x.closePath();x.fill();
  x.font='44px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🚙',64,96);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const badges=[0,1,2,3].map(()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex,depthTest:false,transparent:true}));s.renderOrder=3;s.visible=false;scene.add(s);return s;});
let greenT=0,lastHint=0,lastHintSay=0;
const _m4=new THREE.Matrix4(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_qi=new THREE.Quaternion();
function updateSignals(dt){
  greenT=Math.max(0,greenT-dt);
  if(state!=='play'||!players.length){redRings.count=greenRings.count=0;badges.forEach(b=>b.visible=false);return;}
  const R=camDist*1.1+8,close=camDist*0.3+2,near=[];
  for(const list of [objects,animals])for(const o of list){if(!o.alive||o.falling||o.boss)continue;
    const red=o.sz>tier;if(!red&&!(greenT>0&&o.sz===tier))continue;
    let d=1e9;for(const p of players)d=Math.min(d,Math.hypot(o.x-p.x,o.z-p.z)-o.r-p.r);
    if(d<R)near.push([o,d,red]);}
  near.sort((a,b)=>a[1]-b[1]);
  let nr=0,ng=0,nb=0;const pulse=1+0.07*Math.sin(T*7);
  for(const [o,d,red] of near){
    if(red?nr>=RING_MAX:ng>=RING_MAX)continue;
    const s=((o.fr||o.r)+0.25*S)/0.77*pulse;_v.set(o.x,groundH(o.x,o.z)+0.07,o.z);_s.set(s,1,s);
    (red?redRings:greenRings).setMatrixAt(red?nr++:ng++,_m4.compose(_v,_qi,_s));
    if(red&&d<close&&nb<badges.length){const b=badges[nb++],k=camDist*0.07;b.visible=true;b.scale.set(k,k,1);
      b.position.set(o.x,o.h+k*0.7+Math.sin(T*5)*k*0.1,o.z);}}
  for(let i=nb;i<badges.length;i++)badges[i].visible=false;
  redRings.count=nr;greenRings.count=ng;redRings.instanceMatrix.needsUpdate=greenRings.instanceMatrix.needsUpdate=true;
  redRings.material.opacity=0.85+0.15*Math.sin(T*7);greenRings.material.opacity=Math.min(1,greenT);
}
function growHint(o){
  const n=performance.now();if(n-lastHint<1500)return;lastHint=n;
  v3.set(o.x,o.h+1,o.z).project(camera);const el=document.createElement('div');el.className='growPop';el.innerHTML='🚙⬆️ GROW BIGGER!';
  el.style.left=((v3.x+1)/2*innerWidth)+'px';el.style.top=((1-v3.y)/2*innerHeight)+'px';$('hud').appendChild(el);setTimeout(()=>el.remove(),1400);
  if(n-lastHintSay>7000){lastHintSay=n;say(pick(['Grow bigger first!','Too big! Smash smaller stuff!','Get bigger!']));}
}
{const st=document.createElement('style');st.textContent=`
:where(.growPop){position:absolute;transform:translate(-50%,-50%);font:28px 'Lilita One',sans-serif;color:#fff;background:${SIGNAL_COL.no};padding:6px 16px;border-radius:999px;
  border:4px solid #fff;white-space:nowrap;pointer-events:none;animation:growPop 1.4s ease-out forwards}
@keyframes growPop{0%{opacity:0;margin-top:10px;scale:.6}15%{opacity:1;scale:1.1}25%{scale:1}100%{opacity:0;margin-top:-50px}}`;document.head.appendChild(st);}

/* ---------- level-up garage (L17) ---------- */
/* Every car-tier unlock (tiny, medium, huge) opens a garage: the world stops and the players drop into a round
   showroom (built just outside the arena, scaled to their size) with up to GARAGE_N parked cars each on glowing pads in
   their color. Drive into one to pick it (burst, fanfare, its name). Drive the new car around until everyone has picked,
   then GO! (A / START / click) rolls a fresh world at the same size and resets the combo.
   Design hooks (all optional): `function buildGarage(){…}` in cars.js returns a THREE.Group to replace the placeholder
   showroom (floor top at y=0, about GARAGE_R units in radius at car scale 1, open toward +Z); `.garageCard` (stat cards,
   `.soon` on placeholders, `--pc` = player color) and `#garageGo` can be styled in style.css. */
const GARAGE_N=4,GARAGE_R=26,GARAGE_X=0,GARAGE_Z=ARENA+260;
let garage=null,garageSkip=false;
/* Cars we still want (D12). A tier with fewer than GARAGE_N real cars fills the rows with these as blocky placeholder
   cars (a ❓ on their card). A car in cars.js / cars.json with the same name replaces its placeholder automatically. */
const GARAGE_WANTED=[
  {name:'Rocket Sled',emoji:'🛷',tier:3,speed:31,r:2.2,col:'#ff595e'},
  {name:'Robo Walker',emoji:'🤖',tier:3,speed:22,r:2.6,col:'#8d99ae'},
  {name:'Spike-o-saurus',emoji:'🦕',tier:3,speed:23,r:2.7,col:'#57cc99'},
  {name:'Hover Zoomer',emoji:'🛸',tier:3,speed:29,r:2.3,col:'#9b5de5'},
  {name:'Mystery Car',emoji:'❓',tier:-1,speed:25,r:2.3,col:'#ffbe0b'}]; // tier -1: fills any tier still short
const garagePH={};
function garagePlaceholder(w,t){const k=w.name+(w.tier<0?' '+t:'');
  return garagePH[k]||(garagePH[k]={name:w.name,emoji:w.emoji,speed:w.speed,r:w.r,tier:t,placeholder:true,build:()=>{
    const g=new THREE.Group(),wheels=[];
    g.add(mk('box',2.4,1.1,4.2,w.col,0,1.05,0),mk('box',2.0,1.0,2.2,'#e9f5ff',0,2.1,-0.3),mk('sph',0.8,0.8,0.8,null,0,3.0,-0.3,E('#ffd60a')));
    for(const [x,z] of [[-1.35,1.4],[1.35,1.4],[-1.35,-1.4],[1.35,-1.4]]){const wh=new THREE.Mesh(GEO.wheel,M('#222222'));
      wh.scale.set(0.55,1,1);wh.position.set(x,0.5,z);wh.castShadow=true;wh.userData.r=0.5;g.add(wh);wheels.push(wh);}
    return {g,wheels,ex:new THREE.Vector3(0,0.8,-2.2),h:3.4};}});}
function garageCarIdx(c){let i=CARS.indexOf(c);if(i<0){CARS.push(c);i=CARS.length-1;}return i;} // placeholders join CARS once picked
function garageLists(t){ // → one list of car entries per player slot: real cars first, then wanted placeholders
  const real=CARS.filter(c=>carTierOf(c)===t&&!c.placeholder).sort(()=>Math.random()-0.5);
  const ph=GARAGE_WANTED.filter(w=>(w.tier===t||w.tier<0)&&!CARS.some(c=>c.name===w.name&&!c.placeholder)).map(w=>garagePlaceholder(w,t));
  const named=ph.filter(c=>c.name!=='Mystery Car'),myst=ph.filter(c=>c.name==='Mystery Car'),pool=real.concat(named),n=GARAGE_N,out=[[],[]];
  if(players.length>1&&pool.length>=n+2){for(let i=0;i<pool.length&&(out[0].length<n||out[1].length<n);i++)out[i%2].push(pool[i]);} // different cars each
  else{out[0]=pool.slice(0,n);out[1]=out[0].slice();}
  for(const l of out)for(const c of myst)if(l.length<3)l.push(c); // a row that's really short gets a mystery car
  return out;}
const garagePips=(v,lo,hi)=>'●'.repeat(clamp(Math.round(1+(v-lo)/(hi-lo)*4),1,5));
const GARAGE_WEAPON={bubble:'🫧',cannon:'💣',rocket:'🚀'};
function garageCard(c,col){const el=document.createElement('div');el.className='garageCard'+(c.placeholder?' soon':'');el.style.setProperty('--pc',col);
  // icons and dots, never words: speed ⚡, power 💪, handling 🌀, weapon + perk icon (L18)
  el.innerHTML=`<b>${c.emoji||'🚗'}${c.placeholder?'❓':''}</b><span>⚡${garagePips(c.speed,20,32)}</span><span>💪${garagePips(carPower(c),1,5)}</span><span>🌀${garagePips(carHandling(c),1,5)}</span><span>${GARAGE_WEAPON[carWeapon(c)]||'🫧'}${carPerk(c)?`<i class="perk">${PERK_ICON[carPerk(c)]||'⭐'}</i>`:''}</span>`;
  $('tags').appendChild(el);return el;}
function garageShowroom(){
  if(typeof buildGarage==='function'){try{const g=buildGarage();if(g)return g;}catch(e){console.warn('buildGarage',e);}}
  const g=new THREE.Group(),R=GARAGE_R;
  const floor=mk('cyl',R*2,0.4,R*2,'#3a3f5c',0,-0.2,0);floor.castShadow=false;g.add(floor);
  for(let i=0;i<8;i++){const m=mk('box',R*0.25,0.02,R*1.7,i%2?'#4a5075':'#3a3f5c',(i-3.5)*R*0.25,0.01,0);m.castShadow=false;g.add(m);} // floor stripes
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(R,R,2.4,48,1,true,Math.PI*0.3,Math.PI*1.4),litMat({color:'#ffd60a',side:THREE.DoubleSide}));
  wall.position.y=1.2;wall.receiveShadow=true;g.add(wall); // open at the front so the camera sees in
  g.add(mk('box',R*1.2,7,1,'#e63946',0,3.5,-R+0.6),mk('box',R*1.2,1.2,1.2,'#ffffff',0,7.3,-R+0.6));
  for(let i=0;i<7;i++)g.add(mk('box',R*0.17,R*0.17*0.6,0.3,i%2?'#111111':'#ffffff',(i-3)*R*0.17,4,-R+1.25)); // checkered banner
  return g;}
function openGarage(){
  if(garageSkip||!players.length){newCars();return;}
  const t=carTierNow(),sG=GROW_S[tier];
  if(!garage){
    const g=garageShowroom();g.position.set(GARAGE_X,0,GARAGE_Z);scene.add(g);
    garage={g,x:GARAGE_X,z:GARAGE_Z,pads:[],picked:{},ready:false,goT:0};
    showBig('🏁 GARAGE!');sfx.fanfare();say('Pick your ride!');clearPads();shake=0;goldArrow.style.display='none';
  }
  garage.tier=t;garage.sG=sG;garage.g.scale.setScalar(sG);garage.picked={};garage.ready=false;goBtn.style.display='none';
  players.forEach((p,i)=>{p.x=garage.x+(i-(players.length-1)/2)*6*sG;p.z=garage.z+12*sG;p.y=0;p.vy=0;p.speed=0;p.kx=p.kz=0;p.air=false;
    p.heading=Math.PI;p.stuck=false;p.trail.length=0;p.markT=4;});
  camT.set(garage.x,0,garage.z+sG*1.5);garageRows();}
// (re)lay the parked cars for every player who hasn't picked yet: one player gets a row of 4, two players a 2×2 block each side
function garageRows(){
  const G=garage,sG=G.sG,lists=garageLists(G.tier);
  for(const pd of G.pads.filter(q=>!q.gone&&G.picked[q.owner]==null))garagePadOff(pd,false);
  G.pads=G.pads.filter(q=>!q.gone);
  for(const p of players){if(G.picked[p.idx]!=null)continue;const l=lists[p.idx]||lists[0];
    l.forEach((c,k)=>{let x,z;
      if(players.length>1){const side=p.idx===0?-1:1;x=side*(9.5+(k%2)*7.5);z=-11+Math.floor(k/2)*9.5;}
      else{x=(k-(l.length-1)/2)*7;z=-6;}
      const model=carMerge(c.build());model.g.position.set(x,0.25,z);G.g.add(model.g);
      const pad=mk('cyl',6,0.3,6,null,x,0.1,z,E(p.color));pad.castShadow=false;G.g.add(pad);
      const beam=new THREE.Mesh(MARK_BEAM_GEO,new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,opacity:0.18,depthWrite:false,
        blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));beam.scale.set(3,12,3);beam.position.set(x,0,z);G.g.add(beam);
      G.pads.push({car:c,owner:p.idx,lx:x,lz:z,model,pad,beam,card:garageCard(c,p.color),spin:rand(0,6)});});}}
function garagePadOff(pd,poof){pd.gone=true;garage.g.remove(pd.model.g,pd.pad,pd.beam);carUnmerge(pd.model);pd.beam.material.dispose();pd.card.remove();
  if(poof){const w=garageW(pd);puff(w.x,garage.sG*1.5,w.z,6,1.2*garage.sG,'#ffffff');}}
const _gw=new THREE.Vector3();
function garageW(pd){return _gw.set(garage.x+pd.lx*garage.sG,0,garage.z+pd.lz*garage.sG);}
function garagePick(p,pd){
  const G=garage,w=garageW(pd),x=w.x,z=w.z,s=G.sG;
  G.picked[p.idx]=garageCarIdx(pd.car);garagePadOff(pd,false);
  flash(x,s*1.5,z,p.color,5*s,0.5);flash(x,s*1.5,z,'#ffffff',3.5*s,0.35);puff(x,s*1.5,z,14,2*s,'#ffd60a');confetti(60);shake=Math.min(1.5,shake+1);
  sfxClip('levelup',0.8,1.1)||sfx.fanfare();sfx.crash(true);
  p.setCar(G.picked[p.idx],true);p.markT=3;
  for(const q of G.pads)if(!q.gone&&q.owner===p.idx)garagePadOff(q,true); // the other cars in your row go poof
  G.pads=G.pads.filter(q=>!q.gone);
  if(players.every(q=>G.picked[q.idx]!=null))G.goT=1.6;}
function updateGarage(dt,src){
  const G=garage,s=G.sG;
  for(const pd of G.pads){pd.spin+=dt*0.7;pd.model.g.rotation.y=pd.spin;const w=garageW(pd);
    v3.set(w.x,(pd.model.h+2.2)*s,w.z).project(camera);pd.card.style.left=((v3.x+1)/2*innerWidth)+'px';pd.card.style.top=((1-v3.y)/2*innerHeight)+'px';}
  for(const p of players){
    for(const pd of G.pads){const w=garageW(pd),dx=p.x-w.x,dz=p.z-w.z,d=Math.hypot(dx,dz)||0.01,rr=p.r+2.2*s;if(d>=rr)continue;
      if(pd.owner===p.idx&&G.picked[p.idx]==null){garagePick(p,pd);break;}
      p.x=w.x+dx/d*rr;p.z=w.z+dz/d*rr;p.speed*=0.5; // someone else's car (or you already picked): it's solid
      if(T-p.lastBump>0.4){sfx.boing();p.lastBump=T;}}
    const dx=p.x-G.x,dz=p.z-G.z,d=Math.hypot(dx,dz),lim=(GARAGE_R-1.5)*s-p.r; // showroom wall
    if(d>lim){p.x=G.x+dx/d*lim;p.z=G.z+dz/d*lim;p.speed*=0.5;}}
  if(players.length===2){const [a,b]=players,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||0.01,rr=a.r+b.r;
    if(d<rr){const ov=(rr-d)/2;a.x-=dx/d*ov;a.z-=dz/d*ov;b.x+=dx/d*ov;b.z+=dz/d*ov;}}
  if(G.goT>0&&(G.goT-=dt)<=0){G.ready=true;goBtn.style.display='block';say("Let's go!");sfx.join();}
  if(G.ready)for(const k in src)if(src[k].joinP){garageGo();return;}}
function garageGo(){
  if(!garage||!garage.ready)return;
  for(const pd of garage.pads)garagePadOff(pd,false);scene.remove(garage.g);garage=null;goBtn.style.display='none';
  combo=0;comboT=0;sfxPitch=1;rollWorld(true);
  music('drive');showBig('GO!');sfx.fanfare();confetti(120);players.forEach(p=>introCar(p,1.6));}
const goBtn=document.createElement('button');goBtn.id='garageGo';goBtn.innerHTML='🏁 GO!<small>A / START</small>';
goBtn.onclick=e=>{e.stopPropagation();garageGo();};document.body.appendChild(goBtn);
{const st=document.createElement('style');st.textContent=`
:where(.garageCard){position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 10px;
  border-radius:16px;background:rgba(20,24,40,.82);border:4px solid var(--pc,#fff);color:#fff;font:18px 'Lilita One',sans-serif;line-height:1.1;pointer-events:none;white-space:nowrap}
:where(.garageCard b){font-size:34px}
:where(.garageCard span){color:#ffd60a;letter-spacing:1px}
:where(.garageCard.soon){opacity:.8;border-style:dashed}
:where(#garageGo){display:none;position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:20;font:46px 'Lilita One',sans-serif;color:#fff;
  background:#06d6a0;border:6px solid #fff;border-radius:30px;padding:14px 50px;box-shadow:0 8px 0 rgba(0,0,0,.25);cursor:pointer;animation:nwPulse .8s ease-in-out infinite}
:where(#garageGo small){display:block;font:16px Nunito,sans-serif;font-weight:900;opacity:.9}`;document.head.appendChild(st);}

/* ---------- camera & HUD ---------- */
function updateCamera(dt,t){
  if(state!=='play'||!players.length){const a=t*0.08;camera.position.set(Math.sin(a)*95,62,Math.cos(a)*95);camera.lookAt(0,0,0);
    sun.position.set(30,80,30);sun.target.position.set(0,0,0);setShadow(80);return;}
  camKick*=Math.pow(0.3,dt);
  const base=camBase(S)*(1+camKick+3*breakFly*breakFly),bossOn=boss&&boss.state!=='drop'&&boss.state!=='dead';
  const pts=players.map(p=>[p.x,p.z]);if(!bossOn&&!garage)tetherPlayers(dt,spreadOf(pts),base);
  if(bossOn)pts.push([boss.o.x,boss.o.z],[boss.o.x,boss.o.z+boss.o.r*0.5]); // keep the boss in view, weighted so it isn't under the HUD
  let cx=0,cz=0;pts.forEach(q=>{cx+=q[0];cz+=q[1];});cx/=pts.length;cz/=pts.length;
  const top=bossOn?Math.max(base*CAM_ZOOM,125*Math.max(1,S*0.6)):base*CAM_ZOOM;
  let want=clamp(base+spreadOf(pts)*0.9,base,top);
  if(garage){cx=garage.x;cz=garage.z+garage.sG*1.5;want=garage.sG*46*Math.max(1,1.78/camera.aspect);} // the whole showroom in view
  camDist+=(want-camDist)*Math.min(1,dt*2);
  camT.x+=(cx-camT.x)*Math.min(1,dt*4);camT.z+=(cz-camT.z)*Math.min(1,dt*4);
  const el=0.95,shK=clamp(camDist/38,0.06,1);shake*=Math.pow(0.02,dt);const sx=rand(-1,1)*shake*shK,sy=rand(-1,1)*shake*shK;
  camera.position.set(camT.x+sx,camDist*Math.sin(el)+sy,camT.z+camDist*Math.cos(el));camera.lookAt(camT.x+sx*0.5,0,camT.z-camDist*0.05);
  {const nr=clamp(camDist*0.04,0.04,0.5);if(Math.abs(camera.near-nr)>nr*0.15){camera.near=nr;camera.updateProjectionMatrix();}} // close-up at micro
  {const zid=zoneXZ(camT.x,camT.z),z=ZONES[zid],sk=z&&z.sky,k=Math.min(1,dt*1.2);   // themed zones tint the sky
    zoneAudio(garage?null:zid,dt,!!garage);                                    // …and pick its music + ambient (L22)
    skyU.top.value.lerp(_skyT.set(sk&&sk.top||SKY_TOP),k);skyU.bot.value.lerp(_skyB.set(sk&&sk.horizon||SKY_HORIZON),k);scene.fog.color.copy(skyU.bot.value);}
  sun.position.set(camT.x+30,80+camDist,camT.z+30);sun.target.position.set(camT.x,0,camT.z);sc.far=260+camDist*2;setShadow(camDist*1.1+3);
  scene.fog.near=camDist*1.8+100;scene.fog.far=scene.fog.near+160;
}
// two players drifting apart: once the zoom is maxed out, the trailing car (the one not driving away) is pulled along
function tetherPlayers(dt,ps,base){
  if(players.length<2)return;const lim=base*(CAM_ZOOM-1)/0.9;if(ps<=lim)return;
  const [a,b]=players,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
  const va=-(Math.sin(a.heading)*ux+Math.cos(a.heading)*uz)*a.speed,vb=(Math.sin(b.heading)*ux+Math.cos(b.heading)*uz)*b.speed;
  const tr=Math.abs(va-vb)>0.5?(va>vb?b:a):(a.markT>b.markT?b:a),ld=tr===a?b:a,sg=tr===a?1:-1; // tie (both parked): the one that just teleported leads
  if(ps>lim*3){besideCar(tr,ld);puff(tr.x,S,tr.z,8,1.4*Math.max(S,.3),'#ffffff');sfx.pop();return;} // way off (teleport): pop it back next to the leader
  const pull=Math.min(ps-lim,lim)*4.5*dt;tr.kx+=sg*ux*pull;tr.kz+=sg*uz*pull;}
let lastSh=0;function setShadow(s){if(Math.abs(s-lastSh)<Math.max(0.3,s*0.04))return;lastSh=s;sc.left=-s;sc.right=s;sc.top=s;sc.bottom=-s;sc.updateProjectionMatrix();}
const v3=new THREE.Vector3();
function updateHUD(){
  if(state!=='play')return;
  $('meterFill').style.width=Math.min(100,levelScore/goal*100)+'%';
  $('levelTxt').textContent='SMASH LEVEL '+level;$('count').textContent=smashCount+(smashCount===1?' smash!':' smashes!');
  updateSizeHUD();updateComboHUD();soundHint.style.display=AC&&AC.state!=='running'&&!muted?'block':'none';
  for(const p of players){v3.set(p.x,p.markTop||p.y+p.model.h*dispScale()+1.2*Math.max(S,.3),p.z).project(camera); // tag sits on top of the arrow
    p.tag.style.left=((v3.x+1)/2*innerWidth)+'px';p.tag.style.top=((1-v3.y)/2*innerHeight)+'px';
    p.tag.textContent=p.stuck?'💥 JUMP = BOOM!':p.nameT>0?`${p.stats.emoji} ${p.stats.name}`:`P${p.idx+1}`;p.tag.style.background=p.stuck?SIGNAL_COL.no:p.color;}
  const tp=players.find(q=>q.src==='touch');if(tp){$('bJump').textContent=tp.stuck?'💥':'JUMP';$('bSwap').textContent=levelReady?'⬆️':'🔄';bFire.style.display='flex';}
}

/* ---------- loop ---------- */
let last=performance.now(),T=0;
music('title'); // starts on the first tap/key (browsers need a gesture before audio)
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  const gpIn=readGP();
  const src=Object.assign({kb1:readKB(KB.kb1),kb2:readKB(KB.kb2)},gpIn);
  if(touchUsed)src.touch={x:touch.x,z:touch.z,boost:touch.boost,jumpP:touch.jumpP,swapP:touch.swapP,fire:touch.fire,joinP:touch.boost||touch.jumpP};
  if(state==='start'){const gx=Object.values(gpIn).reduce((a,g)=>Math.abs(g.x||0)>Math.abs(a)?g.x:a,0),sx=gx<-0.6?-1:gx>0.6?1:0;
    if(sx&&sx!==pickX)setPick(sx<0?'bedroom':'outside');pickX=sx;
    for(const k in gpIn)if(gpIn[k].joinP){startGame();break;}}
  if(state==='pause'){pauseInput(gpIn);updateMusic();renderer.render(scene,camera);pressed.clear();touch.jumpP=false;touch.swapP=false;return;}
  if(state==='play'&&Object.values(gpIn).some(g=>g.startP)){if(garage&&garage.ready)garageGo();else pause();pressed.clear();return;}
  T+=dt; // game time stands still while paused
  if(state==='play'){
    for(const k in src){const s=src[k];if(s.joinP&&players.length<2&&!players.some(p=>p.src===k)){addPlayer(k);s.jumpP=false;}}
    for(const p of players){const s=src[p.src]||{x:0,z:0};if(levelReady&&(s.levelP||s.swapP))levelUp();else if(s.fire&&!garage)shoot(p);p.update(dt,s);}
    if(garage)updateGarage(dt,src);
  }
  updateGrowth(dt);updateStreaming(dt);
  if(state==='play'&&!garage){collisions();updateBoss(dt);}
  for(let i=queue.length-1;i>=0;i--){queue[i].t-=dt;if(queue[i].t<=0){const f=queue[i].fn;queue.splice(i,1);f();}}
  updateRoom(dt);updateObjects(dt);updateCollapses(dt);updateSquish(dt);updateCombo(dt);if(!garage)updateGold(dt);if(!garage){updatePads(dt);updateScatter(dt);updateAnimals(dt);}updateRollers(dt);updateSpin(dt);updateShots(dt);updatePerks(dt);updateDebris(dt);updateParts(dt);updatePuffs(dt);
  updateMusic();updateCamera(dt,T);updateSignals(dt);cullChunks();updateHUD();
  renderer.render(scene,camera);
  pressed.clear();touch.jumpP=false;touch.swapP=false;
}
propsReady.then(()=>{buildWorld();captureHome();updateStreaming(0,true);last=performance.now();requestAnimationFrame(loop);});
/* __sp.spots(): draws the spots of the built chunks as see-through tiles (colored by kind) so layouts can be checked; again to hide. */
let spotView=null;
function showSpots(on){if(spotView){scene.remove(spotView);spotView.traverse(m=>{if(m.geometry)m.geometry.dispose();});spotView=null;}
  if(on===false)return 'off';const g=new THREE.Group(),cols={},count={};
  for(const c of chunks.values())for(const q of c.spots){count[q.kind]=(count[q.kind]||0)+1;
    const col=cols[q.kind]||(cols[q.kind]=new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(Object.keys(cols).length*0.17%1,0.9,0.55),transparent:true,opacity:0.35,depthWrite:false}));
    const m=new THREE.Mesh(new THREE.PlaneGeometry(q.hx*2,q.hz*2),col);m.rotation.set(-Math.PI/2,0,Math.atan2(q.sn,q.cs));m.position.set(q.x,groundH(q.x,q.z)+0.06,q.z);g.add(m);}
  scene.add(g);spotView=g;return count;}
window.__sp={room:(on=true)=>{rollWorld(true,on?"bedroom":"outside");return on?"bedroom":"outside";},spots:(on)=>spotView&&on!==true?showSpots(false):showSpots(on),mega,explode,addScore,chunks,grow,newWorld,building:demoBuilding,animals,zone:testZone,zones:ZONES,gold:spawnGold,pad:placePad,pads,
  boss(id){if(!giant){tier=SIZES.length-1;growth=MAX_GROW;levelReady=true;levelUp();newCars(true);}if(!boss)summonBoss(id);return boss&&boss.def.name;}, // __sp.boss('shelldozer')
  level(n=1,skipGarage){garageSkip=!!skipGarage;for(let i=0;i<n&&!giant;i++){growth=GROW_AT[tier+1];levelReady=true;levelUp();}return giant?'GIANT':SIZES[tier];}, // jump ahead n sizes (skipGarage: just hand out new cars)
  garage(){openGarage();return garage&&garage.tier;},garageGo:()=>garageGo(),
  tp(x,z,i=0){const p=players[i];if(p){p.x=x;p.z=z;p.y=groundH(x,z);p.markT=3;camT.set(x,0,z);}},
  carStats,perk(name,i=0){const p=players[i];if(!p)return;p.perk=name||null;p.perkT=0.5;return carStats(p.stats);}, // __sp.perk('magnet')
  stats(){let l=0;chunks.forEach(c=>l+=c.loaded);const i=renderer.info.render;return {chunks:l,objects:objects.length,awake:objects.filter(o=>!o.sleep).length,debris:debris.length,calls:i.calls,tris:i.triangles};}};
