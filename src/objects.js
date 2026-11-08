/* Smash Party — SMASHABLE OBJECTS & ARENA LAYOUT. Owner: Cursor (design). Depends on core.js helpers. */
/* ---------- smashable objects ---------- */
let objects=[];
function makeObj(x,z,r,h,points,build,opts={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const o=Object.assign({g,x,z,r,h,points,parts:[],alive:true,falling:false,fy:0,vy:0},opts);
  const P=(mesh,n=4,whole=false,half=0.5)=>{g.add(mesh);o.parts.push({mesh,n,whole,half});return mesh;};
  build(P,g,o);scene.add(g);objects.push(o);return o;
}
function prop(x,z,r,h,points,size,build,extra){
  const o=extra||{};o.size=size;if(size==='large'||size==='huge'||size==='mega')o.big=true;
  return makeObj(x,z,r,h,points,build,o);
}
/* arg 0–3 turns a prop to face +Z, +X, -Z, -X. Fence still takes radians. */
function face(g,arg){g.rotation.y=(typeof arg==='number'?((arg%4)+4)%4:(Math.random()*4|0))*Math.PI/2;}
/* L3 part contract: several walls per storey so a floor can lose support and pancake. */
function story(P,w,d,fh,y,floor,color,segs){
  segs=segs||2;const thick=.7;
  for(let s=0;s<4;s++){const along=(s<2?w:d)+thick,n=segs,len=along/n+thick*.4;
    for(let k=0;k<n;k++){const a=-along/2+along/(n*2)+k*along/n,e=(s<2?d:w)/2;
      P(BP(s<2?mk('box',len,fh,thick,color,a,y+fh/2,s?e:-e):mk('box',thick,fh,len,color,s==2?e:-e,y+fh/2,a),floor,'wall'),2);}}
  P(BP(mk('box',Math.max(.4,w-.35),.34,Math.max(.4,d-.35),color,0,y+.2,0),floor,'slab'),2);
}
function slab(P,w,d,y,floor,color){P(BP(mk('box',w,.28,d,color||'#f8f9fa',0,y,0),floor,'slab'),3);}
function roofOf(P,w,d,h,y,floor,color){P(BP(mk('pyr',w,h,d,color,0,y,0),floor,'roof'),5);}
function pinMesh(){const g=new THREE.Group();
  g.add(mk('sph',1.3,1.9,1.3,'#ffffff',0,-0.4,0),mk('cyl',0.55,1.0,0.55,'#ffffff',0,0.75,0),mk('sph',0.8,0.9,0.8,'#ffffff',0,1.45,0),
    mk('cyl',0.6,0.14,0.6,'#e63946',0,0.85,0),mk('cyl',0.62,0.14,0.62,'#e63946',0,1.05,0));return g;}
const PASTEL=['#ffd6a5','#caffbf','#9bf6ff','#bdb2ff','#ffc6ff','#fdffb6','#ffadad'];
const ROOF=['#e63946','#3a86ff','#8338ec','#2a9d8f','#f77f00'];
const BLOCK=['#e63946','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#ff006e','#fb5607'];
const CAR_COLORS=['#ff006e','#3a86ff','#ffbe0b','#06d6a0','#8338ec','#fb5607'];
/* Placement radius for every type. Layouts pass this into ctx.place so game.js REC_R can stay untouched.
   TODO(logic): copy these into REC_R as a fallback for place() calls that omit r. */
const RAD={
  crates:1.5,cone:.7,barrel:1,tower:1.4,house:3.6,pin:1.1,melon:1.1,snowman:1.3,tree:1.1,fence:2.1,
  cottage:2.7,villa:4.6,shop:3.8,school:6.6,firestation:5.6,watertower:3.2,mailbox:.55,lamp:.6,hydrant:.5,
  parked:2.2,boss:6.8,barn:7.2,silo:2.5,farmhouse:4,hay:1.25,crops:2.6,pond:4.8,windmill:3.6,coop:2.4,
  scarecrow:.9,tractor:2.7,swing:1.9,slide:1.9,gym:3.2,fountain:2.9,bench:1.3,picnic:1.7,gazebo:3.8,
  bounce:5.8,bush:.9,flowers:.32,pebble:.26,mushroom:.3,acorn:.22,toyblock:.28,can:.2,toyduck:.3,gnome:.26,snail:.28
};
/* TODO(logic): o.roll (hay) should keep tumbling along the ground after the hit.
   TODO(logic): spin the four windmill boards in front of the hub.
   Chickens and ducks are herds (ctx.herd), not smashables, so L4 launches them. */
const OBJ={
  crates:(x,z)=>{const k=1+(Math.random()*3|0);return makeObj(x,z,1.5,2.1*k,2*k,P=>{for(let i=0;i<k;i++){const c=mk('box',2.1,2.1,2.1,pick(['#c68b59','#b5835a','#d4a373']),0,1.05+i*2.1,0);c.rotation.y=rand(-.4,.4);P(c,5);}},{size:'medium'});},
  cone:(x,z)=>makeObj(x,z,.7,1.6,1,P=>{P(mk('cone',1.2,1.6,1.2,'#ff7b00',0,.8,0),1,true,.6);},{size:'small'}),
  barrel:(x,z)=>makeObj(x,z,1.0,1.9,6,P=>{P(mk('cyl',1.7,1.9,1.7,'#e63946',0,.95,0),6);P(mk('cyl',1.75,.35,1.75,'#ffd60a',0,.95,0),2);P(mk('cyl',1.0,.1,1.0,'#9d0208',0,1.92,0),1);},{explosive:true,size:'medium'}),
  tower:(x,z)=>{const k=4+(Math.random()*5|0);return makeObj(x,z,1.4,k*1.8,k,P=>{const s=Math.random()*7|0;for(let i=0;i<k;i++){const b=mk('box',1.8,1.8,1.8,BLOCK[(i+s)%7],0,.9+i*1.8,0);b.rotation.y=rand(-.25,.25);P(b,1,true,.9);}},{size:'large',big:true});},
  house:(x,z)=>prop(x,z,3.6,6.2,14,'huge',(P,g)=>{
    const wall=pick(PASTEL),rf=pick(ROOF);
    story(P,4.8,4.8,3.2,0,0,wall,2);
    P(BP(mk('box',1,1.6,.16,'#7f4f24',0,.8,2.25),0,'extra'),1,true,.35);
    P(BP(mk('box',.85,.85,.14,'#a0e7ff',-1.3,2,2.3),0,'extra'),1,true,.25);
    P(BP(mk('box',.85,.85,.14,'#a0e7ff',1.3,2,2.3),0,'extra'),1,true,.25);
    roofOf(P,6.4,6.4,2.2,4.3,1,rf);P(BP(mk('box',.55,1.2,.55,'#b5651d',1.2,5.1,0),1,'extra'),1,true,.3);
    g.rotation.y=(Math.random()*4|0)*Math.PI/2;
  },{building:true,big:true}),
  pin:(x,z)=>makeObj(x,z,1.1,5,3,P=>{const g=pinMesh();g.scale.setScalar(1.5);g.position.y=2.0;P(g,1,true,2.0);},{size:'small'}),
  melon:(x,z)=>makeObj(x,z,1.1,1.6,3,P=>{P(mk('sph',2.0,1.6,1.6,'#2d6a4f',0,.8,0),6);P(mk('sph',1.7,1.3,1.3,'#ef476f',0,.8,0),7);},{size:'small'}),
  snowman:(x,z)=>makeObj(x,z,1.3,5.6,5,P=>{P(mk('sph',2.4,2.4,2.4,'#ffffff',0,1.2,0),1,true,1.1);P(mk('sph',1.7,1.7,1.7,'#ffffff',0,3.0,0),1,true,.8);
    P(mk('sph',1.2,1.2,1.2,'#ffffff',0,4.3,0),1,true,.55);const n=mk('cone',.25,.8,.25,'#fb8500',0,4.3,.85);n.rotation.x=Math.PI/2;P(n,1);
    P(mk('cyl',1.0,.9,1.0,'#222222',0,5.2,0),1,true,.45);P(mk('sph',.18,.18,.18,'#111111',-.25,4.45,.55),1);P(mk('sph',.18,.18,.18,'#111111',.25,4.45,.55),1);},{size:'medium'}),
  tree:(x,z)=>makeObj(x,z,1.1,6,3,P=>{P(mk('cyl',.6,3,.6,'#8d5524',0,1.5,0),3);P(mk('sph',3.4,3.4,3.4,pick(['#ff006e','#06d6a0','#ffbe0b','#8338ec','#3a86ff']),0,4.4,0),1,true,1.6);},{size:'large',big:true}),
  fence:(x,z,ry=0)=>makeObj(x,z,2.1,1.7,2,(P,g)=>{for(let i=0;i<5;i++)P(mk('box',.35,1.7,.18,'#ffffff',-1.6+i*.8,.85,0),1,true,.4);
    P(mk('box',4,.22,.14,'#eeeeee',0,.5,-.15),2);P(mk('box',4,.22,.14,'#eeeeee',0,1.2,-.15),2);g.rotation.y=ry;},{size:'small'}),
  cottage:(x,z,arg)=>prop(x,z,RAD.cottage,4.4,6,'large',(P,g)=>{
    const wall=pick(PASTEL),rf=pick(ROOF);
    story(P,3.8,3.8,2.4,0,0,wall,2);
    P(BP(mk('box',.8,1.3,.14,'#7f4f24',0,.65,1.8),0,'extra'),1,true,.3);
    P(BP(mk('box',.7,.7,.12,'#a0e7ff',-1,1.5,1.85),0,'extra'),1,true,.2);
    roofOf(P,5,5,1.6,3.2,1,rf);face(g,arg);
  },{building:true}),
  villa:(x,z,arg)=>prop(x,z,RAD.villa,8,18,'huge',(P,g)=>{
    const wall=pick(PASTEL),rf=pick(ROOF);
    story(P,6.6,5.4,2.8,0,0,'#f8f9fa',2);slab(P,6.2,5,2.8,0,'#fff');
    story(P,4.2,3.8,2.2,2.8,1,wall,2);
    P(BP(mk('box',1.1,1.8,.14,'#7f4f24',0,.9,2.6),0,'extra'),1,true,.35);
    roofOf(P,7.4,6.2,2,6.1,2,rf);P(BP(mk('box',.55,1.2,.55,'#b5651d',2,6.6,0),2,'extra'),1,true,.3);face(g,arg);
  },{building:true}),
  shop:(x,z,arg)=>prop(x,z,RAD.shop,5.2,10,'large',(P,g)=>{
    story(P,5.8,4.6,2.8,0,0,'#fff3bf',2);
    P(BP(mk('box',6.2,.3,1.4,'#e63946',0,2.95,1.7),0,'extra'),1,true,.3);
    P(BP(mk('box',2,1.4,.12,'#8ecae6',-1.3,1.6,2.2),0,'extra'),1,true,.25);
    P(BP(mk('box',2,1.4,.12,'#8ecae6',1.3,1.6,2.2),0,'extra'),1,true,.25);
    P(BP(mk('box',1.05,1.7,.12,'#6f4e37',0,.85,2.2),0,'extra'),1,true,.3);
    P(BP(mk('box',2.2,.6,.1,pick(BLOCK),0,3.5,1.9),1,'extra'),1,true,.25);
    roofOf(P,6.4,5.2,1.2,3.6,1,pick(ROOF));face(g,arg);
  },{building:true}),
  school:(x,z,arg)=>prop(x,z,RAD.school,8,22,'huge',(P,g)=>{
    story(P,11.2,5.2,3.4,0,0,'#f8f1e3',3);slab(P,10.8,4.8,3.4,0,'#fff');
    story(P,3.4,4,2.4,3.4,1,'#f8f1e3',2);
    P(BP(mk('box',1.4,2,.14,'#6f4e37',0,1,2.5),0,'extra'),1,true,.35);
    for(let i=-2;i<=2;i++)if(i)P(BP(mk('box',1.05,1.05,.12,'#90e0ef',i*2,2.1,2.55),0,'extra'),1,true,.2);
    roofOf(P,4.4,4.6,1.5,6.6,2,'#e07a5f');
    P(BP(mk('cyl',.08,1.6,.08,'#ddd',1.2,7.4,0),2,'extra'),1);
    P(BP(mk('box',.65,.35,.06,'#ffbe0b',1.55,7.9,0),2,'extra'),1,true,.15);face(g,arg);
  },{building:true}),
  firestation:(x,z,arg)=>prop(x,z,RAD.firestation,8,20,'huge',(P,g)=>{
    story(P,9,5.8,3.6,0,0,'#d62828',3);
    P(BP(mk('box',9.2,.3,6,'#fff',0,2.1,0),0,'extra'),1,true,.3);
    P(BP(mk('box',2.2,2.2,.14,'#1d3557',-2.2,1.2,2.8),0,'extra'),1,true,.4);
    P(BP(mk('box',2.2,2.2,.14,'#1d3557',2.2,1.2,2.8),0,'extra'),1,true,.4);
    story(P,2.8,2.8,2.6,3.6,1,'#d62828',2);slab(P,2.6,2.6,6.2,1,'#fff');
    P(BP(mk('box',.4,.3,.3,null,-1.2,6.5,-.6,glow('#ff1e1e')),1,'extra'),1);face(g,arg);
  },{building:true}),
  watertower:(x,z)=>prop(x,z,RAD.watertower,13,16,'huge',P=>{
    [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]].forEach(([x,z])=>P(mk('cyl',.26,7.2,.26,'#ced4da',x,3.6,z),2));
    P(mk('cyl',3.3,2.8,3.3,'#4895ef',0,8.4,0),5);P(mk('cyl',3.45,.4,3.45,'#fff',0,9.5,0),2);P(mk('cone',3,1.4,3,'#e63946',0,10.6,0),3);
    P(mk('box',.9,.45,.1,'#ffd60a',0,8.4,1.7),1);}),
  mailbox:(x,z,arg)=>prop(x,z,RAD.mailbox,1.5,1,'tiny',(P,g)=>{
    P(mk('box',.14,1,.14,'#6d4c41',0,.5,0),1);P(mk('box',.62,.4,.85,pick(['#3a86ff','#e63946','#2a9d8f']),0,1.15,0),1,true,.3);
    P(mk('box',.08,.26,.22,'#ffbe0b',.36,1.28,0),1);face(g,arg);}),
  lamp:(x,z)=>prop(x,z,RAD.lamp,4.2,2,'small',P=>{
    P(mk('cyl',.16,3.2,.16,'#343a40',0,1.6,0),2);P(mk('box',.7,.22,.7,'#343a40',0,3.3,0),1);
    P(mk('box',.5,.32,.5,null,0,3.05,0,glow('#fff6a0')),1,true,.25);}),
  hydrant:(x,z)=>prop(x,z,RAD.hydrant,1.15,1,'tiny',P=>{
    P(mk('cyl',.42,.85,.42,'#e63946',0,.45,0),2);P(mk('cyl',.26,.24,.26,'#ffd60a',0,.95,0),1);
    const a=mk('cyl',.14,.4,.14,'#dee2e6',.32,.5,0);a.rotation.z=Math.PI/2;P(a,1);
    const b=mk('cyl',.14,.4,.14,'#dee2e6',-.32,.5,0);b.rotation.z=Math.PI/2;P(b,1);}),
  parked:(x,z,arg)=>prop(x,z,RAD.parked,2.2,4,'medium',(P,g)=>{
    const body=pick(CAR_COLORS),van=Math.random()<.35;
    P(mk('box',1.7,.65,3.5,body,0,.8,0),5);P(mk('box',1.55,van?1.15:.65,van?2.2:1.5,'#edf2fb',0,van?1.45:1.35,van?-.15:.35),3);
    [[-.8,1.15],[.8,1.15],[-.8,-1.15],[.8,-1.15]].forEach(([x,z])=>P(mk('wheel',.32,.62,.62,'#222',x,.32,z),1,true,.28));
    P(mk('box',.32,.18,.08,null,-.45,.78,1.78,glow('#fff6a0')),1);P(mk('box',.32,.18,.08,null,.45,.78,1.78,glow('#fff6a0')),1);face(g,arg);}),
  boss:(x,z,arg)=>prop(x,z,RAD.boss,16,40,'mega',(P,g)=>{
    const cols=['#f4a261','#e9c46a','#2a9d8f','#e76f51'];
    for(let i=0;i<4;i++){const w=10-i*1.5;story(P,w,w,2.5,i*2.6,i,cols[i],2);
      P(BP(mk('box',1.15,.7,.16,'#caf0f8',-w*.18,i*2.6+1.35,w/2+.05),i,'extra'),1,true,.2);
      P(BP(mk('box',1.15,.7,.16,'#caf0f8',w*.18,i*2.6+1.35,w/2+.05),i,'extra'),1,true,.2);}
    roofOf(P,6.2,6.2,2.4,11.5,4,'#e63946');
    P(BP(mk('cyl',.16,1.5,.16,'#dee2e6',0,12.6,0),4,'extra'),1);P(BP(mk('sph',.55,.55,.55,'#ffd60a',0,13.5,0),4,'extra'),1,true,.25);face(g,arg);
  },{building:true}),
  barn:(x,z,arg)=>prop(x,z,RAD.barn,9,32,'mega',(P,g)=>{
    story(P,11,7,4.6,0,0,'#c1121f',3);
    P(BP(mk('box',11.2,.35,7.2,'#f8f9fa',0,3.4,0),0,'extra'),1,true,.4);
    P(BP(mk('box',2.8,3,.14,'#f8f9fa',0,1.6,3.4),0,'extra'),1,true,.5);
    const x1=mk('box',2.6,.18,.08,'#c1121f',0,1.6,3.5);x1.rotation.z=.75;P(BP(x1,0,'extra'),1,true,.3);
    const x2=mk('box',2.6,.18,.08,'#c1121f',0,1.6,3.52);x2.rotation.z=-.75;P(BP(x2,0,'extra'),1,true,.3);
    roofOf(P,12,8,2.6,6.2,1,'#6d4c41');P(BP(mk('box',1.3,1.3,1.3,'#f8f9fa',0,7.4,0),1,'extra'),1,true,.4);face(g,arg);
  },{building:true}),
  silo:(x,z)=>prop(x,z,RAD.silo,12,14,'huge',P=>{
    P(mk('cyl',4,8.4,4,'#dee2e6',0,4.2,0),6);P(mk('cyl',4.15,.4,4.15,'#e63946',0,6.6,0),2);P(mk('sph',4,2.2,4,'#f8f9fa',0,9,0),3);
    P(mk('box',1.1,1.8,.1,'#6d4c41',0,1.1,2.05),1);}),
  farmhouse:(x,z,arg)=>prop(x,z,RAD.farmhouse,6.4,12,'huge',(P,g)=>{
    story(P,5.8,4.6,3,0,0,'#f8f9fa',2);
    P(BP(mk('box',1,.1,1.4,'#c1121f',0,.55,2.5),0,'extra'),1,true,.25);
    P(BP(mk('box',.95,1.7,.12,'#6f4e37',0,.85,2.2),0,'extra'),1,true,.3);
    P(BP(mk('box',.8,.8,.12,'#90e0ef',-1.5,1.8,2.25),0,'extra'),1,true,.2);
    P(BP(mk('box',.8,.8,.12,'#90e0ef',1.5,1.8,2.25),0,'extra'),1,true,.2);
    roofOf(P,7,5.6,2,4.1,1,'#2a9d8f');P(BP(mk('cyl',.3,1,.3,'#6d4c41',1.8,4.6,0),1,'extra'),1,true,.25);face(g,arg);
  },{building:true}),
  hay:(x,z)=>prop(x,z,RAD.hay,1.6,2,'small',P=>{
    const b=new THREE.Group();
    const body=mk('cyl',1.55,1.45,1.55,'#e9c46a',0,.8,0);body.rotation.z=Math.PI/2;b.add(body);
    const band=mk('cyl',1.62,.2,1.62,'#bc6c25',0,.8,0);band.rotation.z=Math.PI/2;b.add(band);
    P(b,1,true,.8);
  },{roll:true}),
  crops:(x,z,arg)=>prop(x,z,RAD.crops,1.2,3,'small',(P,g)=>{
    P(mk('box',4.4,.22,2,'#bc6c25',0,.11,0),2);const corn=Math.random()<.5;
    for(let i=-2;i<=2;i++)P(mk(corn?'cone':'sph',.5,.65,.5,corn?'#ffd60a':'#70e000',i*.8,.5,0),1,true,.25);face(g,arg);}),
  pond:(x,z)=>prop(x,z,RAD.pond,.7,8,'medium',P=>{
    P(mk('cyl',9, .28,9,'#48cae4',0,.16,0),5);P(mk('cyl',7.2,.1,7.2,'#0096c7',0,.32,0),3);
    [[1.8,.8],[-1.4,1.5],[.2,-1.6]].forEach(([x,z])=>P(mk('cyl',1,.08,1,'#2d6a4f',x,.42,z),1,true,.2));}),
  windmill:(x,z,arg)=>prop(x,z,RAD.windmill,12,16,'huge',(P,g)=>{
    P(mk('cyl',2.1,6.4,2.1,'#f4f1de',0,3.2,0),6);P(mk('cone',2.5,1.8,2.5,'#e07a5f',0,7.2,0),3);P(mk('box',.35,.35,1,'#6d4c41',0,5.4,1.15),1);
    const hub=mk('cyl',.45,.4,.45,'#333',0,5.5,1.55);hub.rotation.x=Math.PI/2;P(hub,1,true,.25);
    for(let i=0;i<4;i++){const b=mk('box',.28,3.6,.1,'#f8f4e3',0,5.5,1.7);b.rotation.z=i*Math.PI/2;P(b,1,true,.3);}
    face(g,arg);}),
  coop:(x,z,arg)=>prop(x,z,RAD.coop,3.2,6,'medium',(P,g)=>{
    P(mk('box',3.4,2,3,'#f4a261',0,1,0),5);P(mk('pyr',4.2,1.2,3.8,'#6d4c41',0,2.4,0),3);P(mk('box',.65,.7,.08,'#6d4c41',.7,.6,1.54),1);
    const ramp=mk('box',.7,.1,1.3,'#ddb892',.7,.32,2.05);ramp.rotation.x=-.45;P(ramp,1);face(g,arg);}),
  scarecrow:(x,z,arg)=>prop(x,z,RAD.scarecrow,3.3,2,'small',(P,g)=>{
    const b=new THREE.Group();
    b.add(mk('cyl',.12,2.5,.12,'#6d4c41',0,1.25,0),mk('box',1.7,.1,.1,'#6d4c41',0,1.9,0),mk('sph',.65,.65,.65,'#e9c46a',0,2.45,0),mk('cyl',.5,.35,.5,'#3a86ff',0,2.8,0));
    b.add(mk('sph',.14,.14,.14,'#111',-.12,2.5,.28),mk('sph',.14,.14,.14,'#111',.12,2.5,.28));
    P(b,1,true,.65);face(g,arg);}),
  tractor:(x,z,arg)=>prop(x,z,RAD.tractor,2.6,8,'large',(P,g)=>{
    P(mk('box',1.5,.75,2.5,'#2d6a4f',0,.85,.15),4);P(mk('box',1.25,1,1.15,'#95d5b2',0,1.6,.65),3);P(mk('cyl',.18,.6,.18,'#333',0,2.25,-.4),1);
    P(mk('wheel',.4,1.45,1.45,'#222',-.85,.72,-.65),1,true,.55);P(mk('wheel',.4,1.45,1.45,'#222',.85,.72,-.65),1,true,.55);
    P(mk('wheel',.28,.75,.75,'#ffd60a',-.72,.42,1.05),1,true,.32);P(mk('wheel',.28,.75,.75,'#ffd60a',.72,.42,1.05),1,true,.32);face(g,arg);}),
  swing:(x,z,arg)=>prop(x,z,RAD.swing,3.6,4,'small',(P,g)=>{
    [[-1.55,-.75],[1.55,-.75],[-1.55,.75],[1.55,.75]].forEach(([x,z])=>P(mk('box',.28,3.3,.28,'#457b9d',x,1.65,z),1));
    P(mk('box',3.5,.26,.26,'#1d3557',0,3.25,0),1);
    [-.6,.6].forEach((x,i)=>{P(mk('box',.1,1.6,.1,'#ced4da',x-.28,2.3,0),1);P(mk('box',.1,1.6,.1,'#ced4da',x+.28,2.3,0),1);
      P(mk('box',.85,.22,.55,i?'#ffbe0b':'#e63946',x,1.4,0),1,true,.3);});face(g,arg);}),
  slide:(x,z,arg)=>prop(x,z,RAD.slide,2.5,4,'small',(P,g)=>{
    P(mk('box',1.3,1.45,1.1,'#3a86ff',0,.72,-.7),3);const chute=mk('box',1.2,.16,2.6,'#ffbe0b',0,1.05,.65);chute.rotation.x=-.5;P(chute,2);
    P(mk('box',.1,1.3,.1,'#1d3557',-.5,.65,-.7),1);P(mk('box',.1,1.3,.1,'#1d3557',.5,.65,-.7),1);face(g,arg);}),
  gym:(x,z,arg)=>prop(x,z,RAD.gym,5.2,8,'large',(P,g)=>{
    const cols=['#e63946','#ffbe0b','#3a86ff','#06d6a0'];
    [[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]].forEach(([x,z],i)=>P(mk('cyl',.28,4.4,.28,cols[i],x,2.2,z),2));
    P(mk('box',4.2,.28,4.2,'#8338ec',0,4.4,0),3);P(mk('box',3.6,.18,.18,'#ffd60a',0,2.4,-1.7),1);
    P(mk('box',.18,.18,3.6,'#ff006e',1.7,1.6,0),1);P(mk('box',.18,.18,3.6,'#06d6a0',-1.7,3.1,0),1);face(g,arg);}),
  fountain:(x,z)=>prop(x,z,RAD.fountain,3.4,8,'large',P=>{
    P(mk('cyl',5.2,.5,5.2,'#8ecae6',0,.25,0),4);P(mk('cyl',1.1,1.8,1.1,'#f4f1de',0,1.2,0),3);P(mk('sph',1.15,1.15,1.15,'#48cae4',0,2.4,0),1,true,.5);}),
  bench:(x,z,arg)=>prop(x,z,RAD.bench,1.15,1,'tiny',(P,g)=>{
    P(mk('box',2,.12,.55,'#bc6c25',0,.55,0),1,true,.3);P(mk('box',2,.6,.1,'#bc6c25',0,.9,-.22),1);
    P(mk('box',.1,.5,.45,'#6d4c41',-.85,.28,0),1);P(mk('box',.1,.5,.45,'#6d4c41',.85,.28,0),1);face(g,arg);}),
  picnic:(x,z,arg)=>prop(x,z,RAD.picnic,1.3,3,'small',(P,g)=>{
    P(mk('box',2,.12,1.1,'#e9c46a',0,.78,0),2);P(mk('box',1.8,.1,.35,'#bc6c25',0,.5,.75),1);P(mk('box',1.8,.1,.35,'#bc6c25',0,.5,-.75),1);
    P(mk('box',.1,.75,.1,'#6d4c41',-.75,.38,.35),1);P(mk('box',.1,.75,.1,'#6d4c41',.75,.38,-.35),1);
    if(Math.random()<.55)P(mk('sph',.35,.35,.35,'#ef476f',.3,1.05,0),1,true,.18);face(g,arg);}),
  gazebo:(x,z)=>prop(x,z,RAD.gazebo,5.8,14,'huge',P=>{
    P(mk('cyl',6,.28,6,'#f8f9fa',0,.16,0),3);[[-1.9,-1.9],[1.9,-1.9],[-1.9,1.9],[1.9,1.9]].forEach(([x,z])=>P(mk('cyl',.26,3,.26,'#fff',x,1.7,z),2));
    P(mk('pyr',7,2,7,'#e63946',0,4.3,0),4);P(mk('sph',.45,.45,.45,'#ffd60a',0,5.4,0),1,true,.22);}),
  bounce:(x,z,arg)=>prop(x,z,RAD.bounce,6.2,26,'mega',(P,g)=>{
    P(mk('box',9.6,3.8,7,'#ff70a6',0,1.9,0),8);P(mk('box',9.9,1,7.3,'#ffd166',0,4.1,0),3);
    [[-4.1,-2.9],[4.1,-2.9],[-4.1,2.9],[4.1,2.9]].forEach(([x,z],i)=>P(mk('cyl',1.5,6.4,1.5,['#4cc9f0','#06d6a0','#ffbe0b','#8338ec'][i],x,3.2,z),2));
    P(mk('box',2,2,.12,'#1d3557',0,1.2,3.56),1);face(g,arg);}),
  bush:(x,z)=>prop(x,z,RAD.bush,1.3,1,'mini',P=>{
    const c=pick(['#2d6a4f','#40916c','#52b788']);
    P(mk('sph',1.2,.95,1.2,c,0,.5,0),1,true,.5);P(mk('sph',.7,.6,.7,c,.35,.8,.15),1,true,.3);}),
  flowers:(x,z)=>prop(x,z,RAD.flowers,.45,1,'micro',P=>{
    P(mk('box',.52,.16,.3,'#bc6c25',0,.08,0),1);
    ['#e63946','#ffbe0b','#8338ec'].forEach((c,i)=>P(mk('sph',.13,.13,.13,c,-.16+i*.16,.24,0),1,true,.06));}),
  pebble:(x,z)=>prop(x,z,RAD.pebble,.22,1,'micro',P=>{
    const c=pick(['#adb5bd','#ced4da','#d4a373','#6c757d']);
    P(mk('sph',.38,.22,.32,c,0,.1,0),1,true,.12);
    if(Math.random()<.5)P(mk('sph',.2,.14,.18,c,.16,.07,.06),1,true,.08);}),
  mushroom:(x,z)=>prop(x,z,RAD.mushroom,.42,1,'micro',P=>{
    P(mk('cyl',.14,.26,.14,'#f8f9fa',0,.13,0),1);
    P(mk('sph',.42,.24,.42,pick(['#e63946','#ff006e','#ffbe0b']),0,.3,0),1,true,.12);
    P(mk('sph',.07,.07,.07,'#fff',.08,.34,.12),1);}),
  acorn:(x,z)=>prop(x,z,RAD.acorn,.3,1,'micro',P=>{
    P(mk('sph',.26,.3,.26,'#bc6c25',0,.12,0),1,true,.1);
    P(mk('sph',.24,.14,.24,'#6d4c41',0,.26,0),1,true,.08);
    P(mk('cyl',.04,.14,.04,'#2d6a4f',0,.36,0),1);}),
  toyblock:(x,z)=>prop(x,z,RAD.toyblock,.4,1,'micro',P=>{
    const b=mk('box',.4,.4,.4,pick(BLOCK),0,.2,0);b.rotation.y=rand(0,1.2);P(b,1,true,.18);}),
  can:(x,z)=>prop(x,z,RAD.can,.42,1,'micro',P=>{
    P(mk('cyl',.2,.44,.2,pick(['#e63946','#3a86ff','#06d6a0','#ffbe0b']),0,.22,0),1,true,.14);
    P(mk('cyl',.21,.05,.21,'#f8f9fa',0,.43,0),1);}),
  toyduck:(x,z)=>prop(x,z,RAD.toyduck,.4,1,'micro',P=>{
    P(mk('sph',.38,.28,.44,'#ffd60a',0,.16,0),1,true,.14);
    P(mk('sph',.2,.18,.2,'#ffd60a',0,.32,.14),1,true,.08);
    const bill=mk('cone',.06,.14,.06,'#fb8500',0,.3,.3);bill.rotation.x=Math.PI/2;P(bill,1);
    P(mk('sph',.05,.05,.05,'#111',.05,.36,.22),1);}),
  gnome:(x,z,arg)=>prop(x,z,RAD.gnome,.7,1,'mini',(P,g)=>{
    P(mk('cyl',.2,.36,.2,pick(['#3a86ff','#2a9d8f','#e63946']),0,.18,0),1);
    P(mk('sph',.24,.24,.24,'#ffd6a5',0,.44,0),1,true,.1);
    P(mk('cone',.3,.32,.3,'#e63946',0,.66,0),1,true,.12);
    P(mk('sph',.05,.05,.05,'#111',-.05,.46,.1),1);P(mk('sph',.05,.05,.05,'#111',.05,.46,.1),1);face(g,arg);}),
  snail:(x,z,arg)=>prop(x,z,RAD.snail,.32,1,'micro',(P,g)=>{
    P(mk('sph',.34,.28,.34,pick(['#bc6c25','#e9c46a','#f4a261']),0,.16,0),1,true,.12);
    P(mk('sph',.16,.12,.2,'#fff3bf',0,.1,.2),1,true,.08);
    P(mk('sph',.045,.045,.045,'#111',.04,.14,.28),1);face(g,arg);})
};
const START_SPOTS=[[-6,48],[6,48]];
function spotOK(x,z,r){
  if(Math.abs(x)>ARENA-r-1||Math.abs(z)>ARENA-r-1)return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(groundH(x+a,z+b)>0)return false;
  return true;
}
function place(type,x,z,arg){
  const tmpR=RAD[type]||1.1;
  if(!spotOK(x,z,tmpR))return null;
  for(const [a,b] of START_SPOTS)if(Math.hypot(x-a,z-b)<7)return null;
  return OBJ[type](x,z,arg);
}

function buildWorld(){
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)place('house',22+i*15+rand(-1,1),-60+j*14+rand(-1,1));
  addRamp(30,8,Math.PI);
  addRamp(-38,2,Math.PI);
  for(let row=0;row<4;row++)for(let k=0;k<=row;k++)place('pin',-38+(k-row/2)*3.4,-24-row*3.2);
  addRamp(-14,40,-Math.PI/2);
  for(let i=0;i<10;i++)place('tower',rand(-62,-32),rand(24,62));
  addRamp(0,-20,Math.PI);
  [[0,-52],[-3,-55],[3,-55],[0,-58],[-5,-50],[5,-50],[-2,-61],[2,-61]].forEach(([x,z])=>place('barrel',x,z));
  for(let i=0;i<6;i++)place('crates',rand(-12,12),rand(-66,-44));
  place('barrel',0,0);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+0.4;place('crates',Math.cos(a)*9,Math.sin(a)*9);}
  for(let i=0;i<6;i++)place('snowman',rand(20,62),rand(20,62));
  for(let i=0;i<10;i++)place('melon',rand(18,62),rand(18,62));
  [[44,44],[41,47],[47,41],[44,50]].forEach(([x,z])=>place('barrel',x,z));
  for(let x=-62;x<=62;x+=5){if(Math.abs(x)<14)continue;if(Math.random()<.75)place('cone',x,6.8);if(Math.random()<.75)place('cone',x,-6.8);}
  for(let z=-62;z<=62;z+=5){if(Math.abs(z)<14)continue;if(Math.random()<.6)place('cone',6.8,z);if(Math.random()<.6)place('cone',-6.8,z);}
  for(let x=-30;x<=30;x+=4.2)place('fence',x,63);
  for(let i=0;i<14;i++)place('tree',rand(-66,66)*(Math.random()<.5?1:-1)*0+rand(-66,66),pick([-66,66,rand(-66,66)]));
  for(let i=0;i<10;i++)place('crates',rand(-60,60),rand(-60,60));
  const mini=['flowers','pebble','mushroom','acorn','toyblock','can','toyduck','gnome','snail'];
  for(let i=0;i<26;i++)place(pick(mini),rand(-20,20),rand(14,44));
  for(let i=0;i<10;i++)place(pick(mini),rand(-58,58),rand(-58,58));
  for(let i=0;i<8;i++)place('bush',rand(-58,58),rand(-58,58));
  for(let i=0;i<6;i++)place('hydrant',rand(-50,50),rand(-50,50));
}

/* respawn mix: [type, weight]. Kept small so celebration drops stay easy to smash. */
const SPAWN_W=[['crates',3],['cone',2],['tower',2.2],['barrel',1.6],['house',1.2],['pin',1.2],['melon',1.5],['snowman',1],['tree',1],['hay',1.3],['mailbox',.9],['hydrant',.7],['flowers',1],['pebble',.8],['mushroom',.7],['toyblock',.7],['bush',.8]];

/* ---------- zone layouts (one 80×80 chunk each) ---------- */
/* One landmark of each kind, picked from whatever chunks the zone map currently marks.
   If the map is regenerated later, the landmarks move with it and never share a chunk. */
function pickLandmarks(rows){
  const pool={T:[],F:[],P:[]};
  for(let j=0;j<rows.length;j++){const row=rows[j];for(let i=0;i<row.length;i++)if(pool[row[i]])pool[row[i]].push([i-CHUNKS_HALF,j-CHUNKS_HALF]);}
  const used=new Set();
  function mix(ci,cj,salt){
    let x=Math.imul(ci+31,salt)^Math.imul(cj-17,salt^0x9e3779b9);
    x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return (x^(x>>>16))>>>0;
  }
  function take(letter,salt){
    let best=null,score=-1;
    for(const p of pool[letter]||[]){const k=p[0]+','+p[1];if(used.has(k))continue;const s=mix(p[0],p[1],salt);if(s>=score){score=s;best=p;}}
    if(best)used.add(best[0]+','+best[1]);return best;
  }
  return {
    boss:take('T',101),school:take('T',211),fire:take('T',307),tower:take('T',419),
    barn:take('F',503),mill:take('F',617),silo:take('F',719),farmpond:take('F',821),coop:take('F',919),
    fountain:take('P',1021),play:take('P',1117),gazebo:take('P',1223),bounce:take('P',1307),ducks:take('P',1423)
  };
}
/* Recomputed when a new world swaps zoneRows, so landmarks follow the new map. */
let LM=null,LMRows=null;
function landmarks(){const rows=(typeof zoneRows!=='undefined')?zoneRows:ZONE_MAP;if(rows!==LMRows){LMRows=rows;LM=pickLandmarks(rows);}return LM;}
const at=(p,ctx)=>!!(p&&p[0]===ctx.ci&&p[1]===ctx.cj);
function put(ctx,type,x,z,arg){return ctx.place(type,x,z,arg,RAD[type]||1.2);}
function drop(ctx,type,arg){
  const r=RAD[type]||2,m=r+5;
  const spots=[[ctx.cx,ctx.cz],[ctx.cx+16,ctx.cz+14],[ctx.cx-16,ctx.cz+14],[ctx.cx+16,ctx.cz-16],[ctx.cx-18,ctx.cz-12],[ctx.x0+m,ctx.z0+m],[ctx.x1-m,ctx.z1-m],[ctx.x0+m,ctx.z1-m],[ctx.x1-m,ctx.z0+m]];
  for(const [x,z] of spots)if(ctx.place(type,x,z,arg,r))return {x,z};
  return null;
}
function ring(ctx,x,z,rad,n,type){for(let i=0;i<n;i++){const a=i/n*Math.PI*2+0.2;put(ctx,type,x+Math.cos(a)*rad,z+Math.sin(a)*rad,i%4);}}
function crumbs(ctx,n,types){for(let i=0;i<n;i++)put(ctx,pick(types),rand(ctx.x0+7,ctx.x1-7),rand(ctx.z0+7,ctx.z1-7),Math.random()*4|0);}
function maybeRamp(ctx){if(Math.random()<0.42)ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2);}
function lotKind(){const r=Math.random();return r<.5?'cottage':r<.78?'house':r<.9?'shop':'villa';}

const ZONE_LAYOUT={
  town(ctx){
    const LM=landmarks();
    if(at(LM.boss,ctx)){const p=drop(ctx,'boss',0);if(p){ring(ctx,p.x,p.z,RAD.boss+2.6,6,'lamp');ring(ctx,p.x,p.z,RAD.boss+5.4,4,'hydrant');}crumbs(ctx,4,['parked','mailbox','bush']);return;}
    if(at(LM.school,ctx)){const p=drop(ctx,'school',0);if(p){put(ctx,'bench',p.x-4,p.z+RAD.school+2.6,0);put(ctx,'bench',p.x+4,p.z+RAD.school+2.6,0);put(ctx,'flowers',p.x,p.z+RAD.school+2.2,0);}crumbs(ctx,5,['tree','bush','lamp']);return;}
    if(at(LM.fire,ctx)){const p=drop(ctx,'firestation',0);if(p){ring(ctx,p.x,p.z,RAD.firestation+2.2,4,'hydrant');put(ctx,'parked',p.x+RAD.firestation+4,p.z,1);}crumbs(ctx,3,['cone','lamp']);return;}
    if(at(LM.tower,ctx)){const p=drop(ctx,'watertower',0);if(p)ring(ctx,p.x,p.z,RAD.watertower+4.2,5,'cottage');crumbs(ctx,4,['tree','mailbox']);return;}
    for(const z of [ctx.z0+18,ctx.z1-18]){
      for(let k=0;k<4;k++){
        const x=ctx.x0+14+k*16,kind=lotKind();
        if(put(ctx,kind,x,z,z<ctx.cz?0:2)){put(ctx,'mailbox',x+3.4,z+(z<ctx.cz?3.2:-3.2),0);if(Math.random()<.45)put(ctx,'flowers',x-2.6,z+(z<ctx.cz?2.8:-2.8),0);}
      }
    }
    for(let k=0;k<3;k++){
      const x=ctx.x0+22+k*18;
      put(ctx,'lamp',x,ctx.cz-12,0);put(ctx,'parked',x,ctx.cz+12,k%2);if(Math.random()<.5)put(ctx,'hydrant',x+5,ctx.cz-12,0);
    }
    put(ctx,'tree',ctx.x0+10,ctx.z0+10,0);put(ctx,'tree',ctx.x1-10,ctx.z1-10,0);put(ctx,'bush',ctx.x0+10,ctx.z1-12,0);
    maybeRamp(ctx);
  },
  farm(ctx){
    const LM=landmarks();
    if(at(LM.barn,ctx)){const p=drop(ctx,'barn',0);if(p){ring(ctx,p.x,p.z,RAD.barn+3,6,'hay');put(ctx,'tractor',p.x+RAD.barn+4.2,p.z+4,0);}for(let x=ctx.x0+8;x<ctx.x1-8;x+=8)put(ctx,'fence',x,ctx.z0+8,0);crumbs(ctx,4,['crops','scarecrow']);return;}
    if(at(LM.mill,ctx)){const p=drop(ctx,'windmill',0);if(p){ring(ctx,p.x,p.z,RAD.windmill+4.2,5,'crops');ctx.herd('chicken',p.x+8,p.z+6,4);}crumbs(ctx,4,['hay','flowers','bush']);return;}
    if(at(LM.silo,ctx)){const a=drop(ctx,'silo',0);if(a){put(ctx,'silo',a.x+7,a.z-6,0);put(ctx,'farmhouse',a.x-12,a.z+8,1);ring(ctx,a.x,a.z,8,4,'hay');}return;}
    if(at(LM.farmpond,ctx)){const p=drop(ctx,'pond',0);if(p){ring(ctx,p.x,p.z,RAD.pond+2.2,5,'flowers');put(ctx,'tractor',p.x+RAD.pond+4.2,p.z,1);put(ctx,'hay',p.x,p.z+RAD.pond+3,0);}crumbs(ctx,3,['tree','bush']);return;}
    if(at(LM.coop,ctx)){const p=drop(ctx,'coop',0);if(p){ctx.herd('chicken',p.x,p.z+RAD.coop+3.2,6);put(ctx,'scarecrow',p.x+6,p.z+5,0);}for(let z=ctx.z0+10;z<ctx.z1-10;z+=8)put(ctx,'fence',ctx.x0+8,z,Math.PI/2);crumbs(ctx,3,['hay','crops']);return;}
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)put(ctx,'crops',ctx.x0+18+i*18,ctx.z0+16+j*24,(i+j)%2);
    for(let x=ctx.x0+8;x<ctx.x1-8;x+=8)if(Math.random()<.8)put(ctx,'fence',x,ctx.z1-8,0);
    for(let i=0;i<4;i++)put(ctx,'hay',rand(ctx.x0+12,ctx.x1-12),rand(ctx.cz-6,ctx.z1-14),0);
    if(Math.random()<.7)put(ctx,'scarecrow',ctx.cx+rand(-8,8),ctx.cz+rand(-6,6),0);
    if(Math.random()<.45)put(ctx,'tractor',ctx.x0+16,ctx.z1-18,0);
    if(Math.random()<.55)ctx.herd('chicken',ctx.cx-4,ctx.cz+8,4);
    put(ctx,'tree',ctx.x1-12,ctx.z0+12,0);put(ctx,'bush',ctx.x0+12,ctx.z0+14,0);
    maybeRamp(ctx);
  },
  park(ctx){
    const LM=landmarks();
    if(at(LM.fountain,ctx)){const p=drop(ctx,'fountain',0);if(p){ring(ctx,p.x,p.z,RAD.fountain+2.2,4,'bench');ring(ctx,p.x,p.z,RAD.fountain+4.4,6,'flowers');}crumbs(ctx,5,['tree','bush']);return;}
    if(at(LM.play,ctx)){const p=drop(ctx,'gym',0);if(p){put(ctx,'swing',p.x+7,p.z+1,1);put(ctx,'slide',p.x-7,p.z+1,0);put(ctx,'bench',p.x+6,p.z-5,0);put(ctx,'bench',p.x-5,p.z-5,2);put(ctx,'flowers',p.x,p.z+6,0);ring(ctx,p.x,p.z,14,6,'tree');}return;}
    if(at(LM.gazebo,ctx)){const p=drop(ctx,'gazebo',0);if(p){ring(ctx,p.x,p.z,RAD.gazebo+2.4,4,'picnic');ring(ctx,p.x,p.z,RAD.gazebo+4.2,6,'flowers');}crumbs(ctx,4,['tree','bench']);return;}
    if(at(LM.bounce,ctx)){const p=drop(ctx,'bounce',0);if(p)ring(ctx,p.x,p.z,RAD.bounce+2,8,'cone');ctx.ramp(ctx.cx+18,ctx.cz,Math.PI/2);crumbs(ctx,3,['bench','flowers']);return;}
    if(at(LM.ducks,ctx)){const p=drop(ctx,'pond',0);if(p){ctx.herd('duck',p.x+RAD.pond+3,p.z,6);put(ctx,'bench',p.x+RAD.pond+2.6,p.z+2,1);put(ctx,'bench',p.x-RAD.pond-2.6,p.z-2,3);}crumbs(ctx,4,['tree','flowers','bush']);return;}
    for(let i=0;i<7;i++)put(ctx,'tree',rand(ctx.x0+8,ctx.x1-8),rand(ctx.z0+8,ctx.z1-8),0);
    for(let i=0;i<3;i++)put(ctx,'bench',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
    for(let i=0;i<2;i++)put(ctx,'picnic',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    crumbs(ctx,5,['bush','flowers','cone']);
    if(Math.random()<.3){const px=rand(ctx.x0+16,ctx.x1-16),pz=rand(ctx.z0+18,ctx.z1-16);
      for(let row=0;row<4;row++)for(let k=0;k<=row;k++)put(ctx,'pin',px+(k-row/2)*3.2,pz-row*3,0);}
    maybeRamp(ctx);
  },
  /* Dress the margin of the home chunks. The hand-built arena (inside ±HOME) rejects placement. */
  home(ctx){
    const edge=[[ctx.x0+8,ctx.cz],[ctx.x1-8,ctx.cz],[ctx.cx,ctx.z0+8],[ctx.cx,ctx.z1-8],[ctx.x0+12,ctx.z0+12],[ctx.x1-12,ctx.z0+12],[ctx.x0+12,ctx.z1-12],[ctx.x1-12,ctx.z1-12]];
    const kit=['lamp','tree','bench','mailbox','flowers','bush','hydrant','cone'];
    edge.forEach((p,i)=>put(ctx,kit[i%kit.length],p[0],p[1],i%4));
    crumbs(ctx,4,['tree','bush','flowers','hay','cone']);
  }
};
/* Scatter lists for L2c. One entry per size the zone should rain in. Landmarks stay in the layouts. */
const MICRO=['flowers','pebble','mushroom','acorn','toyblock','can','toyduck','snail'];
const ZONE_PROPS={
  town:{micro:MICRO,mini:['bush','gnome'],tiny:['hydrant','mailbox','bench'],small:['cone','lamp','pin'],medium:['barrel','crates','parked','snowman'],large:['tree','tower','shop','cottage'],huge:['house','villa'],mega:['bounce']},
  farm:{micro:['flowers','pebble','mushroom','acorn'],mini:['bush','gnome'],tiny:['mailbox'],small:['fence','crops','hay','scarecrow','cone'],medium:['melon','crates','barrel','coop'],large:['tree','tractor'],huge:['farmhouse','silo','windmill'],mega:['barn']},
  park:{micro:['flowers','pebble','mushroom','toyduck','acorn'],mini:['bush','gnome'],tiny:['bench'],small:['cone','pin','swing','slide'],medium:['picnic','snowman'],large:['tree','fountain','gym'],huge:['gazebo'],mega:['bounce']},
  home:{micro:MICRO,mini:['bush','gnome'],tiny:['hydrant','mailbox','bench'],small:['cone','pin','melon','fence'],medium:['barrel','crates','snowman'],large:['tree','tower'],huge:['house'],mega:['bounce']}
};
