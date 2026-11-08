/* Smash Party — DINO LAND as a whole world (Z5b). Owner: zone-dino agent (see agents/zone.md, docs/worlds/dino.md).
   The hand-made land for Adventure (L33 builds a land from its `plan`; Arcade rolls a random map from `zones`).
   Loaded after dino.js and its sub-zones (dino_volcano / dino_swamp / dino_dig), so their letters are known.

   The map: Volcano Peak across the north (the boss arena at the volcano's foot, Cinder's slope west of it, the long-neck
   meadow east), Tar-Pit Swamp down the west side, Fossil Dig down the east, and the jungle (Jungle Valley) in the middle
   with Pebble Village at the start (south) and Nest Hills just north of it. Each chapter is a short drive further out:
     ch1 Pebble Village (micro–mini) → ch2 Nest Hills (tiny–small) → ch3 the swamp (west) + the dig (east) (medium–large)
     → ch4 Volcano Peak (huge–GIANT).
   In the Adventure land the chunks a quest uses are built from DINO_LAND_AREAS (world coordinates, every chunk runs the
   areas it touches and ctx.place keeps only what lands inside it), the other chunks run their zone's usual layout with
   the landmarks at fixed chunks (DINO_LAND_MARKS) instead of hashed ones. Arcade's random Dino Land is untouched. */
const DINO_LAND_KEY={D:'dino',V:'dino_volcano',S:'dino_swamp',B:'dino_dig'};
const DINO_LAND_PLAN=[ // one letter per 80×80 chunk, north (−Z) on top; ci −5…5 left to right
  'VVVVVVVVVVV', // cj −5   the smiling volcano (ci 0) and the crags
  'VVVVVVVVVVV', // cj −4   the boss arena at its foot; Cinder's slope west, the long-neck meadow east
  'SVVVVVVVVVB', // cj −3
  'SSSDDDDDBBB', // cj −2   the jungle temple in the middle
  'SSSSDDDBBBB', // cj −1
  'SSSSDDDBBBB', // cj  0   Mossy's tar lagoon (west) · Professor Digby's dig (east)
  'SSSSDDDBBBB', // cj  1
  'SSSDDDDDBBB', // cj  2   Ranger Rosa's trike corral at the swamp's dry edge
  'SSDDDDDDDBB', // cj  3   Nest Hills: Theo's giant nest, Rolly's bowling hollow, Petra's hungry nests
  'SSDDDDDDDBB', // cj  4   Pebble Village: the start
  'SSDDDDDDDBB', // cj  5
];
function dinoLandPlan(){return DINO_LAND_PLAN.map(r=>r.replace(/[DVSB]/g,c=>(ZONES[DINO_LAND_KEY[c]]||ZONES.dino).letter));}
// is this the planned Adventure Dino Land? (Arcade's random Dino Land keeps the hashed landmarks and wild layouts)
const dinoLandOn=()=>typeof landW!=='undefined'&&!!landW&&landW.id==='dino'&&typeof questOn!=='undefined'&&!!questOn;

/* Where each Dino Land quest happens (world x,z), read by the pack with worldQuestAt(id,k). Same shape as
   HOME_QUEST_AT: stage = [x,z,w,d] of its `quest_<id>` spot, giver = where the giver stands (kept clear for radius r).
   Point lists: [x,z] points; `goal` = [x,z,r] (a push goal circle); `pieces` / `sneakers` name their points. */
const DINO_QUEST_AT={
  // chapter 1, Pebble Village (micro–mini): all a few car lengths from the start (P1 at 2.6,304 facing north)
  gertie_egg:{giver:[9.5,301],r:.8,stage:[13,298,8,8],nest:[11.6,299.4],egg:[15,294.6],
    leaves:[[9.4,294.8],[16.6,298.4],[13.8,302.4]]},                                   // Gertie's nest, right of the start
  rocky_race:{giver:[-7.4,307],r:.8,stage:[-18,300,24,30],                               // the village gate; logs loop round the huts
    rings:[[-8,296],[-10,288],[-18,286],[-26,289],[-29,298],[-27,309],[-19,313],[-10,310]]},
  mo_hatchlings:{giver:[8.6,287.6],r:.8,stage:[14,285,8,7]},                             // the fenced nursery up the road
  // chapter 2, Nest Hills (tiny–small), just north of the village
  theo_sneakers:{giver:[-8,262],r:1.5,stage:[-24,238,36,40],
    sneakers:{nest:[-27,229],ramp:[-14,242]}},                                            // on the giant nest · over the end of the hill ramp
  petra_worms:{giver:[60,262],r:1.5,stage:[80,238,70,50],                                // her hilltop; five hungry nests over the hills
    drops:[[54,222],[74,250],[92,224],[108,250],[102,214]]},
  rolly_bowling:{giver:[-66,252],r:1.5,stage:[-84,234,30,30],goal:[-84,231,5],           // the bowling hollow
    boulders:[[-92,218],[-84,216],[-76,218],[-98,224],[-70,224]]},                        // where the boulders start (the slope above it)
  // chapter 3, the swamp (west) and the dig (east) (medium–large)
  digby_bones:{giver:[240,56],r:3,stage:[240,38,50,48],                                  // at the display stand
    pieces:{tar:[219,52],ribcage:[222,26],ledge:[259,22]},                                // in the tar seep · on the ribcage arch · on the high ledge
    mounds:[[234,30],[246,42],[230,42],[252,32],[240,22]]},                               // the rock mounds to smash
  mossy_hoops:{giver:[-194,44],r:3,stage:[-252,40,116,76],                               // his dock on the lagoon's east shore
    rings:[[-212,58],[-232,70],[-262,66],[-288,52],[-290,24],[-264,16],[-240,22],[-222,30]]},
  rosa_trikes:{giver:[-254,126],r:3,stage:[-236,124,56,56],goal:[-236,110,10]},          // the corral, gate facing south (+Z)
  // chapter 4, Volcano Peak (huge–GIANT)
  theo_rexy:{giver:[18,-236],r:6,stage:[0,-300,140,100]},                                // by the volcano road · the boss arena
  cinder_rocks:{giver:[-214,-266],r:6,stage:[-200,-300,100,80]},                         // her beach chair on the west slope
  gertie_photo:{giver:[176,-262],r:6,stage:[200,-300,120,80]},                           // the long-neck meadow on the east slope
};
// places kept free of the zone's own clutter (stages that need room to push, catch or fight): [x,z,r]
const DINO_KEEP=[[13,298,4.4],[14,285,3.6],[-14,246,4],[-84,231,7.5],[-84,218,4],[-236,110,11.5],[-236,134,10],
  [240,34,11],[0,-300,46],[-200,-300,24],[200,-300,30]];
function dinoLandOk(x,z,r){
  for(const id in DINO_QUEST_AT){const g=DINO_QUEST_AT[id].giver;if(g&&Math.hypot(x-g[0],z-g[1])<r+DINO_QUEST_AT[id].r)return false;}
  for(const [kx,kz,kr] of DINO_KEEP)if(Math.hypot(x-kx,z-kz)<r+kr)return false;return true;}

/* ---------- a few set dressings the quests need ---------- */
Object.assign(DINO_R,{dino_beachchair:2.4,dino_stand:3});
const DINO_LAND_PROPS={
  dino_beachchair:(x,z,arg)=>sized(x,z,DINO_R.dino_beachchair,5.6,6,'large',(P,g)=>{ // Cinder's deck chair under a palm-leaf umbrella
    const st=pick(['#ff006e','#ffbe0b','#4cc9f0']);
    for(const sx of [-1,1]){P(dinoM('box',.18,.18,3,DINO_WOOD,sx*.8,.5,0,-.15),1,true,.5);P(mk('box',.16,.9,.16,DINO_WOOD,sx*.8,.45,-1.2),1);}
    P(dinoM('box',1.6,.12,2,st,0,.62,.4,-.08),1,true,.6);P(dinoM('box',1.6,.12,1.6,st,0,1.2,-1.1,-1),1,true,.6);  // seat + back
    for(let i=0;i<3;i++)P(dinoFlat(dinoM('box',1.62,.13,.3,'#ffffff',0,.64,-.3+i*.6,-.08)),1);                     // stripes
    P(mk('cyl',.14,5,.14,DINO_WOOD,1.6,2.5,0),2);dinoLeaves(P,6,1.6,5.1,0,2.2,.8,.25,DINO_LEAF,.2);                 // the umbrella
    P(mk('cyl',.5,.7,.5,'#f4a261',-1.5,.35,.8),1,true,.3);P(mk('cyl',.08,.6,.08,'#ff006e',-1.4,.9,.8),1);face(g,arg);}), // a drink with a straw
  dino_stand:(x,z,arg)=>sized(x,z,DINO_R.dino_stand,3.6,8,'large',(P,g)=>{ // Digby's display stand: a stone plinth with a bone sign
    P(mk('box',5,1,3.6,'#c9b79c',0,.5,0),3);P(mk('box',4.2,.3,3,'#deb887',0,1.15,0),1);
    for(const sx of [-1,1])P(mk('cyl',.3,2.4,.3,DINO_WOOD,sx*1.8,2.4,-1.2),1);
    P(mk('box',4,.9,.2,DINO_WOOD,0,3.2,-1.2),2);dinoBone(P,2.4,.4,3.2,DINO_BONE,1);
    for(let i=0;i<3;i++)P(mk('box',.18,.18,.5,'#ff006e',-1.2+i*1.2,1.4,1.3),1,true,.2);face(g,arg);})  // little red markers
};
dinoWithSfx(DINO_LAND_PROPS,{dino_beachchair:'dino_wood',dino_stand:'dino_rock'});
for(const k in DINO_LAND_PROPS)OBJ[k]=DINO_LAND_PROPS[k];

/* Quest scenery scenes (filler:false: only these layouts place them). Local +Z is the front. */
const DINO_LAND_SCENES={
  // a hungry nest: open beaks peeping out (Petra's drop spots)
  dino_hungry_nest:{size:'tiny',r:2.2,filler:false,build(s){s.spot('dino_clearing',0,0,4.4,4.4);s.place('dino_nest',0,0);
    for(let i=0;i<3;i++){const a=i*2.1+.5;s.place('dino_eggling',Math.sin(a)*1.6,Math.cos(a)*1.6,null,0,1.65);}}},
  // the nursery: a ring of nests inside a little fence of sticks (Mo's hatchlings run round in it)
  dino_nursery:{size:'micro',r:4,filler:false,build(s){s.spot('dino_clearing',0,0,8,7);
    for(const [x,z] of [[-2,-1.4],[1.8,-1.6],[0,1.4]])s.place('dino_nest',x,z,null,0,.2);
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;if(Math.abs(a-Math.PI*1.5)<.4)continue;s.place('dino_bonelet',Math.cos(a)*3.6,Math.sin(a)*3,i);}}},
  // Cinder's beach: her chair on a towel of warm ash, a cooling fan of palm leaves, lava rocks all over
  dino_cinder_beach:{size:'large',r:6,filler:false,build(s){s.spot('dino_ash',0,0,10,8);s.place('dino_beachchair',0,0,0);
    s.place('dino_palm',-4.4,-2.6);s.place('dino_lavarock',3.6,2,null,0,2.7);s.place('dino_magma',4,-2.4);}},
  // a ptero roost (A5b): nests on a basalt ledge, baby pteros and their eggs
  dino_ptero_roost:{size:'medium',r:9,build(s){s.spot('dino_ash',0,0,14,12);s.place('dino_basalt',0,-2);s.place('dino_basalt',-3.6,-.6,null,0,.6);
    for(const [x,z] of [[3.4,1.6],[-1.8,3.4],[4,-3]])s.place('dino_nest',x,z,null,0,1.65);s.place('dino_warmegg',.4,4.4,null,0,1.6);s.herd('ptero',2,5,3);}},
  // a baby-rex playgroup (A5b): hatchlings round a big egg, eggshell hats lying about
  dino_rex_playgroup:{size:'small',r:7,build(s){s.spot('dino_clearing',0,0,12,12);s.place('dino_egg',0,0);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;s.place('dino_eggling',Math.sin(a)*3,Math.cos(a)*3,null,0,2.7);}
    s.place('dino_stump',-4,3);s.place('dino_flower',4,-3.6);s.herd('babyrex',0,4.6,4);}},
};

// hand the scenes to their zones (the filler may also drop the roost and the playgroup), and the new spot kinds
Object.assign(ZONES.dino.scenes,{dino_hungry_nest:DINO_LAND_SCENES.dino_hungry_nest,dino_nursery:DINO_LAND_SCENES.dino_nursery,
  dino_rex_playgroup:DINO_LAND_SCENES.dino_rex_playgroup});
if(ZONES.dino_volcano)Object.assign(ZONES.dino_volcano.scenes,{dino_cinder_beach:DINO_LAND_SCENES.dino_cinder_beach,dino_ptero_roost:DINO_LAND_SCENES.dino_ptero_roost});
Object.assign(ZONES.dino.spotLook,{dino_hill:'#8cc63f',dino_hollow:'#5e8a2a'});
Object.assign(ZONES.dino.spots,{dino_hill:{micro:['dino_sprout','dino_eggling'],mini:['dino_fern'],tiny:['dino_nest','dino_flower'],small:['dino_egg','dino_cycad']},
  dino_hollow:{micro:['dino_amber'],mini:['dino_rock']}});
if(ZONES.dino_swamp){const z=ZONES.dino_swamp;Object.assign(z.spotLook,{dino_tardeep:'#1d1c24',dino_corral:'#a7c957'});Object.assign(z.water,{dino_tardeep:2});
  Object.assign(z.spots,{dino_tardeep:{micro:['dino_bubble'],mini:['dino_bubble'],tiny:['dino_bubble']},dino_corral:{micro:['dino_sprout'],mini:['dino_fern']}});}
if(ZONES.dino_dig)Object.assign(ZONES.dino_dig.spotLook,{dino_tar:'#2b2a33',dino_tardeep:'#1d1c24'}),ZONES.dino_dig.water=Object.assign(ZONES.dino_dig.water||{},{dino_tar:1,dino_tardeep:2});
if(ZONES.dino_volcano){const z=ZONES.dino_volcano;Object.assign(z.spotLook,{dino_meadow:'#7fb34a'});
  Object.assign(z.spots,{dino_meadow:{micro:['dino_sprout','dino_eggling'],mini:['dino_fern'],tiny:['dino_flower','dino_nest'],small:['dino_cycad','dino_egg'],medium:['dino_toadstool'],large:['dino_treefern'],huge:['dino_bignest']}});}

/* ---------- the quest areas: box [x0,z0,x1,z1] + the build that dresses it (world coordinates) ---------- */
// put a prop at world x,z (only the chunk it falls in keeps it)
const dinoL=(ctx,type,x,z,arg)=>ctx.raw(type,x,z,arg,DINO_R[type]||RAD[type]||1.2);
const dinoLSc=(ctx,id,x,z,th,size)=>inChunk(ctx,x,z)&&ctx.scene(id,x,z,th||0,size);
const dinoLSp=(ctx,kind,x,z,w,d,th)=>inChunk(ctx,x,z)&&ctx.spot(kind,x,z,w,d,th||0);
const dinoLRamp=(ctx,x,z,th,L,W,H)=>inChunk(ctx,x,z)&&ctx.ramp(x,z,th,L,W,H);
const dinoLHerd=(ctx,kind,x,z,n)=>inChunk(ctx,x,z)&&ctx.herd(kind,x,z,n);
function dinoLRing(ctx,type,x,z,rx,rz,n,a0=0,gap){for(let i=0;i<n;i++){const a=a0+i/n*Math.PI*2;
  if(gap!=null&&Math.abs(Math.atan2(Math.sin(a-gap),Math.cos(a-gap)))<Math.PI/n*1.2)continue;dinoL(ctx,type,x+Math.cos(a)*rx,z+Math.sin(a)*rz,i%4);}}
const DINO_LAND_AREAS=[
  /* Pebble Village (ch1): huts round a little square west of the road, Gertie's nest east of it, Mo's nursery up the
     road, micro clutter along the roadside so the cars feel tiny at the start. */
  {box:[-40,280,40,360],zone:'dino',build(ctx){
    const Q=DINO_QUEST_AT;
    // the square + the hut ring (Rocky's logs loop round it)
    dinoLSp(ctx,'dino_clearing',-18,300,11,11);dinoLSp(ctx,'dino_trail',-12,307,10,3,0);
    dinoL(ctx,'dino_stump',-18,300,0);for(const [x,z] of [[-15.6,298],[-20.4,302.4],[-19.6,297.4]])dinoL(ctx,'dino_eggling',x,z);
    for(const [x,z,f] of [[-27,293,1],[-12,292,2],[-25,308,0],[-18,316,3],[-31,301,1]])dinoL(ctx,'dino_hut',x,z,f);
    dinoL(ctx,'dino_lodge',-24,330,2);for(const [x,z] of [[-14,326],[-33,322],[-10,340],[-30,344]])dinoL(ctx,'dino_palm',x,z,0);
    for(const p of Q.rocky_race.rings)dinoL(ctx,'dino_sprout',p[0]+1.4,p[1]+.6);
    // Gertie's nest (the egg's goal) with flowers round her square, the path the egg rolled down
    dinoLSp(ctx,'quest_gertie_egg',...Q.gertie_egg.stage,0);dinoL(ctx,'dino_nest',...Q.gertie_egg.nest);
    dinoLSp(ctx,'dino_trail',13.4,296.8,1.4,5,-.7);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;dinoL(ctx,i%2?'dino_flower':'dino_fern',13+Math.cos(a)*5.2,298+Math.sin(a)*5.2);}
    // Mo's nursery
    dinoLSc(ctx,'dino_nursery',14,285,0);
    // the roadside: egglings, sprouts, bones and amber at toy scale on both sides of the start lane
    for(let z=284;z<=318;z+=2.3){dinoL(ctx,pick(['dino_eggling','dino_sprout','dino_amber','dino_bonelet']),6.4+rand(0,.8),z);
      dinoL(ctx,pick(['dino_sprout','dino_bonelet','dino_eggling']),-6.4-rand(0,.8),z+1);}
    for(const [x,z] of [[7.6,312],[-7.8,292],[7.8,280.6]])dinoL(ctx,'dino_rock',x,z);
    // south of the cross street: the big egg garden and a long-neck family
    dinoLSc(ctx,'dino_egg_hunt',20,340,0,'mini');dinoLSc(ctx,'dino_rex_playgroup',-22,345,0,'tiny');dinoLHerd(ctx,'bronto',26,352,2);
    dinoJungle(ctx,false);}},
  /* Nest Hills (ch2): grassy hill patches with ramps over them, giant nests, Theo's nest + hill ramp, Rolly's bowling
     hollow (west) and Petra's hilltop with five hungry nests (east). */
  {box:[-120,200,120,280],zone:'dino',build(ctx){
    const Q=DINO_QUEST_AT;
    for(const [x,z,w,d] of [[-24,232,30,26],[-84,236,34,30],[80,236,68,44],[-60,214,20,16],[30,214,22,18]])dinoLSp(ctx,'dino_hill',x,z,w,d);
    // Theo: the giant nest (one sneaker on top) and the hill ramp (one sneaker floats past its end)
    dinoLSp(ctx,'quest_theo_sneakers',...Q.theo_sneakers.stage,0);dinoL(ctx,'dino_bignest',...Q.theo_sneakers.sneakers.nest);
    dinoLRamp(ctx,-14,251,Math.PI,6,3.4,1.8);dinoLRing(ctx,'dino_egg',-27,229,8,8,6,.4);
    for(const [x,z] of [[-38,250],[-8,222],[-38,220]])dinoL(ctx,'dino_cycad',x,z);
    // Rolly: the bowling hollow, a rim of rocks open to the slope (north) with a ramp to bowl from
    dinoLSp(ctx,'quest_rolly_bowling',...Q.rolly_bowling.stage,0);dinoLSp(ctx,'dino_hollow',-84,231,10.5,10.5);
    dinoLRing(ctx,'dino_rock',-84,231,6.6,6.6,12,0,-Math.PI/2);dinoLRamp(ctx,-84,214,0,6,4,1.6);
    for(const [x,z] of [[-100,246],[-68,244],[-100,216],[-70,212]])dinoL(ctx,'dino_boulder',x,z);
    // Petra: her hilltop perch and the hungry nests
    dinoLSp(ctx,'quest_petra_worms',...Q.petra_worms.stage,0);
    Q.petra_worms.drops.forEach(([x,z],i)=>dinoLSc(ctx,'dino_hungry_nest',x,z,i,'small'));
    dinoL(ctx,'dino_treefern',54,266);dinoL(ctx,'dino_crystal',66,268);
    for(const [x,z] of [[64,236],[96,240],[84,212]])dinoLRamp(ctx,x,z,(x|0)%3*Math.PI/2,6,4,1.5);
    // more hills: giant nests, baby rexes and pteros (A5b), eggs everywhere
    dinoL(ctx,'dino_bignest',30,214);dinoL(ctx,'dino_bignest',-104,262);
    dinoLSc(ctx,'dino_rex_playgroup',16,240,0);dinoLSc(ctx,'dino_egg_hunt',-56,264,0,'small');
    dinoLHerd(ctx,'babyrex',24,256,4);dinoLHerd(ctx,'ptero',100,264,3);dinoLHerd(ctx,'babyrex',-110,230,3);
    dinoJungle(ctx,false);}},
  /* Mossy's tar lagoon (ch3, swamp): tar pools with deep middles, the rings over them, his dock on the east shore. */
  {box:[-320,0,-180,84],zone:'dino_swamp',build(ctx){
    const Q=DINO_QUEST_AT;dinoLSp(ctx,'quest_mossy_hoops',...Q.mossy_hoops.stage,0);
    for(const [x,z,w,d,th] of [[-218,60,24,18,.3],[-262,64,30,18,-.2],[-288,40,18,30,0],[-262,18,28,16,.15],[-232,24,22,16,-.3]]){
      dinoLSp(ctx,'dino_tar',x,z,w,d,th);dinoLSp(ctx,'dino_tardeep',x,z,w*.55,d*.5,th);}
    for(const p of Q.mossy_hoops.rings)dinoL(ctx,'dino_lily',p[0]+rand(-3,3),p[1]+rand(-2,2));
    dinoLSp(ctx,'dino_boardwalk',-200,44,14,4.4);dinoL(ctx,'dino_boathouse',-200,70,0);
    for(const [x,z] of [[-246,44],[-276,26],[-240,74]]){dinoLSp(ctx,'dino_island',x,z,7,6);dinoL(ctx,'dino_mangrove',x,z);}
    for(const [x,z] of [[-302,64],[-306,14],[-196,16],[-228,80]])dinoL(ctx,'dino_willow',x,z);
    dinoSoggy(ctx,false);}},
  /* Ranger Rosa's trike corral (ch3, the swamp's dry edge): a ring of logs, gate open to the south. */
  {box:[-266,94,-206,154],zone:'dino_swamp',build(ctx){
    const Q=DINO_QUEST_AT,[gx,gz,gr]=Q.rosa_trikes.goal;dinoLSp(ctx,'quest_rosa_trikes',...Q.rosa_trikes.stage,0);
    dinoLSp(ctx,'dino_corral',gx,gz,gr*2,gr*2);dinoLRing(ctx,'dino_log',gx,gz,gr+1.6,gr+1.6,14,0,Math.PI/2);
    dinoL(ctx,'dino_stilthouse',-222,98,2);dinoL(ctx,'dino_mossmound',-258,146);dinoL(ctx,'dino_mossmound',-214,148);
    dinoSoggy(ctx,false);}},
  /* Professor Digby's dig (ch3): the dig pit, the display stand behind him, the ribcage arch, a tar seep, a ramp up
     to a high ledge, and the rock mounds. */
  {box:[208,10,272,84],zone:'dino_dig',build(ctx){
    const Q=DINO_QUEST_AT,P_=Q.digby_bones.pieces;dinoLSp(ctx,'quest_digby_bones',...Q.digby_bones.stage,0);
    dinoLSp(ctx,'dino_pit',240,34,40,30);dinoL(ctx,'dino_stand',240,64,0);dinoL(ctx,'dino_bigbones',256,76,2);
    dinoL(ctx,'dino_ribcage',...P_.ribcage,1);
    dinoLSp(ctx,'dino_tar',P_.tar[0],P_.tar[1],12,9,.2);dinoLSp(ctx,'dino_tardeep',P_.tar[0],P_.tar[1],6,4.4,.2);
    dinoL(ctx,'dino_basalt',P_.ledge[0],P_.ledge[1]);dinoL(ctx,'dino_basalt',P_.ledge[0]+3,P_.ledge[1]-1);dinoLRamp(ctx,P_.ledge[0],P_.ledge[1]+13,Math.PI,12,6,4);
    for(const [x,z] of Q.digby_bones.mounds)dinoL(ctx,'dino_flag',x+2.4,z-2);
    for(const [x,z] of [[214,18],[266,52],[214,72]])dinoL(ctx,'dino_tent',x,z,1);dinoL(ctx,'dino_crane',226,74,0);
    dinoDusty(ctx,false);}},
  /* The boss arena (ch4): the smiling volcano at the north edge, an open ash plain at its foot, the volcano road. */
  {box:[-80,-440,80,-226],zone:'dino_volcano',build(ctx){
    const Q=DINO_QUEST_AT;dinoLSp(ctx,'quest_theo_rexy',...Q.theo_rexy.stage,0);
    dinoL(ctx,'dino_volcano',-20,-398,0);dinoLRing(ctx,'dino_basalt',-20,-398,15,15,8,.2);
    for(const [x,z] of [[-60,-300],[-52,-264],[56,-330],[60,-270]])dinoLSp(ctx,'dino_ash',x,z,18,16);
    for(const [x,z] of [[-64,-340],[66,-300],[-70,-262],[44,-360]])dinoL(ctx,'dino_cindercone',x,z,0);
    dinoLSp(ctx,'dino_lava',30,-400,6,30,0);dinoLSp(ctx,'dino_lava',-62,-406,20,6,.3);
    dinoLSc(ctx,'dino_ptero_roost',56,-410,0,'large');dinoLHerd(ctx,'ptero',-50,-372,3);
    dinoAshy(ctx,false);}},
  /* Cinder's slope (ch4): her beach chair, lava rocks the volcano hiccupped out all around. */
  {box:[-250,-340,-150,-250],zone:'dino_volcano',build(ctx){
    const Q=DINO_QUEST_AT;dinoLSp(ctx,'quest_cinder_rocks',...Q.cinder_rocks.stage,0);
    dinoLSc(ctx,'dino_cinder_beach',-202,-272,0,'huge');
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;dinoL(ctx,i%2?'dino_boulder':'dino_lavarock',-200+Math.cos(a)*30,-304+Math.sin(a)*22);}
    dinoLSp(ctx,'dino_ash',-200,-304,44,32);dinoAshy(ctx,false);}},
  /* The long-neck meadow (ch4): green grass on the volcano's east slope, flowers, ferns and a long-neck family. */
  {box:[140,-340,260,-250],zone:'dino_volcano',build(ctx){
    const Q=DINO_QUEST_AT;dinoLSp(ctx,'quest_gertie_photo',...Q.gertie_photo.stage,0);
    for(const [x,z,w,d] of [[180,-320,38,36],[220,-320,38,36],[180,-282,38,36],[220,-282,38,36]])dinoLSp(ctx,'dino_meadow',x,z,w,d);
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;dinoL(ctx,i%3?'dino_flower':'dino_treefern',200+Math.cos(a)*48,-300+Math.sin(a)*34);}
    dinoL(ctx,'dino_hotspring',236,-262,0);dinoLHerd(ctx,'bronto',244,-336,3);
    dinoAshy(ctx,false);}},
];
// the landmarks of every other chunk, at fixed chunks (ci,cj) instead of hashed ones
const DINO_LAND_MARKS={
  dino:{'0,-1':'temple','1,1':'rex','-1,0':'eggs','2,-2':'bones','-2,-2':'dig','-1,2':'nest','1,2':'nest','0,2':'eggs','1,5':'village','-1,-2':'nest'},
  dino_volcano:{'-4,-5':'crag','4,-4':'crag','3,-5':'falls','-2,-5':'falls','-4,-3':'geysers','4,-3':'bridge','-5,-4':'spa','5,-5':'spa'},
  dino_swamp:{'-4,3':'treehouse','-5,-1':'turtle','-4,5':'turtle','-3,-2':'village','-5,0':'village','-2,-1':'boathouse','-4,4':'frogs','-5,2':'tar'},
  dino_dig:{'4,3':'museum','2,-1':'office','5,-3':'office','4,-1':'find','3,-2':'find','4,5':'camp','3,2':'camp','5,1':'wall'}
};
const DINO_LAND_MAPS={};
function dinoLandMarks(id){if(!dinoLandOn()||!DINO_LAND_MARKS[id])return null;
  return DINO_LAND_MAPS[id]||(DINO_LAND_MAPS[id]=new Map(Object.entries(DINO_LAND_MARKS[id])));}
// called first by every Dino Land zone layout: true when this chunk is part of a quest area (and has been built)
function dinoLand(ctx){
  if(!dinoLandOn())return false;
  const x0=ctx.x0,z0=ctx.z0,x1=ctx.x1,z1=ctx.z1,areas=DINO_LAND_AREAS.filter(a=>a.box[0]<x1&&a.box[2]>x0&&a.box[1]<z1&&a.box[3]>z0);
  const p0=ctx.place; // the design's own props only stay off the givers; everything else also keeps the open stages free
  ctx.raw=(t,x,z,a,r)=>{for(const id in DINO_QUEST_AT){const g=DINO_QUEST_AT[id].giver;if(g&&Math.hypot(x-g[0],z-g[1])<(r||1)+DINO_QUEST_AT[id].r)return false;}return p0(t,x,z,a,r);};
  ctx.place=(t,x,z,a,r)=>dinoLandOk(x,z,r||DINO_R[t]||1.2)&&p0(t,x,z,a,r);
  for(const id in DINO_QUEST_AT){const g=DINO_QUEST_AT[id].giver;if(g)dinoLSp(ctx,'giver_'+id,g[0],g[1],DINO_QUEST_AT[id].r*2,DINO_QUEST_AT[id].r*2);}
  if(!areas.length)return false;
  for(const a of areas)a.build(ctx);
  ctx.planned=true;return true;}

if(typeof registerWorld==='function')registerWorld({
  id:'dino',name:'Dino Land',emoji:'🦖',
  zones:Object.values(DINO_LAND_KEY),
  plan:dinoLandPlan(),
  start:[[2.6,304],[3.8,304.6]],             // right lane of the road at x=0 in Pebble Village, facing north (−Z)
  portal:{color:'#7ae582',color2:'#f8961e',sfx:'portal_roar'},
  music:{drive:'dino_drive',boss:'dino_boss'},
  hello:'Welcome to Dino Land!',
  questAt:DINO_QUEST_AT
});
