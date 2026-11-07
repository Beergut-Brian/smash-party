/* Smash Party — core: helpers, renderer, scene, world, ramps, audio. Owner: Claude Code (logic). */
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
// World: chunk centers sit on multiples of CHUNK, so chunk (0,0) is centered on the origin.
const CHUNK=80,CHUNKS_HALF=5,ARENA=CHUNK*(CHUNKS_HALF+0.5); // 11×11 chunks, world spans ±440
const HOME=72;  // the original hand-built arena (buildWorld) lives inside ±HOME
const ROAD_EVERY=160,ROAD_W=10;
const IS_PHONE=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);

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
const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.5,700);
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
// building part tag (see "Buildings" in CLAUDE.md): floor 0 = ground floor; kind = 'wall' | 'slab' | 'roof' | 'extra'
function BP(mesh,floor,kind='wall'){mesh.userData.floor=floor;mesh.userData.kind=kind;return mesh;}

/* ---------- world ---------- */
/* Zone map: one letter per chunk. Rows run from -Z (top of screen) to +Z, columns from -X to +X.
   H=home arena, T=town, F=farm, P=park. Design fills each zone via ZONE_LAYOUT in objects.js. */
const ZONE_NAMES={H:'home',T:'town',F:'farm',P:'park'};
const ZONE_MAP=[
  'FFFFPPPTTTT',
  'FFFFPPPTTTT',
  'FFFFPPTTTTT',
  'FFFPPPTTTTT',
  'FFFPHHHTTTT',
  'PPPPHHHTTTT',
  'PPPPHHHPPPP',
  'TTTPPPPPFFF',
  'TTTTPPPFFFF',
  'TTTTPPFFFFF',
  'TTTTPPFFFFF'
];
const ZONE_GROUND={H:'#86d863',T:'#86b878',F:'#a8c94f',P:'#6fcf55'}; // TODO(design): tune zone ground colors
const chunkIdx=v=>clamp(Math.round(v/CHUNK),-CHUNKS_HALF,CHUNKS_HALF);
let zoneRows=ZONE_MAP; // the live map; setZoneMap swaps it for a new world
function zoneAt(ci,cj){const row=zoneRows[cj+CHUNKS_HALF];return ZONE_NAMES[(row&&row[ci+CHUNKS_HALF])||'P']||'park';}
function onRoad(x,z,pad=0){const lim=ROAD_W/2+pad;return Math.abs(x-Math.round(x/ROAD_EVERY)*ROAD_EVERY)<lim||Math.abs(z-Math.round(z/ROAD_EVERY)*ROAD_EVERY)<lim;}

// endless outer grass + zone-tinted world ground (one tiny canvas texture = one draw call)
const ground=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2+700,ARENA*2+700),M('#7ccf5a'));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const zoneCanvas=document.createElement('canvas');zoneCanvas.width=zoneCanvas.height=CHUNKS_HALF*2+1;
const zoneTex=new THREE.CanvasTexture(zoneCanvas);
function setZoneMap(rows){zoneRows=rows;const n=zoneCanvas.width,cx=zoneCanvas.getContext('2d');
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){cx.fillStyle=ZONE_GROUND[rows[j][i]]||'#86d863';cx.fillRect(i,j,1,1);}
  zoneTex.needsUpdate=true;}
/* Procedural zone map: a few random zone "seeds" grow into blobs (Voronoi), home stays in the middle.
   rnd is a 0..1 random function. Add new zone letters to `letters` as design builds them. */
function randomZoneMap(rnd,letters='TFP'){
  const n=CHUNKS_HALF*2+1,sites=[];for(let k=0;k<7+rnd()*4;k++)sites.push([rnd()*n,rnd()*n,letters[(k+(rnd()*letters.length|0))%letters.length]]);
  const rows=[];for(let j=0;j<n;j++){let r='';for(let i=0;i<n;i++){
    if(Math.abs(i-CHUNKS_HALF)<=1&&Math.abs(j-CHUNKS_HALF)<=1){r+='H';continue;}
    let best=1e9,z='P';for(const [x,y,l] of sites){const d=(x-i)**2+(y-j)**2;if(d<best){best=d;z=l;}}r+=z;}rows.push(r);}
  return rows;}
{setZoneMap(ZONE_MAP);const tex=zoneTex;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
  const inner=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2,ARENA*2),new THREE.MeshLambertMaterial({map:tex}));
  inner.rotation.x=-Math.PI/2;inner.position.y=0.01;inner.receiveShadow=true;scene.add(inner);}
// instanced helper for static repeated scenery (frustum culling off: r128 can't bound instances)
function instBoxes(list,color,shadow){
  const im=new THREE.InstancedMesh(GEO.box,new THREE.MeshLambertMaterial({color:'#ffffff'}),list.length);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3(),c=new THREE.Color();
  list.forEach((b,i)=>{p.set(b[0],b[1],b[2]);s.set(b[3],b[4],b[5]);im.setMatrixAt(i,m4.compose(p,q,s));im.setColorAt(i,c.set(b[6]||color));});
  im.frustumCulled=false;im.castShadow=!!shadow;im.receiveShadow=true;scene.add(im);return im;
}
// road grid every ROAD_EVERY units, with yellow dashes
{const roads=[],dash=[];
  for(let r=-Math.floor(ARENA/ROAD_EVERY)*ROAD_EVERY;r<=ARENA;r+=ROAD_EVERY){
    roads.push([r,0.03,0,ROAD_W,0.04,ARENA*2]);roads.push([0,0.03,r,ARENA*2,0.04,ROAD_W]);
    for(let i=-ARENA+4;i<ARENA;i+=8){if(Math.abs(i-Math.round(i/ROAD_EVERY)*ROAD_EVERY)<7)continue;
      dash.push([i,0.06,r,4,0.05,0.5]);dash.push([r,0.06,i,0.5,0.05,4]);}}
  instBoxes(roads,'#5c6670');instBoxes(dash,'#ffd60a');}
// world-edge wall (soft bounce lives in game.js)
{const w=[];for(let s=0;s<4;s++)for(let i=-ARENA;i<ARENA;i+=4){
  const c=((i/4)|0)%2?'#e63946':'#ffffff',o=(s%2?1:-1)*(ARENA+0.8);
  w.push(s<2?[i+2,0.8,o,4,1.6,1.6,c]:[o,0.8,i+2,1.6,1.6,4,c]);}
  instBoxes(w,'#ffffff',true);}
// distant hills in a ring around the square world
for(let i=0;i<26;i++){const a=i/26*Math.PI*2,r=(ARENA+rand(90,150))/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));const h=mk('sph',rand(70,120),rand(30,60),rand(70,120),pick(['#6abf4b','#5fae45','#78c95a']),Math.cos(a)*r,0,Math.sin(a)*r);h.castShadow=false;scene.add(h);}

/* ramps: `ramps` holds only the ramps in loaded chunks (keeps groundH cheap). makeRamp builds one without
   adding it; addRamp builds + adds (used by buildWorld). game.js streams them in and out with their chunk. */
const ramps=[];
function makeRamp(x,z,th,L=11,W=7,H=3.6){
  const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(L,0);sh.lineTo(L,H);sh.lineTo(0,0);
  const g=new THREE.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(W/2,0,0);
  const m=new THREE.Mesh(g,M('#ffbe0b'));m.position.set(x,0,z);m.rotation.y=th;m.castShadow=true;m.receiveShadow=true;
  const sl=Math.atan2(H,L);
  for(let k=1;k<4;k++){const lz=L*k/4;const s=mk('box',W*0.9,0.08,0.9,'#e63946',0,H*lz/L+0.06,lz);s.rotation.x=-sl;s.castShadow=false;m.add(s);}
  return {x,z,L,W,H,s:Math.sin(th),c:Math.cos(th),mesh:m};
}
function addRamp(x,z,th,L,W,H){const r=makeRamp(x,z,th,L,W,H);scene.add(r.mesh);ramps.push(r);return r;}
function removeRamp(r){const i=ramps.indexOf(r);if(i>=0)ramps.splice(i,1);if(r.mesh.parent)r.mesh.parent.remove(r.mesh);}
function rampsH(list,x,z){let h=0;for(const r of list){const dx=x-r.x,dz=z-r.z;const lz=dx*r.s+dz*r.c,lx=dx*r.c-dz*r.s;if(lz>0&&lz<r.L&&Math.abs(lx)<r.W/2)h=Math.max(h,r.H*lz/r.L);}return h;}
function groundH(x,z){return rampsH(ramps,x,z);}

/* ---------- audio ---------- */
let AC=null,master=null,noiseBuf=null,muted=false;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:0.6;master.connect(AC.destination);
    const len=AC.sampleRate;noiseBuf=AC.createBuffer(1,len,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;banks.forEach(loadBank);}catch(e){AC=null;}
}
function noise(dur,freq,q,vol,type='lowpass',fEnd){if(!AC)return;const t=AC.currentTime;const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;
  const f=AC.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);if(fEnd)f.frequency.exponentialRampToValueAtTime(fEnd,t+dur);f.Q.value=q;
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*0.5);s.stop(t+dur+0.05);}
function tone(type,f0,f1,dur,vol,delay=0){if(!AC)return;const t=AC.currentTime+delay;const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.05);}
let lastCrash=0,lastThud=0;
const sfx={
  crash(big){const n=performance.now();if(n-lastCrash<45)return;lastCrash=n;noise(big?0.6:0.3,rand(700,1500),0.8,big?0.7:0.45);noise(0.15,3500,1,0.18,'highpass');tone('square',rand(180,420),50,0.14,0.07);},
  rumble(){noise(1.6,160,0.7,0.9,'lowpass',35);tone('sine',70,28,1.4,0.6);},
  boom(){noise(1.3,700,0.7,1,'lowpass',70);tone('sine',150,32,0.9,0.7);},
  boing(){tone('sine',200,520,0.28,0.35);tone('triangle',260,640,0.2,0.12);},
  jump(){tone('triangle',300,900,0.22,0.22);},
  thud(){const n=performance.now();if(n-lastThud<80)return;lastThud=n;noise(0.25,260,1,0.45);tone('sine',95,40,0.25,0.35);},
  turbo(){noise(0.6,350,2,0.3,'bandpass',2600);},
  pop(){tone('sine',500,1300,0.12,0.25);tone('sine',800,1800,0.12,0.15,0.08);},
  join(){[392,523,659,784].forEach((f,i)=>tone('triangle',f,f,0.16,0.2,i*0.08));},
  fanfare(){[523,659,784,1047,0,784,1047,1319].forEach((f,i)=>{if(f)tone('triangle',f,f*1.005,0.28,0.25,i*0.11);});noise(1.5,3000,0.5,0.08,'highpass');}
};
/* Recorded clips made once with ElevenLabs (tools/). A bank is a folder with <id>.mp3 files + index.json.
   Clips decode after the first tap/key (AudioContext), and anything missing quietly falls back. */
const banks=[];
function clipBank(dir){const b={dir,index:{},bufs:{}};banks.push(b);
  fetch(dir+'index.json').then(r=>r.ok?r.json():{}).then(j=>{b.index=j||{};loadBank(b);}).catch(()=>{});return b;}
function loadBank(b){if(!AC)return;
  for(const id in b.index)if(!b.bufs[id]){b.bufs[id]='loading';
    fetch(b.dir+id+'.mp3').then(r=>r.arrayBuffer()).then(x=>AC.decodeAudioData(x)).then(buf=>{b.bufs[id]=buf;}).catch(()=>{delete b.bufs[id];});}}
function playClip(b,id,vol=1,rate=1){const buf=b.bufs[id];if(!AC||!buf||buf==='loading')return null;
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=buf;s.playbackRate.value=rate;g.gain.value=vol;s.connect(g);g.connect(master);s.start();return s;}
const voiceBank=clipBank('assets/sounds/voice/'),sfxBank=clipBank('assets/sounds/sfx/');
// sound effect clip (tools/sfx-lines.json); returns false if it isn't available so callers can use a synth sound instead
function sfxClip(id,vol=0.8,rate=1){return !!playClip(sfxBank,id,vol,rate);}
/* Voice: say(text) plays the clip whose name is the text's slug ("MEGA SMASH!" → mega_smash.mp3),
   else the browser's robot voice. */
const voiceSlug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); // must match make-voices.mjs
let voiceSrc=null;
function stopVoice(){try{speechSynthesis.cancel();}catch(e){}if(voiceSrc){try{voiceSrc.stop();}catch(e){}voiceSrc=null;}}
function say(text){if(muted)return;const id=voiceSlug(text),buf=voiceBank.bufs[id];
  if(buf&&buf!=='loading'&&AC){stopVoice();voiceSrc=playClip(voiceBank,id,1.5);return;}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.05;u.pitch=1.45;speechSynthesis.speak(u);}catch(e){}}
function toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:0.6;if(muted)stopVoice();$('muteBtn').textContent=muted?'🔇':'🔊';}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}catch(e){}}
$('muteBtn').onclick=e=>{e.stopPropagation();initAudio();toggleMute();};
$('fsBtn').onclick=e=>{e.stopPropagation();initAudio();toggleFS();};
addEventListener('pointerdown',initAudio);
