/* Smash Party — TAR-PIT SWAMP, a Dino Land sub-zone (Z5). Owner: zone-dino agent (see agents/zone.md).
   A muddy green bog: wade through shallow swamp water (slow and splashy), sticky tar pits that blorp, lily pads,
   cattails, droopy willows, big friendly snails, stilt houses, a giant smiling turtle you can climb and a huge
   mossy stump treehouse. The deep middle of the lagoon needs hover. Goofy, never scary.
   Uses the shared helpers and colors from dino.js (loaded first). weight:0 = Dino Land only.
   Test: __sp.zone('dino_swamp'). */
const DINO_MOSS=['#6a994e','#88a65e','#a7c957','#55803f'],DINO_MUD='#7a5c3e',DINO_TAR='#2b2a33',DINO_POND='#5fa89c';
Object.assign(DINO_R,{
  dino_lily:.28,dino_bubble:.2,dino_reed:.6,dino_mudpie:.6,dino_snail:.7,dino_lotus:.6,
  dino_mangrove:1.3,dino_tarpit:1.2,dino_mossmound:1.7,dino_frogrock:1.6,dino_stilthouse:3,dino_willow:2.4,
  dino_turtle:5.2,dino_boathouse:4.8,dino_treehouse:9.8
});
const DINO_SWAMP_PROPS={
  /* ---- micro ---- */
  dino_lily:(x,z)=>sized(x,z,DINO_R.dino_lily,.2,1,'micro',P=>{ // a lily pad with a little flower
    P(mk('cyl',.5,.05,.5,pick(['#57cc99','#70e000']),0,.03,0),1,true,.2);
    if(Math.random()<.6)P(mk('sph',.16,.12,.16,pick(['#ffafcc','#fff1c1','#ffd6a5']),.08,.12,.05),1,true,.08);}),
  dino_bubble:(x,z)=>sized(x,z,DINO_R.dino_bubble,.3,1,'micro',P=>{ // a tar bubble about to blorp
    P(mk('cyl',.36,.05,.36,DINO_TAR,0,.03,0),1);P(mk('sph',.26,.24,.26,'#3d3b47',0,.14,0),1,true,.1);
    P(dinoFlat(mk('sph',.07,.05,.07,'#ffffff',.06,.24,.06)),1);}),
  /* ---- mini ---- */
  dino_reed:(x,z)=>sized(x,z,DINO_R.dino_reed,1.4,1,'mini',P=>{ // a clump of cattails
    for(let i=0;i<4;i++){const a=i*1.7,x=Math.sin(a)*.2,z=Math.cos(a)*.2,h=.9+(i%3)*.22;
      P(dinoM('cyl',.06,h,.06,'#55803f',x,h/2,z,(i%2-.5)*.2),1);P(mk('cyl',.13,.3,.13,'#8d5524',x,h,z),1,true,.08);}
    dinoLeaves(P,3,0,.05,0,.6,.12,-1.1,DINO_MOSS,.5);}),
  dino_mudpie:(x,z)=>sized(x,z,DINO_R.dino_mudpie,.5,1,'mini',P=>{ // a wobbly mud pile with a flower stuck in it
    P(mk('sph',1.1,.5,1,DINO_MUD,0,.2,0),2);P(mk('sph',.6,.35,.6,'#8b6b4a',.1,.42,0),1,true,.2);
    P(mk('cyl',.04,.3,.04,'#2d9a4e',.1,.65,0),1);P(mk('sph',.14,.1,.14,'#ffbe0b',.1,.82,0),1,true,.06);}),
  /* ---- tiny ---- */
  dino_snail:(x,z,arg)=>sized(x,z,DINO_R.dino_snail,1,1,'tiny',(P,g)=>{ // a big friendly swirly snail
    const c=pick(['#f4a261','#ffafcc','#a0c4ff','#ffd166']);
    P(mk('sph',.5,.3,1.3,'#caffbf',0,.15,.1),1,true,.2);P(dinoM('wheel',.4,.85,.85,c,0,.65,-.15,0,Math.PI/2),2,false,.3);
    P(dinoM('wheel',.44,.45,.45,'#fff1c1',0,.7,-.12,0,Math.PI/2),1);
    for(const sx of [-1,1]){P(mk('cyl',.05,.35,.05,'#caffbf',sx*.12,.45,.7),1);P(mk('sph',.12,.12,.12,'#ffffff',sx*.12,.65,.7),1);}
    face(g,arg);}),
  dino_lotus:(x,z)=>sized(x,z,DINO_R.dino_lotus,.8,1,'tiny',P=>{ // a big pink water flower
    P(mk('cyl',1.1,.06,1.1,'#57cc99',0,.03,0),1,true,.3);const c=pick(['#ff8fab','#ffc6ff','#fff1c1']);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(dinoM('sph',.3,.5,.18,c,Math.sin(a)*.18,.32,Math.cos(a)*.18,-.4,a),1,true,.12);}
    P(mk('sph',.2,.16,.2,DINO_GLOW,0,.4,0),1);}),
  /* ---- small ---- */
  dino_mangrove:(x,z)=>sized(x,z,DINO_R.dino_mangrove,2.8,2,'small',P=>{ // a little tree up on stilt roots
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;P(dinoM('cyl',.12,1,.12,DINO_BARK,Math.sin(a)*.4,.45,Math.cos(a)*.4,Math.cos(a)*.5,0,-Math.sin(a)*.5),1);}
    P(mk('cyl',.32,1.4,.32,DINO_BARK,0,1.4,0),2);P(mk('sph',2,1.2,2,pick(DINO_MOSS),0,2.3,0),2,false,.7);}),
  dino_tarpit:(x,z)=>sized(x,z,DINO_R.dino_tarpit,.8,2,'small',P=>{ // a bubbling sticky tar puddle with a lost bone
    P(mk('cyl',2.2,.18,2,DINO_TAR,0,.09,0),3);for(let i=0;i<3;i++)P(mk('sph',.4-i*.08,.34-i*.06,.4-i*.08,'#3d3b47',-.5+i*.55,.2,.3-i*.4),1,true,.15);
    P(dinoM('box',.9,.18,.18,DINO_BONE,.4,.3,-.4,0,.6,.3),1,true,.3);}),
  /* ---- medium ---- */
  dino_mossmound:(x,z)=>sized(x,z,DINO_R.dino_mossmound,2.2,4,'medium',P=>{ // a mossy hump with mushrooms
    P(mk('sph',3.2,1.8,2.8,pick(DINO_MOSS),0,.75,0),5);P(mk('sph',1.6,1,1.4,pick(DINO_MOSS),.8,1.4,.3),2);
    for(const [x,z] of [[-.8,.9],[-.3,1.1]]){P(mk('cyl',.12,.35,.12,'#fff',x,1.55,z),1);P(mk('sph',.4,.22,.4,'#ff7b00',x,1.75,z),1,true,.15);}}),
  dino_frogrock:(x,z,arg)=>sized(x,z,DINO_R.dino_frogrock,2.4,5,'medium',(P,g)=>{ // a rock that looks just like a happy frog
    const c='#88a65e';P(mk('sph',3,1.8,2.6,c,0,.9,0),4);P(mk('sph',2.4,1.2,1.6,c,0,1.7,.6),2);
    dinoEyes(P,.65,2.3,.9,.7);P(dinoFlat(mk('box',1.6,.14,.2,'#e63946',0,1.45,1.35)),1);
    for(const sx of [-1,1])P(mk('sph',1,.5,1.2,'#6a994e',sx*1.3,.25,.9),1,true,.3);face(g,arg);}),
  /* ---- large ---- */
  dino_stilthouse:(x,z,arg)=>sized(x,z,DINO_R.dino_stilthouse,7.2,9,'large',(P,g)=>{ // a reed hut up on stilts (BP)
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1.05],[0,1.05],[-1.05,0],[1.05,0]])P(BP(mk('cyl',.3,2,.3,DINO_BARK,sx*1.8,1,sz*1.8),0,'wall'),1);
    P(BP(mk('box',4.4,.3,4.4,'#a0703c',0,2.1,0),0,'slab'),2);
    story(P,3.4,3.4,2.4,2.25,1,'#c9a36a',2);P(BP(mk('cone',5.4,2.4,5.4,DINO_THATCH,0,5.8,0),2,'roof'),3);
    P(BP(mk('box',1,1.5,.2,DINO_INK,0,3,1.95),1,'extra'),1,true,.4);
    for(let i=0;i<4;i++)P(BP(mk('box',.9,.14,.5,'#a0703c',0,.4+i*.5,2.6+i*.04),0,'extra'),1,true,.3); // ladder steps
    P(BP(mk('sph',.45,.45,.45,'#ff8fab',0,7,0),2,'extra'),1,true,.2);face(g,arg);},{building:true}),
  dino_willow:(x,z)=>sized(x,z,DINO_R.dino_willow,7,8,'large',P=>{ // a droopy swamp willow
    P(mk('cyl',.9,4.2,.9,DINO_BARK,0,2.1,0),4);P(mk('sph',4.4,2.4,4.4,pick(DINO_MOSS),0,4.8,0),4,false,1);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;P(mk('box',.5,2.6,.3,'#a7c957',Math.sin(a)*1.9,3.4,Math.cos(a)*1.9),1,true,.5);}}),
  /* ---- huge ---- */
  dino_turtle:(x,z,arg)=>sized(x,z,DINO_R.dino_turtle,6.4,16,'huge',(P,g)=>{ // a giant snoozy smiling turtle, half in the bog
    const shell='#6a994e',skin='#a7c957';
    P(mk('sph',9,4.4,8.4,shell,0,2,0),6,false,1.4);P(mk('cyl',9.4,.6,8.8,'#dda15e',0,.6,0),3);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(mk('sph',2,.6,2,'#55803f',Math.sin(a)*2.3,4,Math.cos(a)*2.1),1,true,.6);} // shell patches
    P(mk('sph',2.8,2.2,2.8,skin,0,1.7,5.2),3);dinoEyes(P,.75,2.3,6.3,.75);P(dinoFlat(mk('box',1.4,.18,.2,DINO_INK,0,1.25,6.55)),1);
    for(const sx of [-1,1])for(const sz of [-1,1])P(mk('sph',1.8,1,2,skin,sx*3.8,.5,sz*2.8),1,true,.6);
    P(dinoM('pyr',.8,1.4,.8,skin,0,.6,-4.6,-1.3),1,true,.4);face(g,arg);}),
  dino_boathouse:(x,z,arg)=>sized(x,z,DINO_R.dino_boathouse,8.6,18,'huge',(P,g)=>{ // a two-storey boathouse on a dock (BP)
    P(BP(mk('box',10,.4,7.4,'#a0703c',0,.2,0),0,'slab'),3);
    story(P,7,5.4,2.8,.4,0,'#8d7b68',2);slab(P,6.8,5.2,3.25,0,'#deb887');
    story(P,5.6,4.4,2.4,3.35,1,'#c9a36a',2);roofOf(P,7.8,6.4,2.6,7.2,2,'#2a9d8f');
    P(BP(mk('box',2.6,2,.2,DINO_INK,0,1.4,2.75),0,'extra'),1,true,.6);
    for(const sx of [-1,1])P(BP(mk('box',.9,.8,.16,'#a0e7ff',sx*1.6,4.6,2.28),1,'extra'),1,true,.3);
    P(BP(dinoM('box',2.4,.5,1,'#ff8fab',0,.65,4.4,0,0,.08),0,'extra'),1,true,.6);                         // a little pink boat
    P(BP(mk('wheel',2.4,.3,.3,DINO_BONE,0,6.2,2.3),1,'extra'),1,true,.6);face(g,arg);
  },{building:true}),
  /* ---- mega ---- */
  dino_treehouse:(x,z,arg)=>sized(x,z,DINO_R.dino_treehouse,15,52,'mega',(P,g)=>{ // a huge mossy stump with treehouse floors (BP)
    const R=[6.4,5.4,4.4],H=[4.4,4,3.6];let y=0;
    for(let f=0;f<3;f++){const w=2*R[f]*Math.tan(Math.PI/8)*1.25;
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;P(BP(dinoM('box',w,H[f],1.3,i%2?DINO_BARK:DINO_WOOD,Math.sin(a)*R[f],y+H[f]/2,Math.cos(a)*R[f],0,a),f,'wall'),2);}
      P(BP(mk('cyl',R[f]*2.2,.4,R[f]*2.2,'#deb887',0,y+H[f]+.1,0),f,'slab'),3);y+=H[f]+.3;}
    P(BP(mk('cone',10.4,4,10.4,'#6a994e',0,y+2,0),3,'roof'),5);
    for(let f=0;f<3;f++)P(BP(mk('box',1.6,2,.2,DINO_INK,0,[0,4.7,9][f]+1,R[f]+.65),f,'extra'),1,true,.5);   // doors on each floor
    for(const a of [1.2,3.6,5.3])P(BP(mk('sph',2.2,1,2.2,'#a7c957',Math.sin(a)*6.6,4.6,Math.cos(a)*6.6),0,'extra'),1,true,.6); // moss
    P(BP(mk('cyl',.14,2.2,.14,DINO_WOOD,0,y+5,0),3,'extra'),1,true,.3);P(BP(mk('box',1.2,.7,.08,'#ff006e',.6,y+5.7,0),3,'extra'),1,true,.3);
    face(g,arg);},{building:true})
};
dinoWithSfx(DINO_SWAMP_PROPS,{
  dino_lily:'dino_leafy',dino_reed:'dino_leafy',dino_lotus:'dino_leafy',dino_mangrove:'dino_leafy',dino_willow:'dino_leafy',
  dino_snail:'dino_rock',dino_frogrock:'dino_rock',dino_turtle:'dino_rock',
  dino_stilthouse:'dino_wood',dino_boathouse:'dino_wood',dino_treehouse:'dino_wood',
  dino_bubble:'dino_squelch',dino_tarpit:'dino_squelch',dino_mudpie:'dino_squelch',dino_mossmound:'dino_squelch' // new clips (AU15)
});

const DINO_SWAMP_SCENES={
  // a snail race across a mud patch: snails lined up on a start line, a finish of lily flowers, a tar-bubble crowd
  dino_snail_race:{size:'tiny',r:7,build(s){s.spot('dino_mud',0,0,10,12);
    for(let i=0;i<4;i++)s.place('dino_snail',-2.7+i*1.8,-4.2,0);for(let i=0;i<5;i++)s.place('dino_lotus',-3.6+i*1.8,4.6);
    for(const [x,z] of [[-4.6,-1],[4.6,.5],[-4.4,2],[4.4,-2.4]])s.place('dino_mudpie',x,z);}},
  // a lily pond with a frog rock in the middle (the pond is shallow: wade in)
  dino_frog_pond:{size:'medium',r:11,filler:false,build(s){s.spot('dino_bog',0,0,18,14);s.spot('dino_island',0,0,5,4.5);
    s.place('dino_frogrock',0,0);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;s.place(i%2?'dino_lotus':'dino_lily',Math.sin(a)*6,Math.cos(a)*4.6,null,0,i%2?1.6:2.7);}
    for(const [x,z] of [[-9,-6],[9,5],[-8.5,6.5]])s.place('dino_reed',x,z,null,0,2.7);s.place('dino_mangrove',9,-6);}},
  // tar pits with a long-neck skeleton peeking out and a "careful!" stick
  dino_tar_pits:{size:'small',r:9,build(s){s.spot('dino_tar',-2,0,6,5);s.spot('dino_tar',3.4,2.6,4,3.4,.4);
    s.place('dino_tarpit',-2,0);s.place('dino_tarpit',3.4,2.6);for(let i=0;i<5;i++)s.place('dino_bubble',-4+i*1.7,-3.6+i*.3,null,0,1.6);
    s.place('dino_bone',5.6,-2.4,1);s.place('dino_mudpie',-5.6,3,null,0,1.6);s.place('dino_mossmound',1,-6.4,null,0,.6);}},
  // a little stilt village by the water: three stilt houses, a dock and the boat
  dino_stilt_village:{size:'large',r:15,filler:false,build(s){s.spot('dino_bog',0,4,28,12);
    for(const x of [-8,0,8])s.place('dino_stilthouse',x,4,0);s.spot('dino_boardwalk',0,-3.4,26,2.6);
    for(const x of [-12,12])s.place('dino_willow',x,-6);s.place('dino_mossmound',-4,-8);s.herd('bronto',4,-10,2);}},
  // a big turtle snoozing in the bog with lily pads all around it
  dino_turtle_nap:{size:'huge',r:13,filler:false,build(s){s.spot('dino_bog',0,0,22,20);s.place('dino_turtle',0,0);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2+.2;s.place('dino_lotus',Math.sin(a)*9,Math.cos(a)*8.4,null,0,4.5);}}},
};

// a swampy patch in one quadrant: shallow bog with lily pads and reeds round the edge, sometimes a deep middle or an island
function dinoBog(ctx,deep){const p=dinoPool(ctx,'dino_bog',rand(16,26),rand(12,20));
  if(deep)ctx.spot('dino_deep',p.x,p.z,p.w*.5,p.d*.45,p.th);
  else if(Math.random()<.5){ctx.spot('dino_island',p.x,p.z,5,4.5,p.th);dinoPut(ctx,pick(['dino_mangrove','dino_mossmound','dino_frogrock']),p.x,p.z);}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+rand(-.3,.3);dinoPut(ctx,i%3?'dino_lily':'dino_lotus',p.x+Math.cos(a)*p.w*.32,p.z+Math.sin(a)*p.d*.32);}
  for(let i=0;i<4;i++){const a=rand(0,6.3);dinoPut(ctx,'dino_reed',p.x+Math.cos(a)*(p.w/2+1),p.z+Math.sin(a)*(p.d/2+1));}
  return p;}
function dinoSoggy(ctx,dense){ // the swampy filler every swamp chunk gets some of
  dinoScatter(ctx,dense?4:2,['dino_willow','dino_mangrove','dino_treefern']);
  dinoScatter(ctx,dense?3:2,['dino_mossmound','dino_frogrock','dino_log','dino_tarpit']);
  dinoScatter(ctx,dense?5:3,['dino_reed','dino_mudpie','dino_snail','dino_lotus','dino_fern']);
  dinoScatter(ctx,dense?6:4,['dino_lily','dino_bubble','dino_sprout','dino_eggling']);}

registerZone({
  id:'dino_swamp',
  letter:'S',
  ground:'#5c7f3a',                         // mossy olive
  sky:{top:'#6fb7a8',horizon:'#e9f5c9'},    // misty green
  weight:0,                                 // Dino Land only
  music:dinoSounds(musicBank,{drive:'dino_swamp_drive',boss:'dino_swamp_boss'},{drive:'dino_drive',boss:'dino_boss'}),
  sfx:dinoSounds(sfxBank,{crash:'dino_swamp_crash',boom:'dino_boom',land:'dino_swamp_splat',ambient:'dino_swamp_ambient'},
    {crash:'dino_leafy',boom:'dino_boom',land:'dino_stomp',ambient:'dino_ambient'}),
  props:DINO_SWAMP_PROPS,
  scenes:DINO_SWAMP_SCENES,
  sizes:{
    micro:['dino_lily','dino_bubble','dino_sprout','dino_eggling'],
    mini:['dino_reed','dino_mudpie','dino_fern'],
    tiny:['dino_snail','dino_lotus','dino_stump'],
    small:['dino_mangrove','dino_tarpit','dino_egg'],
    medium:['dino_mossmound','dino_frogrock','dino_log'],
    large:['dino_stilthouse','dino_willow','dino_treefern'],
    huge:['dino_turtle','dino_boathouse','dino_bignest'],
    mega:['dino_treehouse','dino_treehouse','dino_rex']
  },
  spots:{
    dino_bog:{micro:['dino_lily'],mini:['dino_reed'],tiny:['dino_lotus','dino_snail'],small:['dino_mangrove'],medium:['dino_frogrock'],large:['dino_willow']},
    dino_deep:{micro:['dino_lily'],mini:['dino_lily'],tiny:['dino_lotus'],small:['dino_lotus']},
    dino_tar:{micro:['dino_bubble'],mini:['dino_mudpie'],tiny:['dino_bubble'],small:['dino_tarpit']},
    dino_mud:{micro:['dino_bubble','dino_lily'],mini:['dino_mudpie','dino_reed'],tiny:['dino_snail'],small:['dino_tarpit'],medium:['dino_mossmound']},
    dino_island:{micro:['dino_sprout'],mini:['dino_fern'],tiny:['dino_snail'],small:['dino_mangrove']},
    dino_boardwalk:{micro:['dino_bonelet'],mini:['dino_shell'],tiny:['dino_snail']}
  },
  spotLook:{dino_bog:'#6fae94',dino_deep:'#3f8c8a',dino_tar:'#2b2a33',dino_mud:'#7a5c3e',dino_island:'#7aa84a',dino_boardwalk:'#b5835a'},
  water:{dino_bog:1,dino_tar:1,dino_deep:2},  // bog + tar: wade (slow, splashy); the deep middle needs hover
  herds:[['bronto',3],['duck',4],['stego',2]],
  layout(ctx){
    const kind=dinoMarks('dino_swamp','treehouse',['turtle','village','boathouse','frogs','tar','turtle','village']).get(ctx.ci+','+ctx.cj);
    if(kind==='treehouse'){const p=dinoDrop(ctx,'dino_treehouse',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_treehouse+3,7,'dino_willow');dinoRing(ctx,p.x,p.z,DINO_R.dino_treehouse+7,9,'dino_mossmound',.5);}
      dinoBog(ctx,false);dinoSoggy(ctx,false);return;}
    if(kind==='turtle'){const q=Math.random()*4|0;ctx.scene('dino_turtle_nap',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(0,6.3));
      dinoBog(ctx,true);dinoSoggy(ctx,false);return;}
    if(kind==='village'){const q=Math.random()*4|0;ctx.scene('dino_stilt_village',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),(Math.random()*4|0)*Math.PI/2);
      dinoBog(ctx,false);dinoSoggy(ctx,false);return;}
    if(kind==='boathouse'){const p=dinoPool(ctx,'dino_bog',26,20);dinoPut(ctx,'dino_boathouse',p.x,p.z,Math.random()*4|0);
      dinoBog(ctx,true);dinoSoggy(ctx,false);return;}
    if(kind==='frogs'){for(const q of [0,3])ctx.scene('dino_frog_pond',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(0,6.3));
      ctx.scene('dino_snail_race',ctx.cx+20,ctx.cz-20,0);dinoSoggy(ctx,false);return;}
    if(kind==='tar'){for(const q of [1,2])ctx.scene('dino_tar_pits',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(0,6.3),'medium');
      dinoSoggy(ctx,false);return;}
    // wild bog: a pond or two, tar pits, a stilt house or a frog rock now and then, a ramp
    dinoBog(ctx,Math.random()<.3);if(Math.random()<.4)dinoBog(ctx,false);
    if(Math.random()<.45)ctx.scene('dino_tar_pits',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),rand(0,6.3));
    if(Math.random()<.3)dinoPut(ctx,'dino_stilthouse',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    if(Math.random()<.4)dinoPut(ctx,'dino_frogrock',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),Math.random()*4|0);
    dinoSoggy(ctx,true);
    if(Math.random()<.5)dinoHerd(ctx,rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),3);
    if(Math.random()<.35)for(let t=0;t<6;t++)if(ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2))break;
  }
});
