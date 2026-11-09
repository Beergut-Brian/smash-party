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
   to the other lands. A home portal stands near each land's start, and in Adventure every start has a portal to each
   land whose portal has opened (QA17). Drive into one (QA15: only a car driving into it counts): swirl, whoosh, and you
   pop out at that world's start keeping abilities and cosmetics: a first visit at micro with the cars you came in, in
   Adventure a world you've been to the way you left it (QA18: size, chapter, cars, boss beaten). Look: function buildPortal(kind){…} in objects.js (D21) returns a THREE.Group at car scale 1
   (a ring ~12 across standing on the ground, facing +Z, feet at y=0; tag the swirl disc userData.swirl=true and logic
   spins it); kind is a world id ('home', 'dino', 'candy'). Without it, logic's ring + swirl + emoji badge is used. */
const WORLDS={};
let worldId='home',landW=null; // landW: the current land's def (null in the Home World, outside or in the bedroom)
const advLands=new Set();      // Adventure: lands visited in this adventure (saved)
const advOpen=new Set();       // Adventure: lands whose portal has opened in this adventure (saved, QA17): every start offers them
const advWorld={};             // Adventure: each world's size, cars and boss state when you left it (saved, QA18)
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
  if(questOn)kinds.forEach(k=>{if(k!=='home')advOpen.add(k);}); // QA17: from now on every start has these
  let ax=0,az=0;for(const pl of players){ax+=pl.x;az+=pl.z;}ax/=Math.max(1,players.length);az/=Math.max(1,players.length);
  const s=portalS(),gap=20*s,row=portalRow(ax,az,kinds.length,s,gap);
  kinds.forEach((k,i)=>queue.push({t:i*0.7,fn:()=>addPortal(k,row[i][0],row[i][1])}));
  queue.push({t:1.6,fn:()=>{showBig('🌀 PORTALS!');say('The portals are open! Pick one!');}});}
/* QA22: where the after-boss row stands: a little up the screen from the cars (the floating badges stay below the smash
   meter), on a spot not covered by a prop bigger than the cars. Tries the row at a few depths and side shifts. */
function portalSpotOk(x,z,s){const r=PORTAL_R*1.3*s,lim=WB-10*s;if(Math.abs(x)>lim||Math.abs(z)>lim)return false;
  for(const o of objects)if(o.alive&&!o.boss&&o.sz>tier&&Math.abs(o.x-x)<o.r*1.2+r&&Math.hypot(o.x-x,o.z-z)<o.r*1.2+r)return false;
  return true;}
const PORTAL_ROW_TRY=(()=>{const l=[];for(let dx=-42;dx<=42;dx+=3)for(let dz=-16;dz<=14;dz+=3)l.push([dx,dz]); // car-scale offsets of the row's middle
  return l.sort((a,b)=>Math.hypot(a[0],(a[1]+10)*1.6)-Math.hypot(b[0],(b[1]+10)*1.6));})(); // best first: ~10 up the screen, straight ahead
function portalRow(ax,az,n,s,gap){
  const at=(dx,dz)=>Array.from({length:n},(_,i)=>[ax+dx*s+(i-(n-1)/2)*gap,az+dz*s]);
  const wide=(n-1)/2*gap/s; // keep the whole row on screen (about ±32 car-scale units from the cars)
  for(const [dx,dz] of PORTAL_ROW_TRY){if(Math.abs(dx)+wide>32)continue;const r=at(dx,dz);if(r.every(q=>portalSpotOk(q[0],q[1],s)))return r;}
  // no room for the whole row: each portal takes the clear spot nearest its place in the row
  return at(0,-10).map(q=>{for(const [dx,dz] of PORTAL_ROW_TRY){const x=q[0]+dx*s,z=q[1]+(dz+10)*s;if(portalSpotOk(x,z,s))return [x,z];}return q;});}
// at a world's start, in Adventure: a portal to every land whose portal has opened (QA17), plus 🏡 in a land; Arcade: 🏡 in a land
const advOpenLands=()=>[...new Set([...advOpen,...advLands])].filter(id=>worldOk(WORLDS[id]));
// QA15: beside the cars and a little behind them, from the middle of the two start spots (≥ 6 car lengths from either
// car at micro, where the spots are 17 car-scale units apart), never where the stick naturally goes (up the screen)
const PORTAL_START_OFF=[[-34,8],[34,8],[-54,8],[54,8],[-74,8],[74,8]];
function portalsStart(){
  if(typeof roomZ!=='undefined'&&roomZ)return;
  const lands=questOn?advOpenLands().filter(id=>id!==worldId):[];
  const kinds=landW?['home',...lands]:lands;if(!kinds.length)return;
  const w=WORLDS[worldId],a0=spawnSpot(0),a1=spawnSpot(1)||a0,a=[(a0[0]+a1[0])/2,(a0[1]+a1[1])/2],s=portalS();
  kinds.forEach((k,i)=>{const at=w&&w.portalAt&&(Array.isArray(w.portalAt[0])?w.portalAt[i]:i===0&&w.portalAt),o=PORTAL_START_OFF[i%PORTAL_START_OFF.length];
    const p=at?addPortal(k,at[0],at[1],{quiet:true,start:true}):addPortal(k,a[0]+o[0]*s,a[1]+o[1]*s,{quiet:true,start:true});
    if(p&&!at)p.off=[a[0],a[1],o[0],o[1]];});} // beside the start at any size: the offset grows with the cars
/* QA15: a portal only takes a car whose player is driving into it: real speed through the ring (stick or turbo, not
   knockback from blasts or the tether pull), not in the air above it, not for a moment after a size change, and a start
   portal only once every car has been away from it. */
let portalSzK=-1,portalHold=0;
function portalWants(pl,p,sc){
  const top=pl.stats.speed*pl.sm,vz=Math.cos(pl.heading)*pl.speed,kn=Math.hypot(pl.kx,pl.kz);
  if(pl.speed<top*0.3||Math.abs(vz)<top*0.2||kn>pl.speed*0.5)return false;   // driving through the ring (it faces ±Z)
  if(T-(pl.tetherT??-9)<0.6)return false;                                        // being pulled after the other car
  return true;}
function updatePortals(dt){
  {const k=tier+(giant?1:0);if(k!==portalSzK){portalSzK=k;portalHold=1.5;}if(portalHold>0)portalHold-=dt;} // QA15: settle after a size change
  for(const p of portals){
    if(p.rise<1)p.rise=Math.min(1,p.rise+dt/1.6);if(p.arm>0)p.arm-=dt;
    p.sc+=(portalS()-p.sc)*Math.min(1,dt*2);const sc=p.sc,e=1-(1-p.rise)**3;
    if(p.off){const lim=WB-10*sc;p.x=clamp(p.off[0]+p.off[2]*sc,-lim,lim);p.z=clamp(p.off[1]+p.off[3]*sc,-lim,lim);}
    p.g.scale.setScalar(sc);p.g.position.set(p.x,groundH(p.x,p.z)-(1-e)*14*sc,p.z);
    for(const m of p.swirls)m.rotation.z-=dt*2.4;p.badge.position.y=16+Math.sin(T*2.5)*0.6;
    if(p.start&&!p.clear){p.away=p.away||new Set();for(const pl of players)if(Math.hypot(pl.x-p.x,pl.z-p.z)>PORTAL_R*2*sc+pl.r)p.away.add(pl.idx);
      p.clear=players.length>0&&players.every(pl=>p.away.has(pl.idx));}
    if(portalBusy||portalHold>0||p.arm>0||p.rise<1||(p.start&&!p.clear)||state!=='play'||(typeof garage!=='undefined'&&garage))continue;
    for(const pl of players){const dx=Math.abs(pl.x-p.x),dz=Math.abs(pl.z-p.z);
      if(dx<PORTAL_R*sc&&dz<1.2*sc+pl.r&&(pl.y||0)-groundH(p.x,p.z)<12*sc&&portalWants(pl,p,sc)){portalGo(p.kind,pl);break;}}}
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
/* QA18: in Adventure each world remembers where you were in it: size (tier, growth, GIANT, a level-up waiting), the smash
   meter, each player's car, a garage still waiting and whether its boss is beaten. Going back restores it; only a first
   visit starts at micro (chapter 1) with the cars you came in with. Arcade always starts a land fresh. */
function worldSnap(){const cars={};for(const p of players)cars[p.idx]=p.stats.name;
  return {growth,tier,giant,levelReady,levelScore,level,goal,cars,nw:nwAfterBoss,
    garage:!!(garage&&!garage.exiting)||queue.some(q=>q.fn===openGarage)};}
function worldSizeSet(st){
  growth=st.growth||0;tier=clamp(st.tier|0,0,SIZES.length-1);giant=!!st.giant;
  levelReady=!!st.levelReady&&!giant&&growth>=(GROW_AT[tier+1]??1/0);S=giant?GROW_S[GROW_S.length-1]:GROW_S[tier];
  levelScore=st.levelScore||0;level=st.level||1;goal=st.goal||100;}
function worldCarsSet(cars){if(!cars)return;for(const p of players){const nm=cars[p.idx],ci=nm?CARS.findIndex(c=>c.name===nm):-1;if(ci>=0&&ci!==p.carIdx)p.setCar(ci,false);}}
const bossQuestOpen=()=>questOn&&QUEST_LIST.some(q=>q.world===questWorld()&&!questDone.has(q.id)&&q.steps.some(t=>t.do==='boss'));
function worldAfterSet(nw){ // after rollWorld: the boss state of a world you come back to
  if(nw){nwShow();queue.push({t:2,fn:portalsOpen});}
  else if(giant&&!bossQuestOpen())queue.push({t:4,fn:()=>summonBoss()});}
// go to a world, keeping abilities and cosmetics: a first visit shrinks back to micro (tier 0 = chapter 1, L44) with the
// cars you came in with; in Adventure a world you've been to comes back the way you left it (QA18)
function enterWorld(id){
  const w=WORLDS[id];if(!w||(id!=='home'&&!worldOk(w)))return 'unknown world: '+id+' (registered: '+Object.keys(WORLDS).join(', ')+')';
  const kind=id==='home'?(questOn?'home':'outside'):id;
  if(questOn&&!roomZ)advWorld[worldId]=worldSnap();
  const back=questOn&&advWorld[id];
  if(back){worldSizeSet(back);rollWorld(true,kind,{keepCars:true,garage:!!back.garage});worldCarsSet(back.cars);worldAfterSet(back.nw);}
  else rollWorld(false,kind,{keepCars:true,garage:false});
  if(id!=='home'){unlockWorld(id);if(questOn)advLands.add(id);}
  music('drive');showBig(w.emoji+' '+w.name.toUpperCase()+'!');say(w.hello||('Welcome to '+w.name+'!'));confetti(150);players.forEach(p=>introCar(p,2.4));
  if(typeof saveGame==='function')saveGame();
  return id;}
