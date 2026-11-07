(function(){
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
const ARENA=70;

/* ---------- renderer / scene ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color('#8fd3ff');
scene.fog=new THREE.Fog('#8fd3ff',160,300);
const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.5,600);
scene.add(new THREE.HemisphereLight('#ffffff','#5a8f3c',0.8));
const sun=new THREE.DirectionalLight('#fff4dd',0.85);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0006;
const sc=sun.shadow.camera;sc.near=1;sc.far=260;
scene.add(sun);scene.add(sun.target);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

/* ---------- geometry helpers ---------- */
const matCache={};
const M=c=>matCache[c]||(matCache[c]=new THREE.MeshLambertMaterial({color:c}));
const E=c=>matCache['e'+c]||(matCache['e'+c]=new THREE.MeshBasicMaterial({color:c}));
const GEO={
  box:new THREE.BoxGeometry(1,1,1),
  sph:new THREE.SphereGeometry(0.5,18,14),
  cyl:new THREE.CylinderGeometry(0.5,0.5,1,18),
  cone:new THREE.ConeGeometry(0.5,1,18),
  pyr:(()=>{const g=new THREE.ConeGeometry(0.5,1,4);g.rotateY(Math.PI/4);return g;})(),
  wheel:(()=>{const g=new THREE.CylinderGeometry(0.5,0.5,1,20);g.rotateZ(Math.PI/2);return g;})()
};
function mk(shape,sx,sy,sz,color,x=0,y=0,z=0,mat){
  const m=new THREE.Mesh(GEO[shape],mat||M(color));
  m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;
}

/* ---------- world ---------- */
const ground=new THREE.Mesh(new THREE.PlaneGeometry(700,700),M('#7ccf5a'));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const inner=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2,ARENA*2),M('#86d863'));
inner.rotation.x=-Math.PI/2;inner.position.y=0.01;inner.receiveShadow=true;scene.add(inner);
function road(w,d,x,z){const r=mk('box',w,0.04,d,'#5c6670',x,0.03,z);r.castShadow=false;scene.add(r);}
road(ARENA*2,10,0,0);road(10,ARENA*2,0,0);
for(let i=-ARENA+4;i<ARENA;i+=8){ if(Math.abs(i)<7)continue;
  const a=mk('box',4,0.05,0.5,'#ffd60a',i,0.06,0);a.castShadow=false;scene.add(a);
  const b=mk('box',0.5,0.05,4,'#ffd60a',0,0.06,i);b.castShadow=false;scene.add(b);}
// arena wall
for(let s=0;s<4;s++)for(let i=-ARENA;i<ARENA;i+=4){
  const c=((i/4)|0)%2?'#e63946':'#ffffff';
  const w=s<2?mk('box',4,1.6,1.6,c,i+2,0.8,(s?1:-1)*(ARENA+0.8)):mk('box',1.6,1.6,4,c,(s==2?1:-1)*(ARENA+0.8),0.8,i+2);
  scene.add(w);}
// distant hills
for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=rand(150,190);const h=mk('sph',rand(50,90),rand(25,50),rand(50,90),pick(['#6abf4b','#5fae45','#78c95a']),Math.cos(a)*r,0,Math.sin(a)*r);h.castShadow=false;scene.add(h);}

/* ramps */
const ramps=[];
function addRamp(x,z,th,L=11,W=7,H=3.6){
  const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(L,0);sh.lineTo(L,H);sh.lineTo(0,0);
  const g=new THREE.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(W/2,0,0);
  const m=new THREE.Mesh(g,M('#ffbe0b'));m.position.set(x,0,z);m.rotation.y=th;m.castShadow=true;m.receiveShadow=true;
  const sl=Math.atan2(H,L);
  for(let k=1;k<4;k++){const lz=L*k/4;const s=mk('box',W*0.9,0.08,0.9,'#e63946',0,H*lz/L+0.06,lz);s.rotation.x=-sl;s.castShadow=false;m.add(s);}
  scene.add(m);ramps.push({x,z,L,W,H,s:Math.sin(th),c:Math.cos(th)});
}
function groundH(x,z){let h=0;for(const r of ramps){const dx=x-r.x,dz=z-r.z;const lz=dx*r.s+dz*r.c,lx=dx*r.c-dz*r.s;if(lz>0&&lz<r.L&&Math.abs(lx)<r.W/2)h=Math.max(h,r.H*lz/r.L);}return h;}

/* ---------- audio ---------- */
let AC=null,master=null,noiseBuf=null,muted=false;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:0.6;master.connect(AC.destination);
    const len=AC.sampleRate;noiseBuf=AC.createBuffer(1,len,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}catch(e){AC=null;}
}
function noise(dur,freq,q,vol,type='lowpass',fEnd){if(!AC)return;const t=AC.currentTime;const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;
  const f=AC.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);if(fEnd)f.frequency.exponentialRampToValueAtTime(fEnd,t+dur);f.Q.value=q;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*0.5);s.stop(t+dur+0.05);}
function tone(type,f0,f1,dur,vol,delay=0){if(!AC)return;const t=AC.currentTime+delay;const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.05);}
let lastCrash=0,lastThud=0;
const sfx={
  crash(big){const n=performance.now();if(n-lastCrash<45)return;lastCrash=n;noise(big?0.6:0.3,rand(700,1500),0.8,big?0.7:0.45);noise(0.15,3500,1,0.18,'highpass');tone('square',rand(180,420),50,0.14,0.07);},
  boom(){noise(1.3,700,0.7,1,'lowpass',70);tone('sine',150,32,0.9,0.7);},
  boing(){tone('sine',200,520,0.28,0.35);tone('triangle',260,640,0.2,0.12);},
  jump(){tone('triangle',300,900,0.22,0.22);},
  thud(){const n=performance.now();if(n-lastThud<80)return;lastThud=n;noise(0.25,260,1,0.45);tone('sine',95,40,0.25,0.35);},
  turbo(){noise(0.6,350,2,0.3,'bandpass',2600);},
  pop(){tone('sine',500,1300,0.12,0.25);tone('sine',800,1800,0.12,0.15,0.08);},
  join(){[392,523,659,784].forEach((f,i)=>tone('triangle',f,f,0.16,0.2,i*0.08));},
  fanfare(){[523,659,784,1047,0,784,1047,1319].forEach((f,i)=>{if(f)tone('triangle',f,f*1.005,0.28,0.25,i*0.11);});noise(1.5,3000,0.5,0.08,'highpass');}
};
function say(text){if(muted)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.05;u.pitch=1.45;speechSynthesis.speak(u);}catch(e){}}
function toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:0.6;if(muted)try{speechSynthesis.cancel();}catch(e){}$('muteBtn').textContent=muted?'🔇':'🔊';}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}catch(e){}}
$('muteBtn').onclick=e=>{e.stopPropagation();initAudio();toggleMute();};
$('fsBtn').onclick=e=>{e.stopPropagation();initAudio();toggleFS();};
addEventListener('pointerdown',initAudio);

/* ---------- cars ---------- */
function wheel(d,w,x,y,z,hub='#e0e0e0'){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mk('wheel',w,d,d,'#222'));g.add(mk('wheel',w*1.06,d*0.5,d*0.5,hub));
  g.add(mk('box',w*1.1,d*0.14,d*0.32,'#555',0,d*0.17,0));g.userData.r=d/2;return g;
}
function base(){return {g:new THREE.Group(),wheels:[],ex:new THREE.Vector3(0,1,-2.5),h:3};}
function W(c,d,w,x,y,z,hub){const wh=wheel(d,w,x,y,z,hub);c.g.add(wh);c.wheels.push(wh);}
function add(c,...ms){ms.forEach(m=>c.g.add(m));}
const glow=c=>E(c);

function buildMonster(){const c=base();
  [[-1.9,1.6],[1.9,1.6],[-1.9,-1.6],[1.9,-1.6]].forEach(([x,z])=>W(c,2.6,1.1,x,1.3,z,'#ffd60a'));
  add(c,mk('box',2.2,0.5,4.2,'#444',0,1.6,0),mk('box',3.4,1.1,4.8,'#e63946',0,2.6,0),mk('box',3.45,0.3,2.6,'#ffbe0b',0,2.6,0.9),
    mk('box',2.8,1.1,2.2,'#e63946',0,3.7,-0.5),mk('box',2.9,0.7,1.9,'#1d3557',0,3.75,-0.5),mk('box',2.7,0.2,2.1,'#e63946',0,4.3,-0.5),
    mk('box',0.6,0.4,0.15,null,-1.1,2.75,2.42,glow('#fff6a0')),mk('box',0.6,0.4,0.15,null,1.1,2.75,2.42,glow('#fff6a0')));
  c.ex.set(0,2.4,-2.7);c.h=4.5;return c;}
function buildRocket(){const c=base();
  [[-1.15,1.5],[1.15,1.5],[-1.15,-1.5],[1.15,-1.5]].forEach(([x,z])=>W(c,1.1,0.6,x,0.55,z));
  const nose=mk('cone',2.0,1.8,0.7,'#3a86ff',0,0.85,3.1);nose.rotation.x=Math.PI/2;
  const ex=mk('cyl',0.9,0.6,0.9,'#555',0,0.9,-2.4);ex.rotation.x=Math.PI/2;
  const fl=mk('cyl',0.6,0.1,0.6,null,0,0.9,-2.72,glow('#ff7b00'));fl.rotation.x=Math.PI/2;
  add(c,mk('box',2.0,0.7,4.4,'#3a86ff',0,0.85,0),mk('box',2.05,0.2,4.45,'#ffffff',0,0.95,0),nose,mk('sph',1.1,0.8,1.6,'#9be7ff',0,1.35,0.2),
    mk('box',0.15,1.2,1.0,'#ff006e',-0.8,1.4,-1.8),mk('box',0.15,1.2,1.0,'#ff006e',0.8,1.4,-1.8),mk('box',0.15,1.0,1.0,'#ff006e',0,1.6,-1.9),ex,fl);
  c.ex.set(0,0.9,-3);c.h=2.2;return c;}
function buildShark(){const c=base();
  [[-1.15,1.6],[1.15,1.6],[-1.15,-1.6],[1.15,-1.6]].forEach(([x,z])=>W(c,1.0,0.5,x,0.5,z));
  const fin=mk('cone',0.25,1.6,1.4,'#6c7a89',0,2.75,-0.3);fin.rotation.x=-0.35;
  const t1=mk('box',0.2,1.4,0.6,'#6c7a89',0,2.0,-2.8);t1.rotation.x=0.6;const t2=mk('box',0.2,1.1,0.6,'#6c7a89',0,1.05,-2.8);t2.rotation.x=-0.6;
  add(c,mk('sph',2.4,1.7,5.2,'#7d8da1',0,1.4,0),mk('sph',2.0,1.0,4.6,'#f1f1f1',0,1.0,0.1),fin,t1,t2,
    mk('sph',0.55,0.55,0.55,'#fff',-0.8,1.85,1.6),mk('sph',0.55,0.55,0.55,'#fff',0.8,1.85,1.6),
    mk('sph',0.28,0.28,0.28,'#111',-0.92,1.9,1.8),mk('sph',0.28,0.28,0.28,'#111',0.92,1.9,1.8),mk('box',1.4,0.14,0.12,'#8b0000',0,1.05,2.45));
  for(let i=0;i<5;i++){const t=mk('cone',0.2,0.32,0.2,'#fff',-0.56+i*0.28,1.15,2.47);t.rotation.x=Math.PI;c.g.add(t);}
  c.ex.set(0,1.2,-3);c.h=3.5;return c;}
function buildDino(){const c=base();
  [-1.4,0,1.4].forEach(z=>{W(c,0.85,1.0,-1.5,0.55,z,'#888');W(c,0.85,1.0,1.5,0.55,z,'#888');});
  const tail=mk('cone',0.9,1.8,0.9,'#52b788',0,1.6,-2.4);tail.rotation.x=-Math.PI/2;
  add(c,mk('box',0.9,1.1,4.2,'#333',-1.5,0.55,0),mk('box',0.9,1.1,4.2,'#333',1.5,0.55,0),mk('box',2.4,1.4,3.2,'#52b788',0,1.6,0),
    mk('box',1.8,1.3,1.6,'#52b788',0,2.9,-0.4),mk('box',1.85,0.6,1.2,'#1d3557',0,3.0,-0.4),tail,
    mk('sph',0.55,0.55,0.55,'#fff',-0.5,3.75,0.2),mk('sph',0.55,0.55,0.55,'#fff',0.5,3.75,0.2),
    mk('sph',0.26,0.26,0.26,'#111',-0.5,3.8,0.44),mk('sph',0.26,0.26,0.26,'#111',0.5,3.8,0.44),
    mk('box',3.6,1.3,0.3,'#ffd60a',0,0.9,2.3),mk('box',0.25,0.25,1,'#555',-1,1.3,1.8),mk('box',0.25,0.25,1,'#555',1,1.3,1.8));
  [[3.65,-0.75],[3.65,-1.15],[2.5,-1.3]].forEach(([y,z])=>c.g.add(mk('cone',0.5,0.8,0.5,'#f77f00',0,y+0.3,z)));
  for(let i=0;i<4;i++)c.g.add(mk('cone',0.3,0.45,0.3,'#fff',-1.2+i*0.8,1.75,2.3));
  c.ex.set(0,1.6,-3.2);c.h=4.3;return c;}
function buildIceCream(){const c=base();
  [[-1.3,1.6],[1.3,1.6],[-1.3,-1.6],[1.3,-1.6]].forEach(([x,z])=>W(c,1.3,0.6,x,0.65,z));
  const cone=mk('cone',1.4,2.0,1.4,'#d4a373',0,4.05,0);cone.rotation.x=Math.PI;
  add(c,mk('box',2.6,2.4,4.6,'#ffafcc',0,1.85,0),mk('box',2.65,0.35,4.65,'#ffffff',0,1.2,0),mk('box',2.4,0.9,0.1,'#1d3557',0,2.4,2.31),
    mk('box',0.1,0.9,1.8,'#1d3557',1.31,2.2,-0.5),mk('box',0.1,0.9,1.8,'#1d3557',-1.31,2.2,-0.5),cone,
    mk('sph',1.6,1.6,1.6,'#ff8fab',0,5.3,0),mk('sph',1.3,1.3,1.3,'#b9fbc0',0,6.2,0),mk('sph',0.45,0.45,0.45,'#e63946',0,6.95,0));
  c.ex.set(0,0.8,-2.5);c.h=7.2;return c;}
function buildHotdog(){const c=base();
  [[-1.25,1.7],[1.25,1.7],[-1.25,-1.7],[1.25,-1.7]].forEach(([x,z])=>W(c,1.0,0.5,x,0.5,z));
  add(c,mk('sph',2.6,1.2,5.4,'#e9c46a',0,1.0,0),mk('sph',1.3,1.1,6.0,'#c1121f',0,1.6,0));
  for(let i=0;i<6;i++){const m=mk('box',0.9,0.12,0.2,'#ffd60a',0,2.17,-2+i*0.8);m.rotation.y=i%2?0.6:-0.6;c.g.add(m);}
  c.ex.set(0,1,-3);c.h=2.4;return c;}
function buildFire(){const c=base();
  [2.0,-1.0,-2.2].forEach(z=>{W(c,1.3,0.6,-1.3,0.65,z);W(c,1.3,0.6,1.3,0.65,z);});
  add(c,mk('box',2.6,1.8,6,'#d62828',0,1.6,0),mk('box',2.65,0.22,6.05,'#ffffff',0,1.3,0),mk('box',2.6,1.0,1.6,'#d62828',0,3.0,2.0),
    mk('box',2.65,0.6,1.3,'#1d3557',0,3.05,2.0),mk('box',0.5,0.3,0.4,null,-0.6,3.65,2.2,glow('#ff1e1e')),mk('box',0.5,0.3,0.4,null,0.6,3.65,2.2,glow('#1e6bff')),
    mk('box',0.15,0.15,5,'#dddddd',-0.6,2.75,-0.7),mk('box',0.15,0.15,5,'#dddddd',0.6,2.75,-0.7));
  for(let z=-3;z<=1.7;z+=0.7)c.g.add(mk('box',1.3,0.12,0.12,'#dddddd',0,2.75,z));
  c.ex.set(0,0.8,-3.2);c.h=3.9;return c;}
function buildBubble(){const c=base();
  [[-1.3,1.1],[1.3,1.1],[-1.3,-1.1],[1.3,-1.1]].forEach(([x,z])=>W(c,1.0,0.6,x,0.5,z,'#ffbe0b'));
  add(c,mk('sph',3.2,2.6,3.6,'#9d4edd',0,1.7,0),mk('sph',2.6,1.8,2.4,'#a0f0ff',0,2.2,0.6),mk('cyl',0.08,1.4,0.08,'#333',0,3.6,-0.6),
    mk('sph',0.45,0.45,0.45,'#ffbe0b',0,4.35,-0.6),mk('sph',0.5,0.5,0.5,null,-0.8,1.4,1.7,glow('#fff6a0')),mk('sph',0.5,0.5,0.5,null,0.8,1.4,1.7,glow('#fff6a0')));
  c.ex.set(0,1,-2);c.h=4.7;return c;}

const CARS=[
  {name:'Big Bouncer',emoji:'🛻',speed:24,r:2.6,build:buildMonster},
  {name:'Rocket Racer',emoji:'🚀',speed:32,r:2.0,build:buildRocket},
  {name:'Shark Attack',emoji:'🦈',speed:27,r:2.2,build:buildShark},
  {name:'Dino Dozer',emoji:'🦖',speed:21,r:2.8,build:buildDino},
  {name:'Ice Cream Smasher',emoji:'🍦',speed:24,r:2.4,build:buildIceCream},
  {name:'Hot Dog Hot Rod',emoji:'🌭',speed:28,r:2.3,build:buildHotdog},
  {name:'Fire Truck',emoji:'🚒',speed:25,r:2.6,build:buildFire},
  {name:'Bubble Buggy',emoji:'🫧',speed:26,r:2.2,build:buildBubble}
];

/* ---------- extra cars from 3D model files (assets/cars/cars.json) ----------
   Each entry: {name, emoji, file, speed, r, scale, y, rotateY, height, exhaust:[x,y,z]}
   Models must face +Z (forward) with wheels resting at y=0 after scale/y offset.
   Any mesh with "wheel" in its name spins as a wheel. */
function loadModelCars(){
  if(!THREE.GLTFLoader||location.protocol==='file:')return;
  fetch('assets/cars/cars.json').then(r=>r.ok?r.json():[]).then(list=>{
    const loader=new THREE.GLTFLoader();
    (list||[]).forEach(def=>{
      loader.load('assets/cars/'+def.file,gltf=>{
        const tmpl=gltf.scene;
        tmpl.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
        CARS.push({name:def.name,emoji:def.emoji||'🚗',speed:def.speed||25,r:def.r||2.3,build:()=>{
          const c=base();const m=tmpl.clone(true);
          m.scale.setScalar(def.scale||1);m.position.y=def.y||0;m.rotation.y=def.rotateY||0;c.g.add(m);
          m.traverse(o=>{if(/wheel/i.test(o.name)){const b=new THREE.Box3().setFromObject(o);o.userData.r=Math.max(0.3,(b.max.y-b.min.y)/2);c.wheels.push(o);}});
          if(def.exhaust)c.ex.set(...def.exhaust);c.h=def.height||3;return c;}});
      },undefined,e=>console.warn('Could not load car model',def.file,e));
    });
  }).catch(()=>{});
}
loadModelCars();

/* ---------- smashable objects ---------- */
let objects=[];
function makeObj(x,z,r,h,points,build,opts={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const o=Object.assign({g,x,z,r,h,points,parts:[],alive:true,falling:false,fy:0,vy:0},opts);
  const P=(mesh,n=4,whole=false,half=0.5)=>{g.add(mesh);o.parts.push({mesh,n,whole,half});return mesh;};
  build(P,g,o);scene.add(g);objects.push(o);return o;
}
function pinMesh(){const g=new THREE.Group();
  g.add(mk('sph',1.3,1.9,1.3,'#ffffff',0,-0.4,0),mk('cyl',0.55,1.0,0.55,'#ffffff',0,0.75,0),mk('sph',0.8,0.9,0.8,'#ffffff',0,1.45,0),
    mk('cyl',0.6,0.14,0.6,'#e63946',0,0.85,0),mk('cyl',0.62,0.14,0.62,'#e63946',0,1.05,0));return g;}
const PASTEL=['#ffd6a5','#caffbf','#9bf6ff','#bdb2ff','#ffc6ff','#fdffb6','#ffadad'];
const ROOF=['#e63946','#3a86ff','#8338ec','#2a9d8f','#f77f00'];
const BLOCK=['#e63946','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#ff006e','#fb5607'];
const OBJ={
  crates:(x,z)=>{const k=1+(Math.random()*3|0);return makeObj(x,z,1.5,2.1*k,2*k,P=>{for(let i=0;i<k;i++){const c=mk('box',2.1,2.1,2.1,pick(['#c68b59','#b5835a','#d4a373']),0,1.05+i*2.1,0);c.rotation.y=rand(-.4,.4);P(c,5);}});},
  cone:(x,z)=>makeObj(x,z,.7,1.6,1,P=>{P(mk('cone',1.2,1.6,1.2,'#ff7b00',0,.8,0),1,true,.6);}),
  barrel:(x,z)=>makeObj(x,z,1.0,1.9,6,P=>{P(mk('cyl',1.7,1.9,1.7,'#e63946',0,.95,0),6);P(mk('cyl',1.75,.35,1.75,'#ffd60a',0,.95,0),2);P(mk('cyl',1.0,.1,1.0,'#9d0208',0,1.92,0),1);},{explosive:true}),
  tower:(x,z)=>{const k=4+(Math.random()*5|0);return makeObj(x,z,1.4,k*1.8,k,P=>{const s=Math.random()*7|0;for(let i=0;i<k;i++){const b=mk('box',1.8,1.8,1.8,BLOCK[(i+s)%7],0,.9+i*1.8,0);b.rotation.y=rand(-.25,.25);P(b,1,true,.9);}});},
  house:(x,z)=>makeObj(x,z,3.6,6.4,12,(P,g)=>{P(mk('box',5,3.6,5,pick(PASTEL),0,1.8,0),16);P(mk('pyr',7.4,2.6,7.4,pick(ROOF),0,4.9,0),8);
    P(mk('box',1.1,1.9,.15,'#7f4f24',0,.95,2.55),1);P(mk('box',1,1,.15,'#a0e7ff',-1.5,2.2,2.55),1);P(mk('box',1,1,.15,'#a0e7ff',1.5,2.2,2.55),1);
    P(mk('box',.7,1.5,.7,'#b5651d',1.4,5.6,0),2);g.rotation.y=(Math.random()*4|0)*Math.PI/2;},{big:true}),
  pin:(x,z)=>makeObj(x,z,1.1,5,3,P=>{const g=pinMesh();g.scale.setScalar(1.5);g.position.y=2.0;P(g,1,true,2.0);}),
  melon:(x,z)=>makeObj(x,z,1.1,1.6,3,P=>{P(mk('sph',2.0,1.6,1.6,'#2d6a4f',0,.8,0),6);P(mk('sph',1.7,1.3,1.3,'#ef476f',0,.8,0),7);}),
  snowman:(x,z)=>makeObj(x,z,1.3,5.6,5,P=>{P(mk('sph',2.4,2.4,2.4,'#ffffff',0,1.2,0),1,true,1.1);P(mk('sph',1.7,1.7,1.7,'#ffffff',0,3.0,0),1,true,.8);
    P(mk('sph',1.2,1.2,1.2,'#ffffff',0,4.3,0),1,true,.55);const n=mk('cone',.25,.8,.25,'#fb8500',0,4.3,.85);n.rotation.x=Math.PI/2;P(n,1);
    P(mk('cyl',1.0,.9,1.0,'#222222',0,5.2,0),1,true,.45);P(mk('sph',.18,.18,.18,'#111111',-.25,4.45,.55),1);P(mk('sph',.18,.18,.18,'#111111',.25,4.45,.55),1);}),
  tree:(x,z)=>makeObj(x,z,1.1,6,3,P=>{P(mk('cyl',.6,3,.6,'#8d5524',0,1.5,0),3);P(mk('sph',3.4,3.4,3.4,pick(['#ff006e','#06d6a0','#ffbe0b','#8338ec','#3a86ff']),0,4.4,0),1,true,1.6);}),
  fence:(x,z,ry=0)=>makeObj(x,z,2.1,1.7,2,(P,g)=>{for(let i=0;i<5;i++)P(mk('box',.35,1.7,.18,'#ffffff',-1.6+i*.8,.85,0),1,true,.4);
    P(mk('box',4,.22,.14,'#eeeeee',0,.5,-.15),2);P(mk('box',4,.22,.14,'#eeeeee',0,1.2,-.15),2);g.rotation.y=ry;})
};
const START_SPOTS=[[-6,48],[6,48]];
function spotOK(x,z,r){
  if(Math.abs(x)>ARENA-r-1||Math.abs(z)>ARENA-r-1)return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(groundH(x+a,z+b)>0)return false;
  return true;
}
function place(type,x,z,arg){
  const tmpR={house:3.6,crates:1.5,tower:1.4,pin:1.1,snowman:1.3,fence:2.1}[type]||1.1;
  if(!spotOK(x,z,tmpR))return null;
  for(const [a,b] of START_SPOTS)if(Math.hypot(x-a,z-b)<7)return null;
  return OBJ[type](x,z,arg);
}

function buildWorld(){
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)place('house',22+i*15+rand(-1,1),-60+j*14+rand(-1,1));
  addRamp(30,8,Math.PI);
  addRamp(-38,2,Math.PI);
  for(let row=0;row<4;row++)for(let k=0;k<=row;k++)place('pin',-38+(k-row/2)*3.4,-24-row*3.2);
  addRamp(-14,40,-Math.PI/2);
  for(let i=0;i<10;i++)place('tower',rand(-62,-32),rand(24,62));
  addRamp(0,-20,Math.PI);
  [[0,-52],[-3,-55],[3,-55],[0,-58],[-5,-50],[5,-50],[-2,-61],[2,-61]].forEach(([x,z])=>place('barrel',x,z));
  for(let i=0;i<6;i++)place('crates',rand(-12,12),rand(-66,-44));
  place('barrel',0,0);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+0.4;place('crates',Math.cos(a)*9,Math.sin(a)*9);}
  for(let i=0;i<6;i++)place('snowman',rand(20,62),rand(20,62));
  for(let i=0;i<10;i++)place('melon',rand(18,62),rand(18,62));
  [[44,44],[41,47],[47,41],[44,50]].forEach(([x,z])=>place('barrel',x,z));
  for(let x=-62;x<=62;x+=5){if(Math.abs(x)<14)continue;if(Math.random()<.75)place('cone',x,6.8);if(Math.random()<.75)place('cone',x,-6.8);}
  for(let z=-62;z<=62;z+=5){if(Math.abs(z)<14)continue;if(Math.random()<.6)place('cone',6.8,z);if(Math.random()<.6)place('cone',-6.8,z);}
  for(let x=-30;x<=30;x+=4.2)place('fence',x,63);
  for(let i=0;i<14;i++)place('tree',rand(-66,66)*(Math.random()<.5?1:-1)*0+rand(-66,66),pick([-66,66,rand(-66,66)]));
  for(let i=0;i<10;i++)place('crates',rand(-60,60),rand(-60,60));
}

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
const SPAWN_W=[['crates',3],['cone',2],['tower',2.2],['barrel',1.6],['house',1.2],['pin',1.2],['melon',1.5],['snowman',1],['tree',1]];
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
})();
