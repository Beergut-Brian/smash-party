/* Smash Party — CANDY LAND sub-zone: CHOCOLATE RIVER (Z6). Owner: zone-candy agent (see agents/zone.md).
   A chocolate river (L39 water: wade at the edges, too deep in the middle without 🛸 hover) runs north-south
   through every river chunk, the same line from chunk to chunk, on caramel banks. Wafer bridges cross it at every
   road and once more per chunk. Marshmallow rafts, truffles and bonbons bob in it; pretzel reeds on the banks,
   cocoa trees and dipped strawberries, a chocolate mill, a fudge factory, a chocolate fountain and the Chocolate
   Falls at the river's head. weight:0: only part of Candy Land. Every top-level name starts with candy/CANDY. */
const CANDY_FUDGE=['#7f4f24','#936639'],CANDY_COCOA=['#3d1f0d','#5c3317','#6f4518'],CANDY_SILVER='#dee2e6';
Object.assign(CANDY_R,{cocoa:.25,chip:.22,truffle:.4,bonbon:.45,reed:.5,wafer:1.1,rock:1,raft:1.4,cocoatree:1.4,strawberry:1.1,
  mill:3.6,fudgehouse:4.6,fountain:3.6,falls:11});

const CANDY_RIVER_PROPS={
  /* ---- micro ---- */
  candy_cocoa:(x,z)=>sized(x,z,CANDY_R.cocoa,.22,1,'micro',(P,g)=>{
    P(mk('sph',.24,.16,.34,'#6f4518',0,.08,0),1,true,.1);P(mk('box',.03,.05,.3,'#4a2511',0,.16,0),1);g.rotation.y=rand(0,6.28);}),
  candy_chip:(x,z)=>sized(x,z,CANDY_R.chip,.3,1,'micro',P=>{
    P(mk('cone',.34,.3,.34,pick(['#3d1f0d','#5c3317','#fff1e6']),0,.15,0),1,true,.12);
    P(mk('cone',.22,.2,.22,pick(['#3d1f0d','#fff1e6']),.24,.1,.1),1,true,.08);}),
  /* ---- mini ---- */
  candy_truffle:(x,z)=>sized(x,z,CANDY_R.truffle,.85,1,'mini',P=>{
    P(mk('sph',.8,.8,.8,pick(CANDY_COCOA),0,.4,0),2,true,.35);
    for(let i=0;i<4;i++){const a=i*1.6;P(mk('box',.14,.05,.05,pick(CANDY_BRIGHT),Math.sin(a)*.18,.79,Math.cos(a)*.18),1);}}),
  candy_bonbon:(x,z)=>sized(x,z,CANDY_R.bonbon,.95,1,'mini',P=>{
    P(mk('cyl',.85,.45,.85,'#5c3317',0,.22,0),2);P(mk('sph',.7,.5,.7,pick(CANDY_PASTEL),0,.55,0),1,true,.3);
    P(mk('sph',.18,.18,.18,CANDY_RED,0,.85,0),1,true,.08);}),
  /* ---- tiny ---- */
  // three chocolate-dipped pretzel sticks growing like reeds
  candy_reed:(x,z)=>sized(x,z,CANDY_R.reed,1.7,1,'tiny',(P,g)=>{
    for(let k=0;k<3;k++){const a=k*2.1,sx=Math.sin(a),cz=Math.cos(a);
      P(candyRot(mk('cyl',.12,1.4,.12,'#e9b872',sx*.15,.7,cz*.15),cz*.18,0,-sx*.18),1,true,.1);
      P(mk('cyl',.16,.45,.16,'#5c3317',sx*.27,1.4,cz*.27),1,true,.1);}
    g.rotation.y=rand(0,6.28);}),
  /* ---- small ---- */
  candy_wafer:(x,z)=>sized(x,z,CANDY_R.wafer,1.9,2,'small',(P,g)=>{
    for(let i=0;i<4;i++)P(mk('box',2-i*.15,.42,1.2-i*.05,i%2?'#fff1c1':'#e9b872',rand(-.08,.08),.21+i*.44,0),1,true,.4);
    g.rotation.y=rand(0,6.28);}),
  // a chocolate boulder with an almond on it: rolls away when bumped
  candy_rock:(x,z)=>sized(x,z,CANDY_R.rock,1.7,2,'small',(P,g)=>{
    P(mk('sph',2,1.7,1.8,pick(CANDY_COCOA),0,.85,0),4);P(mk('sph',.5,.3,.7,'#e9c46a',.45,1.55,.3),1,true,.2);
    g.rotation.y=rand(0,6.28);},{roll:true}),
  // a raft of marshmallow logs with a little flag
  candy_raft:(x,z)=>sized(x,z,CANDY_R.raft,1.8,3,'small',(P,g)=>{
    for(let k=0;k<4;k++)P(candyRot(mk('cyl',.6,2.6,.6,k%2?'#ffffff':'#ffc6ff',-.95+k*.63,.3,0),Math.PI/2),1,true,.3);
    P(mk('cyl',.08,1.3,.08,'#e9b872',0,1.2,0),1);P(mk('box',.6,.4,.04,pick(CANDY_BRIGHT),.32,1.6,0),1,true,.2);
    g.rotation.y=rand(0,6.28);}),
  /* ---- medium ---- */
  // a cocoa tree: mint leaves, orange and yellow cocoa pods on the trunk
  candy_cocoatree:(x,z)=>sized(x,z,CANDY_R.cocoatree,4.6,5,'medium',(P,g)=>{
    P(mk('cyl',.45,2.8,.45,'#6f4518',0,1.4,0),2);P(mk('sph',3,2.2,3,'#06d6a0',0,3.4,0),4,true,1);P(mk('sph',2,1.5,2,'#57cc99',.3,4,.2),2,true,.7);
    for(let i=0;i<4;i++){const a=i*1.57+.3;P(mk('sph',.35,.6,.35,i%2?'#fb8500':'#ffb703',Math.sin(a)*.32,1.7+(i%2)*.4,Math.cos(a)*.32),1,true,.2);}
    g.rotation.y=rand(0,6.28);}),
  // a giant strawberry standing in the bank, its bottom dipped in chocolate
  candy_strawberry:(x,z)=>sized(x,z,CANDY_R.strawberry,3.4,5,'medium',(P,g)=>{
    P(candyRot(mk('cone',2,2.6,2,'#e63946',0,1.35,0),Math.PI),3);P(candyRot(mk('cone',1.25,1.6,1.25,'#5c3317',0,.85,0),Math.PI),2);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;P(candyRot(mk('box',.9,.08,.35,'#38b000',Math.sin(a)*.45,2.7,Math.cos(a)*.45),0,a+Math.PI/2,.25),1,true,.2);}
    P(mk('cyl',.12,.6,.12,'#2d6a4f',0,3.05,0),1,true,.15);g.rotation.y=rand(0,6.28);}),
  /* ---- large ---- */
  // chocolate mill (BP): fudge walls, a candy roof, a wafer waterwheel on its side (+X), a chimney
  candy_mill:(x,z,arg)=>sized(x,z,CANDY_R.mill,6.6,8,'large',(P,g)=>{
    candyStory(P,4.6,4.2,3.2,0,0,CANDY_FUDGE,2);
    P(BP(mk('pyr',5.8,2.8,5.4,'#ff4d6d',0,4.6,0),1,'roof'),4);
    P(BP(candyRot(candyMk('ring',3,3,1.4,'#e9b872',3.2,1.9,0),0,Math.PI/2,0),0,'extra'),2,true,.8);
    for(const r of [0,Math.PI/2])P(BP(candyRot(mk('box',.25,2.6,.25,'#fff1c1',3.2,1.9,0),r,0,0),0,'extra'),1,true,.6);
    P(BP(mk('box',1,1.7,.2,'#ffd6a5',0,.85,2.45),0,'extra'),1,true,.4);
    for(const sx of [-1,1])P(BP(mk('box',.8,.7,.18,'#a0e7ff',sx*1.4,2,2.45),0,'extra'),1,true,.3);
    P(BP(mk('cyl',.6,1.6,.6,CANDY_RED,-1.4,5.2,-.8),1,'extra'),1,true,.3);
    candyFace(g,arg);},{building:true}),
  /* ---- huge ---- */
  // fudge factory (BP): two fudge storeys, an icing drip between them, chimneys puffing marshmallows
  candy_fudgehouse:(x,z,arg)=>sized(x,z,CANDY_R.fudgehouse,10.5,16,'huge',(P,g)=>{
    candyStory(P,7,5.6,3.2,0,0,CANDY_FUDGE,3);P(BP(mk('box',7.6,.3,6.2,CANDY_ICING,0,3.35,0),0,'slab'),2);
    candyStory(P,7,5.6,2.8,3.5,1,CANDY_FUDGE,3);
    P(BP(mk('box',7.8,.6,6.4,'#5c3317',0,6.6,0),2,'roof'),4);
    for(const sx of [-1,1]){P(BP(mk('cyl',.8,2.4,.8,CANDY_RED,sx*2.2,8.1,-1),2,'extra'),1,true,.6);
      P(BP(mk('sph',1.2,1,1.2,'#ffffff',sx*2.2,9.6,-1),2,'extra'),1,true,.5);P(BP(mk('sph',.9,.8,.9,'#ffc6ff',sx*2.2+.3,10.2,-1.2),2,'extra'),1,true,.4);}
    P(BP(mk('box',1.6,2.2,.2,'#ffd6a5',0,1.1,3.15),0,'extra'),1,true,.5);P(BP(mk('box',3.4,.8,.2,'#ff70a6',0,2.7,3.2),0,'extra'),1,true,.5);
    for(const sx of [-1,1]){P(BP(mk('box',1,1,.18,'#a0e7ff',sx*2.3,1.7,3.15),0,'extra'),1,true,.3);P(BP(mk('box',1,.9,.18,'#a0e7ff',sx*1.6,5,3.15),1,'extra'),1,true,.3);}
    candyFace(g,arg);},{building:true}),
  // a three-tier chocolate fountain in a chocolate pool, a cherry on top
  candy_fountain:(x,z)=>sized(x,z,CANDY_R.fountain,9.9,16,'huge',P=>{
    P(mk('cyl',7.2,.8,7.2,'#e9b872',0,.4,0),4);P(mk('cyl',6.4,.85,6.4,'#5c3317',0,.45,0),3);
    P(mk('cyl',.8,8,.8,CANDY_SILVER,0,4.5,0),3);
    for(const [d,y,cd,ch] of [[4.6,3,4.2,2.2],[3.2,5.6,2.8,2.1],[1.8,7.8,1.5,1.7]]){
      P(mk('cyl',d,.45,d,CANDY_SILVER,0,y,0),2);P(mk('cyl',cd,ch,cd,'#6f4518',0,y-ch/2-.2,0),2);}
    P(mk('sph',1.4,1.1,1.4,'#5c3317',0,8.6,0),1);P(mk('sph',.8,.8,.8,CANDY_RED,0,9.5,0),1,true,.4);},{big:true}),
  /* ---- mega ---- */
  // the Chocolate Falls: a fudge cliff with icing on top, a chocolate waterfall into a pool of bobbing marshmallows (faces +Z, downstream)
  candy_falls:(x,z)=>sized(x,z,CANDY_R.falls,16,50,'mega',P=>{
    P(mk('box',14,14,8,'#7f4f24',0,7,-2),8);for(const sx of [-1,1])P(mk('box',8,10,7,'#936639',sx*9,5,-1.5),6);
    P(mk('box',22,1,9,'#fff1e6',0,14.5,-2),5);P(mk('box',24,.8,1,'#fff1e6',0,9.6,-1),2);
    for(let i=0;i<7;i++)P(mk('sph',1.2,1.8,1,'#fff1e6',-9+i*3,13.6,2.2),1,true,.5);
    P(mk('box',6,13,.7,'#8d5524',0,7,2.3),5);P(mk('box',4,12,.4,'#a0522d',0,7.2,2.7),2);
    P(mk('cyl',12,.6,12,'#5c3317',0,.3,6),5);
    for(const [mx,mz] of [[-3,7],[2.6,8.4],[.4,10]])P(mk('cyl',1.3,1,1.3,'#ffffff',mx,.7,mz),1,true,.5);
    for(const mx of [-1.6,0,1.6])P(mk('sph',1.6,1.2,1.6,'#c68b59',mx,.8,3.2),1,true,.6);})
};
candySfx(CANDY_RIVER_PROPS,{
  candy_raft:'candy_boing',candy_rock:'candy_snap',candy_truffle:'candy_snap',candy_bonbon:'candy_splat',candy_strawberry:'candy_splat',
  candy_reed:'candy_snap',candy_mill:'candy_snap',candy_fudgehouse:'candy_snap',candy_cocoatree:'candy_snap',
  candy_fountain:'candy_splosh',candy_falls:'candy_splosh'
});

/* ---------- the river line: the same in every river chunk of one column, clear of the center roads ---------- */
const CANDY_RIVER_X=20,CANDY_RIVER_WADE=18,CANDY_RIVER_DEEP=7,CANDY_RIVER_BANK=27;
const candyRiverX=(z,ci)=>ci*CHUNK+CANDY_RIVER_X+Math.sin(z*.045+ci*1.7)*4;
const candyRiverTh=(z,ci)=>Math.atan(Math.cos(z*.045+ci*1.7)*.18);
// bridges: every road that crosses the river, plus one footbridge per chunk
const candyBridges=ctx=>(ctx.cj%2===0)?[ctx.cz,ctx.cz-26]:[ctx.cz-14,ctx.cz+18];
const candyDry=(ctx,x,z,r)=>Math.abs(x-candyRiverX(z,ctx.ci))>CANDY_RIVER_BANK/2+r;
const candyBankPut=(ctx,type,x,z,arg)=>candyDry(ctx,x,z,CANDY_R[type.slice(6)]||1.2)&&candyPut(ctx,type,x,z,arg);
function candyRiverSpots(ctx){
  const ci=ctx.ci,bz=candyBridges(ctx),cut=bz.map(b=>[b-5.5,b+5.5]).sort((a,b)=>a[0]-b[0]),spans=[];let z=ctx.z0;
  for(const [a,b] of cut){if(a>z)spans.push([z,a]);z=Math.max(z,b);}if(z<ctx.z1)spans.push([z,ctx.z1]);
  for(const [a,b] of spans){const n=Math.ceil((b-a)/8),L=(b-a)/n;
    for(let k=0;k<n;k++){const zm=a+L*(k+.5),x=candyRiverX(zm,ci),th=candyRiverTh(zm,ci);
      ctx.spot('cocoa_bank',x,zm,CANDY_RIVER_BANK,L+.6,th);ctx.spot('choco_river',x,zm,CANDY_RIVER_WADE,L+.6,th);ctx.spot('choco_deep',x,zm,CANDY_RIVER_DEEP,L+.6,th);}}
  for(const zb of bz){const x=candyRiverX(zb,ci);ctx.spot('cocoa_bank',x,zb,CANDY_RIVER_BANK,11,0);ctx.spot('wafer',x,zb,22,11,0);
    for(const sx of [-1,1])for(const sz of [-1,1])candyPut(ctx,'candy_cane',x+sx*10.4,zb+sz*6.3,sx<0?1:3);}
  return bz;}

/* ---------- scenes ---------- */
const CANDY_RIVER_SCENES={
  // a wafer dock on the bank (+Z faces the water): rafts tied up, truffle barrels, reeds, ducks paddling
  candy_raft_dock:{size:'small',r:7,sizes:['tiny','small','medium'],filler:false,build(s){
    s.spot('wafer',0,1.5,4,7,0);s.place('candy_raft',0,6.5);s.place('candy_raft',3.2,7.4,null,.5);
    s.place('candy_truffle',-1.6,-1.4);s.place('candy_truffle',-2.4,-.6);s.place('candy_bonbon',1.8,-1.6);
    s.place('candy_reed',-3.4,3.6);s.place('candy_reed',-4.1,4.6);s.place('candy_reed',3.8,3);
    s.place('candy_wafer',-3.6,-3);s.herd('duck',1,10,3);}},
  // a patch of dipped strawberries in rows, bonbons and a cocoa tree at the corner
  candy_berry_patch:{size:'medium',r:9,sizes:['small','medium','large'],build(s){
    s.spot('berry_field',0,0,15,12,0);
    for(let r=0;r<3;r++)for(let c=0;c<4;c++)s.place('candy_strawberry',-5.4+c*3.6,-3.6+r*3.6);
    s.place('candy_rock',-8.6,4.6);s.place('candy_bonbon',8,5.4);s.place('candy_bonbon',8.8,4.4);s.place('candy_cocoatree',8.4,-5);}},
  // a truffle stall: a sweet stand, truffles and bonbons piled up, wafer stacks
  candy_truffle_stall:{size:'small',r:6,sizes:['tiny','small','medium'],build(s){
    s.spot('cocoa_bank',0,1,10,7,0);s.place('candy_stand',0,-1,0);
    for(let i=0;i<5;i++)s.place(i%2?'candy_bonbon':'candy_truffle',-2.4+i*1.2,2.2+candyH(i,3)*.6);
    s.place('candy_wafer',-4,-1.4);s.place('candy_wafer',4,-1.2);s.place('candy_reed',4.6,2.6);}}
};
// what bobs in the chocolate (every size listed, so no trees or houses land in the river)
const CANDY_FLOAT={micro:['candy_cocoa','candy_chip'],mini:['candy_truffle','candy_bonbon','candy_gumdrop'],tiny:['candy_cupcake','candy_reed'],
  small:['candy_raft','candy_marsh'],medium:['candy_strawberry','candy_raft'],large:['candy_raft','candy_strawberry'],huge:['candy_raft'],mega:['candy_raft']};
// on the bridges: only low smashable things, so a bridge never gets blocked
const CANDY_BRIDGE={micro:['candy_cocoa','candy_wrap'],mini:['candy_truffle'],tiny:['candy_reed'],small:['candy_wafer'],
  medium:['candy_wafer'],large:['candy_wafer'],huge:['candy_wafer'],mega:['candy_wafer']};

/* ---------- layout: the river and its bridges first, then the bank: a mill, a fudge factory or a cocoa orchard ---------- */
function candyRiverLayout(ctx){
  const ci=ctx.ci;
  // the river's head: the Chocolate Falls (north end of the first river chunk), placed before the bridge posts
  if(candyIsSlot(ctx,'candy_river','first')){const z=ctx.z0+16;ctx.place('candy_falls',candyRiverX(z,ci),z,0,CANDY_R.falls);}
  const bz=candyRiverSpots(ctx);
  // the fountain a third of the way down the river (the very middle is often the home arena), on the west bank
  if(candyIsSlot(ctx,'candy_river',.35,3))for(const [dx,dz] of [[-18,-18],[-18,18],[-20,0]])
    if(candyBankPut(ctx,'candy_fountain',ctx.cx+dx,ctx.cz+dz,0)){candyRingOf(ctx,ctx.cx+dx,ctx.cz+dz,CANDY_R.fountain+3,8,'candy_truffle');break;}
  // between the bridges, on the west bank
  const zs=[];{const b=[ctx.z0,...bz.slice().sort((a,b)=>a-b),ctx.z1];for(let i=0;i+1<b.length;i++)if(b[i+1]-b[i]>20)zs.push((b[i]+b[i+1])/2);}
  const r=Math.random(),z1=zs[0]??ctx.cz,z2=zs[zs.length-1]??ctx.cz;
  if(r<.4){const x=candyRiverX(z1,ci)-14.5;candyPut(ctx,'candy_mill',x,z1,0); // its waterwheel (+X) dips into the river
    candyBankPut(ctx,'candy_wafer',x-5,z1+5);candyBankPut(ctx,'candy_rock',x-6,z1-4.5);}
  else if(r<.65)candyBankPut(ctx,'candy_fudgehouse',ctx.cx-16,z1,1);
  else for(let i=0;i<3;i++)for(let j=0;j<3;j++)candyBankPut(ctx,j%2?'candy_strawberry':'candy_cocoatree',ctx.cx-30+i*9+rand(-1.5,1.5),z1-9+j*9+rand(-1.5,1.5));
  if(Math.random()<.6){const x=candyRiverX(z2,ci)-15;if(ctx.free(x,z2,3))ctx.scene('candy_raft_dock',x,z2,Math.PI/2);} // its front (+Z) turned to the water
  if(Math.random()<.5){const x=ctx.cx-26,z=zs[1]??ctx.cz+20;if(ctx.free(x,z,6))ctx.scene(Math.random()<.6?'candy_berry_patch':'candy_truffle_stall',x,z,Math.PI/2);}
  // the rest of the bank, and reeds along the water's edge on both sides
  for(let i=0;i<10;i++)candyBankPut(ctx,pick(['candy_cocoatree','candy_rock','candy_wafer','candy_strawberry','candy_truffle']),rand(ctx.x0+5,ctx.x1-5),rand(ctx.z0+5,ctx.z1-5),0);
  for(let i=0;i<8;i++){const z=rand(ctx.z0+3,ctx.z1-3),side=i%2?1:-1;candyBankPut(ctx,'candy_reed',candyRiverX(z,ci)+side*(CANDY_RIVER_BANK/2+.8),z);}
  candyRamps(ctx,1);
  ctx.herd('duck',candyRiverX(ctx.cz+8,ci),ctx.cz+8,4);
}

registerZone({
  id:'candy_river',letter:'K',
  ground:'#e8c39e',                          // caramel
  sky:{top:'#f4a988',horizon:'#ffe8d6'},
  weight:0,                                  // only part of Candy Land (L33)
  music:{drive:'candy_drive',boss:'candy_boss'},
  sfx:{crash:'candy_crunch',boom:'candy_pop',land:'candy_squish',ambient:'candy_river_ambient'},
  props:CANDY_RIVER_PROPS,
  scenes:CANDY_RIVER_SCENES,
  water:{choco_river:1,choco_deep:2},        // L39: wade in the chocolate, too deep in the middle (hover skims it)
  sizes:{
    micro:['candy_cocoa','candy_chip','candy_wrap'],
    mini:['candy_truffle','candy_bonbon','candy_cookie'],
    tiny:['candy_reed','candy_cupcake'],
    small:['candy_wafer','candy_rock','candy_raft'],
    medium:['candy_cocoatree','candy_strawberry','candy_choco'],
    large:['candy_mill','candy_swirl'],
    huge:['candy_fudgehouse','candy_mill','candy_fountain'],
    mega:['candy_fudgehouse','candy_mill']      // the Falls only stands at the river's head, the big fountain mid-river
  },
  spots:{choco_river:CANDY_FLOAT,choco_deep:CANDY_FLOAT,wafer:CANDY_BRIDGE,
    cocoa_bank:{micro:['candy_cocoa','candy_chip'],mini:['candy_truffle','candy_bonbon'],tiny:['candy_reed'],small:['candy_wafer','candy_rock']},
    berry_field:{micro:['candy_cocoa'],mini:['candy_bonbon'],tiny:['candy_reed'],small:['candy_rock'],medium:['candy_strawberry']}},
  spotLook:{choco_river:'#7b4a2a',choco_deep:'#5c3317',cocoa_bank:'#d9a26b',wafer:'#f4d58d',berry_field:'#e07a5f'},
  herds:[['duck',4],['bunny',3]],
  layout:candyRiverLayout
});
