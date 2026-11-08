/* Smash Party — WORLD: smashable objects (OBJ), buildings, zone layouts, arena, respawn mix. Owner: world-props session (Claude Code design). Depends on core.js helpers. */
/* ---------- smashable objects ---------- */
let objects=[];
function makeObj(x,z,r,h,points,build,opts={}){
  const g=new THREE.Group();g.position.set(x,0,z);
  const o=Object.assign({g,x,z,r,h,points,parts:[],alive:true,falling:false,fy:0,vy:0},opts);
  const P=(mesh,n=4,whole=false,half=0.5)=>{g.add(mesh);o.parts.push({mesh,n,whole,half});return mesh;};
  build(P,g,o);scene.add(g);objects.push(o);return o;
}
function sized(x,z,r,h,points,size,build,extra){
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
  cottage:2.7,villa:4.6,shop:3.8,school:6.6,firestation:5.6,watertower:4.2,mailbox:.55,lamp:.6,hydrant:.5,
  parked:2.2,boss:6.8,barn:7.2,silo:2.5,farmhouse:4,hay:1.25,crops:2.6,pond:4.8,windmill:3.6,coop:2.4,
  scarecrow:.9,tractor:2.7,swing:1.9,slide:1.9,gym:3.2,fountain:2.9,bench:1.3,picnic:1.7,gazebo:3.8,
  bounce:5.8,skyscraper:6.6,stadium:13,ferris:6.2,ship:7,bush:.9,flowers:.32,pebble:.26,mushroom:.3,acorn:.22,toyblock:.28,can:.2,toyduck:.3,gnome:.26,snail:.28
};
/* ---------- CC0 pack models (D8b: Kenney kits, see assets/CREDITS.md) ---------- */
/* Pack models are baked by assets/props/bake.mjs into one mesh with vertex colors. Here each model is cut into
   game parts once (cached) and every copy reuses those geometries:
   - kitPieces(name,{mode:'one'})    the whole model as one part
   - kitPieces(name,{mode:'color'})  one part per color (tree trunk + leaves, flower stem + petals…)
   - kitPieces(name,{mode:'y',cuts}) horizontal bands (snowman balls)
   - kitPieces(name,{mode:'bld'})    a building: every storey cut into a KIT_GRID×KIT_GRID grid of walls
     plus the roof, so the L3 collapse contract still works (walls hold up the floors above).
   Each part's geometry is a unit box around its own center (mesh.position/scale carry it), so debris from a
   shattered part comes out the part's size, and its material color is the part's main color (debris matches).
   Single-color parts use M(color) and batch for free; multi-color parts use a vertex-color material. */
const KIT_STOREY=0.4;   // Kenney city kits: one storey = 0.4 model units
/* Walls per storey = KIT_GRID² minus the middle: 2 → 4 corner walls, 3 → 8 walls + a slab (the contract's 8–12).
   Since L16 a sleeping building draws from o.proxy (2 batches per model per chunk), so slicing finer costs nothing
   until it wakes. */
const KIT_GRID=3;
const kitSrc={},kitCut={},kitMats={};
const kitHas=name=>!!(typeof propModels!=='undefined'&&propModels[name]);
/* Per-chunk street style: every copy of a building type in one chunk shares its model, so sleeping copies draw as one
   instanced batch per model (the next chunk over gets a different look). Colors are per house and free: roof caps
   are plain M() colors and walls are userData.plainVC, both batched with a per-instance color (L16). */
function kitHash(x,z,salt){const ci=Math.round(x/CHUNK),cj=Math.round(z/CHUNK);let h=Math.imul((ci+97)*73856093^(cj+89)*19349663,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b);
  h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return (h>>>0)/4294967296;}
const kitAt=(list,x,z,salt)=>{const ok=(list||[]).filter(kitHas);return ok.length?ok[Math.floor(kitHash(x,z,salt)*ok.length)]:null;};
// small props: each chunk stocks two of a type's models (seeded pick between them), same reason as kitAt
function kitNear(list,x,z){const ok=(list||[]).filter(kitHas);if(ok.length<3)return ok.length?pick(ok):null;
  const salt=list.length*131+list[0].length,i=Math.floor(kitHash(x,z,salt)*ok.length),j=(i+1+Math.floor(kitHash(x,z,salt+1)*(ok.length-1)))%ok.length;
  return Math.random()<.5?ok[i]:ok[j];}
const kitGreen=p=>p[7]>p[6]*1.3&&p[7]>p[8]*1.05; // the city kits' green accent (roofs, awnings)
// triangle soup of the model, feet at y=0 and footprint centered: [[x,y,z,nx,ny,nz,r,g,b]×3, …]
function kitTris(name){
  if(kitSrc[name])return kitSrc[name];
  const root=prop(name);root.updateMatrixWorld(true);const T=[],v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();
  root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,pa=g.attributes.position,na=g.attributes.normal,ca=g.attributes.color,ix=g.index,mc=m.material.color||new THREE.Color(1,1,1);
    nm.getNormalMatrix(m.matrixWorld);const cnt=ix?ix.count:pa.count;let tri=[];
    for(let k=0;k<cnt;k++){const i=ix?ix.getX(k):k;v.fromBufferAttribute(pa,i).applyMatrix4(m.matrixWorld);
      if(na)n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();else n.set(0,1,0);
      tri.push([v.x,v.y,v.z,n.x,n.y,n.z,ca?ca.getX(i)*mc.r:mc.r,ca?ca.getY(i)*mc.g:mc.g,ca?ca.getZ(i)*mc.b:mc.b]);
      if(tri.length===3){T.push(tri);tri=[];}}});
  let x0=1e9,x1=-1e9,y0=1e9,z0=1e9,z1=-1e9;
  for(const t of T)for(const p of t){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);z0=Math.min(z0,p[2]);z1=Math.max(z1,p[2]);}
  const cx=(x0+x1)/2,cz=(z0+z1)/2;for(const t of T)for(const p of t){p[0]-=cx;p[1]-=y0;p[2]-=cz;}
  return kitSrc[name]=T;
}
function kitBox(T){const b=[1e9,1e9,1e9,-1e9,-1e9,-1e9];for(const t of T)for(const p of t)for(let k=0;k<3;k++){b[k]=Math.min(b[k],p[k]);b[k+3]=Math.max(b[k+3],p[k]);}return b;}
const kitMid=(t,k)=>(t[0][k]+t[1][k]+t[2][k])/3;
// split triangles by the plane (axis ax = c); returns [below, above]
function kitClip(T,ax,c){
  const lo=[],hi=[],lerp=(a,b,f)=>a.map((x,i)=>x+(b[i]-x)*f);
  for(const t of T){
    const s=t.map(p=>p[ax]-c);
    if(s.every(d=>d<=1e-6)){lo.push(t);continue;}if(s.every(d=>d>=-1e-6)){hi.push(t);continue;}
    const A=[],B=[];
    for(let i=0;i<3;i++){const p=t[i],q=t[(i+1)%3],sp=s[i],sq=s[(i+1)%3];
      if(sp<=0)A.push(p);if(sp>=0)B.push(p);
      if((sp<0&&sq>0)||(sp>0&&sq<0)){const m=lerp(p,q,sp/(sp-sq));A.push(m);B.push(m);}}
    for(const [poly,out] of [[A,lo],[B,hi]])for(let i=1;i+1<poly.length;i++)out.push([poly[0],poly[i],poly[i+1]]);
  }
  return [lo,hi];
}
const kitArea=t=>{const a=t[0],b=t[1],c=t[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  return Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)/2;};
// one part: unit-box geometry around its center + its main color (D). Vertex colors are stored divided by D, so
// material color D (times a tint) brings them back, and debris (which takes the material color) comes out D.
function kitPiece(T,key){
  const b=kitBox(T),cen=[(b[0]+b[3])/2,(b[1]+b[4])/2,(b[2]+b[5])/2],sz=[0,1,2].map(k=>Math.max(0.02,b[k+3]-b[k]));
  const hist=new Map();let best=T[0][0],bw=-1;
  for(const t of T){const a=kitArea(t)+1e-9;for(const p of t){const q=((p[6]*24)|0)+','+((p[7]*24)|0)+','+((p[8]*24)|0);const e=hist.get(q)||{w:0,c:p};e.w+=a;hist.set(q,e);if(e.w>bw){bw=e.w;best=e.c;}}}
  const D=[best[6],best[7],best[8]].map(x=>Math.max(0.02,x));
  let flat=true;for(const t of T){for(const p of t)if(Math.abs(p[6]-D[0])>0.04||Math.abs(p[7]-D[1])>0.04||Math.abs(p[8]-D[2])>0.04){flat=false;break;}if(!flat)break;}
  const n=T.length*3,P=new Float32Array(n*3),N=new Float32Array(n*3),C=flat?null:new Float32Array(n*3);let i=0;
  for(const t of T)for(const p of t){
    for(let k=0;k<3;k++)P[i+k]=(p[k]-cen[k])/sz[k];
    const nx=p[3]*sz[0],ny=p[4]*sz[1],nz=p[5]*sz[2],l=Math.hypot(nx,ny,nz)||1;N[i]=nx/l;N[i+1]=ny/l;N[i+2]=nz/l;
    if(C)for(let k=0;k<3;k++)C[i+k]=p[6+k]/D[k];
    i+=3;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));
  if(C)geo.setAttribute('color',new THREE.BufferAttribute(C,3));geo.computeBoundingSphere();geo.userData.kit=key;
  return {geo,key,cen,sz,D,flat,area:T.reduce((s,t)=>s+kitArea(t),0)};
}
/* o: {mode, s (scale), ry (quarter turns), cuts (mode 'y': heights as fractions of the model), floors, eave, noCap, grid (mode 'bld')} */
function kitPieces(name,o={}){
  // the cut is the same at every scale (parts are unit boxes), so geometry is shared by every size of a model
  const s=o.s||1,id=name+'|'+JSON.stringify(Object.assign({},o,{s:1}));
  if(!kitCut[id])kitCut[id]=kitCutUp(name,o);
  return s===1?kitCut[id]:kitCut[id].map(p=>Object.assign({},p,{cen:p.cen.map(v=>v*s),sz:p.sz.map(v=>v*s)}));
}
function kitCutUp(name,o){
  const s=1,ry=(o.ry||0)*Math.PI/2,cs=Math.cos(ry),sn=Math.sin(ry),src=kitTris(name);
  let T=src.map(t=>t.map(p=>{const x=p[0]*s,z=p[2]*s;return [x*cs+z*sn,p[1]*s,-x*sn+z*cs,p[3]*cs+p[5]*sn,p[4],-p[3]*sn+p[5]*cs,p[6],p[7],p[8]];}));
  const groups=new Map(),add=(k,t)=>{let g=groups.get(k);if(!g)groups.set(k,g=[]);g.push(t);};
  if(o.mode==='color'){
    for(const t of T){const c=t[0];add(((c[6]*12)|0)+','+((c[7]*12)|0)+','+((c[8]*12)|0),t);}
  }else if(o.mode==='y'){
    const H=kitBox(T)[4];let rest=T;const cuts=o.cuts||[0.5];
    cuts.forEach((f,i)=>{const [lo,hi]=kitClip(rest,1,f*H);lo.forEach(t=>add('y'+i,t));rest=hi;});rest.forEach(t=>add('y'+cuts.length,t));
  }else if(o.mode==='bld'){
    // walls: everything below the eave except the green accent; roof: the accent (turned white so it takes the
    // roof tint) plus everything above the eave (gables, chimneys, flat-roof parapets)
    // o.eave (models outside the city kits): the roof starts at this fraction of the model's height, storeys split it evenly
    const fl=o.floors||1,base=o.eave?0:0.04*s,st=o.eave?o.eave*kitBox(T)[4]/fl:KIT_STOREY*s,eave=fl*st+base;let walls=[],roof=[];
    // the accent up top becomes one flat white piece: a plain M() color, so each house can get its own roof color for
    // free. Accent lower down (porch roofs, planters) stays with the walls, whitened so it takes the wall color.
    const cap=[],white=t=>t.map(p=>{const l=Math.max(p[6],p[7],p[8]);return p.slice(0,6).concat([l,l,l]);});
    T.forEach((t,i)=>{const acc=!o.noCap&&kitGreen(src[i][0]); // noCap: the model has no green city-kit roof accent
      if(acc&&kitMid(t,1)>eave-st*0.3){cap.push(t.map(p=>p.slice(0,6).concat([1,1,1])));return;}
      const [lo,hi]=kitClip([acc?white(t):t],1,eave);walls.push(...lo);roof.push(...hi);});
    for(const t of cap)add('roof|'+fl+'|cap',t);
    // KIT_GRID×KIT_GRID cells per storey: the outer ones are walls, a middle one (3×3 only) is the slab
    const b=kitBox(walls.length?walls:T),G=o.grid||KIT_GRID,xc=[],zc=[];for(let i=1;i<G;i++){xc.push(b[0]+(b[3]-b[0])*i/G);zc.push(b[2]+(b[5]-b[2])*i/G);}
    const cell=(v,cs)=>{let i=0;while(i<cs.length&&v>=cs[i])i++;return i;};
    for(let f=1;f<fl;f++)walls=kitClip(walls,1,f*st+base).flat();
    for(const c of xc)walls=kitClip(walls,0,c).flat();for(const c of zc)walls=kitClip(walls,2,c).flat();
    for(const t of walls){const f=clamp(Math.floor((kitMid(t,1)-base)/st),0,fl-1),ix=cell(kitMid(t,0),xc),iz=cell(kitMid(t,2),zc);
      add(ix>0&&ix<G-1&&iz>0&&iz<G-1?'slab|'+f:'wall|'+f+'|'+ix+iz,t);}
    for(const t of roof)add('roof|'+fl,t); // the rest above the eave (gables, chimneys, parapets) as one piece
  }else T.forEach(t=>add('all',t));
  const out=[];for(const [k,g] of groups){const p=kitPiece(g,k),bits=k.split("|");p.geo.userData.kit=name+"|"+k;if(o.mode==='bld'){p.kind=bits[0];p.floor=+bits[1];}out.push(p);}
  out.sort((a,b)=>b.area-a.area);
  return out;
}
function kitMesh(pc,tint){
  const t=new THREE.Color(tint||'#ffffff'),c=new THREE.Color(pc.D[0]*t.r,pc.D[1]*t.g,pc.D[2]*t.b),hex='#'+c.getHexString(); // THREE.Color is linear, like the vertex colors
  const mat=pc.flat?M(hex):kitVCMat(hex);
  const m=new THREE.Mesh(pc.geo,mat);m.position.set(pc.cen[0],pc.cen[1],pc.cen[2]);m.scale.set(pc.sz[0],pc.sz[1],pc.sz[2]);
  m.castShadow=true;m.receiveShadow=true;return m;
}
// scale that fits a model's footprint into a circle of radius r (the placement radius in RAD), or its height to h
function kitFit(name,r){const b=kitBox(kitTris(name));return r*1.9/Math.hypot(b[3]-b[0],b[5]-b[2]);}
function kitFitH(name,h){return h/Math.max(0.01,kitBox(kitTris(name))[4]);}
// storeys under the roof: suburban houses carry ~0.3 of pitched roof on top, commercial blocks a thin parapet
const kitFloors=name=>{const h=kitBox(kitTris(name))[4];return Math.max(1,/^commercial/.test(name)?Math.floor((h-0.05)/KIT_STOREY):Math.round((h-0.3)/KIT_STOREY));};
// vertex-color material; userData.plainVC = only its color differs (for logic's instanced batching, see KIT_GRID)
function kitVCMat(hex){let m=kitMats[hex];if(!m){m=kitMats[hex]=litMat({color:hex,vertexColors:true});m.userData.plainVC=true;}return m;}
/* building from a city-kit model with the L3 part contract. Returns the sleep proxy (see kitProxy). */
function kitBuilding(P,name,s,wall,roof,floors,cut){
  floors=floors||kitFloors(name);
  for(const pc of kitPieces(name,Object.assign({mode:'bld',s,floors},cut)))
    P(BP(kitMesh(pc,/\|cap$/.test(pc.key)?roof:wall),pc.floor,pc.kind),pc.kind==='roof'?4:2);
  return kitProxy(name,s,wall,roof,floors,cut);
}
/* Sleep proxy: the intact building as just two meshes (everything in the wall color merged into one vertex-colored
   mesh + the roof cap in its flat roof color), in the object's local space and NOT added to it. Geometry is cached
   per model, so every copy of a model shares it. Handed to logic as o.proxy: while a building is asleep and has
   lost no parts, drawing o.proxy instead of its parts makes it 2 draw calls per model per chunk however finely it is
   sliced (NEEDS LOGIC task in TASKS.md). */
const kitProxyGeo={};
function kitProxy(name,s,wall,roof,floors,cut){
  const id=name+'|'+floors+JSON.stringify(cut||{});let G=kitProxyGeo[id];
  if(!G){const parts={rest:[],cap:[]},m=new THREE.Matrix4();
    for(const pc of kitPieces(name,Object.assign({mode:'bld',s:1,floors},cut))){
      const g=pc.geo.clone().applyMatrix4(m.compose(new THREE.Vector3(...pc.cen),new THREE.Quaternion(),new THREE.Vector3(...pc.sz)));
      const cap=/\|cap$/.test(pc.key),n=g.attributes.position.count,c=new Float32Array(n*3),src=g.attributes.color;
      for(let i=0;i<n;i++)for(let k=0;k<3;k++)c[i*3+k]=cap?1:(src?src.array[i*3+k]:1)*pc.D[k];
      if(cap)g.deleteAttribute('color');else g.setAttribute('color',new THREE.BufferAttribute(c,3));
      parts[cap?'cap':'rest'].push(g);}
    G=kitProxyGeo[id]={rest:parts.rest.length?THREE.mergeGeometries(parts.rest):null,cap:parts.cap.length?THREE.mergeGeometries(parts.cap):null};}
  const out=[];
  if(G.rest){const r=new THREE.Mesh(G.rest,kitVCMat('#'+new THREE.Color(wall||'#ffffff').getHexString()));out.push(r);}
  if(G.cap)out.push(new THREE.Mesh(G.cap,M(roof||'#ffffff')));
  for(const m of out){m.scale.setScalar(s);m.castShadow=m.receiveShadow=true;}
  return out;
}
/* a small prop. opts: cut (kitPieces options), n (chunks), whole (fly off intact, default true), tint(piece,i) */
function kitProp(P,name,s,o={}){
  const pcs=kitPieces(name,Object.assign({mode:'one',s},o.cut||{}));
  pcs.forEach((pc,i)=>P(kitMesh(pc,(o.tint&&o.tint(pc,i))||null),o.n||1,o.whole!==false,Math.max(.08,Math.min(pc.sz[0],pc.sz[1],pc.sz[2])/2)));
  return pcs;
}
/* Kenney models (assets/props/props.json) behind each smashable. If none of a type's models loaded, the block
   version below is used instead, so the game still runs from file:// or with a missing file. */
const KIT={
  cottage:['suburban-g','suburban-h','suburban-i','suburban-m'],
  house:['suburban-b','suburban-c','suburban-d','suburban-e','suburban-f','suburban-k','suburban-n','suburban-o','suburban-r','suburban-s','suburban-t','suburban-u'],
  villa:['suburban-b','suburban-d','suburban-f','suburban-n','suburban-t'], // only used if no house model loads
  farmhouse:['suburban-e','suburban-r','suburban-u'],
  shop:['commercial-c','commercial-e'],
  boss:['commercial-l'],
  tree:['tree-default','tree-oak','tree-fat','tree-detailed','tree-tall'],
  bush:['bush','bush-detailed','bush-large'],
  flowers:['flower-red','flower-yellow','flower-purple'],
  mushroom:['mushroom-red','mushroom-tan'],
  pebble:['stone-small','rock-small'],
  lamp:['lamp-square','lamp-curved'],
  cone:['traffic-cone'],
  bench:['bench'],
  parked:['car-sedan','car-van','car-taxi','car-suv','car-police','car-delivery','car-truck'],
  tractor:['car-tractor'],
  fence:['fence-simple','fence-planks'],
  crops:['crop-corn','crop-wheat','crop-pumpkin','crop-carrot','crop-leafs'],
  melon:['crop-melon'],
  snowman:['snowman'],
  fountain:['fountain'],
  windmill:['windmill-blades'],
  // D8c: the last block-built landmarks (cozy-farm barns, KayKit water tower, Kenney modular/racing/pirate/minigolf/skate kits)
  barn:['barn-red','barn-big'],
  school:['school-a'],
  firestation:['garage-red'],
  watertower:['watertower'],
  silo:['silo-tall'],
  gazebo:['pavilion'],
  bounce:['castle-mini'],
  slide:['slide-chute'],
  gym:['climb-frame'],
  // D7 mega set pieces
  skyscraper:['tower-a','tower-c','tower-d'],
  stadium:['grandstand'],
  ship:['ship-large']
};
/* merge a group of mk() blocks into one geometry with their colors as vertex colors (cached: every wheel is the same) */
let ferrisCache=null;
function ferrisGeo(grp){return ferrisCache||(ferrisCache=blocksGeo(grp));}
function blocksGeo(grp){
  const list=[];grp.updateMatrixWorld(true);
  grp.traverse(m=>{if(!m.isMesh)return;const g=m.geometry.clone().toNonIndexed().applyMatrix4(m.matrixWorld),n=g.attributes.position.count,c=new Float32Array(n*3),col=m.material.color;
    for(let i=0;i<n;i++){c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));g.deleteAttribute('uv');list.push(g);});
  return THREE.mergeGeometries(list);
}
const LEAVES=['#3fb950','#2d8f4e','#52b788','#3fb950','#74c69d','#f7a325','#ff70a6','#9b5de5']; // mostly green, a few candy trees
/* Chickens and ducks are herds (ctx.herd), not smashables, so L4 launches them. */
const OBJ={
  crates:(x,z)=>{const k=1+(Math.random()*3|0);return makeObj(x,z,1.5,2.1*k,2*k,P=>{for(let i=0;i<k;i++){const c=mk('box',2.1,2.1,2.1,pick(['#c68b59','#b5835a','#d4a373']),0,1.05+i*2.1,0);c.rotation.y=rand(-.4,.4);P(c,5);}},{size:'medium'});},
  cone:(x,z)=>makeObj(x,z,.7,1.6,1,P=>{P(mk('cone',1.2,1.6,1.2,'#ff7b00',0,.8,0),1,true,.6);},{size:'small'}),
  barrel:(x,z)=>makeObj(x,z,1.0,1.9,6,P=>{P(mk('cyl',1.7,1.9,1.7,'#e63946',0,.95,0),6);P(mk('cyl',1.75,.35,1.75,'#ffd60a',0,.95,0),2);P(mk('cyl',1.0,.1,1.0,'#9d0208',0,1.92,0),1);},{explosive:true,size:'medium'}),
  tower:(x,z)=>{const k=4+(Math.random()*5|0);return makeObj(x,z,1.4,k*1.8,k,P=>{const s=Math.random()*7|0;for(let i=0;i<k;i++){const b=mk('box',1.8,1.8,1.8,BLOCK[(i+s)%7],0,.9+i*1.8,0);b.rotation.y=rand(-.25,.25);P(b,1,true,.9);}},{size:'large',big:true});},
  house:(x,z)=>sized(x,z,3.6,6.2,14,'huge',(P,g)=>{
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
  cottage:(x,z,arg)=>sized(x,z,RAD.cottage,4.4,6,'large',(P,g)=>{
    const wall=pick(PASTEL),rf=pick(ROOF);
    story(P,3.8,3.8,2.4,0,0,wall,2);
    P(BP(mk('box',.8,1.3,.14,'#7f4f24',0,.65,1.8),0,'extra'),1,true,.3);
    P(BP(mk('box',.7,.7,.12,'#a0e7ff',-1,1.5,1.85),0,'extra'),1,true,.2);
    roofOf(P,5,5,1.6,3.2,1,rf);face(g,arg);
  },{building:true}),
  villa:(x,z,arg)=>sized(x,z,RAD.villa,8,18,'huge',(P,g)=>{
    const wall=pick(PASTEL),rf=pick(ROOF);
    story(P,6.6,5.4,2.8,0,0,'#f8f9fa',2);slab(P,6.2,5,2.8,0,'#fff');
    story(P,4.2,3.8,2.2,2.8,1,wall,2);
    P(BP(mk('box',1.1,1.8,.14,'#7f4f24',0,.9,2.6),0,'extra'),1,true,.35);
    roofOf(P,7.4,6.2,2,6.1,2,rf);P(BP(mk('box',.55,1.2,.55,'#b5651d',2,6.6,0),2,'extra'),1,true,.3);face(g,arg);
  },{building:true}),
  shop:(x,z,arg)=>sized(x,z,RAD.shop,5.2,10,'large',(P,g)=>{
    story(P,5.8,4.6,2.8,0,0,'#fff3bf',2);
    P(BP(mk('box',6.2,.3,1.4,'#e63946',0,2.95,1.7),0,'extra'),1,true,.3);
    P(BP(mk('box',2,1.4,.12,'#8ecae6',-1.3,1.6,2.2),0,'extra'),1,true,.25);
    P(BP(mk('box',2,1.4,.12,'#8ecae6',1.3,1.6,2.2),0,'extra'),1,true,.25);
    P(BP(mk('box',1.05,1.7,.12,'#6f4e37',0,.85,2.2),0,'extra'),1,true,.3);
    P(BP(mk('box',2.2,.6,.1,pick(BLOCK),0,3.5,1.9),1,'extra'),1,true,.25);
    roofOf(P,6.4,5.2,1.2,3.6,1,pick(ROOF));face(g,arg);
  },{building:true}),
  school:(x,z,arg)=>sized(x,z,RAD.school,8,22,'huge',(P,g)=>{
    story(P,11.2,5.2,3.4,0,0,'#f8f1e3',3);slab(P,10.8,4.8,3.4,0,'#fff');
    story(P,3.4,4,2.4,3.4,1,'#f8f1e3',2);
    P(BP(mk('box',1.4,2,.14,'#6f4e37',0,1,2.5),0,'extra'),1,true,.35);
    for(let i=-2;i<=2;i++)if(i)P(BP(mk('box',1.05,1.05,.12,'#90e0ef',i*2,2.1,2.55),0,'extra'),1,true,.2);
    roofOf(P,4.4,4.6,1.5,6.6,2,'#e07a5f');
    P(BP(mk('cyl',.08,1.6,.08,'#ddd',1.2,7.4,0),2,'extra'),1);
    P(BP(mk('box',.65,.35,.06,'#ffbe0b',1.55,7.9,0),2,'extra'),1,true,.15);face(g,arg);
  },{building:true}),
  firestation:(x,z,arg)=>sized(x,z,RAD.firestation,8,20,'huge',(P,g)=>{
    story(P,9,5.8,3.6,0,0,'#d62828',3);
    P(BP(mk('box',9.2,.3,6,'#fff',0,2.1,0),0,'extra'),1,true,.3);
    P(BP(mk('box',2.2,2.2,.14,'#1d3557',-2.2,1.2,2.8),0,'extra'),1,true,.4);
    P(BP(mk('box',2.2,2.2,.14,'#1d3557',2.2,1.2,2.8),0,'extra'),1,true,.4);
    story(P,2.8,2.8,2.6,3.6,1,'#d62828',2);slab(P,2.6,2.6,6.2,1,'#fff');
    P(BP(mk('box',.4,.3,.3,null,-1.2,6.5,-.6,glow('#ff1e1e')),1,'extra'),1);face(g,arg);
  },{building:true}),
  watertower:(x,z)=>sized(x,z,RAD.watertower,13,16,'huge',P=>{
    [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]].forEach(([x,z])=>P(mk('cyl',.26,7.2,.26,'#ced4da',x,3.6,z),2));
    P(mk('cyl',3.3,2.8,3.3,'#4895ef',0,8.4,0),5);P(mk('cyl',3.45,.4,3.45,'#fff',0,9.5,0),2);P(mk('cone',3,1.4,3,'#e63946',0,10.6,0),3);
    P(mk('box',.9,.45,.1,'#ffd60a',0,8.4,1.7),1);}),
  mailbox:(x,z,arg)=>sized(x,z,RAD.mailbox,1.5,1,'tiny',(P,g)=>{
    P(mk('box',.14,1,.14,'#6d4c41',0,.5,0),1);P(mk('box',.62,.4,.85,pick(['#3a86ff','#e63946','#2a9d8f']),0,1.15,0),1,true,.3);
    P(mk('box',.08,.26,.22,'#ffbe0b',.36,1.28,0),1);face(g,arg);}),
  lamp:(x,z)=>sized(x,z,RAD.lamp,4.2,2,'small',P=>{
    P(mk('cyl',.16,3.2,.16,'#343a40',0,1.6,0),2);P(mk('box',.7,.22,.7,'#343a40',0,3.3,0),1);
    P(mk('box',.5,.32,.5,null,0,3.05,0,glow('#fff6a0')),1,true,.25);}),
  hydrant:(x,z)=>sized(x,z,RAD.hydrant,1.15,1,'tiny',P=>{
    P(mk('cyl',.42,.85,.42,'#e63946',0,.45,0),2);P(mk('cyl',.26,.24,.26,'#ffd60a',0,.95,0),1);
    const a=mk('cyl',.14,.4,.14,'#dee2e6',.32,.5,0);a.rotation.z=Math.PI/2;P(a,1);
    const b=mk('cyl',.14,.4,.14,'#dee2e6',-.32,.5,0);b.rotation.z=Math.PI/2;P(b,1);}),
  parked:(x,z,arg)=>sized(x,z,RAD.parked,2.2,4,'medium',(P,g)=>{
    const body=pick(CAR_COLORS),van=Math.random()<.35;
    P(mk('box',1.7,.65,3.5,body,0,.8,0),5);P(mk('box',1.55,van?1.15:.65,van?2.2:1.5,'#edf2fb',0,van?1.45:1.35,van?-.15:.35),3);
    [[-.8,1.15],[.8,1.15],[-.8,-1.15],[.8,-1.15]].forEach(([x,z])=>P(mk('wheel',.32,.62,.62,'#222',x,.32,z),1,true,.28));
    P(mk('box',.32,.18,.08,null,-.45,.78,1.78,glow('#fff6a0')),1);P(mk('box',.32,.18,.08,null,.45,.78,1.78,glow('#fff6a0')),1);face(g,arg);}),
  boss:(x,z,arg)=>sized(x,z,RAD.boss,16,40,'mega',(P,g)=>{
    const cols=['#f4a261','#e9c46a','#2a9d8f','#e76f51'];
    for(let i=0;i<4;i++){const w=10-i*1.5;story(P,w,w,2.5,i*2.6,i,cols[i],2);
      P(BP(mk('box',1.15,.7,.16,'#caf0f8',-w*.18,i*2.6+1.35,w/2+.05),i,'extra'),1,true,.2);
      P(BP(mk('box',1.15,.7,.16,'#caf0f8',w*.18,i*2.6+1.35,w/2+.05),i,'extra'),1,true,.2);}
    roofOf(P,6.2,6.2,2.4,11.5,4,'#e63946');
    P(BP(mk('cyl',.16,1.5,.16,'#dee2e6',0,12.6,0),4,'extra'),1);P(BP(mk('sph',.55,.55,.55,'#ffd60a',0,13.5,0),4,'extra'),1,true,.25);face(g,arg);
  },{building:true}),
  barn:(x,z,arg)=>sized(x,z,RAD.barn,9,32,'mega',(P,g)=>{
    story(P,11,7,4.6,0,0,'#c1121f',3);
    P(BP(mk('box',11.2,.35,7.2,'#f8f9fa',0,3.4,0),0,'extra'),1,true,.4);
    P(BP(mk('box',2.8,3,.14,'#f8f9fa',0,1.6,3.4),0,'extra'),1,true,.5);
    const x1=mk('box',2.6,.18,.08,'#c1121f',0,1.6,3.5);x1.rotation.z=.75;P(BP(x1,0,'extra'),1,true,.3);
    const x2=mk('box',2.6,.18,.08,'#c1121f',0,1.6,3.52);x2.rotation.z=-.75;P(BP(x2,0,'extra'),1,true,.3);
    roofOf(P,12,8,2.6,6.2,1,'#6d4c41');P(BP(mk('box',1.3,1.3,1.3,'#f8f9fa',0,7.4,0),1,'extra'),1,true,.4);face(g,arg);
  },{building:true}),
  silo:(x,z)=>sized(x,z,RAD.silo,12,14,'huge',P=>{
    P(mk('cyl',4,8.4,4,'#dee2e6',0,4.2,0),6);P(mk('cyl',4.15,.4,4.15,'#e63946',0,6.6,0),2);P(mk('sph',4,2.2,4,'#f8f9fa',0,9,0),3);
    P(mk('box',1.1,1.8,.1,'#6d4c41',0,1.1,2.05),1);}),
  farmhouse:(x,z,arg)=>sized(x,z,RAD.farmhouse,6.4,12,'huge',(P,g)=>{
    story(P,5.8,4.6,3,0,0,'#f8f9fa',2);
    P(BP(mk('box',1,.1,1.4,'#c1121f',0,.55,2.5),0,'extra'),1,true,.25);
    P(BP(mk('box',.95,1.7,.12,'#6f4e37',0,.85,2.2),0,'extra'),1,true,.3);
    P(BP(mk('box',.8,.8,.12,'#90e0ef',-1.5,1.8,2.25),0,'extra'),1,true,.2);
    P(BP(mk('box',.8,.8,.12,'#90e0ef',1.5,1.8,2.25),0,'extra'),1,true,.2);
    roofOf(P,7,5.6,2,4.1,1,'#2a9d8f');P(BP(mk('cyl',.3,1,.3,'#6d4c41',1.8,4.6,0),1,'extra'),1,true,.25);face(g,arg);
  },{building:true}),
  hay:(x,z)=>sized(x,z,RAD.hay,1.6,2,'small',P=>{
    const b=new THREE.Group();
    const body=mk('cyl',1.55,1.45,1.55,'#e9c46a',0,.8,0);body.rotation.z=Math.PI/2;b.add(body);
    const band=mk('cyl',1.62,.2,1.62,'#bc6c25',0,.8,0);band.rotation.z=Math.PI/2;b.add(band);
    P(b,1,true,.8);
  },{roll:true}),
  crops:(x,z,arg)=>sized(x,z,RAD.crops,1.2,3,'small',(P,g)=>{
    P(mk('box',4.4,.22,2,'#bc6c25',0,.11,0),2);const corn=Math.random()<.5;
    for(let i=-2;i<=2;i++)P(mk(corn?'cone':'sph',.5,.65,.5,corn?'#ffd60a':'#70e000',i*.8,.5,0),1,true,.25);face(g,arg);}),
  pond:(x,z)=>sized(x,z,RAD.pond,.7,8,'medium',P=>{
    P(mk('cyl',9, .28,9,'#48cae4',0,.16,0),5);P(mk('cyl',7.2,.1,7.2,'#0096c7',0,.32,0),3);
    [[1.8,.8],[-1.4,1.5],[.2,-1.6]].forEach(([x,z])=>P(mk('cyl',1,.08,1,'#2d6a4f',x,.42,z),1,true,.2));}),
  windmill:(x,z,arg)=>sized(x,z,RAD.windmill,12,16,'huge',(P,g)=>{
    P(mk('cyl',2.1,6.4,2.1,'#f4f1de',0,3.2,0),6);P(mk('cone',2.5,1.8,2.5,'#e07a5f',0,7.2,0),3);P(mk('box',.35,.35,1,'#6d4c41',0,5.4,1.15),1);
    const hub=mk('cyl',.45,.4,.45,'#333',0,5.5,1.55);hub.rotation.x=Math.PI/2;P(hub,1,true,.25);
    for(let i=0;i<4;i++){const b=mk('box',.28,3.6,.1,'#f8f4e3',0,5.5,1.7);b.rotation.z=i*Math.PI/2;P(b,1,true,.3);}
    face(g,arg);}),
  coop:(x,z,arg)=>sized(x,z,RAD.coop,3.2,6,'medium',(P,g)=>{
    P(mk('box',3.4,2,3,'#f4a261',0,1,0),5);P(mk('pyr',4.2,1.2,3.8,'#6d4c41',0,2.4,0),3);P(mk('box',.65,.7,.08,'#6d4c41',.7,.6,1.54),1);
    const ramp=mk('box',.7,.1,1.3,'#ddb892',.7,.32,2.05);ramp.rotation.x=-.45;P(ramp,1);face(g,arg);}),
  scarecrow:(x,z,arg)=>sized(x,z,RAD.scarecrow,3.3,2,'small',(P,g)=>{
    const b=new THREE.Group();
    b.add(mk('cyl',.12,2.5,.12,'#6d4c41',0,1.25,0),mk('box',1.7,.1,.1,'#6d4c41',0,1.9,0),mk('sph',.65,.65,.65,'#e9c46a',0,2.45,0),mk('cyl',.5,.35,.5,'#3a86ff',0,2.8,0));
    b.add(mk('sph',.14,.14,.14,'#111',-.12,2.5,.28),mk('sph',.14,.14,.14,'#111',.12,2.5,.28));
    P(b,1,true,.65);face(g,arg);}),
  tractor:(x,z,arg)=>sized(x,z,RAD.tractor,2.6,8,'large',(P,g)=>{
    P(mk('box',1.5,.75,2.5,'#2d6a4f',0,.85,.15),4);P(mk('box',1.25,1,1.15,'#95d5b2',0,1.6,.65),3);P(mk('cyl',.18,.6,.18,'#333',0,2.25,-.4),1);
    P(mk('wheel',.4,1.45,1.45,'#222',-.85,.72,-.65),1,true,.55);P(mk('wheel',.4,1.45,1.45,'#222',.85,.72,-.65),1,true,.55);
    P(mk('wheel',.28,.75,.75,'#ffd60a',-.72,.42,1.05),1,true,.32);P(mk('wheel',.28,.75,.75,'#ffd60a',.72,.42,1.05),1,true,.32);face(g,arg);}),
  swing:(x,z,arg)=>sized(x,z,RAD.swing,3.6,4,'small',(P,g)=>{
    [[-1.55,-.75],[1.55,-.75],[-1.55,.75],[1.55,.75]].forEach(([x,z])=>P(mk('box',.28,3.3,.28,'#457b9d',x,1.65,z),1));
    P(mk('box',3.5,.26,.26,'#1d3557',0,3.25,0),1);
    [-.6,.6].forEach((x,i)=>{P(mk('box',.1,1.6,.1,'#ced4da',x-.28,2.3,0),1);P(mk('box',.1,1.6,.1,'#ced4da',x+.28,2.3,0),1);
      P(mk('box',.85,.22,.55,i?'#ffbe0b':'#e63946',x,1.4,0),1,true,.3);});face(g,arg);}),
  slide:(x,z,arg)=>sized(x,z,RAD.slide,2.5,4,'small',(P,g)=>{
    P(mk('box',1.3,1.45,1.1,'#3a86ff',0,.72,-.7),3);const chute=mk('box',1.2,.16,2.6,'#ffbe0b',0,1.05,.65);chute.rotation.x=-.5;P(chute,2);
    P(mk('box',.1,1.3,.1,'#1d3557',-.5,.65,-.7),1);P(mk('box',.1,1.3,.1,'#1d3557',.5,.65,-.7),1);face(g,arg);}),
  gym:(x,z,arg)=>sized(x,z,RAD.gym,5.2,8,'large',(P,g)=>{
    const cols=['#e63946','#ffbe0b','#3a86ff','#06d6a0'];
    [[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]].forEach(([x,z],i)=>P(mk('cyl',.28,4.4,.28,cols[i],x,2.2,z),2));
    P(mk('box',4.2,.28,4.2,'#8338ec',0,4.4,0),3);P(mk('box',3.6,.18,.18,'#ffd60a',0,2.4,-1.7),1);
    P(mk('box',.18,.18,3.6,'#ff006e',1.7,1.6,0),1);P(mk('box',.18,.18,3.6,'#06d6a0',-1.7,3.1,0),1);face(g,arg);}),
  fountain:(x,z)=>sized(x,z,RAD.fountain,3.4,8,'large',P=>{
    P(mk('cyl',5.2,.5,5.2,'#8ecae6',0,.25,0),4);P(mk('cyl',1.1,1.8,1.1,'#f4f1de',0,1.2,0),3);P(mk('sph',1.15,1.15,1.15,'#48cae4',0,2.4,0),1,true,.5);}),
  bench:(x,z,arg)=>sized(x,z,RAD.bench,1.15,1,'tiny',(P,g)=>{
    P(mk('box',2,.12,.55,'#bc6c25',0,.55,0),1,true,.3);P(mk('box',2,.6,.1,'#bc6c25',0,.9,-.22),1);
    P(mk('box',.1,.5,.45,'#6d4c41',-.85,.28,0),1);P(mk('box',.1,.5,.45,'#6d4c41',.85,.28,0),1);face(g,arg);}),
  picnic:(x,z,arg)=>sized(x,z,RAD.picnic,1.3,3,'small',(P,g)=>{
    P(mk('box',2,.12,1.1,'#e9c46a',0,.78,0),2);P(mk('box',1.8,.1,.35,'#bc6c25',0,.5,.75),1);P(mk('box',1.8,.1,.35,'#bc6c25',0,.5,-.75),1);
    P(mk('box',.1,.75,.1,'#6d4c41',-.75,.38,.35),1);P(mk('box',.1,.75,.1,'#6d4c41',.75,.38,-.35),1);
    if(Math.random()<.55)P(mk('sph',.35,.35,.35,'#ef476f',.3,1.05,0),1,true,.18);face(g,arg);}),
  gazebo:(x,z)=>sized(x,z,RAD.gazebo,5.8,14,'huge',P=>{
    P(mk('cyl',6,.28,6,'#f8f9fa',0,.16,0),3);[[-1.9,-1.9],[1.9,-1.9],[-1.9,1.9],[1.9,1.9]].forEach(([x,z])=>P(mk('cyl',.26,3,.26,'#fff',x,1.7,z),2));
    P(mk('pyr',7,2,7,'#e63946',0,4.3,0),4);P(mk('sph',.45,.45,.45,'#ffd60a',0,5.4,0),1,true,.22);}),
  bounce:(x,z,arg)=>sized(x,z,RAD.bounce,6.2,26,'mega',(P,g)=>{
    P(mk('box',9.6,3.8,7,'#ff70a6',0,1.9,0),8);P(mk('box',9.9,1,7.3,'#ffd166',0,4.1,0),3);
    [[-4.1,-2.9],[4.1,-2.9],[-4.1,2.9],[4.1,2.9]].forEach(([x,z],i)=>P(mk('cyl',1.5,6.4,1.5,['#4cc9f0','#06d6a0','#ffbe0b','#8338ec'][i],x,3.2,z),2));
    P(mk('box',2,2,.12,'#1d3557',0,1.2,3.56),1);face(g,arg);}),
  bush:(x,z)=>sized(x,z,RAD.bush,1.3,1,'mini',P=>{
    const c=pick(['#2d6a4f','#40916c','#52b788']);
    P(mk('sph',1.2,.95,1.2,c,0,.5,0),1,true,.5);P(mk('sph',.7,.6,.7,c,.35,.8,.15),1,true,.3);}),
  flowers:(x,z)=>sized(x,z,RAD.flowers,.45,1,'micro',P=>{
    P(mk('box',.52,.16,.3,'#bc6c25',0,.08,0),1);
    ['#e63946','#ffbe0b','#8338ec'].forEach((c,i)=>P(mk('sph',.13,.13,.13,c,-.16+i*.16,.24,0),1,true,.06));}),
  pebble:(x,z)=>sized(x,z,RAD.pebble,.22,1,'micro',P=>{
    const c=pick(['#adb5bd','#ced4da','#d4a373','#6c757d']);
    P(mk('sph',.38,.22,.32,c,0,.1,0),1,true,.12);
    if(Math.random()<.5)P(mk('sph',.2,.14,.18,c,.16,.07,.06),1,true,.08);}),
  mushroom:(x,z)=>sized(x,z,RAD.mushroom,.42,1,'micro',P=>{
    P(mk('cyl',.14,.26,.14,'#f8f9fa',0,.13,0),1);
    P(mk('sph',.42,.24,.42,pick(['#e63946','#ff006e','#ffbe0b']),0,.3,0),1,true,.12);
    P(mk('sph',.07,.07,.07,'#fff',.08,.34,.12),1);}),
  acorn:(x,z)=>sized(x,z,RAD.acorn,.3,1,'micro',P=>{
    P(mk('sph',.26,.3,.26,'#bc6c25',0,.12,0),1,true,.1);
    P(mk('sph',.24,.14,.24,'#6d4c41',0,.26,0),1,true,.08);
    P(mk('cyl',.04,.14,.04,'#2d6a4f',0,.36,0),1);}),
  toyblock:(x,z)=>sized(x,z,RAD.toyblock,.4,1,'micro',P=>{
    const b=mk('box',.4,.4,.4,pick(BLOCK),0,.2,0);b.rotation.y=rand(0,1.2);P(b,1,true,.18);}),
  can:(x,z)=>sized(x,z,RAD.can,.42,1,'micro',P=>{
    P(mk('cyl',.2,.44,.2,pick(['#e63946','#3a86ff','#06d6a0','#ffbe0b']),0,.22,0),1,true,.14);
    P(mk('cyl',.21,.05,.21,'#f8f9fa',0,.43,0),1);}),
  toyduck:(x,z)=>sized(x,z,RAD.toyduck,.4,1,'micro',P=>{
    P(mk('sph',.38,.28,.44,'#ffd60a',0,.16,0),1,true,.14);
    P(mk('sph',.2,.18,.2,'#ffd60a',0,.32,.14),1,true,.08);
    const bill=mk('cone',.06,.14,.06,'#fb8500',0,.3,.3);bill.rotation.x=Math.PI/2;P(bill,1);
    P(mk('sph',.05,.05,.05,'#111',.05,.36,.22),1);}),
  gnome:(x,z,arg)=>sized(x,z,RAD.gnome,.7,1,'mini',(P,g)=>{
    P(mk('cyl',.2,.36,.2,pick(['#3a86ff','#2a9d8f','#e63946']),0,.18,0),1);
    P(mk('sph',.24,.24,.24,'#ffd6a5',0,.44,0),1,true,.1);
    P(mk('cone',.3,.32,.3,'#e63946',0,.66,0),1,true,.12);
    P(mk('sph',.05,.05,.05,'#111',-.05,.46,.1),1);P(mk('sph',.05,.05,.05,'#111',.05,.46,.1),1);face(g,arg);}),
  snail:(x,z,arg)=>sized(x,z,RAD.snail,.32,1,'micro',(P,g)=>{
    P(mk('sph',.34,.28,.34,pick(['#bc6c25','#e9c46a','#f4a261']),0,.16,0),1,true,.12);
    P(mk('sph',.16,.12,.2,'#fff3bf',0,.1,.2),1,true,.08);
    P(mk('sph',.045,.045,.045,'#111',.04,.14,.28),1);face(g,arg);}),
  /* ---- D7 mega set pieces (block versions; the Kenney looks below replace skyscraper, stadium and ship) ---- */
  skyscraper:(x,z,arg)=>sized(x,z,RAD.skyscraper,26,50,'mega',(P,g)=>{
    const c=pick(['#bde0fe','#ffc8dd','#d8f3dc','#fff3bf']);
    for(let i=0;i<6;i++){story(P,8,8,4,i*4.2,i,c,2);slab(P,7.6,7.6,i*4.2+4.1,i,'#f8f9fa');}
    roofOf(P,8.4,8.4,1.6,25.9,6,'#457b9d');face(g,arg);
  },{building:true}),
  stadium:(x,z,arg)=>sized(x,z,RAD.stadium,7,60,'mega',(P,g)=>{
    P(BP(mk('box',13,.2,13,'#52b788',0,.1,0),0,'extra'),3);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,R=9.5,cx=Math.sin(a)*R,cz=Math.cos(a)*R;
      for(const k of [-1,0,1]){const tx=Math.cos(a)*k*5.5,tz=-Math.sin(a)*k*5.5,st=mk('box',5.2,5,4,pick(BLOCK),cx+tx,2.5,cz+tz);st.rotation.y=a;P(BP(st,0,'wall'),3);}
      const rf=mk('box',17,.4,4.6,'#f8f9fa',cx,5.3,cz);rf.rotation.y=a;P(BP(rf,1,'roof'),4);}
    P(BP(mk('sph',1.4,1.4,1.4,'#ffffff',0,.9,0),0,'extra'),1,true,.7);
  },{building:true}),
  // Ferris wheel: original, block-built. The wheel spins (so it stays awake: landmark only, never in ZONE_PROPS) and
  // flies off whole when the legs go. Its ~35 blocks are merged into one vertex-colored mesh: 1 draw call, not 35.
  ferris:(x,z,arg)=>sized(x,z,RAD.ferris,19,30,'mega',(P,g)=>{
    const hub=10.5,R=7.6,cols=['#e63946','#ffbe0b','#3a86ff','#06d6a0','#8338ec','#ff006e','#fb5607','#4cc9f0'];
    P(mk('box',10,.5,4.4,'#f8f9fa',0,.25,0),3);
    for(const zz of [-1.4,1.4])for(const sx of [-1,1]){const l=mk('box',.55,Math.hypot(4.2,hub),.55,'#ced4da',sx*2.1,hub/2,zz);l.rotation.z=sx*Math.atan2(4.2,hub);P(l,3);}
    const w=new THREE.Group();
    w.add(mk('wheel',3.4,1.3,1.3,'#495057',0,0,0));
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,seg=mk('box',3.1,.32,.32,'#f8f9fa',Math.cos(a)*R,Math.sin(a)*R,0);seg.rotation.z=a+Math.PI/2;w.add(seg);}
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,sp=mk('box',R,.18,.18,'#dee2e6',Math.cos(a)*R/2,Math.sin(a)*R/2,0);sp.rotation.z=a;w.add(sp);
      w.add(mk('box',1.5,1.3,1.5,cols[i],Math.cos(a)*R,Math.sin(a)*R-.9,0));}
    const wheel=new THREE.Mesh(ferrisGeo(w),kitVCMat('#ffffff'));wheel.position.set(0,hub,0);wheel.userData.spin={axis:'z',speed:.35};
    wheel.castShadow=wheel.receiveShadow=true;P(wheel,1,true,R);face(g,arg);}),
  ship:(x,z,arg)=>sized(x,z,RAD.ship,9,36,'mega',(P,g)=>{
    P(mk('box',4.4,2.4,11,'#9c6644',0,1.2,0),8);P(mk('pyr',4.4,3,3,'#9c6644',0,1.2,6.4),3);
    for(const [zz,h] of [[-2.5,7],[2.2,8.4]]){P(mk('cyl',.35,h,.35,'#6d4c41',0,2.4+h/2,zz),2);P(mk('box',4.6,3.6,.2,'#f8f9fa',0,2.4+h*.62,zz+.3),1,true,1.4);}
    face(g,arg);})
};
/* D8b: Kenney looks. Each builder picks a model (seeded, so a chunk always rebuilds the same) and falls back to the
   block version above when none of its models loaded. Sizes, radii and points stay as they were. */
{
  const B=Object.assign({},OBJ);
  const kitIsGreen=D=>D[1]>D[0]*1.2&&D[1]>D[2]*1.05;
  const leafy=(name,s)=>kitPieces(name,{mode:'color',s});
  // tree-like: green parts fly off whole (recolored), the rest shatters
  const plant=(P,name,s,leaf,n=3)=>{for(const pc of leafy(name,s)){const g=kitIsGreen(pc.D),m=kitMesh(pc,null);
    if(g&&leaf&&pc.flat)m.material=M(leaf);P(m,g?1:n,g,Math.max(.1,Math.min(pc.sz[0],pc.sz[2])/2));}};
  // buildings: model + colors come from the chunk (kitAt), so a street's copies batch together
  // `like`: share another type's model and colors in the chunk (a villa is a bigger copy of the street's house)
  const bld=(type,size,pts,floorsOf,walls,roofs,big,like)=>{const key=like||type,k=[...key].reduce((h,c)=>h*31+c.charCodeAt(0),7)%9973;return (x,z,arg)=>{
    const name=kitAt(KIT[key],x,z,k);if(!name)return B[type](x,z,arg);
    const s=kitFit(name,RAD[type]),wall=pick(walls),roof=pick(roofs); // both per house (seeded by the layout, so a chunk rebuilds the same)
    let proxy;const o=sized(x,z,RAD[type],kitH(name,s),pts,size,(P,g)=>{proxy=kitBuilding(P,name,s,wall,roof,floorsOf&&floorsOf(name));
      if(arg===undefined)g.rotation.y=(Math.random()*4|0)*Math.PI/2;else face(g,arg);},{building:true,big});
    o.proxy=proxy;return o;};};
  const simple=(type,size,pts,scaleOf,opts,extra)=>(x,z,arg)=>{
    const name=kitNear(KIT[type],x,z);if(!name)return B[type](x,z,arg);
    const s=scaleOf(name);
    return sized(x,z,RAD[type],kitH(name,s),pts,size,(P,g)=>{kitProp(P,name,s,typeof opts==='function'?opts():opts);
      if(type==='fence')g.rotation.y=arg||0;else face(g,arg);},extra);};
  const W=['#ffffff'],SHOP=['#fff3bf','#ffd6a5','#caffbf','#9bf6ff','#ffc6ff','#ffffff'];
  const kitH=(name,s)=>kitBox(kitTris(name))[4]*s;

  OBJ.cottage=bld('cottage','large',6,null,PASTEL,ROOF);
  OBJ.house=bld('house','huge',14,null,PASTEL,ROOF,true);
  OBJ.villa=bld('villa','huge',18,null,PASTEL,ROOF,true,'house');
  OBJ.farmhouse=bld('farmhouse','huge',12,null,W,['#2a9d8f','#c1121f','#6d4c41'],true);
  OBJ.shop=bld('shop','large',10,null,SHOP,W);
  OBJ.boss=bld('boss','mega',40,null,['#f4a261','#e9c46a','#8ecae6','#ffffff'],W,true);

  OBJ.tree=(x,z,arg)=>{const name=kitNear(KIT.tree,x,z);if(!name)return B.tree(x,z,arg);const s=kitFitH(name,6);
    return makeObj(x,z,1.1,6,3,(P,g)=>{plant(P,name,s,pick(LEAVES));g.rotation.y=rand(0,6.28);},{size:'large',big:true});};
  OBJ.bush=(x,z,arg)=>{const name=kitNear(KIT.bush,x,z);if(!name)return B.bush(x,z,arg);const s=kitFit(name,RAD.bush);
    return sized(x,z,RAD.bush,kitH(name,s),1,'mini',(P,g)=>{plant(P,name,s,pick(['#2d8f4e','#3fb950','#52b788']));g.rotation.y=rand(0,6.28);});};
  OBJ.flowers=(x,z,arg)=>{const name=kitNear(KIT.flowers,x,z);if(!name)return B.flowers(x,z,arg);const s=kitFitH(name,.45);
    return sized(x,z,RAD.flowers,.45,1,'micro',(P,g)=>{for(const pc of leafy(name,s))P(kitMesh(pc,null),1,!kitIsGreen(pc.D),.06);g.rotation.y=rand(0,6.28);});};
  OBJ.mushroom=(x,z,arg)=>{const name=kitNear(KIT.mushroom,x,z);if(!name)return B.mushroom(x,z,arg);const s=kitFitH(name,.42);
    return sized(x,z,RAD.mushroom,.42,1,'micro',(P,g)=>{leafy(name,s).forEach((pc,i)=>P(kitMesh(pc,null),1,true,.1));g.rotation.y=rand(0,6.28);});};
  OBJ.pebble=simple('pebble','micro',1,name=>kitFit(name,RAD.pebble),{});
  OBJ.lamp=simple('lamp','small',2,name=>kitFitH(name,4.2),{tint:()=>'#7d8597'}); // the kit's pale grey poles vanish on the grass
  OBJ.cone=simple('cone','small',1,name=>kitFitH(name,1.6),{});
  OBJ.bench=simple('bench','tiny',1,name=>kitFit(name,RAD.bench),{});
  OBJ.parked=simple('parked','medium',4,name=>kitFit(name,RAD.parked),{n:5,whole:false});
  OBJ.tractor=simple('tractor','large',8,name=>kitFit(name,RAD.tractor),{n:6,whole:false});
  OBJ.fence=simple('fence','small',2,name=>kitFit(name,RAD.fence),{cut:{mode:'color'},n:2,whole:false});
  OBJ.melon=simple('melon','small',3,name=>kitFitH(name,1.6),{cut:{mode:'color'}});
  OBJ.snowman=simple('snowman','medium',5,name=>kitFitH(name,5.6),{cut:{mode:'y',cuts:[.42,.72]}});
  OBJ.crops=(x,z,arg)=>{const plants=KIT.crops.filter(kitHas);if(!plants.length||!kitHas('crop-dirt'))return B.crops(x,z,arg);
    const kind=pick(plants),sd=kitFit('crop-dirt',RAD.crops)*.95,sp=kitFitH(kind,kind==='crop-corn'?1.5:.9);
    return sized(x,z,RAD.crops,1.2,3,'small',(P,g)=>{kitProp(P,'crop-dirt',sd,{n:2,whole:false});
      for(let i=-2;i<=2;i++)for(const pc of leafy(kind,sp)){const m=kitMesh(pc,null);m.position.x+=i*.85;P(m,1,true,.25);}face(g,arg);});};
  OBJ.fountain=(x,z,arg)=>{const name=kitNear(KIT.fountain,x,z);if(!name)return B.fountain(x,z,arg);const s=kitFit(name,RAD.fountain);
    return sized(x,z,RAD.fountain,3.4,8,'large',P=>{for(const pc of leafy(name,s))P(kitMesh(pc,null),4);
      P(mk('cyl',.8,1.6,.8,'#f4f1de',0,kitH(name,s)+.6,0),2);P(mk('sph',1.15,1.15,1.15,'#48cae4',0,kitH(name,s)+1.9,0),1,true,.5);});};
  // windmill: the block tower keeps its shape, the sails become the kit's wooden sails (spinning, see setupSpin)
  OBJ.windmill=(x,z,arg)=>{if(!kitHas('windmill-blades'))return B.windmill(x,z,arg);const s=4.2/3.11;
    return sized(x,z,RAD.windmill,12,16,'huge',(P,g)=>{
      P(mk('cyl',2.1,6.4,2.1,'#f4f1de',0,3.2,0),6);P(mk('cone',2.5,1.8,2.5,'#e07a5f',0,7.2,0),3);P(mk('box',.35,.35,1,'#6d4c41',0,5.4,1.15),1);
      const hub=mk('cyl',.45,.4,.45,'#333',0,5.5,1.55);hub.rotation.x=Math.PI/2;P(hub,1,true,.25);
      const sail=new THREE.Group();sail.position.set(0,5.5,1.8);sail.userData.spin={axis:'z',speed:1.1};
      for(const pc of kitPieces('windmill-blades',{mode:'one',s,ry:1})){const m=kitMesh(pc,null);m.position.set(0,0,0);sail.add(m);}
      P(sail,1,true,.4);face(g,arg);});};

  /* ---- D8c: the last block-built landmarks ----
     Models outside the city kits slice with cut {eave, noCap}: eave = where the roof starts (fraction of height).
     Landmarks with block extras on top (school flag, fire tower) keep no o.proxy, since a proxy would hide the extras. */
  const kitColor=(pc,c)=>{const m=kitMesh(pc,null);if(c)m.material=pc.flat?M(c):kitVCMat(c);return m;};
  const kitBld=(type,size,pts,cut,wallOf,extra,floors)=>(x,z,arg)=>{
    const name=kitAt(KIT[type],x,z,[...type].reduce((h,c)=>h*31+c.charCodeAt(0),7)%9973);if(!name)return B[type](x,z,arg);
    const s=kitFit(name,RAD[type]),H=kitH(name,s),fl=floors?floors(name):1;let proxy;
    const o=sized(x,z,RAD[type],H,pts,size,(P,g)=>{proxy=kitBuilding(P,name,s,wallOf?wallOf(x,z):'#ffffff','#ffffff',fl,cut);
      if(extra)extra(P,H,fl,s);face(g,arg);},{building:true,big:true});
    if(!extra)o.proxy=proxy;return o;};
  OBJ.barn=kitBld('barn','mega',32,{noCap:true,eave:.5});
  // schoolhouse: long side to the front, flagpole on the roof
  OBJ.school=kitBld('school','huge',22,{noCap:true,eave:.52,ry:1},null,(P,H,fl)=>{
    P(BP(mk('cyl',.14,2.8,.14,'#dee2e6',0,H+1.2,0),fl,'extra'),1);P(BP(mk('box',1.2,.7,.06,'#ffbe0b',.62,H+2.2,0),fl,'extra'),1,true,.3);});
  // fire station: the racing kit's red-door garage painted red, with the block hose tower + siren on the roof
  OBJ.firestation=kitBld('firestation','huge',20,{noCap:true,eave:.86},()=>'#ff8f8f',(P,H,fl)=>{
    story(P,2.8,2.8,2.6,H,fl,'#d62828',2);slab(P,2.6,2.6,H+2.6,fl,'#fff');
    P(BP(mk('box',.55,.38,.55,null,0,H+2.95,0,glow('#ff1e1e')),fl,'extra'),1);});
  // grid 2: 4 walls a storey. Six storeys at 3×3 would be ~55 parts, and an awake building draws every part on its own
  OBJ.skyscraper=kitBld('skyscraper','mega',50,{noCap:true,eave:.93,grid:2},()=>pick(['#ffffff','#cfe8ff','#ffd6e7','#d8f3dc']),null,
    name=>({'tower-a':4,'tower-c':5,'tower-d':6})[name]||4);
  OBJ.watertower=(x,z,arg)=>{if(!kitHas('watertower'))return B.watertower(x,z,arg);const s=kitFit('watertower',RAD.watertower);
    return sized(x,z,RAD.watertower,kitH('watertower',s),16,'huge',(P,g)=>{kitProp(P,'watertower',s,{cut:{mode:'y',cuts:[.42,.78]},n:5,whole:false});face(g,arg);});};
  // silo: the industrial stack in farm colors (silver body, red band) with a white dome
  OBJ.silo=(x,z,arg)=>{if(!kitHas('silo-tall'))return B.silo(x,z,arg);const s=kitFitH('silo-tall',9),H=9;
    return sized(x,z,RAD.silo,H+1.6,14,'huge',(P,g)=>{
      for(const pc of leafy('silo-tall',s))P(kitColor(pc,pc.D[0]>pc.D[2]*1.6?'#e63946':'#e9ecef'),5);
      P(mk('sph',s*.62,s*.42,s*.62,'#f8f9fa',0,H,0),3);P(mk('box',1.1,1.8,.1,'#6d4c41',0,1.1,s*.5),1);face(g,arg);});};
  OBJ.gazebo=(x,z,arg)=>{if(!kitHas('pavilion'))return B.gazebo(x,z,arg);const s=kitFit('pavilion',RAD.gazebo),H=kitH('pavilion',s);
    return sized(x,z,RAD.gazebo,H,14,'huge',P=>{P(mk('cyl',RAD.gazebo*1.75,.28,RAD.gazebo*1.75,'#f8f9fa',0,.16,0),3);
      const rf=pick(['#e63946','#3a86ff','#ffbe0b','#8338ec','#2a9d8f']);
      // two bands (posts, roof) instead of one part per color: ~10 batches per chunk → 2
      for(const pc of kitPieces('pavilion',{mode:'y',cuts:[.5],s})){const top=pc.cen[1]>H*.5;P(kitColor(pc,top?rf:'#ffffff'),top?5:2);}
      P(mk('sph',.7,.7,.7,'#ffd60a',0,H+.25,0),1,true,.35);});};
  // bouncy castle: the minigolf castle blown up and painted in party colors
  OBJ.bounce=(x,z,arg)=>{if(!kitHas('castle-mini'))return B.bounce(x,z,arg);const s=kitFit('castle-mini',RAD.bounce),cols=['#ff70a6','#ffd166','#4cc9f0','#06d6a0','#8338ec','#ff006e'];
    return sized(x,z,RAD.bounce,kitH('castle-mini',s),26,'mega',(P,g)=>{leafy('castle-mini',s).forEach((pc,i)=>P(kitColor(pc,cols[i%cols.length]),6));face(g,arg);});};
  // slide: the skate kit's quarter pipe as the chute, a ladder up its tall end
  OBJ.slide=(x,z,arg)=>{if(!kitHas('slide-chute'))return B.slide(x,z,arg);const s=kitFitH('slide-chute',2.4);
    return sized(x,z,RAD.slide,2.5,4,'small',(P,g)=>{
      leafy('slide-chute',s).forEach((pc,i)=>P(kitColor(pc,['#ffbe0b','#3a86ff'][i%2]),2));
      if(kitHas('ladder')){const T=kitTris('slide-chute'),b=kitBox(T),top=T.flat().filter(p=>p[1]>b[4]*.8);
        const ax=top.reduce((a,p)=>a+p[0],0)/top.length,az=top.reduce((a,p)=>a+p[2],0)/top.length,alongX=Math.abs(ax)>Math.abs(az);
        const sl=kitFitH('ladder',2.6),ry=alongX?1:0,off=((alongX?b[3]:b[5])*s+.15)*Math.sign(alongX?ax:az);
        for(const pc of kitPieces('ladder',{mode:'one',s:sl,ry})){const m=kitColor(pc,'#e63946');if(alongX)m.position.x+=off;else m.position.z+=off;P(m,1,true,.3);}}
      face(g,arg);});};
  // climbing gym: the skate kit's wooden frame in playground colors with a deck on top
  OBJ.gym=(x,z,arg)=>{if(!kitHas('climb-frame'))return B.gym(x,z,arg);const s=kitFit('climb-frame',RAD.gym),H=kitH('climb-frame',s),cols=['#e63946','#ffbe0b','#3a86ff','#06d6a0'];
    return sized(x,z,RAD.gym,H+.3,8,'large',(P,g)=>{leafy('climb-frame',s).forEach((pc,i)=>P(kitColor(pc,cols[i%4]),2));
      P(mk('box',s*.8,.26,s*.8,'#8338ec',0,H*.72,0),3);face(g,arg);});};
  // stadium (D7): eight racing-kit grandstands round a pitch, two per side. Each stand is a building (walls + roof).
  OBJ.stadium=(x,z,arg)=>{if(!kitHas('grandstand'))return B.stadium(x,z,arg);const name='grandstand',b=kitBox(kitTris(name));
    const s=10/((b[3]-b[0])*2),w=(b[3]-b[0])*s,d=(b[5]-b[2])*s,R=7+d/2,FLIP=Math.PI; // FLIP: the stands' seats face -Z
    return sized(x,z,RAD.stadium,kitH(name,s),60,'mega',(P,g)=>{
      P(BP(mk('box',14,.2,14,'#52b788',0,.1,0),0,'extra'),3);P(BP(mk('box',.3,.22,14,'#ffffff',0,.12,0),0,'extra'),1);
      for(const zz of [-6.4,6.4]){P(BP(mk('box',3.4,1.6,.3,'#ffffff',0,.8,zz),0,'extra'),1,true,.5);}
      P(BP(mk('sph',1.4,1.4,1.4,'#ffffff',0,.9,0),0,'extra'),1,true,.7);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;
        for(const k of [-.5,.5]){const cx=k*w,cz=R,th=a+FLIP,ca=Math.cos(a),sa=Math.sin(a),ct=Math.cos(th),st=Math.sin(th);
          const X=cx*ca+cz*sa,Z=-cx*sa+cz*ca;
          for(const pc of kitPieces(name,{mode:'bld',s,floors:1,noCap:true,eave:.72})){const m=kitMesh(pc,null),px=pc.cen[0],pz=pc.cen[2];
            m.position.set(X+px*ct+pz*st,pc.cen[1],Z-px*st+pz*ct);m.rotation.y=th;P(BP(m,pc.floor,pc.kind),pc.kind==='roof'?4:3);}}}
      face(g,arg);},{building:true,big:true});};
  // ship (D7): the pirate kit's big ship run aground, in three bands (hull shatters, rigging + sails fly off whole);
  // one part per color would be 24 batches per chunk
  OBJ.ship=(x,z,arg)=>{if(!kitHas('ship-large'))return B.ship(x,z,arg);const s=kitFit('ship-large',RAD.ship),H=kitH('ship-large',s);
    return sized(x,z,RAD.ship,H,36,'mega',(P,g)=>{kitPieces('ship-large',{mode:'y',cuts:[.3,.62],s}).forEach(pc=>{const hull=pc.cen[1]<H*.3;
      P(kitMesh(pc,null),hull?8:2,!hull,Math.max(.5,Math.min(pc.sz[0],pc.sz[2])/2));});face(g,arg);});};
}
/* ---------- start street (D13) ----------
   Both cars start at micro size in the right lane of the home road (x 0…5), facing up the screen (−Z). At that size
   a curb is a wall, a mailbox a tower and a soda can a boulder. */
const START_STREET=[[2.6,48],[3.8,48.6]];
const MICRO_T=new Set(['flowers','pebble','mushroom','acorn','toyblock','can','toyduck','snail']);
// keep the lane in front of the cars clear of anything that would boing a micro car (micro clutter is fine: it smashes)
const startLane=(x,z)=>x>0.3&&x<5.2&&z>START_STREET[0][1]-18&&z<START_STREET[0][1]+4;
let streetDecor=null;
/* Flat set dressing (curbs, sidewalk, cracks, drain, puddle, leaves): not smashable, drivable, built once (it survives
   NEW WORLD, like the home arena) and merged into one vertex-colored mesh, so it costs one draw call. */
function startStreetDecor(){
  if(streetDecor)return;const g=new THREE.Group(),Z0=START_STREET[0][1],add=(...a)=>{const m=mk(...a);g.add(m);return m;};
  for(const sx of [1,-1]){
    add('box',.24,.17,64,'#e2e2e2',sx*5.12,.085,Z0-6);                                   // curb
    add('box',3.4,.1,64,'#cfd2d6',sx*6.95,.05,Z0-6);                                     // sidewalk
    for(let z=Z0-37;z<Z0+26;z+=1.7)add('box',3.4,.104,.05,'#a9adb3',sx*6.95,.05,z);      // slab seams
  }
  // cracks: little zigzags in the slabs near the start
  [[6.2,Z0-2.4],[7.6,Z0+1.8],[6.6,Z0-7.1],[7.2,Z0+5.2]].forEach(([x,z],i)=>{for(let k=0;k<3;k++){
    const c=add('box',.035,.106,.42,'#80858c',x+(k%2?.09:-.02),.05,z+k*.36);c.rotation.y=(k%2?.6:-.5)+i*.2;}});
  // storm drain on the road edge, puddle in the lane ahead (flat: cars drive right over them)
  add('box',.5,.07,1.1,'#5c636b',4.62,.04,Z0-3.2);for(let k=0;k<4;k++)add('box',.32,.072,.07,'#262a2f',4.62,.04,Z0-3.6+k*.26);
  add('cyl',1.9,.06,1.2,'#7cc4f0',3.4,.04,Z0-6.4);add('cyl',.9,.064,.5,'#b5e2fa',3.1,.04,Z0-6.6);
  // fallen leaves
  const LV=['#e76f51','#f4a261','#e9c46a','#bc6c25'];
  for(let i=0;i<22;i++){const x=i<14?rand(5.4,8.4):rand(3.2,4.9),z=Z0+rand(-12,6),l=add('box',.16,.012,.1,pick(LV),x,i<14?.106:.056,z);l.rotation.y=rand(0,3.14);}
  streetDecor=new THREE.Mesh(blocksGeo(g),kitVCMat('#ffffff'));streetDecor.receiveShadow=true;scene.add(streetDecor);
}
function startStreet(){
  startStreetDecor();const Z0=START_STREET[0][1];
  // giants on the sidewalk: mailbox (door to the road), hydrant, lamp
  place('mailbox',6.4,Z0+1.4,3);place('hydrant',6.1,Z0-4.2);place('lamp',7.9,Z0-9);
  // toy-sized clutter: car-sized to a micro car, so the first smashes are right there
  [['can',5.8,Z0-.9],['pebble',4.55,Z0-1.8],['pebble',4.5,Z0+2.4],['pebble',7.3,Z0-2.2],['flowers',7.9,Z0+.6],['flowers',8.1,Z0-2.6],
   ['acorn',6.9,Z0+3.5],['toyblock',5.9,Z0+4.3],['toyduck',7.6,Z0+2.9],['snail',8,Z0-5.4],['mushroom',8.2,Z0-7.4],
   ['can',3.3,Z0-4.2],['pebble',2.1,Z0-7.6],['toyblock',1.4,Z0-11],['acorn',4.3,Z0-12.5],['can',2.6,Z0-15]].forEach(([t,x,z])=>place(t,x,z,Math.random()*4|0));
}
function spotOK(x,z,r){
  if(Math.abs(x)>ARENA-r-1||Math.abs(z)>ARENA-r-1)return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(groundH(x+a,z+b)>0)return false;
  return true;
}
function place(type,x,z,arg){
  const tmpR=RAD[type]||1.1;
  if(!spotOK(x,z,tmpR))return null;
  for(const [a,b] of START_STREET)if(Math.hypot(x-a,z-b)<tmpR+.9)return null;
  if(!MICRO_T.has(type)&&startLane(x,z))return null;
  for(const o of objects)if(Math.abs(o.x-x)<o.r+tmpR&&Math.hypot(o.x-x,o.z-z)<(o.r+tmpR)*.8)return null; // no stacking
  return OBJ[type](x,z,arg);
}

function buildWorld(){
  startStreet(); // first, so the start spot gets its props before the arena's random scatter
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
    fountain:take('P',1021),play:take('P',1117),gazebo:take('P',1223),bounce:take('P',1307),ducks:take('P',1423),
    // D7 set pieces, taken last so the older landmarks stay where they were
    sky:take('T',1511),stadium:take('P',1613),ferris:take('P',1709),ship:take('P',1801)
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
function propsRamp(ctx){if(Math.random()<0.42)ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2);}
function lotKind(){const r=Math.random();return r<.5?'cottage':r<.78?'house':r<.9?'shop':'villa';}

const ZONE_LAYOUT={
  town(ctx){
    const LM=landmarks();
    if(at(LM.boss,ctx)){const p=drop(ctx,'boss',0);if(p){ring(ctx,p.x,p.z,RAD.boss+2.6,6,'lamp');ring(ctx,p.x,p.z,RAD.boss+5.4,4,'hydrant');}crumbs(ctx,4,['parked','mailbox','bush']);return;}
    if(at(LM.school,ctx)){const p=drop(ctx,'school',0);if(p){put(ctx,'bench',p.x-4,p.z+RAD.school+2.6,0);put(ctx,'bench',p.x+4,p.z+RAD.school+2.6,0);put(ctx,'flowers',p.x,p.z+RAD.school+2.2,0);}crumbs(ctx,5,['tree','bush','lamp']);return;}
    if(at(LM.fire,ctx)){const p=drop(ctx,'firestation',0);if(p){ring(ctx,p.x,p.z,RAD.firestation+2.2,4,'hydrant');put(ctx,'parked',p.x+RAD.firestation+4,p.z,1);}crumbs(ctx,3,['cone','lamp']);return;}
    if(at(LM.sky,ctx)){const p=drop(ctx,'skyscraper',0);if(p){ring(ctx,p.x,p.z,RAD.skyscraper+2.6,6,'lamp');put(ctx,'parked',p.x+RAD.skyscraper+5,p.z+4,1);put(ctx,'parked',p.x-RAD.skyscraper-5,p.z-4,3);}crumbs(ctx,4,['hydrant','mailbox','bush','cone']);return;}
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
    propsRamp(ctx);
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
    propsRamp(ctx);
  },
  park(ctx){
    const LM=landmarks();
    if(at(LM.fountain,ctx)){const p=drop(ctx,'fountain',0);if(p){ring(ctx,p.x,p.z,RAD.fountain+2.2,4,'bench');ring(ctx,p.x,p.z,RAD.fountain+4.4,6,'flowers');}crumbs(ctx,5,['tree','bush']);return;}
    if(at(LM.play,ctx)){const p=drop(ctx,'gym',0);if(p){put(ctx,'swing',p.x+7,p.z+1,1);put(ctx,'slide',p.x-7,p.z+1,0);put(ctx,'bench',p.x+6,p.z-5,0);put(ctx,'bench',p.x-5,p.z-5,2);put(ctx,'flowers',p.x,p.z+6,0);ring(ctx,p.x,p.z,14,6,'tree');}return;}
    if(at(LM.gazebo,ctx)){const p=drop(ctx,'gazebo',0);if(p){ring(ctx,p.x,p.z,RAD.gazebo+2.4,4,'picnic');ring(ctx,p.x,p.z,RAD.gazebo+4.2,6,'flowers');}crumbs(ctx,4,['tree','bench']);return;}
    if(at(LM.bounce,ctx)){const p=drop(ctx,'bounce',0);if(p)ring(ctx,p.x,p.z,RAD.bounce+2,8,'cone');ctx.ramp(ctx.cx+18,ctx.cz,Math.PI/2);crumbs(ctx,3,['bench','flowers']);return;}
    if(at(LM.stadium,ctx)){const p=drop(ctx,'stadium',0);if(p)ring(ctx,p.x,p.z,RAD.stadium+3,8,'lamp');crumbs(ctx,4,['cone','bench','flowers']);return;}
    if(at(LM.ferris,ctx)){const p=drop(ctx,'ferris',0);if(p){ring(ctx,p.x,p.z,RAD.ferris+3,6,'flowers');put(ctx,'picnic',p.x+RAD.ferris+5,p.z+3,1);put(ctx,'bench',p.x-RAD.ferris-4,p.z+3,3);}crumbs(ctx,4,['tree','bush','cone']);return;}
    if(at(LM.ship,ctx)){const p=drop(ctx,'ship',0);if(p){ring(ctx,p.x,p.z,RAD.ship+3,6,'barrel');ring(ctx,p.x,p.z,RAD.ship+6,5,'crates');}crumbs(ctx,3,['tree','pebble']);return;}
    if(at(LM.ducks,ctx)){const p=drop(ctx,'pond',0);if(p){ctx.herd('duck',p.x+RAD.pond+3,p.z,6);put(ctx,'bench',p.x+RAD.pond+2.6,p.z+2,1);put(ctx,'bench',p.x-RAD.pond-2.6,p.z-2,3);}crumbs(ctx,4,['tree','flowers','bush']);return;}
    for(let i=0;i<7;i++)put(ctx,'tree',rand(ctx.x0+8,ctx.x1-8),rand(ctx.z0+8,ctx.z1-8),0);
    for(let i=0;i<3;i++)put(ctx,'bench',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
    for(let i=0;i<2;i++)put(ctx,'picnic',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    crumbs(ctx,5,['bush','flowers','cone']);
    if(Math.random()<.3){const px=rand(ctx.x0+16,ctx.x1-16),pz=rand(ctx.z0+18,ctx.z1-16);
      for(let row=0;row<4;row++)for(let k=0;k<=row;k++)put(ctx,'pin',px+(k-row/2)*3.2,pz-row*3,0);}
    propsRamp(ctx);
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
  town:{micro:MICRO,mini:['bush','gnome'],tiny:['hydrant','mailbox','bench'],small:['cone','lamp','pin'],medium:['barrel','crates','parked','snowman'],large:['tree','tower','shop','cottage'],huge:['house','villa'],mega:['bounce','skyscraper']},
  farm:{micro:['flowers','pebble','mushroom','acorn'],mini:['bush','gnome'],tiny:['mailbox'],small:['fence','crops','hay','scarecrow','cone'],medium:['melon','crates','barrel','coop'],large:['tree','tractor'],huge:['farmhouse','silo','windmill'],mega:['barn']},
  park:{micro:['flowers','pebble','mushroom','toyduck','acorn'],mini:['bush','gnome'],tiny:['bench'],small:['cone','pin','swing','slide'],medium:['picnic','snowman'],large:['tree','fountain','gym'],huge:['gazebo'],mega:['bounce','ship']},
  home:{micro:MICRO,mini:['bush','gnome'],tiny:['hydrant','mailbox','bench'],small:['cone','pin','melon','fence'],medium:['barrel','crates','snowman'],large:['tree','tower'],huge:['house'],mega:['bounce']}
};
