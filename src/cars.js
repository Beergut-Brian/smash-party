/* Smash Party — CARS. Owner: Cursor (design). Depends on core.js helpers: mk, M, E, base, W, add, glow, wheel. */
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
