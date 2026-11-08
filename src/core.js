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

/* ---------- quality ---------- */
// 'high' = toy-plastic materials, soft shadows, environment light, antialiasing. 'phone' = lighter everything.
// Pick with ?q=high / ?q=phone, or the pause menu (remembered on this device).
const QUALITY=(()=>{try{const q=new URLSearchParams(location.search).get('q')||localStorage.getItem('sp_quality');if(q==='high'||q==='phone')return q;}catch(e){}return IS_PHONE?'phone':'high';})();
const HIGH=QUALITY==='high';
function setQuality(q){try{localStorage.setItem('sp_quality',q);}catch(e){}location.reload();}

/* ---------- renderer / scene ---------- */
const renderer=new THREE.WebGLRenderer({antialias:HIGH,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,HIGH?2:1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.0; // Neutral keeps the toy colors bright (ACES washed them out)
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap; // PCFSoftShadowMap is gone in current three; shadow.radius softens instead
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
const SKY_TOP='#3d9cf0',SKY_HORIZON='#bfe6ff'; // TODO(design): tune sky colors
const skyU={top:{value:new THREE.Color(SKY_TOP)},bot:{value:new THREE.Color(SKY_HORIZON)}}; // zones tint these (game.js)
scene.fog=new THREE.Fog(SKY_HORIZON,160,300);
const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.5,700);
// sky: a gradient dome that rides along with the camera
{const sky=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:skyU,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=clamp(normalize(vP).y*1.6+0.15,0.0,1.0);gl_FragColor=vec4(mix(bot,top,h),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
  sky.renderOrder=-1;sky.frustumCulled=false;sky.onBeforeRender=(r,s,cam)=>sky.position.copy(cam.position);scene.add(sky);}
// warm sun + sky/ground bounce light (+ a soft studio environment on high for that toy-plastic shine)
scene.add(new THREE.HemisphereLight('#d6ecff','#7a9a52',HIGH?1.4:1.9));
const sun=new THREE.DirectionalLight('#fff0d4',HIGH?2.4:2.3);
sun.castShadow=true;sun.shadow.mapSize.set(HIGH?2048:1024,HIGH?2048:1024);sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.02;sun.shadow.radius=HIGH?3:1;
const sc=sun.shadow.camera;sc.near=1;sc.far=260;
scene.add(sun);scene.add(sun.target);
if(HIGH){const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new THREE.RoomEnvironment(),0.04).texture;scene.environmentIntensity=0.3;pm.dispose();}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

/* ---------- geometry helpers ---------- */
const matCache={};
// lit material: toy plastic on high, cheaper Lambert on phone. Every mk()/M() prop picks this up.
const litMat=o=>{if(HIGH)return new THREE.MeshStandardMaterial(Object.assign({roughness:0.62,metalness:0.04},o));const l=Object.assign({},o);delete l.roughness;delete l.metalness;return new THREE.MeshLambertMaterial(l);};
const M=c=>{let m=matCache[c];if(!m){m=matCache[c]=litMat({color:c});m.userData.plain=true;}return m;}; // plain = only its color differs, so batches can share one material
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
/* Zone plug-ins (L15): a themed zone file in src/world/zones/<name>.js calls registerZone({...}) — see CLAUDE.md.
   It gets a map letter, a ground color, an optional sky tint, its own props/layout/size lists, and NEW WORLD mixes it in. */
const ZONES={};
function registerZone(z){
  if(!z||!z.id){console.warn('registerZone: needs an id');return;}
  let L=z.letter;if(!L||ZONE_NAMES[L]){L=[...'ABCDEGIJKLMNOQRSUVWXYZ'].find(c=>!ZONE_NAMES[c]);if(z.letter)console.warn('zone letter taken, using',L);}
  z.letter=L;ZONE_NAMES[L]=z.id;ZONE_GROUND[L]=z.ground||'#86d863';z.weight=z.weight??1;ZONES[z.id]=z;
  if(z.props&&typeof OBJ!=='undefined')Object.assign(OBJ,z.props);
  return z;}
function zoneAt(ci,cj){const row=zoneRows[cj+CHUNKS_HALF];return ZONE_NAMES[(row&&row[ci+CHUNKS_HALF])||'P']||'park';}
function onRoad(x,z,pad=0){const lim=ROAD_W/2+pad;return Math.abs(x-Math.round(x/ROAD_EVERY)*ROAD_EVERY)<lim||Math.abs(z-Math.round(z/ROAD_EVERY)*ROAD_EVERY)<lim;}

// endless outer grass + zone-tinted world ground (one tiny canvas texture = one draw call)
const ground=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2+700,ARENA*2+700),M('#7ccf5a'));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const zoneCanvas=document.createElement('canvas');zoneCanvas.width=zoneCanvas.height=CHUNKS_HALF*2+1;
const zoneTex=new THREE.CanvasTexture(zoneCanvas);zoneTex.colorSpace=THREE.SRGBColorSpace;
function setZoneMap(rows){zoneRows=rows;const n=zoneCanvas.width,cx=zoneCanvas.getContext('2d');
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){cx.fillStyle=ZONE_GROUND[rows[j][i]]||'#86d863';cx.fillRect(i,j,1,1);}
  zoneTex.needsUpdate=true;}
/* Procedural zone map: a few random zone "seeds" grow into blobs (Voronoi), home stays in the middle.
   rnd is a 0..1 random function. Add new zone letters to `letters` as design builds them. */
function randomZoneMap(rnd,letters='TFP',extra=''){ // extra: themed zone letters, one or two blobs each
  const n=CHUNKS_HALF*2+1,sites=[];for(let k=0;k<7+rnd()*4;k++)sites.push([rnd()*n,rnd()*n,letters[(k+(rnd()*letters.length|0))%letters.length]]);
  for(const l of extra)for(let k=0;k<1+(rnd()<0.5?1:0);k++){let x,y;do{x=rnd()*n;y=rnd()*n;}while(Math.abs(x-CHUNKS_HALF-0.5)<2.5&&Math.abs(y-CHUNKS_HALF-0.5)<2.5);sites.push([x,y,l]);}
  const rows=[];for(let j=0;j<n;j++){let r='';for(let i=0;i<n;i++){
    if(Math.abs(i-CHUNKS_HALF)<=1&&Math.abs(j-CHUNKS_HALF)<=1){r+='H';continue;}
    let best=1e9,z='P';for(const [x,y,l] of sites){const d=(x-i)**2+(y-j)**2;if(d<best){best=d;z=l;}}r+=z;}rows.push(r);}
  return rows;}
{setZoneMap(ZONE_MAP);const tex=zoneTex;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
  const inner=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2,ARENA*2),litMat({map:tex,roughness:0.95}));
  inner.rotation.x=-Math.PI/2;inner.position.y=0.01;inner.receiveShadow=true;scene.add(inner);}
// instanced helper for static repeated scenery (frustum culling off: r128 can't bound instances)
function instBoxes(list,color,shadow){
  const im=new THREE.InstancedMesh(GEO.box,litMat({color:'#ffffff'}),list.length);
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

/* ---------- GLB props (assets/props/) ---------- */
/* Design lists models in assets/props/props.json: {"oak_tree":{"file":"oak_tree.glb","scale":1,"y":0,"rotateY":0}}.
   prop(name, fallback) returns a fresh copy of that model (geometry and materials shared, so it's cheap) or, if the
   model isn't there, whatever fallback() builds (the old block version). The world waits for propsReady (all listed
   models loaded or failed, max 8s) before it builds, so props appear as models from the first frame. */
const propModels={};
const propsReady=Promise.race([new Promise(r=>setTimeout(r,8000)),
  (THREE.GLTFLoader&&location.protocol!=='file:'?fetch('assets/props/props.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{}):Promise.resolve({})).then(list=>{
    const L=new THREE.GLTFLoader();
    return Promise.all(Object.entries(list).map(([name,d])=>L.loadAsync('assets/props/'+d.file).then(g=>{
      const root=new THREE.Group(),m=g.scene;m.scale.setScalar(d.scale||1);m.position.y=d.y||0;m.rotation.y=d.rotateY||0;
      m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(m);propModels[name]=root;}).catch(e=>console.warn('prop',name,e))));
  }).catch(()=>{})]);
function prop(name,fallback){const m=propModels[name];return m?m.clone(true):fallback?fallback():new THREE.Group();}

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
// synth versions: used when a recorded clip (tools/sfx-lines.json) isn't available
const synth={
  crash(big){noise(big?0.6:0.3,rand(700,1500),0.8,big?0.7:0.45);noise(0.15,3500,1,0.18,'highpass');tone('square',rand(180,420),50,0.14,0.07);},
  rumble(){noise(1.6,160,0.7,0.9,'lowpass',35);tone('sine',70,28,1.4,0.6);},
  boom(){noise(1.3,700,0.7,1,'lowpass',70);tone('sine',150,32,0.9,0.7);},
  boing(){tone('sine',200,520,0.28,0.35);tone('triangle',260,640,0.2,0.12);},
  jump(){tone('triangle',300,900,0.22,0.22);},
  beep(){for(const d of [0,0.22]){tone('square',520,505,0.15,0.09,d);tone('square',655,640,0.15,0.07,d);}}, // toy car horn: beep beep!
  thud(){noise(0.25,260,1,0.45);tone('sine',95,40,0.25,0.35);},
  turbo(){noise(0.6,350,2,0.3,'bandpass',2600);},
  pop(){tone('sine',500,1300,0.12,0.25);tone('sine',800,1800,0.12,0.15,0.08);},
  join(){[392,523,659,784].forEach((f,i)=>tone('triangle',f,f,0.16,0.2,i*0.08));},
  fanfare(){[523,659,784,1047,0,784,1047,1319].forEach((f,i)=>{if(f)tone('triangle',f,f*1.005,0.28,0.25,i*0.11);});noise(1.5,3000,0.5,0.08,'highpass');}
};
/* Recorded clips made once with ElevenLabs (tools/). A bank is a folder with <id>.mp3 files + index.json.
   Clips decode after the first tap/key (AudioContext), and anything missing quietly falls back. */
const banks=[];
function clipBank(dir,lazy){const b={dir,index:{},bufs:{},lazy};banks.push(b);
  fetch(dir+'index.json').then(r=>r.ok?r.json():{}).then(j=>{b.index=j||{};loadBank(b);}).catch(()=>{});return b;}
function loadBank(b){if(!AC||b.lazy)return;for(const id in b.index)loadClip(b,id).catch(()=>{});}
function loadClip(b,id){const have=b.bufs[id];if(have&&have!=='loading')return Promise.resolve(have);if(!AC||!b.index[id])return Promise.reject();
  b.wait=b.wait||{};if(!b.wait[id]){b.bufs[id]='loading';
    b.wait[id]=fetch(b.dir+id+'.mp3').then(r=>r.arrayBuffer()).then(x=>AC.decodeAudioData(x)).then(buf=>b.bufs[id]=buf).catch(e=>{delete b.bufs[id];delete b.wait[id];throw e;});}
  return b.wait[id];}
function playClip(b,id,vol=1,rate=1){const buf=b.bufs[id];if(!AC||!buf||buf==='loading')return null;
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=buf;s.playbackRate.value=rate;g.gain.value=vol;s.connect(g);g.connect(master);s.start();return s;}
const voiceBank=clipBank('assets/sounds/voice/'),sfxBank=clipBank('assets/sounds/sfx/');
// sound effect clip (tools/sfx-lines.json); returns false if it isn't available so callers can use a synth sound instead.
// Ids with variants (crash_1, crash_2…) are played as sfxClip('crash') and pick one at random.
const sfxVariants={};
function sfxClip(id,vol=0.8,rate=1){
  if(!sfxBank.bufs[id]){const v=sfxVariants[id]||(sfxVariants[id]=Object.keys(sfxBank.index).filter(k=>k.startsWith(id+'_')&&/^\d+$/.test(k.slice(id.length+1))));
    const ready=v.filter(k=>sfxBank.bufs[k]&&sfxBank.bufs[k]!=='loading');if(ready.length)id=pick(ready);}
  return !!playClip(sfxBank,id,vol,rate);}
const SFX_VOL={crash:0.5,crash_big:0.75,rumble:0.8,boom:0.85,boing:0.55,jump:0.45,thud:0.55,turbo:0.5,pop:0.55,join:0.6,fanfare:0.65};
const SFX_GAP={crash:45,thud:80,boom:60};const sfxLast={};
const sfx={};
for(const k in synth)sfx[k]=(...a)=>{const n=performance.now();if(n-(sfxLast[k]||0)<(SFX_GAP[k]||30))return;sfxLast[k]=n;
  const id=k==='crash'&&a[0]?'crash_big':k;if(!sfxClip(id,SFX_VOL[id]||0.6,rand(0.93,1.07)*(k==='crash'?sfxPitch:1)))synth[k](...a);};
let sfxPitch=1; // game.js raises this during smash combos so each crash sounds a little higher

/* Background music (tools/make-music.mjs → assets/sounds/music/). music(id) crossfades to that track; looping
   tracks restart with a crossfade before they end; music(id,{loop:false,then:'drive'}) plays once and moves on.
   Tracks download only when first wanted (phones). Voice lines duck the music. */
const musicBank=clipBank('assets/sounds/music/',true),MUSIC_VOL=0.3,MUSIC_XF=1.5;
let musicGain=null,musicWant=null,mTrack=null;
function music(id,opts={}){if(musicWant&&musicWant.id===id)return;musicWant={id,loop:opts.loop!==false,then:opts.then};}
function playTrackNow(id,buf,loop){const t=AC.currentTime;
  if(!musicGain){musicGain=AC.createGain();musicGain.gain.value=MUSIC_VOL;musicGain.connect(master);}
  if(mTrack){const g=mTrack.g.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+MUSIC_XF);try{mTrack.src.stop(t+MUSIC_XF+0.05);}catch(e){}}
  const src=AC.createBufferSource(),g=AC.createGain();src.buffer=buf;src.connect(g);g.connect(musicGain);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+MUSIC_XF);src.start(t);mTrack={id,src,g,start:t,dur:buf.duration,loop};}
function updateMusic(){const w=musicWant;if(!AC||!w)return;
  if(!mTrack||mTrack.id!==w.id){if(!w.pending&&musicBank.index[w.id]){w.pending=true;
      loadClip(musicBank,w.id).then(buf=>{if(musicWant===w)playTrackNow(w.id,buf,w.loop);}).catch(()=>{});}return;}
  const left=mTrack.start+mTrack.dur-AC.currentTime;
  if(mTrack.loop&&left<MUSIC_XF+0.1)playTrackNow(mTrack.id,mTrack.src.buffer,true);
  else if(!mTrack.loop&&left<0.6&&w.then)music(w.then);}
function duckMusic(sec){if(!musicGain)return;const t=AC.currentTime,g=musicGain.gain;g.cancelScheduledValues(t);g.setTargetAtTime(MUSIC_VOL*0.4,t,0.05);g.setTargetAtTime(MUSIC_VOL,t+sec,0.3);}
/* Voice: say(text) plays the clip whose name is the text's slug ("MEGA SMASH!" → mega_smash.mp3),
   else the browser's robot voice. */
const voiceSlug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); // must match make-voices.mjs
let voiceSrc=null;
function stopVoice(){try{speechSynthesis.cancel();}catch(e){}if(voiceSrc){try{voiceSrc.stop();}catch(e){}voiceSrc=null;}}
let sayWant=null;
function playVoice(id,buf){stopVoice();voiceSrc=playClip(voiceBank,id,1.5);duckMusic(buf.duration);}
function robotSay(text){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.05;u.pitch=1.45;speechSynthesis.speak(u);}catch(e){}}
function say(text){if(muted)return;const id=voiceSlug(text),buf=voiceBank.bufs[id];sayWant=id;
  if(buf&&buf!=='loading'&&AC){playVoice(id,buf);return;}
  // the recording exists but is still downloading (the first seconds after start): wait for it rather than use the robot voice
  if(AC&&voiceBank.index[id]){const t0=performance.now();
    loadClip(voiceBank,id).then(b=>{if(sayWant===id&&performance.now()-t0<3000)playVoice(id,b);}).catch(()=>robotSay(text));return;}
  robotSay(text);}
function toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:0.6;if(muted)stopVoice();$('muteBtn').textContent=muted?'🔇':'🔊';}
function toggleFS(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}catch(e){}}
$('muteBtn').onclick=e=>{e.stopPropagation();initAudio();toggleMute();};
$('fsBtn').onclick=e=>{e.stopPropagation();initAudio();toggleFS();};
addEventListener('pointerdown',initAudio);
