/* Smash Party — WORLD: ANIMALS. Owner: world-animals session (Claude Code design). Loads after objects.js.
   Fill ANIMAL to replace logic's blocky placeholders (ANIMAL_DEFAULT in game.js). Any kind left out keeps its placeholder.
   Each entry: { build(){ … return THREE.Group }, fluff:'#hex' }. The group faces +Z, feet at y=0, real-ish size
   (chicken ~0.7 long, cow ~2.6). Use M(color)/mk() so the quality toggle covers it, or prop('name', fallback) for a GLB
   listed in assets/props/props.json (put animal models in assets/props/animals/).
   Kinds: chick, chicken, duck, goose, bunny, cat, dog, pig, sheep, goat, cow, horse. Animals are never destroyed.
   Extra kinds: rooster (joins chicken flocks) and the Dino Valley babies trike, stego, bronto (D14, herded by dino.js).

   D3 looks: chunky toy animals built from M() spheres/boxes, big heads, short legs and huge googly eyes
   (the two pupils look different ways on purpose). Logic merges each kind into one mesh per color, so every
   color is one draw call per animal: keep each animal to a handful of colors and reuse the shared ones below.
   Everything lives inside one closure so only ANIMAL is global. */
const ANIMAL=(()=>{
  const WHITE='#ffffff',INK='#111111',PINK='#ffadc6',NOSE='#ff8fab',ORANGE='#ff9f1c',RED='#e63946',GOLD='#ffd60a';
  const PI=Math.PI;
  // Low-poly copies of the shared shapes: animals come in herds, so ~1/3 the triangles of GEO.sph/cyl/cone.
  // Merged per color by logic either way, so the shapes cost no extra draw calls.
  const LOW={sph:new THREE.SphereGeometry(0.5,12,9),cyl:new THREE.CylinderGeometry(0.5,0.5,1,10),cone:new THREE.ConeGeometry(0.5,1,10)};
  const part=(shape,sx,sy,sz,color,x=0,y=0,z=0)=>{const m=mk(shape,sx,sy,sz,color,x,y,z);if(LOW[shape])m.geometry=LOW[shape];return m;};
  // small round details (spots, bobbles, cheeks, back plates) on an even cheaper sphere
  const BIT=new THREE.SphereGeometry(0.5,9,6);
  const bit=(sx,sy,sz,color,x,y,z)=>{const m=part('sph',sx,sy,sz,color,x,y,z);m.geometry=BIT;return m;};
  // part() with a rotation
  const rot=(m,x=0,y=0,z=0)=>{m.rotation.set(x,y,z);return m;};
  const mesh=(geo,color,x,y,z)=>{const m=new THREE.Mesh(geo,M(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;};
  // a pair of googly eyes at ±x, looking +Z: big white ball, a black pupil that looks a bit off to the side, a shine dot
  function googly(g,x,y,z,s){
    for(const sd of [1,-1]){const ex=x*sd,px=sd>0?0.17:-0.06,py=sd>0?-0.12:0.13;
      g.add(part('sph',s,s,s*0.8,WHITE,ex,y,z),
        part('sph',s*0.52,s*0.52,s*0.3,INK,ex+px*s,y+py*s,z+s*0.33),
        part('sph',s*0.15,s*0.15,s*0.08,WHITE,ex+px*s+s*0.1,y+py*s+s*0.12,z+s*0.47));}}
  // four stubby legs, optional hooves/paws in another color
  function legs(g,x,zf,zb,h,w,col,foot,fh=0.08){
    for(const sx of [1,-1])for(const z of [zf,zb]){g.add(part('cyl',w,h,w,col,sx*x,h/2,z));
      if(foot)g.add(part('cyl',w*1.08,h*fh*2,w*1.08,foot,sx*x,h*fh,z));}}
  // bird feet: thin legs + flat paddles
  function birdFeet(g,x,h,col,s){for(const sx of [1,-1]){g.add(part('cyl',s*0.35,h,s*0.35,col,sx*x,h/2,0),part('box',s,s*0.2,s*1.2,col,sx*x,s*0.1,s*0.35));}}
  // cone pointing +Z by default (rx tilts it)
  const cone=(w,h,d,col,x,y,z,rx=PI/2)=>rot(part('cone',w,h,d,col,x,y,z),rx);
  // a big happy smile (lower half of a thin torus) facing +Z, plus pink cheeks
  function smile(g,y,z,w,cheekX,cheekY,cheekZ,cs){const m=mesh(new THREE.TorusGeometry(w,w*0.17,5,10,PI),INK,0,y,z);m.rotation.z=PI;g.add(m);
    for(const sd of [1,-1])g.add(bit(cs,cs*0.7,cs*0.5,PINK,sd*cheekX,cheekY,cheekZ));}
  // a smooth tapered tube through points [[y,z,r],…] down the middle (necks and tails), round joints between pieces
  function tube(g,pts,col){for(let i=0;i<pts.length-1;i++){const [y0,z0,r0]=pts[i],[y1,z1,r1]=pts[i+1],dy=y1-y0,dz=z1-z0;
      const m=mesh(new THREE.CylinderGeometry(r1,r0,Math.hypot(dy,dz),10,1,true),col,0,(y0+y1)/2,(z0+z1)/2);m.rotation.x=Math.atan2(dz,dy);g.add(m);
      if(i)g.add(part('sph',r0*2,r0*2,r0*2,col,0,y0,z0));}
    const [y,z,r]=pts[pts.length-1];g.add(part('sph',r*2,r*2,r*2,col,0,y,z));}

  return {
    chick:{fluff:'#ffe14d',build(){const g=new THREE.Group(),Y='#ffe14d';
      g.add(part('sph',0.32,0.3,0.34,Y,0,0.19,0),part('sph',0.25,0.25,0.25,Y,0,0.38,0.06));
      g.add(part('sph',0.06,0.08,0.06,Y,0,0.52,0.05),part('sph',0.05,0.07,0.05,Y,0.03,0.51,0.01),part('sph',0.05,0.07,0.05,Y,-0.03,0.51,0.09));
      g.add(rot(part('sph',0.06,0.13,0.17,Y,0.16,0.2,-0.01),0,0,0.35),rot(part('sph',0.06,0.13,0.17,Y,-0.16,0.2,-0.01),0,0,-0.35));
      g.add(cone(0.08,0.09,0.06,ORANGE,0,0.36,0.21));
      googly(g,0.065,0.42,0.15,0.12);birdFeet(g,0.06,0.06,ORANGE,0.07);g.scale.setScalar(1.12);return g;}}, // ×1.12 keeps it 'mini' like before

    chicken:{fluff:'#ffffff',build(){const g=new THREE.Group();
      g.add(part('sph',0.5,0.48,0.62,WHITE,0,0.42,-0.03),part('sph',0.42,0.42,0.4,WHITE,0,0.47,0.14),part('sph',0.34,0.34,0.34,WHITE,0,0.8,0.2));
      for(const [y,z,s] of [[0.98,0.13,0.1],[1.0,0.2,0.12],[0.97,0.27,0.1]])g.add(part('sph',s*0.7,s,s,RED,0,y,z));
      g.add(part('sph',0.06,0.11,0.06,RED,0,0.66,0.37),cone(0.1,0.13,0.08,ORANGE,0,0.77,0.41));
      for(const [x,rz] of [[0,0],[0.07,-0.35],[-0.07,0.35]])g.add(rot(part('sph',0.1,0.32,0.14,WHITE,x,0.64,-0.32),-0.5,0,rz));
      g.add(rot(part('sph',0.09,0.26,0.36,WHITE,0.25,0.44,-0.03),0,0,0.2),rot(part('sph',0.09,0.26,0.36,WHITE,-0.25,0.44,-0.03),0,0,-0.2));
      googly(g,0.085,0.84,0.31,0.15);birdFeet(g,0.1,0.2,ORANGE,0.11);return g;}},

    // not one of logic's kinds yet (needs a sound + a ZONE_HERDS entry), but ready for ctx.herd('rooster',…)
    rooster:{fluff:'#c1440e',build(){const g=new THREE.Group(),B='#c1440e',N='#f4a259',T='#0f766e';
      g.add(part('sph',0.52,0.5,0.64,B,0,0.45,-0.03),part('sph',0.44,0.46,0.42,N,0,0.55,0.15),part('sph',0.35,0.35,0.35,N,0,0.88,0.2));
      for(const [y,z,s] of [[1.08,0.1,0.12],[1.12,0.19,0.15],[1.1,0.28,0.13],[1.03,0.35,0.1]])g.add(part('sph',s*0.7,s,s,RED,0,y,z));
      g.add(part('sph',0.07,0.14,0.07,RED,0,0.72,0.38),cone(0.1,0.14,0.08,ORANGE,0,0.85,0.42));
      for(const [x,rz,h] of [[0,0,0.55],[0.08,-0.4,0.45],[-0.08,0.4,0.45]])g.add(rot(part('sph',0.11,h,0.15,T,x,0.8,-0.38),-0.55,0,rz));
      g.add(rot(part('sph',0.09,0.27,0.36,B,0.26,0.46,-0.03),0,0,0.2),rot(part('sph',0.09,0.27,0.36,B,-0.26,0.46,-0.03),0,0,-0.2));
      googly(g,0.09,0.93,0.32,0.15);birdFeet(g,0.1,0.22,ORANGE,0.11);return g;}},

    duck:{fluff:'#ffe14d',build(){const g=new THREE.Group(),Y='#ffe14d',Yd='#ffc300';
      g.add(part('sph',0.5,0.4,0.72,Y,0,0.3,0),cone(0.16,0.22,0.12,Y,0,0.44,-0.36,-0.93),part('sph',0.26,0.26,0.26,Y,0,0.5,0.2),part('sph',0.36,0.36,0.36,Y,0,0.64,0.22));
      g.add(part('sph',0.22,0.07,0.25,ORANGE,0,0.59,0.44));
      g.add(rot(part('sph',0.08,0.22,0.4,Yd,0.24,0.35,-0.03),0.15,0,0.15),rot(part('sph',0.08,0.22,0.4,Yd,-0.24,0.35,-0.03),0.15,0,-0.15));
      googly(g,0.08,0.7,0.34,0.15);birdFeet(g,0.1,0.12,ORANGE,0.13);return g;}},

    goose:{fluff:'#ffffff',build(){const g=new THREE.Group(),G='#f2f2f2',Gw='#cfd4da';
      g.add(part('sph',0.6,0.5,0.9,G,0,0.5,-0.05),cone(0.24,0.3,0.16,Gw,0,0.64,-0.48,-1.0));
      g.add(rot(part('cyl',0.17,0.52,0.17,G,0,0.88,0.31),0.3),part('sph',0.28,0.26,0.32,G,0,1.13,0.42));
      g.add(cone(0.12,0.2,0.09,ORANGE,0,1.09,0.63));
      g.add(rot(part('sph',0.1,0.3,0.62,Gw,0.3,0.54,-0.08),0.12,0,0.12),rot(part('sph',0.1,0.3,0.62,Gw,-0.3,0.54,-0.08),0.12,0,-0.12));
      googly(g,0.085,1.18,0.52,0.15);birdFeet(g,0.12,0.26,ORANGE,0.15);return g;}},

    bunny:{fluff:'#ffffff',build(){const g=new THREE.Group(),Wb='#f6f6f6';
      g.add(part('sph',0.44,0.42,0.5,Wb,0,0.25,-0.05),part('sph',0.37,0.34,0.34,Wb,0,0.5,0.17),part('sph',0.15,0.15,0.15,WHITE,0,0.3,-0.31));
      for(const sd of [1,-1]){g.add(rot(part('sph',0.11,0.38,0.07,Wb,sd*0.08,0.8,0.12),0,0,-sd*0.15),rot(part('sph',0.06,0.27,0.03,PINK,sd*0.083,0.8,0.15),0,0,-sd*0.15));
        g.add(part('sph',0.13,0.07,0.24,Wb,sd*0.13,0.035,-0.02),part('sph',0.09,0.09,0.11,Wb,sd*0.08,0.06,0.2));}
      g.add(part('sph',0.06,0.045,0.05,NOSE,0,0.49,0.35),part('box',0.06,0.05,0.02,WHITE,0,0.41,0.33));
      googly(g,0.08,0.56,0.3,0.13);g.scale.setScalar(0.9);return g;}}, // ×0.9 keeps it 'mini' (ears count toward height)

    cat:{fluff:'#f4a259',build(){const g=new THREE.Group(),O='#f4a259',Od='#d9822b';
      g.add(part('sph',0.42,0.38,0.72,O,0,0.36,-0.06),part('sph',0.46,0.42,0.4,O,0,0.63,0.3));
      for(const z of [-0.27,-0.1,0.07])g.add(part('sph',0.3,0.06,0.08,Od,0,0.545,z));
      for(const sd of [1,-1]){g.add(rot(part('pyr',0.15,0.2,0.09,O,sd*0.14,0.87,0.29),0,0,-sd*0.15),rot(part('pyr',0.08,0.11,0.03,PINK,sd*0.14,0.85,0.33),0,0,-sd*0.15));
        for(const k of [-1,1])g.add(rot(part('box',0.17,0.012,0.012,INK,sd*0.19,0.57+k*0.025,0.47),0,0,sd*k*0.15));}
      g.add(part('sph',0.22,0.13,0.1,WHITE,0,0.57,0.47),part('sph',0.06,0.045,0.04,NOSE,0,0.61,0.51));
      legs(g,0.11,0.18,-0.28,0.2,0.11,O);for(const sx of [1,-1])for(const z of [0.2,-0.26])g.add(part('sph',0.13,0.06,0.15,WHITE,sx*0.11,0.03,z));
      g.add(rot(part('cyl',0.11,0.32,0.11,O,0,0.5,-0.48),-0.7),rot(part('cyl',0.1,0.26,0.1,O,0,0.72,-0.58),0.15),part('sph',0.12,0.13,0.12,Od,0,0.86,-0.56));
      googly(g,0.1,0.68,0.44,0.17);return g;}},

    dog:{fluff:'#c68b59',build(){const g=new THREE.Group(),Br='#c68b59',Bd='#7f4f24',Cr='#f1d6b8';
      g.add(part('sph',0.55,0.5,0.85,Br,0,0.5,-0.08),part('sph',0.32,0.2,0.32,Bd,0.13,0.7,-0.22),part('sph',0.56,0.52,0.5,Br,0,0.88,0.36));
      g.add(part('sph',0.3,0.22,0.26,Cr,0,0.79,0.6),part('sph',0.13,0.09,0.08,INK,0,0.86,0.73),part('sph',0.1,0.16,0.05,NOSE,0,0.67,0.68));
      for(const sd of [1,-1])g.add(rot(part('sph',0.13,0.34,0.2,Bd,sd*0.29,0.82,0.34),0,0,sd*0.3));
      g.add(rot(part('cyl',0.38,0.08,0.38,RED,0,0.64,0.22),0.3),part('sph',0.08,0.08,0.04,GOLD,0,0.56,0.41));
      legs(g,0.16,0.22,-0.35,0.32,0.15,Br);for(const sx of [1,-1])for(const z of [0.25,-0.32])g.add(part('sph',0.18,0.08,0.22,Cr,sx*0.16,0.04,z));
      g.add(rot(part('cyl',0.11,0.36,0.11,Br,0,0.77,-0.53),-0.5),part('sph',0.13,0.13,0.13,Cr,0,0.93,-0.62));
      googly(g,0.12,0.97,0.57,0.19);return g;}},

    pig:{fluff:'#ffc6d9',build(){const g=new THREE.Group(),Pk='#ffadc6',Hf='#c9667f';
      g.add(part('sph',0.9,0.8,1.3,Pk,0,0.62,-0.05),part('sph',0.7,0.66,0.6,Pk,0,0.8,0.55));
      g.add(rot(part('cyl',0.32,0.16,0.26,NOSE,0,0.73,0.86),PI/2),part('sph',0.06,0.09,0.03,Hf,0.065,0.73,0.94),part('sph',0.06,0.09,0.03,Hf,-0.065,0.73,0.94));
      for(const sd of [1,-1])g.add(rot(part('pyr',0.22,0.26,0.07,Pk,sd*0.22,1.1,0.52),0.6,0,-sd*0.3));
      legs(g,0.24,0.3,-0.4,0.3,0.2,Pk,Hf,0.12);
      const tail=mesh(new THREE.TorusGeometry(0.07,0.025,6,14,PI*1.6),NOSE,0,0.8,-0.71);tail.rotation.y=PI/2;g.add(tail);
      googly(g,0.14,0.94,0.79,0.21);return g;}},

    sheep:{fluff:'#ffffff',build(){const g=new THREE.Group(),Dk='#3d3d3d';
      g.add(part('sph',0.95,0.8,1.25,WHITE,0,0.74,-0.05));
      for(const [x,y,z,s] of [[0.32,0.95,0.3,0.45],[-0.32,0.95,0.3,0.45],[0.38,0.8,-0.25,0.45],[-0.38,0.8,-0.25,0.45],[0,1.12,0.05,0.5],
        [0,1.08,-0.42,0.45],[0.25,0.6,0.38,0.38],[-0.25,0.6,0.38,0.38],[0,0.85,-0.58,0.4]])g.add(part('sph',s,s*0.9,s,WHITE,x,y,z));
      g.add(part('sph',0.42,0.48,0.46,Dk,0,0.96,0.65));
      for(const [x,z] of [[0,0.62],[0.09,0.58],[-0.09,0.58]])g.add(part('sph',0.2,0.18,0.2,WHITE,x,1.22,z));
      for(const sd of [1,-1])g.add(rot(part('sph',0.24,0.08,0.13,Dk,sd*0.27,0.99,0.6),0,0,sd*0.35));
      g.add(part('sph',0.12,0.06,0.04,PINK,0,0.84,0.87));
      legs(g,0.25,0.35,-0.4,0.4,0.12,Dk);
      googly(g,0.11,1.02,0.84,0.2);return g;}},

    goat:{fluff:'#e9e1d3',build(){const g=new THREE.Group(),Gt='#e9e1d3',Gb='#a0785a',Hn='#6d6875';
      g.add(part('sph',0.7,0.66,1.1,Gt,0,0.8,-0.05),part('sph',0.42,0.3,0.46,Gb,-0.13,1.0,-0.2));
      g.add(rot(part('cyl',0.3,0.42,0.3,Gt,0,1.07,0.42),0.5),part('sph',0.42,0.44,0.52,Gt,0,1.3,0.62));
      for(const sd of [1,-1]){g.add(rot(part('cone',0.09,0.34,0.09,Hn,sd*0.1,1.57,0.5),-0.65,0,-sd*0.12),rot(part('sph',0.25,0.08,0.12,Gt,sd*0.27,1.31,0.58),0,0,sd*0.45));}
      g.add(rot(part('cone',0.11,0.22,0.1,Gt,0,1.04,0.8),PI),part('sph',0.05,0.04,0.03,INK,0.06,1.2,0.88),part('sph',0.05,0.04,0.03,INK,-0.06,1.2,0.88));
      legs(g,0.22,0.38,-0.42,0.5,0.12,Gt,Hn);
      g.add(cone(0.1,0.22,0.08,Gt,0,1.08,-0.6,-0.5));
      googly(g,0.12,1.37,0.82,0.2);return g;}},

    cow:{fluff:'#ffffff',build(){const g=new THREE.Group(),Hn='#fff3b0';
      g.add(part('sph',1.25,1.1,2.0,WHITE,0,1.12,-0.1));
      for(const [x,y,z,a,b,c] of [[0.6,1.18,0.2,0.12,0.5,0.6],[-0.6,1.0,-0.5,0.12,0.55,0.7],[0.35,1.55,-0.55,0.5,0.12,0.5],[-0.55,1.35,0.4,0.12,0.35,0.4]])g.add(part('sph',a,b,c,INK,x,y,z));
      g.add(part('sph',0.85,0.8,0.75,WHITE,0,1.56,0.98),part('sph',0.45,0.18,0.3,INK,0.18,1.85,0.95));
      g.add(part('sph',0.72,0.42,0.4,PINK,0,1.33,1.3),part('sph',0.1,0.12,0.04,INK,0.15,1.36,1.5),part('sph',0.1,0.12,0.04,INK,-0.15,1.36,1.5));
      for(const sd of [1,-1]){g.add(rot(part('cone',0.12,0.3,0.12,Hn,sd*0.3,2.0,0.9),0,0,-sd*0.5),rot(part('sph',0.36,0.12,0.2,WHITE,sd*0.5,1.76,0.9),0,0,sd*0.3));}
      g.add(part('sph',0.42,0.26,0.42,PINK,0,0.6,-0.4),cone(0.24,0.26,0.24,GOLD,0,1.02,1.0,0),part('sph',0.08,0.08,0.08,GOLD,0,0.88,1.0));
      legs(g,0.38,0.6,-0.75,0.78,0.3,WHITE,INK);
      g.add(rot(part('cyl',0.06,0.7,0.06,WHITE,0,1.17,-1.14),0.18),part('sph',0.2,0.26,0.2,INK,0,0.82,-1.2));
      googly(g,0.19,1.7,1.28,0.3);return g;}},

    horse:{fluff:'#a0612f',build(){const g=new THREE.Group(),Hb='#a0612f',Hm='#3b2412',Hl='#d9a066';
      g.add(part('sph',1.0,1.0,2.0,Hb,0,1.45,-0.1));
      g.add(rot(part('cyl',0.55,1.1,0.65,Hb,0,2.1,0.72),0.6),rot(part('sph',0.6,0.6,0.95,Hb,0,2.6,1.12),0.35));
      g.add(part('sph',0.5,0.44,0.48,Hl,0,2.38,1.52),part('sph',0.07,0.1,0.04,INK,0.12,2.42,1.75),part('sph',0.07,0.1,0.04,INK,-0.12,2.42,1.75));
      g.add(rot(part('sph',0.16,0.05,0.65,WHITE,0,2.88,1.2),0.35));
      for(let i=0;i<5;i++){const t=i/4;g.add(part('sph',0.26,0.34,0.32,Hm,0,2.95-t*0.85,0.9-t*0.7));}
      g.add(part('sph',0.26,0.2,0.26,Hm,0,2.98,1.12));
      for(const sd of [1,-1])g.add(rot(part('cone',0.14,0.3,0.12,Hb,sd*0.18,3.05,0.95),-0.1,0,-sd*0.15));
      legs(g,0.3,0.68,-0.8,1.0,0.28,Hb,Hm,0.09);
      g.add(rot(part('sph',0.26,0.95,0.32,Hm,0,1.2,-1.2),0.3));
      googly(g,0.22,2.72,1.42,0.3);return g;}},
    // ---- Dino Valley babies (D14): chubby, pastel, huge eyes and big smiles. Goofy, never scary. ----
    // baby triceratops ~1.6 long (small): mint with a peach frill trimmed in pink bobbles, three soft cream horns
    trike:{fluff:'#9be7c4',build(){const g=new THREE.Group(),Mi='#9be7c4',Cr='#fff3d6',Pe='#ffb38a';
      g.add(part('sph',0.85,0.72,1.05,Mi,0,0.6,-0.1),part('sph',0.62,0.4,0.72,Cr,0,0.46,0.02));
      for(const [x,y,z,s] of [[0.22,0.9,-0.2,0.2],[-0.18,0.93,-0.38,0.16],[0.05,0.96,0.02,0.15]])g.add(bit(s,s*0.45,s,Pe,x,y,z));
      g.add(part('sph',0.7,0.62,0.66,Mi,0,0.78,0.5),part('sph',0.42,0.34,0.36,Mi,0,0.64,0.78));
      const a=1.1,fc=[1.02,0.28];g.add(rot(part('cyl',1.0,0.08,0.85,Pe,0,fc[0],fc[1]),a));  // frill, leaning back
      for(let i=0;i<=6;i++){const th=i/6*PI,lx=0.5*Math.cos(th),lz=-0.425*Math.sin(th);
        g.add(bit(0.17,0.17,0.12,NOSE,lx,fc[0]-lz*Math.sin(a),fc[1]+lz*Math.cos(a)));}
      for(const sd of [1,-1])g.add(rot(part('cone',0.11,0.3,0.11,Cr,sd*0.17,1.12,0.6),0.6,0,-sd*0.15));
      g.add(rot(part('cone',0.1,0.17,0.1,Cr,0,0.84,0.92),0.45));
      smile(g,0.6,0.955,0.1,0.25,0.68,0.74,0.13);
      legs(g,0.26,0.25,-0.38,0.3,0.24,Mi,Cr,0.12);
      g.add(cone(0.32,0.5,0.3,Mi,0,0.5,-0.78,-PI/2-0.3));
      googly(g,0.15,0.9,0.74,0.22);g.scale.setScalar(0.8);return g;}},

    // baby stegosaurus ~2 long (medium): lime with a row of round coral + lemon back plates and four soft tail bobbles
    stego:{fluff:'#b5e48c',build(){const g=new THREE.Group(),Li='#b5e48c',Cr='#fff3d6',Co='#ffb4a2',Le='#ffe66d';
      g.add(part('sph',1.0,0.9,1.5,Li,0,0.82,-0.05),part('sph',0.8,0.5,1.1,Cr,0,0.62,0.02));
      g.add(part('sph',0.5,0.5,0.5,Li,0,0.72,0.62),part('sph',0.64,0.58,0.62,Li,0,0.7,0.95));
      for(let i=0;i<7;i++){const t=i/6,z=0.5-t*1.15,s=0.22+0.16*Math.sin(t*PI),sd=i%2?1:-1,
        y=0.82+0.45*Math.sqrt(Math.max(0,1-((z+0.05)/0.76)**2));
        g.add(rot(bit(0.08,s*1.6,s*1.4,i%2?Co:Le,sd*0.08,y+s*0.45,z),0,0,-sd*0.18));}
      tube(g,[[0.85,-0.6,0.3],[0.9,-1.05,0.2],[0.86,-1.42,0.1]],Li);
      for(const sd of [1,-1])for(const z of [-1.2,-1.38])g.add(bit(0.11,0.11,0.11,Co,sd*0.16,0.92,z),rot(part('cyl',0.06,0.2,0.06,Cr,sd*0.1,0.85,z),0,0,-sd*0.9));
      smile(g,0.58,1.24,0.11,0.26,0.62,1.15,0.13);
      legs(g,0.3,0.38,-0.42,0.45,0.26,Li,Cr,0.1);
      googly(g,0.14,0.8,1.16,0.24);g.scale.setScalar(0.8);return g;}},

    // baby brontosaurus ~3 long (medium): lavender with a pale belly, a long bendy neck, tiny head, big smile
    bronto:{fluff:'#c3b1e1',build(){const g=new THREE.Group(),La='#c3b1e1',Pa='#f3e8ff',Sp='#9d8bd1';
      g.add(part('sph',1.3,1.15,1.6,La,0,1.15,-0.1),part('sph',1.0,0.7,1.2,Pa,0,0.88,0.05));
      for(const [x,y,z,s] of [[0.3,1.62,-0.2,0.3],[-0.25,1.6,-0.5,0.26],[0.05,1.7,0.2,0.22],[0.45,1.35,-0.6,0.22]])g.add(bit(s,s*0.4,s,Sp,x,y,z));
      tube(g,[[1.35,0.45,0.36],[2.05,0.82,0.25],[2.6,1.12,0.22]],La);
      g.add(part('sph',0.66,0.58,0.7,La,0,2.85,1.25),part('sph',0.5,0.4,0.46,La,0,2.72,1.52));
      smile(g,2.65,1.74,0.1,0.24,2.74,1.62,0.13);
      tube(g,[[1.1,-0.7,0.38],[0.85,-1.45,0.24],[0.45,-2.05,0.08]],La);
      legs(g,0.4,0.45,-0.55,0.72,0.36,La,Pa,0.1);
      googly(g,0.16,3.02,1.47,0.25);g.scale.setScalar(0.8);return g;}},
  };
})();
