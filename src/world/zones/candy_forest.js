/* Smash Party — CANDY LAND sub-zone: GUMDROP FOREST (Z6). Owner: zone-candy agent (see agents/zone.md).
   Mint-green glades under gumdrop trees and cotton-candy trees, licorice vines, sugar crystals, gumdrop huts,
   a gumdrop treehouse on pretzel stilts and Gumdrop Mountain. weight:0: only part of Candy Land, never mixed into
   the Home World. Uses candy.js helpers + colors (loaded first). Every top-level name starts with candy/CANDY. */
const CANDY_GUM=['#ff006e','#ffbe0b','#06d6a0','#8338ec','#fb5607','#3a86ff'];
const CANDY_PRETZEL='#b5651d',CANDY_LICORICE=['#d00000','#2b2d42'];
Object.assign(CANDY_R,{crystal:.3,shroom:.45,licorice:.4,gumtree:1,jelly:.8,gumbush:1.4,cottontree:1.3,bigtree:2.6,
  gumhut:3,treehouse:4.4,gummount:9});

const CANDY_FOREST_PROPS={
  /* ---- micro ---- */
  candy_crystal:(x,z)=>sized(x,z,CANDY_R.crystal,.45,1,'micro',(P,g)=>{
    P(mk('pyr',.18,.44,.18,'#ffffff',0,.22,0),1,true,.1);
    P(candyRot(mk('pyr',.13,.32,.13,'#d0f4ff',.13,.15,.04),0,0,-.35),1,true,.08);
    P(candyRot(mk('pyr',.12,.28,.12,'#ffd6f0',-.11,.13,-.05),0,0,.4),1,true,.08);g.rotation.y=rand(0,6.28);}),
  /* ---- mini ---- */
  // a gumdrop toadstool with sugar dots
  candy_shroom:(x,z)=>sized(x,z,CANDY_R.shroom,.95,1,'mini',P=>{
    P(mk('cyl',.3,.5,.3,CANDY_ICING,0,.25,0),1);P(mk('sph',.9,.55,.9,pick(CANDY_GUM),0,.62,0),2,true,.4);
    for(let i=0;i<3;i++){const a=i*2.1+.4;P(mk('sph',.14,.1,.14,'#ffffff',Math.sin(a)*.3,.83,Math.cos(a)*.3),1);}}),
  /* ---- tiny ---- */
  // a twisty licorice vine with a curl on top
  candy_licorice:(x,z)=>sized(x,z,CANDY_R.licorice,1.7,1,'tiny',(P,g)=>{const c=pick(CANDY_LICORICE);
    for(let i=0;i<6;i++){const a=i*.9;P(mk('cyl',.2,.3,.2,c,Math.sin(a)*.14,.15+i*.24,Math.cos(a)*.14),1,i>3,.12);}
    P(candyMk('hook',.32,.32,.4,c,.16,1.5,0),1,true,.15);g.rotation.y=rand(0,6.28);}),
  /* ---- small ---- */
  // pretzel trunk, three gumdrop blobs for leaves
  candy_gumtree:(x,z)=>sized(x,z,CANDY_R.gumtree,3.6,3,'small',(P,g)=>{
    P(mk('cyl',.32,1.9,.32,CANDY_PRETZEL,0,.95,0),2);P(candyRot(mk('cyl',.2,.9,.2,CANDY_PRETZEL,.32,1.6,0),0,0,-.7),1);
    P(mk('sph',1.5,1.6,1.5,pick(CANDY_GUM),0,2.55,0),3,true,.7);P(mk('sph',1,1.1,1,pick(CANDY_GUM),.7,2.1,.2),2,true,.5);
    P(mk('sph',.9,1,.9,pick(CANDY_GUM),-.55,3.1,-.15),2,true,.45);g.rotation.y=rand(0,6.28);}),
  // a wobbly jelly cube with a little one on top: tumbles away when hit
  candy_jelly:(x,z)=>sized(x,z,CANDY_R.jelly,1.8,2,'small',(P,g)=>{
    P(mk('box',1.3,1.1,1.3,pick(CANDY_GUM),0,.55,0),3);P(mk('box',.8,.7,.8,pick(CANDY_GUM),.1,1.45,-.05),2,true,.4);
    g.rotation.y=rand(0,6.28);},{roll:true}),
  /* ---- medium ---- */
  candy_gumbush:(x,z)=>sized(x,z,CANDY_R.gumbush,2.6,5,'medium',P=>{
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2,d=i?.85:0,s=i?1.2:1.6;P(mk('sph',s,s*1.15,s,pick(CANDY_GUM),Math.sin(a)*d,s*.5,Math.cos(a)*d),2,true,s*.4);}
    P(mk('sph',1.2,1.3,1.2,pick(CANDY_GUM),0,1.9,0),2,true,.5);}),
  // a candy-stick trunk under fluffy cotton-candy clouds
  candy_cottontree:(x,z)=>sized(x,z,CANDY_R.cottontree,4.6,5,'medium',(P,g)=>{const c=pick(['#ffafcc','#a2d2ff','#cdb4db','#bde0fe']);
    P(mk('cyl',.18,2.6,.18,'#ffffff',0,1.3,0),2);
    for(const [x0,y0,s] of [[0,3.4,2.2],[.75,2.85,1.5],[-.7,3,1.5],[.1,4,1.4]])P(mk('sph',s,s*.85,s,c,x0,y0,x0*.3),3,true,.6);
    g.rotation.y=rand(0,6.28);}),
  /* ---- large ---- */
  // the big gumdrop tree: thick pretzel trunk and branches, a crown of gumdrops, sugar on top
  candy_bigtree:(x,z)=>sized(x,z,CANDY_R.bigtree,7.6,8,'large',(P,g)=>{
    P(mk('cyl',.8,3.8,.8,CANDY_PRETZEL,0,1.9,0),3);
    for(const s of [-1,1])P(candyRot(mk('cyl',.4,2.2,.4,CANDY_PRETZEL,s*.8,3.6,0),0,0,-s*.75),2);
    P(mk('sph',3.4,3.4,3.4,pick(CANDY_GUM),0,5.8,0),5,true,1.4);
    for(const [x0,y0,z0] of [[1.8,4.6,.4],[-1.8,4.7,-.3],[.4,4.4,1.6],[-.5,4.6,-1.6]])P(mk('sph',2,2.1,2,pick(CANDY_GUM),x0,y0,z0),3,true,.8);
    for(let i=0;i<5;i++){const a=i*1.26;P(mk('box',.18,.18,.18,'#ffffff',Math.sin(a)*.8,7.4,Math.cos(a)*.8),1);}
    g.rotation.y=rand(0,6.28);}),
  // gumdrop hut (BP): a round storey of gum walls under a gumdrop dome, a cherry chimney
  candy_gumhut:(x,z,arg)=>sized(x,z,CANDY_R.gumhut,5.5,8,'large',(P,g)=>{const a=pick(CANDY_GUM),b=pick(CANDY_PASTEL);
    P(BP(mk('cyl',5,.3,5,'#fff4d6',0,.15,0),0,'slab'),2);
    candyRing(P,2.2,2.6,.3,0,10,[a,b]);
    P(BP(mk('box',1,1.6,.25,CANDY_CHOCO,0,1.1,2.55),0,'extra'),1,true,.4);
    for(const sx of [-1,1])P(BP(mk('sph',.6,.6,.2,'#a0e7ff',sx*1.4,1.8,2.05),0,'extra'),1,true,.25);
    P(BP(mk('sph',5.4,3.4,5.4,a,0,2.9,0),1,'roof'),5);P(BP(mk('sph',2.6,1.8,2.6,b,0,4.4,0),1,'roof'),2);
    for(let i=0;i<6;i++){const t=i/6*Math.PI*2;P(BP(mk('box',.18,.18,.18,'#ffffff',Math.sin(t)*1.9,4.1,Math.cos(t)*1.9),1,'extra'),1,true,.1);}
    P(BP(mk('cyl',.35,.9,.35,CANDY_RED,.9,5,-.4),1,'extra'),1,true,.3);
    candyFace(g,arg);},{building:true}),
  /* ---- huge ---- */
  // gumdrop treehouse (BP): 8 pretzel stilts hold up a gum hut; licorice ladder down the front
  candy_treehouse:(x,z,arg)=>sized(x,z,CANDY_R.treehouse,11,16,'huge',(P,g)=>{const a=pick(CANDY_GUM),b=pick(CANDY_PASTEL);
    for(let i=0;i<8;i++){const t=(i+.5)/8*Math.PI*2;P(BP(mk('cyl',.6,4.2,.6,CANDY_PRETZEL,Math.sin(t)*2.6,2.1,Math.cos(t)*2.6),0,'wall'),2);}
    P(BP(mk('cyl',7.4,.5,7.4,CANDY_DOUGH,0,4.45,0),0,'slab'),3);
    candyRing(P,3,2.8,4.7,1,10,[a,b]);
    P(BP(mk('box',1.1,1.8,.25,CANDY_CHOCO,0,5.6,3.35),1,'extra'),1,true,.4);
    for(const sx of [-1,1])P(BP(mk('sph',.8,.8,.2,'#a0e7ff',sx*1.9,6.1,2.65),1,'extra'),1,true,.3);
    P(BP(mk('sph',7.2,4,7.2,a,0,7.5,0),2,'roof'),5);P(BP(mk('sph',3.4,2.4,3.4,b,0,9.3,0),2,'roof'),3);
    P(BP(mk('sph',1.2,1.2,1.2,CANDY_RED,0,10.6,0),2,'extra'),1,true,.5);
    for(const sx of [-.5,.5])P(BP(mk('box',.18,4.4,.18,CANDY_LICORICE[0],sx,2.2,3.9),0,'extra'),1,true,.5);
    for(let k=0;k<5;k++)P(BP(mk('box',1.1,.15,.15,CANDY_LICORICE[1],0,.6+k*.8,3.9),0,'extra'),1,true,.3);
    candyFace(g,arg);},{building:true}),
  /* ---- mega ---- */
  // Gumdrop Mountain: three giant gumdrops stacked up, licorice steps spiralling to the sugar crystals on top
  candy_gummount:(x,z)=>sized(x,z,CANDY_R.gummount,17,50,'mega',(P,g)=>{
    P(mk('sph',17,9,17,'#06d6a0',0,3.6,0),8);P(mk('sph',12,7.5,12,'#ffbe0b',0,8.4,0),6);P(mk('sph',7.5,6,7.5,'#ff006e',0,12.6,0),5);
    P(mk('sph',3,2.6,3,'#8338ec',0,15.6,0),2,true,1.2);
    for(let i=0;i<10;i++){const t=i*2.4,R=8.2-i*.55;P(candyRot(mk('box',2,.4,1.2,CANDY_LICORICE[i%2],Math.sin(t)*R,1.5+i*1.35,Math.cos(t)*R),0,t),1,true,.6);}
    for(let i=0;i<8;i++){const t=i/8*Math.PI*2+.2;P(mk('pyr',.7,1.6,.7,'#ffffff',Math.sin(t)*2.6,14.6,Math.cos(t)*2.6),1,true,.4);}
    g.rotation.y=rand(0,6.28);})
};
candySfx(CANDY_FOREST_PROPS,{
  candy_crystal:'candy_tinkle',candy_licorice:'candy_stretch',
  candy_shroom:'candy_boing',candy_jelly:'candy_boing',candy_gumbush:'candy_boing',candy_gumhut:'candy_boing',candy_gummount:'candy_boing',
  candy_gumtree:'candy_snap',candy_bigtree:'candy_snap',candy_treehouse:'candy_snap',candy_cottontree:'candy_squish'
});

/* ---------- scenes ---------- */
const CANDY_FOREST_SCENES={
  // a fairy ring of gumdrop toadstools around a sugar-crystal cluster
  candy_fairy_ring:{size:'mini',r:5,sizes:['micro','mini','tiny','small'],build(s){
    s.spot('glade',0,0,9,9,.4);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;s.place('candy_shroom',Math.sin(a)*3.4,Math.cos(a)*3.4);}
    s.place('candy_crystal',0,0);s.place('candy_crystal',.6,.4);s.place('candy_crystal',-.5,.5);s.place('candy_beans',.2,-.7);}},
  // a picnic blanket under a gumdrop tree: a cookie, a lollipop, sweets on plates, toadstools at the edge
  candy_picnic:{size:'mini',r:6,sizes:['mini','tiny','small'],build(s){
    s.spot('blanket',0,0,6,4.6,.15);
    s.place('candy_cookie',-1.2,-.6,null,.2);s.place('candy_popmini',1.4,-1);
    s.place('candy_mint',-.4,1);s.place('candy_wrap',.9,.8);s.place('candy_beans',1.8,.3);s.place('candy_wrap',-1.9,.9);
    s.place('candy_licorice',3.8,-2.2);s.place('candy_gumtree',-4.4,-3);s.place('candy_shroom',3.6,2.6);s.place('candy_shroom',4.3,1.8);}},
  // a gumdrop hut in its glade: a sugar path to the door, licorice fence, jelly cubes, bunnies
  candy_hut_camp:{size:'large',r:11,sizes:['medium','large','huge'],build(s){
    s.spot('glade',0,0,20,18,0);s.spot('sugar_path',0,7.5,3.4,7,0);
    s.place('candy_gumhut',0,-2,0);
    s.place('candy_bigtree',-7,-6);s.place('candy_gumtree',7,-5.5);s.place('candy_gumtree',8.4,-1.5);
    s.place('candy_jelly',-5,3);s.place('candy_jelly',-6.4,4.4);s.place('candy_gumbush',6,4);
    for(let i=0;i<4;i++){s.place('candy_licorice',-3.2-i*1.4,8.6);s.place('candy_licorice',3.2+i*1.4,8.6);}
    s.herd('bunny',4,1,3);}},
  // the treehouse: big gumdrop trees around it, a hut next door, a jump over the path
  candy_treehouse_lot:{size:'huge',r:13,sizes:['huge','mega'],build(s){
    s.spot('glade',0,0,24,22,0);s.spot('sugar_path',0,9,4,8,0);
    s.place('candy_treehouse',0,-2,0);s.place('candy_bigtree',-8,-7);s.place('candy_bigtree',8.5,-6);
    s.place('candy_gumhut',-8,4,1);s.place('candy_cottontree',7.5,3.5);s.place('candy_cottontree',9,6.5);s.place('candy_gumbush',-4,8);
    s.ramp(5,9,0,8,5,2.2);}}
};
const CANDY_GLADE={micro:['candy_crystal','candy_beans','candy_mint'],mini:['candy_shroom','candy_gumdrop'],
  tiny:['candy_licorice','candy_cupcake'],small:['candy_gumtree','candy_jelly']};

/* ---------- layout: a winding sugar path through the trees, a scene or two, one Gumdrop Mountain per map ---------- */
function candyForestLayout(ctx){
  candyRamps(ctx,1);
  const pz=ctx.cz+rand(-12,12),ph=rand(0,6);
  for(let i=0;i<5;i++){const t=ph+i*1.3;ctx.spot('sugar_path',ctx.x0+8+i*16,pz+Math.sin(t)*4,17.5,4,-Math.atan(.325*Math.cos(t)));}
  for(let i=0;i<2;i++)ctx.spot('glade',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),rand(12,18),rand(10,16),rand(0,1.5));
  if(candyIsSlot(ctx,'candy_forest','mid')){const p=candyDrop(ctx,'candy_gummount',0);
    if(p){candyRingOf(ctx,p.x,p.z,CANDY_R.gummount+3,10,'candy_gumtree');candyRingOf(ctx,p.x,p.z,CANDY_R.gummount+6,8,'candy_shroom');ctx.herd('bunny',p.x+12,p.z+10,5);}}
  else if(candyIsSlot(ctx,'candy_forest','first',2))candySceneDrop(ctx,'candy_treehouse_lot',0);
  else if(Math.random()<.45)candySceneDrop(ctx,'candy_hut_camp',0);
  for(let k=0;k<2;k++)if(Math.random()<.6){const x=rand(ctx.x0+8,ctx.x1-8),z=pz+(k?7:-7);
    if(ctx.free(x,z,3))ctx.scene(Math.random()<.5?'candy_fairy_ring':'candy_picnic',x,z,k?0:Math.PI);}
  // the trees: a jittered grid, the path kept clear
  for(let i=0;i<5;i++)for(let j=0;j<5;j++){const x=ctx.x0+8+i*16+rand(-4,4),z=ctx.z0+8+j*16+rand(-4,4);if(Math.abs(z-pz)<7)continue;
    const r=Math.random();candyPut(ctx,r<.25?'candy_bigtree':r<.6?'candy_gumtree':r<.82?'candy_cottontree':'candy_gumbush',x,z,0);}
  candySprinkle(ctx,6,['candy_jelly','candy_licorice','candy_shroom','candy_gumbush']);
  if(Math.random()<.4)candyPut(ctx,'candy_gumhut',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
  ctx.herd('bunny',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),4);
}

registerZone({
  id:'candy_forest',letter:'G',
  ground:'#bfeec8',                          // mint frosting
  sky:{top:'#8fd9b6',horizon:'#e9fff1'},
  weight:0,                                  // only part of Candy Land (L33), never mixed into the Home World
  // the candy tracks until AU15 makes the forest's own; a quiet forest ambience of its own
  music:{drive:'candy_drive',boss:'candy_boss'},
  sfx:{crash:'candy_crunch',boom:'candy_pop',land:'candy_squish',ambient:'candy_forest_ambient'},
  props:CANDY_FOREST_PROPS,
  scenes:CANDY_FOREST_SCENES,
  sizes:{
    micro:['candy_crystal','candy_beans','candy_mint'],
    mini:['candy_shroom','candy_gumdrop','candy_popmini'],
    tiny:['candy_licorice','candy_cupcake','candy_cane'],
    small:['candy_gumtree','candy_jelly','candy_marsh'],
    medium:['candy_gumbush','candy_cottontree','candy_gingerman'],
    large:['candy_bigtree','candy_gumhut','candy_swirl'],
    huge:['candy_treehouse','candy_bigtree'],
    mega:['candy_treehouse','candy_bigtree']   // Gumdrop Mountain only stands once per map
  },
  spots:{glade:CANDY_GLADE,blanket:CANDY_GLADE,sugar_path:{micro:['candy_crystal','candy_wrap'],mini:['candy_gumdrop']}},
  spotLook:{glade:'#a8e6b5',sugar_path:'#fff4d6',blanket:'#ff8fab'},
  herds:[['bunny',5]],
  layout:candyForestLayout
});
