/* Smash Party — CANDY LAND themed zone (Z1). Owner: zone-candy agent (see agents/zone.md).
   Pink frosting ground, lollipop groves, cupcake-house streets, gingerbread houses, a giant gumball machine,
   a mountain of a sundae and a three-tier birthday cake. All block-built from core.js shapes + M(color)
   (plus two shared torus shapes), so sleeping copies batch per shape. Every top-level name starts with candy/CANDY. */
const CANDY_PASTEL=['#ff8fab','#ffc6ff','#bdb2ff','#a0c4ff','#9bf6ff','#caffbf','#fdffb6','#ffd6a5'];
const CANDY_BRIGHT=['#ff006e','#ff4d6d','#8338ec','#3a86ff','#06d6a0','#ffbe0b','#fb5607'];
const CANDY_SCOOP=['#ffafcc','#b9fbc0','#fff1c1','#8d5524','#cdb4db','#ffd6a5'];
const CANDY_DOUGH='#d4a373',CANDY_GINGER='#c2783e',CANDY_CHOCO='#5c3317',CANDY_ICING='#fffaf5',CANDY_RED='#e63946';
// two shared shapes (one batch each while asleep): a donut ring and a half ring for cane hooks / arches
const CANDY_GEO={ring:new THREE.TorusGeometry(.5,.2,10,22),hook:new THREE.TorusGeometry(.5,.2,8,14,Math.PI)};
function candyMk(geo,sx,sy,sz,color,x=0,y=0,z=0){const m=new THREE.Mesh(CANDY_GEO[geo],M(color));
  m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;}
function candyFace(g,arg){g.rotation.y=(typeof arg==='number'?((arg%4)+4)%4:(Math.random()*4|0))*Math.PI/2;}
const candyRot=(m,rx,ry,rz)=>{m.rotation.set(rx||0,ry||0,rz||0);return m;};
// a flat disc standing up, facing +Z (lollipop heads, cookies, mints)
const candyDisc=(d,t,color,x,y,z)=>candyRot(mk('cyl',d,t,d,color,x,y,z),Math.PI/2);
// striped cane shaft: n stacked cylinders alternating red / white
function candyShaft(P,d,h,x,y0,z,n,cols){const s=h/n;for(let i=0;i<n;i++)P(mk('cyl',d,s*1.02,d,cols[i%2],x,y0+s*(i+.5),z),1,true,s*.6);}
// round storey: n wall pieces in a ring (BP contract: several walls per storey)
function candyRing(P,R,h,y,floor,n,cols,t=.6){
  for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2,w=mk('box',Math.PI*2*R/n*1.1,h,t,cols[i%cols.length],Math.sin(a)*R,y+h/2,Math.cos(a)*R);
    w.rotation.y=a;P(BP(w,floor,'wall'),2);}}
// square storey: segs wall pieces per side + a floor plate
function candyStory(P,w,d,h,y,floor,cols,segs=3){const t=.6;
  for(let s=0;s<4;s++){const along=(s<2?w:d)+t,e=(s<2?d:w)/2,len=along/segs+t*.4;
    for(let k=0;k<segs;k++){const a=-along/2+along/(segs*2)+k*along/segs,c=cols[(s+k)%cols.length];
      P(BP(s<2?mk('box',len,h,t,c,a,y+h/2,s?e:-e):mk('box',t,h,len,c,s==2?e:-e,y+h/2,a),floor,'wall'),2);}}
  P(BP(mk('box',w-.3,.3,d-.3,CANDY_ICING,0,y+.15,0),floor,'slab'),2);}
const CANDY_R={wrap:.25,beans:.3,mint:.24,gumdrop:.45,popmini:.32,cookie:.5,cane:.4,cupcake:.5,lollipop:.9,donut:1.1,marsh:.6,
  icecream:.85,choco:1.2,gingerman:1.1,swirl:1.6,cupcakehouse:3.1,arch:2.4,gingerhouse:4.4,gumball:2.4,sundae:5.8,cake:8.9,stand:1.3,
  partycake:.55,bakery:3.8};
// A5b: the land critters (world-animals A5), with the old stand-ins if a kind is missing
const candyKind=(k,fb)=>typeof ANIMAL!=='undefined'&&ANIMAL&&ANIMAL[k]?k:fb;
const CANDY_BEAR=candyKind('gummybear','bunny'),CANDY_SHEEP=candyKind('marshmallow_sheep','sheep');
// Adventure's hand-made Candy Land (Z6 part 2, candy_land.js): the layouts leave its quest chunks to candyLandLayout
const candyLandOn=()=>typeof landW!=='undefined'&&!!landW&&landW.id==='candy'&&typeof questOn!=='undefined'&&!!questOn;
const candyLand=ctx=>typeof candyLandLayout==='function'&&candyLandLayout(ctx);
// deterministic 0..1 hash for scenes (a scene crossing a chunk line is built once per chunk and must come out the same)
const candyH=(i,k)=>{const s=Math.sin(i*127.1+k*311.7)*43758.5453;return s-Math.floor(s);};

const CANDY_PROPS={
  /* ---- micro ---- */
  candy_wrap:(x,z)=>sized(x,z,CANDY_R.wrap,.24,1,'micro',(P,g)=>{const c=pick(CANDY_BRIGHT);
    P(mk('sph',.28,.2,.2,c,0,.11,0),1,true,.12);P(mk('box',.62,.18,.05,c,0,.11,0),1);
    g.rotation.y=rand(0,6.28);}),
  candy_beans:(x,z)=>sized(x,z,CANDY_R.beans,.16,1,'micro',(P,g)=>{
    for(let i=0;i<2;i++){const b=mk('sph',.15,.11,.22,pick(CANDY_BRIGHT),rand(-.15,.15),.05,rand(-.15,.15));b.rotation.y=rand(0,3);P(b,1,true,.08);}}),
  candy_mint:(x,z)=>sized(x,z,CANDY_R.mint,.42,1,'micro',(P,g)=>{
    P(candyDisc(.42,.1,'#ffffff',0,.21,0),1,true,.2);P(candyDisc(.26,.12,CANDY_RED,0,.21,0),1);
    g.rotation.y=rand(0,6.28);}),
  /* ---- mini ---- */
  candy_gumdrop:(x,z)=>sized(x,z,CANDY_R.gumdrop,.8,1,'mini',P=>{const c=pick(CANDY_BRIGHT);
    P(mk('sph',.9,1,.9,c,0,.3,0),2,true,.4);}),
  candy_popmini:(x,z)=>sized(x,z,CANDY_R.popmini,1.1,1,'mini',(P,g)=>{const a=pick(CANDY_BRIGHT),b=pick(CANDY_PASTEL);
    P(mk('cyl',.06,.65,.06,'#ffffff',0,.32,0),1);P(candyDisc(.56,.12,a,0,.88,0),1,true,.28);P(candyDisc(.32,.14,b,0,.88,0),1);
    g.rotation.y=rand(0,6.28);}),
  candy_cookie:(x,z)=>sized(x,z,CANDY_R.cookie,1,1,'mini',(P,g)=>{
    const c=candyDisc(1,.18,CANDY_DOUGH,0,.5,0);c.rotation.x=Math.PI/2-.25;P(c,2,true,.5);
    for(const [cx,cy] of [[-.2,.65],[.18,.4]])P(mk('sph',.13,.13,.1,CANDY_CHOCO,cx,cy,.1+(cy-.5)*.25),1);
    g.rotation.y=rand(0,6.28);}),
  /* ---- tiny ---- */
  candy_cane:(x,z,arg)=>sized(x,z,CANDY_R.cane,1.6,1,'tiny',(P,g)=>{
    candyShaft(P,.22,1.2,0,0,0,5,[CANDY_RED,'#ffffff']);
    P(candyMk('hook',.5,.5,.55,CANDY_RED,-.25,1.2,0),1,true,.3);P(mk('cyl',.22,.2,.22,'#ffffff',-.5,1.1,0),1);candyFace(g,arg);}),
  candy_cupcake:(x,z)=>sized(x,z,CANDY_R.cupcake,1.25,1,'tiny',P=>{
    P(mk('cyl',.85,.5,.85,pick(CANDY_PASTEL),0,.25,0),2);P(mk('sph',1,.5,1,pick(CANDY_SCOOP),0,.58,0),1,true,.4);
    P(mk('sph',.66,.4,.66,pick(CANDY_SCOOP),0,.84,0),1,true,.3);P(mk('sph',.22,.22,.22,CANDY_RED,0,1.1,0),1,true,.1);}),
  // Baker Bun's birthday cake on a cake stand (Z6 part 2): two tiers and candles, still waiting for its cherries
  candy_partycake:(x,z)=>sized(x,z,CANDY_R.partycake,1.75,2,'tiny',P=>{
    P(mk('cyl',.25,.45,.25,'#dee2e6',0,.22,0),1);P(mk('cyl',1.1,.08,1.1,'#dee2e6',0,.48,0),1);
    P(mk('cyl',.95,.42,.95,'#ffafcc',0,.73,0),2);P(mk('cyl',.99,.08,.99,CANDY_ICING,0,.94,0),1);P(mk('cyl',.62,.36,.62,CANDY_ICING,0,1.12,0),1,true,.3);
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.3,cx=Math.sin(a)*.18,cz=Math.cos(a)*.18;
      P(mk('cyl',.07,.28,.07,CANDY_BRIGHT[i*2],cx,1.44,cz),1,true,.05);P(mk('sph',.08,.13,.08,'#ffbe0b',cx,1.64,cz),1,true,.05);}}),
  /* ---- small ---- */
  candy_lollipop:(x,z)=>sized(x,z,CANDY_R.lollipop,3.6,3,'small',(P,g)=>{const a=pick(CANDY_BRIGHT),b=pick(CANDY_PASTEL);
    P(mk('cyl',.16,2.2,.16,'#ffffff',0,1.1,0),2);
    P(candyDisc(1.9,.28,a,0,2.65,0),4);P(candyDisc(1.35,.32,b,0,2.65,0),2);P(candyDisc(.85,.36,a,0,2.65,0),1);P(candyDisc(.38,.4,b,0,2.65,0),1);
    g.rotation.y=rand(0,6.28);}),
  candy_donut:(x,z)=>sized(x,z,CANDY_R.donut,2.3,3,'small',(P,g)=>{const f=pick(['#ff8fab','#cdb4db','#8d5524','#fff1c1','#9bf6ff']);
    P(candyMk('ring',1.6,1.6,1.6,CANDY_DOUGH,0,1.13,0),4);P(candyMk('ring',1.62,1.62,.9,f,0,1.13,.16),3);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,s=mk('box',.22,.07,.07,pick(CANDY_BRIGHT),Math.cos(a)*.8,1.13+Math.sin(a)*.8,.42);s.rotation.z=a*2;P(s,1);}
    g.rotation.y=rand(0,6.28);},{roll:true}),
  candy_marsh:(x,z)=>sized(x,z,CANDY_R.marsh,1.8,2,'small',(P,g)=>{
    for(let i=0;i<3;i++){const m=mk('cyl',.95-i*.08,.55,.95-i*.08,pick(['#ffffff','#ffc6ff','#caffbf','#fdffb6']),rand(-.06,.06),.28+i*.58,rand(-.06,.06));m.rotation.y=rand(0,1);P(m,1,true,.4);}}),
  // a little sweet-shop stall: counter, cane posts, striped awning, jars of candy
  candy_stand:(x,z,arg)=>sized(x,z,CANDY_R.stand,2.7,3,'small',(P,g)=>{const c=pick(CANDY_PASTEL);
    P(mk('box',2,1,1,c,0,.5,0),3);P(mk('box',2.1,.12,1.1,CANDY_ICING,0,1.06,0),1);
    for(const sx of [-1,1])candyShaft(P,.14,1.6,sx*.9,1.1,-.4,3,[CANDY_RED,'#ffffff']);
    for(let i=0;i<4;i++)P(candyRot(mk('box',.55,.08,1.3,i%2?'#ffffff':pick(CANDY_BRIGHT),-.82+i*.55,2.6,-.05),.25),1,true,.3);
    for(let i=0;i<3;i++){P(mk('cyl',.32,.42,.32,'#caf0f8',-.6+i*.6,1.33,.15),1,true,.15);P(mk('sph',.22,.22,.22,pick(CANDY_BRIGHT),-.6+i*.6,1.3,.15),1);}
    candyFace(g,arg);}),
  /* ---- medium ---- */
  candy_icecream:(x,z)=>sized(x,z,CANDY_R.icecream,4,5,'medium',(P,g)=>{
    P(candyRot(mk('cone',1.3,2.2,1.3,'#e9b872',0,1.1,0),Math.PI),4);
    P(mk('sph',1.5,1.3,1.5,pick(CANDY_SCOOP),0,2.45,0),3,true,.7);P(mk('sph',1.2,1.1,1.2,pick(CANDY_SCOOP),.05,3.3,0),3,true,.6);
    P(mk('sph',.35,.35,.35,CANDY_RED,0,3.95,0),1,true,.18);}),
  candy_choco:(x,z,arg)=>sized(x,z,CANDY_R.choco,3,5,'medium',(P,g)=>{const wr=pick(['#e63946','#3a86ff','#8338ec','#06d6a0']);
    P(mk('box',2.1,1.2,.62,wr,0,.6,0),3);P(mk('box',2.14,.25,.66,'#ffd60a',0,.9,0),1);
    for(let r=0;r<3;r++)for(let c=0;c<2;c++)P(mk('box',.95,.55,.5,CANDY_CHOCO,-.5+c*1,1.5+r*.6,0),2,true,.3);
    candyFace(g,arg);}),
  candy_gingerman:(x,z,arg)=>sized(x,z,CANDY_R.gingerman,3.4,6,'medium',(P,g)=>{
    P(mk('sph',.7,1.2,.5,CANDY_GINGER,-.38,.6,0),2);P(mk('sph',.7,1.2,.5,CANDY_GINGER,.38,.6,0),2);
    P(mk('sph',1.4,1.5,.55,CANDY_GINGER,0,1.75,0),3);P(mk('sph',1.1,1.1,.5,CANDY_GINGER,0,2.85,0),2,true,.5);
    P(candyRot(mk('sph',.55,1.2,.45,CANDY_GINGER,-.9,2,0),0,0,1.1),1,true,.4);P(candyRot(mk('sph',.55,1.2,.45,CANDY_GINGER,.9,2,0),0,0,-1.1),1,true,.4);
    for(const y of [1.45,1.85])P(mk('sph',.17,.17,.1,pick(CANDY_BRIGHT),0,y,.27),1);
    P(mk('sph',.12,.12,.08,'#2b2d42',-.2,2.95,.24),1);P(mk('sph',.12,.12,.08,'#2b2d42',.2,2.95,.24),1);
    P(mk('box',.4,.07,.06,CANDY_ICING,0,2.68,.25),1);candyFace(g,arg);}),
  /* ---- large ---- */
  candy_swirl:(x,z)=>sized(x,z,CANDY_R.swirl,7,8,'large',(P,g)=>{const a=pick(CANDY_BRIGHT),b=pick(CANDY_PASTEL),c=pick(CANDY_BRIGHT);
    candyShaft(P,.45,4.2,0,0,0,4,['#ffffff',a]);
    P(candyDisc(4.2,.5,a,0,5.3,0),5);P(candyDisc(3.3,.55,b,0,5.3,0),3);P(candyDisc(2.4,.6,c,0,5.3,0),2);P(candyDisc(1.5,.65,b,0,5.3,0),1);P(candyDisc(.6,.7,a,0,5.3,0),1);
    P(candyRot(mk('cone',.6,.9,.6,'#ff006e',-.45,3.4,0),0,0,-Math.PI/2),1,true,.3);P(candyRot(mk('cone',.6,.9,.6,'#ff006e',.45,3.4,0),0,0,Math.PI/2),1,true,.3);
    g.rotation.y=rand(0,6.28);},{big:true}),
  candy_arch:(x,z,arg)=>sized(x,z,CANDY_R.arch,6,8,'large',(P,g)=>{
    for(const sx of [-1,1])candyShaft(P,.5,4,sx*1.8,0,0,5,sx<0?[CANDY_RED,'#ffffff']:['#ffffff',CANDY_RED]);
    P(candyMk('hook',3.6,3.6,1.3,CANDY_RED,0,4,0),4);
    P(mk('sph',.7,.6,.5,'#06d6a0',-.4,5.9,0),1,true,.3);P(mk('sph',.7,.6,.5,'#06d6a0',.4,5.9,0),1,true,.3);P(mk('sph',.35,.35,.35,'#ffbe0b',0,5.9,.1),1);
    candyFace(g,arg);}),
  // cupcake house (BP): a round pleated wrapper storey under a frosting roof with a cherry on top
  candy_cupcakehouse:(x,z,arg)=>sized(x,z,CANDY_R.cupcakehouse,5.9,8,'large',(P,g)=>{
    const wr=pick(CANDY_PASTEL),fr=pick(CANDY_SCOOP);
    P(BP(mk('cyl',4.6,.3,4.6,CANDY_ICING,0,.15,0),0,'slab'),2);
    candyRing(P,2.3,2.7,0,0,10,[wr,'#ffffff']);
    P(BP(mk('box',.9,1.5,.2,CANDY_CHOCO,0,.75,2.45),0,'extra'),1,true,.35);
    P(BP(mk('sph',.7,.7,.2,'#a0e7ff',-1.45,1.7,1.85),0,'extra'),1,true,.25);P(BP(mk('sph',.7,.7,.2,'#a0e7ff',1.45,1.7,1.85),0,'extra'),1,true,.25);
    P(BP(mk('sph',6,2.4,6,fr,0,2.9,0),1,'roof'),5);P(BP(mk('sph',3.8,1.8,3.8,fr,0,3.9,0),1,'roof'),3);P(BP(mk('sph',1.9,1.2,1.9,fr,0,4.8,0),1,'roof'),2);
    P(BP(mk('sph',.8,.8,.8,CANDY_RED,0,5.5,0),1,'extra'),1,true,.4);
    candyFace(g,arg);},{building:true}),
  // Baker Bun's bakery (BP, Z6 part 2): a pink shop with a striped awning, icing dripping off the roof, a giant cupcake on top
  candy_bakery:(x,z,arg)=>sized(x,z,CANDY_R.bakery,6.7,10,'large',(P,g)=>{
    candyStory(P,6,5,3.2,0,0,['#ffd6e0','#fff1f6'],3);
    P(BP(mk('box',6.8,.45,5.8,'#ff8fab',0,3.42,0),1,'roof'),3);
    for(let i=0;i<6;i++)P(BP(mk('sph',.9,.7,.5,CANDY_ICING,-2.6+i*1.04,3.2,2.95),1,'extra'),1,true,.3);
    P(BP(mk('cyl',2.2,1.2,2.2,'#ffafcc',0,4.25,0),1,'extra'),2,true,.6);P(BP(mk('sph',2.6,1.6,2.6,'#fff1c1',0,5.3,0),1,'extra'),2,true,.6);
    P(BP(mk('sph',.7,.7,.7,CANDY_RED,0,6.3,0),1,'extra'),1,true,.3);
    for(let i=0;i<5;i++)P(BP(candyRot(mk('box',1.2,.18,1.3,i%2?'#ffffff':'#ff4d6d',-2.4+i*1.2,2.75,3.3),.4),0,'extra'),1,true,.3);
    P(BP(mk('box',1.1,1.9,.15,CANDY_CHOCO,1.6,.95,2.88),0,'extra'),1,true,.4);P(BP(mk('box',2.6,1.3,.15,'#a0e7ff',-1.2,1.5,2.88),0,'extra'),1,true,.4);
    candyFace(g,arg);},{building:true}),
  /* ---- huge ---- */
  // gingerbread house (BP): two storeys of gingerbread walls, icing trim, a chocolate roof with gumdrops, cane posts by the door
  candy_gingerhouse:(x,z,arg)=>sized(x,z,CANDY_R.gingerhouse,8.6,16,'huge',(P,g)=>{
    const G=[CANDY_GINGER,'#b86f35'];
    candyStory(P,6.4,5.4,3,0,0,G,2);P(BP(mk('box',7,.35,6,CANDY_ICING,0,3.15,0),0,'slab'),2);
    candyStory(P,5.2,4.4,2.4,3.3,1,G,2);
    P(BP(mk('pyr',7.6,3,6.6,CANDY_CHOCO,0,7.2,0),2,'roof'),5);P(BP(mk('box',7.9,.3,6.9,CANDY_ICING,0,5.8,0),2,'roof'),2);
    for(const [gx,gz] of [[-1.4,1.2],[1.4,-.6]])P(BP(mk('sph',.7,.8,.7,pick(CANDY_BRIGHT),gx,7,gz),2,'extra'),1,true,.35);
    P(BP(mk('box',1.3,2,.2,'#ff70a6',0,1,2.85),0,'extra'),1,true,.45);
    for(const sx of [-1,1]){P(BP(mk('box',1,1,.18,'#a0e7ff',sx*2.1,1.8,2.85),0,'extra'),1,true,.3);
      P(BP(mk('cyl',.28,2.4,.28,sx<0?CANDY_RED:'#ffffff',sx*1,1.2,3.05),0,'extra'),1,true,.3);
      P(BP(mk('box',.9,.8,.18,'#a0e7ff',sx*1.4,4.6,2.35),1,'extra'),1,true,.3);}
    candyFace(g,arg);},{building:true}),
  // gumball machine: red stand, a globe of gumballs that pop off whole, a red cap and knob
  candy_gumball:(x,z)=>sized(x,z,CANDY_R.gumball,10.4,16,'huge',P=>{
    P(mk('cyl',3.6,.9,3.6,CANDY_RED,0,.45,0),4);P(mk('cyl',1.6,2.6,1.6,CANDY_RED,0,2.2,0),3);
    P(mk('box',2.8,1.8,2.8,CANDY_RED,0,4.3,0),4);P(mk('box',.9,.5,.2,'#ced4da',0,4.4,1.45),1,true,.3);P(mk('box',.7,.6,.4,'#ced4da',0,3.6,1.5),1);
    P(mk('sph',3.6,3.6,3.6,'#fff0f6',0,7.2,0),3);
    const n=13;for(let i=0;i<n;i++){const y=1-(i+.5)/n*2,rr=Math.sqrt(1-y*y),a=i*2.39996;
      P(mk('sph',1.25,1.25,1.25,pick(CANDY_BRIGHT),Math.cos(a)*rr*1.75,7.2+y*1.75,Math.sin(a)*rr*1.75),1,true,.5);}
    P(mk('cyl',1.8,.5,1.8,CANDY_RED,0,9.4,0),2,true,.9);P(mk('sph',.6,.6,.6,CANDY_RED,0,9.9,0),1,true,.3);},{big:true}),
  /* ---- mega ---- */
  // giant ice-cream sundae: glass bowl, three scoops, whipped cream, a cherry and wafers
  candy_sundae:(x,z)=>sized(x,z,CANDY_R.sundae,13,40,'mega',(P,g)=>{
    P(mk('cyl',4,.6,4,'#caf0f8',0,.3,0),3);P(mk('cyl',1.4,1.8,1.4,'#caf0f8',0,1.5,0),3);
    P(mk('sph',11,4.6,11,'#caf0f8',0,4.4,0),8);P(mk('cyl',10.4,.6,10.4,'#fff1c1',0,5.6,0),4);
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.5;P(mk('sph',4.6,4.2,4.6,CANDY_SCOOP[i*2%CANDY_SCOOP.length],Math.sin(a)*2.3,7.3,Math.cos(a)*2.3),6);}
    P(mk('sph',4,3.6,4,pick(CANDY_SCOOP),0,9.6,0),5);P(candyRot(candyMk('ring',3.4,3.4,1.5,CANDY_CHOCO,0,9.9,0),Math.PI/2),3);
    P(mk('sph',2.8,1.8,2.8,CANDY_ICING,0,11.4,0),3);P(mk('sph',1.5,1.5,1.5,CANDY_RED,0,12.5,0),2,true,.75);
    P(candyRot(mk('cyl',.12,1,.12,'#2d6a4f',.2,13.4,0),0,0,-.4),1);
    P(candyRot(mk('box',.4,4,1.6,'#f4d58d',3.2,9.2,.5),0,.3,-.35),2,true,1);P(candyRot(mk('box',.4,4,1.6,'#f4d58d',-2.6,9,-1.6),0,-.6,.4),2,true,1);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4,s=mk('box',.6,.2,.2,pick(CANDY_BRIGHT),Math.sin(a)*1.4,11.9,Math.cos(a)*1.4);s.rotation.y=a;P(s,1);}
    g.rotation.y=rand(0,6.28);},{big:true}),
  // three-tier birthday cake (BP): each tier is a ring of walls under a frosting plate; candles on top
  candy_cake:(x,z)=>sized(x,z,CANDY_R.cake,15,60,'mega',(P,g)=>{
    const tiers=[[7.6,4,10,['#ffafcc','#ffc8dd']],[5.4,3.4,8,[CANDY_ICING,'#fff1f6']],[3.4,3,6,['#b9fbc0','#d8f3dc']]],fr=['#fffaf5','#ff8fab','#fffaf5'];
    P(BP(mk('cyl',18,.3,18,'#ffffff',0,.15,0),0,'slab'),4);
    let y=.3;tiers.forEach(([R,h,n,cols],k)=>{candyRing(P,R,h,y,k,n,cols,.9);y+=h;
      P(BP(mk('cyl',R*2+.8,.5,R*2+.8,fr[k],0,y+.25,0),k,'slab'),4);y+=.5;
      for(let i=0;i<(k<1?6:0);i++){const a=(i+.5)/6*Math.PI*2+k*.3;P(BP(mk('sph',1,1.3,.8,fr[k],Math.sin(a)*(R+.45),y-.7,Math.cos(a)*(R+.45)),k,'extra'),1,true,.5);}});
    const top=tiers.length;
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4,cx=Math.sin(a)*2.2,cz=Math.cos(a)*2.2,c=CANDY_BRIGHT[i];
      P(BP(mk('cyl',.5,2,.5,c,cx,y+1,cz),top,'extra'),1,true,1);P(BP(mk('sph',.4,.75,.4,'#ffbe0b',cx,y+2.4,cz),top,'extra'),1,true,.4);}
    P(BP(mk('sph',1.8,1.6,1.8,CANDY_RED,0,y+.8,0),top,'extra'),2,true,.9);
    g.rotation.y=rand(0,6.28);},{building:true})
};

/* Per-prop smash sounds (L22: an object's sfx overrides its zone's crash sound; missing clips fall back to the zone's,
   then the default). Clip prompts are in TASKS.md (AU3) for the audio agent. */
const CANDY_SFX={
  candy_marsh:'candy_boing',candy_gumdrop:'candy_boing',candy_donut:'candy_boing',
  candy_gumball:'candy_gumballs',
  candy_choco:'candy_snap',candy_stand:'candy_crunch',candy_bakery:'candy_splat',candy_partycake:'candy_splat',candy_cookie:'candy_snap',candy_cane:'candy_snap',candy_gingerman:'candy_snap',candy_gingerhouse:'candy_snap',
  candy_cake:'candy_splat',candy_cupcakehouse:'candy_splat',candy_cupcake:'candy_splat',candy_icecream:'candy_splat',candy_sundae:'candy_splat'
};
// wraps each listed prop so it carries its own crash sound (the sub-zones use it too)
function candySfx(props,map){for(const k in map){const f=props[k];if(f)props[k]=(...a)=>{const o=f(...a);o.sfx=map[k];return o;};}}
candySfx(CANDY_PROPS,CANDY_SFX);

/* ---------- scenes (Z6, L31 contract): local coords, +Z is the front; positions never use rand ---------- */
const CANDY_SCENES={
  // a bunny tea party on a frosting patch: a cookie table, gumdrop seats, mint and wrapper plates
  candy_bunny_tea:{size:'mini',r:5,sizes:['micro','mini','tiny'],build(s){
    s.spot('frosting',0,0,7,6,.1);s.place('candy_cookie',0,0,null,0);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;s.place('candy_gumdrop',Math.sin(a)*2,Math.cos(a)*2);}
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;s.place(i%2?'candy_mint':'candy_wrap',Math.sin(a)*1.05,Math.cos(a)*1.05);}
    s.place('candy_popmini',-2.6,-2.2);s.place('candy_popmini',2.7,-2);s.place('candy_beans',2.9,2.4);s.place('candy_beans',-3,2.3);}},
  // the sweet-shop stall: lollipops either side, a queue of cupcakes, a donut that got away
  candy_sweet_stand:{size:'small',r:7,sizes:['tiny','small','medium'],build(s){
    s.spot('frosting',0,1.6,9,6,0);s.place('candy_stand',0,-1,0);
    s.place('candy_lollipop',-3.4,-1.2);s.place('candy_lollipop',3.4,-1.2);s.place('candy_marsh',-4.6,1.6);
    for(let i=0;i<3;i++)s.place('candy_cupcake',-.4+i*.3,2.2+i*1.2);
    s.place('candy_cane',-2.6,3.8,0);s.place('candy_cane',2.6,3.8,0);s.place('candy_donut',5,4.6);s.herd(CANDY_BEAR,-2,6,3);}},
  // a cupcake house with its whole yard: cane fence, lollipop corners, a gumdrop garden, a swirl tree out back
  candy_cupcake_lot:{size:'large',r:11,sizes:['large','huge'],weight:.8,build(s){
    s.spot('frosting',0,0,21,17,0);s.place('candy_cupcakehouse',0,-2,0);
    for(const x of [-9,-6.6,-4.2,4.2,6.6,9])s.place('candy_cane',x,7.6,0);
    s.place('candy_lollipop',-9,-7);s.place('candy_lollipop',9,-7);s.place('candy_swirl',6.5,-5);
    for(let i=0;i<6;i++)s.place('candy_gumdrop',-7.4+(i%3)*1.3,2.4+(i/3|0)*1.3);
    s.place('candy_donut',6,3.4);s.place('candy_marsh',-2.6,5.4);s.herd(CANDY_BEAR,4,5,3);}},
  // a gingerbread house behind a cane arch gate, gingerbread folks at the door
  candy_gingerbread_lot:{size:'huge',r:12,sizes:['huge','mega'],build(s){
    s.spot('frosting',0,0,24,20,0);s.place('candy_gingerhouse',0,-2.5,0);s.place('candy_arch',0,8,0);
    s.place('candy_gingerman',-3,4,0);s.place('candy_gingerman',3,4,0);
    for(const x of [-10,-7.5,-5,5,7.5,10])s.place('candy_cane',x,8.4,0);
    s.place('candy_swirl',-8.5,-6);s.place('candy_swirl',8.5,-6);s.place('candy_icecream',-8.6,3);s.place('candy_choco',8.6,3,3);}}
};
const CANDY_FROSTING={micro:['candy_wrap','candy_mint','candy_beans'],mini:['candy_gumdrop','candy_popmini','candy_cookie'],
  tiny:['candy_cupcake','candy_cane'],small:['candy_donut','candy_marsh','candy_lollipop']};

/* ---------- layout ---------- */
// one cake, one gumball machine and one sundae per map: picked from the candy chunks of the live zone map
let candyLMRows=null,candyLM=null;
function candyLandmarks(){
  if(zoneRows===candyLMRows)return candyLM;candyLMRows=zoneRows;
  const L=ZONES.candy&&ZONES.candy.letter,list=[];
  zoneRows.forEach((row,j)=>[...row].forEach((c,i)=>{if(c===L)list.push([i-CHUNKS_HALF,j-CHUNKS_HALF]);}));
  const n=list.length;candyLM={cake:list[0],gumball:n>1?list[Math.floor(n/2)]:null,sundae:n>2?list[n-1]:null};return candyLM;}
// the sub-zones' one-per-map landmarks: the chunks of zone `id` on the live map (top row first);
// slot 'first' | 'mid' | 'last' or a fraction 0…1 of the way down the list
let candyZRows=null,candyZList={};
function candyChunksOf(id){if(zoneRows!==candyZRows){candyZRows=zoneRows;candyZList={};}
  if(!candyZList[id]){const L=ZONES[id]&&ZONES[id].letter,l=[];zoneRows.forEach((row,j)=>[...row].forEach((c,i)=>{if(c===L)l.push([i-CHUNKS_HALF,j-CHUNKS_HALF]);}));candyZList[id]=l;}
  return candyZList[id];}
function candyIsSlot(ctx,id,slot,min=1){const l=candyChunksOf(id);if(l.length<min)return false;
  const f=slot==='first'?0:slot==='last'?1:slot==='mid'?.5:slot,p=l[Math.round(f*(l.length-1))];return p[0]===ctx.ci&&p[1]===ctx.cj;}
const candyAt=(p,ctx)=>!!(p&&p[0]===ctx.ci&&p[1]===ctx.cj);
const candyPut=(ctx,type,x,z,arg)=>ctx.place(type,x,z,arg,CANDY_R[type.slice(6)]||1.2);
// big things try spots off the chunk center first (roads run through some chunk centers, and __sp.zone drops the car there)
function candyDrop(ctx,type,arg){
  for(const [dx,dz] of [[18,18],[-18,18],[18,-18],[-18,-18],[0,18],[18,0],[0,-18],[-18,0],[0,0]])
    if(candyPut(ctx,type,ctx.cx+dx,ctx.cz+dz,arg))return {x:ctx.cx+dx,z:ctx.cz+dz};
  return null;}
// a layout scene at the first offset where it lands (off the chunk center, clear of the center roads)
function candySceneDrop(ctx,id,th=0,offs=[[18,18],[-18,18],[18,-18],[-18,-18]]){
  for(const [dx,dz] of offs)if(ctx.free(ctx.cx+dx,ctx.cz+dz,4)&&ctx.scene(id,ctx.cx+dx,ctx.cz+dz,th))return {x:ctx.cx+dx,z:ctx.cz+dz};return null;}
function candyRingOf(ctx,x,z,rad,n,type){for(let i=0;i<n;i++){const a=i/n*Math.PI*2+.3;candyPut(ctx,type,x+Math.sin(a)*rad,z+Math.cos(a)*rad,i%4);}}
function candySprinkle(ctx,n,types){for(let i=0;i<n;i++)candyPut(ctx,pick(types),rand(ctx.x0+6,ctx.x1-6),rand(ctx.z0+6,ctx.z1-6),Math.random()*4|0);}
function candyRamps(ctx,n){for(let i=0,t=0;i<n&&t<8;t++)if(ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2))i++;}
function candyLayout(ctx){
  if(candyLand(ctx))return;
  const LM=candyLandOn()?{sundae:candyLandmarks().sundae}:candyLandmarks(); // the land's cake plaza and gumball machine stand at fixed spots
  candyRamps(ctx,Math.random()<.5?2:1);
  if(candyAt(LM.cake,ctx)){const p=candyDrop(ctx,'candy_cake',0);
    if(p){candyRingOf(ctx,p.x,p.z,CANDY_R.cake+3.2,10,'candy_lollipop');candyRingOf(ctx,p.x,p.z,CANDY_R.cake+6.5,8,'candy_cupcake');ctx.herd(CANDY_BEAR,p.x,p.z+CANDY_R.cake+9,5);}
    candySprinkle(ctx,5,['candy_swirl','candy_gumdrop','candy_donut']);return;}
  if(candyAt(LM.gumball,ctx)){const p=candyDrop(ctx,'candy_gumball',0);
    if(p){candyRingOf(ctx,p.x,p.z,CANDY_R.gumball+2.5,8,'candy_gumdrop');candyRingOf(ctx,p.x,p.z,CANDY_R.gumball+6,6,'candy_marsh');}
    candySprinkle(ctx,6,['candy_cupcakehouse','candy_swirl','candy_icecream','candy_choco']);return;}
  if(candyAt(LM.sundae,ctx)){const p=candyDrop(ctx,'candy_sundae',0);
    if(p){candyRingOf(ctx,p.x,p.z,CANDY_R.sundae+3,7,'candy_icecream');candyRingOf(ctx,p.x,p.z,CANDY_R.sundae+6.5,6,'candy_cane');}
    candySprinkle(ctx,5,['candy_swirl','candy_gingerman','candy_donut']);return;}
  const r=Math.random();
  if(r<.45){ // cupcake-house street: two rows of houses with candy-cane posts, lollipops between
    for(const z of [ctx.z0+15,ctx.z1-15]){const f=z<ctx.cz?0:2;
      for(let k=0;k<4;k++){const x=ctx.x0+12+k*18.5;
        if(candyPut(ctx,Math.random()<.2?'candy_gingerhouse':'candy_cupcakehouse',x,z,f)){
          candyPut(ctx,'candy_cane',x+4.6,z+(f?-4:4),f);candyPut(ctx,'candy_lollipop',x-4.4,z+(f?-3.6:3.6),0);}}}
    for(let k=0;k<3;k++){const x=ctx.x0+20+k*20;candyPut(ctx,pick(['candy_icecream','candy_choco','candy_gingerman']),x,ctx.cz-9,k);candyPut(ctx,'candy_donut',x+6,ctx.cz+9,0);}
    candyPut(ctx,'candy_arch',ctx.x0+8,ctx.cz,1);candyPut(ctx,'candy_arch',ctx.x1-8,ctx.cz,1);
  }else if(r<.8){ // lollipop grove with gumdrop hills and a bunny warren (and a sweet stand or a bunny tea party)
    candySceneDrop(ctx,Math.random()<.5?'candy_sweet_stand':'candy_bunny_tea',0,[[rand(-20,20),24],[rand(-20,20),-24]]);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=ctx.x0+10+i*20+rand(-4,4),z=ctx.z0+10+j*20+rand(-4,4);
      candyPut(ctx,Math.random()<.45?'candy_swirl':'candy_lollipop',x,z,0);}
    for(let i=0;i<3;i++){const x=rand(ctx.x0+12,ctx.x1-12),z=rand(ctx.z0+12,ctx.z1-12);for(let k=0;k<4;k++)candyPut(ctx,'candy_gumdrop',x+rand(-3,3),z+rand(-3,3),0);}
    candySprinkle(ctx,6,['candy_donut','candy_marsh','candy_gingerman','candy_icecream']);
    ctx.herd(Math.random()<.6?CANDY_BEAR:'bunny',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),5);
  }else{ // gingerbread lane: a gingerbread lot or houses, gingerbread folks, cane arches
    if(Math.random()<.4)candySceneDrop(ctx,Math.random()<.5?'candy_gingerbread_lot':'candy_cupcake_lot',0);
    const a=candyDrop(ctx,'candy_gingerhouse',0);if(a){candyPut(ctx,'candy_gingerman',a.x+6,a.z+5,0);candyPut(ctx,'candy_cane',a.x-5.5,a.z+5,0);candyPut(ctx,'candy_cane',a.x+2,a.z+6.5,0);}
    const b=candyDrop(ctx,'candy_gingerhouse',2);if(b)candyPut(ctx,'candy_arch',b.x,b.z+8.5,0);
    candySprinkle(ctx,6,['candy_cupcakehouse','candy_swirl','candy_marsh','candy_choco','candy_gingerman']);
    ctx.herd(Math.random()<.5?CANDY_BEAR:CANDY_SHEEP,rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),4);
  }
}

registerZone({
  id:'candy',letter:'C',
  ground:'#f9c6dd',
  sky:{top:'#ff9ecf',horizon:'#ffe3f1'},
  weight:1,
  // L22 sound + music ids (clips listed in TASKS.md AU3; anything missing falls back to the default sounds)
  music:{drive:'candy_drive',boss:'candy_boss'},
  sfx:{crash:'candy_crunch',boom:'candy_pop',land:'candy_squish',ambient:'candy_ambient'},
  props:CANDY_PROPS,
  sizes:{
    micro:['candy_wrap','candy_beans','candy_mint'],
    mini:['candy_gumdrop','candy_popmini','candy_cookie'],
    tiny:['candy_cane','candy_cupcake'],
    small:['candy_lollipop','candy_donut','candy_marsh','candy_stand'],
    medium:['candy_icecream','candy_choco','candy_gingerman'],
    large:['candy_swirl','candy_cupcakehouse','candy_arch'],
    huge:['candy_gingerhouse','candy_gumball'],
    mega:['candy_cake','candy_sundae']
  },
  herds:[[CANDY_BEAR,5],[CANDY_SHEEP,3],['bunny',2]],   // A5b: gummy bears + marshmallow sheep
  scenes:CANDY_SCENES,
  spots:{frosting:CANDY_FROSTING,icing_walk:{micro:['candy_wrap','candy_mint','candy_beans'],mini:['candy_gumdrop','candy_popmini'],tiny:['candy_cupcake']},
    plaza:{micro:['candy_wrap','candy_mint'],mini:['candy_gumdrop'],tiny:['candy_cupcake'],small:['candy_marsh','candy_donut']},
    quarry:{micro:['candy_crystal'],mini:['candy_gumdrop'],small:['candy_rockcandy']}},
  // Z6 part 2 kinds for the land's quest chunks: icing sidewalks, the gumball bowl, the cake plaza, the dock's wafer pier, the quarry
  spotLook:{frosting:'#ffe5ec',icing_walk:'#fff7fb',gum_bowl:'#ffd166',plaza:'#fff1c1',wafer:'#f4d58d',quarry:'#e9d8fd'},
  layout:candyLayout
});
