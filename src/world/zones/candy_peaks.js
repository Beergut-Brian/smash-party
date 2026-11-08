/* Smash Party — CANDY LAND sub-zone: ICE-CREAM MOUNTAINS (Z6). Owner: zone-candy agent (see agents/zone.md).
   Vanilla snowfields with mint and strawberry slopes (and jumps on them), popsicle groves, soft-serve swirls,
   melted puddles to wade through, scoop igloos, an ice-cream parlor, a three-scoop hill and the Soft-Serve
   Volcano. weight:0: only part of Candy Land. Every top-level name starts with candy/CANDY. */
const CANDY_ICE=['#fff1c1','#ffafcc','#b9fbc0','#a0c4ff','#cdb4db','#8d5524'];
const CANDY_WAFFLE='#e9b872';
Object.assign(CANDY_R,{sprinkles:.3,cherry:.25,scoopmini:.55,popsicle:.35,tipcone:.7,snowcone:.8,fudgepop:.8,softserve:1.1,
  parfait:1,scooptree:2.4,iglu:3,parlor:4.8,scoophill:5,volcano:11});

const CANDY_PEAKS_PROPS={
  /* ---- micro ---- */
  candy_sprinkles:(x,z)=>sized(x,z,CANDY_R.sprinkles,.1,1,'micro',P=>{
    for(let i=0;i<6;i++){const b=mk('box',.22,.07,.07,pick(CANDY_BRIGHT),rand(-.2,.2),.04,rand(-.2,.2));b.rotation.y=rand(0,3.14);P(b,1,true,.05);}}),
  candy_cherry:(x,z)=>sized(x,z,CANDY_R.cherry,.55,1,'micro',(P,g)=>{
    P(mk('sph',.32,.32,.32,CANDY_RED,0,.16,0),1,true,.14);P(candyRot(mk('cyl',.03,.35,.03,'#2d6a4f',.05,.45,0),0,0,-.3),1);g.rotation.y=rand(0,6.28);}),
  /* ---- mini ---- */
  // a dropped scoop melting into a puddle
  candy_scoopmini:(x,z)=>sized(x,z,CANDY_R.scoopmini,.7,1,'mini',P=>{const c=pick(CANDY_ICE);
    P(mk('cyl',1.1,.06,1.1,c,.1,.03,.05),1);P(mk('sph',.8,.6,.8,c,0,.33,0),2,true,.3);P(mk('box',.14,.05,.05,pick(CANDY_BRIGHT),.05,.64,0),1);}),
  /* ---- tiny ---- */
  candy_popsicle:(x,z)=>sized(x,z,CANDY_R.popsicle,1.6,1,'tiny',(P,g)=>{const a=pick(CANDY_BRIGHT),b=pick(CANDY_PASTEL);
    P(mk('box',.12,.6,.06,CANDY_WAFFLE,0,.3,0),1);P(mk('box',.55,.8,.22,a,0,.95,0),2,true,.3);P(mk('box',.56,.4,.23,b,0,1.4,0),1,true,.2);
    g.rotation.y=rand(0,6.28);}),
  // a cone that tipped over, its scoop rolled out
  candy_tipcone:(x,z)=>sized(x,z,CANDY_R.tipcone,.8,1,'tiny',(P,g)=>{const c=pick(CANDY_ICE);
    P(candyRot(mk('cone',.6,1.2,.6,CANDY_WAFFLE,-.3,.3,0),0,0,Math.PI/2),2,true,.3);
    P(mk('cyl',1.3,.05,1.1,c,.8,.03,0),1);P(mk('sph',.7,.6,.7,c,.65,.32,0),1,true,.3);g.rotation.y=rand(0,6.28);}),
  /* ---- small ---- */
  // a rainbow snow cone in a paper cup
  candy_snowcone:(x,z)=>sized(x,z,CANDY_R.snowcone,2.6,3,'small',P=>{
    P(candyRot(mk('cone',1.1,1.5,1.1,'#ffffff',0,.75,0),Math.PI),2);
    P(mk('sph',1.3,1.1,1.3,'#ff4d6d',0,1.75,0),2,true,.5);P(mk('sph',.9,.8,.9,'#3a86ff',.3,2.05,.1),1,true,.35);P(mk('sph',.8,.7,.8,'#ffbe0b',-.3,2.15,-.1),1,true,.3);}),
  // a giant fudge pop with a dipped top, stuck in the snow
  candy_fudgepop:(x,z)=>sized(x,z,CANDY_R.fudgepop,3.3,3,'small',(P,g)=>{
    P(mk('box',.25,1.2,.12,CANDY_WAFFLE,0,.6,0),1);P(mk('box',1.2,2,.45,'#5c3317',0,2.1,0),3,true,.6);P(mk('box',1.25,.6,.48,pick(CANDY_PASTEL),0,3,0),1,true,.3);
    g.rotation.y=rand(0,6.28);}),
  /* ---- medium ---- */
  // a soft-serve swirl in a waffle cone
  candy_softserve:(x,z)=>sized(x,z,CANDY_R.softserve,4.4,5,'medium',P=>{const c=pick(CANDY_ICE);
    P(candyRot(mk('cone',1.4,2,1.4,CANDY_WAFFLE,0,1,0),Math.PI),3);P(mk('sph',1.6,1.4,1.6,c,0,2.5,0),2);
    for(let i=0;i<4;i++){const s=1.8-i*.35;P(candyRot(candyMk('ring',s,s,2.2,c,0,2.2+i*.48,0),Math.PI/2),1,true,.4);}
    P(mk('cone',.5,.8,.5,c,0,4,0),1,true,.25);}),
  // a tall parfait glass: strawberry, vanilla, fudge and mint layers, whipped cream, a cherry and a spoon
  candy_parfait:(x,z)=>sized(x,z,CANDY_R.parfait,4.2,5,'medium',P=>{
    for(const [y,h,c] of [[.45,.9,'#ffafcc'],[1.3,.8,'#fff1c1'],[2.1,.8,'#8d5524'],[2.9,.8,'#b9fbc0']])P(mk('cyl',1.6,h,1.6,c,0,y,0),2);
    P(mk('sph',1.6,.8,1.6,'#ffffff',0,3.4,0),1,true,.4);P(mk('sph',.45,.45,.45,CANDY_RED,0,3.95,0),1,true,.2);
    P(candyRot(mk('box',.15,2.4,.3,CANDY_SILVER,.5,3.6,0),0,0,-.3),1,true,.4);}),
  /* ---- large ---- */
  // an ice-cream tree: a waffle trunk under a crown of scoops
  candy_scooptree:(x,z)=>sized(x,z,CANDY_R.scooptree,7.6,8,'large',(P,g)=>{
    P(mk('cyl',.9,3.6,.9,CANDY_WAFFLE,0,1.8,0),3);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;P(mk('sph',2.4,2.2,2.4,pick(CANDY_ICE),Math.sin(a)*1.3,4.8+(i%2)*.6,Math.cos(a)*1.3),3,true,.9);}
    P(mk('sph',2.2,2,2.2,pick(CANDY_ICE),0,6.5,0),3,true,.9);P(mk('sph',.6,.6,.6,CANDY_RED,0,7.6,0),1,true,.3);
    g.rotation.y=rand(0,6.28);}),
  // scoop igloo (BP): a ring of ice-cream bricks under a dome, an entrance tunnel, a cherry on top
  candy_iglu:(x,z,arg)=>sized(x,z,CANDY_R.iglu,5.3,8,'large',(P,g)=>{const c=pick(CANDY_ICE.slice(0,5));
    P(BP(mk('cyl',5.4,.3,5.4,'#ffffff',0,.15,0),0,'slab'),2);
    candyRing(P,2.3,2,.3,0,10,[c,'#fff1c1','#ffffff']);
    P(BP(mk('sph',5.4,4.6,5.4,c,0,2.3,0),1,'roof'),5);P(BP(mk('sph',3,1.4,3,'#ffffff',0,4.1,0),1,'roof'),2);
    P(BP(mk('box',1.6,1.6,1.6,c,0,.8,2.6),0,'extra'),1,true,.6);P(BP(mk('box',1,1.2,.1,'#5c3317',0,.7,3.42),0,'extra'),1,true,.3);
    P(BP(mk('sph',.9,.9,.9,CANDY_RED,0,4.9,0),1,'extra'),1,true,.4);
    for(let i=0;i<6;i++){const t=i/6*Math.PI*2+.5;P(BP(mk('box',.3,.1,.1,pick(CANDY_BRIGHT),Math.sin(t)*1.8,3.85,Math.cos(t)*1.8),1,'extra'),1,true,.1);}
    candyFace(g,arg);},{building:true}),
  /* ---- huge ---- */
  // ice-cream parlor (BP): two striped storeys, a candy-striped awning, a giant cone sign on the roof
  candy_parlor:(x,z,arg)=>sized(x,z,CANDY_R.parlor,12,16,'huge',(P,g)=>{
    candyStory(P,7.2,6,3.4,0,0,['#ffafcc','#ffffff'],3);P(BP(mk('box',7.8,.3,6.6,CANDY_ICING,0,3.55,0),0,'slab'),2);
    candyStory(P,7.2,6,2.8,3.7,1,['#a0c4ff','#ffffff'],3);
    P(BP(mk('box',7.8,.5,6.6,'#ff8fab',0,6.75,0),2,'roof'),4);
    P(BP(candyRot(mk('cone',2,3,2,CANDY_WAFFLE,0,8.5,0),Math.PI),2,'extra'),2,true,.8);
    P(BP(mk('sph',2.4,2.2,2.4,'#ffafcc',0,10.5,0),2,'extra'),2,true,.8);P(BP(mk('sph',.7,.7,.7,CANDY_RED,0,11.8,0),2,'extra'),1,true,.3);
    for(let i=0;i<4;i++)P(BP(candyRot(mk('box',1.8,.25,1.2,i%2?'#ffffff':'#ff4d6d',-2.7+i*1.8,3.05,3.7),.35),0,'extra'),1,true,.4);
    P(BP(mk('box',1.4,2.2,.2,'#5c3317',0,1.1,3.35),0,'extra'),1,true,.5);
    for(const sx of [-1,1]){P(BP(mk('box',1.2,1.1,.18,'#a0e7ff',sx*2.4,1.6,3.35),0,'extra'),1,true,.3);P(BP(mk('sph',1,1,.18,'#a0e7ff',sx*1.8,5.1,3.35),1,'extra'),1,true,.3);}
    candyFace(g,arg);},{building:true}),
  // the three-scoop hill: mint, strawberry and vanilla stacked up, sprinkles on top, a giant spoon stuck in it
  candy_scoophill:(x,z)=>sized(x,z,CANDY_R.scoophill,10.6,16,'huge',(P,g)=>{
    P(mk('sph',9,6,9,'#b9fbc0',0,2.4,0),6);P(mk('sph',7,5.4,7,'#ffafcc',0,6,0),5);P(mk('sph',5,4,5,'#fff1c1',0,8.6,0),4);
    P(candyRot(mk('box',.6,7,1.4,CANDY_SILVER,3,8,0),0,0,-.5),2,true,1);
    for(let i=0;i<8;i++){const t=i/8*Math.PI*2;P(candyRot(mk('box',.4,.12,.12,pick(CANDY_BRIGHT),Math.sin(t)*1.4,10.4,Math.cos(t)*1.4),0,t),1);}
    g.rotation.y=rand(0,6.28);},{big:true}),
  /* ---- mega ---- */
  // the Soft-Serve Volcano: a vanilla mountain under strawberry topping, syrup running down, a cherry popping out of the top
  candy_volcano:(x,z)=>sized(x,z,CANDY_R.volcano,17,55,'mega',P=>{
    P(mk('cone',22,13,22,'#fff1c1',0,6.5,0),10);P(mk('cone',12,6,12,'#ffafcc',0,10,0),5);P(mk('sph',4.6,2,4.6,'#ff4d6d',0,12.6,0),3);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4,m=mk('box',1.3,5.4,.5,'#e63946',Math.sin(a)*5.1,8.2,Math.cos(a)*5.1);m.rotation.set(-.75,a,0,'YXZ');P(m,2,true,.8);}
    P(mk('sph',2.4,2.4,2.4,CANDY_RED,0,15.6,0),2,true,1);P(candyRot(mk('cyl',.2,1.8,.2,'#2d6a4f',.3,17.4,0),0,0,-.4),1,true,.3);
    for(let i=0;i<10;i++){const a=i*2.4,R=3+(i%3)*1.6,b=mk('box',.7,.2,.2,pick(CANDY_BRIGHT),Math.sin(a)*R,12.4-(i%3)*1.4,Math.cos(a)*R);b.rotation.y=a;P(b,1);}},{big:true})
};
candySfx(CANDY_PEAKS_PROPS,{
  candy_sprinkles:'candy_tinkle',candy_cherry:'candy_boing',
  candy_scoopmini:'candy_scoop',candy_softserve:'candy_scoop',candy_parfait:'candy_scoop',candy_scooptree:'candy_scoop',
  candy_iglu:'candy_scoop',candy_parlor:'candy_scoop',candy_scoophill:'candy_scoop',candy_volcano:'candy_scoop',
  candy_popsicle:'candy_icecrack',candy_fudgepop:'candy_icecrack',candy_snowcone:'candy_icecrack'
});

/* ---------- scenes ---------- */
const CANDY_PEAKS_SCENES={
  // somebody dropped their cone: the melt puddle, sprinkles everywhere, the cherry rolled off
  candy_dropped_cone:{size:'mini',r:4,sizes:['micro','mini','tiny','small'],build(s){
    s.spot('melt',.6,.4,4.2,3,.3);s.place('candy_tipcone',0,0,null,.3);
    for(let i=0;i<7;i++)s.place('candy_sprinkles',-2.6+candyH(i,1)*5.2,-1.8+candyH(i,2)*3.6);
    s.place('candy_cherry',2.9,-1.6);s.place('candy_scoopmini',-1.8,1.6);}},
  // a ring of snow cones and fudge pops around a popsicle bunch, on a mint slope
  candy_popsicle_grove:{size:'small',r:7,sizes:['tiny','small','medium'],build(s){
    s.spot('mint_slope',0,0,12,12,.2);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;s.place(i%2?'candy_fudgepop':'candy_snowcone',Math.sin(a)*4.6,Math.cos(a)*4.6);}
    s.place('candy_popsicle',0,0);s.place('candy_popsicle',.9,.5);s.place('candy_popsicle',-.7,.8);}},
  // three scoop igloos on a strawberry slope, a soft-serve and a parfait, a jump, chicks
  candy_iglu_camp:{size:'large',r:11,sizes:['medium','large','huge'],build(s){
    s.spot('berry_slope',0,0,22,20,0);
    s.place('candy_iglu',-5,-4,0);s.place('candy_iglu',5,-4.5,0);s.place('candy_iglu',0,4,0);
    s.place('candy_softserve',-8.5,3);s.place('candy_parfait',8.4,2.5);s.place('candy_snowcone',2.5,-9.4);
    s.ramp(-9,9,0,8,5,2.4);s.herd('chick',4,8,4);}},
  // the parlor with its patio: parfaits out front, soft-serve signs, ice-cream trees
  candy_parlor_lot:{size:'huge',r:13,sizes:['large','huge','mega'],build(s){
    s.spot('berry_slope',0,-1,24,14,0);s.spot('patio',0,8.5,18,6,0);s.place('candy_parlor',0,-2,0);
    for(const x of [-8.5,8.5])s.place('candy_softserve',x,6.5);
    for(let i=0;i<4;i++)s.place('candy_parfait',-5.1+i*3.4,10.4);
    s.place('candy_scooptree',-10,-6);s.place('candy_scooptree',10,-6);s.place('candy_snowcone',8,11);}}
};
const CANDY_SLOPE={micro:['candy_sprinkles','candy_cherry'],mini:['candy_scoopmini','candy_gumdrop'],tiny:['candy_popsicle','candy_tipcone'],small:['candy_snowcone','candy_fudgepop']};

/* ---------- layout: big mint / strawberry slopes with jumps on them, a scene, scoop trees; one volcano and one scoop hill per map ---------- */
function candyPeaksLayout(ctx){
  for(let i=0;i<2;i++){const x=rand(ctx.x0+16,ctx.x1-16),z=rand(ctx.z0+16,ctx.z1-16),th=(Math.random()*4|0)*Math.PI/2;
    ctx.spot(i?'berry_slope':'mint_slope',x,z,rand(20,28),rand(18,26),rand(-.3,.3));ctx.ramp(x,z,th,12,8,4);}
  candyRamps(ctx,1);
  if(candyIsSlot(ctx,'candy_peaks','mid')){const p=candyDrop(ctx,'candy_volcano',0);
    if(p){candyRingOf(ctx,p.x,p.z,CANDY_R.volcano+3,10,'candy_scoopmini');candyRingOf(ctx,p.x,p.z,CANDY_R.volcano+6,8,'candy_popsicle');}}
  else if(candyIsSlot(ctx,'candy_peaks','first',2)){const p=candyDrop(ctx,'candy_scoophill',0);
    if(p){ctx.spot('melt',p.x+4,p.z+8,12,6,.2);candyRingOf(ctx,p.x,p.z,CANDY_R.scoophill+3,8,'candy_softserve');}}
  else{const r=Math.random();
    if(r<.35)candySceneDrop(ctx,'candy_iglu_camp',0);else if(r<.6)candySceneDrop(ctx,'candy_parlor_lot',0);}
  for(let k=0;k<2;k++)if(Math.random()<.5){const x=rand(ctx.x0+8,ctx.x1-8),z=rand(ctx.z0+8,ctx.z1-8);
    if(ctx.free(x,z,3))ctx.scene(Math.random()<.5?'candy_popsicle_grove':'candy_dropped_cone',x,z,0);}
  for(let i=0;i<2;i++)ctx.spot('melt',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),rand(6,10),rand(4,7),rand(0,3));
  for(let i=0;i<6;i++)candyPut(ctx,pick(['candy_scooptree','candy_scooptree','candy_softserve','candy_fudgepop','candy_snowcone']),rand(ctx.x0+6,ctx.x1-6),rand(ctx.z0+6,ctx.z1-6),0);
  if(Math.random()<.5)candyPut(ctx,'candy_iglu',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
  candySprinkle(ctx,5,['candy_parfait','candy_snowcone','candy_popsicle','candy_tipcone']);
  ctx.herd('chick',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),4);
}

registerZone({
  id:'candy_peaks',letter:'I',
  ground:'#fff4e0',                          // vanilla snow
  sky:{top:'#a9def9',horizon:'#fffaf0'},
  weight:0,                                  // only part of Candy Land (L33)
  music:{drive:'candy_drive',boss:'candy_boss'},
  sfx:{crash:'candy_crunch',boom:'candy_pop',land:'candy_squish',ambient:'candy_peaks_ambient'},
  props:CANDY_PEAKS_PROPS,
  scenes:CANDY_PEAKS_SCENES,
  water:{melt:1},                            // L39: melted ice cream is a wade puddle
  sizes:{
    micro:['candy_sprinkles','candy_cherry','candy_mint'],
    mini:['candy_scoopmini','candy_gumdrop','candy_popmini'],
    tiny:['candy_popsicle','candy_tipcone','candy_cupcake'],
    small:['candy_snowcone','candy_fudgepop','candy_marsh'],
    medium:['candy_softserve','candy_parfait','candy_icecream'],
    large:['candy_scooptree','candy_iglu'],
    huge:['candy_parlor','candy_scoophill'],
    mega:['candy_scoophill','candy_parlor']    // the volcano only stands once per map
  },
  spots:{mint_slope:CANDY_SLOPE,berry_slope:CANDY_SLOPE,melt:{micro:['candy_sprinkles','candy_cherry'],mini:['candy_scoopmini'],tiny:['candy_tipcone'],small:['candy_snowcone']},
    patio:{micro:['candy_sprinkles'],mini:['candy_scoopmini'],tiny:['candy_popsicle'],small:['candy_snowcone']}},
  spotLook:{mint_slope:'#c7f9cc',berry_slope:'#ffd6e0',melt:'#ffc8dd',patio:'#ffffff'},
  herds:[['chick',4],['bunny',3]],
  layout:candyPeaksLayout
});
