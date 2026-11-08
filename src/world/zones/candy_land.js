/* Smash Party — CANDY LAND as a whole world (Z6). Owner: zone-candy agent (see agents/zone.md).
   The hand-made land map for Adventure (L33 builds a land from its `plan`; Arcade rolls a random map from `zones`).
   Loaded after candy.js and its sub-zones (candy_forest / candy_river / candy_peaks), so their letters are known.
   Part 2 (after Q3a, docs/worlds/candy.md): CANDY_QUEST_AT has every quest's spots, and candyLandLayout builds the
   scenery each quest needs into Adventure's map (the zone layouts call it first; it does nothing in Arcade). */
const CANDY_LAND_KEY={C:'candy',G:'candy_forest',R:'candy_river',I:'candy_peaks'};
const CANDY_LAND_PLAN=[ // one symbol per 80×80 chunk, north (−Z) on top; ci −5…5 left to right, the river runs down ci 0
  'IIIIIRIIIII', // cj −5   Ice-Cream Mountains across the north
  'IIIIIRIIIII', // cj −4   Puff's cloud meadow (ci −3)
  'GGIIIRIIIIG', // cj −3   Sundae's mountain: the Soft-Serve Volcano with a long slope up its side (ci −1)
  'GGGGCRCIIGG', // cj −2   the birthday cake plaza (ci −1): the finale
  'GGGGCRCCCGG', // cj −1   the Chocolate Falls, Captain Wafer's pier (ci 0) and Jawbreaker Jo's quarry (ci 1)
  'GGGCCRCCCCG', // cj  0   Fizzy's bank ramps (ci 1)
  'GGGCCRCCCCG', // cj  1
  'GGGCCRCCCGG', // cj  2   Cocoa's gingerbread houses along the forest road (ci −4)
  'GGCCCRCCGGG', // cj  3   Officer Glaze's donut shop (ci −4)
  'GGCCCRCCGGG', // cj  4   the start: Frosting Lane (ci −2); Lolly Lou's clearing at the forest edge (ci −4)
  'GGCCCRCCCGG', // cj  5
];
// the plan in the letters the zones really got (a letter that was taken gets swapped at registerZone)
function candyLandPlan(){return CANDY_LAND_PLAN.map(r=>r.replace(/[CGRI]/g,c=>(ZONES[CANDY_LAND_KEY[c]]||ZONES.candy).letter));}

/* ---------- where each quest happens (world x,z; Q3a's checklist) ----------
   giver = where its giver stands (props keep r clear), stage = [x,z,w,d] of its `quest_<id>` spot (marked on the map,
   so the engine finds the stage there). Point lists are ready for the steps (Z6c: checked against the pack's reads).
   Push goals sit at the stage center, so those stages are centered on their goal. `lift` points sit inside a prop's
   footprint (cupcake house, Falls) so the item rides on top and touching the prop grabs it; the summit has no prop, so
   its third number is the float height at car scale 1 (keep ≤3: a jump only reaches ~2.4 at huge). */
const candyRX=z=>candyRiverX(z,0); // the river in column 0
const CANDY_QUEST_AT={
  // chapter 1, Frosting Lane (micro–mini): the start's street, all within a few car lengths
  bun_cherries:{giver:[-153.6,343.4],r:.8,stage:[-156,336,12,20],cake:[-152.4,340.6],       // outside the bakery, the birthday cake beside Bun
    cherries:{street:[-158.6,333],roof:[-146,331]},                                          // in the lane · on the cupcake house's roof (lift)
    piles:[[-164.6,339.5],[-167.6,343.6],[-164.4,347.6]]},                                   // the 3 gumdrop piles (frosting patches) across the lane
  minty_gumballs:{giver:[-165.8,330.6],r:.8,stage:[-170.4,335.2,14,14],goal:[-170.4,335.2],goalR:2}, // the gumball machine's bowl (goal = stage center)
  snap_march:{giver:[-153.6,327.4],r:.8,stage:[-176,330,40,30],                             // the end of Frosting Lane; up the lane, then west
    rings:[[-158.4,344],[-158.4,336],[-158.4,328],[-166,317.6],[-174,317.6],[-182,317.6],[-190,317.6],[-198,317.6]]},
  // chapter 2, Gumdrop Forest west of Cake Town (tiny–small)
  lolly_cubs:{giver:[-283,311],r:1.5,stage:[-300,292,40,40]},                               // the forest edge on the road west; the clearing
  cocoa_cups:{giver:[-326.6,206],r:1.5,stage:[-320,166,70,50],                              // the forest road; gingerbread doorsteps
    drops:[[-326.6,146],[-313.4,134],[-326.6,182],[-313.4,176],[-313.4,191]]},
  glaze_donuts:{giver:[-287,252],r:1.5,stage:[-300,244,40,40],goal:[-300,244],goalR:6},     // the donut shop's lot (goal = stage center)
  // chapter 3, the Chocolate River (medium–large)
  wafer_rings:{giver:[35,-70],r:3,stage:[24,-76,60,80],                                    // the wafer pier below the Chocolate Falls
    rings_at:{river:[candyRX(-13),-13],bridge:[candyRX(-56),-56],island:[candyRX(-45),-45],falls:[candyRX(-108.6),-110.6]}}, // falls: on the Falls prop (lift)
  jo_quarry:{giver:[88,-55],r:3,stage:[88,-86,52,40]},                                      // the gate of the rock-candy quarry, east bank
  fizzy_hoops:{giver:[50,-34],r:3,stage:[24,-70,70,200],                                    // the east bank; hoops down the river, over the Falls
    rings:[-172,-146,-126,-92,-66,-36,-13,16].map(z=>[candyRX(z),z]),ramps:[[64,-12],[64,14]]},
  // chapter 4 (huge–GIANT)
  bun_sprinkles:{giver:[-80,-112],r:6,stage:[-80,-150,140,100]},                            // the birthday cake plaza
  sundae_summit:{giver:[-110,-224],r:6,stage:[-80,-240,120,120],summit:[-67,-240,1.4]}, // the slope's top beside the volcano: floats just over the ramp, driving up grabs it
  puff_sheep:{giver:[-214,-300],r:6,stage:[-245,-330,110,80]}                               // the cotton-candy cloud meadow
};
// more places the random props keep clear of: [x,z,r]
const CANDY_KEEP=[
  [-170.4,335.2,2.6],[-152.4,340.6,1],...CANDY_QUEST_AT.bun_cherries.piles.map(([x,z])=>[x,z,1.1]),
  ...CANDY_QUEST_AT.snap_march.rings.map(([x,z])=>[x,z,1.3]),
  [-300,292,17],[-300,244,7.5],...CANDY_QUEST_AT.cocoa_cups.drops.map(([x,z])=>[x,z,2]),
  [46,-70,6],[88,-86,17],[-67,-240,5],[-245,-330,22]];
function candyClear(x,z,r){
  for(const id in CANDY_QUEST_AT){const q=CANDY_QUEST_AT[id],g=q.giver;if(g&&Math.hypot(x-g[0],z-g[1])<r+q.r+.4)return false;}
  for(const [a,b,k] of CANDY_KEEP)if(Math.hypot(x-a,z-b)<r+k)return false;return true;}
const candyInChunk=(ctx,x,z)=>chunkIdx(x)===ctx.ci&&chunkIdx(z)===ctx.cj;
function candyQuestSpots(ctx){for(const id in CANDY_QUEST_AT){const q=CANDY_QUEST_AT[id];
  if(q.stage&&candyInChunk(ctx,q.stage[0],q.stage[1]))ctx.spot('quest_'+id,q.stage[0],q.stage[1],q.stage[2],q.stage[3],0);
  if(q.giver&&candyInChunk(ctx,q.giver[0],q.giver[1]))ctx.spot('giver_'+id,q.giver[0],q.giver[1],q.r*2,q.r*2,0);}}
// the river hub's bridges: a footbridge between the Falls and the pier, and the wafer bridge Captain Wafer's ring hides under
function candyLandBridges(ctx){return candyLandOn()&&ctx.ci===0&&ctx.cj===-1?[-84,-56]:null;}

/* ---------- the quest chunks ----------
   Each builder gets the chunk's ctx (whose place / free / scene keep clear of the quest spots) plus `put` and `scene`,
   which don't (they build the quest scenery itself). World coordinates; anything off the chunk is skipped. Return true
   when the chunk is all hand-made, false to let the zone's own layout fill in the rest around it. */
const candyLandRing=(put,type,x,z,rad,n,a0=.3)=>{for(let i=0;i<n;i++){const a=a0+i/n*Math.PI*2;put(type,x+Math.sin(a)*rad,z+Math.cos(a)*rad,i%4);}};
const CANDY_LAND_BUILD={
  /* Frosting Lane (the start, ch1): icing sidewalks along both roads, Baker Bun's bakery right of the start with the
     birthday cake on the sidewalk, a cupcake house (a cherry on its roof), the gumball machine and its bowl across the
     lane, three gumdrop piles, the parade route up the lane and west, cupcake / gingerbread lots in the other corners */
  '-2,4'(ctx,put,scene){
    for(const [z,d] of [[297.5,35],[342.5,35]])for(const s of [-1,1])ctx.spot('icing_walk',-160+s*6.6,z,3.2,d,0);
    for(const [x,w] of [[-182.5,35],[-137.5,35]])for(const s of [-1,1])ctx.spot('icing_walk',x,320+s*6.6,w,3.2,0);
    put('candy_bakery',-148.5,345,3);put('candy_partycake',-152.4,340.6);put('candy_cupcakehouse',-146,331,3);
    ctx.spot('frosting',-146,338,9,22,0);
    put('candy_gumball',-172.4,330.4);ctx.spot('gum_bowl',-170.4,335.2,4,4,0);ctx.spot('gum_bowl',-170.4,335.2,4,4,Math.PI/4);
    for(const [x,z] of CANDY_QUEST_AT.bun_cherries.piles)ctx.spot('frosting',x,z,2.4,2.4,.4);
    put('candy_cupcakehouse',-178,344,1);ctx.spot('frosting',-180,344,10,10,0);
    scene('candy_bunny_tea',-190,354,0);scene('candy_sweet_stand',-134,352,0);
    scene('candy_cupcake_lot',-137,298,0);scene('candy_gingerbread_lot',-182,296,0);
    // candy-cane posts along the sidewalks (the keep-clear ctx.place skips the bakery, the bowl and the parade route)
    for(let z=284;z<=356;z+=8)if(Math.abs(z-320)>9)for(const x of [-151,-169])candyPut(ctx,'candy_cane',x,z,x<-160?1:3);
    for(let x=-196;x<=-124;x+=8)if(Math.abs(x+160)>9)for(const z of [311,329])candyPut(ctx,'candy_cane',x,z,z<320?2:0);
    for(const [x,z] of [[-191,330],[-130,334],[-196,340],[-125,341]])candyPut(ctx,'candy_lollipop',x,z,0);
    for(let i=0;i<10;i++){const s=i%2?1:-1;candyPut(ctx,pick(['candy_wrap','candy_mint','candy_beans','candy_gumdrop']),-160+s*rand(5.6,8),rand(284,358),0);}
    ctx.herd(CANDY_BEAR,-186,330,3);return true;},
  /* Lolly Lou's clearing (ch2): a round mint glade ringed with gumdrop trees, gummy bear cubs bouncing about */
  '-4,4'(ctx,put){
    ctx.spot('glade',-300,292,36,34,0);ctx.spot('glade',-300,292,30,30,Math.PI/4);
    candyLandRing(put,'candy_gumtree',-300,292,19,16);candyLandRing(put,'candy_cottontree',-300,292,23,10,.1);
    put('candy_popmini',-286.5,306.5);put('candy_popmini',-280.6,307);ctx.herd(CANDY_BEAR,-300,292,6);return false;},
  /* Officer Glaze's donut shop (ch2), facing the camera, its lot in front */
  '-4,3'(ctx,put){
    put('candy_donutshop',-300,226,0);ctx.spot('donut_lot',-300,244,14,12,0);ctx.spot('sugar_path',-300,232,4,4,0);
    for(const x of [-309,-291])put('candy_lollipop',x,233.5);put('candy_cane',-307.6,251.8,0);put('candy_cane',-292.4,251.8,0);return false;},
  /* Cocoa's gingerbread houses (ch2), doors on the forest road, a sugar-path doorstep each */
  '-4,2'(ctx,put){
    for(const [x,z] of CANDY_QUEST_AT.cocoa_cups.drops){const w=x<-320;put('candy_gingerhouse',w?-332:-308,z,w?1:3);ctx.spot('sugar_path',x,z,3,3,0);}
    return false;},
  /* the birthday cake plaza (ch4 finale): the three-tier cake in a ring of lollipops and swirls, gingerbread corners */
  '-1,-2'(ctx,put){
    ctx.spot('plaza',-80,-138,72,34,0);ctx.spot('plaza',-80,-184,72,30,0);
    put('candy_cake',-80,-138);for(const [x,z] of [[-110,-190],[-50,-190],[-110,-130],[-50,-130]])put('candy_gingerhouse',x,z,x<-80?1:3);
    candyLandRing(put,'candy_lollipop',-80,-138,13,12);candyLandRing(put,'candy_swirl',-80,-138,21,10,0);
    put('candy_arch',-80,-176,0);put('candy_gumball',-60,-182);
    candySprinkle(ctx,8,['candy_gumdrop','candy_donut','candy_cupcake','candy_marsh']);
    ctx.herd(CANDY_BEAR,-80,-122,5);ctx.herd(CANDY_SHEEP,-96,-182,3);return true;},
  /* the river hub (ch3): the Chocolate Falls mid-river, Captain Wafer's wafer pier, rafts, a marshmallow island */
  '0,-1'(ctx,put){
    const fz=-108.6;put('candy_falls',candyRX(fz),fz,0);candyRiverSpots(ctx);
    ctx.spot('mallow_isle',candyRX(-45),-45,5,6,0);ctx.spot('wafer',33,-70,14,9,0);
    put('candy_raft',24.5,-63.5);put('candy_raft',26,-76.5);for(const z of [-65.2,-74.8])put('candy_cane',27,z,1);
    for(let i=0;i<8;i++){const z=rand(ctx.z0+3,ctx.z1-3);candyBankPut(ctx,'candy_reed',candyRX(z)+(CANDY_RIVER_BANK/2+.8),z);}
    ctx.herd('duck',candyRX(-50)+4,-50,3);return true;},
  /* the east bank (ch3): the pier's land end with truffle barrels, Jawbreaker Jo's rock-candy quarry behind its gate */
  '1,-1'(ctx,put){
    ctx.spot('wafer',46,-70,12,9,0);put('candy_truffle',44.5,-75.8);put('candy_truffle',45.4,-64.4);put('candy_wafer',50.5,-76.5);
    ctx.spot('quarry',88,-86,52,40,0);ctx.spot('quarry',88,-86,40,46,0);
    for(const [x,z] of [[67,-101],[109,-101],[110,-71],[66,-71]])put('candy_geode',x,z);
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;put('candy_rockcandy',88+Math.sin(a)*23,-86+Math.cos(a)*17.5);}
    put('candy_arch',88,-63,0);ctx.ramp(100,-78,Math.PI,12,7,3.6);
    for(const [x,z] of [[56,-110],[116,-48],[60,-50],[116,-112]])candyPut(ctx,pick(['candy_swirl','candy_lollipop','candy_cupcakehouse']),x,z,0);
    ctx.herd(CANDY_BEAR,72,-50,3);return true;},
  /* Fizzy's bank ramps (ch3): two jumps aimed across the river (the zone fills the rest) */
  '1,0'(ctx){for(const [x,z] of CANDY_QUEST_AT.fizzy_hoops.ramps)ctx.ramp(x,z,-Math.PI/2,14,8,5);return false;},
  /* Sundae's mountain (ch4): the Soft-Serve Volcano with a long sprinkle slope (a ramp) up its west side, the summit at its top */
  '-1,-3'(ctx,put,scene){
    ctx.spot('mint_slope',-84,-240,44,18,0);ctx.spot('berry_slope',-60,-212,30,20,.2);ctx.spot('melt',-96,-262,10,6,.3);
    put('candy_volcano',-51,-240);ctx.ramp(-104,-240,Math.PI/2,40,14,12);
    candyLandRing(put,'candy_scoopmini',-51,-240,14,10);
    scene('candy_popsicle_grove',-60,-210,0);scene('candy_iglu_camp',-100,-266,0);
    for(const [x,z] of [[-112,-208],[-90,-206],[-44,-206],[-114,-250],[-76,-272],[-48,-272]])candyPut(ctx,'candy_scooptree',x,z,0);
    ctx.herd(CANDY_SHEEP,-80,-216,4);return true;},
  /* Puff's cloud meadow (ch4): pink and blue cotton-candy clouds, cotton-candy trees round the edge, marshmallow sheep */
  '-3,-4'(ctx){
    ctx.spot('cloud',-250,-338,46,30,0);ctx.spot('cloud',-228,-352,30,20,.3);ctx.spot('cloud',-262,-302,36,24,-.2);ctx.spot('cloud_blue',-236,-312,28,20,.5);
    ctx.spot('cloud_blue',-266,-350,20,14,-.4);
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;candyPut(ctx,i%3?'candy_cottontree':'candy_gumbush',-245+Math.sin(a)*34,-330+Math.cos(a)*32,0);}
    for(let i=0;i<6;i++)candyPut(ctx,'candy_marsh',rand(-276,-204),rand(-356,-284),0);
    ctx.herd(CANDY_SHEEP,-250,-338,6);ctx.herd(CANDY_SHEEP,-232,-306,4);return true;}
};
// called first by every Candy Land zone layout: in Adventure's land, keep the quest spots clear and build the quest chunks
function candyLandLayout(ctx){
  if(!candyLandOn())return false;
  const raw=ctx.place,f0=ctx.free,s0=ctx.scene;
  ctx.place=(t,x,z,a,r)=>candyClear(x,z,r||1.2)&&raw(t,x,z,a,r);
  ctx.free=(x,z,r)=>candyClear(x,z,r)&&f0(x,z,r);
  ctx.scene=(id,x,z,th,size)=>candyClear(x,z,8)&&s0(id,x,z,th,size);
  candyQuestSpots(ctx);
  const b=CANDY_LAND_BUILD[ctx.ci+','+ctx.cj];if(!b)return false;
  const put=(t,x,z,a)=>raw(t,x,z,a,CANDY_R[t.slice(6)]||1.2);
  const full=b(ctx,put,(id,x,z,th,size)=>s0(id,x,z,th,size));ctx.planned=true;return !!full;}

if(typeof registerWorld==='function')registerWorld({
  id:'candy',name:'Candy Land',emoji:'🍭',
  zones:Object.values(CANDY_LAND_KEY),
  plan:candyLandPlan(),
  start:[[-157.4,350],[-156.2,350.6]],       // Frosting Lane: right lane of the north-south road at x=−160, facing −Z (like SPAWN_DEFAULT)
  portal:{color:'#ff8fab',sfx:'portal_giggle'},
  music:{drive:'candy_drive',boss:'candy_boss'},
  questAt:CANDY_QUEST_AT                     // read with worldQuestAt(id,k) in Candy Land, or CANDY_QUEST_AT from the pack (like questHomeAt)
});
