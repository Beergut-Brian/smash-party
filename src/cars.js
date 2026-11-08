/* Smash Party — CARS. Owner: Cursor (design). Depends on core.js helpers: mk, M, E, base, W, add, glow, wheel. */
/* ---------- cars ---------- */
function wheel(d,w,x,y,z,hub='#e0e0e0'){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mk('wheel',w,d,d,'#222'));g.add(mk('wheel',w*1.06,d*0.5,d*0.5,hub));
  g.add(mk('box',w*1.1,d*0.14,d*0.32,'#555',0,d*0.17,0));g.userData.r=d/2;return g;
}
function base(){return {g:new THREE.Group(),wheels:[],ex:new THREE.Vector3(0,1,-2.5),h:3};}
function W(c,d,w,x,y,z,hub){const wh=wheel(d,w,x,y,z,hub);c.g.add(wh);c.wheels.push(wh);}
function add(c,...ms){ms.forEach(m=>c.g.add(m));}
const glow=c=>E(c);

/* ---------- parts library ----------
   Reusable add-ons. A new car just lists part ids. Each part is built in its own
   little space (y up, +Z forward) and the recipe places it with at / rot / scale.
   Colors come from the recipe entry (p.color, p.a, p.b, …). */
const PARTS={
  lightbar(p){const g=new THREE.Group();
    g.add(mk('box',1.15,.16,.32,'#222'));
    g.add(mk('box',.42,.2,.26,null,-.3,.12,0,glow(p.a||'#ff2d55')));
    g.add(mk('box',.42,.2,.26,null,.3,.12,0,glow(p.b||'#3a86ff')));
    return g;},
  stripe(p){return mk('box',p.w||1.5,p.h||.14,p.d||3.6,p.color||'#111');},
  roofsign(p){const g=new THREE.Group();
    g.add(mk('box',.15,.22,.15,'#222',0,-.05,0));
    g.add(mk('box',.72,.32,.32,p.color||'#111',0,.16,0));
    g.add(mk('box',.5,.1,.08,'#ffd60a',0,.16,.17));
    return g;},
  ladder(p){const g=new THREE.Group(),c=p.color||'#f8f9fa';
    g.add(mk('box',.08,.08,2.5,c,-.3,0,0));g.add(mk('box',.08,.08,2.5,c,.3,0,0));
    for(let i=0;i<6;i++)g.add(mk('box',.68,.06,.06,c,0,0,-1+i*.4));
    return g;},
  spoiler(p){const g=new THREE.Group(),c=p.color||'#111';
    g.add(mk('box',.1,.38,.22,c,-.6,.1,0));g.add(mk('box',.1,.38,.22,c,.6,.1,0));
    g.add(mk('box',1.55,.08,.38,c,0,.28,0));
    return g;},
  plow(p){const g=new THREE.Group();
    const blade=mk('box',3.1,1.2,.2,p.color||'#ff9f1c');blade.rotation.x=-.6;g.add(blade);
    g.add(mk('box',2.6,.12,.22,'#fff3bf',0,.35,.08));
    g.add(mk('box',.14,.14,.9,'#495057',-.7,-.15,-.55));
    g.add(mk('box',.14,.14,.9,'#495057',.7,-.15,-.55));
    return g;},
  drum(p){const g=new THREE.Group();
    const body=mk('cyl',.62,1.6,.62,p.color||'#ffe066');body.rotation.x=Math.PI/2;g.add(body);
    [-.48,.48].forEach(z=>{const b=mk('cyl',.68,.14,.68,p.band||'#f77f00');b.rotation.x=Math.PI/2;b.position.z=z;g.add(b);});
    return g;},
  chute(p){const g=new THREE.Group();
    const lip=mk('cone',.26,.85,.26,p.color||'#ced4da');lip.rotation.x=Math.PI/2+.55;g.add(lip);
    return g;},
  stopSign(p){const g=new THREE.Group();
    g.add(mk('box',.08,.9,.08,'#f8f9fa',0,-.2,0));
    const disc=mk('cyl',.46,.08,.46,p.color||'#e63946',0,.42,0);disc.rotation.x=Math.PI/2;g.add(disc);
    const face=mk('cyl',.28,.1,.28,'#fff',0,.42,.05);face.rotation.x=Math.PI/2;g.add(face);
    return g;},
  glass(p){const g=new THREE.Group();
    const m=new THREE.Mesh(GEO.box,litMat({color:p.color||'#bde0fe',transparent:true,opacity:.78}));
    m.scale.set(p.w||1.35,p.h||.48,p.d||.08);m.castShadow=false;g.add(m);
    return g;},
  /* Visible shooters for tier 2–3. Logic fires from the car; these are just looks. */
  cannon(p){const g=new THREE.Group(),c=p.color||'#495057',tip=p.tip||'#222';
    g.add(mk('box',.55,.4,.55,c,0,0,-.15));
    const barrel=mk('cyl',.18,1.35,.18,c,0,.05,.55);barrel.rotation.x=Math.PI/2;g.add(barrel);
    const muzzle=mk('cyl',.24,.18,.24,tip,0,.05,1.25);muzzle.rotation.x=Math.PI/2;g.add(muzzle);
    g.add(mk('box',.22,.22,.22,p.band||'#ffd60a',0,.28,-.05));
    return g;},
  rockets(p){const g=new THREE.Group(),c=p.color||'#e63946',fin=p.fin||'#ffd60a';
    [-.7,.7].forEach(x=>{
      const pod=new THREE.Group();pod.position.x=x;
      const body=mk('cyl',.2,1.1,.2,c);body.rotation.x=Math.PI/2;pod.add(body);
      const nose=mk('cone',.2,.45,.2,fin,0,0,.7);nose.rotation.x=Math.PI/2;pod.add(nose);
      const flame=mk('cyl',.14,.2,.14,null,0,0,-.65,glow(p.glow||'#ff7b00'));flame.rotation.x=Math.PI/2;pod.add(flame);
      [[-.18,.12],[.18,.12],[0,-.16]].forEach(([fx,fy])=>{
        const f=mk('box',.06,.22,.28,fin,fx,fy,-.35);pod.add(f);
      });
      g.add(pod);
    });
    g.add(mk('box',1.55,.12,.28,'#333',0,-.05,0));
    return g;},
  /* D4 wish-list silhouettes */
  trexHead(p){const g=new THREE.Group(),skin=p.color||'#52b788',jaw=p.jaw||'#40916c';
    g.add(mk('box',1.5,1.1,1.6,skin,0,.55,.1));
    g.add(mk('box',1.35,.55,1.3,jaw,0,.05,.35));
    g.add(mk('sph',.35,.35,.35,'#fff',-.4,.85,.7));g.add(mk('sph',.35,.35,.35,'#fff',.4,.85,.7));
    g.add(mk('sph',.16,.16,.16,'#111',-.42,.88,.82));g.add(mk('sph',.16,.16,.16,'#111',.42,.88,.82));
    for(let i=0;i<4;i++){
      g.add(mk('cone',.12,.28,.12,'#fff',-.45+i*.3,.32,1.05));
      const t=mk('cone',.1,.22,.1,'#fff',-.4+i*.28,-.05,1.0);t.rotation.x=Math.PI;g.add(t);
    }
    const crest=mk('cone',.35,.7,.35,p.crest||'#f77f00',0,1.25,-.15);g.add(crest);
    return g;},
  tacoShell(p){const g=new THREE.Group(),shell=p.color||'#e9c46a',fill=p.fill||'#f4a261',top=p.top||'#2a9d8f';
    const L=mk('box',.22,1.6,2.4,shell,-.55,.1,0);L.rotation.z=.55;g.add(L);
    const R=mk('box',.22,1.6,2.4,shell,.55,.1,0);R.rotation.z=-.55;g.add(R);
    g.add(mk('box',1.0,.35,2.1,fill,0,.35,0));
    g.add(mk('box',.85,.25,1.9,top,0,.55,0));
    g.add(mk('sph',.22,.22,.22,'#e63946',-.25,.7,.4));
    g.add(mk('sph',.18,.18,.18,'#ffbe0b',.3,.72,-.2));
    g.add(mk('sph',.16,.16,.16,'#fff',0,.75,.1));
    return g;},
  rollcage(p){const g=new THREE.Group(),c=p.color||'#f8f9fa';
    g.add(mk('box',.1,1.1,.1,c,-.85,.55,.6));g.add(mk('box',.1,1.1,.1,c,.85,.55,.6));
    g.add(mk('box',.1,1.1,.1,c,-.85,.55,-.7));g.add(mk('box',.1,1.1,.1,c,.85,.55,-.7));
    g.add(mk('box',1.8,.1,.1,c,0,1.15,.6));g.add(mk('box',1.8,.1,.1,c,0,1.15,-.7));
    g.add(mk('box',.1,.1,1.4,c,-.85,1.15,-.05));g.add(mk('box',.1,.1,1.4,c,.85,1.15,-.05));
    return g;},
  fatTire(p){const g=new THREE.Group();
    const tire=mk('cyl',p.r||.95,p.w||.7,p.r||.95,'#222');tire.rotation.z=Math.PI/2;g.add(tire);
    const hub=mk('cyl',(p.r||.95)*.45,(p.w||.7)*1.05,(p.r||.95)*.45,p.hub||'#ffd60a');hub.rotation.z=Math.PI/2;g.add(hub);
    return g;},
  /* Humble tier-0 toy bits */
  pedals(p){const g=new THREE.Group(),c=p.color||'#ffd60a',arm=p.arm||'#495057';
    g.add(mk('cyl',.08,.55,.08,arm));
    [-.35,.35].forEach((x,i)=>{
      const crank=mk('box',.12,.12,.42,arm,x,i?-.12:.12,0);g.add(crank);
      g.add(mk('box',.55,.1,.28,c,x+(i?-.15:.15),i?-.22:.22,0));
    });
    return g;},
  basket(p){const g=new THREE.Group(),c=p.color||'#ced4da',w=p.w||1.6,h=p.h||1.1,d=p.d||1.8;
    // Wire-frame shopping basket: rim + grid walls (reads from high camera).
    g.add(mk('box',w,.08,d,c,0,h,0));
    g.add(mk('box',w,.08,.08,c,0,0,d/2));g.add(mk('box',w,.08,.08,c,0,0,-d/2));
    g.add(mk('box',.08,.08,d,c,-w/2,0,0));g.add(mk('box',.08,.08,d,c,w/2,0,0));
    [-w/2,w/2].forEach(x=>{g.add(mk('box',.08,h,.08,c,x,h/2,d/2));g.add(mk('box',.08,h,.08,c,x,h/2,-d/2));});
    [-d/2,d/2].forEach(z=>{g.add(mk('box',.08,h,.08,c,-w/2,h/2,z));g.add(mk('box',.08,h,.08,c,w/2,h/2,z));});
    for(let i=1;i<3;i++){const y=h*(i/3);g.add(mk('box',w,.05,.05,c,0,y,d/2));g.add(mk('box',w,.05,.05,c,0,y,-d/2));
      g.add(mk('box',.05,.05,d,c,-w/2,y,0));g.add(mk('box',.05,.05,d,c,w/2,y,0));}
    // Groceries peeking out
    g.add(mk('sph',.35,.35,.35,p.a||'#e76f51',-.35,h+.15,.2));
    g.add(mk('sph',.28,.28,.28,p.b||'#ffd60a',.3,h+.1,-.15));
    g.add(mk('box',.4,.35,.25,p.fill||'#2a9d8f',.05,h+.05,.45));
    return g;},
  handlebar(p){const g=new THREE.Group(),c=p.color||'#212529',grip=p.grip||'#e63946';
    g.add(mk('box',.12,1.1,.12,c,0,.35,0));
    g.add(mk('box',1.35,.1,.1,c,0,.95,0));
    g.add(mk('cyl',.09,.28,.09,grip,-.65,.95,0));g.add(mk('cyl',.09,.28,.09,grip,.65,.95,0));
    if(p.bell!==false)g.add(mk('sph',.16,.16,.16,p.bell||'#ffd60a',.35,.1,.08));
    return g;},
  flag(p){const g=new THREE.Group(),pole=p.pole||'#adb5bd',c=p.color||'#3a86ff';
    g.add(mk('box',.06,1.2,.06,pole,0,.6,0));
    const cloth=mk('box',.55,.35,.06,c,.28,1.05,0);g.add(cloth);
    g.add(mk('box',.2,.2,.06,p.tip||'#ffbe0b',.45,1.05,0));
    return g;},
  googly(p){const g=new THREE.Group(),s=p.s||.32;
    [-.45,.45].forEach(x=>{
      g.add(mk('sph',s,s,s,'#fff',x,0,0));
      g.add(mk('sph',s*.45,s*.45,s*.45,'#111',x+s*.08,0,s*.35));
    });
    return g;},
  /* D12 tier-3 wish-list silhouettes */
  sledRunners(p){const g=new THREE.Group(),c=p.color||'#adb5bd',tip=p.tip||'#ff595e';
    [-1.05,1.05].forEach(x=>{
      g.add(mk('box',.18,.16,4.4,c,x,0,0));
      const nose=mk('box',.22,.18,.9,tip,x,.05,2.35);nose.rotation.x=-.45;g.add(nose);
      g.add(mk('box',.14,.35,.14,c,x,.2,-1.8));g.add(mk('box',.14,.35,.14,c,x,.2,1.2));
    });
    g.add(mk('box',2.1,.1,.2,c,0,.15,-.2));
    return g;},
  roboLegs(p){const g=new THREE.Group(),c=p.color||'#8d99ae',joint=p.joint||'#ffd60a',boot=p.boot||'#212529';
    [[-1.15,1.15],[-1.15,-1.15],[1.15,1.15],[1.15,-1.15]].forEach(([x,z])=>{
      const leg=new THREE.Group();leg.position.set(x,0,z);
      g.add(mk('box',.55,.22,.55,joint,x,1.55,z));
      leg.add(mk('box',.32,1.0,.32,c,0,.95,0));
      leg.add(mk('box',.42,.28,.42,joint,0,.4,0));
      leg.add(mk('box',.28,.7,.28,c,0,-.05,0));
      leg.add(mk('box',.55,.22,.7,boot,0,-.45,.1));
      g.add(leg);
    });
    g.add(mk('box',2.5,.18,2.5,c,0,1.7,0));
    return g;},
  stegoSpikes(p){const g=new THREE.Group(),a=p.color||'#57cc99',b=p.b||'#ffbe0b';
    for(let i=0;i<6;i++){
      const z=1.4-i*.55,h=.55+((i%2)?.35:.15),col=i%2?a:b;
      const plate=mk('box',.12,h,.55,col,0,h/2,z);plate.rotation.x=.15;g.add(plate);
      g.add(mk('box',.12,h*.7,.4,col,.35,h*.35,z-.05));
      g.add(mk('box',.12,h*.7,.4,col,-.35,h*.35,z-.05));
    }
    // stubby spiked tail tip
    const tip=mk('cone',.35,.9,.35,a,0,.25,-1.85);tip.rotation.x=-Math.PI/2+.2;g.add(tip);
    g.add(mk('cone',.18,.35,.18,b,-.25,.35,-2.2));g.add(mk('cone',.18,.35,.18,b,.25,.35,-2.2));
    return g;},
  hoverDisc(p){const g=new THREE.Group(),ring=p.color||'#9b5de5',glowC=p.glow||'#48cae4',dome=p.dome||'#caf0f8';
    const disc=mk('cyl',1.9,.22,1.9,ring);g.add(disc);
    const rim=mk('cyl',2.15,.12,2.15,p.rim||'#222');g.add(rim);
    const bubble=mk('sph',1.5,1.1,1.5,dome,0,.55,0);g.add(bubble);
    const light=mk('cyl',1.2,.1,1.2,null,0,-.2,0,glow(glowC));g.add(light);
    [[-1.4,0],[1.4,0],[0,-1.4],[0,1.4]].forEach(([x,z])=>{
      g.add(mk('sph',.22,.22,.22,null,x,-.05,z,glow(p.spot||'#ffd60a')));
    });
    return g;}
};

function mountPart(c,id,opts){
  const fn=PARTS[id];if(!fn){console.warn('Unknown car part',id);return;}
  const g=fn(opts||{});
  if(opts&&opts.at)g.position.set(opts.at[0],opts.at[1],opts.at[2]);
  if(opts&&opts.rot)g.rotation.set(opts.rot[0]||0,opts.rot[1]||0,opts.rot[2]||0);
  if(opts&&opts.scale)g.scale.setScalar(opts.scale);
  c.g.add(g);return g;
}

function buildMonster(){const c=base();
  [[-1.9,1.6],[1.9,1.6],[-1.9,-1.6],[1.9,-1.6]].forEach(([x,z])=>W(c,2.6,1.1,x,1.3,z,'#ffd60a'));
  add(c,mk('box',2.2,0.5,4.2,'#444',0,1.6,0),mk('box',3.4,1.1,4.8,'#e63946',0,2.6,0),mk('box',3.45,0.3,2.6,'#ffbe0b',0,2.6,0.9),
    mk('box',2.8,1.1,2.2,'#e63946',0,3.7,-0.5),mk('box',2.9,0.7,1.9,'#1d3557',0,3.75,-0.5),mk('box',2.7,0.2,2.1,'#e63946',0,4.3,-0.5),
    mk('box',0.6,0.4,0.15,null,-1.1,2.75,2.42,glow('#fff6a0')),mk('box',0.6,0.4,0.15,null,1.1,2.75,2.42,glow('#fff6a0')));
  c.ex.set(0,2.4,-2.7);c.h=4.5;return c;}
function buildRocket(){const c=base();
  [[-1.15,1.5],[1.15,1.5],[-1.15,-1.5],[1.15,-1.5]].forEach(([x,z])=>W(c,1.1,0.6,x,0.55,z));
  const nose=mk('cone',2.0,1.8,0.7,'#3a86ff',0,0.85,3.1);nose.rotation.x=Math.PI/2;
  const ex=mk('cyl',0.9,0.6,0.9,'#555',0,0.9,-2.4);ex.rotation.x=Math.PI/2;
  const fl=mk('cyl',0.6,0.1,0.6,null,0,0.9,-2.72,glow('#ff7b00'));fl.rotation.x=Math.PI/2;
  add(c,mk('box',2.0,0.7,4.4,'#3a86ff',0,0.85,0),mk('box',2.05,0.2,4.45,'#ffffff',0,0.95,0),nose,mk('sph',1.1,0.8,1.6,'#9be7ff',0,1.35,0.2),
    mk('box',0.15,1.2,1.0,'#ff006e',-0.8,1.4,-1.8),mk('box',0.15,1.2,1.0,'#ff006e',0.8,1.4,-1.8),mk('box',0.15,1.0,1.0,'#ff006e',0,1.6,-1.9),ex,fl);
  mountPart(c,'rockets',{at:[0,1.15,-.2],color:'#ff006e',fin:'#ffd60a'});
  c.ex.set(0,0.9,-3);c.h=2.2;return c;}
function buildShark(){const c=base();
  [[-1.15,1.6],[1.15,1.6],[-1.15,-1.6],[1.15,-1.6]].forEach(([x,z])=>W(c,1.0,0.5,x,0.5,z));
  const fin=mk('cone',0.25,1.6,1.4,'#6c7a89',0,2.75,-0.3);fin.rotation.x=-0.35;
  const t1=mk('box',0.2,1.4,0.6,'#6c7a89',0,2.0,-2.8);t1.rotation.x=0.6;const t2=mk('box',0.2,1.1,0.6,'#6c7a89',0,1.05,-2.8);t2.rotation.x=-0.6;
  add(c,mk('sph',2.4,1.7,5.2,'#7d8da1',0,1.4,0),mk('sph',2.0,1.0,4.6,'#f1f1f1',0,1.0,0.1),fin,t1,t2,
    mk('sph',0.55,0.55,0.55,'#fff',-0.8,1.85,1.6),mk('sph',0.55,0.55,0.55,'#fff',0.8,1.85,1.6),
    mk('sph',0.28,0.28,0.28,'#111',-0.92,1.9,1.8),mk('sph',0.28,0.28,0.28,'#111',0.92,1.9,1.8),mk('box',1.4,0.14,0.12,'#8b0000',0,1.05,2.45));
  for(let i=0;i<5;i++){const t=mk('cone',0.2,0.32,0.2,'#fff',-0.56+i*0.28,1.15,2.47);t.rotation.x=Math.PI;c.g.add(t);}
  mountPart(c,'rockets',{at:[0,1.55,-.6],color:'#6c7a89',fin:'#e63946',glow:'#48cae4'});
  c.ex.set(0,1.2,-3);c.h=3.5;return c;}
function buildDino(){const c=base();
  [-1.4,0,1.4].forEach(z=>{W(c,0.85,1.0,-1.5,0.55,z,'#888');W(c,0.85,1.0,1.5,0.55,z,'#888');});
  const tail=mk('cone',0.9,1.8,0.9,'#52b788',0,1.6,-2.4);tail.rotation.x=-Math.PI/2;
  add(c,mk('box',0.9,1.1,4.2,'#333',-1.5,0.55,0),mk('box',0.9,1.1,4.2,'#333',1.5,0.55,0),mk('box',2.4,1.4,3.2,'#52b788',0,1.6,0),
    mk('box',1.8,1.3,1.6,'#52b788',0,2.9,-0.4),mk('box',1.85,0.6,1.2,'#1d3557',0,3.0,-0.4),tail,
    mk('sph',0.55,0.55,0.55,'#fff',-0.5,3.75,0.2),mk('sph',0.55,0.55,0.55,'#fff',0.5,3.75,0.2),
    mk('sph',0.26,0.26,0.26,'#111',-0.5,3.8,0.44),mk('sph',0.26,0.26,0.26,'#111',0.5,3.8,0.44),
    mk('box',3.6,1.3,0.3,'#ffd60a',0,0.9,2.3),mk('box',0.25,0.25,1,'#555',-1,1.3,1.8),mk('box',0.25,0.25,1,'#555',1,1.3,1.8));
  [[3.65,-0.75],[3.65,-1.15],[2.5,-1.3]].forEach(([y,z])=>c.g.add(mk('cone',0.5,0.8,0.5,'#f77f00',0,y+0.3,z)));
  for(let i=0;i<4;i++)c.g.add(mk('cone',0.3,0.45,0.3,'#fff',-1.2+i*0.8,1.75,2.3));
  mountPart(c,'cannon',{at:[0,2.55,1.55],color:'#2d6a4f',tip:'#081c15',band:'#ffd60a'});
  c.ex.set(0,1.6,-3.2);c.h=4.3;return c;}
function buildIceCream(){const c=base();
  [[-1.3,1.6],[1.3,1.6],[-1.3,-1.6],[1.3,-1.6]].forEach(([x,z])=>W(c,1.3,0.6,x,0.65,z));
  const cone=mk('cone',1.4,2.0,1.4,'#d4a373',0,4.05,0);cone.rotation.x=Math.PI;
  add(c,mk('box',2.6,2.4,4.6,'#ffafcc',0,1.85,0),mk('box',2.65,0.35,4.65,'#ffffff',0,1.2,0),mk('box',2.4,0.9,0.1,'#1d3557',0,2.4,2.31),
    mk('box',0.1,0.9,1.8,'#1d3557',1.31,2.2,-0.5),mk('box',0.1,0.9,1.8,'#1d3557',-1.31,2.2,-0.5),cone,
    mk('sph',1.6,1.6,1.6,'#ff8fab',0,5.3,0),mk('sph',1.3,1.3,1.3,'#b9fbc0',0,6.2,0),mk('sph',0.45,0.45,0.45,'#e63946',0,6.95,0));
  c.ex.set(0,0.8,-2.5);c.h=7.2;return c;}
function buildHotdog(){const c=base();
  [[-1.25,1.7],[1.25,1.7],[-1.25,-1.7],[1.25,-1.7]].forEach(([x,z])=>W(c,1.0,0.5,x,0.5,z));
  add(c,mk('sph',2.6,1.2,5.4,'#e9c46a',0,1.0,0),mk('sph',1.3,1.1,6.0,'#c1121f',0,1.6,0));
  for(let i=0;i<6;i++){const m=mk('box',0.9,0.12,0.2,'#ffd60a',0,2.17,-2+i*0.8);m.rotation.y=i%2?0.6:-0.6;c.g.add(m);}
  c.ex.set(0,1,-3);c.h=2.4;return c;}
function buildFire(){const c=base();
  [2.0,-1.0,-2.2].forEach(z=>{W(c,1.3,0.6,-1.3,0.65,z);W(c,1.3,0.6,1.3,0.65,z);});
  add(c,mk('box',2.6,1.8,6,'#d62828',0,1.6,0),mk('box',2.65,0.22,6.05,'#ffffff',0,1.3,0),mk('box',2.6,1.0,1.6,'#d62828',0,3.0,2.0),
    mk('box',2.65,0.6,1.3,'#1d3557',0,3.05,2.0),mk('box',0.5,0.3,0.4,null,-0.6,3.65,2.2,glow('#ff1e1e')),mk('box',0.5,0.3,0.4,null,0.6,3.65,2.2,glow('#1e6bff')),
    mk('box',0.15,0.15,5,'#dddddd',-0.6,2.75,-0.7),mk('box',0.15,0.15,5,'#dddddd',0.6,2.75,-0.7));
  for(let z=-3;z<=1.7;z+=0.7)c.g.add(mk('box',1.3,0.12,0.12,'#dddddd',0,2.75,z));
  mountPart(c,'cannon',{at:[0,3.55,1.35],color:'#6c757d',tip:'#212529',band:'#ffd60a'});
  c.ex.set(0,0.8,-3.2);c.h=3.9;return c;}
function buildBubble(){const c=base();
  [[-1.3,1.1],[1.3,1.1],[-1.3,-1.1],[1.3,-1.1]].forEach(([x,z])=>W(c,1.0,0.6,x,0.5,z,'#ffbe0b'));
  add(c,mk('sph',3.2,2.6,3.6,'#9d4edd',0,1.7,0),mk('sph',2.6,1.8,2.4,'#a0f0ff',0,2.2,0.6),mk('cyl',0.08,1.4,0.08,'#333',0,3.6,-0.6),
    mk('sph',0.45,0.45,0.45,'#ffbe0b',0,4.35,-0.6),mk('sph',0.5,0.5,0.5,null,-0.8,1.4,1.7,glow('#fff6a0')),mk('sph',0.5,0.5,0.5,null,0.8,1.4,1.7,glow('#fff6a0')));
  c.ex.set(0,1,-2);c.h=4.7;return c;}

/* tier 0 = humble starters, 3 = coolest smash machines. weapon is visible on tier 2–3.
   D9: power 1–5, handling 1–5, perk (faster = weaker). perk:null = none. */
const CARS=[
  {name:'Big Bouncer',emoji:'🛻',speed:24,r:2.6,tier:1,power:4,handling:2,perk:'bouncy',build:buildMonster},
  {name:'Rocket Racer',emoji:'🚀',speed:32,r:2.0,tier:3,weapon:'rocket',power:2,handling:5,perk:'autoRockets',build:buildRocket},
  {name:'Shark Attack',emoji:'🦈',speed:27,r:2.2,tier:3,weapon:'rocket',power:3,handling:4,perk:'magnet',build:buildShark},
  {name:'Dino Dozer',emoji:'🦖',speed:21,r:2.8,tier:2,weapon:'cannon',power:5,handling:2,perk:'bulldozer',build:buildDino},
  {name:'Ice Cream Smasher',emoji:'🍦',speed:24,r:2.4,tier:0,power:3,handling:3,perk:'bouncy',build:buildIceCream},
  {name:'Hot Dog Hot Rod',emoji:'🌭',speed:28,r:2.3,tier:1,power:2,handling:4,perk:null,build:buildHotdog},
  {name:'Fire Truck',emoji:'🚒',speed:25,r:2.6,tier:2,weapon:'cannon',power:4,handling:2,perk:'bulldozer',build:buildFire},
  {name:'Bubble Buggy',emoji:'🫧',speed:26,r:2.2,tier:0,power:2,handling:4,perk:'bouncy',build:buildBubble}
];

/* ---------- car recipes ----------
   One Kenney base + a paint color + parts from the library above + an optional tweak.
   tweak is [x, y, z] multiplied on top of scale (a longer bus, a taller cab).
   paint replaces the body color. Wheel meshes keep the Kenney texture and still spin.
   at is [x, y, z] in car space. rot is [x, y, z] radians. */
const RECIPES=[
  {name:'Yellow Cab',emoji:'🚕',base:'taxi.glb',speed:25,r:2.2,tier:1,power:3,handling:3,perk:null,scale:1.636,height:2.7,
    paint:'#ffd60a',exhaust:[0,.9,-2.1],
    parts:[
      {id:'stripe',at:[0,.55,0],color:'#222',w:2.15,h:.16,d:3.9},
      {id:'roofsign',at:[0,2.42,.15],color:'#111'},
      {id:'glass',at:[0,1.85,1.15],w:1.35,h:.42}]},
  {name:'Hose Hero',emoji:'🚒',base:'firetruck.glb',speed:24,r:2.3,tier:2,weapon:'cannon',power:4,handling:2,perk:'bulldozer',scale:1.324,height:2.55,
    paint:'#d62828',exhaust:[0,.8,-2.15],
    parts:[
      {id:'stripe',at:[0,1.15,0],color:'#f8f9fa',w:2.05,h:.14,d:4.15},
      {id:'ladder',at:[0,2.2,-.15],color:'#f8f9fa'},
      {id:'lightbar',at:[0,2.35,1.15],a:'#ff2d55',b:'#ff2d55'},
      {id:'cannon',at:[0,2.05,2.05],color:'#495057',tip:'#212529',band:'#ffd60a'}]},
  {name:'Dash Racer',emoji:'🏎️',base:'race.glb',speed:30,r:2.15,tier:2,weapon:'cannon',power:2,handling:5,perk:'autoRockets',scale:1.758,height:1.7,
    paint:'#3a86ff',exhaust:[0,.45,-2.05],
    parts:[
      {id:'stripe',at:[0,1.22,.15],color:'#fff',w:.22,h:.06,d:3.3},
      {id:'spoiler',at:[0,1.05,-1.55],color:'#ffd60a'},
      {id:'glass',at:[0,.95,.85],color:'#caf0f8',w:1.05,h:.28},
      {id:'cannon',at:[0,.85,1.85],color:'#1d3557',tip:'#0a1628',band:'#ff006e',scale:.85}]},
  {name:'Honk Bus',emoji:'🚌',base:'van.glb',speed:22,r:2.45,tier:2,weapon:'cannon',power:4,handling:2,perk:'magnet',scale:1.636,tweak:[1,1.08,1.12],height:2.7,
    paint:'#ffbe0b',exhaust:[0,.7,-2.3],
    parts:[
      {id:'stripe',at:[0,1.35,0],color:'#222',w:2.35,h:.2,d:4.5},
      {id:'lightbar',at:[0,2.45,.4],a:'#ff2d55',b:'#ffd60a'},
      {id:'stopSign',at:[1.35,1.45,1.55],color:'#e63946'},
      {id:'glass',at:[0,1.85,1.35],w:1.7,h:.5},
      {id:'cannon',at:[0,2.15,1.95],color:'#6c757d',band:'#ffbe0b'}]},
  {name:'Snow Pusher',emoji:'❄️',base:'truck.glb',speed:21,r:2.35,tier:2,weapon:'cannon',power:5,handling:2,perk:'bulldozer',scale:1.525,height:2.2,
    paint:'#e7f5ff',exhaust:[0,.7,-2.1],
    parts:[
      {id:'stripe',at:[0,1.15,.2],color:'#3a86ff',w:2.1,h:.16,d:2.2},
      {id:'plow',at:[0,.95,2.55],color:'#ff9f1c'},
      {id:'lightbar',at:[0,1.95,.55],a:'#ffd60a',b:'#ffd60a'},
      {id:'cannon',at:[0,1.85,1.15],color:'#adb5bd',tip:'#343a40',band:'#3a86ff'}]},
  {name:'Spinny Mixer',emoji:'🌀',base:'truck.glb',speed:20,r:2.4,tier:2,weapon:'cannon',power:4,handling:2,perk:'magnet',scale:1.525,height:2.7,
    paint:'#f77f00',exhaust:[0,.7,-2.1],
    parts:[
      {id:'drum',at:[0,1.55,-.35],color:'#fff3bf',band:'#f77f00'},
      {id:'chute',at:[.85,1.3,-1.15],rot:[0,.9,0],color:'#dee2e6'},
      {id:'stripe',at:[0,.7,.4],color:'#fff',w:1.9,h:.12,d:1.6},
      {id:'cannon',at:[0,1.35,2.05],color:'#495057',band:'#f77f00'}]},
  /* D4 wish-list: T-rex truck, taco truck, monster truck */
  {name:'Rex Rammer',emoji:'🦕',base:'truck.glb',speed:22,r:2.55,tier:3,weapon:'rocket',power:5,handling:2,perk:'bulldozer',scale:1.525,tweak:[1.05,1.12,1.08],height:3.8,
    paint:'#52b788',exhaust:[0,.75,-2.15],
    parts:[
      {id:'trexHead',at:[0,2.05,2.85],scale:1.35,color:'#52b788',jaw:'#2d6a4f',crest:'#f77f00'},
      {id:'stripe',at:[0,.85,.1],color:'#ffd60a',w:2.05,h:.14,d:2.4},
      {id:'rockets',at:[0,1.65,-.85],scale:1.25,color:'#40916c',fin:'#ffd60a',glow:'#95d5b2'}]},
  {name:'Taco Tornado',emoji:'🌮',base:'van.glb',speed:24,r:2.4,tier:2,weapon:'cannon',power:3,handling:3,perk:'magnet',scale:1.636,tweak:[1.02,1.1,1.05],height:3.6,
    paint:'#f4a261',exhaust:[0,.75,-2.25],
    parts:[
      {id:'tacoShell',at:[0,2.65,0],scale:1.35,color:'#e9c46a',fill:'#e76f51',top:'#2a9d8f'},
      {id:'stripe',at:[0,1.15,0],color:'#e63946',w:2.3,h:.16,d:4.2},
      {id:'roofsign',at:[0,3.55,.2],color:'#e63946'},
      {id:'cannon',at:[0,1.95,2.25],scale:1.15,color:'#2a9d8f',tip:'#264653',band:'#e9c46a'},
      {id:'glass',at:[0,1.75,1.35],w:1.55,h:.45,color:'#ffe8d6'}]},
  {name:'Stomp King',emoji:'🛞',base:'suv.glb',speed:23,r:2.7,tier:3,weapon:'rocket',power:5,handling:2,perk:'bulldozer',scale:1.667,tweak:[1.12,1.4,1.08],y:.15,height:3.8,
    paint:'#e63946',exhaust:[0,1.1,-2.2],
    parts:[
      {id:'fatTire',at:[-1.7,1.05,1.45],r:1.2,w:.95,hub:'#ffd60a'},
      {id:'fatTire',at:[1.7,1.05,1.45],r:1.2,w:.95,hub:'#ffd60a'},
      {id:'fatTire',at:[-1.7,1.05,-1.45],r:1.2,w:.95,hub:'#ffd60a'},
      {id:'fatTire',at:[1.7,1.05,-1.45],r:1.2,w:.95,hub:'#ffd60a'},
      {id:'rollcage',at:[0,2.25,-.1],color:'#f8f9fa'},
      {id:'stripe',at:[0,1.55,.2],color:'#ffd60a',w:2.2,h:.18,d:3.4},
      {id:'rockets',at:[0,2.05,-.55],scale:1.3,color:'#9b2226',fin:'#ffd60a',glow:'#ff7b00'},
      {id:'spoiler',at:[0,2.7,-1.55],color:'#111'}]},
  /* D4 tier-0 humble starters — toy-ish, no weapons (bubbles) */
  {name:'Pedal Putter',emoji:'🚲',base:'kart-oozi.glb',speed:22,r:2.05,tier:0,power:2,handling:3,perk:'bouncy',scale:2.0,height:2.9,
    paint:'#ff6b6b',exhaust:[0,.95,-1.35],
    parts:[
      {id:'pedals',at:[0,.55,.55],color:'#ffd60a',arm:'#495057'},
      {id:'stripe',at:[0,1.05,.1],color:'#fff',w:.35,h:.1,d:2.0},
      {id:'googly',at:[0,1.55,1.15],s:.28},
      {id:'flag',at:[.75,1.55,-.55],color:'#3a86ff',tip:'#ffbe0b'}]},
  {name:'Cart Crash',emoji:'🛒',base:'van.glb',speed:21,r:2.25,tier:0,power:2,handling:2,perk:'magnet',scale:1.45,tweak:[.92,.88,.9],height:2.8,
    paint:'#adb5bd',exhaust:[0,.65,-2.0],
    parts:[
      {id:'basket',at:[0,1.35,.15],w:1.7,h:1.15,d:2.0,color:'#dee2e6',a:'#e76f51',b:'#ffd60a',fill:'#2a9d8f'},
      {id:'handlebar',at:[0,1.55,-1.55],color:'#495057',grip:'#e63946',bell:'#ffd60a'},
      {id:'googly',at:[0,1.85,1.55],s:.3},
      {id:'stripe',at:[0,.55,0],color:'#ff006e',w:2.0,h:.12,d:3.4}]},
  {name:'Scoot Zoom',emoji:'🛴',base:'race.glb',speed:27,r:2.0,tier:0,power:1,handling:5,perk:'bouncy',scale:1.55,tweak:[.72,.55,1.2],height:2.2,
    paint:'#06d6a0',exhaust:[0,.35,-2.0],
    parts:[
      {id:'handlebar',at:[0,.55,1.55],color:'#212529',grip:'#ff006e',bell:'#ffd60a',scale:1.05},
      {id:'stripe',at:[0,.55,.2],color:'#fff',w:.2,h:.08,d:3.2},
      {id:'googly',at:[0,.85,1.05],s:.24},
      {id:'flag',at:[-.55,.9,-1.15],color:'#ffbe0b',tip:'#e63946',scale:.85}]},
  /* D12 tier-3 garage cars — exact GARAGE_WANTED names so placeholders disappear */
  {name:'Rocket Sled',emoji:'🛷',base:'race.glb',speed:31,r:2.2,tier:3,weapon:'rocket',power:2,handling:4,perk:'autoRockets',scale:1.7,tweak:[.85,.55,1.35],y:.05,height:2.4,
    paint:'#ff595e',exhaust:[0,.55,-2.4],
    parts:[
      {id:'sledRunners',at:[0,.25,0],color:'#ced4da',tip:'#ffd60a'},
      {id:'stripe',at:[0,.7,.15],color:'#fff',w:.28,h:.08,d:4.0},
      {id:'spoiler',at:[0,.85,-1.85],color:'#222',scale:.9},
      {id:'rockets',at:[0,.95,-.15],scale:1.15,color:'#c1121f',fin:'#ffd60a',glow:'#ff7b00'},
      {id:'googly',at:[0,.95,1.55],s:.22}]},
  {name:'Robo Walker',emoji:'🤖',base:'truck.glb',speed:22,r:2.6,tier:3,weapon:'rocket',power:4,handling:3,perk:'autoRockets',scale:1.45,tweak:[1.05,1.15,1.0],y:.85,height:4.2,
    paint:'#8d99ae',exhaust:[0,1.55,-2.0],
    parts:[
      {id:'roboLegs',at:[0,0,0],color:'#6c757d',joint:'#ffd60a',boot:'#212529'},
      {id:'stripe',at:[0,1.85,.2],color:'#ffd60a',w:2.0,h:.14,d:2.2},
      {id:'googly',at:[0,2.55,1.55],s:.36},
      {id:'flag',at:[.7,2.35,-.4],color:'#3a86ff',tip:'#ff006e',pole:'#adb5bd',scale:.9},
      {id:'rockets',at:[0,2.15,-.75],scale:1.2,color:'#495057',fin:'#ffd60a',glow:'#48cae4'},
      {id:'lightbar',at:[0,2.65,.35],a:'#ff2d55',b:'#3a86ff'}]},
  {name:'Spike-o-saurus',emoji:'🦕',base:'truck.glb',speed:23,r:2.7,tier:3,weapon:'rocket',power:5,handling:2,perk:'bulldozer',scale:1.55,tweak:[1.08,1.15,1.1],height:3.6,
    paint:'#57cc99',exhaust:[0,.8,-2.2],
    parts:[
      {id:'stegoSpikes',at:[0,1.85,-.15],scale:1.2,color:'#38a3a5',b:'#ffbe0b'},
      {id:'googly',at:[0,2.15,2.35],s:.34},
      {id:'stripe',at:[0,.9,.15],color:'#22577a',w:2.1,h:.16,d:2.6},
      {id:'rockets',at:[0,1.55,-.95],scale:1.25,color:'#2a9d8f',fin:'#ffbe0b',glow:'#95d5b2'},
      {id:'plow',at:[0,.85,2.55],color:'#80ed99',scale:.85}]},
  {name:'Hover Zoomer',emoji:'🛸',base:'race-future.glb',speed:29,r:2.3,tier:3,weapon:'rocket',power:2,handling:5,perk:'magnet',scale:1.65,tweak:[1.05,.9,1.05],y:.35,height:2.8,
    paint:'#9b5de5',exhaust:[0,.7,-2.1],
    parts:[
      {id:'hoverDisc',at:[0,.55,0],scale:1.05,color:'#7b2cbf',rim:'#22223b',dome:'#caf0f8',glow:'#48cae4',spot:'#ffd60a'},
      {id:'stripe',at:[0,1.15,.1],color:'#00f5d4',w:.25,h:.08,d:2.8},
      {id:'rockets',at:[0,1.05,-.55],scale:1.1,color:'#5a189a',fin:'#00f5d4',glow:'#ff7b00'},
      {id:'googly',at:[0,1.45,1.15],s:.26},
      {id:'spoiler',at:[0,1.25,-1.45],color:'#00bbf9'}]}
];

/* ---------- Kenney cars ----------
   cars.json entries are plain bases (no extra parts). RECIPES mix a base, paint, and parts.
   Both share one loaded copy of each glb. */
function paintBody(root,color,keep){
  const skip=keep||[];
  root.traverse(o=>{
    if(!o.isMesh)return;
    const n=(o.name||'').toLowerCase();
    if(/wheel|tire|tyre/.test(n)||skip.some(k=>n.includes(k)))return;
    const paint=m=>{const mat=m.clone();mat.map=null;mat.color=new THREE.Color(color);if('metalness' in mat)mat.metalness=.04;if('roughness' in mat)mat.roughness=.65;return mat;};
    o.material=Array.isArray(o.material)?o.material.map(paint):paint(o.material);
  });
}
function buildRecipe(def,tmpl){
  return ()=>{
    const c=base(),m=tmpl.clone(true),s=def.scale||1,t=def.tweak||[1,1,1];
    m.scale.set(s*(t[0]||1),s*(t[1]||1),s*(t[2]||1));
    m.position.y=def.y||0;m.rotation.y=def.rotateY||0;
    if(def.paint)paintBody(m,def.paint,def.keep);
    c.g.add(m);
    m.traverse(o=>{if(o.isMesh&&/wheel|tire|tyre/i.test(o.name)){const b=new THREE.Box3().setFromObject(o);o.userData.r=Math.max(.3,(b.max.y-b.min.y)/2);c.wheels.push(o);}});
    (def.parts||[]).forEach(p=>{
      const fn=PARTS[p.id];if(!fn){console.warn('Unknown car part',p.id);return;}
      const g=fn(p);
      if(p.at)g.position.set(p.at[0],p.at[1],p.at[2]);
      if(p.rot)g.rotation.set(p.rot[0]||0,p.rot[1]||0,p.rot[2]||0);
      if(p.scale)g.scale.setScalar(p.scale);
      c.g.add(g);
    });
    if(def.exhaust)c.ex.set(...def.exhaust);c.h=def.height||3;return c;
  };
}
function pushCar(def,tmpl){
  const car={name:def.name,emoji:def.emoji||'🚗',speed:def.speed||25,r:def.r||2.3,build:buildRecipe(def,tmpl)};
  if(def.tier!=null)car.tier=def.tier;if(def.weapon)car.weapon=def.weapon;
  if(def.power!=null)car.power=def.power;if(def.handling!=null)car.handling=def.handling;
  if(def.perk!==undefined)car.perk=def.perk;
  CARS.push(car);
}
function loadModelCars(){
  if(!THREE.GLTFLoader||location.protocol==='file:')return;
  const loader=new THREE.GLTFLoader(),bases={},wait={},loading={};
  function ready(file,fn){
    if(bases[file])return fn(bases[file]);
    (wait[file]=wait[file]||[]).push(fn);
    if(loading[file])return;loading[file]=1;
    loader.load('assets/cars/'+file,gltf=>{
      const tmpl=gltf.scene;
      tmpl.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      bases[file]=tmpl;(wait[file]||[]).forEach(f=>f(tmpl));
    },undefined,e=>console.warn('Could not load car model',file,e));
  }
  fetch('assets/cars/cars.json').then(r=>r.ok?r.json():[]).then(list=>{
    (list||[]).forEach(def=>ready(def.file,tmpl=>pushCar(def,tmpl)));
  }).catch(()=>{});
  RECIPES.forEach(def=>ready(def.base,tmpl=>pushCar(def,tmpl)));
}
loadModelCars();

/* D9: level-up garage showroom. Floor top at y=0, ~26 radius, open toward +Z (camera). Logic scales + places it. */
function buildGarage(){
  const g=new THREE.Group(),R=26;
  const floor=mk('cyl',R*2,.35,R*2,'#2b2d42',0,-.095,0); // top at y=.08 so it never fights the ground plane (y=0)floor.castShadow=false;g.add(floor);
  // candy pie wedges on the floor
  const wedges=['#ff6b6b','#ffd60a','#06d6a0','#3a86ff','#9b5de5','#ff9f1c','#48cae4','#f72585'];
  for(let i=0;i<8;i++){
    const wedge=new THREE.Mesh(new THREE.CircleGeometry(R*.92,24,i*Math.PI/4,Math.PI/4),M(wedges[i]));
    wedge.rotation.x=-Math.PI/2;wedge.position.y=.12;wedge.castShadow=false;wedge.receiveShadow=true;g.add(wedge);
  }
  const hub=mk('cyl',6.4,.12,6.4,'#fff',0,.1,0);hub.castShadow=false;g.add(hub);
  g.add(mk('cyl',3.2,.16,3.2,'#ffd60a',0,.14,0));
  // low curb ring (open toward +Z so the camera can see in)
  const curb=new THREE.Mesh(new THREE.CylinderGeometry(R,R,1.1,48,1,true,Math.PI*.28,Math.PI*1.44),
    litMat({color:'#ffd60a',side:THREE.DoubleSide}));
  curb.position.y=.55;curb.receiveShadow=true;g.add(curb);
  // candy stripes on the curb
  for(let i=0;i<14;i++){
    const a=Math.PI*.32+i*(Math.PI*1.36/14),x=Math.sin(a)*(R-.15),z=Math.cos(a)*(R-.15);
    g.add(mk('box',R*.12,.95,.22,i%2?'#fff':'#e63946',x,.5,z));
  }
  // back banner + checkered strip
  g.add(mk('box',R*1.15,6.5,1.1,'#e63946',0,3.4,-R+.55));
  g.add(mk('box',R*1.15,1.4,1.3,'#fff',0,7.1,-R+.55));
  for(let i=0;i<9;i++)g.add(mk('box',R*.12,R*.12*.55,.28,i%2?'#111':'#fff',(i-4)*R*.12,4.1,-R+1.15));
  // spotlights around the back half
  for(let i=0;i<5;i++){
    const a=Math.PI*.55+i*(Math.PI*.9/4),x=Math.sin(a)*(R-2.2),z=Math.cos(a)*(R-2.2);
    g.add(mk('cyl',.22,7.2,.22,'#adb5bd',x,3.6,z));
    const lamp=mk('cone',1.1,1.4,1.1,'#212529',x,7.4,z);lamp.rotation.x=Math.PI;g.add(lamp);
    g.add(mk('sph',.55,.55,.55,null,x,6.7,z,glow('#fff6a0')));
  }
  // little toy cones marking the open entrance
  [[-10,R-1.2],[10,R-1.2],[-16,R-3],[16,R-3]].forEach(([x,z],i)=>{
    g.add(mk('cone',.9,1.6,.9,i%2?'#ff9f1c':'#ffd60a',x,.8,z));
    g.add(mk('cyl',.95,.18,.95,'#fff',x,.15,z));
  });
  return g;
}
