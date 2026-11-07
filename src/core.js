/* Smash Party — core: helpers, renderer, scene, world, ramps, audio. Owner: Claude Code (logic). */
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
