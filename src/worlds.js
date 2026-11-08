/* Smash Party — worlds + portals (L33). Owner: Claude Code (logic). Spec: docs/ADVENTURE.md §5.
   Loaded after world/bosses.js and before the zone files, so a land's main zone file can call registerWorld.

   A world is a set of zones with its own map, start, music, bosses and quests. The Home World (town, farm, park, home,
   and the bedroom) is built in: Adventure plays the hand-made HOME_PLAN, Arcade random maps. A land is registered by its
   zone lane, in its main zone file:
     registerWorld({id:'dino', name:'Dino Land', emoji:'🦖', zones:['dino','dino_swamp',…],   // zones[0] = the main one
       plan:[…11 strings of 11 zone letters…],  // Adventure's hand-made map (rows −Z → +Z, columns −X → +X); '.' or an
                                                 // unknown letter = zones[0]. Arcade (or no plan) = a random map of `zones`
       start:[[x,z],[x,z]],                     // P1, P2 (default: SPAWN_DEFAULT, the road at x=0)
       portalAt:[x,z],                          // where the 🏡 home portal stands near the start (default: left of P1)
       portal:{color:'#7ae582', color2:'#f8961e', sfx:'portal_roar'},  // swirl colors + the sound it makes when it opens
       music:{drive,boss},                      // fallback tracks for zones of the land without their own
       roads:true,                              // false = no road grid in this land
       hello:'Welcome to Dino Land!',           // said on arrival (add it to tools/voice-lines.json)
       questAt:{<quest id>:{giver:[x,z], r, stage:[x,z,w,d], …}}})  // like HOME_QUEST_AT; read it with worldQuestAt(id,k)
   Sub-zones are ordinary themed zones with weight:0. Zones of a land never mix into the Home World's random worlds.
   Until a land registers itself, every themed zone named dino / candy gets a one-zone land (worldDefaults).

   Portals: after the Home World boss, a portal to every land rises near the fight; after a land's boss, portals home and
   to the other lands. A home portal stands near each land's start, and in Adventure the Home World start has a portal to
   every land you've been to. Drive into one: swirl, whoosh, and you pop out tiny at that world's start, keeping cars,
   abilities and cosmetics. Look: function buildPortal(kind){…} in objects.js (D21) returns a THREE.Group at car scale 1
   (a ring ~12 across standing on the ground, facing +Z, feet at y=0; tag the swirl disc userData.swirl=true and logic
   spins it); kind is a world id ('home', 'dino', 'candy'). Without it, logic's ring + swirl + emoji badge is used. */
const WORLDS={};
let worldId='home',landW=null; // landW: the current land's def (null in the Home World, outside or in the bedroom)
const advLands=new Set();      // Adventure: lands visited in this adventure (saved)
function registerWorld(w){
  if(!w||!w.id){console.warn('registerWorld: needs an id');return;}
  w.name=w.name||w.id;w.emoji=w.emoji||'🌀';w.zones=w.zones||[w.id];w.portal=Object.assign({color:'#c77dff',color2:'#ffffff',sfx:null},w.portal);
  WORLDS[w.id]=w;return w;}
registerWorld({id:'home',name:'Home World',emoji:'🏡',zones:['town','farm','park','home'],hello:'Welcome home!',
  portal:{color:'#4cc9f0',color2:'#ffd60a',sfx:null}});
const LAND_DEFAULT={dino:{name:'Dino Land',emoji:'🦖',portal:{color:'#7ae582',color2:'#f8961e',sfx:'portal_roar'},hello:'Welcome to Dino Land!'},
  candy:{name:'Candy Land',emoji:'🍭',portal:{color:'#ff8fab',color2:'#ffffff',sfx:'portal_giggle'},hello:'Welcome to Candy Land!'}};
function worldDefaults(){for(const id in LAND_DEFAULT)if(ZONES[id]&&!WORLDS[id])registerWorld(Object.assign({id,zones:[id]},LAND_DEFAULT[id]));}
const worldOk=w=>!!w&&w.id!=='home'&&w.zones.some(z=>ZONES[z]);
const landList=()=>Object.values(WORLDS).filter(worldOk);
const landZone=id=>landList().some(w=>w.zones.includes(id)); // themed zones that belong to a land stay out of Home World maps
const arenaOn=()=>!(typeof roomZ!=='undefined'&&roomZ)&&!landW; // the hand-built home arena (±HOME) exists
function worldQuestAt(id,k){const w=WORLDS[worldId],m=w&&w.questAt&&w.questAt[id];return m?(k?m[k]:m):null;}
function worldSeedOf(id){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%1e9||1;}
// the land's zone map: Adventure uses the hand-made plan, Arcade (or no plan) grows a random one from its zones
function landRows(w,planned,rnd){
  const n=CHUNKS_HALF*2+1,ls=w.zones.map(id=>ZONES[id]&&ZONES[id].letter).filter(Boolean),base=ls[0]||'P';
  const ok=c=>c!=='H'&&!!ZONE_NAMES[c];
  if(planned&&Array.isArray(w.plan)&&w.plan.length){
    return Array.from({length:n},(_,j)=>{const r=String(w.plan[j]||'');let s='';for(let i=0;i<n;i++){const c=r[i];s+=c&&ok(c)?c:base;}return s;});}
  const sites=[[CHUNKS_HALF+0.5,CHUNKS_HALF+0.5,base]];
  for(const l of ls)for(let k=0;k<(l===base?3:2)+(rnd()<0.5?1:0);k++)sites.push([rnd()*n,rnd()*n,l]);
  const rows=[];for(let j=0;j<n;j++){let r='';for(let i=0;i<n;i++){let best=1e9,z=base;
    for(const [x,y,l] of sites){const d=(x-i-0.5)**2+(y-j-0.5)**2;if(d<best){best=d;z=l;}}r+=z;}rows.push(r);}
  return rows;}

/* ---------- portals ---------- */
const portals=[];let portalBusy=0,portalTo=null,portalFxT=0;
const portalS=()=>giant?GROW_S[GROW_S.length-1]:GROW_S[tier]; // the car scale the players are heading to
const PORTAL_R=5,PORTAL_ARM=3; // swirl radius at car scale 1; seconds before a new portal takes cars
function portalLook(kind){
  const d=typeof buildPortal==='function'&&buildPortal(kind);if(d)return d;
  const w=WORLDS[kind]||WORLDS.home,c1=w.portal.color,c2=w.portal.color2||'#ffffff',g=new THREE.Group();
  const parts=[new THREE.TorusGeometry(6,0.9,10,32).translate(0,6.6,0)]; // ring + feet merged: one draw call
  for(const s of [-1,1])parts.push(new THREE.BoxGeometry(2.4,1.2,2.4).translate(s*4.6,0.6,0));
  const ring=new THREE.Mesh(THREE.mergeGeometries(parts.map(q=>q.index?q.toNonIndexed():q)),M(c1));ring.castShadow=true;g.add(ring);
  const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d');
  for(let k=0;k<12;k++){cx.fillStyle=k%2?c1:c2;cx.beginPath();cx.moveTo(64,64);
    for(let t=0;t<=1.001;t+=0.05){const a=(k/12)*Math.PI*2+t*4,r=t*64;cx.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}
    for(let t=1;t>=0;t-=0.05){const a=((k+1)/12)*Math.PI*2+t*4,r=t*64;cx.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}cx.fill();}
  cx.fillStyle='#ffffff';cx.beginPath();cx.arc(64,64,9,0,Math.PI*2);cx.fill();
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const sw=new THREE.Mesh(new THREE.CircleGeometry(5.4,40),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
  sw.position.y=6.6;sw.userData.swirl=true;g.add(sw);
  return g;}
function portalBadge(kind){ // the world's picture floating over the ring, so a 5-year-old knows where it goes
  const w=WORLDS[kind]||WORLDS.home,cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d');
  cx.fillStyle='rgba(255,255,255,.9)';cx.beginPath();cx.arc(64,64,60,0,Math.PI*2);cx.fill();
  cx.font='84px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(w.emoji,64,70);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false}));s.scale.set(5,5,1);s.position.y=16;return s;}
function addPortal(kind,x,z,o={}){
  if(!WORLDS[kind]||(kind!=='home'&&!worldOk(WORLDS[kind])))return null;
  const lim=WB-10*portalS();x=clamp(x,-lim,lim);z=clamp(z,-lim,lim);
  const g=new THREE.Group(),look=portalLook(kind),badge=portalBadge(kind);g.add(look);g.add(badge);
  const swirls=[];look.traverse(m=>{if(m.userData&&m.userData.swirl)swirls.push(m);});
  const p={kind,x,z,g,swirls,badge,rise:o.quiet?1:0,arm:o.quiet?PORTAL_ARM*0.5:PORTAL_ARM,sc:portalS(),start:!!o.start};
  g.position.set(x,groundH(x,z),z);g.scale.setScalar(p.sc);scene.add(g);portals.push(p);
  if(!o.quiet){sfxClip('portal_whoosh',0.9)||sfx.turbo();puff(x,0.5*p.sc,z,14,4*p.sc,WORLDS[kind].portal.color);shake=Math.min(2,shake+0.6);
    const s=WORLDS[kind].portal.sfx;if(s)queue.push({t:0.9,fn:()=>sfxClip(s,1)});}
  return p;}
function clearPortals(){for(const p of portals){scene.remove(p.g);p.g.traverse(m=>{if(m.geometry)m.geometry.dispose();});}portals.length=0;}
// after a boss: a row of portals a little ahead of the cars (up the screen)
function portalsOpen(){
  if(typeof roomZ!=='undefined'&&roomZ)return;
  const kinds=worldId==='home'?landList().map(w=>w.id):['home',...landList().map(w=>w.id).filter(id=>id!==worldId)];
  if(!kinds.length||portals.some(p=>!p.start))return;
  let ax=0,az=0;for(const pl of players){ax+=pl.x;az+=pl.z;}ax/=Math.max(1,players.length);az/=Math.max(1,players.length);
  const s=portalS(),gap=20*s;
  kinds.forEach((k,i)=>queue.push({t:i*0.7,fn:()=>addPortal(k,ax+(i-(kinds.length-1)/2)*gap,az-16*s)}));
  queue.push({t:1.6,fn:()=>{showBig('🌀 PORTALS!');say('The portals are open! Pick one!');}});}
// at a world's start: the home portal in a land; in the Adventure Home World, one to every land you've been to
function portalsStart(){
  if(typeof roomZ!=='undefined'&&roomZ)return;
  const kinds=landW?['home']:(questOn?[...advLands]:[]).filter(id=>worldOk(WORLDS[id]));if(!kinds.length)return;
  const w=WORLDS[worldId],a=spawnSpot(0),s=portalS();
  kinds.forEach((k,i)=>{const at=w&&w.portalAt&&(Array.isArray(w.portalAt[0])?w.portalAt[i]:i===0&&w.portalAt);
    const p=at?addPortal(k,at[0],at[1],{quiet:true,start:true}):addPortal(k,a[0]-(16+i*18)*s,a[1]+2*s,{quiet:true,start:true});
    if(p&&!at)p.off=[a[0],a[1],-(16+i*18),2];});} // beside the start at any size: the offset grows with the cars
function updatePortals(dt){
  for(const p of portals){
    if(p.rise<1)p.rise=Math.min(1,p.rise+dt/1.6);if(p.arm>0)p.arm-=dt;
    p.sc+=(portalS()-p.sc)*Math.min(1,dt*2);const sc=p.sc,e=1-(1-p.rise)**3;
    if(p.off){const lim=WB-10*sc;p.x=clamp(p.off[0]+p.off[2]*sc,-lim,lim);p.z=clamp(p.off[1]+p.off[3]*sc,-lim,lim);}
    p.g.scale.setScalar(sc);p.g.position.set(p.x,groundH(p.x,p.z)-(1-e)*14*sc,p.z);
    for(const m of p.swirls)m.rotation.z-=dt*2.4;p.badge.position.y=16+Math.sin(T*2.5)*0.6;
    if(portalBusy||p.arm>0||p.rise<1||state!=='play'||(typeof garage!=='undefined'&&garage))continue;
    for(const pl of players){const dx=Math.abs(pl.x-p.x),dz=Math.abs(pl.z-p.z);
      if(dx<PORTAL_R*sc&&dz<1.2*sc+pl.r&&(pl.y||0)<12*sc){portalGo(p.kind,pl);break;}}}
  if(portalBusy>0)portalBusy=Math.max(0,portalBusy-dt);
  // own timers, not the queue: rollWorld empties the queue
  if(portalTo&&(portalTo.t-=dt)<=0){const k=portalTo.kind;portalTo=null;enterWorld(k);portalFxT=0.5;}
  if(portalFxT>0&&(portalFxT-=dt)<=0)portalFx.classList.remove('on');}
// the swirl transition: the screen spins into the portal's colors, the world swaps underneath, then it clears
const portalFx=document.createElement('div');portalFx.id='portalFx';document.body.appendChild(portalFx);
{const st=document.createElement('style');st.textContent=`
:where(#portalFx){position:fixed;inset:-60%;pointer-events:none;opacity:0;z-index:40;transition:opacity .8s;
  background:radial-gradient(circle,#ffffff 0 4%,transparent 14%),repeating-conic-gradient(var(--pc,#c77dff) 0 15deg,var(--pc2,#ffffff) 15deg 30deg);animation:portalSpin 1.4s linear infinite}
:where(#portalFx.on){opacity:1}
@keyframes portalSpin{from{transform:rotate(0) scale(1)}to{transform:rotate(360deg) scale(1.15)}}`;document.head.prepend(st);}
function portalGo(kind,pl){
  const w=WORLDS[kind];if(!w||portalBusy)return;portalBusy=4;
  portalFx.style.setProperty('--pc',w.portal.color);portalFx.style.setProperty('--pc2',w.portal.color2||'#ffffff');portalFx.classList.add('on');
  sfxClip('portal_whoosh',1)||sfx.turbo();if(w.portal.sfx)sfxClip(w.portal.sfx,0.8);if(pl)puff(pl.x,pl.y+S,pl.z,14,3*S,w.portal.color);
  portalTo={kind,t:0.9};}
// go to a world: shrink back to tiny at its start, keeping cars, abilities and cosmetics
function enterWorld(id){
  const w=WORLDS[id];if(!w||(id!=='home'&&!worldOk(w)))return 'unknown world: '+id+' (registered: '+Object.keys(WORLDS).join(', ')+')';
  rollWorld(false,id==='home'?(questOn?'home':'outside'):id,{keepCars:true});
  if(id!=='home'){unlockWorld(id);if(questOn)advLands.add(id);}
  music('drive');showBig(w.emoji+' '+w.name.toUpperCase()+'!');say(w.hello||('Welcome to '+w.name+'!'));confetti(150);players.forEach(p=>introCar(p,2.4));
  if(typeof saveGame==='function')saveGame();
  return id;}
