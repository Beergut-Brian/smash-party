/* Smash Party — SMASHABLE OBJECTS & ARENA LAYOUT. Owner: Cursor (design). Depends on core.js helpers. */
/* ---------- smashable objects ---------- */
let objects=[];
function makeObj(x,z,r,h,points,build,opts={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const o=Object.assign({g,x,z,r,h,points,parts:[],alive:true,falling:false,fy:0,vy:0},opts);
  const P=(mesh,n=4,whole=false,half=0.5)=>{g.add(mesh);o.parts.push({mesh,n,whole,half});return mesh;};
  build(P,g,o);scene.add(g);objects.push(o);return o;
}
function pinMesh(){const g=new THREE.Group();
  g.add(mk('sph',1.3,1.9,1.3,'#ffffff',0,-0.4,0),mk('cyl',0.55,1.0,0.55,'#ffffff',0,0.75,0),mk('sph',0.8,0.9,0.8,'#ffffff',0,1.45,0),
    mk('cyl',0.6,0.14,0.6,'#e63946',0,0.85,0),mk('cyl',0.62,0.14,0.62,'#e63946',0,1.05,0));return g;}
const PASTEL=['#ffd6a5','#caffbf','#9bf6ff','#bdb2ff','#ffc6ff','#fdffb6','#ffadad'];
const ROOF=['#e63946','#3a86ff','#8338ec','#2a9d8f','#f77f00'];
const BLOCK=['#e63946','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#ff006e','#fb5607'];
const OBJ={
  crates:(x,z)=>{const k=1+(Math.random()*3|0);return makeObj(x,z,1.5,2.1*k,2*k,P=>{for(let i=0;i<k;i++){const c=mk('box',2.1,2.1,2.1,pick(['#c68b59','#b5835a','#d4a373']),0,1.05+i*2.1,0);c.rotation.y=rand(-.4,.4);P(c,5);}});},
  cone:(x,z)=>makeObj(x,z,.7,1.6,1,P=>{P(mk('cone',1.2,1.6,1.2,'#ff7b00',0,.8,0),1,true,.6);}),
  barrel:(x,z)=>makeObj(x,z,1.0,1.9,6,P=>{P(mk('cyl',1.7,1.9,1.7,'#e63946',0,.95,0),6);P(mk('cyl',1.75,.35,1.75,'#ffd60a',0,.95,0),2);P(mk('cyl',1.0,.1,1.0,'#9d0208',0,1.92,0),1);},{explosive:true}),
  tower:(x,z)=>{const k=4+(Math.random()*5|0);return makeObj(x,z,1.4,k*1.8,k,P=>{const s=Math.random()*7|0;for(let i=0;i<k;i++){const b=mk('box',1.8,1.8,1.8,BLOCK[(i+s)%7],0,.9+i*1.8,0);b.rotation.y=rand(-.25,.25);P(b,1,true,.9);}});},
  house:(x,z)=>makeObj(x,z,3.6,6.4,12,(P,g)=>{P(mk('box',5,3.6,5,pick(PASTEL),0,1.8,0),16);P(mk('pyr',7.4,2.6,7.4,pick(ROOF),0,4.9,0),8);
    P(mk('box',1.1,1.9,.15,'#7f4f24',0,.95,2.55),1);P(mk('box',1,1,.15,'#a0e7ff',-1.5,2.2,2.55),1);P(mk('box',1,1,.15,'#a0e7ff',1.5,2.2,2.55),1);
    P(mk('box',.7,1.5,.7,'#b5651d',1.4,5.6,0),2);g.rotation.y=(Math.random()*4|0)*Math.PI/2;},{big:true}),
  pin:(x,z)=>makeObj(x,z,1.1,5,3,P=>{const g=pinMesh();g.scale.setScalar(1.5);g.position.y=2.0;P(g,1,true,2.0);}),
  melon:(x,z)=>makeObj(x,z,1.1,1.6,3,P=>{P(mk('sph',2.0,1.6,1.6,'#2d6a4f',0,.8,0),6);P(mk('sph',1.7,1.3,1.3,'#ef476f',0,.8,0),7);}),
  snowman:(x,z)=>makeObj(x,z,1.3,5.6,5,P=>{P(mk('sph',2.4,2.4,2.4,'#ffffff',0,1.2,0),1,true,1.1);P(mk('sph',1.7,1.7,1.7,'#ffffff',0,3.0,0),1,true,.8);
    P(mk('sph',1.2,1.2,1.2,'#ffffff',0,4.3,0),1,true,.55);const n=mk('cone',.25,.8,.25,'#fb8500',0,4.3,.85);n.rotation.x=Math.PI/2;P(n,1);
    P(mk('cyl',1.0,.9,1.0,'#222222',0,5.2,0),1,true,.45);P(mk('sph',.18,.18,.18,'#111111',-.25,4.45,.55),1);P(mk('sph',.18,.18,.18,'#111111',.25,4.45,.55),1);}),
  tree:(x,z)=>makeObj(x,z,1.1,6,3,P=>{P(mk('cyl',.6,3,.6,'#8d5524',0,1.5,0),3);P(mk('sph',3.4,3.4,3.4,pick(['#ff006e','#06d6a0','#ffbe0b','#8338ec','#3a86ff']),0,4.4,0),1,true,1.6);}),
  fence:(x,z,ry=0)=>makeObj(x,z,2.1,1.7,2,(P,g)=>{for(let i=0;i<5;i++)P(mk('box',.35,1.7,.18,'#ffffff',-1.6+i*.8,.85,0),1,true,.4);
    P(mk('box',4,.22,.14,'#eeeeee',0,.5,-.15),2);P(mk('box',4,.22,.14,'#eeeeee',0,1.2,-.15),2);g.rotation.y=ry;})
};
const START_SPOTS=[[-6,48],[6,48]];
function spotOK(x,z,r){
  if(Math.abs(x)>ARENA-r-1||Math.abs(z)>ARENA-r-1)return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(groundH(x+a,z+b)>0)return false;
  return true;
}
function place(type,x,z,arg){
  const tmpR={house:3.6,crates:1.5,tower:1.4,pin:1.1,snowman:1.3,fence:2.1}[type]||1.1;
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
}

/* respawn mix: [type, weight] */
const SPAWN_W=[['crates',3],['cone',2],['tower',2.2],['barrel',1.6],['house',1.2],['pin',1.2],['melon',1.5],['snowman',1],['tree',1]];
