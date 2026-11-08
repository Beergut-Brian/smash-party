/* Smash Party — DINO VALLEY themed zone (Z2). Owner: zone-dino agent (see agents/zone.md).
   Warm jungle: ferns, palms, boulders, speckled eggs and big friendly bones, stone huts, a stepped temple,
   a hedge T-rex and a smiling volcano. Goofy, never scary. Everything is block-built from mk()/M() shapes,
   so sleeping copies batch by shape with the color per instance.
   Every top-level name starts with `dino` / `DINO_` (all scripts share one global scope). */
const DINO_EGG=['#fff1c1','#caffbf','#a0c4ff','#ffc6ff','#ffd6a5'];
const DINO_SPOT=['#ff8fab','#4cc9f0','#80ed99','#ffbe0b','#9b5de5'];
const DINO_LEAF=['#38b000','#57cc99','#70e000','#2d9a4e'];
const DINO_STONE=['#b08968','#a39282','#c9b79c','#8d7b68'];
const DINO_GEM=['#ff9f1c','#4cc9f0','#c77dff','#80ffdb'];
const DINO_BONE='#fff4dc',DINO_WOOD='#8d5524',DINO_BARK='#6f4518',DINO_THATCH='#e9c46a',DINO_LAVA='#ff6d00',DINO_GLOW='#ffd60a',DINO_INK='#22223b';
// placement radius per prop (what ctx.place keeps clear)
const DINO_R={
  dino_eggling:.24,dino_sprout:.3,dino_bonelet:.32,dino_amber:.22,
  dino_fern:.9,dino_rock:.8,dino_shell:.55,
  dino_nest:.95,dino_stump:.7,dino_flower:.6,
  dino_egg:.85,dino_cycad:1.1,dino_bone:1.6,dino_crystal:.95,
  dino_boulder:1.6,dino_hatch:1.3,dino_log:2.1,dino_toadstool:1.7,
  dino_palm:1.3,dino_hut:2.9,dino_ribcage:3.2,dino_treefern:1.4,
  dino_lodge:4.7,dino_bigbones:5.6,dino_bignest:4.8,
  dino_volcano:10.6,dino_temple:7.4,dino_rex:5.2
};
// mk() plus a rotation (order YXZ: turn around Y first, then tip around X, then Z)
function dinoM(shape,sx,sy,sz,c,x,y,z,rx=0,ry=0,rz=0){const m=mk(shape,sx,sy,sz,c,x,y,z);if(rx||ry||rz){m.rotation.order='YXZ';m.rotation.set(rx,ry,rz);}return m;}
// a ring of n flat leaves from (x,y,z): tilt > 0 droops, tilt < 0 points up
function dinoLeaves(P,n,x,y,z,L,W,tilt,cols,a0=0,whole=true){
  for(let i=0;i<n;i++){const a=a0+i/n*Math.PI*2,c=Math.cos(tilt)*L/2;
    P(dinoM('box',W,Math.max(.05,W*.14),L,cols[i%cols.length],x+Math.sin(a)*c,y-Math.sin(tilt)*L/2,z+Math.cos(a)*c,tilt,a),1,whole,L*.3);}}
const dinoFlat=m=>{m.castShadow=false;return m;}; // tiny details skip the shadow pass (half the draw calls while awake)
// n colored spots on an egg-shaped ellipsoid centered at (x,y,z) with radii a (sideways) and b (up)
function dinoSpots(P,x,y,z,a,b,n,s,col){
  for(let i=0;i<n;i++){const th=i*2.39+.6,ph=-.5+(i%3)*.45;
    P(dinoFlat(mk('sph',s,s*.7,s,col,x+a*Math.cos(ph)*Math.sin(th)*.96,y+b*Math.sin(ph)*.96,z+a*Math.cos(ph)*Math.cos(th)*.96)),1,true,s*.4);}}
// a cartoon bone along X: shaft + two knobs at each end
function dinoBone(P,len,d,y,c=DINO_BONE,chunks=2){
  P(mk('wheel',len,d,d,c,0,y,0),chunks);
  for(const sx of [-1,1])for(const sz of [-1,1])P(mk('sph',d*1.25,d*1.25,d*1.25,c,sx*len/2,y,sz*d*.42),1,true,d*.5);}
// big round googly eyes (white + dark pupil), looking along +Z
function dinoEyes(P,x,y,z,s,floor){for(const sx of [-1,1]){
  const w=dinoFlat(mk('sph',s,s,s*.7,'#ffffff',sx*x,y,z)),p=dinoFlat(mk('sph',s*.48,s*.48,s*.3,DINO_INK,sx*x,y-s*.06,z+s*.3));
  P(floor==null?w:BP(w,floor,'extra'),1,true,s*.4);P(floor==null?p:BP(p,floor,'extra'),1,true,s*.2);}}
// a little egg sitting at (x,0,z), with spots
function dinoEggAt(P,x,z,w,h,y0=0,spots=3){const c=pick(DINO_EGG);P(mk('sph',w,h,w,c,x,y0+h/2,z),3,false,h*.4);
  if(spots)dinoSpots(P,x,y0+h/2,z,w/2,h/2,spots,w*.22,pick(DINO_SPOT));}

const DINO_PROPS={
  /* ---- micro ---- */
  dino_eggling:(x,z)=>sized(x,z,DINO_R.dino_eggling,.36,1,'micro',P=>{
    const c=pick(DINO_EGG);P(mk('sph',.26,.34,.26,c,0,.17,0),1,true,.12);
    P(mk('sph',.07,.05,.07,pick(DINO_SPOT),.1,.22,.06),1);P(mk('sph',.06,.05,.06,pick(DINO_SPOT),-.08,.12,.09),1);}),
  dino_sprout:(x,z)=>sized(x,z,DINO_R.dino_sprout,.45,1,'micro',P=>{
    P(mk('sph',.16,.1,.16,'#6f4518',0,.04,0),1);dinoLeaves(P,4,0,.08,0,.42,.1,-.9,DINO_LEAF,Math.random());}),
  dino_bonelet:(x,z,arg)=>sized(x,z,DINO_R.dino_bonelet,.2,1,'micro',(P,g)=>{dinoBone(P,.42,.1,.07,DINO_BONE,1);face(g,arg);}),
  dino_amber:(x,z)=>sized(x,z,DINO_R.dino_amber,.34,1,'micro',P=>{const c=pick(DINO_GEM);
    P(mk('pyr',.26,.2,.26,c,0,.24,0),1,true,.1);P(dinoM('pyr',.26,.16,.26,c,0,.08,0,Math.PI),1,true,.1);}),
  /* ---- mini ---- */
  dino_fern:(x,z)=>sized(x,z,DINO_R.dino_fern,1.1,1,'mini',P=>{
    P(mk('sph',.35,.25,.35,'#2d6a4f',0,.1,0),1);dinoLeaves(P,6,0,.12,0,1.15,.32,-.75,DINO_LEAF,Math.random());}),
  dino_rock:(x,z)=>sized(x,z,DINO_R.dino_rock,.8,1,'mini',P=>{const c=pick(DINO_STONE);
    P(mk('sph',1.3,.8,1.1,c,0,.35,0),2);P(mk('sph',.6,.5,.6,c,.45,.55,.2),1,true,.25);
    if(Math.random()<.5)P(mk('sph',.4,.2,.4,'#70e000',-.2,.72,-.1),1,true,.15);}), // a moss cap
  dino_shell:(x,z,arg)=>sized(x,z,DINO_R.dino_shell,.95,1,'mini',(P,g)=>{ // a curly ammonite shell, standing up
    const c=pick(['#f4a261','#e9c46a','#ffafcc']);
    P(dinoM('wheel',.32,.95,.95,c,0,.48,0,0,Math.PI/2),1,true,.4);
    P(dinoM('wheel',.36,.62,.62,'#fff1c1',0,.56,.05,0,Math.PI/2),1,true,.25);
    P(dinoM('wheel',.4,.3,.3,c,0,.62,.08,0,Math.PI/2),1);face(g,arg);}),
  /* ---- tiny ---- */
  dino_nest:(x,z)=>sized(x,z,DINO_R.dino_nest,1,1,'tiny',P=>{
    P(mk('cyl',1.7,.5,1.7,'#a0703c',0,.25,0),2);P(mk('cyl',1.25,.08,1.25,'#6f4518',0,.5,0),1);
    for(let i=0;i<3;i++){const a=i*2.1;dinoEggAt(P,Math.sin(a)*.32,Math.cos(a)*.32,.42,.52,.4,1);}}),
  dino_stump:(x,z)=>sized(x,z,DINO_R.dino_stump,.9,1,'tiny',P=>{
    P(mk('cyl',1,.8,1,DINO_WOOD,0,.4,0),3);P(mk('cyl',.92,.06,.92,'#deb887',0,.82,0),1);
    P(mk('cyl',.1,.22,.1,'#fff',.25,.95,.1),1);P(mk('sph',.34,.2,.34,pick(['#e63946','#ff006e']),.25,1.08,.1),1,true,.15);}),
  dino_flower:(x,z)=>sized(x,z,DINO_R.dino_flower,1.4,1,'tiny',P=>{
    const c=pick(['#ff006e','#ffbe0b','#c77dff','#ff7b00']);
    P(mk('cyl',.12,1.1,.12,'#2d9a4e',0,.55,0),1);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;P(mk('sph',.42,.14,.42,c,Math.sin(a)*.26,1.15,Math.cos(a)*.26),1,true,.15);}
    P(mk('sph',.26,.2,.26,'#ffd60a',0,1.2,0),1,true,.1);dinoLeaves(P,2,0,.35,0,.5,.2,-.4,DINO_LEAF,.4);}),
  /* ---- small ---- */
  dino_egg:(x,z)=>sized(x,z,DINO_R.dino_egg,1.9,2,'small',P=>{
    const c=pick(DINO_EGG);P(mk('sph',1.45,1.9,1.45,c,0,.95,0),5,false,.8);dinoSpots(P,0,.95,0,.72,.95,6,.38,pick(DINO_SPOT));}),
  dino_cycad:(x,z)=>sized(x,z,DINO_R.dino_cycad,2.6,2,'small',P=>{
    for(let i=0;i<3;i++)P(mk('cyl',.7-i*.08,.5,.7-i*.08,i%2?'#a0703c':DINO_WOOD,0,.25+i*.5,0),1);
    dinoLeaves(P,7,0,1.5,0,1.7,.4,.15,DINO_LEAF,Math.random());}),
  dino_bone:(x,z,arg)=>sized(x,z,DINO_R.dino_bone,.8,2,'small',(P,g)=>{dinoBone(P,2.4,.5,.3);face(g,arg);}),
  dino_crystal:(x,z)=>sized(x,z,DINO_R.dino_crystal,2.1,2,'small',P=>{const c=pick(DINO_GEM);
    P(mk('pyr',.7,2.1,.7,c,0,1.05,0),2,false,.6);
    P(dinoM('pyr',.5,1.3,.5,c,.5,.55,.2,0,0,-.35),1,true,.4);P(dinoM('pyr',.45,1.1,.45,pick(DINO_GEM),-.45,.45,-.15,.3,0,.3),1,true,.35);}),
  /* ---- medium ---- */
  dino_boulder:(x,z)=>sized(x,z,DINO_R.dino_boulder,2.4,5,'medium',P=>{const c=pick(DINO_STONE);
    P(mk('sph',3,2,2.6,c,0,.9,0),5);P(mk('sph',1.7,1.4,1.6,c,.5,2,.2),2);P(mk('sph',1,.8,1,c,-1,1.5,.6),1,true,.4);
    P(mk('sph',1.2,.4,1.1,'#70e000',.3,2.6,.1),1,true,.3);}),
  dino_hatch:(x,z,arg)=>sized(x,z,DINO_R.dino_hatch,3.2,6,'medium',(P,g)=>{ // a baby dino peeking out of its egg
    const c=pick(DINO_EGG),skin=pick(['#80ed99','#4cc9f0','#ffafcc','#ffd166']);
    P(mk('sph',2.5,2.4,2.5,c,0,1.1,0),5,false,.9);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;P(mk('pyr',.5,.55,.5,c,Math.sin(a)*1.02,2.18,Math.cos(a)*1.02),1,true,.25);} // cracked rim
    P(mk('sph',1.5,1.4,1.6,skin,0,2.75,.1),2,false,.6);P(mk('sph',.9,.6,.9,skin,0,2.6,.75),1,true,.35); // head + snout
    dinoEyes(P,.36,3.05,.62,.5);
    P(mk('sph',.1,.1,.1,DINO_INK,-.18,2.68,1.2),1);P(mk('sph',.1,.1,.1,DINO_INK,.18,2.68,1.2),1);       // nostrils
    P(dinoM('sph',1.6,.8,1.6,c,.1,3.6,-.1,.35,0,.25),1,true,.4);                                        // shell hat
    for(const sx of [-1,1])P(mk('sph',.35,.25,.35,skin,sx*.85,2.15,.6),1,true,.15);face(g,arg);}),     // little hands on the rim
  dino_log:(x,z,arg)=>sized(x,z,DINO_R.dino_log,1.6,4,'medium',(P,g)=>{
    P(mk('wheel',4,1.4,1.4,DINO_BARK,0,.7,0),5);for(const sx of [-1,1])P(mk('wheel',.06,1.2,1.2,'#deb887',sx*2.01,.7,0),1);
    P(mk('sph',1.6,.4,1,'#57cc99',-.5,1.4,0),1,true,.3);P(mk('cyl',.12,.3,.12,'#fff',1,1.5,.2),1);
    P(mk('sph',.4,.22,.4,'#ff006e',1,1.68,.2),1,true,.15);face(g,arg);}),
  dino_toadstool:(x,z)=>sized(x,z,DINO_R.dino_toadstool,3.1,5,'medium',P=>{
    const c=pick(['#e63946','#ff006e','#9b5de5','#ff7b00']);
    P(mk('cyl',.9,2,.9,'#fff8e7',0,1,0),2);P(mk('sph',3.3,1.6,3.3,c,0,2.3,0),4,false,.8);
    for(let i=0;i<5;i++){const a=i*1.26;P(mk('sph',.5,.2,.5,'#ffffff',Math.sin(a)*1.05,2.85,Math.cos(a)*1.05),1,true,.2);}}),
  /* ---- large ---- */
  dino_palm:(x,z,arg)=>sized(x,z,DINO_R.dino_palm,8,8,'large',(P,g)=>{
    let px=0,py=0;for(let i=0;i<5;i++){const t=mk('cyl',.75-i*.06,1.45,.75-i*.06,i%2?'#a0703c':DINO_WOOD,px,py+.72,0);t.rotation.z=-i*.07;P(t,2);px+=i*.12;py+=1.4;}
    const cols=['#38b000','#57cc99','#2d9a4e'];dinoLeaves(P,7,px,py+.2,0,3.4,.8,.35,cols,Math.random());
    for(let i=0;i<3;i++){const a=i*2.1;P(mk('sph',.5,.5,.5,'#7f4f24',px+Math.sin(a)*.4,py-.15,Math.cos(a)*.4),1,true,.25);}face(g,arg);}),
  dino_treefern:(x,z)=>sized(x,z,DINO_R.dino_treefern,7,8,'large',P=>{
    P(mk('cyl',.6,5.2,.6,DINO_BARK,0,2.6,0),4);P(mk('sph',.9,.6,.9,'#2d6a4f',0,5.3,0),1);
    dinoLeaves(P,8,0,5.4,0,3,.7,.05,['#70e000','#38b000'],Math.random());dinoLeaves(P,5,0,5.7,0,1.8,.5,-.5,['#80ed99'],.3);}),
  dino_hut:(x,z,arg)=>sized(x,z,DINO_R.dino_hut,5.2,9,'large',(P,g)=>{ // round stone hut, thatch roof (BP)
    const st=pick(DINO_STONE),R=2.05;
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;P(BP(dinoM('box',1.85,2.3,.55,i%2?st:'#c9b79c',Math.sin(a)*R,1.15,Math.cos(a)*R,0,a),0,'wall'),2);}
    P(BP(mk('cyl',4.4,.3,4.4,'#deb887',0,2.4,0),0,'slab'),2);
    P(BP(mk('cone',5.6,2.6,5.6,DINO_THATCH,0,3.85,0),1,'roof'),4);
    P(BP(mk('box',1.1,1.6,.2,DINO_INK,0,.8,R+.32),0,'extra'),1,true,.4);                       // doorway
    const b=mk('wheel',1.7,.22,.22,DINO_BONE,0,1.8,R+.4);P(BP(b,0,'extra'),1,true,.5);         // bone over the door
    P(BP(mk('sph',.55,.55,.55,'#70e000',0,5.2,0),1,'extra'),1,true,.25);face(g,arg);
  },{building:true}),
  dino_ribcage:(x,z,arg)=>sized(x,z,DINO_R.dino_ribcage,4.6,8,'large',(P,g)=>{ // friendly old bones, a dig site favourite
    P(mk('box',.6,.6,6.4,DINO_BONE,0,4.1,0),3);
    for(let i=0;i<5;i++){const zz=-2.4+i*1.2,h=4.1-Math.abs(i-2)*.25;
      for(const sx of [-1,1]){P(dinoM('box',.32,h*1.12,.32,DINO_BONE,sx*1.25,h/2,zz,0,0,sx*.55),1,true,1);P(mk('sph',.5,.5,.5,DINO_BONE,sx*2.5,.25,zz),1);}}
    P(mk('sph',1.6,1.3,1.9,DINO_BONE,0,3.7,4),2);dinoEyes(P,.4,3.9,4.85,.45);face(g,arg);}),
  /* ---- huge ---- */
  dino_lodge:(x,z,arg)=>sized(x,z,DINO_R.dino_lodge,9.2,18,'huge',(P,g)=>{ // two-storey stone + timber lodge (BP)
    story(P,7,5.6,3,0,0,pick(DINO_STONE),2);slab(P,6.8,5.4,3.05,0,'#deb887');
    story(P,6,4.8,2.6,3.1,1,'#c68b59',2);roofOf(P,8.2,6.8,2.8,7.1,2,DINO_THATCH);
    P(BP(mk('box',1.3,2,.2,DINO_INK,0,1,2.9),0,'extra'),1,true,.5);
    for(const sx of [-1,1]){P(BP(mk('box',.9,.9,.16,'#a0e7ff',sx*2,1.7,2.88),0,'extra'),1,true,.3);}
    P(BP(mk('wheel',3,.35,.35,DINO_BONE,0,2.35,3.05),0,'extra'),1,true,.8);                      // big bone sign
    P(BP(mk('box',7.6,.2,1.3,'#57cc99',0,3.2,3.2),1,'extra'),1,true,.6);                         // leafy awning
    P(BP(mk('sph',.8,.8,.8,'#70e000',0,8.7,0),2,'extra'),1,true,.3);face(g,arg);
  },{building:true}),
  dino_bigbones:(x,z,arg)=>sized(x,z,DINO_R.dino_bigbones,11,16,'huge',(P,g)=>{ // a long-neck skeleton with a grin
    for(const sx of [-1,1])for(const sz of [-1.6,1.6])P(mk('cyl',.75,3.7,.75,DINO_BONE,sx*1.3,1.85,sz),2);
    for(let i=0;i<4;i++)P(mk('box',1,.9,1.1,DINO_BONE,0,4.1+Math.sin(i/3*Math.PI)*.4,-1.8+i*1.2),2);
    for(let i=0;i<2;i++)for(const sx of [-1,1])P(dinoM('box',.3,2.4,.3,DINO_BONE,sx*1.05,3.3,-.7+i*1.4,0,0,sx*.45),1,true,.6);
    for(let i=0;i<3;i++)P(dinoM('box',.7-i*.08,2.2,.7-i*.08,DINO_BONE,0,5.4+i*1.75,2.8+i*.9,.48),1,true,.6);       // neck up and forward
    P(mk('sph',1.5,1.1,2,DINO_BONE,0,10.3,5.6),2);dinoEyes(P,.42,10.55,6.2,.48);
    P(mk('box',.9,.12,.12,DINO_INK,0,9.95,6.55),1);                                                         // the grin
    for(let i=0;i<3;i++)P(dinoM('box',.6-i*.12,.6-i*.12,1.8,DINO_BONE,0,3.7-i*1,-3.1-i*1.6,-.55),1,true,.5);face(g,arg);}), // tail down to the ground
  dino_bignest:(x,z)=>sized(x,z,DINO_R.dino_bignest,4.4,16,'huge',P=>{ // giant nest with giant eggs (and one hatchling)
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;P(dinoM('wheel',3.6,.9,.9,i%2?DINO_WOOD:'#a0703c',Math.sin(a)*3.8,.5+(i%2)*.55,Math.cos(a)*3.8,0,a),2);}
    P(mk('cyl',6.8,.3,6.8,'#deb887',0,.2,0),3);
    dinoEggAt(P,-1.3,-.6,2.2,3,.2,2);dinoEggAt(P,1.4,-.9,2,2.7,.2,2);
    const skin=pick(['#80ed99','#ffafcc']);P(mk('sph',1.7,1.6,1.8,skin,.2,1.2,1.6),2);dinoEyes(P,.38,1.55,2.35,.5);
    P(dinoM('sph',1.4,.6,1.4,pick(DINO_EGG),.2,2.15,1.5,.3),1,true,.4);}),
  /* ---- mega ---- */
  dino_volcano:(x,z,arg)=>sized(x,z,DINO_R.dino_volcano,14,60,'mega',(P,g)=>{ // a smiling volcano (BP: 3 rings of rock + crater)
    const R=[9.6,7.1,4.7],H=[4.2,4,3.6],lean=.28,cols=['#8d7b68','#a39282','#7f6a59'];let y=0;
    for(let f=0;f<3;f++){const w=2*R[f]*Math.tan(Math.PI/6)*1.2;
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(BP(dinoM('box',w,H[f],2.4,cols[(i+f)%3],Math.sin(a)*R[f],y+H[f]/2,Math.cos(a)*R[f],-lean,a),f,'wall'),3);}
      P(BP(mk('cyl',R[f]*1.8,.5,R[f]*1.8,cols[f],0,y+H[f]-.25,0),f,'slab'),3);y+=H[f];}
    P(BP(mk('cyl',6.6,.5,6.6,DINO_LAVA,0,y+.05,0),3,'roof'),4);
    P(BP(mk('sph',2.4,1.2,2.4,DINO_GLOW,0,y+.4,0),3,'extra'),1,true,.8);
    for(let i=0;i<1;i++){const a=i*2.1+.5;P(BP(mk('sph',1,.9,1,DINO_LAVA,Math.sin(a)*1.8,y+.5,Math.cos(a)*1.8),3,'extra'),1,true,.4);}
    for(let i=0;i<2;i++)P(BP(mk('sph',2.4-i*.4,2-i*.3,2.4-i*.4,'#ffffff',i*.6-.4,y+2.4+i*1.9,-i*.5),3,'extra'),1,true,1);   // puffy smoke
    for(const a of [1.05,4.2])P(BP(dinoM('box',1,.3,3.6,DINO_LAVA,Math.sin(a)*5.5,9.9,Math.cos(a)*5.5,-.75,a),2,'extra'),1,true,.6); // lava drips
    dinoEyes(P,2.3,2.7,10.45,1.5,0);                                                                       // the happy face
    for(let i=0;i<3;i++){const t=i-1;P(BP(dinoFlat(dinoM('box',1.9,.4,.3,DINO_INK,t*1.75,1.35+Math.abs(t)*.35,11.1,0,0,t*.35)),0,'extra'),1,true,.5);} // the smile
    face(g,arg);
  },{building:true}),
  dino_temple:(x,z,arg)=>sized(x,z,DINO_R.dino_temple,13,50,'mega',(P,g)=>{ // stepped jungle temple (BP)
    const W=[12.4,9.6,7,4.4],cols=['#c9b79c','#b08968','#c9b79c','#a39282'];let y=0;
    for(let f=0;f<4;f++){story(P,W[f],W[f],2.6,y,f,cols[f],1);slab(P,W[f]+.3,W[f]+.3,y+2.7,f,cols[f]);
      if(f%2==0)P(BP(mk('box',W[f]*.5,.9,.2,'#57cc99',W[f]*.12,y+2.2,W[f]/2+.45),f,'extra'),1,true,.5);   // vines over each step
      y+=2.85;}
    for(let i=0;i<3;i++)P(BP(mk('box',2.6,.9,1.4,'#deb887',0,.45+i*.9,7.1-i*1.1),0,'extra'),1,true,.5); // front steps
    P(BP(mk('box',3,2.4,3,'#ffbe0b',0,y+1.2,0),4,'wall'),3);roofOf(P,4.6,4.6,2.2,y+3.5,5,'#2a9d8f');
    P(BP(mk('sph',1,1,1,'#4cc9f0',0,y+5,0),5,'extra'),1,true,.5);face(g,arg);                     // a big shiny gem on top
  },{building:true}),
  dino_rex:(x,z,arg)=>sized(x,z,DINO_R.dino_rex,12.5,45,'mega',(P,g)=>{ // a goofy hedge T-rex topiary on a plinth
    const hedge='#38b000',dark='#2d9a4e';
    P(mk('box',6.4,1,10,pick(DINO_STONE),0,.5,0),4);
    for(const sx of [-1,1]){P(mk('cyl',1.6,4.2,1.6,dark,sx*1.5,3,-.5),3);P(mk('sph',2.2,.9,2.8,dark,sx*1.5,1.3,.1),1,true,.5);}
    P(mk('sph',5,4.8,7,hedge,0,6.6,-.6),8,false,1.6);
    for(let i=0;i<3;i++)P(mk('sph',3-i*.8,2.6-i*.7,3.2-i*.6,i%2?dark:hedge,0,5.6-i*.9,-4.3-i*2.2),2,false,.8); // tail
    P(dinoM('box',2.2,3.2,2.4,hedge,0,9.4,2.2,.35),3);                                                    // neck
    P(mk('box',3.2,2.6,4.2,hedge,0,11.1,3.6),4,false,1.1);P(mk('box',2.8,.9,1.8,dark,0,10.1,5),2);         // head + chin
    dinoEyes(P,.95,12.2,5.4,.9);
    P(mk('box',2.2,.25,.2,'#ff006e',0,10.55,5.75),1,true,.4);                                              // big silly smile
    for(const sx of [-1,1])P(dinoM('box',.5,.5,1.4,dark,sx*2.1,7.6,2.4,.6),1,true,.5);                     // tiny arms
    for(let i=0;i<3;i++)P(mk('sph',1,1,1,['#ff006e','#ffbe0b','#c77dff'][i],0,9.1-i*.7,-1.2-i*1.9),1,true,.4); // flower "spikes"
    face(g,arg);})
};

/* Per-prop smash sounds (L22: an object's sfx overrides the zone's crash sound; a missing clip falls back to the zone's,
   then the default). Clip prompts are in TASKS.md (AU5) for the audio agent. */
const DINO_SFX={
  dino_eggling:'dino_egg',dino_egg:'dino_egg',dino_nest:'dino_egg',dino_bignest:'dino_egg',dino_hatch:'dino_hatch',
  dino_bonelet:'dino_bone',dino_bone:'dino_bone',dino_ribcage:'dino_bone',dino_bigbones:'dino_bone',
  dino_sprout:'dino_leafy',dino_fern:'dino_leafy',dino_flower:'dino_leafy',dino_cycad:'dino_leafy',dino_palm:'dino_leafy',dino_treefern:'dino_leafy',dino_rex:'dino_leafy',
  dino_rock:'dino_rock',dino_boulder:'dino_rock',dino_shell:'dino_rock',dino_temple:'dino_rock',
  dino_amber:'dino_crystal',dino_crystal:'dino_crystal',
  dino_stump:'dino_wood',dino_log:'dino_wood',dino_hut:'dino_wood',dino_lodge:'dino_wood',
  dino_toadstool:'dino_boing',dino_volcano:'dino_volcano'
};
// wrap each listed prop so it carries its own crash sound (the sub-zone files use this too)
function dinoWithSfx(props,map){for(const k in map){const f=props[k];if(f)props[k]=(x,z,arg)=>{const o=f(x,z,arg);o.sfx=map[k];return o;};}return props;}
dinoWithSfx(DINO_PROPS,DINO_SFX);

/* Landmarks: the set pieces go to fixed chunks of the dino blob(s). The volcano takes the chunk with the most dino
   neighbours (the heart of the valley); the rest are spread by a hash, so a world always rebuilds the same. */
/* Landmarks: the set pieces go to fixed chunks of a zone's blob(s). The heart piece takes the chunk with the most
   neighbours of the same zone; the rest are spread by a hash, so a world always rebuilds the same. Every Dino Land
   sub-zone uses this with its own list: dinoMarks(id, heart, [kinds…]).get(ci+','+cj). */
const DINO_LMS={};
function dinoHash(i,j,s){let h=Math.imul(i+73,0x9e3779b1)^Math.imul(j-41,0x85ebca6b)^Math.imul(s,0xc2b2ae35);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>13;return (h>>>0)/4294967296;}
function dinoMarks(id,heart,kinds){
  if(typeof dinoLandMarks==='function'){const m=dinoLandMarks(id);if(m)return m;} // Adventure Dino Land: fixed chunks
  const rows=zoneRows,c=DINO_LMS[id]||(DINO_LMS[id]={rows:null,map:null});if(c.rows===rows)return c.map;c.rows=rows;const map=c.map=new Map();
  const L=ZONES[id]&&ZONES[id].letter,list=[],is=(i,j)=>!!(rows[j]&&rows[j][i]===L);
  rows.forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]===L){let n=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(is(i+di,j+dj))n++;list.push({i,j,n,h:dinoHash(i,j,7)});}});
  if(!list.length)return map;
  const key=c=>(c.i-CHUNKS_HALF)+','+(c.j-CHUNKS_HALF);
  if(heart){list.sort((a,b)=>b.n-a.n||a.h-b.h);map.set(key(list.shift()),heart);}
  list.sort((a,b)=>a.h-b.h);kinds.forEach((k,n)=>{const c=list[n];if(c)map.set(key(c),k);});
  return map;}
// is this zone letter anywhere on today's map? (the jungle leaves the volcano to Volcano Peak when it's there)
const dinoOnMap=id=>{const L=ZONES[id]&&ZONES[id].letter;return !!L&&zoneRows.some(r=>r.includes(L));};
function dinoLandmarks(){const v=dinoOnMap('dino_volcano');
  return dinoMarks('dino',v?'temple':'volcano',v?['rex','village','bones','nest','village','dig','eggs']:['temple','rex','village','bones','nest','village','dig']);}
const dinoPut=(ctx,type,x,z,arg)=>ctx.place(type,x,z,arg,DINO_R[type]||1.2);
// try a few spots (center first, then the quadrants, which dodge the roads through even chunks)
function dinoDrop(ctx,type,arg){const r=DINO_R[type]||2,m=r+4;
  for(const [x,z] of [[ctx.cx,ctx.cz],[ctx.cx+20,ctx.cz+20],[ctx.cx-20,ctx.cz+20],[ctx.cx+20,ctx.cz-20],[ctx.cx-20,ctx.cz-20],[ctx.x0+m,ctx.z0+m],[ctx.x1-m,ctx.z1-m]])
    if(ctx.place(type,x,z,arg,r))return {x,z};return null;}
function dinoRing(ctx,x,z,rad,n,type,a0=.3){for(let i=0;i<n;i++){const a=a0+i/n*Math.PI*2;dinoPut(ctx,type,x+Math.cos(a)*rad,z+Math.sin(a)*rad,i%4);}}
function dinoScatter(ctx,n,types,pad=5){for(let i=0;i<n;i++)dinoPut(ctx,pick(types),rand(ctx.x0+pad,ctx.x1-pad),rand(ctx.z0+pad,ctx.z1-pad),Math.random()*4|0);}
// dino herds (A5: babyrex + ptero too); chicks and ducks stand in if a kind is missing
const DINO_HERD_KINDS=['trike','stego','bronto','babyrex','ptero'];
function dinoHerd(ctx,x,z,n){for(const k of [...DINO_HERD_KINDS].sort(()=>Math.random()-.5))if(ctx.herd(k,x,z,n))return true;return ctx.herd(pick(['chick','duck']),x,z,n+1);}
function dinoJungle(ctx,dense){ // the wild-jungle filler every dino chunk gets some of
  dinoScatter(ctx,dense?5:3,['dino_palm','dino_palm','dino_treefern']);
  dinoScatter(ctx,dense?4:2,['dino_cycad','dino_boulder','dino_egg','dino_crystal','dino_toadstool']);
  dinoScatter(ctx,dense?5:3,['dino_fern','dino_fern','dino_rock','dino_nest','dino_flower','dino_stump','dino_bone']);
  dinoScatter(ctx,dense?6:4,['dino_eggling','dino_sprout','dino_bonelet','dino_amber','dino_shell']);}

/* Jungle scenes (L31): little stories the layouts place and the filler drops around the cars at their size. */
const DINO_SCENES={
  // an egg hunt: a nest in a clearing, eggs hiding under the ferns and flowers all around it
  dino_egg_hunt:{size:'tiny',r:6,build(s){s.spot('dino_clearing',0,0,10,10);s.place('dino_nest',0,0);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.4;s.place(i%2?'dino_fern':'dino_flower',Math.sin(a)*3.4,Math.cos(a)*3.4,null,0,i%2?1.65:1);
      s.place('dino_eggling',Math.sin(a+.25)*3.9,Math.cos(a+.25)*3.9);}
    s.place('dino_stump',3.8,-3.6);s.place('dino_sprout',-4.2,-3.4);s.herd('babyrex',0,-5,2);}},
  // a hatching party: baby dinos peeking out of their eggs around a big egg "cake", with toadstool stools
  dino_hatch_party:{size:'medium',r:10,build(s){s.spot('dino_clearing',0,0,18,18);s.place('dino_egg',0,0,null,0,1.65);
    for(let i=0;i<3;i++){const a=-1+i;s.place('dino_hatch',Math.sin(a)*5.4,-Math.cos(a)*5.4,null,a+Math.PI);}
    for(const [x,z] of [[-6,4],[6,4],[0,6.5]])s.place('dino_toadstool',x,z,null,0,.6);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;s.place('dino_flower',Math.sin(a)*8,Math.cos(a)*8,null,0,2.7);}}},
  // a jungle gym: logs to hop, bouncy toadstools and a ramp
  dino_jungle_gym:{size:'medium',r:12,build(s){s.spot('dino_trail',0,0,6,22);s.ramp(0,-6,0,9,5,2.8);
    for(const z of [2,7])s.place('dino_log',0,z,1);for(const [x,z] of [[-5,-2],[5,0],[-5,6],[5,8]])s.place('dino_toadstool',x,z);
    s.place('dino_palm',-8,-8);s.place('dino_palm',8,-7);}},
  // a jungle pond with a log bridge over it (shallow: wade in) and a long-neck family having a drink
  dino_jungle_pond:{size:'medium',r:12,filler:false,build(s){s.spot('dino_pond',0,0,20,14);s.spot('dino_trail',0,0,4.5,17);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.5;s.place('dino_lily',Math.sin(a)*6.5,Math.cos(a)*4.4,null,0,4.5);}
    for(const [x,z] of [[-11,-5],[11,4],[-10,6]])s.place('dino_treefern',x,z,null,0,.6);s.herd('bronto',8,-9,2);}},
};

/* Shared by the Dino Land sub-zone files (dino_volcano, dino_swamp, dino_dig). */
// a painted patch (pond, lava, tar, sand pit…) in one quadrant of the chunk, kept 7+ from the middle and the edges, so it
// never reaches the roads (they run through the middle of even chunks). Returns where it went.
function dinoPool(ctx,kind,w,d,q){q=q??(Math.random()*4|0);const th=rand(-.5,.5),c=Math.abs(Math.cos(th)),s=Math.abs(Math.sin(th));
  const k=Math.min(1,13/(c*w/2+s*d/2),13/(s*w/2+c*d/2));w*=k;d*=k;
  const x=ctx.cx+(q&1?20:-20),z=ctx.cz+(q&2?20:-20);ctx.spot(kind,x,z,w,d,th);return {x,z,w,d,th,q};}
// sound ids that use a sub-zone's own clip once the audio lane has made it, else the jungle's (read at play time, so
// nothing needs changing here when the clips land): dinoSounds(musicBank,{drive:'dino_swamp_drive'},{drive:'dino_drive'})
function dinoSounds(bank,want,fb){const o={};
  for(const k in want)Object.defineProperty(o,k,{enumerable:true,get(){const id=want[k],ix=(bank&&bank.index)||{};
    return ix[id]||Object.keys(ix).some(n=>n.startsWith(id+'_')&&/^\d+$/.test(n.slice(id.length+1)))?id:fb[k];}});
  return o;}

registerZone({
  id:'dino',
  letter:'D',
  ground:'#6b9e2f',                        // warm jungle green
  sky:{top:'#46b3c9',horizon:'#ffe2a8'},   // steamy teal sky, warm sunny horizon
  weight:1,
  // L22 sound + music ids (clips described in TASKS.md AU5; anything missing falls back to the default sounds)
  music:{drive:'dino_drive',boss:'dino_boss'},
  sfx:{crash:'dino_crash',boom:'dino_boom',land:'dino_stomp',ambient:'dino_ambient'},
  props:DINO_PROPS,
  scenes:DINO_SCENES,
  spots:{
    dino_clearing:{micro:['dino_eggling','dino_sprout'],mini:['dino_fern','dino_shell'],tiny:['dino_flower','dino_nest'],small:['dino_egg','dino_cycad'],medium:['dino_hatch','dino_toadstool']},
    dino_trail:{micro:['dino_bonelet','dino_amber'],mini:['dino_rock'],tiny:['dino_stump'],small:['dino_bone']},
    dino_pond:{micro:['dino_lily'],mini:['dino_lily'],tiny:['dino_lotus'],small:['dino_lotus']}
  },
  spotLook:{dino_clearing:'#86bd3b',dino_trail:'#c9a36a',dino_pond:'#56b8c9'},
  water:{dino_pond:1},
  sizes:{
    micro:['dino_eggling','dino_sprout','dino_bonelet','dino_amber'],
    mini:['dino_fern','dino_rock','dino_shell'],
    tiny:['dino_nest','dino_stump','dino_flower'],
    small:['dino_egg','dino_cycad','dino_bone','dino_crystal'],
    medium:['dino_boulder','dino_hatch','dino_log','dino_toadstool'],
    large:['dino_palm','dino_treefern','dino_hut','dino_ribcage'],
    huge:['dino_lodge','dino_bigbones','dino_bignest'],
    mega:['dino_temple','dino_rex']
  },
  herds:[['trike',3],['stego',2],['bronto',2],['babyrex',4],['ptero',3],['duck',3]],
  layout(ctx){
    if(typeof dinoLand==='function'&&dinoLand(ctx))return; // Adventure Dino Land: quest areas are built from dino_land.js
    const kind=dinoLandmarks().get(ctx.ci+','+ctx.cj);
    if(kind==='volcano'){const p=dinoDrop(ctx,'dino_volcano',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_volcano+4,8,'dino_boulder');dinoRing(ctx,p.x,p.z,DINO_R.dino_volcano+8,10,'dino_crystal',.6);}
      dinoJungle(ctx,false);return;}
    if(kind==='temple'){const p=dinoDrop(ctx,'dino_temple',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_temple+3,6,'dino_palm');dinoRing(ctx,p.x,p.z,DINO_R.dino_temple+6,8,'dino_crystal',.5);}
      dinoJungle(ctx,false);return;}
    if(kind==='rex'){const p=dinoDrop(ctx,'dino_rex',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_rex+3,8,'dino_flower');dinoRing(ctx,p.x,p.z,DINO_R.dino_rex+6,6,'dino_fern',.7);dinoHerd(ctx,p.x+10,p.z+6,3);}
      dinoJungle(ctx,false);return;}
    if(kind==='bones'||kind==='dig'){const p=dinoDrop(ctx,kind==='bones'?'dino_bigbones':'dino_ribcage',0);
      if(p){dinoRing(ctx,p.x,p.z,(kind==='bones'?DINO_R.dino_bigbones:DINO_R.dino_ribcage)+3,7,'dino_bone');dinoRing(ctx,p.x,p.z,(kind==='bones'?9:6)+3,6,'dino_rock',.8);}
      dinoJungle(ctx,false);return;}
    if(kind==='nest'){const p=dinoDrop(ctx,'dino_bignest',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_bignest+3,6,'dino_egg');dinoRing(ctx,p.x,p.z,DINO_R.dino_bignest+6,5,'dino_hatch',.9);dinoHerd(ctx,p.x-8,p.z+10,3);}
      dinoJungle(ctx,false);return;}
    if(kind==='village'){const p=dinoDrop(ctx,'dino_lodge',0);
      if(p){for(let i=0;i<4;i++){const a=.8+i*Math.PI/2;dinoPut(ctx,'dino_hut',p.x+Math.cos(a)*13,p.z+Math.sin(a)*13,i);}
        dinoRing(ctx,p.x,p.z,DINO_R.dino_lodge+3,5,'dino_stump');dinoRing(ctx,p.x,p.z,19,6,'dino_nest',.1);}
      dinoJungle(ctx,false);return;}
    if(kind==='eggs'){for(const q of [0,3])ctx.scene('dino_egg_hunt',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(0,6.3),'small');
      ctx.scene('dino_hatch_party',ctx.cx+20,ctx.cz-20,0);dinoJungle(ctx,false);return;}
    if(Math.random()<.3){const q=Math.random()*4|0;ctx.scene('dino_jungle_pond',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(-.5,.5));}
    else if(Math.random()<.3)ctx.scene(pick(['dino_hatch_party','dino_jungle_gym']),rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),rand(0,6.3));
    // wild jungle: dense palms and eggs, a hut or a hatchling now and then, sometimes a ramp
    if(Math.random()<.35)dinoPut(ctx,'dino_hut',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    if(Math.random()<.5)dinoPut(ctx,'dino_hatch',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
    if(Math.random()<.4)dinoPut(ctx,'dino_log',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
    if(Math.random()<.25)dinoPut(ctx,'dino_ribcage',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    dinoJungle(ctx,true);
    if(Math.random()<.5){const ex=rand(ctx.x0+14,ctx.x1-14),ez=rand(ctx.z0+14,ctx.z1-14);for(let i=0;i<4;i++)dinoPut(ctx,'dino_egg',ex+Math.cos(i*1.6)*3,ez+Math.sin(i*1.6)*3,0);}
    if(Math.random()<.5)dinoHerd(ctx,rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),3);
    if(Math.random()<.45)for(let t=0;t<6;t++)if(ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2))break;
  }
});
