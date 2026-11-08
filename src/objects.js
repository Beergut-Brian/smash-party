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
  bounce:5.8,skyscraper:6.6,stadium:13,ferris:6.2,ship:7,bush:.9,flowers:.32,pebble:.26,mushroom:.3,acorn:.22,toyblock:.28,can:.2,toyduck:.3,gnome:.26,snail:.28,
  trashcan:.45,birdbath:.5,doghouse:1.1,beachball:.36,pumpkin:.42
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
  /* ---- D11 neighborhood bits: yard, sidewalk and field filler for the thin mini/tiny/small sizes ---- */
  trashcan:(x,z,arg)=>sized(x,z,RAD.trashcan,1.15,1,'tiny',(P,g)=>{const c=pick(['#2a9d8f','#457b9d','#6c757d']);
    P(mk('cyl',.78,.95,.78,c,0,.48,0),2);const lid=new THREE.Group();lid.add(mk('cyl',.88,.14,.88,c,0,1.02,0));lid.add(mk('box',.32,.08,.12,'#343a40',0,1.13,0));
    P(lid,1,true,.3);face(g,arg);}),
  birdbath:(x,z)=>sized(x,z,RAD.birdbath,1,1,'tiny',P=>{
    P(mk('cyl',.22,.7,.22,'#ced4da',0,.35,0),1);P(mk('cyl',.9,.16,.9,'#dee2e6',0,.76,0),2);
    P(mk('cyl',.72,.04,.72,'#90e0ef',0,.85,0),1,true,.2);P(mk('sph',.16,.14,.2,pick(['#3a86ff','#e63946','#ffbe0b']),.32,.94,0),1,true,.1);}),
  doghouse:(x,z,arg)=>sized(x,z,RAD.doghouse,1.8,2,'small',(P,g)=>{const c=pick(['#e9c46a','#a2d2ff','#ffafcc','#bde0a8']);
    P(mk('box',1.4,1,1.6,c,0,.5,0),3);P(mk('pyr',1.95,.8,2.2,pick(['#e63946','#3a86ff','#6d4c41']),0,1.4,0),2,true,.5);
    P(mk('box',.5,.62,.06,'#3d2b1f',0,.36,.81),1);P(mk('box',.5,.14,.06,'#fff',0,.8,.82),1,true,.12);
    P(mk('cyl',.5,.12,.5,'#e63946',.55,.06,1.2),1,true,.14);face(g,arg);}),
  beachball:(x,z)=>sized(x,z,RAD.beachball,.72,1,'mini',P=>{
    const b=new THREE.Group(),c=pick([['#e63946','#ffbe0b'],['#3a86ff','#fff'],['#06d6a0','#ff70a6']]);
    b.add(mk('sph',.7,.7,.7,c[0],0,.35,0));b.add(mk('cyl',.72,.22,.72,c[1],0,.35,0));b.add(mk('sph',.12,.12,.12,'#fff',0,.7,0));
    P(b,1,true,.35);},{roll:true}),
  pumpkin:(x,z)=>sized(x,z,RAD.pumpkin,.62,1,'mini',P=>{const c=pick(['#fb8500','#f4a261','#ffb703']);
    P(mk('sph',.82,.56,.82,c,0,.28,0),1,true,.25);P(mk('sph',.5,.6,.5,c,0,.3,.06),1,true,.15);
    P(mk('cyl',.08,.2,.08,'#2d6a4f',0,.62,0),1);P(mk('sph',.26,.06,.16,'#52b788',.12,.58,0),1);}),
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
  // KIT_GRID (3×3: 8 walls + a slab a storey) like the other pack buildings; an untouched building draws as its batch (L25)
  OBJ.skyscraper=kitBld('skyscraper','mega',50,{noCap:true,eave:.93},()=>pick(['#ffffff','#cfe8ff','#ffd6e7','#d8f3dc']),null,
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
/* ---------- D18 scene props ----------
   Little things the scenes and lots need: picnic food, toys, party bits, stands, a crashed saucer. Block-built with
   M() colors (they batch by shape for free). Each keeps its size class so the size-matched filler can use it too. */
Object.assign(RAD,{sandwich:.32,ant:.13,popsicle:.24,paperboat:.24,teacup:.16,toycar:.3,pail:.2,soccerball:.36,
  bike:.85,cake:.5,sandcastle:.75,wheelbarrow:.75,chest:.55,balloons:.45,kite:.6,laundry:2.3,lemonade:1.6,veggiestand:1.6,
  goal:2.1,icetruck:2.5,icecone:.5,saucer:3.8});
const PARTY=['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93','#ff70a6','#4cc9f0'];
// a market stand: counter, striped awning on two posts, goods on top (lemonade pitcher + cups, or veggies)
function sceneStand(P,g,arg,stripe,goods){
  P(mk('box',2.6,1.1,1.1,'#fff8e7',0,.55,0),3);P(mk('box',2.7,.12,1.2,'#d4a373',0,1.12,0),1);
  for(const x of [-1.25,1.25])P(mk('box',.12,2.5,.12,'#d4a373',x,1.3,-.45),1);
  for(let i=0;i<6;i++)P(mk('box',.5,.1,1.3,i%2?'#ffffff':stripe,-1.25+i*.5,2.55,-.05),1,true,.2);
  P(mk('box',1.3,.5,.08,stripe,0,.6,.58),1,true,.25);goods(P);face(g,arg);}
Object.assign(OBJ,{
  sandwich:(x,z,arg)=>sized(x,z,RAD.sandwich,.26,1,'micro',(P,g)=>{
    P(mk('box',.5,.07,.42,'#f4d58d',0,.04,0),1,true,.2);P(mk('box',.54,.04,.46,'#70e000',0,.1,0),1,true,.2);
    P(mk('box',.46,.05,.38,'#ff8fab',0,.14,0),1,true,.18);P(mk('box',.5,.07,.42,'#f4d58d',0,.2,.02),1,true,.2);face(g,arg);}),
  ant:(x,z,arg)=>sized(x,z,RAD.ant,.12,1,'micro',(P,g)=>{const a=new THREE.Group();
    a.add(mk('sph',.1,.08,.12,'#2b2d42',0,.05,-.09),mk('sph',.07,.06,.07,'#2b2d42',0,.05,0),mk('sph',.08,.08,.08,'#2b2d42',0,.06,.08),
      mk('sph',.05,.05,.05,'#ffffff',.025,.09,.11),mk('sph',.05,.05,.05,'#ffffff',-.025,.09,.11));
    if(Math.random()<.5)a.add(mk('box',.07,.05,.07,'#f4d58d',0,.13,.06)); // carrying a crumb
    P(a,1,true,.06);face(g,arg);}),
  popsicle:(x,z,arg)=>sized(x,z,RAD.popsicle,.12,1,'micro',(P,g)=>{
    P(mk('box',.22,.1,.32,pick(['#ff70a6','#ffbe0b','#4cc9f0','#ff595e']),0,.05,.05),1,true,.12);
    P(mk('box',.06,.03,.2,'#e9c46a',0,.02,-.2),1,true,.05);P(mk('sph',.2,.02,.14,'#ffc8dd',.1,.01,.12),1);g.rotation.y=rand(0,6.28);}),
  paperboat:(x,z,arg)=>sized(x,z,RAD.paperboat,.28,1,'micro',(P,g)=>{
    P(mk('box',.18,.08,.42,'#ffffff',0,.05,0),1,true,.12);P(mk('pyr',.2,.22,.32,'#f1faee',0,.2,0),1,true,.1);face(g,arg);}),
  teacup:(x,z)=>sized(x,z,RAD.teacup,.16,1,'micro',P=>{
    P(mk('cyl',.28,.03,.28,'#ffffff',0,.02,0),1,true,.1);P(mk('cyl',.18,.13,.18,pick(['#ffafcc','#a2d2ff','#ffffff']),0,.1,0),1,true,.08);
    P(mk('cyl',.15,.02,.15,'#9c6644',0,.16,0),1);}),
  toycar:(x,z,arg)=>sized(x,z,RAD.toycar,.24,1,'micro',(P,g)=>{const c=pick(CAR_COLORS);
    P(mk('box',.26,.1,.5,c,0,.09,0),1,true,.12);P(mk('box',.22,.09,.24,'#e9f5ff',0,.18,-.03),1,true,.1);
    for(const [wx,wz] of [[-.13,.15],[.13,.15],[-.13,-.15],[.13,-.15]])P(mk('wheel',.05,.1,.1,'#222222',wx,.05,wz),1);face(g,arg);}),
  pail:(x,z)=>sized(x,z,RAD.pail,.3,1,'micro',P=>{const c=pick(['#ff595e','#1982c4','#ffca3a','#8ac926']);
    P(mk('cyl',.3,.28,.3,c,0,.14,0),1,true,.14);P(mk('box',.3,.03,.03,'#ffffff',0,.33,0),1);}),
  soccerball:(x,z)=>sized(x,z,RAD.soccerball,.72,1,'mini',P=>{const b=new THREE.Group();
    b.add(mk('sph',.7,.7,.7,'#ffffff',0,.35,0));for(const [a,c] of [[0,.62],[2.1,.5],[4.2,.48]])b.add(mk('sph',.2,.2,.2,'#222222',Math.sin(a)*.27,c,Math.cos(a)*.27));
    P(b,1,true,.35);},{roll:true}),
  bike:(x,z,arg)=>sized(x,z,RAD.bike,1,2,'tiny',(P,g)=>{const c=pick(PARTY);
    for(const wz of [.55,-.55])P(mk('wheel',.08,.62,.62,'#222222',0,.31,wz),1,true,.3);
    const f=mk('box',.08,.08,1.05,c,0,.62,0);f.rotation.x=.12;P(f,1);P(mk('box',.08,.5,.08,c,0,.5,-.3),1);
    P(mk('box',.22,.08,.32,'#343a40',0,.82,-.32),1,true,.15);P(mk('box',.62,.06,.06,'#adb5bd',0,.92,.48),1,true,.2);
    P(mk('box',.08,.36,.08,c,0,.72,.48),1);face(g,arg);}),
  cake:(x,z)=>sized(x,z,RAD.cake,1,2,'tiny',P=>{
    P(mk('cyl',1,.42,1,'#ffc8dd',0,.21,0),2);P(mk('cyl',.66,.34,.66,'#fff1e6',0,.59,0),2);P(mk('cyl',1.04,.06,1.04,'#ff70a6',0,.43,0),1);
    for(let i=0;i<4;i++){const a=i*1.57+.4;P(mk('cyl',.05,.2,.05,PARTY[i],Math.sin(a)*.2,.86,Math.cos(a)*.2),1,true,.04);
      P(mk('sph',.06,.09,.06,null,Math.sin(a)*.2,1,Math.cos(a)*.2,E('#ffd60a')),1,true,.04);}}),
  sandcastle:(x,z,arg)=>sized(x,z,RAD.sandcastle,1.1,2,'tiny',(P,g)=>{const s='#e9c46a';
    P(mk('box',1,.36,1,s,0,.18,0),3);for(const [tx,tz] of [[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]]){P(mk('cyl',.3,.5,.3,s,tx,.45,tz),1,true,.15);P(mk('cone',.32,.22,.32,'#f4a261',tx,.81,tz),1,true,.1);}
    P(mk('box',.36,.4,.36,s,0,.56,0),1,true,.18);P(mk('cyl',.02,.36,.02,'#ffffff',0,.92,0),1);P(mk('box',.16,.1,.02,'#ff595e',.08,1.04,0),1,true,.06);face(g,arg);}),
  wheelbarrow:(x,z,arg)=>sized(x,z,RAD.wheelbarrow,.8,1,'tiny',(P,g)=>{
    P(mk('box',.7,.32,.8,pick(['#2a9d8f','#e63946','#457b9d']),0,.5,.05),2);P(mk('wheel',.12,.36,.36,'#222222',0,.18,.52),1,true,.18);
    for(const sx of [-.28,.28]){P(mk('box',.06,.06,.9,'#6d4c41',sx,.42,-.45),1);P(mk('box',.06,.32,.06,'#6d4c41',sx,.18,-.1),1);}face(g,arg);}),
  chest:(x,z,arg)=>sized(x,z,RAD.chest,.82,4,'tiny',(P,g)=>{
    P(mk('box',.9,.5,.6,'#8b5a2b',0,.25,0),2);P(mk('box',.92,.24,.62,'#a0522d',0,.62,-.04),1,true,.3);
    P(mk('box',.94,.08,.64,'#ffd60a',0,.5,0),1);P(mk('box',.14,.18,.04,'#ffd60a',0,.44,.31),1);
    for(let i=0;i<3;i++)P(mk('cyl',.16,.05,.16,'#ffd60a',-.25+i*.22,.78,.1),1,true,.06);face(g,arg);}),
  balloons:(x,z)=>sized(x,z,RAD.balloons,2.9,1,'small',P=>{const b=new THREE.Group(),c=PARTY.slice().sort(()=>Math.random()-.5);
    b.add(mk('box',.04,1.9,.04,'#ffffff',0,.95,0));
    [[0,2.5,0],[-.32,2.3,.1],[.3,2.32,-.08]].forEach(([bx,by,bz],i)=>b.add(mk('sph',.55,.66,.55,c[i],bx,by,bz)));
    P(b,1,true,.4);}),
  kite:(x,z,arg)=>sized(x,z,RAD.kite,3.4,2,'small',(P,g)=>{const c=pick(PARTY);
    const st=mk('box',.03,3,.03,'#ffffff',.25,1.5,0);st.rotation.z=-.16;P(st,1);
    const k=new THREE.Group(),d=mk('box',.9,.9,.05,c,0,0,0);d.rotation.z=Math.PI/4;k.add(d,mk('box',.04,1.25,.07,'#ffffff',0,0,.03));
    for(let i=0;i<4;i++)k.add(mk('box',.14,.14,.03,PARTY[(i+2)%7],0,-.8-i*.26,0));k.position.set(.55,3.1,0);k.rotation.z=-.3;P(k,1,true,.45);face(g,arg);}),
  laundry:(x,z,arg)=>sized(x,z,RAD.laundry,2.4,2,'small',(P,g)=>{
    for(const sx of [-2,2]){P(mk('box',.12,2.3,.12,'#adb5bd',sx,1.15,0),1);P(mk('box',.12,.1,.6,'#adb5bd',sx,2.25,0),1);}
    P(mk('box',4,.03,.03,'#ffffff',0,2.2,0),1);
    [[-1.4,'#ffbe0b',.6],[-.6,'#4cc9f0',.5],[.2,'#ff70a6',.7],[1,'#8ac926',.45],[1.6,'#ffffff',.3]].forEach(([lx,c,h])=>P(mk('box',.5,h,.05,c,lx,2.18-h/2,0),1,true,.25));face(g,arg);}),
  lemonade:(x,z,arg)=>sized(x,z,RAD.lemonade,2.7,3,'medium',(P,g)=>sceneStand(P,g,arg,'#ffd60a',P=>{
    P(mk('cyl',.32,.5,.32,'#fff3b0',-.6,1.43,0),1,true,.16);for(let i=0;i<3;i++)P(mk('cyl',.16,.22,.16,'#ffffff',.1+i*.3,1.29,.1),1,true,.08);
    P(mk('sph',.42,.36,.36,'#ffd60a',0,.6,.66),1,true,.18);})),
  veggiestand:(x,z,arg)=>sized(x,z,RAD.veggiestand,2.7,3,'medium',(P,g)=>sceneStand(P,g,arg,'#2a9d8f',P=>{
    for(let i=0;i<4;i++)P(mk('sph',.34,.3,.34,['#fb8500','#e63946','#8ac926','#ffd60a'][i],-.9+i*.6,1.32,0),1,true,.15);
    const cr=mk('cone',.16,.5,.16,'#fb8500',-.7,.6,.68);cr.rotation.x=Math.PI/2;P(cr,1,true,.1);})),
  goal:(x,z,arg)=>sized(x,z,RAD.goal,2,3,'medium',(P,g)=>{
    for(const sx of [-1.9,1.9])P(mk('box',.16,1.9,.16,'#ffffff',sx,.95,0),1);P(mk('box',3.96,.16,.16,'#ffffff',0,1.9,0),1);
    P(mk('box',3.8,1.8,.04,'#dee2e6',0,.9,-.9),2);for(const sx of [-1.9,1.9])P(mk('box',.04,1.8,.9,'#dee2e6',sx,.9,-.45),1);face(g,arg);}),
  icecone:(x,z)=>sized(x,z,RAD.icecone,1.3,1,'tiny',P=>{
    const c=mk('cone',.5,.8,.5,'#e9c46a',0,.4,0);c.rotation.x=Math.PI;P(c,1);
    P(mk('sph',.56,.5,.56,pick(['#ffc8dd','#fff1e6','#8ac926','#9c6644']),0,.95,0),1,true,.25);P(mk('sph',.12,.12,.12,'#e63946',0,1.24,0),1,true,.06);}),
  icetruck:(x,z,arg)=>sized(x,z,RAD.icetruck,3.4,6,'medium',(P,g)=>{
    P(mk('box',1.9,1.6,3.8,'#fff1e6',0,1.15,0),5);P(mk('box',1.85,.9,1,'#a2d2ff',0,1.5,1.9),2);P(mk('box',1.96,.25,3.9,'#ff70a6',0,.45,0),2);
    P(mk('box',.08,.8,1.8,'#ffc8dd',.96,1.35,-.4),1,true,.4);
    for(const [wx,wz] of [[-.9,1.3],[.9,1.3],[-.9,-1.3],[.9,-1.3]])P(mk('wheel',.3,.7,.7,'#222222',wx,.35,wz),1,true,.3);
    const c=mk('cone',.7,1,.7,'#e9c46a',0,2.45,-.6);c.rotation.x=Math.PI;P(c,1,true,.35);P(mk('sph',.9,.8,.9,'#ffc8dd',0,3.1,-.6),1,true,.4);
    P(mk('sph',.18,.18,.18,'#e63946',0,3.55,-.6),1,true,.08);face(g,arg);}),
  // crashed flying saucer (Zorp & Blip's, the crop-circle quest): tilted, smoking, lights still blinking
  saucer:(x,z,arg)=>sized(x,z,RAD.saucer,3,14,'large',(P,g)=>{
    const s=new THREE.Group();s.rotation.z=.22;s.position.y=.7;
    s.add(mk('sph',6.4,1.3,6.4,'#ced4da',0,0,0),mk('cyl',4.4,.3,4.4,'#adb5bd',0,-.5,0));P(s,6);
    const d=mk('sph',2.6,2,2.6,'#9bf6ff',.35,1.6,0);P(d,1,true,1);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(mk('sph',.4,.4,.4,null,Math.cos(a)*2.95,.7-Math.cos(a)*.65,Math.sin(a)*2.95,E(PARTY[i])),1,true,.2);}
    for(let i=0;i<3;i++)P(mk('sph',.9-i*.15,.9-i*.15,.9-i*.15,'#e9ecef',-2.2-i*.3,2.2+i*.9,.4),1,true,.4);face(g,arg);})
});
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
  if(!MICRO_T.has(type)&&(startLane(x,z)||(z>8&&Math.abs(x)<ROAD_W/2+tmpR)))return null; // D18: the start road stays clear
  for(const o of objects)if(Math.abs(o.x-x)<o.r+tmpR&&Math.hypot(o.x-x,o.z-z)<(o.r+tmpR)*.8)return null; // no stacking
  return OBJ[type](x,z,arg);
}

function buildWorld(){
  startStreet(); // first, so the start spot gets its props before anything else
  // D18: the jumps stay (across the cross street, up the north road, into the bowling pins)
  addRamp(30,8,Math.PI);addRamp(-38,2,Math.PI);addRamp(0,-20,Math.PI);addRamp(-55,70,Math.PI);
  homeArena(); // Hank's Street: lots on every street, a play lot in each block (D18 part 2, below)
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

/* ---------- D11 neighborhoods ----------
   Roads run every ROAD_EVERY (160) on 80-wide chunks, so a chunk has a road down its middle (x=cx) when ci is even
   and across it (z=cz) when cj is even: one road = a street, two = a crossing, none = the middle of a block.
   hoodSide() gives a street side in road coordinates: u runs along the road, s is the distance from its middle
   (the road is 10 wide, so its edge is s=5). Spots (L19) mark sidewalks, yards, driveways, fields… so the
   size-matched filler lands where it belongs (SPOT_PROPS below). */
function hoodRoads(ctx){const on=r=>Math.abs(r-Math.round(r/ROAD_EVERY)*ROAD_EVERY)<1;return {v:on(ctx.cx),h:on(ctx.cz)};}
function hoodSide(ctx,axis,side){const V=axis==='v';
  const p=(u,s)=>V?[ctx.cx+side*s,ctx.cz+u]:[ctx.cx+u,ctx.cz+side*s];
  const S={p,V,side,ctx,face:V?(side<0?1:3):(side<0?0:2),th:V?(side<0?Math.PI/2:-Math.PI/2):(side<0?0:Math.PI),
    put(type,u,s,arg,r){const [x,z]=p(u,s);return r?ctx.place(type,x,z,arg,r):put(ctx,type,x,z,arg);},
    spot(kind,u0,u1,s0,s1){const [x,z]=p((u0+u1)/2,(s0+s1)/2);return V?ctx.spot(kind,x,z,s1-s0,u1-u0,0):ctx.spot(kind,x,z,u1-u0,s1-s0,0);},
    // fence pieces are ~4 long; r=1 lets a line of them sit end to end
    fenceU(u0,u1,s){for(let u=u0;u<=u1+.01;u+=4.2)S.put('fence',u,s,V?Math.PI/2:0,1);},
    fenceS(u,s0,s1){for(let s=s0;s<=s1+.01;s+=4.2)S.put('fence',u,s,V?0:Math.PI/2,1);}};
  return S;}
// sidewalk strip + a lamp or two along one side, skipping the cross street's band
function hoodWalk(S,u0,u1,w){S.spot('sidewalk',u0,u1,5.4,5.4+w);for(let u=u0+6;u<u1-3;u+=24)S.put('lamp',u+(S.side>0?12:0),5.4+w-.6,0);}
// one house lot centered at uc: front yard, path, mailbox, driveway, back yard behind a fence
function hoodLot(S,uc){
  const kind=lotKind(),r=RAD[kind],sh=15+r,back=sh+r+.6;
  if(!S.put(kind,uc,sh,S.face))return;
  S.spot('yard',uc-7.6,uc+r+.2,8.8,sh-r);S.spot('path',uc-.8,uc+.8,8.8,sh-r);
  S.spot('backyard',uc-7.6,uc+7.6,back,37);
  const dw=uc+r+.6;S.spot('parking',dw,dw+3.2,8.8,sh+1.5);
  if(Math.random()<.45)S.put('parked',dw+1.6,11.4,S.face);
  S.put('mailbox',uc-1.7,9.3,S.face);
  if(Math.random()<.6)S.put('fence',uc-5.6,9.9,S.V?Math.PI/2:0,1);
  if(Math.random()<.7){S.put('flowers',uc-r+.4,sh-r-.9,0);S.put('flowers',uc+r-.4,sh-r-.9,0);}
  if(Math.random()<.5)S.fenceU(uc-6.3,uc+6.3,37.6);
  if(Math.random()<.35)S.fenceS(uc+7.9,back+1,34);
  if(Math.random()<.6)S.put('tree',uc+rand(-6,6),rand(back+3,35),0);
  if(Math.random()<.4)S.put('doghouse',uc+rand(-5,5),rand(back+2,34),S.face);
  if(Math.random()<.2)S.put('swing',uc+rand(-4,4),rand(back+3,33),S.V?1:0);}
// a houses street side; us = lot centers along the road
// D18: each plot is a lot scene (SCENES.lot_*), front on the sidewalk (s 8.8) and back fence at s 38
function hoodHouses(S,us){hoodWalk(S,-40,40,3.2);for(const u of us){const [x,z]=S.p(u,23.4);if(!S.ctx.scene(pick(LOTS),x,z,S.th))hoodLot(S,u);}
  S.put('hydrant',pick(us)+8,8.2,0);}
// a main street side: shops on a wide sidewalk, benches and bins, a parking lot behind
function hoodShops(S,us,u0,u1){
  hoodWalk(S,u0,u1,4.4);for(const u of us){if(!S.put('shop',u,13.6,S.face))continue;
    if(Math.random()<.5)S.put(pick(['bench','trashcan']),u+4.9,8.6,S.face);}
  S.spot('parking',u0+2,u1-2,19,37);
  for(let u=u0+5;u<u1-3;u+=6.2){if(Math.random()<.55)S.put('parked',u,23,S.V?0:1);if(Math.random()<.45)S.put('parked',u,31.5,S.V?0:1);}
  S.put('hydrant',(u0+u1)/2,8.8,0);}
// the four corners of a chunk left over by its roads: {x0,x1,z0,z1,cx,cz,qx,qz}
function hoodQuads(ctx,R,pad=3){const out=[];
  for(const qx of [-1,1])for(const qz of [-1,1]){const ax=ctx.cx+qx*(R.v?7.5:pad),bx=ctx.cx+qx*38.5,az=ctx.cz+qz*(R.h?7.5:pad),bz=ctx.cz+qz*38.5;
    const x0=Math.min(ax,bx),x1=Math.max(ax,bx),z0=Math.min(az,bz),z1=Math.max(az,bz);out.push({x0,x1,z0,z1,cx:(x0+x1)/2,cz:(z0+z1)/2,qx,qz});}
  return out;}
const hoodSpot=(ctx,kind,q,m=0)=>ctx.spot(kind,q.cx,q.cz,q.x1-q.x0-m*2,q.z1-q.z0-m*2,0);
// sidewalks along whatever roads cross the chunk (landmark chunks too)
function hoodSidewalks(ctx,R,w=3.2){for(const [ax,on] of [['v',R.v],['h',R.h]])if(on)for(const sd of [-1,1])hoodSide(ctx,ax,sd).spot('sidewalk',-40,40,5.4,5.4+w);}
// park corners: one activity each
const HOOD_PARK={
  play(ctx,q){hoodSpot(ctx,'sand',q,5);put(ctx,'swing',q.cx-5,q.cz,1);put(ctx,'slide',q.cx+5,q.cz+1,0);
    if(Math.random()<.5)put(ctx,'gym',q.cx,q.cz-q.qz*8,0);put(ctx,'bench',q.cx-q.qx*11,q.cz+q.qz*9,q.qx>0?1:3);put(ctx,'trashcan',q.cx-q.qx*11,q.cz+q.qz*12,0);
    put(ctx,'beachball',q.cx+2,q.cz+5,0);},
  pond(ctx,q){const p=put(ctx,'pond',q.cx,q.cz,0);hoodSpot(ctx,'lawn',q,2);if(p){ctx.herd(pick(['duck','duck','goose']),q.cx+7,q.cz+2,5);
    ring(ctx,q.cx,q.cz,RAD.pond+2.3,7,'flowers');put(ctx,'bench',q.cx,q.cz+RAD.pond+4.6,2);put(ctx,'bench',q.cx-RAD.pond-4.6,q.cz,1);}},
  picnic(ctx,q){hoodSpot(ctx,'lawn',q,2);for(let i=0;i<3;i++){const a=i*2.1+.4;put(ctx,'picnic',q.cx+Math.cos(a)*7,q.cz+Math.sin(a)*7,i);}
    put(ctx,'tree',q.cx,q.cz,0);put(ctx,'trashcan',q.cx+11,q.cz-10,0);put(ctx,'birdbath',q.cx-10,q.cz+10,0);},
  woods(ctx,q){hoodSpot(ctx,'lawn',q,1);for(let i=0;i<9;i++)put(ctx,'tree',rand(q.x0+3,q.x1-3),rand(q.z0+3,q.z1-3),0);
    for(let i=0;i<4;i++)put(ctx,'bush',rand(q.x0+3,q.x1-3),rand(q.z0+3,q.z1-3),0);},
  fountain(ctx,q){hoodSpot(ctx,'plaza',q,6);put(ctx,'fountain',q.cx,q.cz,0);ring(ctx,q.cx,q.cz,RAD.fountain+2.4,4,'bench');ring(ctx,q.cx,q.cz,RAD.fountain+5.2,8,'flowers');}
};
// is this chunk one of the zone landmarks? (they keep their own layouts and just get sidewalks)
function hoodShuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
// a park block: paths along the middle (where no road runs), sidewalks along roads, one activity per corner, trees round the edge
function hoodPark(ctx,R,acts){
  hoodSidewalks(ctx,R);if(!R.v)ctx.spot('path',ctx.cx,ctx.cz,4,80,0);if(!R.h)ctx.spot('path',ctx.cx,ctx.cz,80,4,0);
  if(!R.v&&!R.h){put(ctx,'fountain',ctx.cx,ctx.cz,0);ring(ctx,ctx.cx,ctx.cz,RAD.fountain+4.2,6,'flowers');}
  const qs=hoodQuads(ctx,R,3.5),list=hoodShuffle(acts);qs.forEach((q,i)=>HOOD_PARK[list[i%list.length]](ctx,q));
  for(let i=0;i<10;i++){const e=Math.random()*4|0,t=rand(-36,36),x=ctx.cx+(e<2?(e?37:-37):t),z=ctx.cz+(e<2?t:(e>2?37:-37));put(ctx,'tree',x,z,0);}}
// farm corners
const HOOD_FARM={
  field(ctx,q){hoodSpot(ctx,'field',q,1);const n=Math.floor((q.x1-q.x0-6)/6),m=Math.floor((q.z1-q.z0-6)/6.2),k=Math.random()*2|0;
    for(let i=0;i<n;i++)for(let j=0;j<m;j++)put(ctx,'crops',q.x0+6+i*6,q.z0+6+j*6.2,k);
    if(Math.random()<.6)put(ctx,'scarecrow',q.cx+.5,q.cz+3.1,0);},
  patch(ctx,q){hoodSpot(ctx,'patch',q,2);for(let x=q.x0+4;x<q.x1-3;x+=3.2)for(let z=q.z0+4;z<q.z1-3;z+=4.4)if(Math.random()<.55)put(ctx,Math.random()<.75?'pumpkin':'melon',x+rand(-.5,.5),z,0);
    put(ctx,'scarecrow',q.cx,q.cz,0);},
  pen(ctx,q){const w=Math.min(q.x1-q.x0,q.z1-q.z0)-8,h=w/2,x=q.cx,z=q.cz,gate=Math.random()*4|0;ctx.spot('pen',x,z,w,w,0);
    for(let t=-h+2;t<=h-1.9;t+=4.2){[[x+t,z-h,0,0],[x+t,z+h,0,1],[x-h,z+t,Math.PI/2,2],[x+h,z+t,Math.PI/2,3]].forEach(([fx,fz,ry,sd])=>{
      if(sd===gate&&Math.abs(t)<2.5)return;ctx.place('fence',fx,fz,ry,1);});}
    const kind=pick(['pig','sheep','cow','goat','horse','pig','sheep']);ctx.herd(kind,x,z,kind==='horse'||kind==='cow'?3:4);
    put(ctx,'hay',x+h*.45,z-h*.45,0);put(ctx,'trashcan',x-h*.5,z-h*.55,0);},
  hayyard(ctx,q){hoodSpot(ctx,'field',q,2);for(let i=0;i<5;i++)put(ctx,'hay',rand(q.x0+4,q.x1-4),rand(q.z0+4,q.z1-4),0);
    if(Math.random()<.6)put(ctx,'tractor',q.cx,q.cz,Math.random()*4|0);else put(ctx,'farmhouse',q.cx,q.cz,q.qz<0?0:2);
    if(Math.random()<.6)ctx.herd('chicken',q.cx+6,q.cz+6,4);}
};
// farm roadsides: a narrow verge, a fence with a gap and a mailbox at the gate
function farmRoadside(ctx,R){
  for(const [ax,on] of [['v',R.v],['h',R.h]])if(on)for(const sd of [-1,1]){const S=hoodSide(ctx,ax,sd);S.spot('sidewalk',-40,40,5.4,7.6);
    if(Math.random()<.75){const g=rand(-28,28);for(let u=-37;u<=37;u+=4.2)if(Math.abs(u-g)>4&&(!R.v||!R.h||Math.abs(u)>8))S.put('fence',u,8.2,S.V?Math.PI/2:0,1);S.put('mailbox',g,8.6,S.face);}}}
function hoodFarm(ctx,R){
  farmRoadside(ctx,R);
  const qs=hoodQuads(ctx,R,1.5),list=hoodShuffle(['field','field','patch','pen','hayyard']);qs.forEach((q,i)=>HOOD_FARM[list[i]](ctx,q));}
/* Ground tint per spot kind, for logic to paint spots as flat tiles (NEEDS LOGIC, see TASKS L30). */
const SPOT_LOOK={sidewalk:'#d9d9d9',path:'#e9d8a6',parking:'#9aa0a6',plaza:'#e5e0d8',yard:'#7ccf5a',backyard:'#6fc04e',lawn:'#86d16a',
  sand:'#f4e3b0',field:'#a47148',patch:'#8d6748',pen:'#c9a46c'};

/* Landmark set pieces (one chunk each). Random worlds put them where pickLandmarks() says; the Home World plan
   (HOME_PLAN below) puts them at fixed chunks so the quests know where they are. */
const LMK={
  // town
  boss(ctx){const p=drop(ctx,'boss',0);if(p){ring(ctx,p.x,p.z,RAD.boss+2.6,6,'lamp');ring(ctx,p.x,p.z,RAD.boss+5.4,4,'hydrant');}crumbs(ctx,4,['parked','mailbox','bush']);},
  school(ctx){const p=drop(ctx,'school',0);if(p){put(ctx,'bench',p.x-4,p.z+RAD.school+2.6,0);put(ctx,'bench',p.x+4,p.z+RAD.school+2.6,0);put(ctx,'flowers',p.x,p.z+RAD.school+2.2,0);}crumbs(ctx,5,['tree','bush','lamp']);},
  fire(ctx){const p=drop(ctx,'firestation',0);if(p){ring(ctx,p.x,p.z,RAD.firestation+2.2,4,'hydrant');put(ctx,'parked',p.x+RAD.firestation+4,p.z,1);}crumbs(ctx,3,['cone','lamp']);},
  sky(ctx){const p=drop(ctx,'skyscraper',0);if(p){ring(ctx,p.x,p.z,RAD.skyscraper+2.6,6,'lamp');put(ctx,'parked',p.x+RAD.skyscraper+5,p.z+4,1);put(ctx,'parked',p.x-RAD.skyscraper-5,p.z-4,3);}crumbs(ctx,4,['hydrant','mailbox','bush','cone']);},
  tower(ctx){const p=drop(ctx,'watertower',0);if(p)ring(ctx,p.x,p.z,RAD.watertower+4.2,5,'cottage');crumbs(ctx,4,['tree','mailbox']);},
  // farm: the barn yard has hay round the barn and a fenced paddock with animals in the corner farthest from it
  barn(ctx){const R=hoodRoads(ctx),p=drop(ctx,'barn',0);if(p){ring(ctx,p.x,p.z,RAD.barn+3,6,'hay');put(ctx,'tractor',p.x+RAD.barn+4.2,p.z+4,0);
    ctx.spot('field',p.x,p.z,RAD.barn*2+12,RAD.barn*2+12,0);
    const q=hoodQuads(ctx,R,1.5).sort((a,b)=>Math.hypot(b.cx-p.x,b.cz-p.z)-Math.hypot(a.cx-p.x,a.cz-p.z))[0];HOOD_FARM.pen(ctx,q);}
    crumbs(ctx,4,['crops','scarecrow','pumpkin']);},
  mill(ctx){const p=drop(ctx,'windmill',0);if(p){ring(ctx,p.x,p.z,RAD.windmill+4.2,5,'crops');ctx.herd('chicken',p.x+8,p.z+6,4);}crumbs(ctx,4,['hay','flowers','bush']);},
  silo(ctx){const a=drop(ctx,'silo',0);if(a){put(ctx,'silo',a.x+7,a.z-6,0);put(ctx,'farmhouse',a.x-12,a.z+8,1);ring(ctx,a.x,a.z,8,4,'hay');}},
  farmpond(ctx){const p=drop(ctx,'pond',0);if(p){ring(ctx,p.x,p.z,RAD.pond+2.2,5,'flowers');put(ctx,'tractor',p.x+RAD.pond+4.2,p.z,1);put(ctx,'hay',p.x,p.z+RAD.pond+3,0);}crumbs(ctx,3,['tree','bush']);},
  coop(ctx){const p=drop(ctx,'coop',0);if(p){ctx.herd('chicken',p.x,p.z+RAD.coop+3.2,6);put(ctx,'scarecrow',p.x+6,p.z+5,0);}for(let z=ctx.z0+10;z<ctx.z1-10;z+=8)put(ctx,'fence',ctx.x0+8,z,Math.PI/2);crumbs(ctx,3,['hay','crops']);},
  // park
  fountain(ctx){const p=drop(ctx,'fountain',0);if(p){ring(ctx,p.x,p.z,RAD.fountain+2.2,4,'bench');ring(ctx,p.x,p.z,RAD.fountain+4.4,6,'flowers');}crumbs(ctx,5,['tree','bush']);},
  play(ctx){const p=drop(ctx,'gym',0);if(p){put(ctx,'swing',p.x+7,p.z+1,1);put(ctx,'slide',p.x-7,p.z+1,0);put(ctx,'bench',p.x+6,p.z-5,0);put(ctx,'bench',p.x-5,p.z-5,2);put(ctx,'flowers',p.x,p.z+6,0);ring(ctx,p.x,p.z,14,6,'tree');}},
  gazebo(ctx){const p=drop(ctx,'gazebo',0);if(p){ring(ctx,p.x,p.z,RAD.gazebo+2.4,4,'picnic');ring(ctx,p.x,p.z,RAD.gazebo+4.2,6,'flowers');}crumbs(ctx,4,['tree','bench']);},
  bounce(ctx){const p=drop(ctx,'bounce',0);if(p)ring(ctx,p.x,p.z,RAD.bounce+2,8,'cone');ctx.ramp(ctx.cx+18,ctx.cz,Math.PI/2);crumbs(ctx,3,['bench','flowers']);},
  stadium(ctx){const p=drop(ctx,'stadium',0);if(p)ring(ctx,p.x,p.z,RAD.stadium+3,8,'lamp');crumbs(ctx,4,['cone','bench','flowers']);},
  ferris(ctx){const p=drop(ctx,'ferris',0);if(p){ring(ctx,p.x,p.z,RAD.ferris+3,6,'flowers');put(ctx,'picnic',p.x+RAD.ferris+5,p.z+3,1);put(ctx,'bench',p.x-RAD.ferris-4,p.z+3,3);}crumbs(ctx,4,['tree','bush','cone']);},
  ship(ctx){const p=drop(ctx,'ship',0);if(p){ring(ctx,p.x,p.z,RAD.ship+3,6,'barrel');ring(ctx,p.x,p.z,RAD.ship+6,5,'crates');}crumbs(ctx,3,['tree','pebble']);},
  ducks(ctx){const p=drop(ctx,'pond',0);if(p){ctx.herd('duck',p.x+RAD.pond+3,p.z,6);put(ctx,'bench',p.x+RAD.pond+2.6,p.z+2,1);put(ctx,'bench',p.x-RAD.pond-2.6,p.z-2,3);}crumbs(ctx,4,['tree','flowers','bush']);}
};
const LMK_ZONE={town:['boss','school','fire','sky','tower'],farm:['barn','mill','silo','farmpond','coop'],park:['fountain','play','gazebo','bounce','stadium','ferris','ship','ducks']};
// random worlds: is this chunk one of the zone's landmarks? then build it (with sidewalks along its roads) and say so
function lmkHere(ctx,zone,w=3.2){const LM=landmarks();for(const k of LMK_ZONE[zone])if(at(LM[k],ctx)){hoodSidewalks(ctx,hoodRoads(ctx),w);LMK[k](ctx);return true;}return false;}
// a houses or shops street chunk (one road through it); shops:true/false, or leave it out for today's 28% shops
function townStreet(ctx,R,shops){const ax=R.v?'v':'h';
  if(shops??Math.random()<.28){for(const sd of [-1,1])hoodShops(hoodSide(ctx,ax,sd),[-30,-20,-10,0,10,20,30],-40,40);return;}
  for(const sd of [-1,1])hoodHouses(hoodSide(ctx,ax,sd),[-32,-16,0,16,32]);
  propsRamp(ctx);}
// a crossing: main street on all four arms, a little plaza at each corner
function townCross(ctx){
  for(const [ax,us] of [['h',[[16,25.5,35],[-16,-25.5,-35]]],['v',[[25.5,35],[-25.5,-35]]]])for(const sd of [-1,1]){const S=hoodSide(ctx,ax,sd);
    hoodShops(S,us[0],12,40);hoodShops(S,us[1],-40,-12);}
  for(const qx of [-1,1])for(const qz of [-1,1]){ctx.spot('plaza',ctx.cx+qx*8.5,ctx.cz+qz*8.5,6,6,0);put(ctx,pick(['bench','trashcan','hydrant']),ctx.cx+qx*9,ctx.cz+qz*9,0);}}

/* ---------- D18 part 3: Arcade blocks (L31 ctx.block) ----------
   Hand-made chunk designs for the random worlds (Arcade's NEW WORLD). Local coordinates: the chunk center is 0,0
   (−40…40), +Z is local "south"; an 'ns' block has its road along z through x=0 (road edge |x|=5, sidewalk to 8.6),
   a 'cross' block has roads both ways, 'none' is the middle of a block. ctx.block turns and mirrors them, so a few
   designs make a varied world. Lots face the road (th = ±π/2 on an 'ns' road). The zone layouts use a block for
   about half their plain chunks and the D11 street generator for the rest. */
const blkP=(b,t,x,z,th)=>b.place(t,x,z,0,RAD[t]||1.2,th||0);
const blkFenceX=(b,x0,x1,z,gap)=>{for(let x=x0;x<=x1+.01;x+=4.2)if(gap==null||Math.abs(x-gap)>3)b.place('fence',x,z,0,1,0);};
const blkFenceZ=(b,x,z0,z1,gap)=>{for(let z=z0;z<=z1+.01;z+=4.2)if(gap==null||Math.abs(z-gap)>3)b.place('fence',x,z,0,1,Math.PI/2);};
const blkFace=sd=>sd<0?Math.PI/2:-Math.PI/2; // a prop on side sd of an 'ns' road, front toward the road
// sidewalks along the 'ns' road (and the cross road too for 'cross'), lamps every 24
function blkWalks(b,cross,w=3.2){for(const sd of [-1,1]){b.spot('sidewalk',sd*(5.4+w/2),0,w,80);if(cross)b.spot('sidewalk',0,sd*(5.4+w/2),80,w);
  for(const z of [-28,4,28])if(!cross||Math.abs(z)>10)blkP(b,'lamp',sd*(5.2+w),z*sd);}}
function blkTrees(b,n,pad=37){for(let i=0;i<n;i++){const e=Math.random()*4|0,t=rand(-pad,pad);blkP(b,'tree',e<2?(e?pad:-pad):t,e<2?t:(e>2?pad:-pad));}}
// a row of lots along one side of an 'ns' road (zs = lot centers along the road)
function blkLots(b,sd,zs){for(const z of zs)b.scene(pick(LOTS),sd*23.4,z,blkFace(sd));}
// shops on one side of an 'ns' road with parking behind
function blkShops(b,sd,zs){for(const z of zs){blkP(b,'shop',sd*13.6,z,blkFace(sd));if(Math.random()<.5)blkP(b,pick(['bench','trashcan']),sd*9,z+4.9,blkFace(sd));}
  const z0=Math.min(...zs)-5,z1=Math.max(...zs)+5;b.spot('parking',sd*28,(z0+z1)/2,18,z1-z0);
  for(let z=z0+3;z<z1-2;z+=6.2){if(Math.random()<.55)blkP(b,'parked',sd*23,z,0);if(Math.random()<.45)blkP(b,'parked',sd*32,z,Math.PI);}}
// home blocks share their chunk with the hand-built start arena: only build what's outside it
function blkOut(b,x,z,r){if(b.mirror)x=-x;const ca=Math.round(Math.cos(b.turn)),sa=Math.round(Math.sin(b.turn)),wx=b.cx+x*ca+z*sa,wz=b.cz-x*sa+z*ca;
  return !(Math.abs(wx)<HOME+r&&Math.abs(wz)<HOME+r);}
const blkSc=(b,id,x,z,th,size,r)=>blkOut(b,x,z,r||6)&&b.scene(id,x,z,th,size);
const blkSpot=(b,k,x,z,w,d)=>blkOut(b,x,z,Math.max(w,d)/2)&&b.spot(k,x,z,w,d);

const ZONE_BLOCKS={
  town:[
    // a mixed street: houses on one side, the corner store, lemonade stand, car wash and ice-cream truck on the other
    {roads:'ns',weight:2,build(b){blkWalks(b);blkLots(b,-1,[-32,-16,0,16,32]);
      blkShops(b,1,[-31,-21]);b.scene('lemonade_stand',13,-7,blkFace(1));b.scene('car_wash',20,9,blkFace(1));
      b.scene('icecream_line',14,28,blkFace(1));b.scene('garbage_day',7,18,blkFace(1),'mini');
      b.spot('lawn',30,24,16,28);blkP(b,'tree',34,14);blkP(b,'tree',35,36);blkP(b,'hydrant',8.2,-12);}},
    // main street: shops both sides, a fountain nook on one side and the ice-cream truck across from it
    {roads:'ns',build(b){blkWalks(b,false,4.4);blkShops(b,-1,[-33,-23,-13,15,25,35]);blkShops(b,1,[-33,-23,-13,15,25,35]);
      b.spot('plaza',-15,1,12,12);blkP(b,'fountain',-15,1);for(const z of [-4,6])blkP(b,'bench',-10,z,Math.PI/2);
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;blkP(b,'flowers',-15+Math.sin(a)*4.4,1+Math.cos(a)*4.4);}
      b.scene('icecream_line',15,1,blkFace(1));b.scene('garbage_day',-7.6,-18,blkFace(-1),'mini');b.scene('hopscotch',7.6,9,blkFace(1),'tiny');}},
    // a crossing with a different story on each corner: fountain plaza, corner shops, car wash, yard sale
    {roads:'cross',build(b){blkWalks(b,true);
      b.spot('plaza',23,23,30,30);blkP(b,'fountain',23,23);for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.8;blkP(b,'bench',23+Math.sin(a)*6.2,23+Math.cos(a)*6.2,a+Math.PI);}
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;blkP(b,'flowers',23+Math.sin(a)*9.4,23+Math.cos(a)*9.4);}
      for(const z of [16,26,36])blkP(b,'shop',-13.6,z,Math.PI/2);for(const x of [-26,-36])blkP(b,'shop',x,13.6,Math.PI);
      b.spot('parking',-28,28,16,16);blkP(b,'parked',-27,26,0);blkP(b,'parked',-33,32,Math.PI);
      b.spot('parking',24,-24,28,26);b.scene('car_wash',24,-26,Math.PI/2);for(const x of [16,32])blkP(b,'parked',x,-13,Math.PI/2);
      b.spot('lawn',-23,-23,28,28);b.scene('yard_sale',-22,-16,Math.PI,'medium');b.scene('birthday_party',-24,-30,Math.PI);
      for(const [x,z] of [[-36,-12],[-12,-36],[-36,-36]])blkP(b,'tree',x,z);
      for(const sx of [-1,1])for(const sz of [-1,1])blkP(b,pick(['hydrant','trashcan','mailbox']),sx*9,sz*9);}},
    // the middle of a block (backs of the lots all round): the neighborhood pool, a playground, a garden and a party
    {roads:'none',build(b){b.spot('lawn',0,0,78,78);b.spot('path',0,0,4,78);b.spot('path',0,0,78,4);
      b.spot('plaza',-18,-18,30,24);b.spot('pool',-18,-18,20,12);b.spot('pool',-24,-18,6,16);
      for(const [x,z,t] of [[-22,-20,1],[-14,-16,2.5],[-18,-21,4]])b.place('toyduck',x,z,0,null,t);
      for(const [x,z] of [[-12,-14],[-25,-15]])blkP(b,'beachball',x,z);for(const x of [-28,-18,-8])blkP(b,'bench',x,-6.6,Math.PI);
      blkP(b,'lamp',-6,-30);blkP(b,'lamp',-30,-6);blkP(b,'trashcan',-6,-8);
      b.scene('playground_corner',18,-20,0,'medium');b.scene('sandcastle_day',26,-6,0,'small');
      for(const z of [11,17,23])b.spot('flowerbed',-18,z,24,2.2);for(let x=-28;x<=-8;x+=4)for(const z of [11,17,23])blkP(b,Math.random()<.7?'flowers':'mushroom',x,z);
      for(const x of [-27,-17,-9])blkP(b,'gnome',x,14);blkP(b,'birdbath',-18,29);blkP(b,'wheelbarrow',-8,28,.5);
      b.scene('birthday_party',18,20,Math.PI);b.scene('snail_race',-4,10,0,'mini');b.scene('hopscotch',3,-10,0,'mini');b.scene('ant_picnic',10,4,0,'mini');
      blkP(b,'fountain',0,0);blkTrees(b,10);}}
  ],
  farm:[
    // a farm road: the farmhouse yard with a veggie stand on one side, a cornfield behind the fence on the other
    {roads:'ns',weight:2,build(b){for(const sd of [-1,1])b.spot('sidewalk',sd*6.5,0,2.2,80);
      b.spot('yard',-23,-14,30,40);blkP(b,'farmhouse',-24,-18,Math.PI/2);blkP(b,'mailbox',-8.6,-8,Math.PI/2);b.spot('path',-14,-8,10,2.4);
      b.scene('veggie_stand',-14,8,Math.PI/2);b.scene('laundry_day',-30,-34,Math.PI/2,'medium');b.scene('pig_pen',-24,24,Math.PI/2,'medium');
      blkFenceZ(b,-8.6,-37,37,-8);blkFenceZ(b,8.6,-37,37,4);blkP(b,'tree',-36,0);blkP(b,'tree',-36,8);
      b.spot('field',24,0,30,76);for(let x=14;x<=34;x+=6)for(let z=-34;z<=34.1;z+=6.2)if(Math.hypot(x-24,z-4)>5)blkP(b,'crops',x,z);
      blkP(b,'scarecrow',24,4);blkP(b,'tractor',12,4,0);b.herd('chicken',-14,-28,4);}},
    // an orchard road: rows of trees on one side, pumpkins, a hay maze and a tractor parade on the other
    {roads:'ns',build(b){for(const sd of [-1,1])b.spot('sidewalk',sd*6.5,0,2.2,80);
      b.spot('lawn',-23,0,30,78);for(let x=-34;x<=-12;x+=7.4)for(let z=-34;z<=34;z+=8.6)blkP(b,'tree',x+(Math.abs(z)%2),z);
      blkP(b,'wheelbarrow',-16,-4,.4);for(const [x,z] of [[-20,-8],[-27,4],[-19,13]])blkP(b,'pumpkin',x,z);
      b.scene('pumpkin_patch',21,-26,0,'small');b.scene('hay_maze',23,0,0);b.scene('tractor_parade',22,26,-Math.PI/2,'medium');
      blkFenceZ(b,8.6,-37,37,12);b.scene('veggie_stand',-13,24,Math.PI/2,'small');}},
    // a farm crossing: a story on every corner (pumpkin patch, hay maze, chicken yard, pig pen) behind gated fences
    {roads:'cross',build(b){for(const sd of [-1,1]){b.spot('sidewalk',sd*6.5,0,2.2,80);b.spot('sidewalk',0,sd*6.5,80,2.2);}
      b.scene('pumpkin_patch',-23,-23,0,'small');b.scene('hay_maze',23,-23,0);b.scene('chicken_yard',-23,23,Math.PI);b.scene('pig_pen',23,23,Math.PI,'medium');
      for(const sd of [-1,1]){blkFenceX(b,10,38,sd*9,24);blkFenceX(b,-38,-10,sd*9,-24);blkFenceZ(b,sd*9,10,38,24);blkFenceZ(b,sd*9,-38,-10,-24);}
      blkP(b,'mailbox',-10,-11);blkP(b,'tractor',32,-8,Math.PI/2);blkP(b,'hay',-34,-10);blkP(b,'hay',-36,-12);b.spot('field',23,-23,30,30);}},
    // the open fields: corn and wheat stripes, a duck pond, haystacks and a ramp over the tractor track
    {roads:'none',build(b){b.spot('field',0,0,78,78);b.spot('dirt',0,0,78,6);
      for(let x=-34;x<=34;x+=6)for(const z of [-34,-27.8,-21.6,-15.4,15.4,21.6,27.8,34])if(!(x>8&&z<-10))blkP(b,'crops',x,z);
      b.scene('tractor_parade',-10,0,0);b.spot('lawn',24,-24,26,24);blkP(b,'pond',24,-24);b.herd('duck',30,-18,5);
      for(const [x,z] of [[16,-14],[33,-31]])blkP(b,'bush',x,z);for(const [x,z] of [[18,6],[24,8],[30,5]])blkP(b,'hay',x,z);
      blkP(b,'scarecrow',0,24);b.herd('cow',-20,-12,3);b.ramp(24,-3,Math.PI/2,11,7,3.2);}}
  ],
  park:[
    // the big pond: water in the middle, ducks, picnic blankets round the shore, a kite lawn and trees
    {roads:'none',weight:2,build(b){b.spot('lawn',0,0,78,78);b.spot('water',0,-2,30,20);b.spot('water',-6,4,16,14);blkP(b,'pond',0,-2);
      b.herd('duck',8,-6,6);b.herd('goose',-10,4,3);for(const [x,z,t] of [[-8,-6,.4],[6,4,-1]])b.place('paperboat',x,z,0,null,t);
      for(const [x,z] of [[-17,-10],[16,6],[14,-12],[-14,12]])blkP(b,'bush',x,z);
      for(const [x,z,t] of [[0,11,Math.PI],[19,-2,-Math.PI/2],[-20,-4,Math.PI/2]])blkP(b,'bench',x,z,t);
      b.spot('path',0,24,78,3);b.scene('picnic_blanket',-24,24,0);b.scene('picnic_blanket',4,30,0);b.scene('icecream_line',26,28,0);
      b.scene('kite_field',-4,-28,0,'medium');b.scene('ant_picnic',-12,18,0,'mini');b.scene('puddle_boats',12,16,0,'mini');blkTrees(b,12);}},
    // a park along a road: the soccer pitch and the band on one side, the playground, sandpit and ice-cream on the other
    {roads:'ns',build(b){blkWalks(b);b.spot('lawn',-23,0,30,78);b.spot('lawn',23,0,30,78);
      b.scene('soccer_game',-23,-14,Math.PI/2);b.scene('concert',-23,23,Math.PI/2,'medium');
      b.scene('playground_corner',23,-18,-Math.PI/2,'medium');b.scene('sandcastle_day',23,6,-Math.PI/2,'small');b.scene('icecream_line',16,28,-Math.PI/2);
      for(const z of [-36,-8,36])for(const sd of [-1,1])blkP(b,'tree',sd*36,z);blkP(b,'trashcan',9.4,-2);blkP(b,'trashcan',-9.4,8);}},
    // a park crossing: fountain plaza, picnic, playground and kite lawn on the four corners
    {roads:'cross',build(b){blkWalks(b,true);for(const sx of [-1,1])for(const sz of [-1,1])b.spot('lawn',sx*23,sz*23,30,30);
      b.spot('plaza',23,23,22,22);blkP(b,'fountain',23,23);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;blkP(b,'flowers',23+Math.sin(a)*6,23+Math.cos(a)*6);}
      b.scene('picnic_blanket',-23,20,0);b.scene('picnic_blanket',-28,32,0,'tiny');b.scene('playground_corner',23,-23,0,'medium');b.scene('kite_field',-23,-23,0);
      for(const [x,z] of [[-36,10],[-10,36],[36,-10],[10,-36],[-36,-36],[36,36]])blkP(b,'tree',x,z);}},
    // a sports lawn: a big soccer pitch, lawn bowling with pins, two jump ramps and the band stand
    {roads:'none',build(b){b.spot('lawn',0,0,78,78);b.scene('soccer_game',0,-14,0,'large');
      for(let row=0;row<4;row++)for(let k=0;k<=row;k++)blkP(b,'pin',-22+(k-row/2)*3.2,22-row*3);b.spot('path',-22,30,4,14);
      b.ramp(16,30,Math.PI,11,7,3.4);b.ramp(30,20,-Math.PI/2,11,7,3.4);b.scene('concert',4,26,Math.PI);
      for(const x of [-30,-14,14,30])blkP(b,'bench',x,4,Math.PI);blkTrees(b,8);}}
  ],
  // the chunks round the start arena: the arena sits in one end or corner (which one depends on the turn), so these
  // build everything they can and skip whatever lands in the arena
  home:[
    {roads:'ns',build(b){for(const sd of [-1,1])for(const z of [-32,-16,0,16,32])blkSpot(b,'sidewalk',sd*6.9,z,3.4,16);
      for(const sd of [-1,1])for(const z of [-32,-16,16,32])if(blkOut(b,sd*23.4,z,8))b.scene(pick(LOTS),sd*23.4,z,blkFace(sd));
      for(const z of [-30,-10,10,30])for(const sd of [-1,1])blkP(b,'lamp',sd*8.2,z);blkSc(b,'garbage_day',7.4,0,-Math.PI/2,'mini',3);}},
    {roads:'none',build(b){
      const Q=[[-22,-22,'playground_corner','medium'],[22,-22,'lemonade_stand',null],[-22,22,'birthday_party','medium'],[22,22,'picnic_blanket','medium']];
      for(const [x,z,id,sz] of Q)if(blkOut(b,x,z,14)){blkSpot(b,'lawn',x,z,30,30);b.scene(id,x,z,0,sz);blkP(b,'tree',x+(x>0?13:-13),z+(z>0?13:-13));}
      for(let i=0;i<10;i++){const e=i%4,t=rand(-36,36);blkP(b,pick(['tree','bush','flowers']),e<2?(e?37:-37):t,e<2?t:(e>2?37:-37));}}}
  ]
};
// random worlds: about half the plain chunks get a hand-made block, the rest the D11 generator
const blkTry=(ctx,zone,ch=.5)=>Math.random()<ch&&ctx.block(ZONE_BLOCKS[zone]);

const ZONE_LAYOUT={
  town(ctx){
    if(homePlan(ctx)||lmkHere(ctx,'town'))return;
    if(blkTry(ctx,'town'))return;
    const R=hoodRoads(ctx);
    if(!R.v&&!R.h){hoodPark(ctx,R,['play','picnic','woods','fountain']);return;} // the middle of a block: a pocket park
    if(R.v&&R.h){townCross(ctx);return;}
    townStreet(ctx,R);
  },
  farm(ctx){
    if(homePlan(ctx)||lmkHere(ctx,'farm',2.2)||blkTry(ctx,'farm'))return;
    hoodFarm(ctx,hoodRoads(ctx));
    propsRamp(ctx);
  },
  park(ctx){
    if(homePlan(ctx)||lmkHere(ctx,'park')||blkTry(ctx,'park'))return;
    parkBlock(ctx);
  },
  /* Dress the margin of the home chunks (random worlds). The hand-built arena (inside ±HOME) rejects placement. */
  home(ctx){
    if(homePlan(ctx)||blkTry(ctx,'home',.75))return;
    const edge=[[ctx.x0+8,ctx.cz],[ctx.x1-8,ctx.cz],[ctx.cx,ctx.z0+8],[ctx.cx,ctx.z1-8],[ctx.x0+12,ctx.z0+12],[ctx.x1-12,ctx.z0+12],[ctx.x0+12,ctx.z1-12],[ctx.x1-12,ctx.z1-12]];
    const kit=['lamp','tree','bench','mailbox','flowers','bush','hydrant','cone'];
    edge.forEach((p,i)=>put(ctx,kit[i%kit.length],p[0],p[1],i%4));
    crumbs(ctx,4,['tree','bush','flowers','hay','cone']);
  }
};
// an ordinary park chunk: an activity per corner, sometimes a pin bowling lawn, maybe a ramp
function parkBlock(ctx,acts){
  hoodPark(ctx,hoodRoads(ctx),acts||['play','pond','picnic','woods']);
  if(Math.random()<.3){const px=rand(ctx.x0+16,ctx.x1-16),pz=rand(ctx.z0+18,ctx.z1-16);
    for(let row=0;row<4;row++)for(let k=0;k<=row;k++)put(ctx,'pin',px+(k-row/2)*3.2,pz-row*3,0);}
  propsRamp(ctx);}
/* Scatter lists for L2c. One entry per size the zone should rain in. Landmarks stay in the layouts. */
const MICRO=['flowers','pebble','mushroom','acorn','toyblock','can','toyduck','snail'];
const ZONE_PROPS={
  town:{micro:MICRO,mini:['bush','gnome','beachball'],tiny:['hydrant','mailbox','bench','trashcan','birdbath'],small:['cone','lamp','pin','doghouse'],medium:['barrel','crates','parked','snowman'],large:['tree','tower','shop','cottage'],huge:['house','villa'],mega:['bounce','skyscraper']},
  farm:{micro:['flowers','pebble','mushroom','acorn'],mini:['bush','gnome','pumpkin'],tiny:['mailbox','trashcan'],small:['fence','crops','hay','scarecrow','cone','doghouse'],medium:['melon','crates','barrel','coop'],large:['tree','tractor'],huge:['farmhouse','silo','windmill'],mega:['barn']},
  park:{micro:['flowers','pebble','mushroom','toyduck','acorn'],mini:['bush','gnome','beachball'],tiny:['bench','trashcan','birdbath'],small:['cone','pin','swing','slide'],medium:['picnic','snowman'],large:['tree','fountain','gym'],huge:['gazebo'],mega:['bounce','ship']},
  home:{micro:MICRO,mini:['bush','gnome','beachball'],tiny:['hydrant','mailbox','bench','trashcan'],small:['cone','pin','melon','fence'],medium:['barrel','crates','snowman'],large:['tree','tower'],huge:['house'],mega:['bounce']}
};
/* D11: what the size-matched filler puts in each kind of spot (L19). A size a kind doesn't list uses the zone's list above. */
const SPOT_PROPS={
  sidewalk:{micro:['can','pebble','acorn','toyblock'],mini:['beachball','gnome'],tiny:['hydrant','trashcan','mailbox','bench'],small:['cone','lamp','pin'],medium:['barrel','crates']},
  plaza:{micro:['can','flowers','pebble'],mini:['bush','beachball'],tiny:['bench','trashcan','hydrant'],small:['lamp','cone'],medium:['crates','barrel']},
  parking:{micro:['can','pebble','toyblock'],mini:['beachball'],tiny:['trashcan'],small:['cone'],medium:['parked','barrel','crates']},
  yard:{micro:['flowers','mushroom','snail','toyduck','acorn'],mini:['gnome','bush','beachball'],tiny:['birdbath','mailbox'],small:['doghouse','pin'],medium:['snowman'],large:['tree']},
  backyard:{micro:['toyblock','toyduck','flowers','snail'],mini:['beachball','bush','gnome'],tiny:['trashcan','birdbath','bench'],small:['doghouse','swing','slide','picnic'],medium:['snowman','crates'],large:['tree','gym']},
  path:{micro:['pebble','acorn','can','snail'],mini:['beachball','gnome'],tiny:['bench','trashcan'],small:['cone','lamp']},
  lawn:{micro:['flowers','mushroom','acorn','snail'],mini:['beachball','bush','gnome'],tiny:['bench','birdbath'],small:['picnic','pin'],medium:['snowman'],large:['tree']},
  sand:{micro:['toyblock','toyduck','pebble'],mini:['beachball'],tiny:['bench'],small:['slide','swing','pin'],medium:['snowman']},
  field:{micro:['flowers','pebble','mushroom'],mini:['pumpkin','bush'],tiny:['mailbox'],small:['crops','hay','scarecrow','melon'],medium:['coop'],large:['tractor']},
  patch:{micro:['pebble','mushroom','acorn'],mini:['pumpkin'],small:['melon','scarecrow','hay']},
  pen:{micro:['pebble','flowers','acorn'],mini:['bush','pumpkin'],tiny:['trashcan'],small:['hay','fence'],medium:['crates','barrel']}
};
/* D18: new spot kinds painted on the ground (blankets, chalk, puddles, mud, kiddie pools, flowerbeds…) */
Object.assign(SPOT_LOOK,{blanket:'#ef476f',blanket_w:'#fff0f3',chalk:'#ffafcc',chalk_b:'#a2d2ff',chalk_y:'#fdffb6',line:'#ffffff',
  puddle:'#7cc4f0',mud:'#7f5539',pool:'#48cae4',flowerbed:'#8d5b3a',dirt:'#b08968',pitch:'#5cc04a',stage:'#ffd166',crop_circle:'#e9d8a6'});
Object.assign(SPOT_PROPS,{flowerbed:{micro:['flowers','mushroom','snail'],mini:['gnome','bush']},puddle:{micro:['toyduck','paperboat','pebble']},
  pool:{micro:['toyduck'],mini:['beachball']},mud:{micro:['pebble','acorn'],mini:['pumpkin'],small:['hay']},blanket:{micro:['sandwich','teacup','can','popsicle']},
  chalk:{micro:['pebble','can','toycar']},dirt:{micro:['pebble','can'],tiny:['wheelbarrow'],small:['cone']}});
MICRO.push('toycar','pail','sandwich','popsicle');
for(const t of ['toycar','pail','sandwich','popsicle','paperboat','teacup','ant'])MICRO_T.add(t);
SPOT_PROPS.yard.micro.push('toycar');SPOT_PROPS.backyard.micro.push('toycar','pail');SPOT_PROPS.backyard.tiny.push('bike','wheelbarrow');
SPOT_PROPS.sand.micro.push('pail');SPOT_PROPS.sand.tiny.push('sandcastle');SPOT_PROPS.lawn.micro.push('sandwich','popsicle');
SPOT_PROPS.sidewalk.micro.push('popsicle');SPOT_PROPS.sidewalk.tiny.push('bike');SPOT_PROPS.field.tiny.push('wheelbarrow');
ZONE_PROPS.town.tiny.push('bike');ZONE_PROPS.park.micro.push('pail','sandwich');ZONE_PROPS.park.mini.push('soccerball');ZONE_PROPS.park.tiny.push('sandcastle');
ZONE_PROPS.park.small.push('kite','balloons');ZONE_PROPS.farm.tiny.push('wheelbarrow');ZONE_PROPS.farm.small.push('laundry');ZONE_PROPS.farm.medium.push('veggiestand');

/* ---------- D18 scenes (L31 contract, see CLAUDE.md "Scenes and lots") ----------
   Local coordinates, +Z is the front (toward the road or the camera). `size` = the size class of the scene's main
   props at scale 1. Mixed sizes are on purpose: a lemonade stand has cups and cans around it, so every size has
   something to find. A scene can be built at any size (×1.65 per step); `sizes` keeps the little stories little. */
const SMALL_SIZES=['micro','mini','tiny','small'],TOWNISH=['town','home'],PARKISH=['park','home'];
const faceIn=(x,z)=>Math.atan2(-x,-z); // turn that points a +Z-facing prop at the scene's middle
function sceneChecks(s,x,z,w,d,nx,nz,kinds){ // a checkered blanket / hopscotch: nx×nz squares, kinds alternate
  const cw=w/nx,cd=d/nz;for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)if(kinds[(i+j)%kinds.length])s.spot(kinds[(i+j)%kinds.length],x-w/2+cw*(i+.5),z-d/2+cd*(j+.5),cw,cd);}
const SCENES={
  /* ---- town + home, little stories (micro…small) ---- */
  ant_picnic:{zones:['town','park','home'],size:'micro',r:2.6,sizes:SMALL_SIZES,build(s){
    s.spot('blanket',0,0,2.6,2);sceneChecks(s,0,0,2.6,2,4,3,['blanket_w',null]);
    s.place('sandwich',0,0,0,.3);s.place('popsicle',.95,.6);s.place('can',-.95,.55);s.place('teacup',.8,-.6);
    const th=Math.atan2(.34,-.26);for(let i=0;i<7;i++)s.place('ant',-2.6+i*.34,2-i*.26,0,th);}},
  snail_race:{zones:TOWNISH,size:'micro',r:2.6,sizes:SMALL_SIZES,build(s){
    s.spot('chalk_b',0,-1.4,3.2,.14);s.spot('chalk_y',0,1.7,3.2,.14);
    [[-1.1,-1.05],[-.37,-.55],[.37,-.85],[1.1,-.2]].forEach(([x,z])=>s.place('snail',x,z,0));
    s.place('pebble',-1.9,.1);s.place('pebble',1.9,-.5);s.place('acorn',1.7,1.4);s.place('mushroom',-1.8,1.5);s.place('toyblock',0,2.3);}},
  gnome_tea:{zones:TOWNISH,size:'mini',r:2.3,sizes:SMALL_SIZES,spot:'yard',build(s){
    s.place('mushroom',0,0,0,0,2.2);
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.5;s.place('teacup',Math.sin(a)*.55,Math.cos(a)*.55);}
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.3,x=Math.sin(a)*1.3,z=Math.cos(a)*1.3;s.place('gnome',x,z,0,faceIn(x,z));}
    s.place('flowers',-1.9,-1);s.place('flowers',1.8,-1.3);s.place('flowers',0,-2);}},
  puddle_boats:{zones:['town','park','home'],size:'micro',r:2.3,sizes:SMALL_SIZES,build(s){
    s.spot('puddle',0,0,3,2);s.spot('puddle',1.2,.9,1.4,1);
    s.place('paperboat',0,0,0,.6);s.place('paperboat',.9,.5,0,2);s.place('toyduck',-.8,-.3,0,1);
    s.place('pebble',1.8,-.2);s.place('pebble',-1.7,.6);s.place('pebble',.3,-1.3);s.place('acorn',-1.4,-1.2);}},
  hopscotch:{zones:TOWNISH,size:'micro',r:2.6,sizes:SMALL_SIZES,build(s){
    const K=['chalk','chalk_b','chalk_y'];let n=0;
    for(const [z,xs] of [[-2,[0]],[-1.2,[0]],[-.4,[-.4,.4]],[.4,[0]],[1.2,[-.4,.4]],[2,[0]]])for(const x of xs)s.spot(K[n++%3],x,z,.74,.74);
    s.place('pebble',.4,1.2);s.place('pail',1.5,-1.6);s.place('toyblock',-1.4,.8);s.place('can',1.4,.6);s.place('toycar',-1.3,-1.4,0,.4);}},
  /* ---- town + home, bigger ---- */
  lemonade_stand:{zones:TOWNISH,size:'medium',r:4.8,build(s){
    s.place('lemonade',0,0,0);
    [[0,2.3],[.25,3.5],[-.1,4.7]].forEach(([x,z])=>s.place('toycar',x,z,0,Math.PI,5)); // the line of customers
    s.place('balloons',1.9,-.6);s.place('cone',-2.1,1.5);s.place('bike',-2.3,-.8,0,.5);s.place('trashcan',2.3,1.3,0);
    s.place('can',1.2,1.1);s.place('can',-1,1.6);s.place('popsicle',.9,2.2);}},
  yard_sale:{zones:TOWNISH,size:'small',r:4.8,build(s){
    s.spot('blanket',0,.4,5,3);sceneChecks(s,0,.4,5,3,5,3,['blanket_w',null]);
    s.place('picnic',0,-1.9,0);s.place('doghouse',-2.3,-.6,0);s.place('lamp',2.3,-1.2);s.place('crates',-3.6,1.2,null,0,.6);
    s.place('bike',1.3,1.1,0,1.2);s.place('beachball',-1,1.2);s.place('toyblock',.1,.9,null,0,2.5);s.place('toyblock',.5,1.6,null,0,2.5);
    s.place('toyduck',-1.8,1.9,0,0,2);s.place('pail',2.2,1.9,0,0,2.5);s.place('toycar',-.5,1.9,0,.3,2.5);}},
  birthday_party:{zones:['town','park','home'],size:'small',r:5,spot:'backyard',build(s){
    s.place('picnic',0,0,0);s.place('cake',0,1.5);
    s.place('balloons',-2.3,-1);s.place('balloons',2.4,-1.2);s.place('balloons',0,-2.1);
    s.place('toyblock',1.9,1.7,null,0,3);s.place('toyblock',2.6,2.3,null,0,2.6);s.place('beachball',-2.6,1.6);
    s.place('toycar',-1.3,2.6,0,.4,3);s.place('toycar',1,3,0,-.3,3);s.place('popsicle',-.4,2.4,0,0,2);}},
  garbage_day:{zones:TOWNISH,size:'tiny',r:3.4,spot:'sidewalk',build(s){
    for(const x of [-1.8,-.6,.6,1.8])s.place('trashcan',x,0,0);
    s.place('can',-1.2,1);s.place('can',.2,1.3);s.place('can',1.4,.9);s.place('popsicle',-.5,1.6);s.place('sandwich',1.1,1.8,0,1);
    s.place('toyduck',2.6,.6,0,2);}},
  car_wash:{zones:TOWNISH,size:'medium',r:6.5,build(s){
    s.spot('puddle',0,0,7.4,5);s.spot('puddle',2.6,2.2,3,2);
    s.place('parked',-1.7,0,0);s.place('parked',1.9,.4,0);s.place('hydrant',-4,2.7);s.place('barrel',3.8,-2.4);
    s.place('cone',-3,4);s.place('cone',3,4);s.place('pail',-.2,2.4,0,0,3);s.place('pail',.6,-2.6,0,0,3);s.place('paperboat',3.3,2.4,0,.4,2);}},
  icecream_line:{zones:['town','park','home'],size:'medium',r:6,build(s){
    s.place('icetruck',0,-.4,0,Math.PI/2);
    s.place('icecone',-.6,1.9);s.place('icecone',.6,1.9);
    [[2.6,2.6],[3.6,3.6],[4.6,4.6]].forEach(([x,z])=>s.place('toycar',x,z,0,faceIn(x-.6,z-1.4),5));
    s.place('bench',-3.4,2.6,0);s.place('trashcan',-3.9,-1.6,0);s.place('popsicle',-1.6,3);s.place('popsicle',1.4,3.4);}},
  road_works:{zones:TOWNISH,size:'small',r:5,build(s){
    s.spot('dirt',0,0,4,3);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;s.place('cone',Math.sin(a)*3.2,Math.cos(a)*2.6);}
    s.place('barrel',3.3,-2.9);s.place('crates',-3.6,-2,null,0,.6);s.place('wheelbarrow',1,.5,0,.6,1.5);s.place('lamp',-3.8,1.8);
    for(const [x,z] of [[-.8,.4],[-.2,-.6],[.6,-.2],[-1.2,-.5]])s.place('pebble',x,z,null,0,2.4);}},
  /* ---- farm ---- */
  pumpkin_patch:{zones:['farm'],size:'mini',r:3.4,build(s){
    s.spot('patch',0,0,5,4.4);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(i||j)s.place('pumpkin',i*1.4,j*1.3);
    s.place('scarecrow',0,0,0,0,.45);s.place('wheelbarrow',2.9,1.6,0,-.5);s.place('flowers',-2.8,1.8);s.place('mushroom',-2.6,-1.8);}},
  veggie_stand:{zones:['farm'],size:'medium',r:4.6,build(s){
    s.place('veggiestand',0,0,0);
    [[-1.2,1.7],[-.2,2],[.9,1.8]].forEach(([x,z])=>s.place('pumpkin',x,z,null,0,1.8));
    s.place('hay',-2.6,-.8);s.place('hay',2.6,-.6);s.place('wheelbarrow',2.4,1.9,0,-.4,1.6);s.place('crates',-2.8,1.6,null,0,.6);}},
  hay_maze:{zones:['farm'],size:'small',r:7.5,build(s){
    const G=2.6,wall=[[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[-2,-1],[2,-1],[-2,0],[0,0],[2,0],[-2,1],[0,1],[2,1],[-2,2],[-1,2],[1,2],[2,2],[1,-1]];
    for(const [i,j] of wall)s.place('hay',i*G,j*G);s.spot('field',0,0,13,13);
    s.place('pumpkin',-1*G,-1*G,null,0,1.6);s.place('scarecrow',-1*G,G*1,0);s.place('flowers',G,-1.2*G,null,0,3);}},
  pig_pen:{zones:['farm'],size:'small',r:5.6,build(s){
    s.spot('mud',0,0,7,7);
    for(const t of [-2.1,2.1]){s.place('fence',t,-4.2,0);s.place('fence',-4.2,t,Math.PI/2);s.place('fence',4.2,t,Math.PI/2);}
    s.place('fence',2.1,4.2,0); // the gate's open on the left of the front
    s.herd('pig',0,0,3);s.place('trashcan',2.5,-2.5,0);s.place('hay',-2.5,-2.6);s.place('pumpkin',-2.6,2.4);s.place('pebble',1,1,null,0,3);}},
  chicken_yard:{zones:['farm'],size:'medium',r:5,build(s){
    s.place('coop',0,-1.8,0);s.herd('chicken',0,2,5);s.place('hay',-3.2,.8);s.place('pumpkin',2.9,1.8);
    s.place('wheelbarrow',3,-1.4,0,-.6);s.place('flowers',-2.2,3);s.place('flowers',1.4,3.4);}},
  laundry_day:{zones:['farm','town','home'],size:'small',r:4.4,spot:'backyard',build(s){
    s.place('laundry',0,0,0);s.place('trashcan',-1.4,1.2,0);s.place('wheelbarrow',2.4,1.2,0,-.6);s.place('pail',-.4,1.4,0,0,2.5);
    if(s.zone==='farm')s.herd('chicken',0,2.8,3);else s.place('beachball',1,2.4);}},
  tractor_parade:{zones:['farm'],size:'large',r:10,build(s){
    for(const x of [-6,0,6]){s.place('tractor',x,0,0,Math.PI/2);s.place('balloons',x-1.6,1.4,null,0,.8);}
    s.place('hay',-8.6,2.6);s.place('hay',8.6,-2.4);s.place('cone',9.4,1.6);s.place('cone',-9.4,-1.6);s.place('flowers',3,3,null,0,3);}},
  /* ---- park ---- */
  picnic_blanket:{zones:PARKISH,size:'small',r:4.6,build(s){
    s.spot('blanket',0,0,3.6,2.8);sceneChecks(s,0,0,3.6,2.8,4,3,['blanket_w',null]);
    s.place('sandwich',-.6,.2,0,.4,3);s.place('teacup',.6,-.4,null,0,3);s.place('teacup',1.1,.5,null,0,3);s.place('cake',.1,-.7);
    s.place('beachball',2.6,1.4);s.place('tree',0,-3.8);s.place('trashcan',-2.8,-1.8,0);s.herd('duck',-3.2,2.2,3);}},
  sandcastle_day:{zones:PARKISH,size:'tiny',r:3.2,build(s){
    s.spot('sand',0,0,5.4,4.2);s.place('sandcastle',0,0,0);
    s.place('pail',1.4,.9,null,0,1.6);s.place('pail',-1.4,1.1,null,0,1.6);s.place('toyduck',1.7,-.9,0,2,1.4);
    s.place('toyblock',-1.6,-.8,null,0,1.6);s.place('beachball',-2.2,-1.4);s.place('soccerball',2.3,1.6);}},
  kite_field:{zones:PARKISH,size:'small',r:6.6,build(s){
    s.place('kite',-3.6,-1,0);s.place('kite',0,-2.6,0);s.place('kite',3.8,-.6,0);
    s.place('bench',0,3.6,0,Math.PI);s.place('beachball',-2,2.2);s.place('soccerball',2.4,2);s.place('flowers',-4.4,2.6,null,0,3);}},
  soccer_game:{zones:PARKISH,size:'medium',r:9.4,build(s){
    s.spot('pitch',0,0,17,10.6);s.spot('line',0,0,.24,10.6);s.spot('line',0,0,2.4,.24);
    s.place('goal',-7.6,0,0,Math.PI/2);s.place('goal',7.6,0,0,-Math.PI/2);s.place('soccerball',0,0,null,0,2.4);
    for(const [x,z] of [[-8.4,-5.2],[8.4,-5.2],[-8.4,5.2],[8.4,5.2]])s.place('cone',x,z);
    s.place('bench',-3,6.8,0,Math.PI);s.place('bench',3,6.8,0,Math.PI);s.place('trashcan',0,7.2,0);}},
  concert:{zones:PARKISH,size:'small',r:5.6,build(s){
    s.spot('stage',0,-2.4,6,2.6);s.place('lamp',-3.5,-3.4);s.place('lamp',3.5,-3.4);
    s.place('toyblock',-2,-2.6,null,0,3.5);s.place('toyblock',2,-2.6,null,0,3.5);s.place('toyduck',0,-2.4,0,0,3.5); // the star of the show
    s.place('balloons',-2.9,-1);s.place('balloons',2.9,-1);
    for(const [x,z] of [[-1.4,1.3],[1.4,1.3],[-1.4,3.1],[1.4,3.1]])s.place('bench',x,z,0,Math.PI);}},
  playground_corner:{zones:PARKISH,size:'small',r:5.6,build(s){
    s.spot('sand',0,-.4,8,5.6);s.place('swing',-2.2,-1,0);s.place('slide',2.4,-.8,0);s.place('beachball',0,1.4);
    s.place('pail',-1,1.8,null,0,2.5);s.place('bench',0,3.8,0,Math.PI);s.place('trashcan',3.6,2.8,0);}},

  /* ---- lots: a whole house plot, from the house down to the flowers (layouts only, filler:false) ----
     16 wide (x ±8) and 29 deep (z ±14.6), front edge on the sidewalk. Mirrored at random (seeded) so a street of a
     few templates doesn't repeat; houses pick their own colors. */
  lot_family:{zones:TOWNISH,size:'huge',r:16,filler:false,build(s){const m=Math.random()<.5?1:-1,X=v=>v*m;
    s.spot('yard',0,7.6,16,14);s.spot('backyard',0,-9.6,16,10);s.spot('path',X(-1),8.6,1.6,12);s.spot('parking',X(5.7),6,3.4,17.2);
    s.spot('flowerbed',X(-5),4.6,4.4,1.3);
    s.place('house',X(-1),-1.2,0);if(Math.random()<.8)s.place('parked',X(5.7),9,0);
    s.place('mailbox',X(-2.4),13.6,0);s.place('bike',X(3.4),4,0,m*.4);s.place('trashcan',X(7.4),1,0);s.place('trashcan',X(7.4),-.3,0);
    s.place('fence',X(-5.6),14,0);for(const x of [-5.85,-1.95,1.95,5.85])s.place('fence',x,-14.2,0);
    s.place('gnome',X(-2.3),5.6,0,m*.5);s.place('gnome',X(.3),11.4,0,-m*.4);
    for(const x of [-6.6,-5.5,-4.4,-3.3])s.place('flowers',X(x),4.6);
    s.place('pebble',X(.1),6.6);s.place('pebble',X(-2),9.4);s.place('toycar',X(2.2),12.4,0,m*.8);s.place('toyduck',X(-6),9.4,0,1);
    s.place('tree',X(-5),-10);s.place('acorn',X(-3.4),-8.4);s.place('mushroom',X(-6.6),-12.2);
    if(Math.random()<.5){s.place('doghouse',X(3.6),-10.4,0);s.place('beachball',X(0),-7.6);}
    else{s.place('swing',X(3.2),-10.4,0);s.place('toyblock',X(.4),-7.8);s.place('toyblock',X(.9),-8.3);}}},
  lot_garden:{zones:TOWNISH,size:'huge',r:16,filler:false,build(s){const m=Math.random()<.5?1:-1,X=v=>v*m;
    s.spot('yard',0,7.6,16,14);s.spot('backyard',0,-9.6,16,10);s.spot('path',0,8.6,1.6,12);
    s.spot('flowerbed',-3.6,8,3.4,1.2);s.spot('flowerbed',3.6,8,3.4,1.2);s.spot('patch',X(4.2),-9.6,6.4,7);
    s.place('cottage',X(-.4),-1.6,0);s.place('fence',-5.6,14,0);s.place('fence',5.6,14,0);
    for(const x of [-4.8,-3.6,-2.4,2.4,3.6,4.8])s.place('flowers',x,8);
    s.place('gnome',-1.3,11.6,0,.4);s.place('gnome',1.3,10.4,0,-.4);s.place('gnome',X(-5.4),3.4,0,m*.7);
    s.place('birdbath',X(-5.4),5.2);s.place('bench',X(5.2),4.4,0);s.place('mailbox',X(-2.6),13.4,0);s.place('snail',.2,6.4,0,.3);
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)s.place('pumpkin',X(2.4+i*1.8),-11.2+j*2.6);s.place('wheelbarrow',X(4.4),-6.4,0,m*.5);
    s.place('laundry',X(-3),-8.6,0);s.place('tree',X(-6),-12.4);s.place('mushroom',X(-4.8),-12.6);s.place('mushroom',X(-6.6),-11);}},
  lot_party:{zones:TOWNISH,size:'huge',r:16,filler:false,build(s){const m=Math.random()<.5?1:-1,X=v=>v*m;
    s.spot('yard',0,7.6,16,14);s.spot('backyard',0,-11.4,16,6.4);s.spot('path',0,8.6,1.6,11.6);s.spot('parking',X(6.4),6.6,3,16);
    s.spot('pool',X(-3.4),-12,6,3.4);
    s.place('villa',0,-3.6,0);s.place('parked',X(6.4),9.4,0);
    for(const x of [-7,-5.2,-3.4])s.place('bush',X(x),12.6);s.place('lamp',X(-1.9),12);
    s.place('mailbox',X(1.9),13.4,0);s.place('balloons',X(2.6),13);s.place('balloons',X(-1.2),2.8);
    s.place('toyduck',X(-4.2),-12,0,1);s.place('toyduck',X(-2.6),-11.6,0,2);s.place('beachball',X(-.2),-12.6);
    s.place('picnic',X(4),-12,0);s.place('cake',X(4),-10.2);s.place('balloons',X(6.6),-12.8);
    for(const x of [-5.85,-1.95,1.95,5.85])s.place('fence',x,-14.2,0);
    s.place('flowers',X(-1.6),6);s.place('flowers',X(1.6),6);s.place('popsicle',X(-4),8);}},
  lot_kids:{zones:TOWNISH,size:'huge',r:16,filler:false,build(s){const m=Math.random()<.5?1:-1,X=v=>v*m;
    s.spot('yard',0,7.6,16,14);s.spot('backyard',0,-9.6,16,10);s.spot('parking',X(6.1),6,3.2,17.2);s.spot('sand',X(-5),6.4,4.6,4.6);
    sceneChecks(s,X(6.1),7,1.6,4.8,2,6,['chalk','chalk_b','chalk_y']);
    s.place('house',X(1),-1.6,0);
    s.place('sandcastle',X(-5),6.4,0);s.place('pail',X(-6.5),7.6);s.place('pail',X(-3.6),5);s.place('toyblock',X(-4.4),8);
    s.place('bike',X(3.7),4.2,0,m*.3);s.place('bike',X(4.2),5.6,0,m*.6);s.place('toycar',X(1.4),9.6,0,1);s.place('toycar',X(2.2),10.6,0,2.4);
    s.place('soccerball',X(-1),10.4);s.place('beachball',X(-6.8),11.6);s.place('mailbox',X(-2),13.6,0);s.place('trashcan',X(7.6),-.8,0);
    s.place('slide',X(-5),-10,0);s.place('swing',X(3),-10.4,0);s.place('flowers',X(-1.8),4.4);s.place('flowers',X(-.6),4.4);}},
};
const LOTS=['lot_family','lot_family','lot_garden','lot_party','lot_kids'];

/* ---------- D18 part 2: quest stage scenes (built into the Home World at fixed spots, see HOME_QUEST_AT) ----------
   filler:false, so the random filler never drops them. Local coordinates, +Z = front. They're scenes, so a quest can
   also spawn one at the players' size (`stage:'crop_circle'`), but the Home World already has them standing. */
Object.assign(SPOT_LOOK,{water:'#4cc9f0',water_deep:'#3a9fd6',island:'#f4e3b0'});
{const W=['toyduck','paperboat'];SPOT_PROPS.water={micro:W,mini:W,tiny:W,small:W,medium:W,large:W,huge:W,mega:W}; // giant rubber ducks, never trees in the pond
  SPOT_PROPS.island={micro:['pebble','flowers','mushroom'],mini:['bush'],tiny:['chest'],small:['pin']};}
Object.assign(SCENES,{
  /* Hank's yard (chapter 1, right of the start): a lot with a little dig site in the front yard, where his lunchbox
     is lost. Laid out like lot_family; the dig is at local (−4, 11.1), Hank waits on the sidewalk at (−4, 15.4). */
  hank_yard:{zones:TOWNISH,size:'huge',r:16,filler:false,build(s){
    s.spot('yard',0,7.6,16,14);s.spot('backyard',0,-9.6,16,10);s.spot('parking',5.7,6,3.4,17.2);s.spot('path',1.2,9,1.4,10);
    s.spot('dirt',-4,11.1,6,4.6);s.spot('dirt',-4.6,10,2.6,1.8);s.spot('flowerbed',-6.2,2.6,3,1.2);
    s.place('house',.8,-1.6,0);s.place('parked',5.7,8.6,0);s.place('mailbox',2.8,13.6,0);
    // the dig: toy trucks, a pail and blocks, pebble piles, an ant trail to his half-eaten sandwich
    s.place('toycar',-5.6,12.2,0,.6);s.place('toycar',-2.6,9.8,0,-1.1);s.place('pail',-4.4,13);s.place('toyblock',-3,12.4,0,.3);
    s.place('toyblock',-3.4,12.8,0,1);s.place('toyblock',-5.9,10.2,0,.2);s.place('wheelbarrow',-6.6,8,0,.8);
    for(const [x,z] of [[-4.8,9.6],[-4.2,9.3],[-5.2,9.1],[-2,11.8],[-6.6,12.2]])s.place('pebble',x,z);
    s.place('sandwich',-1.4,5.8,0,.5);const th=Math.atan2(.3,.32);for(let i=0;i<5;i++)s.place('ant',-1.1+i*.3,6.2+i*.32,0,th);
    s.place('can',-6.8,12.6);s.place('popsicle',-.6,12.2);
    for(const x of [4.4,5.4,6.6,7.4])s.place('flowers',x,12.6);for(const x of [-7.2,-6.2,-5.2])s.place('flowers',x,2.6);
    s.place('gnome',2.4,4.6,0,-.5);s.place('snail',3.6,11);s.place('acorn',-7.2,4.6);s.place('mushroom',-7.4,5.4);
    // the back yard: Hank's tools and a cone stack
    s.place('crates',-4.6,-9,null,0,.6);s.place('crates',-6.4,-11.4,null,0,.6);s.place('barrel',-2.6,-12,0,0,.7);s.place('cone',2,-8.6);s.place('cone',3,-8.4);
    s.place('tree',5.6,-11.6);s.place('doghouse',2.6,-12.2,0);for(const x of [-5.85,-1.95,1.95,5.85])s.place('fence',x,-14.2,0);}},
  /* Garry's garden (chapter 1, across the street): flowerbeds round a big round bed in front (the goal for his rolled-
     away gnomes, local (0, 10)), a cottage behind. Garry waits on the sidewalk at local (2, 15.4). */
  garry_garden:{zones:TOWNISH,size:'huge',r:16,filler:false,build(s){
    s.spot('yard',0,7.6,16,14);s.spot('backyard',0,-9.6,16,10);s.spot('path',-4.6,9,1.4,10);
    s.spot('flowerbed',0,10,5,4);s.spot('flowerbed',0,10,4,5);s.spot('flowerbed',-6.2,4,3,6);s.spot('flowerbed',6.2,4.6,3,5);s.spot('patch',4,-9.6,7,7);
    s.place('cottage',-.6,-2,0);s.place('mailbox',-2.6,13.6,0);s.place('fence',-6,14,0);s.place('fence',6.4,14,0);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;s.place('flowers',Math.sin(a)*2.2,10+Math.cos(a)*1.8);}
    s.place('gnome',.5,9.5,0,.4);s.place('gnome',-.7,10.6,0,-.3); // two gnomes who stayed home
    for(const z of [1.8,3.2,4.6,6])s.place('flowers',-6.2,z);for(const z of [2.8,4.2,5.6])s.place('flowers',6.2,z);
    s.place('mushroom',-5.4,7.4);s.place('mushroom',-6.8,7.6);s.place('snail',-5.8,6.6,0,.8);s.place('birdbath',5.8,8.6);
    s.place('toyduck',5.6,11.4,0,1);s.place('pebble',-3.4,12.6);s.place('pebble',-3,6.4);s.place('acorn',1.4,4);
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)s.place('pumpkin',2.4+i*1.7,-11+j*2.6);s.place('wheelbarrow',-1,-8.4,0,.5);
    s.place('laundry',-4.4,-10,0);s.place('tree',-6.6,-12.4);s.place('bench',-6,-6.6,0);}},
  /* the crop circle (chapter 3, Zorp & Blip): a cornfield with a flattened ring and their crashed saucer in the middle;
     the big haystack at local (−18, 16) hides a crystal piece */
  crop_circle:{zones:['farm'],size:'huge',r:30,filler:false,build(s){
    s.spot('field',0,0,64,64);s.spot('crop_circle',0,0,26,26);s.spot('crop_circle',0,0,26,26,Math.PI/4);s.spot('dirt',0,0,9,9,Math.PI/8);
    for(let x=-28;x<=28.1;x+=6.2)for(let z=-28;z<=28.1;z+=6.2){if(Math.hypot(x,z)<17.5||Math.hypot(x+18,z-16)<5)continue;s.place('crops',x,z,0);}
    s.place('saucer',0,0,0);s.place('hay',-18,16);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;s.place('hay',-18+Math.sin(a)*2.6,16+Math.cos(a)*2.6);}
    s.place('scarecrow',-12,-12,0);s.place('pebble',4,6,null,0,4);s.place('pebble',-5,-4,null,0,4);s.place('cone',6,-6);s.place('cone',-6.6,5);}},
  /* the duck pond (chapter 3): a big pond with an island and a treasure chest on it (needs hover), paddle boats,
     ducks, reeds and benches round the shore; a crystal piece lies on the bottom at local (10, −6) */
  duck_pond:{zones:PARKISH,size:'huge',r:30,filler:false,build(s){
    s.spot('lawn',0,0,76,76);s.spot('water',0,0,52,36);s.spot('water',-20,10,18,20);s.spot('water',18,-8,22,26);s.spot('water_deep',10,-6,10,8);
    s.spot('island',0,0,12,9);s.spot('island',1,0,9,11);
    s.place('chest',1.6,.6,0,-.4,4);s.place('tree',-3,-2);s.place('flowers',3.4,-2.4,null,0,2);s.place('pebble',-2.6,2.6,null,0,3);
    for(const [x,z,t] of [[-14,6,.6],[12,10,-.8],[-6,-12,2.2]])s.place('paperboat',x,z,0,t,9);
    s.herd('duck',-18,-6,5);s.herd('goose',16,12,3);
    for(const [x,z] of [[-27,-8],[-26,4],[-24,16],[27,-14],[28,0],[24,8],[-10,-19],[8,19],[-2,19.5]])s.place('bush',x,z);
    for(const [x,z,t] of [[0,24,Math.PI],[-20,23,Math.PI],[30,14,-Math.PI/2],[-31,-14,Math.PI/2]])s.place('bench',x,z,0,t);
    for(const [x,z] of [[-34,-34],[-34,0],[-34,32],[34,-34],[34,30],[0,-34],[-18,-34],[18,34],[34,0]])s.place('tree',x,z);
    s.place('trashcan',4,25);s.place('lamp',-10,24);s.place('lamp',12,24);}},
  /* Dozer Dot's crate yard (chapter 3): a fenced construction yard full of crates and barrels (barrel chains!),
     scaffold towers, the gate at the front (+Z); Dot waits outside the gate */
  crate_site:{zones:TOWNISH,size:'huge',r:24,filler:false,build(s){
    s.spot('dirt',0,-4,46,34);s.spot('mud',-12,-12,8,6);s.spot('mud',13,2,6,5);
    for(let x=-21;x<=21.1;x+=4.2){s.place('fence',x,-21,0);if(Math.abs(x)>5)s.place('fence',x,13,0);}
    for(let z=-16.8;z<=8.9;z+=4.2){s.place('fence',-23,z,Math.PI/2);s.place('fence',23,z,Math.PI/2);}
    for(let i=0;i<5;i++)for(let j=0;j<2;j++)s.place('crates',-14+i*7,-14+j*5.4);
    for(const [cx,cz] of [[-15,1],[15,-2]])for(let i=0;i<6;i++){const a=i/6*Math.PI*2;s.place('barrel',cx+Math.sin(a)*2.4,cz+Math.cos(a)*2.4);}
    s.place('tower',-6,-1);s.place('tower',6,-2);s.place('wheelbarrow',-1,6,0,.4,2.5);s.place('wheelbarrow',9,7,0,-.6,2.5);
    for(const [x,z] of [[-6,15.6],[6,15.6],[-8,18],[8,18]])s.place('cone',x,z);for(const [x,z] of [[-21,-19],[21,-19],[-21,11],[21,11]])s.place('lamp',x,z);
    for(const [x,z] of [[0,-8],[1.2,-7],[-1,-6.6]])s.place('pebble',x,z,null,0,5);}},
  /* Woolly's sheep pen (chapter 4): a big fenced pen (gate at the front, +Z) on a meadow, hay in the corners */
  sheep_pen:{zones:['farm'],size:'huge',r:22,filler:false,build(s){
    s.spot('lawn',0,0,50,50);s.spot('pen',0,-4,32,32);
    for(let x=-14.7;x<=14.8;x+=4.2){s.place('fence',x,-20,0);if(Math.abs(x)>4.5)s.place('fence',x,12,0);}
    for(let z=-17.9;z<=10;z+=4.2){s.place('fence',-16,z,Math.PI/2);s.place('fence',16,z,Math.PI/2);}
    for(const [x,z] of [[-12,-16],[12,-16],[-12,8]])s.place('hay',x,z);s.place('barrel',12,8,0,0,.8);
    for(const [x,z] of [[-21,-21],[21,-21],[22,16],[-23,6]])s.place('tree',x,z);for(const [x,z] of [[6,16],[-6,17],[9,18]])s.place('flowers',x,z,null,0,3);}},
});

/* ---------- D18 part 2: the Home World plan ----------
   The Home World (Adventure, and Arcade's first world) is the same hand-made map every time. HOME_PLAN gives every
   chunk outside the start a design (letters below, one per chunk, laid out like ZONE_MAP: rows −Z → +Z, columns
   −X → +X), landmarks sit at fixed chunks instead of hashed ones, and the start (buildWorld, inside ±HOME) is a
   planned suburb: Hank's Street. Random worlds (NEW WORLD in Arcade) keep the random zone map and layouts.
   Quests: HOME_QUEST_AT has every quest's world spot; the layouts mark each as a `quest_<id>` spot (and the giver's
   place as `giver_<id>`), and keep props off the giver spots. */
const HOME_PLAN=[
  'fMcfpjpsksk', // cj −5   F farm (NW) · P the big park · T downtown (NE)
  'Occfyptxhxh', // cj −4
  'fcRwPpSsQsC', // cj −3   R crop circle · w farm water tower · P duck pond · S school · Q skyscraper · C city hall
  'AfcZppExsxs', // cj −2   E fire station · x downtown crossings
  'Kfup...hDhk', // cj −1   D Dozer Dot's construction site
  'ppNp...xhxh', // cj  0   . = home (Hank's Street + the ring around it)
  'pjpp...pUpp', // cj  1
  'hxhpjpppfMf', // cj  2   SW: Maple Hill houses · j kite meadow · SE farm
  'khkhVNIuLfO', // cj  3   V N I the fair (ferris wheel, bounce castle, pirate ship) · L Woolly's sheep pen
  'hxhkppfcAcK', // cj  4
  'khkhppufBfc', // cj  5
];
/* Where each Home World quest happens (world x,z). stage = [x,z,w,d] of its `quest_<id>` spot; giver = where its giver
   stands (kept clear of props for radius r); drops / rings / roofs / pieces are ready-made point lists for steps. */
const HOME_QUEST_AT={
  // chapter 1, Hank's Street (micro–mini): all within a few car lengths of the start
  hank_lunchbox:{giver:[8,45],r:.8,stage:[12,45,4.6,6]},                       // Hank's yard, right of the start
  garry_gnomes:{giver:[-8,31],r:.8,stage:[-13.4,33,4,5]},                        // Garry's garden, across the street (the goal bed)
  zippy_mail:{giver:[-7,44],r:.8,stage:[0,38,18,48],drops:[[7.2,58],[-7.2,36],[7.2,26],[-7.2,16]]}, // mailboxes up the street
  // chapter 2, the ring round the start (tiny–small)
  fern_chickens:{giver:[-88,10.5],r:1.5,stage:[-97,38,36,48]},                      // Fern's fenced pasture, west
  bubbles_soap:{giver:[-9.8,-84],r:1.5,stage:[-22,-96,26,26]},                     // the bubble fountain plaza, north
  pip_icecream:{giver:[9.8,84],r:1.5,stage:[0,96,70,40],drops:[[-24,84],[-14,106],[18,84],[16,104],[-32,100]]}, // picnic blankets, south
  // chapter 3 (medium–large)
  zorp_crystal:{giver:[-230,-232],r:3,stage:[-240,-240,30,30],pieces:{hay:[-258,-224],tower:[-140,-236],pond:[-70,-246]}}, // crop circle; haystack, water tower (ramp at its foot), duck pond
  pond_island:{stage:[-80,-240,12,9]},                                              // the duck pond's island with the treasure chest
  dot_demolition:{giver:[228,-64],r:3,stage:[240,-84,40,28]},                       // Dot's fenced crate yard
  wheelie_parade:{giver:[372,-206],r:3,stage:[240,-200,170,170],                    // by city hall; arches along downtown's main streets
    rings:[[300,-160],[260,-160],[220,-160],[180,-160],[160,-200],[160,-240],[160,-280],[200,-320],[250,-320],[300,-320]]},
  // chapter 4 (huge–GIANT)
  kite_kites:{giver:[-80,176],r:6,stage:[-80,160,60,60],roofs:[[80,-240],[240,-240],[400,-240],[-96,-62],[-80,240]]}, // school, skyscraper, city hall, Fern's barn, ferris wheel
  woolly_sheep:{giver:[232,262],r:6,stage:[240,236,30,30]},                         // the sheep pen (gate faces +Z)
  big_stomp:{giver:[24,212],r:6,stage:[0,240,140,60]}                               // the fair
};
const isHomeWorld=()=>typeof zoneRows!=='undefined'&&zoneRows===ZONE_MAP&&!(typeof roomZ!=='undefined'&&roomZ);
function homeClear(x,z,r){for(const id in HOME_QUEST_AT){const g=HOME_QUEST_AT[id].giver;if(g&&Math.hypot(x-g[0],z-g[1])<r+HOME_QUEST_AT[id].r)return false;}return true;}
const inChunk=(ctx,x,z)=>chunkIdx(x)===ctx.ci&&chunkIdx(z)===ctx.cj;
function homeQuestSpots(ctx){for(const id in HOME_QUEST_AT){const q=HOME_QUEST_AT[id];
  if(q.stage&&inChunk(ctx,q.stage[0],q.stage[1]))ctx.spot('quest_'+id,q.stage[0],q.stage[1],q.stage[2],q.stage[3],0);
  if(q.giver&&inChunk(ctx,q.giver[0],q.giver[1]))ctx.spot('giver_'+id,q.giver[0],q.giver[1],q.r*2,q.r*2,0);}}
// a scene whose middle is in this chunk (layouts run per chunk, so a scene is only built by the chunk it's centered in)
function homeSc(ctx,id,x,z,th,size){return inChunk(ctx,x,z)&&ctx.scene(id,x,z,th||0,size);}
// the Home World chunk design, if there is one: true when it built this chunk
function homePlan(ctx){
  if(!isHomeWorld())return false;
  const row=HOME_PLAN[ctx.cj+CHUNKS_HALF],code=row&&row[ctx.ci+CHUNKS_HALF],fn=code&&HOME_DESIGN[code];if(!fn)return false;
  const p0=ctx.place;ctx.place=(t,x,z,a,r)=>homeClear(x,z,r||RAD[t]||1.2)&&p0(t,x,z,a,r);
  fn(ctx,hoodRoads(ctx));homeQuestSpots(ctx);ctx.planned=true;return true;}
const lmkAt=(k,w)=>(ctx,R)=>{hoodSidewalks(ctx,R,w);LMK[k](ctx);};
// the fair (ferris wheel / bounce castle / pirate ship chunks): the ride plus an ice-cream line and balloons
const fairAt=k=>(ctx,R)=>{lmkAt(k)(ctx,R);const q=hoodQuads(ctx,R,3).find(q=>q.qz>0&&q.qx<0);if(q)homeSc(ctx,'icecream_line',q.cx,q.cz,0);
  for(const [x,z] of [[-30,30],[30,30],[30,-30],[-30,-30]])put(ctx,'balloons',ctx.cx+x,ctx.cz+z,0);};
const HOME_DESIGN={
  '.':(ctx)=>homeMargin(ctx),
  // town
  h:(ctx,R)=>townStreet(ctx,R,false), s:(ctx,R)=>townStreet(ctx,R,true), x:ctx=>townCross(ctx),
  k:(ctx,R)=>hoodPark(ctx,R,['play','picnic','woods','fountain']),
  Q:lmkAt('sky'), C:lmkAt('boss'), E:lmkAt('fire'), S:lmkAt('school'),
  D(ctx){homeSc(ctx,'crate_site',240,-84,0);
    for(const [x,z] of [[206,-112],[274,-52],[208,-48]])put(ctx,'parked',x,z,1);ctx.ramp(268,-112,0,14,8,4.4);ctx.ramp(206,-60,Math.PI,14,8,4.4);
    homeSc(ctx,'road_works',268,-50,0,'medium');},
  // farm
  f:(ctx,R)=>{hoodFarm(ctx,R);propsRamp(ctx);},
  c(ctx,R){farmRoadside(ctx,R);hoodQuads(ctx,R,1.5).forEach((q,i)=>{HOOD_FARM.field(ctx,q);if(i===1)put(ctx,'scarecrow',q.cx,q.cz,0);});},
  u(ctx,R){farmRoadside(ctx,R);const qs=hoodQuads(ctx,R,1.5);
    homeSc(ctx,'hay_maze',qs[0].cx,qs[0].cz,0);homeSc(ctx,'pumpkin_patch',qs[1].cx,qs[1].cz,0,'small');
    homeSc(ctx,'veggie_stand',qs[2].cx,qs[2].cz,qs[2].qz<0?0:Math.PI);homeSc(ctx,'laundry_day',qs[2].cx+(qs[2].qx>0?9:-9),qs[2].cz,0,'medium');HOOD_FARM.patch(ctx,qs[3]);},
  R(ctx){homeSc(ctx,'crop_circle',-240,-240,0);},
  w(ctx,R){farmRoadside(ctx,R);const W=-140,Z=-236; // the farm's water tower (Zorp's crystal is on top) and a big ramp aimed at it
    put(ctx,'watertower',W,Z,0);ctx.ramp(W,-206,Math.PI,14,8,5);for(const [x,z] of [[-124,-252],[-128,-222],[-152,-252]])put(ctx,'hay',x,z,0);
    put(ctx,'tractor',-128,-212,1);ctx.spot('field',W,Z,34,40,0);
    hoodQuads(ctx,R,1.5).filter(q=>q.qx<0).forEach(q=>HOOD_FARM.field(ctx,q));},
  L(ctx){homeSc(ctx,'sheep_pen',240,240,0);ctx.herd('cow',266,210,3);put(ctx,'farmhouse',212,208,0);put(ctx,'tractor',270,262,0);},
  M:lmkAt('mill',2.2), O:lmkAt('silo',2.2), A:lmkAt('farmpond',2.2), K:lmkAt('coop',2.2), B:lmkAt('barn',2.2),
  // park
  p:ctx=>parkBlock(ctx), y:lmkAt('play'), U:lmkAt('fountain'), Z:lmkAt('gazebo'), N:fairAt('bounce'), T:lmkAt('stadium'),
  V:fairAt('ferris'), I:fairAt('ship'),
  P(ctx){homeSc(ctx,'duck_pond',-80,-240,0);},
  j(ctx,R){hoodSidewalks(ctx,R);const qs=hoodQuads(ctx,R,3.5);ctx.spot('lawn',ctx.cx,ctx.cz,78,78,0);
    homeSc(ctx,'kite_field',qs[0].cx,qs[0].cz,0,'medium');homeSc(ctx,'soccer_game',qs[1].cx,qs[1].cz,0);
    homeSc(ctx,'picnic_blanket',qs[2].cx,qs[2].cz,0);homeSc(ctx,'kite_field',qs[3].cx,qs[3].cz,Math.PI);
    for(let i=0;i<10;i++){const e=i%4,t=rand(-36,36);put(ctx,'tree',ctx.cx+(e<2?(e?37:-37):t),ctx.cz+(e<2?t:(e>2?37:-37)),0);}}
};

/* The ring round the start (the home chunks outside ±HOME): Fern's farm to the west, the bubble fountain to the
   north, corner shops to the east, Pip's picnic meadow to the south. Everything is in world coordinates and every
   home chunk runs all of it; ctx.place keeps only what's inside the chunk. */
function homeMargin(ctx){
  const P=(t,x,z,a,r)=>ctx.place(t,x,z,a,r||RAD[t]||1.2),fenceX=(x0,x1,z,gap)=>{for(let x=x0;x<=x1+.01;x+=4.2)if(!gap||Math.abs(x-gap)>3)P('fence',x,z,0,1);},
    fenceZ=(x,z0,z1,gap)=>{for(let z=z0;z<=z1+.01;z+=4.2)if(!gap||Math.abs(z-gap)>3)P('fence',x,z,Math.PI/2,1);},
    sp=(k,x,z,w,d)=>inChunk(ctx,x,z)&&ctx.spot(k,x,z,w,d,0);
  // sidewalks along both roads
  for(const s of [-1,1]){sp('sidewalk',s*7,-96,3.6,48);sp('sidewalk',s*7,96,3.6,48);sp('sidewalk',-96,s*7,48,3.6);sp('sidewalk',96,s*7.6,48,4.8);}
  for(const z of [-112,-88,88,112])for(const s of [-1,1])P('lamp',s*8.2,z,0);
  /* north: the bubble fountain plaza (Bubbles) and a kite lawn */
  sp('plaza',-22,-96,28,28);P('fountain',-22,-96,0);ring(ctx,-22,-96,6.4,4,'bench');ring(ctx,-22,-96,9.6,10,'flowers');
  P('trashcan',-34,-84,0);P('trashcan',-10,-109,0);for(const [x,z] of [[-35,-83],[-35,-109],[-9,-109]])P('lamp',x,z,0);
  sp('lawn',24,-96,30,46);homeSc(ctx,'kite_field',24,-98,0);P('tree',36,-80,0);P('tree',36,-114,0);P('tree',13,-114,0);
  /* north-west: Fern's barnyard */
  sp('field',-96,-90,46,56);P('barn',-96,-62,0);ring(ctx,-96,-62,RAD.barn+3,5,'hay');P('silo',-114,-86,0);P('silo',-106,-96,0);
  homeSc(ctx,'chicken_yard',-56,-96,0);P('tractor',-80,-104,1);P('scarecrow',-62,-80,0);
  for(let x=-116;x<=-44;x+=8.4)if(x<-75||x>-58)P('crops',x,-116,0);
  /* west, north of the road: Fern's farmhouse */
  sp('yard',-96,-24,46,30);P('farmhouse',-100,-26,0);P('mailbox',-91,-11,0);P('hay',-80,-30,0);P('hay',-82,-35,0);
  P('scarecrow',-114,-14,0);for(const x of [-108,-104,-96,-92])P('flowers',x,-17,0);homeSc(ctx,'laundry_day',-112,-34,0,'small');
  /* west, south of the road: Fern's chicken pasture (the chickens' quest), with the coop inside */
  sp('pen',-97,27,40,26);sp('pen',-97,53,40,26);
  fenceX(-116,-78,14,-86);fenceX(-116,-78,66);fenceZ(-117.5,15.5,64.5);fenceZ(-76.5,15.5,64.5);
  P('coop',-108,56,0);P('hay',-84,58,0);P('hay',-112,22,0);P('hay',-90,26,0);P('barrel',-80,20,0);P('wheelbarrow',-100,62,0);
  /* south-west: the orchard and pumpkins */
  sp('field',-96,96,46,46);homeSc(ctx,'pumpkin_patch',-104,100,0,'tiny');
  for(let i=0;i<5;i++)for(let j=0;j<3;j++)P('tree',-66+i*6,82+j*12,0);P('wheelbarrow',-82,84,0);P('scarecrow',-86,108,0);
  /* south: Pip's picnic meadow (the blankets are her drop spots) */
  sp('lawn',-22,96,32,46);sp('lawn',22,96,32,46);
  for(const [x,z] of HOME_QUEST_AT.pip_icecream.drops)homeSc(ctx,'picnic_blanket',x,z,0);
  homeSc(ctx,'icecream_line',30,110,0);P('bench',-36,116,0);P('trashcan',36,80,0);
  /* south-east: the soccer pitch and a birthday party, the car wash below the shops */
  sp('lawn',80,96,76,46);homeSc(ctx,'soccer_game',92,96,0);homeSc(ctx,'birthday_party',54,100,0);
  homeSc(ctx,'car_wash',96,56,Math.PI);
  /* east: corner shops on the cross street, parking behind */
  for(const x of [84,100,116]){P('shop',x,-13.6,0);P('shop',x,13.6,2);}
  for(const [x,z] of [[92,-9.4],[108,9.4]])P('bench',x,z,0);for(const [x,z] of [[76,-9.6],[92,9.6]])P('trashcan',x,z,0);
  sp('parking',96,-28,46,14);sp('parking',96,28,46,14);for(const x of [80,92,104,116]){P('parked',x,-28,1);if(x<110)P('parked',x+3,29,3);}
  /* north-east: the community garden and the veggie stand */
  sp('patch',56,-96,28,40);homeSc(ctx,'pumpkin_patch',56,-104,0,'tiny');homeSc(ctx,'veggie_stand',96,-58,0);
  homeSc(ctx,'yard_sale',96,-96,0,'medium');P('tree',112,-116,0);P('tree',76,-116,0);
}

/* Hank's Street: the start (inside ±HOME), built by buildWorld. Lots line both roads (a street of houses, front
   yards on the sidewalk, back fences meeting in the middle of each block) and each block's middle is a play lot.
   Hank's yard is right of the start, Garry's garden across the street. These are records in the chunks, like the
   layouts make (scenes with turned and scaled props), so smashed stays smashed and regrows in place. */
let homeTag=0,homeRecs=[];
function homeRec(type,x,z,arg,th,f,tag){
  if(!OBJ[type]||typeof chunkOf!=='function')return false;f=f||1;const r=(RAD[type]||1.2)*f;
  if(Math.abs(x)>HOME+3||Math.abs(z)>HOME+3||onRoad(x,z,r)||!homeClear(x,z,r))return false;
  for(const [a,b] of START_STREET)if(Math.hypot(x-a,z-b)<r+.9)return false;
  if(!MICRO_T.has(type)&&(startLane(x,z)||(z>8&&Math.abs(x)<ROAD_W/2+r)))return false;
  for(const [a,b] of [[0,0],[r+1,0],[-r-1,0],[0,r+1],[0,-r-1]])if(groundH(x+a,z+b)>0)return false;
  for(const o of objects)if(Math.hypot(o.x-x,o.z-z)<(o.r+r)*.8)return false;
  for(const q of homeRecs)if(q.scene!==tag&&Math.hypot(q.x-x,q.z-z)<q.r+r+.4)return false;
  const rec={type,x,z,arg,r,seed:(Math.random()*1e9)|0,dead:false,back:0,f,scene:tag};if(th)rec.th=th;
  chunkOf(x,z).recs.push(rec);homeRecs.push(rec);return true;}
function homeScene(id,x,z,th=0,size){
  if(typeof sceneItems!=='function')return false;const def=SCENES[id];if(!def)return false;
  const k=sizeIdx(size!=null?size:def.size),f=sceneF(def,k),tag='h'+(++homeTag),it=sceneItems(def,x,z,th,f,(Math.random()*1e9)|0,'home',k);
  let n=0;for(const q of it.place)n+=homeRec(q.type,q.x,q.z,q.arg,q.th,f*q.sc,tag);
  for(const q of it.spot)chunkSpot(chunkOf(q[1],q[2]),...q);for(const h of it.herd)chunkHerd(chunkOf(h[1],h[2]),...h);
  const c=chunkOf(x,z);c.scenes.push({id,tag,x,z,r:(def.r||8)*f,k,fixed:true,home:c.k,keys:[c.k]});return n>0;}
function homeArena(){
  homeRecs=[];const c0=(x,z)=>chunkOf(x,z);
  // plain props first (place() only checks other objects): lamps, micro clutter on the sidewalks, the play-lot toys
  for(const s of [-1,1])for(const t of [-60,-20,20,60]){place('lamp',s*8.2,t,0);place('lamp',t,s*8.2,0);}
  const MIC=['can','pebble','acorn','toyblock','pebble','flowers','popsicle'];
  for(let i=0;i<40;i++){const s=Math.random()<.5?1:-1,t=rand(10,70)*(Math.random()<.75?1:-1);
    if(Math.random()<.6)place(pick(MIC),s*rand(5.6,8.4),t,Math.random()*4|0);else place(pick(MIC),t,s*rand(5.6,8.4),Math.random()*4|0);}
  // the first few car lengths: toy-sized clutter on the road shoulders (micro things may sit in the lane)
  for(let i=0;i<26;i++){const s=Math.random()<.6?1:-1;place(pick(MIC),s*rand(1,4.7),rand(14,62),Math.random()*4|0);}
  for(let row=0;row<4;row++)for(let k=0;k<=row;k++)place('pin',-55+(k-row/2)*3.4,52-row*3.2); // bowling, at the foot of a ramp
  [[48,-64],[51,-67],[45,-67],[48,-70],[43,-62],[53,-62]].forEach(([x,z])=>place('barrel',x,z));for(const [x,z] of [[62,-62],[64,-46]])place('crates',x,z);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;place('tower',-55+Math.cos(a)*10,-55+Math.sin(a)*10);}
  // sidewalks on all four arms
  for(const s of [-1,1]){for(const z of [-40,40])chunkSpot(c0(s*6.9,z),'sidewalk',s*6.9,z,3.4,63);for(const x of [-40,40])chunkSpot(c0(x,s*6.9),'sidewalk',x,s*6.9,63,3.4);}
  // lots along the north–south road (x = ±23.4, front on the sidewalk) and the east–west road (z = ±23.4)
  const NS={1:{17:'lot_kids',33:'lot_family',49:'hank_yard',65:'lot_garden',[-17]:'lot_garden',[-33]:'lot_party',[-49]:'lot_family',[-65]:'lot_kids'},
            [-1]:{17:'lot_party',33:'garry_garden',49:'lot_family',65:'lot_kids',[-17]:'lot_family',[-33]:'lot_kids',[-49]:'lot_garden',[-65]:'lot_party'}};
  for(const sx of [1,-1])for(const z in NS[sx])homeScene(NS[sx][z],sx*23.4,+z,sx>0?-Math.PI/2:Math.PI/2);
  const EW={1:{49:'lot_family',65:'lot_garden',[-49]:'lot_kids',[-65]:'lot_family'},[-1]:{49:'lot_party',65:'lot_family',[-49]:'lot_garden',[-65]:'lot_kids'}};
  for(const sz of [1,-1])for(const x in EW[sz])homeScene(EW[sz][x],+x,sz*23.4,sz>0?Math.PI:0);
  // little stories on the sidewalks near the start
  homeScene('hopscotch',-7,52,Math.PI/2);homeScene('snail_race',7.2,32,-Math.PI/2);homeScene('ant_picnic',-7,22,Math.PI/2);
  // the middle of each block: a play lot
  chunkSpot(c0(55,55),'lawn',55,55,32,32);homeScene('playground_corner',55,50,Math.PI/2);homeScene('birthday_party',56,64,0,'small');
  chunkSpot(c0(-55,55),'lawn',-55,55,32,32);
  chunkSpot(c0(55,-55),'dirt',55,-55,30,30);homeScene('road_works',58,-48,0,'medium');
  chunkSpot(c0(-55,-55),'lawn',-55,-55,32,32);homeScene('lemonade_stand',-55,-55,0,'small');
}

/* ---------- D18: the Grow-Up Garage, outside (L32 hook) ----------
   Car scale 1, centered on the origin (logic scales, places and lifts it). Walls just outside ±GARAGE_HW (43), 14 tall,
   a 14-wide roll-up door in the middle of the front (+Z) and back (−Z). Cream walls on a red base, candy-stripe band,
   blue corner pillars, big windows down the sides, and a roof sign with a car between two grow-up arrows (no words).
   The roof, front wall, sign and beacon are cutaway parts (hidden while someone's inside). */
function buildGarageBuilding(){
  const H=43,T=1.5,O=H+T,W=14,D=7,DH=10,g=new THREE.Group(),cut=new THREE.Group();
  const add=(m,c)=>{(c?cut:g).add(m);return m;},WALL='#fff1d6',BASE='#ff6b6b',TRIM='#ffd60a',PIL='#4cc9f0',WIN='#a0e7ff';
  add(mk('box',O*2,3.1,O*2,'#2b2f45',0,-1.45,0)).castShadow=false; // floor slab: top at 0.1, reaches down to meet the ground
  const stripes=(len,n,c,fn)=>{for(let i=0;i<n;i++){const a=-len/2+len/n*(i+.5);add(fn(a,len/n,i%2?'#ffffff':'#ff595e'),c);}};
  for(const sx of [-1,1]){const x=sx*(H+T/2);
    add(mk('box',T,W,O*2,WALL,x,W/2,0));add(mk('box',T+.3,2,O*2,BASE,x,1,0));
    stripes(O*2,12,false,(a,l,c)=>mk('box',T+.3,1.6,l,c,x,W-1.4,a));
    for(const z of [-28,-9,10,29]){add(mk('box',T+.4,4.4,7,'#ffffff',x,7.4,z));add(mk('box',T+.6,3.6,6.2,WIN,x,7.4,z));}}
  for(const zs of [1,-1]){const z=zs*(H+T/2),pw=O-D,c=zs>0;
    for(const sx of [-1,1]){add(mk('box',pw,W,T,WALL,sx*(D+pw/2),W/2,z),c);add(mk('box',pw,2,T+.3,BASE,sx*(D+pw/2),1,z),c);
      stripes(pw,6,c,(a,l,col)=>mk('box',l,1.6,T+.3,col,sx*(D+pw/2)+a,W-1.4,z));
      add(mk('box',1.2,DH,T+.5,TRIM,sx*(D+.6),DH/2,z),c);}
    add(mk('box',D*2,W-DH,T,WALL,0,DH+(W-DH)/2,z),c);add(mk('box',D*2+2.4,1.2,T+.5,TRIM,0,DH+.6,z),c);
    // roll-up door: slats merged into one vertex-colored mesh, origin at its center (logic squashes it up to open)
    const dg=new THREE.Group(),n=8,cols=zs>0?['#ff9f1c','#ffbf69']:['#ff006e','#ff70a6'];
    for(let i=0;i<n;i++)dg.add(mk('box',D*2-.3,DH/n-.12,.5,cols[i%2],0,-DH/2+DH/n*(i+.5),0));
    dg.add(mk('box',2.4,.5,.7,'#343a40',0,-DH/2+1.2,0));
    const door=new THREE.Mesh(blocksGeo(dg),kitVCMat('#ffffff'));door.position.set(0,DH/2,z);door.castShadow=door.receiveShadow=true;
    door.userData.door=zs>0?'front':'back';if(c)door.userData.cutaway=true;g.add(door);}
  for(const sx of [-1,1])for(const zs of [-1,1])add(mk('box',3.2,W+1.6,3.2,PIL,sx*O,(W+1.6)/2,zs*O),zs>0); // corner pillars
  for(const sx of [-1,1]){const k=add(mk('box',O-D,1,T*.9,TRIM,sx*(D+(O-D)/2),.5,H+T/2));k.castShadow=false;} // low curb that stays when the front wall hides
  add(mk('box',O*2+1,1,O*2+1,'#3a86ff',0,W+.5,0),true);
  for(const sx of [-1,1])add(mk('box',1,1.4,O*2+1,TRIM,sx*(O+.5),W+1.2,0),true);
  for(const zs of [-1,1])add(mk('box',O*2+1,1.4,1,TRIM,0,W+1.2,zs*(O+.5)),true);
  // roof sign over the front door: a red car between two green grow-up arrows
  const sz=O+.6;add(mk('box',34,9,.8,'#ffffff',0,W+5.4,sz),true);add(mk('box',35,.8,1,TRIM,0,W+10.2,sz),true);add(mk('box',35,.8,1,TRIM,0,W+.6,sz),true);
  add(mk('box',10,2.6,.5,'#e63946',0,W+4.6,sz+.5),true);add(mk('box',5.6,2.2,.5,'#9bf6ff',-.4,W+6.9,sz+.45),true);
  for(const wx of [-3.2,3.2]){const w=mk('cyl',2.4,.6,2.4,'#222222',wx,W+3.2,sz+.75);w.rotation.x=Math.PI/2;add(w,true);}
  for(const ax of [-12,12]){add(mk('box',2,4.4,.5,'#06d6a0',ax,W+4.2,sz+.5),true);add(mk('pyr',5,3.2,.6,'#06d6a0',ax,W+8,sz+.5),true);}
  add(mk('cyl',3.2,1.8,3.2,'#ffffff',0,W+2,0),true).castShadow=false;
  if(typeof BEAM_MAT!=='undefined'){const beam=add(new THREE.Mesh(GEO.cyl,BEAM_MAT),true);beam.scale.set(2.4,140,2.4);beam.position.y=W+70;beam.castShadow=false;}
  if(typeof carMerge==='function')carMerge({g:cut});cut.userData.cutaway=true;g.add(cut);
  const arm=new THREE.Group();arm.position.set(0,W+3.6,0);arm.userData.beacon=true;arm.userData.cutaway=true;
  arm.add(mk('box',5.4,1.3,1.3,null,0,0,0,E('#ffd60a')),mk('box',1.3,1.3,5.4,null,0,0,0,E('#ff9f1c')),mk('sph',1.6,1.6,1.6,null,0,.4,0,E('#ff595e')));g.add(arm);
  return g;}
