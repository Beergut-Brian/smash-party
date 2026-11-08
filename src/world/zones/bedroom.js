/* Smash Party — INSIDE THE HOUSE: a giant kid's bedroom (indoor zone, Z3). Owner: zone-bedroom agent (see agents/zone.md).
   The room is fully planned (Z4): furniture and 13 scenes at fixed spots, from a cereal spill at the start (micro)
   to a toy-car race on the play-mat road (tiny), a tea party, a train loop and a pillow fort (large); only a small
   random top-up and the filler scenes (the same scenes at your size) come on top.
   You start micro among crumbs, cereal and building bricks in front of a play-mat road rug, grow into toys, then furniture,
   and at HUGE you smash the bedroom door to BREAK OUT (mega is left for outside). The mega set pieces (a bunk bed
   with a slide, a cardboard-box castle) are there for anyone who stays in. Room = ±80, walls 44 tall; at that scale
   1 unit ≈ 6 cm, so a cereal ring is micro, a toy block tiny, a teddy small, a dresser huge.
   All block-built from core.js shapes + M(color) (plus two shared shapes), so sleeping copies batch per shape.
   Every top-level name starts with bedroom/BEDROOM. */
const BEDROOM_TOY=['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93','#ff924c','#4cc9f0','#f15bb5'];
const BEDROOM_PASTEL=['#ffadad','#ffd6a5','#fdffb6','#caffbf','#9bf6ff','#a0c4ff','#bdb2ff','#ffc6ff'];
const BEDROOM_WOOD='#c98b55',BEDROOM_WOOD2='#a86b3c',BEDROOM_WHITE='#fffaf2',BEDROOM_FUR='#c68b59',BEDROOM_FUR2='#f2d3ab',
  BEDROOM_BOX='#d9a86c',BEDROOM_BOX2='#b9864e',BEDROOM_INK='#2b2d42',BEDROOM_HALF=80,BEDROOM_WALLH=44;
// shared shapes (one batch each while asleep): a ring (cereal, drum rims, wheels) and a half ring (handles, sippy-cup ears)
const BEDROOM_GEO={ring:new THREE.TorusGeometry(.5,.2,10,22),hook:new THREE.TorusGeometry(.5,.16,8,14,Math.PI)};
function bedroomMk(geo,sx,sy,sz,color,x=0,y=0,z=0){const m=new THREE.Mesh(BEDROOM_GEO[geo],M(color));
  m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;}
const bedroomRot=(m,rx,ry,rz)=>{m.rotation.set(rx||0,ry||0,rz||0);return m;};
function bedroomFace(g,arg){g.rotation.y=(typeof arg==='number'?((arg%4)+4)%4:(Math.random()*4|0))*Math.PI/2;}
const bedroomSpinY=g=>{g.rotation.y=rand(0,6.28);};
// two googly eyes + a smile on a plush face at (x,y,z) looking +Z
function bedroomFace2(P,x,y,z,s){
  for(const d of [-1,1]){P(mk('sph',.32*s,.32*s,.14*s,'#ffffff',x+d*.3*s,y+.12*s,z),1,true,.1*s);P(mk('sph',.16*s,.16*s,.1*s,BEDROOM_INK,x+d*.3*s,y+.12*s,z+.06*s),1);}}
// square storey: segs wall pieces per side + a floor plate (BP contract: several walls per storey)
function bedroomStory(P,w,d,h,y,floor,cols,segs=3,t=.6,slabCol){
  for(let s=0;s<4;s++){const along=(s<2?w:d)+t,e=(s<2?d:w)/2,len=along/segs+t*.4;
    for(let k=0;k<segs;k++){const a=-along/2+along/(segs*2)+k*along/segs,c=cols[(s+k)%cols.length];
      P(BP(s<2?mk('box',len,h,t,c,a,y+h/2,s?e:-e):mk('box',t,h,len,c,s==2?e:-e,y+h/2,a),floor,'wall'),2);}}
  P(BP(mk('box',w-.3,.3,d-.3,slabCol||cols[0],0,y+.15,0),floor,'slab'),2);}
// leaning ring of panels (teepee): n panels between radius r0 at y0 and r1 at y1
function bedroomCone(P,r0,r1,y0,y1,n,floor,cols){const h=y1-y0,lean=Math.atan2(r0-r1,h),L=Math.hypot(h,r0-r1),rm=(r0+r1)/2;
  for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2,w=mk('box',Math.PI*2*rm/n*1.12,L,.4,cols[i%cols.length],Math.sin(a)*rm,y0+h/2,Math.cos(a)*rm);
    w.rotation.order='YXZ';w.rotation.set(-lean,a,0);P(BP(w,floor,'wall'),2);}}
const BEDROOM_R={crumb:.2,cereal:.22,gummy:.2,brick:.24,crayon:.45,marble:.3,bricks:.4,dice:.42,block:.6,duck:.55,toycar:.7,sock:.6,
  teddy:1.1,books:1.2,cup:.8,robot:.9,ball:1.1,truck:2,train:2.2,tower:1.6,drum:1.5,bunny:1.4,
  chest:5.2,dollhouse:4.6,lamp:2.6,chair:3.4,desk:6.5,horse:4,beanbag:3.6,dresser:7.4,shelf:8,bigteddy:6,tent:7,door:7,bunkbed:11,castle:12,
  teacup:.35,teapot:.7,flag:.45,bowl:1.4,teatable:1.7,stand:2.8,rail:2.1,crayonbox:1.2,dino:1.3,tunnel:2.4,sockpile:2.3,easel:2.2,pillow:2.2,marblerun:2.8,basket:4,fort:6.5};
// placement radius per prop for scenes and the filler (game.js recR reads RAD); only our own bedroom_ keys
if(typeof RAD!=='undefined')for(const k in BEDROOM_R)if(RAD['bedroom_'+k]==null)RAD['bedroom_'+k]=BEDROOM_R[k];
// fixed pseudo-random 0..1 (scenes are built once per chunk they touch, so their positions must not use rand)
const bedroomH=(i,k=0)=>{const v=Math.sin(i*12.9898+k*78.233+1.7)*43758.5453;return v-Math.floor(v);};

const BEDROOM_PROPS={
  /* ---- micro: floor crumbs and the tiniest toys ---- */
  bedroom_crumb:(x,z)=>sized(x,z,BEDROOM_R.crumb,.2,1,'micro',(P,g)=>{
    P(bedroomRot(mk('box',.26,.16,.22,'#d9a066',0,.08,0),0,.4,.2),1,true,.1);P(bedroomRot(mk('box',.14,.1,.12,'#c98b48',.18,.05,.1),.3,0,0),1,true,.07);
    P(mk('sph',.06,.05,.06,'#5c3317',-.05,.17,0),1);bedroomSpinY(g);}),
  bedroom_cereal:(x,z)=>sized(x,z,BEDROOM_R.cereal,.38,1,'micro',(P,g)=>{
    P(bedroomMk('ring',.36,.36,.5,pick(['#ff595e','#ffca3a','#8ac926','#ff924c','#f15bb5']),0,.19,0),1,true,.16);bedroomSpinY(g);},{roll:true}),
  bedroom_gummy:(x,z)=>sized(x,z,BEDROOM_R.gummy,.42,1,'micro',(P,g)=>{const c=pick(['#ff595e','#ffca3a','#8ac926','#ff924c','#f15bb5']);
    P(mk('sph',.24,.26,.18,c,0,.13,0),1,true,.12);P(mk('sph',.18,.17,.15,c,0,.32,0),1,true,.09);
    for(const d of [-1,1])P(mk('sph',.07,.07,.06,c,d*.07,.41,0),1);bedroomSpinY(g);}),
  bedroom_brick:(x,z)=>sized(x,z,BEDROOM_R.brick,.28,1,'micro',(P,g)=>{const c=pick(BEDROOM_TOY);
    P(mk('box',.36,.2,.36,c,0,.1,0),1,true,.16);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(mk('cyl',.1,.07,.1,c,a*.09,.235,b*.09),1);bedroomSpinY(g);}),
  /* ---- mini ---- */
  bedroom_crayon:(x,z)=>sized(x,z,BEDROOM_R.crayon,.22,1,'mini',(P,g)=>{const c=pick(BEDROOM_TOY);
    P(bedroomRot(mk('cyl',.18,.7,.18,c,0,.1,0),0,0,Math.PI/2),2);P(bedroomRot(mk('cyl',.19,.36,.19,BEDROOM_WHITE,-.12,.1,0),0,0,Math.PI/2),1);
    P(bedroomRot(mk('cone',.18,.2,.18,c,.45,.1,0),0,0,-Math.PI/2),1,true,.1);bedroomSpinY(g);},{roll:true}),
  bedroom_marble:(x,z)=>sized(x,z,BEDROOM_R.marble,.55,1,'mini',(P,g)=>{
    P(mk('sph',.55,.55,.55,pick(['#4cc9f0','#8ac926','#f15bb5','#ffca3a','#9bf6ff']),0,.275,0),2,true,.27);
    P(bedroomRot(mk('box',.5,.1,.12,'#ffffff',0,.3,.18),0,0,.7),1);},{roll:true}),
  bedroom_bricks:(x,z)=>sized(x,z,BEDROOM_R.bricks,.62,1,'mini',(P,g)=>{
    for(let i=0;i<3;i++){const c=BEDROOM_TOY[(i*3+(Math.random()*8|0))%8],b=mk('box',.62,.2,.32,c,rand(-.06,.06),.1+i*.2,0);b.rotation.y=rand(-.3,.3);P(b,1,true,.15);}
    for(const a of [-.21,0,.21])P(mk('cyl',.1,.07,.1,BEDROOM_TOY[0],a,.64,0),1);bedroomSpinY(g);}),
  bedroom_dice:(x,z)=>sized(x,z,BEDROOM_R.dice,.62,1,'mini',(P,g)=>{const c=pick(['#ff595e','#1982c4','#8ac926']);
    P(mk('box',.6,.6,.6,c,0,.3,0),2,true,.3);
    for(const [a,b] of [[-.15,.15],[0,0],[.15,-.15]])P(mk('sph',.1,.1,.05,BEDROOM_WHITE,a,.3+b,.3),1);
    for(const [a,b] of [[-.14,-.14],[.14,.14]])P(mk('sph',.1,.05,.1,BEDROOM_WHITE,a,.6,b),1);g.rotation.y=rand(0,6.28);},{roll:true}),
  /* ---- tiny ---- */
  bedroom_block:(x,z)=>sized(x,z,BEDROOM_R.block,1,1,'tiny',(P,g)=>{const c=pick(BEDROOM_TOY),d=pick(BEDROOM_PASTEL);
    P(mk('box',1,1,1,d,0,.5,0),3,true,.45);
    P(mk('box',.62,.62,.06,c,0,.5,.5),1);P(mk('box',.06,.62,.62,pick(BEDROOM_TOY),.5,.5,0),1);P(mk('pyr',.5,.4,.5,pick(BEDROOM_TOY),0,1.02,0),1,true,.2);
    g.rotation.y=rand(0,6.28);}),
  bedroom_duck:(x,z,arg)=>sized(x,z,BEDROOM_R.duck,1,1,'tiny',(P,g)=>{
    P(mk('sph',.95,.65,1.1,'#ffd60a',0,.33,0),2,true,.35);P(mk('sph',.55,.55,.55,'#ffd60a',0,.82,.3),1,true,.25);
    P(mk('box',.3,.12,.3,'#ff924c',0,.78,.62),1);P(mk('sph',.3,.2,.2,'#ffd60a',0,.55,-.55),1);
    for(const d of [-1,1])P(mk('sph',.1,.12,.06,BEDROOM_INK,d*.16,.92,.53),1);typeof arg==='number'?bedroomFace(g,arg):bedroomSpinY(g);},{roll:true}),
  bedroom_toycar:(x,z,arg)=>sized(x,z,BEDROOM_R.toycar,.62,2,'tiny',(P,g)=>{const c=pick(['#ff595e','#1982c4','#8ac926','#ffca3a','#6a4c93']);
    P(mk('box',.62,.26,1.3,c,0,.24,0),2);P(mk('box',.5,.22,.6,'#bde0fe',0,.48,-.05),1,true,.18);P(mk('box',.55,.04,.08,BEDROOM_WHITE,0,.38,.5),1);
    for(const [a,b] of [[-1,1],[1,1],[-1,-1],[1,-1]])P(bedroomRot(mk('cyl',.26,.12,.26,BEDROOM_INK,a*.32,.13,b*.42),0,0,Math.PI/2),1,true,.12);
    typeof arg==='number'?bedroomFace(g,arg):bedroomSpinY(g);}),
  bedroom_sock:(x,z)=>sized(x,z,BEDROOM_R.sock,.3,1,'tiny',(P,g)=>{const a=pick(BEDROOM_PASTEL),b=pick(BEDROOM_TOY);
    for(let i=0;i<4;i++)P(mk('box',.42,.24,.26,i%2?a:b,0,.12,-.45+i*.26),1,true,.12);
    P(mk('box',.42,.24,.5,b,.3,.12,.42),1,true,.15);P(mk('box',.38,.25,.2,BEDROOM_WHITE,.36,.12,.58),1);bedroomSpinY(g);}),
  /* ---- small ---- */
  bedroom_teddy:(x,z,arg)=>sized(x,z,BEDROOM_R.teddy,2.6,3,'small',(P,g)=>{const f=pick([BEDROOM_FUR,'#e9c46a','#d4a5a5','#b8a1d9']);
    P(mk('sph',1.4,1.5,1.2,f,0,.75,0),3);P(mk('sph',.8,.8,.2,BEDROOM_FUR2,0,.78,.52),1);
    P(mk('sph',1.1,1,1,f,0,1.95,0),3,true,.5);P(mk('sph',.48,.36,.36,BEDROOM_FUR2,0,1.8,.45),1);P(mk('sph',.16,.12,.1,BEDROOM_INK,0,1.88,.62),1);
    for(const d of [-1,1]){P(mk('sph',.38,.38,.2,f,d*.42,2.45,0),1,true,.18);P(mk('sph',.4,.62,.4,f,d*.72,.95,.15),1,true,.2);P(mk('sph',.45,.4,.6,f,d*.38,.22,.45),1,true,.2);}
    for(const d of [-1,1])P(mk('sph',.14,.16,.08,BEDROOM_INK,d*.22,2.06,.45),1);P(mk('box',.5,.22,.18,pick(BEDROOM_TOY),0,1.5,.5),1,true,.12);
    bedroomFace(g,arg);}),
  bedroom_books:(x,z)=>sized(x,z,BEDROOM_R.books,1.6,3,'small',(P,g)=>{let y=0;
    for(let i=0;i<4;i++){const h=rand(.32,.46),b=mk('box',rand(1.6,2.1),h,rand(1.2,1.5),pick(BEDROOM_TOY),rand(-.1,.1),y+h/2,rand(-.1,.1));b.rotation.y=rand(-.25,.25);
      P(b,2,true,.3);P(mk('box',b.scale.x*.96,h*.7,.04,BEDROOM_WHITE,b.position.x,y+h/2,b.position.z+b.scale.z/2),1);y+=h;}
    bedroomSpinY(g);}),
  bedroom_cup:(x,z)=>sized(x,z,BEDROOM_R.cup,2,3,'small',(P,g)=>{const c=pick(['#4cc9f0','#f15bb5','#8ac926','#ffca3a']);
    P(mk('cyl',1.05,1.4,1.05,c,0,.7,0),3);P(mk('cyl',1.1,.3,1.1,BEDROOM_WHITE,0,1.5,0),1,true,.3);P(mk('cyl',.4,.4,.3,BEDROOM_WHITE,0,1.82,.2),1,true,.15);
    for(const d of [-1,1])P(bedroomRot(bedroomMk('hook',.7,.7,.6,c,d*.55,.9,0),0,Math.PI/2,d*Math.PI/2),1,true,.2);
    P(mk('sph',.4,.4,.08,'#ffffff',0,.8,.52),1);bedroomSpinY(g);}),
  bedroom_robot:(x,z,arg)=>sized(x,z,BEDROOM_R.robot,2.6,3,'small',(P,g)=>{const c=pick(['#adb5bd','#4cc9f0','#ff924c']);
    for(const d of [-1,1])P(mk('box',.38,.6,.5,BEDROOM_INK,d*.26,.3,0),1,true,.2);
    P(mk('box',1.1,1,.8,c,0,1.1,0),3);P(mk('box',.5,.4,.06,'#ffca3a',0,1.15,.42),1);P(mk('sph',.12,.12,.06,'#ff595e',-.12,1.18,.46),1);
    P(mk('box',.8,.66,.66,c,0,1.95,0),2,true,.35);for(const d of [-1,1])P(mk('cyl',.2,.06,.2,'#ffffff',d*.18,2,.34),1);
    P(mk('cyl',.05,.35,.05,BEDROOM_INK,0,2.45,0),1);P(mk('sph',.16,.16,.16,'#ff595e',0,2.65,0),1,true,.08);
    for(const d of [-1,1])P(mk('box',.22,.7,.22,c,d*.68,1.15,0),1,true,.15);
    P(mk('box',.12,.12,.3,'#ffca3a',0,1.2,-.5),1);P(mk('box',.5,.3,.06,'#ffca3a',0,1.2,-.66),1,true,.12);bedroomFace(g,arg);}),
  bedroom_ball:(x,z)=>sized(x,z,BEDROOM_R.ball,2.2,3,'small',(P,g)=>{const a=pick(BEDROOM_TOY),b=pick(BEDROOM_TOY.filter(c=>c!==a));
    P(mk('sph',2.2,2.2,2.2,a,0,1.1,0),4);P(mk('cyl',2.24,.5,2.24,b,0,1.1,0),2);P(mk('sph',.7,.7,.2,'#ffffff',.6,1.5,.85),1);
    g.rotation.y=rand(0,6.28);},{roll:true}),
  /* ---- medium ---- */
  bedroom_truck:(x,z,arg)=>sized(x,z,BEDROOM_R.truck,2.6,5,'medium',(P,g)=>{const c=pick(['#ffca3a','#ff595e','#1982c4']);
    P(mk('box',1.9,.5,3.8,'#495057',0,.55,0),3);P(mk('box',1.8,1.3,1.2,c,0,1.4,1.25),3);P(mk('box',1.6,.6,.06,'#bde0fe',0,1.65,1.86),1);
    P(bedroomRot(mk('box',2,1,2.4,pick(['#ff924c','#8ac926','#4cc9f0']),0,1.45,-.65),-.12,0,0),4,true,.6);
    for(const [a,b] of [[-1,1.2],[1,1.2],[-1,-1.2],[1,-1.2]])P(bedroomRot(mk('cyl',.95,.5,.95,BEDROOM_INK,a*.95,.47,b),0,0,Math.PI/2),1,true,.4);
    for(const d of [-1,1])P(mk('sph',.2,.2,.08,'#fff3b0',d*.6,1,1.88),1);bedroomFace(g,arg);}),
  bedroom_train:(x,z,arg)=>sized(x,z,BEDROOM_R.train,2.8,5,'medium',(P,g)=>{const c=pick(['#ff595e','#1982c4','#8ac926']);
    P(mk('box',1.8,.4,4.2,BEDROOM_INK,0,.55,0),2);P(bedroomRot(mk('cyl',1.4,2.4,1.4,c,0,1.35,.8),Math.PI/2),3);P(mk('cyl',1.45,.1,1.45,'#ffca3a',0,1.35,2.02),1);
    P(mk('box',1.7,1.9,1.4,c,0,1.65,-1.2),3);P(mk('box',1.9,.25,1.7,'#ffca3a',0,2.7,-1.2),1,true,.4);P(mk('box',1.2,.6,.06,'#bde0fe',0,2,-.48),1);
    P(mk('cyl',.5,.9,.5,BEDROOM_INK,0,2.4,1.4),1,true,.25);P(mk('cone',.8,.3,.8,BEDROOM_INK,0,2.95,1.4),1,true,.25);
    for(const b of [1.5,.2,-1.3])for(const d of [-1,1])P(bedroomRot(mk('cyl',.85,.3,.85,'#ffca3a',d*.95,.45,b),0,0,Math.PI/2),1,true,.35);
    P(bedroomRot(mk('pyr',1.5,.6,.5,'#ffca3a',0,.5,2.2),Math.PI/2.5,0,0),1,true,.3);bedroomFace(g,arg);}),
  bedroom_tower:(x,z)=>sized(x,z,BEDROOM_R.tower,5.4,6,'medium',(P,g)=>{ // a stack of toy blocks that topples storey by storey
    for(let f=0;f<4;f++){const tw=f*.25;for(const [a,b] of [[-.62,-.62],[.62,-.62],[-.62,.62],[.62,.62]]){
      const m=mk('box',1.2,1.2,1.2,BEDROOM_TOY[(f*2+(a>0?1:0)+(b>0?2:0))%8],a*Math.cos(tw)-b*Math.sin(tw),f*1.22+.6,a*Math.sin(tw)+b*Math.cos(tw));m.rotation.y=-tw;P(BP(m,f,'wall'),2);}}
    P(BP(mk('pyr',1.8,1,1.8,'#ff595e',0,5.38,0),4,'roof'),2,true);}, {building:true}),
  bedroom_drum:(x,z)=>sized(x,z,BEDROOM_R.drum,2.6,5,'medium',(P,g)=>{const c=pick(['#ff595e','#1982c4','#6a4c93']);
    P(mk('cyl',2.6,1.6,2.6,c,0,.8,0),4);P(mk('cyl',2.62,.12,2.62,BEDROOM_WHITE,0,1.62,0),1,true,.4);
    P(bedroomRot(bedroomMk('ring',2.65,2.65,.5,'#ffca3a',0,1.55,0),Math.PI/2),1,true,.4);P(bedroomRot(bedroomMk('ring',2.65,2.65,.5,'#ffca3a',0,.1,0),Math.PI/2),1);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2,m=mk('box',.08,1.4,.08,'#ffca3a',Math.sin(a)*1.32,.82,Math.cos(a)*1.32);m.rotation.set(Math.cos(a)*.5,0,-Math.sin(a)*.5);P(m,1);}
    for(const d of [-1,1]){P(bedroomRot(mk('cyl',.12,1.8,.12,BEDROOM_WOOD,d*.4,1.9,.2),0,d*.6,Math.PI/2.6*d),1,true,.3);P(mk('sph',.3,.3,.3,BEDROOM_WHITE,d*1.15,2.25,.2),1,true,.12);}
    bedroomSpinY(g);}),
  bedroom_bunny:(x,z,arg)=>sized(x,z,BEDROOM_R.bunny,4.4,5,'medium',(P,g)=>{const f=pick(['#ffffff','#ffc6ff','#bdb2ff','#caffbf']);
    P(mk('sph',1.9,2,1.6,f,0,1,0),3);P(mk('sph',1.1,1.1,.3,'#ffffff',0,1,.7),1);
    P(mk('sph',1.5,1.3,1.3,f,0,2.55,0),3,true,.65);P(mk('sph',.24,.18,.14,'#ff8fab',0,2.5,.66),1);bedroomFace2(P,0,2.6,.6,1);
    for(const d of [-1,1]){P(bedroomRot(mk('sph',.42,1.5,.26,f,d*.38,3.75,0),0,0,-d*.18),1,true,.45);P(bedroomRot(mk('sph',.24,1.1,.1,'#ff8fab',d*.39,3.75,.12),0,0,-d*.18),1);
      P(mk('sph',.6,.45,.9,f,d*.55,.25,.6),1,true,.3);P(mk('sph',.5,.9,.5,f,d*.98,1.3,.2),1,true,.25);}
    P(mk('sph',.5,.5,.5,'#ffffff',0,.7,-.8),1,true,.2);bedroomFace(g,arg);}),
  /* ---- large: big toys and small furniture ---- */
  bedroom_chest:(x,z,arg)=>sized(x,z,BEDROOM_R.chest,7.8,10,'large',(P,g)=>{ // toy chest: the lid flies, toys pop out
    bedroomStory(P,10,6,6,0,0,['#e63946','#d62839','#e63946'],3,.6,'#9d0208');
    for(const d of [-1,1])P(BP(mk('box',.3,4.6,.5,'#ffca3a',d*4.3,3,3.15),0,'extra'),1,true);P(BP(mk('box',8,.4,.5,'#ffca3a',0,5.4,3.15),0,'extra'),1,true);
    P(BP(mk('sph',1.4,1.4,.3,'#ffca3a',0,3.2,3.2),0,'extra'),1,true);P(BP(mk('sph',.8,.8,.32,'#1982c4',0,3.2,3.25),0,'extra'),1,true);
    P(BP(bedroomRot(mk('box',10.6,.7,6.6,'#ffca3a',0,6.6,-.9),-.45,0,0),1,'roof'),4,true);
    P(BP(mk('sph',2.2,2.2,2.2,'#4cc9f0',-2.8,6.8,.4),1,'extra'),2,true);P(BP(bedroomRot(mk('box',1.8,1.8,1.8,'#8ac926',2.6,6.6,.6),.3,.5,.2),1,'extra'),2,true);
    P(BP(bedroomRot(mk('sph',.55,2.2,.4,'#ffffff',0,7.6,.8),0,0,.3),1,'extra'),1,true);P(BP(bedroomRot(mk('sph',.55,2.2,.4,'#ffffff',.7,7.5,.8),0,0,-.2),1,'extra'),1,true);
    bedroomFace(g,arg);},{building:true}),
  bedroom_dollhouse:(x,z,arg)=>sized(x,z,BEDROOM_R.dollhouse,11.5,12,'large',(P,g)=>{const wall=pick(['#ffc6ff','#caffbf','#fdffb6','#9bf6ff']),roof=pick(['#ff595e','#6a4c93','#1982c4']);
    bedroomStory(P,8,6,4.4,0,0,[wall],2,.5,BEDROOM_WHITE);bedroomStory(P,8,6,4.2,4.4,1,[wall],2,.5,BEDROOM_WHITE);
    P(BP(mk('pyr',9.6,3,7.6,roof,0,10.1,0),2,'roof'),5);P(BP(mk('box',1,2.4,1,roof,2.5,10.6,-1),2,'extra'),1,true);
    P(BP(mk('box',1.4,2.6,.2,'#a86b3c',0,1.3,3.1),0,'extra'),1,true);P(BP(mk('sph',.2,.2,.1,'#ffca3a',.45,1.3,3.2),0,'extra'),1,true);
    for(const [a,y,f] of [[-2.3,2.4,0],[2.3,2.4,0],[-2.3,6.6,1],[0,6.6,1],[2.3,6.6,1]]){P(BP(mk('box',1.3,1.3,.15,'#bde0fe',a,y,3.12),f,'extra'),1,true);P(BP(mk('box',1.5,.2,.3,BEDROOM_WHITE,a,y-.75,3.15),f,'extra'),1,true);}
    P(BP(mk('box',8.4,.3,1.2,BEDROOM_WHITE,0,4.45,3.4),1,'extra'),2,true);bedroomFace(g,arg);},{building:true}),
  bedroom_lamp:(x,z)=>sized(x,z,BEDROOM_R.lamp,14,8,'large',(P,g)=>{const c=pick(['#ffca3a','#ff8fab','#4cc9f0']);
    P(mk('cyl',4,.6,4,BEDROOM_WHITE,0,.3,0),3);P(mk('cyl',.4,10,.4,BEDROOM_WHITE,0,5.5,0),3);P(mk('sph',.9,.9,.9,'#fff3b0',0,10.6,0),1,true,.4);
    P(mk('cone',5,3.4,5,c,0,11.8,0),4,true,1.4);P(mk('cyl',5.05,.3,5.05,BEDROOM_WHITE,0,10.2,0),1,true,1);P(mk('cyl',.2,2,.2,BEDROOM_INK,.8,8.8,0),1);
    P(mk('sph',.4,.4,.4,'#ffca3a',.8,7.8,0),1,true,.2);}),
  bedroom_chair:(x,z,arg)=>sized(x,z,BEDROOM_R.chair,11,8,'large',(P,g)=>{const c=pick(['#1982c4','#8ac926','#ff924c']);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(mk('box',.6,6,.6,BEDROOM_WHITE,a*2.6,3,b*2.6),2);
    P(mk('box',6.4,.8,6.4,c,0,6.3,0),3);P(mk('box',6.2,.4,6,pick(BEDROOM_PASTEL),0,6.9,.1),2,true,1.2);
    for(const d of [-1,1])P(mk('box',.6,4.8,.6,BEDROOM_WHITE,d*2.6,9.1,-2.7),2);P(mk('box',6,3,.5,c,0,10,-2.7),3,true,1.2);
    P(mk('sph',1,1,.3,'#ffca3a',0,10,-2.4),1,true,.3);bedroomFace(g,arg);}),
  bedroom_desk:(x,z,arg)=>sized(x,z,BEDROOM_R.desk,15,10,'large',(P,g)=>{
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(mk('box',.9,11,.9,BEDROOM_WHITE,a*6.6,5.5,b*3),2);
    P(mk('box',14.6,.9,7.6,BEDROOM_WOOD,0,11.4,0),5);P(mk('box',5,3,6.6,BEDROOM_WHITE,4.2,9.4,0),3);P(mk('box',3.6,1.2,.2,'#ff8fab',4.2,9.4,3.35),1,true,.5);
    P(mk('box',4,.2,5.4,'#ffffff',-2.5,11.95,.4),1,true,1);P(bedroomRot(mk('box',3.6,.2,5,'#a0c4ff',-2.3,12.15,.2),0,.2,0),1,true,1);
    P(mk('cyl',1.6,2.4,1.6,'#4cc9f0',-5.6,13,-2),1,true,.5);for(let i=0;i<3;i++)P(bedroomRot(mk('cyl',.3,3.4,.3,BEDROOM_TOY[i],-5.6+(i-1)*.4,14.2,-2),.15*(i-1),0,.2*(i-1)),1,true,.3);
    P(mk('cyl',2,.3,2,BEDROOM_INK,4.5,12,-2),1);P(mk('cyl',.3,3.4,.3,BEDROOM_INK,4.5,13.7,-2),1);P(bedroomRot(mk('cone',2.6,2,2.6,'#ffca3a',4,15.4,-1.4),.6,0,0),1,true,.8);
    P(mk('sph',1.6,1.6,1.6,'#4cc9f0',1.2,12.7,-2.4),1,true,.6);P(mk('cyl',.4,.8,.4,'#ffca3a',1.2,11.9,-2.4),1);bedroomFace(g,arg);}),
  bedroom_horse:(x,z,arg)=>sized(x,z,BEDROOM_R.horse,8,10,'large',(P,g)=>{const c=pick(['#ffffff','#f2d3ab','#ffc6ff']),m=pick(['#ff595e','#6a4c93','#ffca3a']);
    for(const d of [-1,1]){const r=bedroomRot(bedroomMk('hook',8,6,1.4,BEDROOM_WOOD2,d*1.2,3,0),0,Math.PI/2,Math.PI);r.position.y=3.2;P(r,3,true,1);}
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(mk('box',.5,2.6,.5,c,a*1,2.1,b*1.8),1);
    P(mk('sph',2.4,2.4,5,c,0,3.9,0),4);P(bedroomRot(mk('box',1.3,2.6,1.3,c,0,5.4,2.2),.4,0,0),2);P(mk('box',1.5,1.5,2.6,c,0,6.6,3.2),2,true,.8);
    P(mk('box',.4,2.4,1.8,m,0,6.1,1.6),1,true,.5);P(bedroomRot(mk('box',.5,.4,2.8,m,0,4.6,-2.8),-.6,0,0),1,true,.5);
    P(mk('box',2.6,.4,1.8,m,0,5.1,-.3),1,true,.6);for(const d of [-1,1]){P(mk('sph',.3,.3,.15,BEDROOM_INK,d*.76,7,3.6),1);P(mk('pyr',.4,.7,.3,c,d*.4,7.6,2.6),1);}
    P(bedroomRot(mk('cyl',.25,3.6,.25,'#ffca3a',0,6.5,3.3),0,0,Math.PI/2),1,true,.5);bedroomFace(g,arg);}),
  bedroom_beanbag:(x,z)=>sized(x,z,BEDROOM_R.beanbag,5.2,8,'large',(P,g)=>{const c=pick(['#f15bb5','#4cc9f0','#8ac926','#ff924c']);
    P(mk('sph',7.2,4.2,7.2,c,0,2.1,0),5);P(mk('sph',5.4,3.6,3,c,0,3.6,-2.2),3,true,1.4);P(mk('sph',3.2,.6,3.2,'#ffffff',0,4.15,.8),1);
    for(const [a,b] of [[-2,1.5],[2.2,1.2],[0,2.8]])P(mk('sph',.7,.7,.7,'#ffffff',a,3.4,b),1);bedroomSpinY(g);}),
  /* ---- huge: big furniture (the door is here too: smash it to BREAK OUT) ---- */
  bedroom_dresser:(x,z,arg)=>sized(x,z,BEDROOM_R.dresser,18.5,18,'huge',(P,g)=>{const cols=['#ffadad','#caffbf','#a0c4ff'];
    P(BP(mk('box',16,.8,8,BEDROOM_WOOD2,0,.4,0),0,'slab'),2);
    for(let f=0;f<3;f++){const y=.8+f*5.4,c=cols[f];
      for(const d of [-1,1]){P(BP(mk('box',7.5,4.8,.6,c,d*3.85,y+2.7,3.7),f,'wall'),3);P(BP(mk('box',7.8,5.4,.6,BEDROOM_WHITE,d*3.95,y+2.7,-3.7),f,'wall'),2);
        P(BP(mk('box',.6,5.4,8,BEDROOM_WHITE,d*7.7,y+2.7,0),f,'wall'),2);P(BP(mk('sph',.9,.9,.6,'#ffca3a',d*3.85,y+2.7,4.1),f,'extra'),1,true);}
      P(BP(mk('box',.6,5.4,7.4,BEDROOM_WHITE,0,y+2.7,0),f,'wall'),2);P(BP(mk('box',15.4,.4,7.4,BEDROOM_WHITE,0,y+.2,0),f,'slab'),2);}
    P(BP(mk('box',16.6,.8,8.6,BEDROOM_WOOD,0,17.4,0),3,'roof'),4);
    P(BP(mk('cyl',2.4,.4,2.4,'#ffca3a',-5,18,0),3,'extra'),1,true);P(BP(mk('cyl',.4,3,.4,'#ffca3a',-5,19.6,0),3,'extra'),1,true);P(BP(mk('cone',3.6,2.4,3.6,'#ff8fab',-5,21.4,0),3,'extra'),2,true);
    P(BP(mk('sph',3,2.4,2.2,'#ffc6ff',3,19.1,0),3,'extra'),2,true);P(BP(mk('cyl',.8,.4,.8,'#ffc6ff',3,18.1,0),3,'extra'),1,true); // a piggy bank
    P(BP(mk('sph',.8,.6,.6,'#ffc6ff',4.6,19.2,0),3,'extra'),1,true);bedroomFace(g,arg);},{building:true}),
  bedroom_shelf:(x,z,arg)=>sized(x,z,BEDROOM_R.shelf,28.5,20,'huge',(P,g)=>{ // bookshelf: the books fly out shelf by shelf
    P(BP(mk('box',18,1,6,BEDROOM_WOOD2,0,.5,0),0,'slab'),2);
    for(let f=0;f<4;f++){const y=1+f*6.8;
      for(const d of [-1,1]){P(BP(mk('box',.8,6.8,6,BEDROOM_WHITE,d*8.6,y+3.4,0),f,'wall'),2);P(BP(mk('box',8.8,6.8,.5,'#ffd6a5',d*4.3,y+3.4,-2.8),f,'wall'),2);}
      P(BP(mk('box',16.4,.6,5.6,BEDROOM_WHITE,0,y+.3,0),f,'slab'),2);
      let bx=-7.4;while(bx<6.8){const w=rand(.9,1.6),h=rand(3.6,5.6);
        if(Math.random()<.18){bx+=w;continue;}
        const b=mk('box',w,h,4.2,pick(BEDROOM_TOY),bx+w/2,y+.6+h/2,.4);if(Math.random()<.15)b.rotation.z=rand(-.25,.25);P(BP(b,f,'extra'),1,true);bx+=w+.1;
        if(f===3||Math.random()<.4)bx+=rand(.5,2);}}
    P(BP(mk('box',18.6,.9,6.4,BEDROOM_WHITE,0,28.4,0),4,'roof'),4);
    P(BP(mk('sph',3,3.4,2.6,BEDROOM_FUR,-4,30.5,0),4,'extra'),2,true);P(BP(mk('sph',2.4,2.2,2,BEDROOM_FUR,-4,33,0),4,'extra'),2,true);
    P(BP(mk('box',3,3,3,'#8ac926',4,30.4,0),4,'extra'),2,true);P(BP(mk('pyr',3,2,3,'#ff595e',4,32.9,0),4,'extra'),1,true);bedroomFace(g,arg);},{building:true}),
  bedroom_bigteddy:(x,z,arg)=>sized(x,z,BEDROOM_R.bigteddy,17,18,'huge',(P,g)=>{const f=pick([BEDROOM_FUR,'#d4a5a5','#e9c46a']),bow=pick(['#ff595e','#1982c4','#6a4c93']);
    P(mk('sph',9,9.6,8,f,0,4.8,0),6);P(mk('sph',5.4,5.4,1.4,BEDROOM_FUR2,0,4.8,3.5),2);
    P(mk('sph',7.2,6.6,6.6,f,0,12.4,0),5,true,3.2);P(mk('sph',3,2.2,2.2,BEDROOM_FUR2,0,11.4,3),2);P(mk('sph',1.1,.8,.6,BEDROOM_INK,0,12,4.1),1);
    for(const d of [-1,1]){P(mk('sph',2.4,2.4,1.2,f,d*2.8,15.4,0),2,true,1.1);P(mk('sph',1.3,1.3,.4,BEDROOM_FUR2,d*2.8,15.4,.55),1);
      P(bedroomRot(mk('sph',2.4,4.4,2.4,f,d*4.6,6.4,1.2),0,0,d*.5),3,true,1.2);P(mk('sph',3,2.6,4,f,d*2.5,1.4,3.2),2,true,1.2);P(mk('sph',1.8,1.8,.4,BEDROOM_FUR2,d*2.5,1.4,5.2),1);
      P(mk('sph',1,1.1,.5,BEDROOM_INK,d*1.5,13.2,2.9),1);P(mk('sph',.35,.35,.2,'#ffffff',d*1.4,13.5,3.1),1);
      P(bedroomRot(mk('cone',1.8,2.6,1.8,bow,d*1.5,9.3,3.2),0,0,d*Math.PI/2),1,true,.8);}
    P(mk('sph',1,1,1,bow,0,9.3,3.5),1,true,.5);P(mk('box',1.6,.4,.3,'#ff8fab',0,10.6,3.8),1);bedroomFace(g,arg);}),
  bedroom_tent:(x,z,arg)=>sized(x,z,BEDROOM_R.tent,17,18,'huge',(P,g)=>{ // a play teepee: cloth rings lean in, the poles poke out the top
    const cols=[pick(['#ff8fab','#a0c4ff','#caffbf']),BEDROOM_WHITE];
    P(BP(mk('cyl',13,.3,13,pick(['#ffd6a5','#fdffb6']),0,.15,0),0,'slab'),3);
    bedroomCone(P,6.6,4.6,0,5,8,0,cols);bedroomCone(P,4.6,2.4,5,10,8,1,cols);bedroomCone(P,2.4,.8,10,14,6,2,cols);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3,m=mk('cyl',.3,5,.3,BEDROOM_WOOD,Math.sin(a)*.7,15.2,Math.cos(a)*.7);m.rotation.order='YXZ';m.rotation.set(.25,a,0);P(BP(m,3,'roof'),1,true);}
    P(BP(mk('box',3.2,5,.3,BEDROOM_INK,0,2.5,6.3),0,'extra'),1,true);P(BP(mk('pyr',3,1.8,.4,'#ffca3a',0,6.5,5.6),1,'extra'),1,true);
    for(let i=0;i<6;i++){const a=(i+.5)/6*Math.PI*2;P(BP(mk('pyr',1,1.2,.2,BEDROOM_TOY[i],Math.sin(a)*4.4,7.2,Math.cos(a)*4.4),1,'extra'),1,true);}
    P(BP(mk('box',4,.25,2.6,'#ffca3a',0,16.9,.6),3,'extra'),1,true);bedroomFace(g,arg);},{building:true}),
  bedroom_door:(x,z)=>sized(x,z,BEDROOM_R.door,34,60,'huge',(P,g)=>{ // the bedroom door (on the back wall): smash it to BREAK OUT
    const zz=-BEDROOM_HALF-z+.7,c='#fff3e0',inset='#ffd6a5'; // local z of the door, flush with the wall behind it
    for(let r=0;r<3;r++)for(let k=0;k<2;k++)P(mk('box',8.6,10.6,1.2,c,(k-.5)*8.6,1.2+r*10.6+5.3,zz),3);
    for(const [a,y] of [[-4.3,8],[4.3,8],[-4.3,25],[4.3,25]])P(mk('box',6,y<10?10:12,.4,inset,a,y+(y<10?0:-1),zz+.7),2,true,1);
    for(const d of [-1,1])P(mk('box',1.6,34,2,BEDROOM_WHITE,d*9.4,17,zz),3,true,.8);P(mk('box',20.4,1.6,2,BEDROOM_WHITE,0,34.4,zz),3,true,.8);
    P(mk('sph',1.4,1.4,1.4,'#ffca3a',6.6,15.5,zz+1.2),1,true,.6);P(mk('box',1.4,3.4,.4,'#ffca3a',6.6,14.5,zz+.7),1,true,.6);
    for(const [a,y,col] of [[-5,28,'#ffca3a'],[3.5,22,'#f15bb5'],[-2,19,'#4cc9f0'],[1,30,'#8ac926']])P(bedroomRot(mk('pyr',2.2,2.2,.3,col,a,y,zz+.85),Math.PI/2,0,0),1,true,.6);
    P(mk('cyl',4,4,.3,'#bdb2ff',-4,20,zz+.85),1,true,1);P(mk('cyl',3,3.2,.32,'#fff3e0',-3.1,20.8,zz+.88),1); // a moon door-hanger
    for(let i=0;i<5;i++)P(mk('box',2+(i%2),.3,.3,BEDROOM_TOY[i],-8.4,3+i*3.2,zz+1.2),1,true,.4); // the height chart on the frame
  },{breakout:true}),
  /* ---- mega set pieces (for anyone who stays in) ---- */
  bedroom_bunkbed:(x,z,arg)=>sized(x,z,BEDROOM_R.bunkbed,28,60,'mega',(P,g)=>{ // bunk bed with a ladder and a slide
    const wood=BEDROOM_WHITE,top=pick(['#a0c4ff','#caffbf']),low=pick(['#ffadad','#ffd6a5']);
    for(let f=0;f<2;f++){const y=f*12,H=12;
      for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(BP(mk('box',1.6,H,1.6,wood,a*13.4,y+H/2,b*6.4),f,'wall'),2);
      for(const a of [-1,1])for(const b of [-1,1])P(BP(mk('box',.8,f?3.4:4.2,6,BEDROOM_WOOD,a*13.4,y+(f?6:5),b*3.2),f,'wall'),2);
      for(const k of [-1,1])P(BP(mk('box',12.6,1,.6,wood,k*6.6,y+(f?10.5:2),-6.4),f,'wall'),2);
      for(const k of [-1,1])P(BP(mk('box',12.6,1,.6,wood,k*6.6,y+(f?10.5:2),6.4),f,'wall'),2);
      P(BP(mk('box',27,.8,13,BEDROOM_WOOD2,0,y+(f?.4:1.6),0),f,'slab'),3);
      P(BP(mk('box',25.8,2.4,12,BEDROOM_WHITE,0,y+(f?2:3.2),0),f,'extra'),3,true);P(BP(mk('box',18,.8,12.2,f?top:low,3.6,y+(f?3.5:4.7),0),f,'extra'),3,true);
      P(BP(mk('box',5,1.8,8,'#ffffff',-10,y+(f?4.1:5.3),0),f,'extra'),2,true);}
    P(BP(mk('sph',2.6,2.8,2.2,BEDROOM_FUR,-8,19,1.5),1,'extra'),2,true);P(BP(mk('sph',2.2,2,1.8,'#ffc6ff',-8,8,2.6),0,'extra'),2,true);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(BP(mk('sph',1.9,1.9,1.9,'#ffca3a',a*13.4,24.8,b*6.4),2,'roof'),1,true);
    for(const d of [-1,1])P(BP(mk('box',.6,16,.6,BEDROOM_WOOD,10.4+d*1.8,8,7.8),0,'extra'),1,true);
    for(let i=0;i<4;i++)P(BP(mk('box',4.2,.5,.6,BEDROOM_TOY[i],10.4,2.6+i*3.4,7.8),0,'extra'),1,true);
    P(BP(bedroomRot(mk('box',4.6,.6,20,'#ff595e',-6.6,6.4,13.4),.7,0,0),0,'extra'),4,true);
    for(const d of [-1,1])P(BP(bedroomRot(mk('box',.5,1.4,20,'#ffca3a',-6.6+d*2.4,7,13.4),.7,0,0),0,'extra'),2,true);
    P(BP(mk('box',28,2,.6,pick(BEDROOM_PASTEL),0,22,6.9),1,'extra'),3,true); // a bunting banner on the top guard rail
    bedroomFace(g,arg);},{building:true}),
  bedroom_castle:(x,z,arg)=>sized(x,z,BEDROOM_R.castle,24,60,'mega',(P,g)=>{ // a cardboard-box castle with crayon flags
    const cols=[BEDROOM_BOX,BEDROOM_BOX2];
    bedroomStory(P,22,22,10,0,0,cols,3,1,BEDROOM_BOX2);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){P(BP(mk('cyl',5,14,5,BEDROOM_BOX,a*11,7,b*11),0,'wall'),3);
      P(BP(mk('cone',6,5,6,BEDROOM_TOY[(a+1)+(b+1)/2],a*11,16.5,b*11),1,'extra'),2,true);
      P(BP(mk('box',.2,3,.2,BEDROOM_INK,a*11,20.5,b*11),1,'extra'),1,true);P(BP(mk('box',2,1.2,.15,BEDROOM_TOY[(a+3)+(b+1)],a*11+1,21.3,b*11),1,'extra'),1,true);}
    for(let k=-2;k<=2;k++)P(BP(mk('box',2,1.8,1,BEDROOM_BOX2,k*4,10.9,11),0,'extra'),1,true);
    P(BP(mk('box',6,7,.4,'#5c3d2e',0,3.5,11.3),0,'extra'),2,true);P(BP(mk('cyl',6,.4,6,'#5c3d2e',0,7,11.3),0,'extra'),1,true);
    for(const a of [-1,1])P(BP(mk('box',2.4,3,.3,'#4cc9f0',a*6.5,6,11.3),0,'extra'),1,true);
    bedroomStory(P,12,12,8,10,1,cols,2,.8,BEDROOM_BOX2);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,1],[0,-1],[1,0],[-1,0]])P(BP(mk('box',2.2,1.8,2.2,BEDROOM_BOX2,a*5,19,b*5),2,'roof'),1,true);
    P(BP(mk('box',.3,6,.3,BEDROOM_INK,0,21,0),2,'extra'),1,true);P(BP(mk('box',3.6,2.2,.2,'#ff595e',1.8,23,0),2,'extra'),1,true);
    P(BP(mk('cyl',3,3,.3,'#ffca3a',0,14,6.2),1,'extra'),1,true);P(BP(mk('box',4,1.4,.2,'#f15bb5',0,4,-11.3),0,'extra'),1,true);
    bedroomFace(g,arg);},{building:true}),

  /* ---- Z4 scene props: tea party, toy race, train loop, art corner, dinos, laundry, pillow fort, marble run, snack bowl ---- */
  bedroom_teacup:(x,z)=>sized(x,z,BEDROOM_R.teacup,.42,1,'mini',(P,g)=>{const c=pick(BEDROOM_PASTEL);
    P(mk('cyl',.66,.05,.66,BEDROOM_WHITE,0,.025,0),1,true,.2);P(mk('cyl',.42,.3,.42,c,0,.2,0),1,true,.16);P(mk('cyl',.36,.03,.36,'#c98b55',0,.355,0),1);
    P(bedroomRot(bedroomMk('hook',.22,.22,.3,c,.22,.22,0),0,0,-Math.PI/2),1);bedroomSpinY(g);}),
  bedroom_teapot:(x,z,arg)=>sized(x,z,BEDROOM_R.teapot,1.1,2,'tiny',(P,g)=>{const c=pick(['#ffc6ff','#9bf6ff','#caffbf','#ffd6a5']);
    P(mk('sph',1,.8,1,c,0,.42,0),2,true,.35);P(mk('cyl',.5,.1,.5,BEDROOM_WHITE,0,.84,0),1,true,.15);P(mk('sph',.18,.18,.18,'#ff8fab',0,.95,0),1);
    P(bedroomRot(mk('cyl',.14,.6,.14,c,0,.6,.55),.9,0,0),1,true,.12);P(bedroomRot(bedroomMk('hook',.5,.5,.4,c,0,.45,-.45),0,-Math.PI/2,Math.PI/2),1);
    for(const d of [-1,1])P(mk('sph',.14,.14,.06,'#ff8fab',d*.22,.5,.49),1);bedroomFace(g,arg);}),
  bedroom_flag:(x,z,arg)=>sized(x,z,BEDROOM_R.flag,2.5,2,'tiny',(P,g)=>{ // a checkered race flag
    P(mk('cyl',.7,.14,.7,BEDROOM_INK,0,.07,0),1);P(mk('cyl',.09,2.4,.09,BEDROOM_WHITE,0,1.2,0),1,true,.2);
    for(let i=0;i<4;i++)for(let j=0;j<3;j++)P(mk('box',.26,.26,.04,(i+j)%2?BEDROOM_INK:'#ffffff',.18+i*.26,1.78+j*.26,0),1,true,.08);
    P(mk('sph',.16,.16,.16,'#ffca3a',0,2.45,0),1);bedroomFace(g,arg);}),
  bedroom_bowl:(x,z,arg)=>sized(x,z,BEDROOM_R.bowl,2.8,3,'small',(P,g)=>{const c=pick(['#4cc9f0','#ff8fab','#ffca3a','#8ac926']); // a tipped-over cereal bowl, mouth +Z
    P(bedroomRot(mk('cyl',2.4,1.3,2.4,c,0,1.4,-.2),1.15,0,0),3);P(bedroomRot(mk('cyl',2.1,.06,2.1,'#fff8ec',0,1.68,.41),1.15,0,0),1,true,.4);
    for(const [a,b,col] of [[-.5,1.3,'#ffca3a'],[.4,1.6,'#ff595e'],[.1,1,'#8ac926']])P(bedroomRot(bedroomMk('ring',.36,.36,.5,col,a,b,.7),.4,0,0),1,true,.16);
    P(mk('box',.26,.1,1.9,'#adb5bd',1.8,.06,.7),1,true,.3);P(mk('sph',.6,.16,.8,'#adb5bd',1.8,.09,1.85),1,true,.2); // the spoon
    bedroomFace(g,arg);}),
  bedroom_teatable:(x,z)=>sized(x,z,BEDROOM_R.teatable,2.1,3,'small',(P,g)=>{const c=pick(['#ffadad','#bdb2ff','#9bf6ff']);
    P(mk('cyl',1.6,.16,1.6,BEDROOM_WHITE,0,.08,0),1);P(mk('cyl',.4,1.1,.4,BEDROOM_WHITE,0,.65,0),2);
    P(mk('cyl',3.3,.5,3.3,c,0,1.15,0),3,true,.8); // the tablecloth
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4,cx=Math.sin(a)*1.05,cz=Math.cos(a)*1.05;
      P(mk('cyl',.5,.04,.5,BEDROOM_WHITE,cx,1.42,cz),1,true,.12);P(mk('cyl',.32,.26,.32,BEDROOM_PASTEL[(i*2+1)%8],cx,1.57,cz),1,true,.1);}
    P(mk('cyl',.9,.5,.9,'#ffd6a5',0,1.65,0),1,true,.3);P(mk('cyl',.92,.12,.92,'#ff8fab',0,1.94,0),1,true,.3);P(mk('sph',.22,.22,.22,'#e63946',0,2.1,0),1,true,.1);
    bedroomSpinY(g);}),
  bedroom_stand:(x,z,arg)=>sized(x,z,BEDROOM_R.stand,3.4,6,'small',(P,g)=>{ // a toy-block grandstand with plush fans cheering, front +Z
    for(let f=0;f<3;f++)for(let row=f;row<3;row++)for(let k=-1;k<=1;k++)
      P(BP(mk('box',1.6,1,1.1,BEDROOM_TOY[(row*3+k+f+8)%8],k*1.65,f+.5,1.2-row*1.15),f,'wall'),2);
    for(let row=0;row<3;row++)for(const k of row===1?[-1,1]:[0]){const fy=row+1,fz=1.2-row*1.15,fx=k*1.65,fc=pick([BEDROOM_FUR,'#ffc6ff','#caffbf','#ffffff','#e9c46a']);
      P(BP(mk('sph',.6,.6,.5,fc,fx,fy+.3,fz),row+1,'extra'),1,true);P(BP(mk('sph',.5,.5,.45,fc,fx,fy+.8,fz),row+1,'extra'),1,true);
      for(const d of [-1,1])P(BP(bedroomRot(mk('sph',.16,.45,.16,fc,fx+d*.33,fy+.95,fz),0,0,-d*.4),row+1,'extra'),1,true);} // arms up: hooray!
    P(BP(mk('box',.08,1.6,.08,BEDROOM_INK,1.65,3.8,-1.1),3,'roof'),1,true);P(BP(mk('pyr',.8,.5,.06,'#ff595e',1.95,4.3,-1.1),3,'roof'),1,true);
    bedroomFace(g,arg);},{building:true}),
  bedroom_rail:(x,z)=>sized(x,z,BEDROOM_R.rail,.45,1,'small',(P,g)=>{ // one piece of wooden train track along +Z (scenes turn it)
    P(mk('box',1.9,.3,4.1,'#e0b07a',0,.15,0),2,true,.5);for(const d of [-1,1])P(mk('box',.22,.06,4.1,BEDROOM_WOOD2,d*.5,.31,0),1);
    P(mk('cyl',.5,.3,.5,'#e0b07a',0,.15,2.15),1);}),
  bedroom_tunnel:(x,z)=>sized(x,z,BEDROOM_R.tunnel,5,5,'medium',(P,g)=>{const gr=pick(['#8ac926','#52b788']); // a toy mountain the track runs through (along Z)
    for(const d of [-1,1])P(mk('box',1,2.6,3.4,gr,d*1.75,1.3,0),2);
    P(mk('box',4.6,1,3.4,gr,0,3.05,0),3,true,.9);P(mk('pyr',4.2,1.4,3.2,'#6c757d',0,4.25,0),2,true,.8);P(mk('pyr',1.6,.6,1.3,BEDROOM_WHITE,0,4.75,0),1,true,.3);
    for(const d of [-1,1])P(bedroomMk('hook',2.6,2.6,.5,'#ffca3a',0,1.4,d*1.72),1);}),
  bedroom_basket:(x,z,arg)=>sized(x,z,BEDROOM_R.basket,7,10,'large',(P,g)=>{ // the laundry basket, clothes heaped over the rim
    P(BP(mk('cyl',7,.4,7,BEDROOM_WOOD2,0,.2,0),0,'slab'),2);bedroomCone(P,3.5,3.9,0,5.6,10,0,['#e9c46a','#d4a373']);
    for(const d of [-1,1])P(BP(mk('box',.6,.9,1.8,BEDROOM_WOOD2,d*3.95,4.8,0),0,'extra'),1,true);
    P(BP(mk('sph',6.6,2.4,6.6,pick(BEDROOM_PASTEL),0,5.5,0),1,'roof'),4,true,1.6);
    P(BP(bedroomRot(mk('box',3.2,.5,2.6,pick(BEDROOM_TOY),1.2,6.2,2.6),.5,.3,0),1,'extra'),2,true); // a t-shirt flopped over the front
    for(const [a,b,y,rz] of [[-2.2,3.6,5,.6],[2.8,-1.2,6.6,-.3],[-1,-1.6,6.9,.2],[3.9,2,3.2,1.3]])
      P(BP(bedroomRot(mk('box',.7,.4,2.2,pick(BEDROOM_TOY),a,y,b),.3,rz,rz*.5),1,'extra'),1,true);
    bedroomFace(g,arg);},{building:true}),
  bedroom_sockpile:(x,z)=>sized(x,z,BEDROOM_R.sockpile,2.6,5,'medium',(P,g)=>{ // a heap of socks
    P(mk('sph',4.4,2.2,4,pick(BEDROOM_PASTEL),0,.7,0),4);
    for(let i=0;i<9;i++){const a=i*2.4,d=i<6?1.4:.5,m=mk('box',.7,.45,1.9,BEDROOM_TOY[i%8],Math.sin(a)*d,i<6?1.3:2,Math.cos(a)*d);m.rotation.set(rand(-.3,.3),a+1,rand(-.4,.4));P(m,1,true,.3);}
    for(const [a,b] of [[1.2,.6],[-1,-.8]])P(mk('box',.74,.5,.5,BEDROOM_WHITE,a,1.9,b),1,true,.2);bedroomSpinY(g);}),
  bedroom_crayonbox:(x,z,arg)=>sized(x,z,BEDROOM_R.crayonbox,2.4,3,'small',(P,g)=>{
    P(mk('box',2,1.6,1,'#ffca3a',0,.8,0),3);P(mk('box',2.04,.4,1.04,'#2a9d8f',0,.6,0),1);P(mk('sph',.7,.5,.1,'#ff595e',0,1.15,.52),1);
    for(let i=0;i<6;i++){const c=BEDROOM_TOY[i],x0=-.8+i*.32,h=.6+((i*37)%5)*.08,z0=(i%2-.5)*.3;
      P(mk('cyl',.26,h,.26,c,x0,1.5+h/2,z0),1,true,.12);P(mk('cone',.26,.24,.26,c,x0,1.62+h,z0),1,true,.08);}
    bedroomFace(g,arg);}),
  bedroom_easel:(x,z,arg)=>sized(x,z,BEDROOM_R.easel,6,5,'medium',(P,g)=>{ // an easel with a crayon drawing: a house, the sun, grass
    for(const d of [-1,1])P(bedroomRot(mk('box',.3,5.8,.3,BEDROOM_WOOD,d*1.4,2.8,.3),.12,0,-d*.15),2,true,.4);
    P(bedroomRot(mk('box',.3,5.6,.3,BEDROOM_WOOD,0,2.7,-1),-.3,0,0),1,true,.4);P(mk('box',3.6,.25,.6,BEDROOM_WOOD2,0,1.6,.55),1,true,.4);
    P(mk('box',3.4,2.8,.12,'#ffffff',0,3.4,.45),2,true,.8);
    P(mk('box',3.4,.5,.04,'#8ac926',0,2.25,.52),1);P(mk('box',1.1,.9,.04,'#ff595e',-.6,2.95,.53),1);P(mk('pyr',1.4,.7,.04,'#6a4c93',-.6,3.75,.53),1);
    P(mk('sph',.7,.7,.04,'#ffca3a',1,4.3,.53),1);for(let i=0;i<3;i++)P(mk('box',.3,.18,.18,BEDROOM_TOY[i+2],-1+i*.6,1.82,.55),1,true,.1);
    bedroomFace(g,arg);}),
  bedroom_dino:(x,z,arg)=>sized(x,z,BEDROOM_R.dino,2.4,3,'small',(P,g)=>{ // a goofy plastic toy dino, big grin, looking +Z
    const c=pick(['#8ac926','#4cc9f0','#ff924c','#bdb2ff','#f15bb5']),sp=pick(['#ffca3a','#ff595e','#6a4c93']);
    P(mk('sph',1.3,1.2,2,c,0,1,0),3);P(mk('sph',1,.9,1.2,c,0,1.9,1.1),2,true,.4);P(mk('sph',.8,.3,.7,'#ffffff',0,1.66,1.42),1);
    bedroomFace2(P,0,2.02,1.62,.8);P(bedroomRot(mk('cone',.8,1.8,.8,c,0,.85,-1.5),-Math.PI/2+.25,0,0),1,true,.35);
    for(const [a,b] of [[-1,1],[1,1],[-1,-1],[1,-1]])P(mk('cyl',.36,.6,.36,c,a*.42,.3,b*.5),1,true,.15);
    for(let i=0;i<4;i++)P(mk('pyr',.36,.42,.36,sp,0,1.68-i*.08,.4-i*.45),1);bedroomFace(g,arg);}),
  bedroom_pillow:(x,z)=>sized(x,z,BEDROOM_R.pillow,1.8,4,'medium',(P,g)=>{const c=pick(BEDROOM_PASTEL);
    P(mk('sph',4,1.6,2.8,c,0,.8,0),3,true,.9);P(mk('box',3.4,.06,.5,'#ffffff',0,1.58,0),1);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(mk('sph',.5,.4,.5,c,a*1.7,.5,b*1.1),1);bedroomSpinY(g);}),
  bedroom_fort:(x,z,arg)=>sized(x,z,BEDROOM_R.fort,9,12,'large',(P,g)=>{ // pillow walls, a blanket roof, a flag on a pencil; the way in is +Z
    let i=0;const pw=(x,y,z,ry)=>P(BP(bedroomRot(mk('sph',4.2,2.4,2,BEDROOM_PASTEL[i++%8],x,y,z),0,ry,0),0,'wall'),2);
    for(const y of [1.2,3.3]){for(const a of [-3.8,0,3.8])pw(a,y,-4.2,0);for(const d of [-1,1])for(const b of [-1.8,2])pw(d*5.4,y,b,Math.PI/2);}
    const bc=pick(['#a0c4ff','#ffadad','#caffbf']);
    P(BP(mk('box',13,.4,10.6,bc,0,4.9,-.6),1,'roof'),5,true,1.6);
    for(const d of [-1,1])P(BP(bedroomRot(mk('box',4,3,.3,bc,d*4.5,3.6,4.8),-.2,0,0),1,'extra'),2,true); // the blanket hangs down by the door
    P(BP(mk('cyl',.4,4.4,.4,'#ffca3a',3.6,7.3,-2.5),1,'extra'),1,true);P(BP(mk('cone',.4,.6,.4,'#f2d3ab',3.6,9.8,-2.5),1,'extra'),1,true);
    P(BP(mk('box',2.2,1.4,.12,'#ff595e',4.7,8.6,-2.5),1,'extra'),1,true);
    P(BP(mk('cyl',.9,1.6,.9,'#495057',-1.5,.8,1),0,'extra'),1,true);P(BP(mk('cyl',.95,.1,.95,'#fff3b0',-1.5,1.62,1),0,'extra'),1,true); // a flashlight
    bedroomFace(g,arg);},{building:true}),
  bedroom_marblerun:(x,z,arg)=>sized(x,z,BEDROOM_R.marblerun,8,8,'medium',(P,g)=>{ // two block towers, zig-zag chutes, marbles on the way down
    P(BP(mk('box',5.4,.4,2.4,BEDROOM_WHITE,0,.2,0),0,'slab'),2);
    for(let f=0;f<3;f++)for(const d of [-1,1])P(BP(mk('box',.9,2,.9,BEDROOM_TOY[(f*2+(d>0?1:0))%8],d*2,1.4+f*2,-.5),f,'wall'),2);
    for(let k=0;k<4;k++){const y=1.3+k*1.45,t=k%2?.22:-.22,f=[0,0,1,2][k];
      P(BP(bedroomRot(mk('box',3.6,.2,.9,BEDROOM_PASTEL[k*2%8],0,y,.4),0,0,t),f,'extra'),1,true);
      P(BP(bedroomRot(mk('box',3.6,.35,.1,'#4cc9f0',0,y+.15,.85),0,0,t),f,'extra'),1,true);
      P(BP(mk('sph',.45,.45,.45,pick(['#f15bb5','#ffca3a','#8ac926','#9bf6ff']),(k%2?1:-1)*.8,y+.38,.4),f,'extra'),1,true);}
    P(BP(bedroomRot(mk('cone',2,1.4,2,'#ff595e',-2,7.1,-.5),Math.PI,0,0),3,'roof'),2,true);P(BP(mk('box',1.4,.3,1.4,'#ffca3a',2,6.55,-.5),3,'roof'),1,true);
    bedroomFace(g,arg);},{building:true}),
};
// each prop's crash sound (L22): squeaky plush, clattery blocks, crunchy snacks, wooden furniture thuds
const BEDROOM_SFX={
  bedroom_crumb:'bedroom_crunch',bedroom_cereal:'bedroom_crunch',bedroom_gummy:'bedroom_squish',
  bedroom_brick:'bedroom_clatter',bedroom_bricks:'bedroom_clatter',bedroom_block:'bedroom_clatter',bedroom_dice:'bedroom_clatter',bedroom_tower:'bedroom_clatter',bedroom_castle:'bedroom_cardboard',
  bedroom_crayon:'bedroom_snap',bedroom_marble:'bedroom_clink',
  bedroom_duck:'bedroom_squeak',bedroom_teddy:'bedroom_plush',bedroom_bunny:'bedroom_plush',bedroom_bigteddy:'bedroom_plush',bedroom_sock:'bedroom_plush',bedroom_beanbag:'bedroom_plush',bedroom_tent:'bedroom_plush',
  bedroom_toycar:'bedroom_toy',bedroom_robot:'bedroom_toy',bedroom_truck:'bedroom_toy',bedroom_train:'bedroom_toy',bedroom_cup:'bedroom_toy',bedroom_ball:'bedroom_boing',bedroom_drum:'bedroom_drum',
  bedroom_books:'bedroom_wood',bedroom_chest:'bedroom_wood',bedroom_dollhouse:'bedroom_wood',bedroom_lamp:'bedroom_wood',bedroom_chair:'bedroom_wood',bedroom_desk:'bedroom_wood',
  bedroom_horse:'bedroom_wood',bedroom_dresser:'bedroom_wood',bedroom_shelf:'bedroom_wood',bedroom_bunkbed:'bedroom_wood',bedroom_door:'bedroom_door',
  bedroom_teacup:'bedroom_clink',bedroom_teapot:'bedroom_clink',bedroom_teatable:'bedroom_wood',bedroom_bowl:'bedroom_toy',bedroom_flag:'bedroom_toy',
  bedroom_stand:'bedroom_clatter',bedroom_marblerun:'bedroom_clatter',bedroom_rail:'bedroom_wood',bedroom_tunnel:'bedroom_wood',bedroom_easel:'bedroom_wood',
  bedroom_basket:'bedroom_wood',bedroom_crayonbox:'bedroom_cardboard',bedroom_dino:'bedroom_toy',
  bedroom_sockpile:'bedroom_plush',bedroom_pillow:'bedroom_plush',bedroom_fort:'bedroom_plush'
};
for(const k in BEDROOM_SFX){const f=BEDROOM_PROPS[k];BEDROOM_PROPS[k]=(x,z,arg)=>{const o=f(x,z,arg);o.sfx=BEDROOM_SFX[k];return o;};}

/* ---------- the room shell: wood floor, wallpaper, a play-mat road rug, a window, posters and an outlet ---------- */
// canvas textures (made once): drawn at a few hundred pixels, so each costs one tiny upload
function bedroomTex(w,h,draw,rx=1,ry=1){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return t;}
function bedroomBlob(cx,x,y,r,col){cx.fillStyle=col;cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);cx.fill();}
function bedroomStar(cx,x,y,r,col){cx.fillStyle=col;cx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,q=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}cx.fill();}
let BEDROOM_MATS=null;
function bedroomMats(){if(BEDROOM_MATS)return BEDROOM_MATS;
  const planks=bedroomTex(256,256,(cx,w,h)=>{const cols=['#d9a66b','#cf9a5e','#e0b07a','#d49f63'];
    for(let i=0;i<4;i++){cx.fillStyle=cols[i];cx.fillRect(0,i*64,w,64);cx.fillStyle='rgba(90,50,20,.35)';cx.fillRect(0,i*64,w,3);
      const cut=(i*97)%256;cx.fillRect(cut,i*64,3,64);cx.fillStyle='rgba(120,70,30,.12)';for(let k=0;k<5;k++)cx.fillRect(0,i*64+12+k*10,w,2);}},16,16);
  const paper=bedroomTex(128,128,(cx,w,h)=>{cx.fillStyle='#cfe6ff';cx.fillRect(0,0,w,h);
    bedroomBlob(cx,30,34,13,'#ffffff');bedroomBlob(cx,44,30,16,'#ffffff');bedroomBlob(cx,58,36,11,'#ffffff');
    bedroomStar(cx,96,86,10,'#ffe066');bedroomStar(cx,26,100,6,'#ffffff');bedroomStar(cx,104,20,5,'#ffe066');},12,3.2);
  const rug=bedroomTex(640,448,(cx,w,h)=>{ // play-mat town: roads, a pond, houses, trees (no words)
    cx.fillStyle='#7fcf6a';cx.fillRect(0,0,w,h);cx.fillStyle='#5bb04a';cx.fillRect(0,0,w,14);cx.fillRect(0,h-14,w,14);cx.fillRect(0,0,14,h);cx.fillRect(w-14,0,14,h);
    bedroomBlob(cx,500,320,70,'#4cc9f0');bedroomBlob(cx,450,345,45,'#4cc9f0');
    cx.fillStyle='#6c757d';cx.lineJoin='round';cx.strokeStyle='#6c757d';cx.lineWidth=46;cx.beginPath();cx.roundRect?cx.roundRect(70,70,w-140,h-140,60):cx.rect(70,70,w-140,h-140);cx.stroke();
    cx.beginPath();cx.moveTo(w*.42,70);cx.lineTo(w*.42,h-70);cx.stroke();
    cx.strokeStyle='#ffffff';cx.lineWidth=4;cx.setLineDash([16,14]);cx.beginPath();cx.roundRect?cx.roundRect(70,70,w-140,h-140,60):cx.rect(70,70,w-140,h-140);cx.stroke();
    cx.beginPath();cx.moveTo(w*.42,70);cx.lineTo(w*.42,h-70);cx.stroke();cx.setLineDash([]);
    for(const [x,y,c] of [[130,140,'#ff595e'],[190,150,'#ffca3a'],[130,260,'#1982c4'],[370,130,'#f15bb5'],[440,140,'#8ac926'],[190,270,'#ff924c']]){
      cx.fillStyle=c;cx.fillRect(x,y,44,40);cx.fillStyle='#6a4c93';cx.beginPath();cx.moveTo(x-6,y);cx.lineTo(x+22,y-24);cx.lineTo(x+50,y);cx.fill();}
    for(const [x,y] of [[360,250],[400,280],[560,110],[24+40,410]])bedroomBlob(cx,x,y,18,'#2d6a4f');
    cx.fillStyle='#ffffff';for(let i=0;i<5;i++)cx.fillRect(w*.42-23+i*10,h*.5-6,6,12);},1,1);
  const round=bedroomTex(256,256,(cx,w,h)=>{const cols=['#ffc6ff','#ffffff','#bdb2ff','#ffffff','#ffadad','#ffffff','#fdffb6'];
    for(let i=0;i<cols.length;i++){bedroomBlob(cx,128,128,128-i*18,cols[i]);}});
  const sky=bedroomTex(256,256,(cx,w,h)=>{const gr=cx.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#5ec8ff');gr.addColorStop(.7,'#c8f0ff');cx.fillStyle=gr;cx.fillRect(0,0,w,h);
    bedroomBlob(cx,200,50,26,'#ffe066');bedroomBlob(cx,60,70,18,'#ffffff');bedroomBlob(cx,82,64,22,'#ffffff');bedroomBlob(cx,104,72,15,'#ffffff');
    cx.fillStyle='#7ccf5a';cx.fillRect(0,h*.72,w,h*.28);bedroomBlob(cx,70,h*.66,30,'#40916c');cx.fillStyle='#8d5524';cx.fillRect(64,h*.7,12,26);
    cx.fillStyle='#ffffff';for(let x=110;x<w;x+=22)cx.fillRect(x,h*.68,8,30);cx.fillRect(110,h*.72,w,6);});
  const poster=bedroomTex(160,208,(cx,w,h)=>{cx.fillStyle='#1d3557';cx.fillRect(0,0,w,h);for(let i=0;i<14;i++)bedroomStar(cx,(i*53)%w,(i*71)%h,3+i%3,'#ffffff');
    cx.fillStyle='#e63946';cx.beginPath();cx.moveTo(80,30);cx.quadraticCurveTo(112,80,104,140);cx.lineTo(56,140);cx.quadraticCurveTo(48,80,80,30);cx.fill();
    bedroomBlob(cx,80,88,14,'#a8dadc');cx.fillStyle='#ffca3a';cx.beginPath();cx.moveTo(56,140);cx.lineTo(36,170);cx.lineTo(60,160);cx.fill();cx.beginPath();cx.moveTo(104,140);cx.lineTo(124,170);cx.lineTo(100,160);cx.fill();
    cx.fillStyle='#ff924c';cx.beginPath();cx.moveTo(64,142);cx.lineTo(80,196);cx.lineTo(96,142);cx.fill();});
  const rainbow=bedroomTex(208,160,(cx,w,h)=>{cx.fillStyle='#fff8e7';cx.fillRect(0,0,w,h);
    ['#ff595e','#ff924c','#ffca3a','#8ac926','#1982c4','#6a4c93'].forEach((c,i)=>{cx.strokeStyle=c;cx.lineWidth=11;cx.beginPath();cx.arc(104,140,86-i*11,Math.PI,0);cx.stroke();});
    bedroomBlob(cx,30,138,16,'#ffffff');bedroomBlob(cx,48,134,14,'#ffffff');bedroomBlob(cx,160,138,16,'#ffffff');bedroomBlob(cx,178,134,14,'#ffffff');
    cx.strokeStyle='#dddddd';cx.lineWidth=2;cx.strokeRect(2,2,w-4,h-4);});
  const lit=o=>litMat(Object.assign({roughness:.9},o));
  return BEDROOM_MATS={floor:lit({map:planks}),wall:lit({map:paper}),rug:lit({map:rug}),round:lit({map:round}),sky:litMat({map:sky,emissive:'#ffffff',emissiveMap:sky,emissiveIntensity:.45}),
    poster:lit({map:poster}),rainbow:lit({map:rainbow})};}
function bedroomRoom(h){const H=BEDROOM_WALLH,W=h*2+8,g=new THREE.Group(),Mt=bedroomMats();
  const add=(m,shadow)=>{m.castShadow=!!shadow;m.receiveShadow=true;g.add(m);return m;};
  const flat=(sx,sy,sz,mat,x,y,z)=>add(mk('box',sx,sy,sz,null,x,y,z,mat));
  flat(W,1,W,Mt.floor,0,-.49,0);
  flat(64,.12,44,Mt.rug,-2,.06,8);                        // the play-mat road rug (the start drives onto it)
  add(mk('cyl',28,.14,28,null,-54,.07,30,Mt.round));        // a round fluffy rug by the beanbag
  flat(W,H,4,Mt.wall,0,H/2,-h-2);flat(4,H,W,Mt.wall,-h-2,H/2,0);flat(4,H,W,Mt.wall,h+2,H/2,0);
  const trim=BEDROOM_WHITE,mint='#b8e8d2';
  for(const [sx,sz,x,z] of [[W-8,1.2,0,-h-.4],[1.2,W-8,-h-.4,0],[1.2,W-8,h+.4,0]]){ // painted lower wall + chair rail + baseboard
    add(mk('box',sx,12,sz,mint,x,6,z));add(mk('box',sx+(sz>1?0:.4),1,sz+(sx>1?0:.4)+.4,trim,x,12.3,z));add(mk('box',sx,2.4,sz+.6,trim,x,1.2,z));}
  add(mk('box',W,3,4,trim,0,1.5,h+2));                       // the wall toward the camera is only a baseboard (dollhouse view)
  // the "outside" behind the door: you see it once the door is smashed
  flat(18,33,.4,Mt.sky,8,17,-h+.15);
  // window with curtains (left of the door)
  const wx=-24,wy=27;flat(26,17,.3,Mt.sky,wx,wy,-h+.2);
  for(const [sx,sy,x,y] of [[28,1.4,wx,wy+9],[28,1.4,wx,wy-9],[1.4,19,wx-13.3,wy],[1.4,19,wx+13.3,wy],[1,17,wx,wy],[26,1,wx,wy]])add(mk('box',sx,sy,1.2,trim,x,y,-h+.6));
  add(mk('box',30,1,3,trim,wx,wy-9.8,-h+1.4));
  for(const d of [-1,1]){add(mk('box',6,23,1.2,'#ff8fab',wx+d*16,wy-1.5,-h+1.6));add(mk('box',6.6,1.2,1.6,'#ffca3a',wx+d*16,wy-4,-h+1.8));}
  add(mk('box',36,3,2.2,'#ff8fab',wx,wy+11.5,-h+1.6));
  // posters, a light switch, an outlet down at micro-car height, a wall shelf of plushies
  flat(12,15.5,.3,Mt.poster,34,26,-h+.2);add(mk('box',13,16.5,.2,trim,34,26,-h+.08));
  flat(.3,12,15.6,Mt.rainbow,-h+.2,28,6);
  add(mk('box',2.2,3.6,.4,trim,21,20,-h+.25));add(mk('box',.6,1.2,.5,trim,21,20.2,-h+.5));
  add(mk('box',2.4,3.4,.4,trim,-8,4.6,-h+.25));for(const y of [3.8,5.4])for(const d of [-1,1])add(mk('box',.18,.6,.45,BEDROOM_INK,-8+d*.4,y,-h+.3));
  add(mk('box',.5,1.6,1.2,'#ffe066',-h+.3,3.2,-20)); // a star night-light on the left wall
  add(mk('box',1.2,1,20,trim,h-.6,30,40));for(const [z,c] of [[33,BEDROOM_FUR],[40,'#ffc6ff'],[47,'#8ac926']])add(mk('sph',2.6,3.2,2.6,c,h-2,32,z),true);
  return g;}

/* ---------- scenes (Z4, L31 contract): little set-ups that tell a story. Local coords, +Z is the front.
   Positions never use rand (a scene that crosses a chunk line is built once per chunk and must come out the same). ---------- */
const BEDROOM_SCENES={
  // a tipped-over cereal bowl and its spill, right in front of the start (micro: the first things you smash)
  snack_spill:{size:'micro',r:7,sizes:['micro','mini','tiny'],build(s){
    s.spot('milk',.5,-1.5,7.5,4.5,.35);s.place('bedroom_bowl',5,-3,3);
    const T=['bedroom_cereal','bedroom_cereal','bedroom_crumb','bedroom_cereal','bedroom_gummy'];
    for(let i=0;i<34;i++){const t=bedroomH(i,1),j=.4+t*1.6;s.place(T[i%5],3.2-t*9+(bedroomH(i,2)-.5)*j*2,-2.6+t*5.5+(bedroomH(i,3)-.5)*j*2);}}},
  // a little building-brick wall around a half-built stack, more bricks trailing off
  brick_build:{size:'micro',r:6,sizes:['micro','mini','tiny'],build(s){
    for(let i=0;i<5;i++)for(const [a,b] of [[i,0],[5,i],[5-i,5],[0,5-i]])s.place('bedroom_brick',-1.75+a*.7,-1.75+b*.7);
    s.place('bedroom_bricks',0,0);s.place('bedroom_dice',.9,-.7);
    for(const [x,z] of [[-3.6,1.2],[-3.4,2.5],[-4.6,1.8]])s.place('bedroom_bricks',x,z);
    for(let i=0;i<6;i++)s.place('bedroom_brick',2.7+i*.6,2.4+bedroomH(i,4)*.9);}},
  // crayon art corner: a big sheet of paper with scribbles, crayons everywhere, the crayon box and an easel
  crayon_art:{size:'mini',r:8,sizes:['mini','tiny','small'],build(s){
    s.spot('paper',0,0,12,9,.12);
    for(const [k,x,z,w,d,t] of [['crayon_g',0,3.2,10,.6,.12],['crayon_y',3.4,-2.4,1.6,1.6,.6],['crayon_r',-2.2,-.8,2.6,.45,.5],
      ['crayon_b',1.2,1,3.2,.45,-.35],['crayon_p',-3.4,1.6,2,.4,1.2],['crayon_r',-.8,1.6,1.4,1.2,.12]])s.spot(k,x,z,w,d,t);
    for(let i=0;i<8;i++)s.place('bedroom_crayon',-4.6+bedroomH(i,5)*9.2,-3.4+bedroomH(i,6)*6.8);
    s.place('bedroom_crayonbox',4.8,-3.3,0,.12);s.place('bedroom_easel',-7.2,-4.6,0,.5);s.place('bedroom_marble',6.4,2.4);}},
  // toy-car race on the play-mat road: 8 cars on a staggered grid, checkered flags, a starter robot, a block grandstand of plush fans, a jump
  toy_race:{size:'tiny',r:14,sizes:['tiny','small'],build(s){
    for(let row=0;row<4;row++)for(const lz of [-2.3,-.1])s.place('bedroom_toycar',6+row*2+(lz>-1?1:0),lz,3);
    s.place('bedroom_flag',4,-4.4,0);s.place('bedroom_flag',4,2.2,0);
    s.place('bedroom_stand',9,6.6,2);s.place('bedroom_robot',4,4.6,2);
    s.place('bedroom_teddy',3,6.8,2,0,.6);s.place('bedroom_teddy',15,6.4,2,0,.6);s.place('bedroom_duck',13,4.4,2);
    s.place('bedroom_block',16,3,0);s.place('bedroom_block',17.2,3.6,0);s.place('bedroom_toycar',-24,-.8,1);
    s.ramp(-17,-1.2,-Math.PI/2,5,3.2,1.1);}},
  // block city: two block skyscrapers, block houses, toy cars on the streets and a rubber-duck mayor in the middle
  block_city:{size:'tiny',r:9,sizes:['tiny','small'],build(s){
    s.place('bedroom_tower',-5,-5);s.place('bedroom_tower',5.2,5);
    for(const [x,z] of [[2.6,-6.4],[4.6,-6.4],[6.6,-6.4],[2.6,-3.6],[6.2,-3.4],[-6.6,2.8],[-4.4,2.8],[-2.4,2.8],[-6.6,5.6],[-4,6.2]])s.place('bedroom_block',x,z);
    for(const [x,z] of [[-2.2,-2.4],[2.4,2.4],[-7,-1.6],[7.4,1.6]])s.place('bedroom_bricks',x,z);
    for(const [x,z,a] of [[-.1,-4.4,0],[.1,5.4,2],[-5.6,-.1,1],[4.4,.1,3]])s.place('bedroom_toycar',x,z,a);
    s.place('bedroom_duck',0,0,0);s.place('bedroom_dice',-1.6,7.4);}},
  // the dino-toy standoff: a line of toy dinos (and their big boss) vs wind-up robots and their dump truck, a ball as the prize
  dino_standoff:{size:'small',r:8,sizes:['tiny','small','medium','large'],build(s){
    for(const z of [-6,-2,2,6])s.place('bedroom_dino',-3,z,1);s.place('bedroom_dino',-6,0,1,0,1.5);
    for(const z of [-5,-1.7,1.7,5])s.place('bedroom_robot',3,z,3);s.place('bedroom_truck',6.2,0,3);
    s.place('bedroom_ball',0,0);}},
  // tea party: a little table with cake and cups, teddies, a bunny and a big duck as guests, the teapot and spilled cups
  tea_party:{size:'small',r:7,sizes:['mini','tiny','small','medium','large','huge'],build(s){
    s.place('bedroom_teatable',0,0);
    s.place('bedroom_teddy',-3.1,0,0,Math.PI/2);s.place('bedroom_teddy',0,-3.1,0,0);s.place('bedroom_bunny',3.2,0,0,-Math.PI/2,.65);s.place('bedroom_duck',2.3,-2.3,0,-Math.PI/4,1.5);
    s.place('bedroom_teapot',2,2.6,0,Math.PI*.8);s.place('bedroom_teacup',-1.6,3);s.place('bedroom_teacup',-2.6,2.2);s.place('bedroom_teacup',.4,3.6);
    s.place('bedroom_cup',-3.4,-3.4);}},
  // pillow fort: the fort, spare pillows, a teddy at the door, a book and a sock
  pillow_fort:{size:'large',r:8.5,sizes:['medium','large','huge'],build(s){
    s.place('bedroom_fort',0,0,0);s.place('bedroom_pillow',-7.6,5.4,0,.4);s.place('bedroom_pillow',7.4,4.8,0,-.3);s.place('bedroom_pillow',7.8,-3,0,1.4);
    s.place('bedroom_teddy',.6,6.8,0);s.place('bedroom_books',-3.4,7.4);s.place('bedroom_sock',3,7.8);}},
  // sock mountain by the laundry basket: two sock heaps, socks everywhere, a teddy napping
  sock_mountain:{size:'medium',r:9,sizes:['small','medium','large'],build(s){
    s.place('bedroom_basket',3.6,-3.6,0);s.place('bedroom_sockpile',-3,1);s.place('bedroom_sockpile',1.4,4.4);
    for(let i=0;i<9;i++){const a=.6+i*.42,d=4.6+bedroomH(i,7)*3;s.place('bedroom_sock',Math.cos(a)*d-1,Math.sin(a)*d+1.5);}
    s.place('bedroom_teddy',-6.4,-3,1);}},
  // train loop: 12 pieces of wooden track in a ring through a toy mountain, the train on it, a little block station inside
  train_loop:{size:'medium',r:11,sizes:['small','medium','large'],build(s){
    for(let i=0;i<12;i++){const a=i*Math.PI/6;s.place('bedroom_rail',Math.sin(a)*8,Math.cos(a)*8,null,a+Math.PI/2);}
    s.place('bedroom_tunnel',-8,0,null,0);s.place('bedroom_train',8,0,0,Math.PI);
    for(const [x,z] of [[-2,-2.4],[.2,-3.4],[2.4,-2.2]])s.place('bedroom_block',x,z);
    s.place('bedroom_robot',3,1.6,0,-Math.PI/2);s.place('bedroom_teddy',-2.4,2.6,0,.6);s.place('bedroom_bricks',0,0);}},
  // marble run with marbles rolled out all over the floor
  marble_run:{size:'medium',r:8,sizes:['small','medium','large'],build(s){
    s.place('bedroom_marblerun',0,-1.5,0);
    for(let i=0;i<10;i++)s.place('bedroom_marble',1.5+bedroomH(i,8)*5.5,1.8+bedroomH(i,9)*4.4);
    s.place('bedroom_dice',-3.6,2.6);s.place('bedroom_dice',-2.4,3.8);s.place('bedroom_bricks',-4.6,-3.4);s.place('bedroom_robot',-5,1,0,.5);}},
  // reading nook: book stacks, a teddy and a little bunny reading, a sippy cup, a book ramp
  reading_nook:{size:'small',r:7,sizes:['small','medium'],build(s){
    s.place('bedroom_books',-3,-2.4);s.place('bedroom_books',-.6,-3.6);s.place('bedroom_books',3.2,-2.6);
    s.place('bedroom_teddy',0,0,0);s.place('bedroom_bunny',-2.6,.6,0,.5,.5);s.place('bedroom_cup',3.2,.8);
    s.ramp(-5.5,4.6,Math.PI/2,5,3,1.2);}},
  // a pile of plushies around a big bunny
  plush_pile:{size:'small',r:6,sizes:['small','medium','large','huge'],build(s){
    s.place('bedroom_bunny',0,-1.2,0);
    for(let i=0;i<5;i++){const a=-1.1+i*.55;s.place('bedroom_teddy',Math.sin(a)*3.4,Math.cos(a)*3.4-.6,0,a);}
    s.place('bedroom_duck',-3.6,-2.6,0,.6,1.6);s.place('bedroom_ball',3.8,-2.8);s.place('bedroom_sock',.6,4.4);}},
};
// where each scene stands in the room [id, x, z, turn] (furniture is in BEDROOM_FURNITURE)
const BEDROOM_SCENE_AT=[
  ['snack_spill',6,47,0],['brick_build',-16,50,0],['crayon_art',-26,66,0],              // by the start (micro, mini)
  ['toy_race',6,25,0],['block_city',8,8,0],['dino_standoff',-17,8,0],                     // on the play-mat rug (tiny, small)
  ['tea_party',-54,28,0],['pillow_fort',-54,-8,Math.PI/2],['plush_pile',-54,-28,0],      // the left side
  ['sock_mountain',54,52,0],['marble_run',50,-2,0],['reading_nook',46,-46,0],            // the right side
  ['train_loop',18,-28,0]                                                                 // behind the rug, next to the castle
];

/* ---------- layout: furniture and every scene at fixed room spots (each chunk places the parts inside it) ---------- */
const bedroomPut=(ctx,type,x,z,arg)=>ctx.place(type,x,z,arg,BEDROOM_R[type.slice(8)]||1.2);
function bedroomSprinkle(ctx,x0,z0,x1,z1,n,types){for(let i=0;i<n;i++)bedroomPut(ctx,pick(types),rand(x0,x1),rand(z0,z1),Math.random()*4|0);}
function bedroomScene(ctx,id,x,z,th){const r=BEDROOM_SCENES[id].r+3;
  if(x+r>ctx.x0&&x-r<ctx.x1&&z+r>ctx.z0&&z-r<ctx.z1)ctx.scene(id,x,z,th);}
const BEDROOM_FURNITURE=[ // [type, x, z, arg (0 +Z, 1 +X, 2 −Z, 3 −X)]
  ['bedroom_door',8,-(BEDROOM_HALF-BEDROOM_R.door-2.05),0],
  ['bedroom_bunkbed',-56,-60,0],['bedroom_chest',-24,-71,0],['bedroom_shelf',58,-70,0],
  ['bedroom_dresser',70,-20,3],['bedroom_desk',68,22,3],['bedroom_chair',56,22,1],['bedroom_lamp',71,-2,0],
  ['bedroom_dollhouse',-70,-12,1],['bedroom_beanbag',-68,8,0],['bedroom_bigteddy',-70,58,1],['bedroom_tent',66,66,0],
  ['bedroom_horse',28,-56,0],['bedroom_lamp',-71,-31,0],['bedroom_castle',-18,-28,0]
];
// what the (small) random top-up uses inside the scene spots
const BEDROOM_PAPER={micro:['bedroom_crumb','bedroom_brick'],mini:['bedroom_crayon','bedroom_crayon','bedroom_marble'],tiny:['bedroom_block','bedroom_toycar'],small:['bedroom_crayonbox','bedroom_books']};
registerZone({
  id:'bedroom',
  letter:'R',
  ground:'#d9a66b',                          // the wood floor
  sky:{top:'#fff1e6',horizon:'#ffd6e0'},     // warm, cozy, peachy
  weight:0,                                  // never mixed into an outdoor world: you pick it on the start screen
  indoor:{half:BEDROOM_HALF,wallH:BEDROOM_WALLH,floor:'#d9a66b',wall:'#cfe6ff',trim:BEDROOM_WHITE},
  room:bedroomRoom,
  breakout:['bedroom_door'],
  start:[[-2.2,56],[2.2,56]],                 // on the floor in front of the play-mat rug, facing the room
  // L22 sound + music ids (clips described in TASKS.md AU10; anything missing falls back to the default sounds)
  music:{drive:'bedroom_drive',boss:'bedroom_boss'},
  sfx:{crash:'bedroom_clatter',boom:'bedroom_boom',land:'bedroom_thump',ambient:'bedroom_ambient'},
  props:BEDROOM_PROPS,
  scenes:BEDROOM_SCENES,                     // also the filler scenes dropped around the cars at their size
  // the random top-up (scenes do most of the work now); no block towers or castles repeating at the big sizes
  sizes:{
    micro:['bedroom_crumb','bedroom_cereal','bedroom_gummy','bedroom_brick'],
    mini:['bedroom_crayon','bedroom_marble','bedroom_bricks','bedroom_dice','bedroom_teacup'],
    tiny:['bedroom_block','bedroom_duck','bedroom_toycar','bedroom_sock','bedroom_teapot'],
    small:['bedroom_teddy','bedroom_books','bedroom_cup','bedroom_robot','bedroom_ball','bedroom_dino','bedroom_crayonbox'],
    medium:['bedroom_truck','bedroom_train','bedroom_drum','bedroom_bunny','bedroom_pillow','bedroom_sockpile'],
    large:['bedroom_chest','bedroom_dollhouse','bedroom_lamp','bedroom_horse','bedroom_beanbag','bedroom_basket'],
    huge:['bedroom_bigteddy','bedroom_tent','bedroom_fort'],
    mega:['bedroom_bigteddy','bedroom_tent','bedroom_castle']   // the bunk bed and the furniture only stand at their room spots
  },
  // spots: the snack corner by the start is crumbs and cereal; the milk puddle and the art corner's paper get their own
  spots:{
    snack:{micro:['bedroom_crumb','bedroom_cereal','bedroom_gummy'],mini:['bedroom_crayon','bedroom_marble','bedroom_teacup'],tiny:['bedroom_sock','bedroom_block'],small:['bedroom_cup','bedroom_bowl']},
    milk:{micro:['bedroom_cereal','bedroom_crumb'],mini:['bedroom_teacup'],tiny:['bedroom_teapot'],small:['bedroom_bowl']},
    paper:BEDROOM_PAPER,crayon_r:BEDROOM_PAPER,crayon_b:BEDROOM_PAPER,crayon_y:BEDROOM_PAPER,crayon_g:BEDROOM_PAPER,crayon_p:BEDROOM_PAPER
  },
  // painted floor tiles (L30): the art corner's paper and scribbles, the milk puddle
  spotLook:{paper:'#fffdf7',milk:'#fff6e6',crayon_r:'#ff595e',crayon_b:'#1982c4',crayon_y:'#ffca3a',crayon_g:'#8ac926',crayon_p:'#f15bb5'},
  herds:[],
  layout(ctx){
    ctx.planned=true; // the whole room is planned: only a small random top-up on top
    for(const [t,x,z,a] of BEDROOM_FURNITURE)bedroomPut(ctx,t,x,z,a);
    for(const [id,x,z,th] of BEDROOM_SCENE_AT)bedroomScene(ctx,id,x,z,th);
    ctx.spot('snack',24,62,24,18,0); // the rug and the nooks are scenes now, so no filler spots there (they pulled in most of the top-up)
    // a few loose things where kids drop them (most of the room is scenes now)
    bedroomPut(ctx,'bedroom_ball',30,72);bedroomPut(ctx,'bedroom_teddy',-8,74,2);bedroomPut(ctx,'bedroom_sock',-36,44,1);
    bedroomSprinkle(ctx,ctx.x0+4,ctx.z0+4,ctx.x1-4,ctx.z1-4,4,['bedroom_brick','bedroom_crumb','bedroom_cereal','bedroom_crayon','bedroom_sock','bedroom_block']);
    for(const [x,z,th] of [[0,-60,0],[50,-26,0]])ctx.ramp(x,z,th);
  }
});
