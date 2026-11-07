/* Smash Party — game logic: debris, smashing, respawn, players, input, collisions, camera, loop. Owner: Claude Code (logic). */
/* ---------- debris & particles ---------- */
const debris=[],parts=[];
function addDebris(m,half,vx,vy,vz,opts={}){
  if(!m.parent)scene.add(m);
  debris.push({m,half,vx,vy,vz,ax:rand(-9,9),ay:rand(-9,9),az:rand(-9,9),life:opts.life||rand(6,9),settled:false,s0:m.scale.clone(),g:opts.g||32,confetti:!!opts.confetti});
  if(debris.length>480)for(let i=0;i<debris.length-480;i++)debris[i].life=Math.min(debris[i].life,0.6);
}
function updateDebris(dt){
  for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;
    if(d.life<=0){scene.remove(d.m);debris.splice(i,1);continue;}
    if(d.life<0.8){const k=Math.max(0.01,d.life/0.8);d.m.scale.set(d.s0.x*k,d.s0.y*k,d.s0.z*k);}
    const p=d.m.position;
    if(d.settled){
      for(const pl of players){const dx=p.x-pl.x,dz=p.z-pl.z,r=pl.stats.r+d.half;
        if(dx*dx+dz*dz<r*r&&Math.abs(pl.speed)>4&&pl.y<2){const f=Math.abs(pl.speed);d.settled=false;
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
function smash(o,vx,vz,power){
  if(!o.alive)return;o.alive=false;
  const dl=Math.hypot(vx,vz)||1,nx=vx/dl,nz=vz/dl;
  const wp=new THREE.Vector3(),q=new THREE.Quaternion(),ws=new THREE.Vector3();
  o.g.updateMatrixWorld(true);
  for(const part of o.parts){
    const m=part.mesh;m.getWorldPosition(wp);
    const out=Math.atan2(wp.x-o.x,wp.z-o.z);
    if(part.whole){
      m.getWorldQuaternion(q);m.getWorldScale(ws);
      scene.add(m);m.position.copy(wp);m.quaternion.copy(q);m.scale.copy(ws);
      const f=power*rand(.4,1.0);
      addDebris(m,part.half,nx*f+Math.sin(out)*rand(1,5)+rand(-3,3),rand(4,11)*(0.6+power/45),nz*f+Math.cos(out)*rand(1,5)+rand(-3,3));
    }else{
      const s=m.scale,vol=s.x*s.y*s.z/part.n;const cs0=clamp(Math.cbrt(vol),0.3,2.0);
      for(let i=0;i<part.n;i++){const cs=cs0*rand(.7,1.15);
        const c=new THREE.Mesh(GEO.box,m.material);c.castShadow=true;c.scale.set(cs*rand(.8,1.2),cs*rand(.6,1.1),cs*rand(.8,1.2));
        c.position.set(wp.x+rand(-s.x/2,s.x/2)*.8,wp.y+rand(-s.y/2,s.y/2)*.8,wp.z+rand(-s.z/2,s.z/2)*.8);c.rotation.set(rand(0,3),rand(0,3),rand(0,3));
        const f=power*rand(.3,.85),oa=Math.atan2(c.position.x-o.x,c.position.z-o.z);
        addDebris(c,cs*0.4,nx*f+Math.sin(oa)*rand(2,7),rand(5,13)*(0.6+power/45),nz*f+Math.cos(oa)*rand(2,7));}
    }
  }
  scene.remove(o.g);
  puff(o.x,0.5,o.z,o.big?7:3,o.big?2.2:1.2);
  sfx.crash(o.big);shake=Math.min(1.5,shake+(o.big?0.6:0.2));
  smashCount++;addScore(o.points);
  if(o.explosive)queue.push({t:0.07,fn:()=>explode(o.x,o.z)});
}
function explode(x,z){
  sfx.boom();shake=Math.min(2,shake+1.2);
  flash(x,2,z,'#ffd166',3,0.4);flash(x,2,z,'#ff5400',2,0.55);puff(x,1,z,8,2.5,'#666666');
  for(let i=0;i<16;i++){const c=new THREE.Mesh(GEO.box,M(pick(['#ff7b00','#ffd60a','#333333','#e63946'])));c.castShadow=true;const s=rand(.4,1.1);c.scale.set(s,s,s);
    c.position.set(x,1.5,z);const a=rand(0,Math.PI*2),f=rand(12,24);addDebris(c,s*.4,Math.sin(a)*f,rand(8,18),Math.cos(a)*f);}
  for(const o of objects){if(!o.alive||o.falling)continue;const dx=o.x-x,dz=o.z-z,d=Math.hypot(dx,dz);
    if(d<8+o.r)queue.push({t:0.06+d*0.012,fn:()=>smash(o,dx,dz,26)});}
  for(const p of players){const dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz)||1;
    if(d<10){p.air=true;p.vy=Math.max(p.vy,12);p.kx+=dx/d*14;p.kz+=dz/d*14;}}
}
function slam(p){
  shake=Math.min(1.5,shake+0.7);sfx.thud();puff(p.x,0.3,p.z,8,1.8);
  for(const o of objects){if(!o.alive||o.falling)continue;const dx=o.x-p.x,dz=o.z-p.z;
    if(Math.hypot(dx,dz)<p.stats.r+o.r+3)smash(o,dx,dz,18);}
}
function addScore(n){
  score+=n;levelScore+=n;
  if(levelScore>=goal){levelScore-=goal;level++;goal=100+level*40;mega();}
}

/* ---------- respawn ---------- */
function pickType(){let tot=0;SPAWN_W.forEach(w=>tot+=w[1]);let r=Math.random()*tot;for(const [t,w] of SPAWN_W){if((r-=w)<0)return t;}return 'crates';}
let TARGET=0,spawnT=0;
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
  for(const o of objects){if(!o.alive||!o.falling)continue;
    o.vy-=40*dt;o.fy+=o.vy*dt;
    if(o.fy<=0){o.fy=0;o.falling=false;sfx.thud();puff(o.x,0.4,o.z,4,1.4);
      for(const p of players)if(Math.hypot(p.x-o.x,p.z-o.z)<p.stats.r+o.r){p.air=true;p.vy=10;}}
    o.g.position.y=o.fy;}
  spawnT-=dt;
  if(spawnT<=0){spawnT=0.9;if(objects.filter(o=>o.alive).length<TARGET)spawnFalling();}
  if(objects.length>300||Math.random()<0.01)objects=objects.filter(o=>o.alive);
}

/* ---------- celebration ---------- */
let camT=new THREE.Vector3(0,0,30),camDist=40;
function mega(){
  const txt=pick(['MEGA SMASH!','SUPER SMASH!','KABOOM!','AWESOME!','SMASHTASTIC!']);
  const el=$('big');el.textContent=txt;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  sfx.fanfare();say(txt.replace('!','')+'!');
  const cols=['#ff006e','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#fb5607','#ffffff'];
  for(let i=0;i<170;i++){const c=new THREE.Mesh(GEO.box,M(pick(cols)));c.scale.set(.6,.06,.4);
    c.position.set(camT.x+rand(-35,35),rand(18,40),camT.z+rand(-30,20));addDebris(c,.05,rand(-3,3),rand(-2,2),rand(-3,3),{confetti:true,g:6,life:rand(5,8)});}
  for(let i=0;i<22;i++)queue.push({t:0.5+i*0.12,fn:()=>spawnFalling(camT.x,camT.z,28)});
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
  setCar(i,announce){
    if(this.model)this.root.remove(this.model.g);
    this.carIdx=i;this.stats=CARS[i];this.model=this.stats.build();this.root.add(this.model.g);
    this.ring.scale.setScalar(this.stats.r/2.6);this.nameT=2.5;
    if(announce){sfx.pop();say(this.stats.name+'!');puff(this.x,1,this.z,6,1.6,'#ffffff');}
    updatePanels();
  }
  ensureEngine(){
    if(this.eng||!AC)return;
    try{const o=AC.createOscillator();o.type='sawtooth';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;const g=AC.createGain();g.gain.value=0;
      o.connect(f);f.connect(g);g.connect(master);o.start();this.eng={o,g};}catch(e){}
  }
  update(dt,inp){
    const st=this.stats;let ix=inp.x||0,iz=inp.z||0;const mag=Math.min(1,Math.hypot(ix,iz));
    let target=0;
    if(mag>0.2){const want=Math.atan2(ix,iz);const d=angDiff(want,this.heading);const tr=(this.air?1.6:4.3)*dt;
      this.heading+=clamp(d,-tr,tr);target=st.speed*mag*Math.max(0.25,(1+Math.cos(d))/2);
      if(inp.boost)target=st.speed*1.65*Math.max(0.3,(1+Math.cos(d))/2);}
    else if(inp.boost)target=st.speed*1.65;
    const boosting=inp.boost&&this.speed>5;
    if(inp.boost&&!this.wasBoost)sfx.turbo();this.wasBoost=inp.boost;
    if(!this.air){const a=target>this.speed?30:18;this.speed+=clamp(target-this.speed,-a*dt,a*dt);}
    const fx=Math.sin(this.heading),fz=Math.cos(this.heading);
    this.x+=(fx*this.speed+this.kx)*dt;this.z+=(fz*this.speed+this.kz)*dt;
    const kd=Math.pow(0.05,dt);this.kx*=kd;this.kz*=kd;
    const lim=ARENA-2.5;this.wallT-=dt;
    if(Math.abs(this.x)>lim||Math.abs(this.z)>lim){
      if(Math.abs(this.x)>lim){this.x=Math.sign(this.x)*lim;this.kx=-Math.sign(this.x)*6;}
      if(Math.abs(this.z)>lim){this.z=Math.sign(this.z)*lim;this.kz=-Math.sign(this.z)*6;}
      if(this.speed>10&&this.wallT<=0){sfx.thud();shake=Math.min(1,shake+.3);this.wallT=.4;}this.speed*=0.6;}
    const gh=groundH(this.x,this.z);
    if(!this.air){
      if(gh<this.y-0.4){this.air=true;this.vy=Math.max(5,this.speed*0.5+3);}
      else this.y=gh;
      if(inp.jumpP&&!this.air){this.air=true;this.vy=13;sfx.jump();}
    }else{
      this.vy-=32*dt;this.y+=this.vy*dt;
      if(this.y<=gh){const imp=-this.vy;this.y=gh;this.air=false;this.vy=0;
        if(imp>15)slam(this);else if(imp>6){sfx.thud();puff(this.x,0.3,this.z,3,1.2);}}
    }
    let pitch;
    if(!this.air){pitch=Math.atan2(groundH(this.x+fx*1.6,this.z+fz*1.6)-groundH(this.x-fx*1.6,this.z-fz*1.6),3.2);}
    else pitch=clamp(this.vy*0.03,-0.45,0.45);
    this.pitch+=(pitch-this.pitch)*Math.min(1,dt*10);
    this.root.position.set(this.x,this.y,this.z);this.root.rotation.set(-this.pitch,this.heading,0);
    this.model.g.position.y=Math.abs(Math.sin(performance.now()*0.02))*0.05*Math.min(1,Math.abs(this.speed)/20);
    for(const w of this.model.wheels)w.rotation.x+=this.speed*dt/w.userData.r;
    this.ring.position.set(this.x,groundH(this.x,this.z)+0.08,this.z);
    this.ring.material.opacity=this.air?0.4:0.9;
    if(boosting){this.flameT-=dt;if(this.flameT<=0){this.flameT=0.025;
      const p=this.model.g.localToWorld(this.model.ex.clone());
      const m=mk('box',.7,.7,.7,null,p.x+rand(-.3,.3),p.y+rand(-.2,.2),p.z+rand(-.3,.3),E(pick(['#ff7b00','#ffd60a','#ff006e'])));m.castShadow=false;
      addPart(m,rand(.2,.4),-fx*6+rand(-1,1),rand(0,2),-fz*6+rand(-1,1));}}
    this.nameT-=dt;
    this.ensureEngine();
    if(this.eng){const t=AC.currentTime;this.eng.o.frequency.setTargetAtTime(42+Math.abs(this.speed)*3.2+(boosting?25:0),t,0.06);this.eng.g.gain.setTargetAtTime(0.025+Math.min(1,Math.abs(this.speed)/30)*0.03,t,0.1);}
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
  if(e.code==='KeyM')toggleMute();if(e.code==='KeyF')toggleFS();
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
    res['gp'+gp.index]={x,z,boost:!!(b[0]||b[7]||b[5]),jumpP:P(1),swapP:P(2)||P(3),joinP:P(0)||P(1)||P(9)};gpPrev[gp.index]=b;}
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
  if(players.length===2){const a=players[0],b=players[1];const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||0.01,rr=a.stats.r+b.stats.r;
    if(d<rr&&Math.abs(a.y-b.y)<3){const nx=dx/d,nz=dz/d,ov=(rr-d)/2;a.x-=nx*ov;a.z-=nz*ov;b.x+=nx*ov;b.z+=nz*ov;
      a.kx-=nx*9;a.kz-=nz*9;b.kx+=nx*9;b.kz+=nz*9;a.speed*=0.7;b.speed*=0.7;
      const n=performance.now();if(n-lastBoing>300){lastBoing=n;sfx.boing();puff((a.x+b.x)/2,1,(a.z+b.z)/2,3,1,'#ffffff');}}
    if(d>95){const nx=dx/d,nz=dz/d;a.kx+=nx*30*0.016;a.kz+=nz*30*0.016;b.kx-=nx*30*0.016;b.kz-=nz*30*0.016;}}
  for(const p of players){const vx=Math.sin(p.heading)*p.speed+p.kx,vz=Math.cos(p.heading)*p.speed+p.kz,spd=Math.hypot(vx,vz);
    for(const o of objects){if(!o.alive||(o.falling&&o.fy>p.y+3))continue;const dx=o.x-p.x,dz=o.z-p.z,rr=p.stats.r+o.r;
      if(dx*dx+dz*dz<rr*rr&&p.y<o.h+o.fy){
        if(spd>4||p.air){smash(o,vx||dx,vz||dz,Math.max(spd,10));p.speed*=o.big?0.8:0.96;}
        else{const d=Math.hypot(dx,dz)||1;p.x-=dx/d*(rr-d);p.z-=dz/d*(rr-d);}}}}
}

/* ---------- camera & HUD ---------- */
function updateCamera(dt,t){
  if(state!=='play'||!players.length){const a=t*0.08;camera.position.set(Math.sin(a)*95,62,Math.cos(a)*95);camera.lookAt(0,0,0);
    sun.position.set(30,80,30);sun.target.position.set(0,0,0);setShadow(80);return;}
  let cx=0,cz=0;players.forEach(p=>{cx+=p.x;cz+=p.z;});cx/=players.length;cz/=players.length;
  let spread=0;if(players.length===2){const a=players[0],b=players[1];spread=Math.max(Math.abs(a.x-b.x)/Math.max(1,camera.aspect)*1.25,Math.abs(a.z-b.z)*1.35);}
  const want=clamp(36+spread*0.9,36,125);camDist+=(want-camDist)*Math.min(1,dt*2);
  camT.x+=(cx-camT.x)*Math.min(1,dt*4);camT.z+=(cz-camT.z)*Math.min(1,dt*4);
  const el=0.95;shake*=Math.pow(0.02,dt);const sx=rand(-1,1)*shake,sy=rand(-1,1)*shake;
  camera.position.set(camT.x+sx,camDist*Math.sin(el)+sy,camT.z+camDist*Math.cos(el));camera.lookAt(camT.x+sx*0.5,0,camT.z-2);
  sun.position.set(camT.x+30,80,camT.z+30);sun.target.position.set(camT.x,0,camT.z);setShadow(camDist*0.95+10);
}
let lastSh=0;function setShadow(s){if(Math.abs(s-lastSh)<2)return;lastSh=s;sc.left=-s;sc.right=s;sc.top=s;sc.bottom=-s;sc.updateProjectionMatrix();}
const v3=new THREE.Vector3();
function updateHUD(){
  if(state!=='play')return;
  $('meterFill').style.width=Math.min(100,levelScore/goal*100)+'%';
  $('levelTxt').textContent='SMASH LEVEL '+level;$('count').textContent=smashCount+(smashCount===1?' smash!':' smashes!');
  for(const p of players){v3.set(p.x,p.y+p.model.h+1.2,p.z).project(camera);
    p.tag.style.left=((v3.x+1)/2*innerWidth)+'px';p.tag.style.top=((1-v3.y)/2*innerHeight)+'px';
    p.tag.textContent=p.nameT>0?`${p.stats.emoji} ${p.stats.name}`:`P${p.idx+1}`;}
}

/* ---------- loop ---------- */
buildWorld();TARGET=Math.floor(objects.length*0.85);
let last=performance.now(),T=0;
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(now-last)/1000);last=now;T+=dt;
  const gpIn=readGP();
  const src=Object.assign({kb1:readKB(KB.kb1),kb2:readKB(KB.kb2)},gpIn);
  if(touchUsed)src.touch={x:touch.x,z:touch.z,boost:touch.boost,jumpP:touch.jumpP,swapP:touch.swapP,joinP:touch.boost||touch.jumpP};
  if(state==='start'){for(const k in gpIn)if(gpIn[k].joinP){startGame();break;}}
  if(state==='play'){
    for(const k in src){const s=src[k];if(s.joinP&&players.length<2&&!players.some(p=>p.src===k)){addPlayer(k);s.jumpP=false;}}
    for(const p of players){const s=src[p.src]||{x:0,z:0};if(s.swapP)p.setCar((p.carIdx+1)%CARS.length,true);p.update(dt,s);}
    collisions();
  }
  for(let i=queue.length-1;i>=0;i--){queue[i].t-=dt;if(queue[i].t<=0){const f=queue[i].fn;queue.splice(i,1);f();}}
  updateObjects(dt);updateDebris(dt);updateParts(dt);
  updateCamera(dt,T);updateHUD();
  renderer.render(scene,camera);
  pressed.clear();touch.jumpP=false;touch.swapP=false;
}
requestAnimationFrame(loop);
window.__sp={mega,explode,addScore};
