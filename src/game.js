/* Smash Party — game logic: debris, smashing, respawn, players, input, collisions, camera, loop. Owner: Claude Code (logic). */
/* ---------- debris & particles ---------- */
const debris=[],parts=[],DEBRIS_MAX=IS_PHONE?220:420;
function addDebris(m,half,vx,vy,vz,opts={}){
  if(!m.parent)scene.add(m);
  debris.push({m,half,vx,vy,vz,ax:rand(-9,9),ay:rand(-9,9),az:rand(-9,9),life:opts.life||rand(6,9),settled:false,s0:m.scale.clone(),g:opts.g||32,confetti:!!opts.confetti});
  if(debris.length>DEBRIS_MAX)for(let i=0;i<debris.length-DEBRIS_MAX;i++)debris[i].life=Math.min(debris[i].life,0.6);
}
function updateDebris(dt){
  for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;
    if(d.life<=0){scene.remove(d.m);debris.splice(i,1);continue;}
    if(d.life<0.8){const k=Math.max(0.01,d.life/0.8);d.m.scale.set(d.s0.x*k,d.s0.y*k,d.s0.z*k);}
    const p=d.m.position;
    if(d.settled){
      for(const pl of players){const dx=p.x-pl.x,dz=p.z-pl.z,r=pl.r+d.half;
        if(dx*dx+dz*dz<r*r&&Math.abs(pl.speed)>4&&pl.y<2*S){const f=Math.abs(pl.speed);d.settled=false;
          d.vx=Math.sin(pl.heading)*f*0.7+dx*2;d.vz=Math.cos(pl.heading)*f*0.7+dz*2;d.vy=rand(4,9);d.ax=rand(-10,10);d.ay=rand(-10,10);d.az=rand(-10,10);d.life=Math.max(d.life,3);}}
      continue;}
    if(d.confetti){d.vy=Math.max(d.vy-d.g*dt,-5);d.vx*=0.985;d.vz*=0.985;}else d.vy-=d.g*dt;
    p.x+=d.vx*dt;p.y+=d.vy*dt;p.z+=d.vz*dt;
    d.m.rotation.x+=d.ax*dt;d.m.rotation.y+=d.ay*dt;d.m.rotation.z+=d.az*dt;
    if(Math.abs(p.x)>ARENA){p.x=Math.sign(p.x)*ARENA;d.vx*=-0.4;}
    if(Math.abs(p.z)>ARENA){p.z=Math.sign(p.z)*ARENA;d.vz*=-0.4;}
    const gh=groundH(p.x,p.z)+d.half*0.8;
    if(p.y<gh){p.y=gh;
      if(d.confetti){d.settled=true;continue;}
      d.vy=-d.vy*0.35;d.vx*=0.6;d.vz*=0.6;d.ax*=0.5;d.ay*=0.5;d.az*=0.5;
      if(Math.abs(d.vy)<2&&d.vx*d.vx+d.vz*d.vz<2){d.settled=true;d.vy=0;}}
  }
}
function addPart(m,life,vx=0,vy=0,vz=0,grow=0,fade=false){scene.add(m);parts.push({m,life,max:life,vx,vy,vz,grow,fade,s0:m.scale.x});}
function updateParts(dt){
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;
    if(p.life<=0){scene.remove(p.m);if(p.fade)p.m.material.dispose();parts.splice(i,1);continue;}
    const k=p.life/p.max;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;
    p.m.scale.setScalar(p.grow?p.s0*(1+p.grow*(1-k)):p.s0*k);if(p.fade)p.m.material.opacity=k*0.75;}
}
function puff(x,y,z,n,size,color='#f4ecdf'){
  for(let i=0;i<n;i++){const m=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,depthWrite:false}));
    m.position.set(x+rand(-1,1),y+rand(0,1),z+rand(-1,1));m.scale.setScalar(size*rand(.7,1.3));addPart(m,rand(.5,.9),rand(-3,3),rand(1,3),rand(-3,3),1.6,true);}
}
function flash(x,y,z,color,size,life){const m=new THREE.Mesh(GEO.sph,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false}));
  m.position.set(x,y,z);m.scale.setScalar(size);addPart(m,life,0,2,0,6,true);}

/* ---------- smashing ---------- */
let score=0,levelScore=0,level=1,goal=100,smashCount=0,shake=0;
const queue=[];
const _wp=new THREE.Vector3(),_q=new THREE.Quaternion(),_ws=new THREE.Vector3();
// send one part flying: whole parts fly off intact, others shatter into `n` boxes. vyK scales the upward kick.
function breakPart(o,part,nx,nz,power,vyK=1){
  if(part.gone)return;part.gone=true;const m=part.mesh;
  m.traverse(x=>x.userData.dead=true); // keeps it hidden in the chunk's instanced copy
  m.getWorldPosition(_wp);const out=Math.atan2(_wp.x-o.x,_wp.z-o.z);
  if(part.whole){
    m.getWorldQuaternion(_q);m.getWorldScale(_ws);
    scene.add(m);m.position.copy(_wp);m.quaternion.copy(_q);m.scale.copy(_ws);
    const f=power*rand(.4,1.0);
    addDebris(m,part.half,nx*f+Math.sin(out)*rand(1,5)+rand(-3,3),rand(4,11)*(0.6+power/45)*vyK,nz*f+Math.cos(out)*rand(1,5)+rand(-3,3));
  }else{
    m.getWorldScale(_ws);const s=_ws,vol=s.x*s.y*s.z/part.n;const cs0=clamp(Math.cbrt(vol),0.3,2.0);
    for(let i=0;i<part.n;i++){const cs=cs0*rand(.7,1.15);
      const c=new THREE.Mesh(GEO.box,m.material);c.castShadow=true;c.scale.set(cs*rand(.8,1.2),cs*rand(.6,1.1),cs*rand(.8,1.2));
      c.position.set(_wp.x+rand(-s.x/2,s.x/2)*.8,_wp.y+rand(-s.y/2,s.y/2)*.8,_wp.z+rand(-s.z/2,s.z/2)*.8);c.rotation.set(rand(0,3),rand(0,3),rand(0,3));
      const f=power*rand(.3,.85),oa=Math.atan2(c.position.x-o.x,c.position.z-o.z);
      addDebris(c,cs*0.4,nx*f+Math.sin(oa)*rand(2,7),rand(5,13)*(0.6+power/45)*vyK,nz*f+Math.cos(oa)*rand(2,7));}
    if(m.parent)m.parent.remove(m);
  }
}
function smash(o,vx,vz,power){
  if(!o.alive)return;
  if(o.bld){collapse(o,0,vx,vz,power,true);return;}
  o.alive=false;wakeObj(o);
  if(o.rec){o.rec.dead=true;o.rec.back=T+rand(REGROW[0],REGROW[1]);}
  const dl=Math.hypot(vx,vz)||1,nx=vx/dl,nz=vz/dl;
  for(const part of o.parts)breakPart(o,part,nx,nz,power);
  scene.remove(o.g);
  puff(o.x,0.5,o.z,o.big?7:3,o.big?2.2:1.2);
  sfx.crash(o.big);shake=Math.min(1.5,shake+(o.big?0.6:0.2));
  smashCount++;addScore(o.points);grow(o.points);
  if(o.explosive)queue.push({t:0.07,fn:()=>explode(o.x,o.z)});
}
function explode(x,z){
  sfx.boom();shake=Math.min(2,shake+1.2);
  flash(x,2,z,'#ffd166',3,0.4);flash(x,2,z,'#ff5400',2,0.55);puff(x,1,z,8,2.5,'#666666');
  for(let i=0;i<16;i++){const c=new THREE.Mesh(GEO.box,M(pick(['#ff7b00','#ffd60a','#333333','#e63946'])));c.castShadow=true;const s=rand(.4,1.1);c.scale.set(s,s,s);
    c.position.set(x,1.5,z);const a=rand(0,Math.PI*2),f=rand(12,24);addDebris(c,s*.4,Math.sin(a)*f,rand(8,18),Math.cos(a)*f);}
  for(const o of objects){if(!o.alive||o.falling)continue;const dx=o.x-x,dz=o.z-z,d=Math.hypot(dx,dz);
    if(o.bld){if(d<9+o.r)queue.push({t:0.06+d*0.012,fn:()=>damageBuilding(o,x,z,9,99,-1,7,dx/(d||1),dz/(d||1),24)});continue;}
    if(d<8*Math.max(1,S*0.6)+o.r&&o.sz<=tier+1)queue.push({t:0.06+d*0.012,fn:()=>smash(o,dx,dz,26)});}
  for(const p of players){const dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz)||1;
    if(d<10){p.air=true;p.vy=Math.max(p.vy,12);p.kx+=dx/d*14;p.kz+=dz/d*14;}}
}
function slam(p){
  shake=Math.min(1.5,shake+0.7);sfx.thud();puff(p.x,0.3,p.z,8,1.8);
  for(const o of objects){if(!o.alive||o.falling)continue;const dx=o.x-p.x,dz=o.z-p.z;
    if(o.sz<=tier&&Math.hypot(dx,dz)<p.r+o.r+3)smash(o,dx,dz,18);}
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
  o.alive=false;wakeObj(o);
  if(o.rec){o.rec.dead=true;o.rec.gone=[];o.rec.back=T+rand(REGROW[0],REGROW[1]);}
  const rest=Math.max(0,o.points-o.paid);smashCount++;addScore(rest);grow(rest);
}
function damageBuilding(o,x,z,rad,max,y0,y1,nx,nz,power){
  if(!o.alive)return 0;wakeObj(o);
  const hit=o.parts.filter(p=>!p.gone&&p.y1>y0&&p.y0<y1).map(p=>[p,Math.hypot(p.wx-x,p.wz-z)]).filter(a=>a[1]<rad).sort((a,b)=>a[1]-b[1]).slice(0,max);
  if(!hit.length)return 0;
  for(const [p] of hit){breakPart(o,p,nx,nz,power);if(o.rec)(o.rec.gone||(o.rec.gone=[])).push(o.parts.indexOf(p));}
  const pts=o.points*hit.length/o.parts.length;o.paid+=pts;addScore(pts);grow(pts);
  sfx.crash(hit.length>2);puff(x,1,z,2+hit.length,1.2,'#e8dcc8');shake=Math.min(1.5,shake+0.1*hit.length);
  if(o.parts.every(p=>p.gone)){killBld(o);scene.remove(o.g);return hit.length;}
  // lost too many walls on a floor? everything above it comes down
  for(const f of Object.keys(o.bld.fl).map(Number).sort((a,b)=>a-b)){const F=o.bld.fl[f];
    if(F.walls&&o.parts.filter(p=>!p.gone&&p.floor===f&&p.kind==='wall').length/F.walls<SUPPORT&&
       o.parts.some(p=>!p.gone&&(p.floor>f||(p.floor===f&&p.kind==='roof')))){collapse(o,f,nx,nz,power*0.5);break;}}
  return hit.length;
}
function dust(o,n){for(let i=0;i<n;i++)puff(o.x+rand(-o.r,o.r),rand(0.5,2.5),o.z+rand(-o.r,o.r),3,1.4+o.r*0.35,'#d9c9a8');}
function collapse(o,k,vx,vz,power,fast){
  if(!o.alive)return;killBld(o);
  const dl=Math.hypot(vx,vz)||1,nx=vx/dl,nz=vz/dl,ry=o.g.rotation.y;
  const fs=[...new Set(o.parts.filter(p=>!p.gone).map(p=>p.floor))].sort((a,b)=>a-b);
  const up=new THREE.Group();o.g.add(up);
  for(const p of o.parts)if(!p.gone&&p.floor>=k)up.add(p.mesh);
  o.col={up,upper:fs.filter(f=>f>=k),lower:fs.filter(f=>f<k).reverse(),need:0,fallen:0,vy:0,tilt:0,t:0,
    lx:nx*Math.cos(ry)-nz*Math.sin(ry),lz:nx*Math.sin(ry)+nz*Math.cos(ry),g:fast?70:34,nx,nz,power:Math.max(8,power)};
  crumbleFloor(o,o.col.upper.shift()); // the floor that gave way goes first
  collapsing.push(o);sfx.rumble();sfx.crash(true);shake=Math.min(2,shake+(fast?1.3:0.8));dust(o,fast?6:3);
}
function crumbleFloor(o,f){const c=o.col;
  for(const p of o.parts)if(!p.gone&&p.floor===f)breakPart(o,p,c.nx,c.nz,c.power*0.5,0.4);
  const F=o.bld.fl[f];c.need+=F?Math.max(0.6,F.y1-F.y0):1;}
function updateCollapses(dt){
  for(let i=collapsing.length-1;i>=0;i--){const o=collapsing[i],c=o.col;
    if(c.upper.length){ // the upper floors fall as one block, tilting, and pancake when they land
      c.vy+=c.g*dt;c.fallen=Math.min(c.need,c.fallen+c.vy*dt);c.tilt=Math.min(0.3,c.tilt+dt*0.3);
      c.up.position.y=-c.fallen;c.up.rotation.x=c.tilt*c.lz;c.up.rotation.z=-c.tilt*c.lx;
      if(c.fallen>=c.need){sfx.thud();shake=Math.min(2,shake+0.35);dust(o,2);crumbleFloor(o,c.upper.shift());c.vy*=0.2;}
      continue;}
    if(c.lower.length){if((c.t-=dt)<=0){c.t=0.16;crumbleFloor(o,c.lower.shift());dust(o,2);}continue;}
    dust(o,4);scene.remove(o.g);collapsing.splice(i,1);
  }
}
function hitBuilding(p,o,dx,dz,rr,spd,vx,vz){
  const diff=o.sz-tier;
  if(diff>=3||(spd<4&&!p.air)){bump(p,o,dx,dz,rr,spd);return;}
  const pw=Math.max(spd,10)*Math.sqrt(Math.max(1,S)),nx=vx/(spd||1),nz=vz/(spd||1);
  if(diff<0){collapse(o,0,vx||dx,vz||dz,pw,true);p.speed*=0.95;return;}               // bigger: flatten it
  const d=Math.hypot(dx,dz)||1,y0=p.y-0.3,y1=p.y+(p.model.h+1)*S;                       // what the car can reach
  if(diff===0){if(o.hitT>T)return;o.hitT=T+0.1;                                       // same size: plow through
    damageBuilding(o,p.x+dx/d*p.r,p.z+dz/d*p.r,p.r+2.5,99,y0,y1,nx,nz,pw);p.speed*=0.85;return;}
  if(!(o.hitT>T)){o.hitT=T+0.3;damageBuilding(o,p.x,p.z,99,diff===1?2:1,y0,y1,nx,nz,pw*0.6);} // smaller: chip
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
  o.type='demo';o.chunk=chunkOf(x,z).k;o.sz=sizeClass(o);initBld(o);return o;
}

/* ---------- growth (shared by both players) ---------- */
// Smashing grows both cars together. Your size tier decides what you can smash (object size class <= tier);
// bigger things wobble and boing you back. Objects set `size` in makeObj opts ('tiny'…'huge' or 0–4), else TYPE_SIZE / a guess.
const SIZES=['tiny','small','medium','large','huge'];
const GROW_AT=[0,40,140,380,900,1800];   // growth where each tier starts; the last one is max size (GIANT)
const GROW_S=[0.4,0.65,1.0,1.6,2.6,3.4]; // car scale at each of those points (1 = the original car size)
const TYPE_SIZE={cone:0,melon:0,fence:0,pin:0,barrel:1,crates:1,snowman:1,tree:2,tower:2,house:3};
let growth=0,tier=0,S=GROW_S[0],giant=false,popT=0,worldSeed=0;
function sizeClass(o){
  if(o.size!=null){const i=typeof o.size==='number'?o.size:SIZES.indexOf(o.size);if(i>=0)return i;}
  if(o.type in TYPE_SIZE)return TYPE_SIZE[o.type];
  const m=Math.max(o.r,o.h/3);return m<0.9?0:m<1.5?1:m<2.6?2:m<5?3:4;}
function growScale(g){for(let i=1;i<GROW_AT.length;i++)if(g<GROW_AT[i])return GROW_S[i-1]+(GROW_S[i]-GROW_S[i-1])*(g-GROW_AT[i-1])/(GROW_AT[i]-GROW_AT[i-1]);return GROW_S[GROW_S.length-1];}
function tierOf(g){let t=0;for(let i=1;i<SIZES.length;i++)if(g>=GROW_AT[i])t=i;return t;}
const MAX_GROW=GROW_AT[GROW_AT.length-1];
function grow(n){
  if(giant)return;growth=Math.min(MAX_GROW,growth+n);
  const t=tierOf(growth);if(t>tier){tier=t;if(growth<MAX_GROW)sizeUp();}
  if(growth>=MAX_GROW){giant=true;goGiant();}}
function updateGrowth(dt){S+=(growScale(growth)-S)*Math.min(1,dt*2.5);popT=Math.max(0,popT-dt);}
const dispScale=()=>S*(1+0.3*popT*Math.sin(popT*22));
function showBig(txt){const el=$('big');el.textContent=txt;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function sizeUp(){
  const txt=pick(['BIGGER!','GROWING!','SO BIG!']);showBig(txt);greenT=4;sfx.fanfare();say(txt);shake=Math.min(2,shake+1.2);popT=1;
  for(const p of players)puff(p.x,1,p.z,10,1+S,'#ffffff');}
function goGiant(){
  showBig('GIANT!');sfx.fanfare();queue.push({t:1.3,fn:()=>sfx.fanfare()});say("You're GIANT! Smash everything!");shake=2;popT=1;confetti(220);
  nwBtn.style.display='block';}
// NEW WORLD: shrink back to tiny and roll a fresh, procedurally zoned world. Only ever by choice.
function newWorld(){
  if(!giant)return;
  for(const c of chunks.values())if(c.loaded)unloadChunk(c);
  for(const c of chunks.values())for(const r of c.rampList)r.mesh.geometry.dispose();
  chunks.clear();for(const o of objects)scene.remove(o.g);objects=[];queue.length=0;
  for(const o of collapsing)scene.remove(o.g);collapsing.length=0;
  for(const d of debris)if(!d.confetti){scene.remove(d.m);d.life=0;}
  worldSeed=(Math.random()*1e9)|0;setZoneMap(randomZoneMap(mulberry(worldSeed)));
  buildWorld();captureHome();
  growth=0;tier=0;giant=false;popT=1;nwBtn.style.display='none';
  players.forEach(p=>{const st=START_SPOTS[p.idx];p.x=st[0];p.z=st[1];p.y=0;p.vy=0;p.speed=0;p.kx=p.kz=0;p.air=false;p.heading=Math.PI;});
  camT.set(0,0,30);updateStreaming(0,true);
  showBig('NEW WORLD!');sfx.fanfare();say('New world! Smash it!');confetti(150);
}
const nwBtn=document.createElement('button');nwBtn.id='newWorld';nwBtn.innerHTML='🌍 NEW WORLD!<small>START / N / tap</small>';
nwBtn.onclick=e=>{e.stopPropagation();newWorld();};nwBtn.addEventListener('touchstart',e=>{e.stopPropagation();},{passive:true});
document.body.appendChild(nwBtn);
// size HUD: a row of cars getting bigger, lit up as you grow (a picture, not a number)
const sizeHud=document.createElement('div');sizeHud.id='sizeHud';
sizeHud.innerHTML=SIZES.map((_,i)=>`<span style="font-size:${16+i*9}px">🚙</span>`).join('')+'<span class="crown">👑</span><div id="sizeBar"><div id="sizeFill"></div></div>';
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
:where(#newWorld){display:none;position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:20;font:32px 'Lilita One',sans-serif;color:#fff;
  background:#06d6a0;border:6px solid #fff;border-radius:28px;padding:14px 34px;box-shadow:0 8px 0 rgba(0,0,0,.25);cursor:pointer;animation:nwPulse 1s ease-in-out infinite}
:where(#newWorld small){display:block;font:14px Nunito,sans-serif;font-weight:900;opacity:.9}
@keyframes nwPulse{50%{transform:translateX(-50%) scale(1.08)}}`;document.head.appendChild(st);}
let hudTier=-1;
function updateSizeHUD(){
  const t=giant?SIZES.length:tier;
  if(t!==hudTier){hudTier=t;const sp=sizeHud.querySelectorAll('span:not(.crown)');sp.forEach((e,i)=>{e.className=(i<=t?'lit':'')+(i===t?' now':'');});sizeHud.classList.toggle('giant',giant);}
  const a=GROW_AT[tier],b=giant?MAX_GROW:(GROW_AT[tier+1]||MAX_GROW);$('sizeFill').style.width=(giant?100:Math.min(100,(growth-a)/(b-a)*100))+'%';
}

/* ---------- respawn ---------- */
function pickType(){let tot=0;SPAWN_W.forEach(w=>tot+=w[1]);let r=Math.random()*tot;for(const [t,w] of SPAWN_W){if((r-=w)<0)return t;}return 'crates';}
function spawnFalling(cx,cz,spread,type){
  type=type||pickType();
  for(let tries=0;tries<12;tries++){
    const x=cx!=null?cx+rand(-spread,spread):rand(-ARENA+4,ARENA-4),z=cz!=null?cz+rand(-spread,spread):rand(-ARENA+4,ARENA-4);
    if(!spotOK(x,z,3.6))continue;
    if(players.some(p=>Math.hypot(p.x-x,p.z-z)<(cx!=null?8:16)))continue;
    if(objects.some(o=>o.alive&&Math.hypot(o.x-x,o.z-z)<o.r+3.8))continue;
    const o=OBJ[type](x,z);o.falling=true;o.fy=rand(28,60);o.vy=0;o.g.position.y=o.fy;return o;}
  return null;
}
function updateObjects(dt){
  for(const o of objects){if(!o.wob)continue;o.wob=Math.max(0,o.wob-dt*1.6);const w=o.wob;
    o.g.rotation.x=Math.sin(T*23)*0.07*w;o.g.rotation.z=Math.cos(T*19)*0.09*w;o.g.scale.set(1+0.05*w*Math.sin(T*31),1-0.08*w*Math.sin(T*31),1+0.05*w*Math.sin(T*31));}
  for(const o of objects){if(!o.alive||!o.falling)continue;
    o.vy-=40*dt;o.fy+=o.vy*dt;
    if(o.fy<=0){o.fy=0;o.falling=false;sfx.thud();puff(o.x,0.4,o.z,4,1.4);
      for(const p of players)if(Math.hypot(p.x-o.x,p.z-o.z)<p.r+o.r){p.air=true;p.vy=10;}}
    o.g.position.y=o.fy;}
  if(Math.random()<0.02)objects=objects.filter(o=>o.alive);
}

/* ---------- world streaming (chunks) ---------- */
/* Each chunk remembers its objects as records {type,x,z,arg,r,seed,dead,back}, so leaving and coming back
   keeps what you smashed. Only chunks near the players are built. Built objects "sleep" as instanced meshes
   (a few draw calls per chunk) and wake into real meshes when a car gets close enough to smash them.
   Smashed records regrow after REGROW seconds (dropping from the sky if the chunk is loaded). */
const REGROW=[90,160],WAKE_R=22;
const chunks=new Map();
const chunkKey=(ci,cj)=>ci+','+cj;
function getChunk(ci,cj){const k=chunkKey(ci,cj);let c=chunks.get(k);
  if(!c){c={k,ci,cj,zone:zoneAt(ci,cj),x0:ci*CHUNK-CHUNK/2,z0:cj*CHUNK-CHUNK/2,recs:[],rampList:[],gen:false,loaded:false,group:null,box:null};chunks.set(k,c);}
  return c;}
const chunkOf=(x,z)=>getChunk(chunkIdx(x),chunkIdx(z));
// tag every object with its type/arg/chunk so it can be rebuilt and streamed
for(const t in OBJ){const f=OBJ[t];OBJ[t]=(x,z,arg)=>{const o=f(x,z,arg);o.type=t;o.arg=arg;o.chunk=chunkOf(x,z).k;o.sz=sizeClass(o);initBld(o);return o;};}
// deterministic randomness, so a chunk (and each house in it) looks the same every time it's rebuilt
function mulberry(a){return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function withSeed(seed,fn){const r=Math.random;Math.random=mulberry(seed);try{return fn();}finally{Math.random=r;}}

/* Zone layout contract (design fills this in objects.js as `const ZONE_LAYOUT={town(ctx){…},farm(ctx){…},park(ctx){…}}`):
   ctx = {zone, ci, cj, x0, z0, x1, z1, cx, cz, size,
          place(type,x,z,arg,r) → true if placed (stays inside the chunk, off roads, off ramps, no overlaps),
          ramp(x,z,th,L,W,H)    → true if placed,
          free(x,z,r)           → would a spot of radius r fit?}
   Math.random (and rand/pick) is seeded while a layout runs, so layouts can use them freely. */
const REC_R={house:3.6,crates:1.5,tower:1.4,pin:1.1,snowman:1.3,fence:1.8,barrel:1.0,cone:0.7,melon:1.1,tree:1.1};
function spotFree(c,x,z,r){
  if(x-r<c.x0||x+r>c.x0+CHUNK||z-r<c.z0||z+r>c.z0+CHUNK)return false;
  if(Math.abs(x)>ARENA-r-2||Math.abs(z)>ARENA-r-2)return false;
  if(Math.abs(x)<HOME+r&&Math.abs(z)<HOME+r)return false; // hand-built home arena
  if(onRoad(x,z,r))return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(rampsH(c.rampList,x+a,z+b)>0)return false;
  for(const q of c.recs)if(Math.hypot(q.x-x,q.z-z)<q.r+r+0.6)return false;
  return true;}
function chunkPlace(c,type,x,z,arg,r){
  if(!OBJ[type])return false;r=r||REC_R[type]||1.5;
  if(!spotFree(c,x,z,r))return false;
  c.recs.push({type,x,z,arg,r,seed:(Math.random()*1e9)|0,dead:false,back:0});return true;}
function chunkRamp(c,x,z,th,L=11,W=7,H=3.6){
  const m=W+2,sx=Math.sin(th),sz=Math.cos(th);
  for(let k=0;k<=2;k++){const px=x+sx*L*k/2,pz=z+sz*L*k/2;
    if(px<c.x0+m||px>c.x0+CHUNK-m||pz<c.z0+m||pz>c.z0+CHUNK-m||onRoad(px,pz,W/2)||(Math.abs(px)<HOME+m&&Math.abs(pz)<HOME+m))return false;}
  const r=makeRamp(x,z,th,L,W,H);
  for(const q of [...c.recs,...c.rampList.map(o=>({x:o.x,z:o.z,r:o.L}))])
    for(const [a,b] of [[0,0],[q.r+1,0],[-q.r-1,0],[0,q.r+1],[0,-q.r-1]])if(rampsH([r],q.x+a,q.z+b)>0)return false;
  c.rampList.push(r);return true;}
function genChunk(c){
  c.gen=true;
  withSeed((c.ci+50)*7919+(c.cj+50)*104729+worldSeed,()=>{
    const ctx={zone:c.zone,ci:c.ci,cj:c.cj,x0:c.x0,z0:c.z0,x1:c.x0+CHUNK,z1:c.z0+CHUNK,cx:c.ci*CHUNK,cz:c.cj*CHUNK,size:CHUNK,
      place:(type,x,z,arg,r)=>chunkPlace(c,type,x,z,arg,r),ramp:(x,z,th,L,W,H)=>chunkRamp(c,x,z,th,L,W,H),free:(x,z,r)=>spotFree(c,x,z,r)};
    // TODO(design): ZONE_LAYOUT.town/farm/park/home in objects.js replaces these placeholder fillers (D1)
    const lay=(typeof ZONE_LAYOUT!=='undefined'&&ZONE_LAYOUT[c.zone])||DEFAULT_LAYOUT[c.zone]||DEFAULT_LAYOUT.park;
    lay(ctx);});
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
function buildRec(rec){const o=withSeed(rec.seed,()=>OBJ[rec.type](rec.x,rec.z,rec.arg));o.rec=rec;
  if(o.bld&&rec.gone)for(const i of rec.gone){const p=o.parts[i];if(p&&!p.gone){p.gone=true;p.mesh.parent.remove(p.mesh);o.paid+=o.points/o.parts.length;}}
  return o;}

const HIDE=new THREE.Matrix4().makeTranslation(0,-9999,0),instMats={};
const instMat=m=>instMats[m.id]||(instMats[m.id]=m.clone()); // own material so plain + instanced meshes don't swap shader programs
function loadChunk(c){
  if(!c.gen)genChunk(c);
  c.loaded=true;c.group=new THREE.Group();scene.add(c.group);
  c.box=new THREE.Box3(new THREE.Vector3(c.x0-12,-1,c.z0-12),new THREE.Vector3(c.x0+CHUNK+12,40,c.z0+CHUNK+12));
  for(const r of c.rampList){c.group.add(r.mesh);ramps.push(r);}
  const batches=new Map(),sleepers=[];
  for(const rec of c.recs){
    if(rec.dead){if(T<rec.back)continue;rec.dead=false;}
    const o=buildRec(rec);scene.remove(o.g);o.g.updateMatrixWorld(true);o.inst=[];o.sleep=true;sleepers.push(o);
    o.g.traverse(m=>{if(!m.isMesh)return;const k=m.geometry.id+'_'+m.material.id;let b=batches.get(k);
      if(!b)batches.set(k,b={geo:m.geometry,mat:m.material,list:[]});o.inst.push([b,b.list.length,m]);b.list.push(m.matrixWorld.clone());});}
  for(const b of batches.values()){const im=new THREE.InstancedMesh(b.geo,instMat(b.mat),b.list.length);
    b.list.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=im.receiveShadow=true;im.frustumCulled=false;c.group.add(im);b.im=im;}
  for(const o of sleepers)o.inst=o.inst.map(([b,i,mesh])=>[b.im,i,b.list[i],mesh]);
}
function unloadChunk(c){
  c.loaded=false;
  for(const r of c.rampList)removeRamp(r);
  objects=objects.filter(o=>{if(o.chunk!==c.k)return true;scene.remove(o.g);return false;}); // alive records stay alive
  c.group.traverse(m=>{if(m.isInstancedMesh)m.dispose();});scene.remove(c.group);c.group=null;
}
function wakeObj(o){if(!o.sleep)return;o.sleep=false;for(const [im,i] of o.inst){im.setMatrixAt(i,HIDE);im.instanceMatrix.needsUpdate=true;}scene.add(o.g);}
function sleepObj(o){o.sleep=true;for(const [im,i,m,mesh] of o.inst){im.setMatrixAt(i,mesh.userData.dead?HIDE:m);im.instanceMatrix.needsUpdate=true;}scene.remove(o.g);}
function streamR(){return (IS_PHONE?0.7:1)*(110+camDist*1.1);} // camDist already grows with car size
function rectDist(c,x,z){return Math.hypot(Math.max(c.x0-x,0,x-c.x0-CHUNK),Math.max(c.z0-z,0,z-c.z0-CHUNK));}
let regrowT=0;
function updateStreaming(dt,all){
  const R=streamR(),wr=WAKE_R*Math.max(1,S),pts=players.length?players.map(p=>[p.x,p.z]):[[camT.x,camT.z]];
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
    if(o.sleep){if(d<wr)wakeObj(o);}else if(d>wr+12&&!o.falling&&!o.wob)sleepObj(o);}
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
let camT=new THREE.Vector3(0,0,30),camDist=40;
function mega(){
  const txt=pick(['MEGA SMASH!','SUPER SMASH!','KABOOM!','AWESOME!','SMASHTASTIC!']);
  showBig(txt);sfx.fanfare();say(txt.replace('!','')+'!');confetti(170);
  for(let i=0;i<22;i++)queue.push({t:0.5+i*0.12,fn:()=>spawnFalling(camT.x,camT.z,28*Math.max(1,S*0.7))});
}
function confetti(n){
  const cols=['#ff006e','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#fb5607','#ffffff'],w=Math.max(1,camDist/40);
  for(let i=0;i<n;i++){const c=new THREE.Mesh(GEO.box,M(pick(cols)));c.scale.set(.6,.06,.4);
    c.scale.multiplyScalar(w);c.position.set(camT.x+rand(-35,35)*w,rand(18,40)*w,camT.z+rand(-30,20)*w);addDebris(c,.05,rand(-3,3),rand(-2,2),rand(-3,3),{confetti:true,g:6,life:rand(5,8)});}
}

/* ---------- players ---------- */
const players=[];
const PCOL=['#ff9f1c','#2ec4f6'];
class Player{
  constructor(idx,src){
    this.idx=idx;this.src=src;this.color=PCOL[idx];
    this.root=new THREE.Group();this.root.rotation.order='YXZ';scene.add(this.root);
    this.ring=new THREE.Mesh(new THREE.RingGeometry(2.5,3.1,40),new THREE.MeshBasicMaterial({color:this.color,transparent:true,opacity:.9,depthWrite:false}));
    this.ring.rotation.x=-Math.PI/2;scene.add(this.ring);
    const s=START_SPOTS[idx];this.x=s[0];this.z=s[1];this.y=0;this.vy=0;this.heading=Math.PI;this.speed=0;this.kx=0;this.kz=0;
    this.air=false;this.pitch=0;this.wasBoost=false;this.flameT=0;this.nameT=0;this.wallT=0;
    this.tag=document.createElement('div');this.tag.className='tag';this.tag.style.background=this.color;$('tags').appendChild(this.tag);
    this.setCar(idx===0?0:2,true);
  }
  get r(){return this.stats.r*S;}
  setCar(i,announce){
    if(this.model)this.root.remove(this.model.g);
    this.carIdx=i;this.stats=CARS[i];this.model=this.stats.build();this.root.add(this.model.g);
    this.nameT=2.5;
    if(announce){sfx.pop();say(this.stats.name+'!');puff(this.x,1,this.z,6,1.6,'#ffffff');}
    updatePanels();
  }
  ensureEngine(){
    if(this.eng||!AC)return;
    try{const o=AC.createOscillator();o.type='sawtooth';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;const g=AC.createGain();g.gain.value=0;
      o.connect(f);f.connect(g);g.connect(master);o.start();this.eng={o,g};}catch(e){}
  }
  update(dt,inp){
    const st=this.stats,sm=clamp(0.6+0.4*S,0.75,1.9),ds=dispScale();let ix=inp.x||0,iz=inp.z||0;const mag=Math.min(1,Math.hypot(ix,iz));
    let target=0;
    if(mag>0.2){const want=Math.atan2(ix,iz);const d=angDiff(want,this.heading);const tr=(this.air?1.6:4.3)*dt;
      this.heading+=clamp(d,-tr,tr);target=st.speed*sm*mag*Math.max(0.25,(1+Math.cos(d))/2);
      if(inp.boost)target=st.speed*sm*1.65*Math.max(0.3,(1+Math.cos(d))/2);}
    else if(inp.boost)target=st.speed*sm*1.65;
    const boosting=inp.boost&&this.speed>5;
    if(inp.boost&&!this.wasBoost)sfx.turbo();this.wasBoost=inp.boost;
    if(!this.air){const a=(target>this.speed?30:18)*sm;this.speed+=clamp(target-this.speed,-a*dt,a*dt);}
    const fx=Math.sin(this.heading),fz=Math.cos(this.heading);
    this.x+=(fx*this.speed+this.kx)*dt;this.z+=(fz*this.speed+this.kz)*dt;
    const kd=Math.pow(0.05,dt);this.kx*=kd;this.kz*=kd;
    const lim=ARENA-2.5*S;this.wallT-=dt;
    if(Math.abs(this.x)>lim||Math.abs(this.z)>lim){
      if(Math.abs(this.x)>lim){this.x=Math.sign(this.x)*lim;this.kx=-Math.sign(this.x)*6;}
      if(Math.abs(this.z)>lim){this.z=Math.sign(this.z)*lim;this.kz=-Math.sign(this.z)*6;}
      if(this.speed>10&&this.wallT<=0){sfx.thud();shake=Math.min(1,shake+.3);this.wallT=.4;}this.speed*=0.6;}
    const gh=groundH(this.x,this.z);
    if(!this.air){
      if(gh<this.y-0.4){this.air=true;this.vy=Math.max(5,this.speed*0.5+3);}
      else this.y=gh;
      if(inp.jumpP&&!this.air){this.air=true;this.vy=13*clamp(Math.sqrt(S),0.75,1.8);sfx.jump();}
    }else{
      this.vy-=32*dt;this.y+=this.vy*dt;
      if(this.y<=gh){const imp=-this.vy;this.y=gh;this.air=false;this.vy=0;
        if(imp>15)slam(this);else if(imp>6){sfx.thud();puff(this.x,0.3,this.z,3,1.2);}}
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
    if(boosting){this.flameT-=dt;if(this.flameT<=0){this.flameT=0.025;
      const p=this.model.g.localToWorld(this.model.ex.clone());
      const fs=.7*S,m=mk('box',fs,fs,fs,null,p.x+rand(-.3,.3),p.y+rand(-.2,.2),p.z+rand(-.3,.3),E(pick(['#ff7b00','#ffd60a','#ff006e'])));m.castShadow=false;
      addPart(m,rand(.2,.4),-fx*6+rand(-1,1),rand(0,2),-fz*6+rand(-1,1));}}
    this.nameT-=dt;
    this.ensureEngine();
    if(this.eng){const t=AC.currentTime;this.eng.o.frequency.setTargetAtTime((42+Math.abs(this.speed)/sm*3.2+(boosting?25:0))/Math.sqrt(S),t,0.06);this.eng.g.gain.setTargetAtTime(0.025+Math.min(1,Math.abs(this.speed)/30)*0.03,t,0.1);}
  }
}
function addPlayer(src){
  const idx=players.length===0?0:(players[0].idx===0?1:0);
  const p=new Player(idx,src);players.push(p);sfx.join();updatePanels();
}
function updatePanels(){
  for(let i=0;i<2;i++){const el=$('p'+i);const p=players.find(q=>q.idx===i);
    if(p){el.className='pPanel';el.innerHTML=`P${i+1} ${p.stats.emoji} ${p.stats.name}<small>${p.src==='touch'?'🔄 = new car':(p.src.startsWith('gp')?'Y = new car':(i==0?'Q = new car':'/ = new car'))}</small>`;}
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
  if(e.code==='KeyN'&&state==='play')newWorld();if(e.code==='KeyM')toggleMute();if(e.code==='KeyF')toggleFS();
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());
const KB={kb1:{u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',b:'Space',j:'KeyE',s:'KeyQ'},kb2:{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',b:'Enter',j:'ShiftRight',s:'Slash'}};
function readKB(m){return {x:(keys.has(m.r)?1:0)-(keys.has(m.l)?1:0),z:(keys.has(m.d)?1:0)-(keys.has(m.u)?1:0),boost:keys.has(m.b),jumpP:pressed.has(m.j),swapP:pressed.has(m.s),joinP:pressed.has(m.b)||pressed.has(m.j)};}
const gpPrev={};
function readGP(){
  const res={};let gps=[];try{gps=navigator.getGamepads?navigator.getGamepads():[];}catch(e){}
  for(const gp of gps){if(!gp)continue;const prev=gpPrev[gp.index]||[];
    const b=gp.buttons.map(x=>x&&(x.pressed||x.value>0.5));const P=i=>b[i]&&!prev[i];
    let x=gp.axes[0]||0,z=gp.axes[1]||0;if(Math.hypot(x,z)<0.22){x=0;z=0;}
    if(b[14])x=-1;if(b[15])x=1;if(b[12])z=-1;if(b[13])z=1;
    res['gp'+gp.index]={x,z,boost:!!(b[0]||b[7]||b[5]),jumpP:P(1),swapP:P(2)||P(3),joinP:P(0)||P(1)||P(9),newP:P(9)};gpPrev[gp.index]=b;}
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
btn('bGo',()=>touch.boost=true,()=>touch.boost=false);btn('bJump',()=>touch.jumpP=true);btn('bSwap',()=>touch.swapP=true);

function startGame(){
  if(state!=='start')return;state='play';initAudio();
  $('start').style.display='none';$('hud').style.display='block';updatePanels();
  if(touchUsed){$('touch').style.display='block';addPlayer('touch');}
}
$('play').onclick=e=>{e.stopPropagation();startGame();};

/* ---------- collisions ---------- */
let lastBoing=0;
function collisions(){
  if(players.length===2){const a=players[0],b=players[1];const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||0.01,rr=a.r+b.r;
    if(d<rr&&Math.abs(a.y-b.y)<3*S){const nx=dx/d,nz=dz/d,ov=(rr-d)/2;a.x-=nx*ov;a.z-=nz*ov;b.x+=nx*ov;b.z+=nz*ov;
      a.kx-=nx*9;a.kz-=nz*9;b.kx+=nx*9;b.kz+=nz*9;a.speed*=0.7;b.speed*=0.7;
      const n=performance.now();if(n-lastBoing>300){lastBoing=n;sfx.boing();puff((a.x+b.x)/2,1,(a.z+b.z)/2,3,1,'#ffffff');}}
    if(d>95){const nx=dx/d,nz=dz/d;a.kx+=nx*30*0.016;a.kz+=nz*30*0.016;b.kx-=nx*30*0.016;b.kz-=nz*30*0.016;}}
  for(const p of players){const vx=Math.sin(p.heading)*p.speed+p.kx,vz=Math.cos(p.heading)*p.speed+p.kz,spd=Math.hypot(vx,vz);
    for(const o of objects){if(!o.alive||(o.falling&&o.fy>p.y+3*S))continue;const dx=o.x-p.x,dz=o.z-p.z,rr=p.r+o.r;
      if(dx*dx+dz*dz<rr*rr&&p.y<o.h+o.fy){
        if(o.bld){hitBuilding(p,o,dx,dz,rr,spd,vx,vz);continue;}
        if(o.sz>tier){bump(p,o,dx,dz,rr,spd);continue;}
        if(spd>4||p.air){smash(o,vx||dx,vz||dz,Math.max(spd,10)*Math.sqrt(Math.max(1,S)));p.speed*=o.big&&o.sz>=tier?0.8:0.96;}
        else{const d=Math.hypot(dx,dz)||1;p.x-=dx/d*(rr-d);p.z-=dz/d*(rr-d);}}}}
}

// too big to smash (yet): wobble it and boing the car back. Never a fail, just "grow more!"
function bump(p,o,dx,dz,rr,spd){
  const d=Math.hypot(dx,dz)||1,nx=dx/d,nz=dz/d;p.x-=nx*(rr-d);p.z-=nz*(rr-d);
  if(spd<3&&!p.air)return;
  p.kx-=nx*(8+spd*0.6);p.kz-=nz*(8+spd*0.6);p.speed*=0.2;wakeObj(o);o.wob=1;
  growHint(o);const n=performance.now();if(n-(o.lastBoing||0)>350){o.lastBoing=n;sfx.boing();puff(o.x-nx*o.r,1,o.z-nz*o.r,3,1,'#ffffff');shake=Math.min(1,shake+.15);}
}

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
  x.font='44px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🚙',64,96);return new THREE.CanvasTexture(c);})();
const badges=[0,1,2,3].map(()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex,depthTest:false,transparent:true}));s.renderOrder=3;s.visible=false;scene.add(s);return s;});
let greenT=0,lastHint=0,lastHintSay=0;
const _m4=new THREE.Matrix4(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_qi=new THREE.Quaternion();
function updateSignals(dt){
  greenT=Math.max(0,greenT-dt);
  if(state!=='play'||!players.length){redRings.count=greenRings.count=0;badges.forEach(b=>b.visible=false);return;}
  const R=camDist*1.1+8,close=camDist*0.3+2,near=[];
  for(const o of objects){if(!o.alive||o.falling)continue;
    const red=o.sz>tier;if(!red&&!(greenT>0&&o.sz===tier))continue;
    let d=1e9;for(const p of players)d=Math.min(d,Math.hypot(o.x-p.x,o.z-p.z)-o.r-p.r);
    if(d<R)near.push([o,d,red]);}
  near.sort((a,b)=>a[1]-b[1]);
  let nr=0,ng=0,nb=0;const pulse=1+0.07*Math.sin(T*7);
  for(const [o,d,red] of near){
    if(red?nr>=RING_MAX:ng>=RING_MAX)continue;
    const s=(o.r+0.3*S)*1.3*pulse; // inner edge sits just outside the object_v.set(o.x,groundH(o.x,o.z)+0.07,o.z);_s.set(s,1,s);
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

/* ---------- camera & HUD ---------- */
function updateCamera(dt,t){
  if(state!=='play'||!players.length){const a=t*0.08;camera.position.set(Math.sin(a)*95,62,Math.cos(a)*95);camera.lookAt(0,0,0);
    sun.position.set(30,80,30);sun.target.position.set(0,0,0);setShadow(80);return;}
  let cx=0,cz=0;players.forEach(p=>{cx+=p.x;cz+=p.z;});cx/=players.length;cz/=players.length;
  let spread=0;if(players.length===2){const a=players[0],b=players[1];spread=Math.max(Math.abs(a.x-b.x)/Math.max(1,camera.aspect)*1.25,Math.abs(a.z-b.z)*1.35);}
  const ck=0.55+0.45*S,want=clamp(36*ck+spread*0.9,36*ck,125*Math.max(1,ck*0.8));camDist+=(want-camDist)*Math.min(1,dt*2);
  camT.x+=(cx-camT.x)*Math.min(1,dt*4);camT.z+=(cz-camT.z)*Math.min(1,dt*4);
  const el=0.95;shake*=Math.pow(0.02,dt);const sx=rand(-1,1)*shake,sy=rand(-1,1)*shake;
  camera.position.set(camT.x+sx,camDist*Math.sin(el)+sy,camT.z+camDist*Math.cos(el));camera.lookAt(camT.x+sx*0.5,0,camT.z-2);
  sun.position.set(camT.x+30,80+camDist,camT.z+30);sun.target.position.set(camT.x,0,camT.z);sc.far=260+camDist*2;setShadow(camDist*0.95+10);
  scene.fog.near=camDist*1.8+100;scene.fog.far=scene.fog.near+160;
}
let lastSh=0;function setShadow(s){if(Math.abs(s-lastSh)<2)return;lastSh=s;sc.left=-s;sc.right=s;sc.top=s;sc.bottom=-s;sc.updateProjectionMatrix();}
const v3=new THREE.Vector3();
function updateHUD(){
  if(state!=='play')return;
  $('meterFill').style.width=Math.min(100,levelScore/goal*100)+'%';
  $('levelTxt').textContent='SMASH LEVEL '+level;$('count').textContent=smashCount+(smashCount===1?' smash!':' smashes!');
  updateSizeHUD();
  for(const p of players){v3.set(p.x,p.y+p.model.h*dispScale()+1.2,p.z).project(camera);
    p.tag.style.left=((v3.x+1)/2*innerWidth)+'px';p.tag.style.top=((1-v3.y)/2*innerHeight)+'px';
    p.tag.textContent=p.nameT>0?`${p.stats.emoji} ${p.stats.name}`:`P${p.idx+1}`;}
}

/* ---------- loop ---------- */
let last=performance.now(),T=0;
buildWorld();captureHome();updateStreaming(0,true);
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(now-last)/1000);last=now;T+=dt;
  const gpIn=readGP();
  const src=Object.assign({kb1:readKB(KB.kb1),kb2:readKB(KB.kb2)},gpIn);
  if(touchUsed)src.touch={x:touch.x,z:touch.z,boost:touch.boost,jumpP:touch.jumpP,swapP:touch.swapP,joinP:touch.boost||touch.jumpP};
  if(state==='start'){for(const k in gpIn)if(gpIn[k].joinP){startGame();break;}}
  if(state==='play'){
    for(const k in src){const s=src[k];if(s.joinP&&players.length<2&&!players.some(p=>p.src===k)){addPlayer(k);s.jumpP=false;}}
    for(const p of players){const s=src[p.src]||{x:0,z:0};if(s.swapP)p.setCar((p.carIdx+1)%CARS.length,true);if(s.newP&&giant){newWorld();break;}p.update(dt,s);}
  }
  updateGrowth(dt);updateStreaming(dt);
  if(state==='play')collisions();
  for(let i=queue.length-1;i>=0;i--){queue[i].t-=dt;if(queue[i].t<=0){const f=queue[i].fn;queue.splice(i,1);f();}}
  updateObjects(dt);updateCollapses(dt);updateDebris(dt);updateParts(dt);
  updateCamera(dt,T);updateSignals(dt);cullChunks();updateHUD();
  renderer.render(scene,camera);
  pressed.clear();touch.jumpP=false;touch.swapP=false;
}
requestAnimationFrame(loop);
window.__sp={mega,explode,addScore,chunks,grow,newWorld,building:demoBuilding,
  tp(x,z,i=0){const p=players[i];if(p){p.x=x;p.z=z;p.y=groundH(x,z);camT.set(x,0,z);}},
  stats(){let l=0;chunks.forEach(c=>l+=c.loaded);const i=renderer.info.render;return {chunks:l,objects:objects.length,awake:objects.filter(o=>!o.sleep).length,debris:debris.length,calls:i.calls,tris:i.triangles};}};
