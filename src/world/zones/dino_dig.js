/* Smash Party — FOSSIL DIG, a Dino Land sub-zone (Z5). Owner: zone-dino agent (see agents/zone.md).
   Sunny sandy badlands where the explorers dig up big friendly bones: sand pits with half-buried skulls, little flags,
   buckets and brushes, tents, wheelbarrows, a wooden crane lifting a bone, the field office and a big columned Bone
   Museum with a skeleton on the roof. Every skull grins. Uses the shared helpers and colors from dino.js (loaded first).
   weight:0 = Dino Land only. Test: __sp.zone('dino_dig'). */
const DINO_SAND=['#e9c46a','#f4d58d','#deb887','#d4a373'],DINO_CANVAS=['#f4f1de','#e9c46a','#a8dadc','#f4a261'];
Object.assign(DINO_R,{
  dino_tooth:.2,dino_brush:.24,dino_bucket:.35,dino_flag:.3,dino_pick:.5,dino_crate:.6,dino_skull:.65,dino_sieve:.6,
  dino_barrow:1.1,dino_claw:1,dino_tent:1.9,dino_fossilrock:1.7,dino_crane:3,dino_bigskull:3.2,
  dino_office:4.7,dino_museum:10.5
});
const DINO_DIG_PROPS={
  /* ---- micro ---- */
  dino_tooth:(x,z)=>sized(x,z,DINO_R.dino_tooth,.3,1,'micro',P=>{
    P(mk('cone',.18,.3,.18,DINO_BONE,0,.15,0),1,true,.08);P(mk('sph',.2,.06,.2,pick(DINO_SAND),0,.03,0),1);}),
  dino_brush:(x,z,arg)=>sized(x,z,DINO_R.dino_brush,.1,1,'micro',(P,g)=>{ // a dig brush lying in the sand
    P(mk('box',.08,.06,.34,DINO_WOOD,0,.04,-.08),1);P(mk('box',.14,.08,.12,'#ffbe0b',0,.05,.14),1);face(g,arg);}),
  /* ---- mini ---- */
  dino_bucket:(x,z)=>sized(x,z,DINO_R.dino_bucket,.6,1,'mini',P=>{ // a sand bucket with a spade
    P(mk('cyl',.55,.55,.55,pick(['#e63946','#4cc9f0','#ffbe0b','#80ed99']),0,.28,0),2);P(mk('cyl',.48,.05,.48,'#f4d58d',0,.56,0),1);
    P(dinoM('box',.07,.6,.07,DINO_WOOD,.12,.75,0,0,0,-.3),1,true,.2);}),
  dino_flag:(x,z)=>sized(x,z,DINO_R.dino_flag,1.2,1,'mini',P=>{ // a little survey flag
    P(mk('cyl',.05,1.2,.05,DINO_WOOD,0,.6,0),1);P(mk('box',.38,.26,.03,pick(['#ff006e','#ffbe0b','#4cc9f0','#ff7b00']),.2,1.05,0),1,true,.12);}),
  dino_pick:(x,z,arg)=>sized(x,z,DINO_R.dino_pick,.9,1,'mini',(P,g)=>{ // a pickaxe stuck in a little rock
    P(mk('sph',.8,.45,.7,pick(DINO_STONE),0,.18,0),1);P(dinoM('cyl',.07,.8,.07,DINO_WOOD,0,.6,0,0,0,.3),1,true,.2);
    P(dinoM('box',.7,.1,.1,'#adb5bd',-.12,.95,0,0,0,.3),1,true,.2);face(g,arg);}),
  /* ---- tiny ---- */
  dino_crate:(x,z)=>sized(x,z,DINO_R.dino_crate,.9,1,'tiny',P=>{ // a dig-finds crate with a bone sticking out
    P(mk('box',1,.8,.8,'#c68b59',0,.4,0),2);P(mk('box',1.04,.1,.84,DINO_WOOD,0,.45,0),1);
    P(dinoM('box',.12,.55,.12,DINO_BONE,.2,.95,0,0,0,.25),1,true,.2);P(mk('sph',.18,.18,.18,DINO_BONE,.27,1.22,0),1);}),
  dino_skull:(x,z,arg)=>sized(x,z,DINO_R.dino_skull,.7,1,'tiny',(P,g)=>{ // a little grinning skull half in the sand
    P(mk('sph',.9,.65,1.1,DINO_BONE,0,.28,0),2,false,.3);dinoEyes(P,.2,.45,.38,.22);
    P(dinoFlat(mk('box',.4,.06,.06,DINO_INK,0,.18,.54)),1);P(mk('cyl',1.2,.08,1.2,pick(DINO_SAND),0,.04,0),1);face(g,arg);}),
  dino_sieve:(x,z)=>sized(x,z,DINO_R.dino_sieve,.6,1,'tiny',P=>{ // a sifting tray on legs
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])P(mk('box',.06,.45,.06,DINO_WOOD,sx*.42,.22,sz*.32),1);
    P(mk('box',1,.14,.78,'#c68b59',0,.5,0),1,true,.3);P(mk('box',.86,.03,.64,'#adb5bd',0,.56,0),1);P(mk('sph',.12,.08,.12,pick(DINO_GEM),.15,.6,.1),1);}),
  /* ---- small ---- */
  dino_barrow:(x,z,arg)=>sized(x,z,DINO_R.dino_barrow,1.3,2,'small',(P,g)=>{ // a wheelbarrow full of bones
    P(mk('wheel',.22,.7,.7,DINO_INK,0,.35,.9),1,true,.3);P(mk('box',1.3,.6,1.6,'#4cc9f0',0,.75,0),2);
    for(const sx of [-1,1])P(dinoM('box',.08,.08,1.2,DINO_WOOD,sx*.5,.55,-1.1,-.2),1);
    P(dinoM('wheel',1.1,.22,.22,DINO_BONE,0,1.15,.1,0,.5),1,true,.3);P(mk('sph',.4,.4,.4,DINO_BONE,-.2,1.15,-.4),1,true,.2);face(g,arg);}),
  dino_claw:(x,z,arg)=>sized(x,z,DINO_R.dino_claw,2,2,'small',(P,g)=>{ // a big curly claw fossil poking out of a rock
    P(mk('box',1.8,.8,1.4,pick(DINO_STONE),0,.4,0),2);
    for(let i=0;i<3;i++)P(dinoM('cone',.36-i*.07,.6,.36-i*.07,DINO_BONE,0,.95+i*.42,.1+i*.2,.4+i*.35),1,true,.2);face(g,arg);}),
  /* ---- medium ---- */
  dino_tent:(x,z,arg)=>sized(x,z,DINO_R.dino_tent,2.4,4,'medium',(P,g)=>{ // an explorer's tent
    const c=pick(DINO_CANVAS);P(dinoM('box',3.2,.12,2.4,c,0,1.2,-.78,.82),2,false,.6);P(dinoM('box',3.2,.12,2.4,c,0,1.2,.78,-.82),2,false,.6);
    P(mk('box',.2,.2,.2,DINO_INK,0,.6,1.2),1);P(mk('cyl',.08,2.6,.08,DINO_WOOD,1.65,1.3,0),1);
    P(mk('box',.6,.4,.04,'#ff006e',1.95,2.4,0),1,true,.2);face(g,arg);}),
  dino_fossilrock:(x,z,arg)=>sized(x,z,DINO_R.dino_fossilrock,2.6,5,'medium',(P,g)=>{ // a rock block with a curly fossil
    const c=pick(DINO_STONE);P(mk('box',3,2.6,2.2,c,0,1.3,0),5);
    P(dinoM('wheel',.18,1.6,1.6,'#fff1c1',0,1.4,1.1,0,Math.PI/2),1,true,.4);P(dinoM('wheel',.2,.9,.9,'#e9c46a',0,1.45,1.15,0,Math.PI/2),1);
    P(mk('box',3.1,.3,2.3,'#d4a373',0,2.7,0),1,true,.6);face(g,arg);}),
  /* ---- large ---- */
  dino_crane:(x,z,arg)=>sized(x,z,DINO_R.dino_crane,8,8,'large',(P,g)=>{ // a wooden crane lifting a big bone
    P(mk('box',2.6,.6,2.6,'#c68b59',0,.3,0),2);P(mk('box',.6,7,.6,DINO_WOOD,0,3.8,0),3);
    P(mk('box',5.4,.45,.45,DINO_WOOD,1.8,7.2,0),2);P(dinoM('box',.3,3,.3,DINO_WOOD,.9,5.8,0,0,0,.7),1);
    P(mk('cyl',.05,2.8,.05,DINO_INK,4.2,5.6,0),1);P(mk('wheel',2.6,.5,.5,DINO_BONE,4.2,4,0),1,true,.5);
    for(const sx of [-1,1])P(mk('sph',.65,.65,.65,DINO_BONE,4.2+sx*1.35,4,0),1,true,.25);
    P(mk('box',1,.8,1,'#ffbe0b',-.9,.95,.9),1,true,.3);face(g,arg);}),
  dino_bigskull:(x,z,arg)=>sized(x,z,DINO_R.dino_bigskull,4.6,9,'large',(P,g)=>{ // a giant grinning skull dug up out of the sand
    P(mk('sph',5,3.6,6,DINO_BONE,0,2,0),5,false,1);P(mk('box',3,1,2.4,DINO_BONE,0,1.1,2.9),2);
    dinoEyes(P,1.1,3,2.3,1.1);for(let i=0;i<5;i++)P(mk('cone',.36,.6,.36,'#ffffff',-1.1+i*.55,.6,4),1,true,.15); // buck teeth
    P(mk('cyl',7,.25,7,pick(DINO_SAND),0,.12,0),2);P(mk('cone',.8,1.6,.8,DINO_BONE,1.6,4,-1),1,true,.3);face(g,arg);}),
  /* ---- huge ---- */
  dino_office:(x,z,arg)=>sized(x,z,DINO_R.dino_office,9.2,18,'huge',(P,g)=>{ // the dig's field office, adobe + timber (BP)
    story(P,7,5.6,3,0,0,'#e9c46a',2);slab(P,6.8,5.4,3.05,0,'#deb887');
    story(P,5.4,4.6,2.6,3.1,1,'#f4a261',2);slab(P,5.8,5,5.75,1,'#d4a373');
    P(BP(mk('box',3.4,1.2,3,'#e76f51',0,6.4,0),2,'roof'),2);
    P(BP(mk('box',1.3,2,.2,DINO_INK,0,1,2.9),0,'extra'),1,true,.5);for(const sx of [-1,1])P(BP(mk('box',.9,.9,.16,'#a0e7ff',sx*2.1,1.7,2.88),0,'extra'),1,true,.3);
    P(BP(mk('box',7.6,.2,1.6,'#a8dadc',0,3.1,3.4),1,'extra'),1,true,.6);                       // awning
    P(BP(mk('wheel',3,.35,.35,DINO_BONE,0,2.4,3.05),0,'extra'),1,true,.6);
    P(BP(mk('cyl',.12,2.4,.12,DINO_WOOD,0,8.2,0),2,'extra'),1,true,.3);P(BP(mk('box',1,.6,.06,'#ff006e',.5,9,0),2,'extra'),1,true,.3);
    face(g,arg);},{building:true}),
  /* ---- mega ---- */
  dino_museum:(x,z,arg)=>sized(x,z,DINO_R.dino_museum,15,58,'mega',(P,g)=>{ // the Bone Museum: columns and a skeleton on the roof (BP)
    for(let i=0;i<3;i++)P(BP(mk('box',16-i*.8,.6,12-i*.8,'#f4f1de',0,.3+i*.6,0),0,'slab'),2);                  // steps
    story(P,14,10,4.4,1.8,0,'#f4d58d',3);slab(P,15,11,6.3,0,'#f4f1de');
    for(let i=0;i<6;i++)P(BP(mk('cyl',.9,4.4,.9,'#ffffff',-6+i*2.4,4,6),0,'wall'),2);                       // front columns
    story(P,10,7,3.4,6.45,1,'#e9c46a',2);P(BP(mk('pyr',11.4,2.6,8.4,'#e76f51',0,11.2,0),2,'roof'),4);
    P(BP(mk('box',2.4,3,.2,DINO_INK,0,3.3,5.05),0,'extra'),1,true,.6);
    for(let i=0;i<3;i++)P(BP(mk('box',1.2,.6,1.2,DINO_BONE,-2.4+i*2.4,12.8,0),2,'extra'),1,true,.4);          // the skeleton on the roof
    P(BP(dinoM('box',.7,2.6,.7,DINO_BONE,3.6,13.6,0,0,0,-.5),2,'extra'),1,true,.5);P(BP(mk('sph',1.4,1.1,1.6,DINO_BONE,4.6,14.8,0),2,'extra'),1,true,.5);
    P(BP(mk('wheel',6,.5,.5,DINO_BONE,0,7.6,5.4),1,'extra'),1,true,.8);face(g,arg);                          // big bone sign
  },{building:true})
};
dinoWithSfx(DINO_DIG_PROPS,{
  dino_tooth:'dino_bone',dino_skull:'dino_bone',dino_bigskull:'dino_bone',dino_claw:'dino_bone',dino_barrow:'dino_bone',dino_crane:'dino_wood',
  dino_brush:'dino_wood',dino_crate:'dino_wood',dino_sieve:'dino_wood',dino_flag:'dino_wood',dino_office:'dino_wood',
  dino_pick:'dino_rock',dino_fossilrock:'dino_rock',dino_museum:'dino_rock',
  dino_bucket:'dino_sand',dino_tent:'dino_sand'                       // new clip (AU15); falls back to the zone's crash
});

const DINO_DIG_SCENES={
  // a dig square: string-and-flag corners, a half-dug skull, brushes and a bucket (micro detail around tiny cars)
  dino_dig_square:{size:'tiny',r:6,build(s){s.spot('dino_pit',0,0,7,7);for(const [x,z] of [[-3.5,-3.5],[3.5,-3.5],[-3.5,3.5],[3.5,3.5]])s.place('dino_flag',x,z);
    s.place('dino_skull',0,0,0);for(let i=0;i<3;i++)s.place('dino_brush',-1.6+i*1.5,2,i);s.place('dino_bucket',2.2,-1.4);
    s.place('dino_sieve',-2.2,-1.6);for(let i=0;i<4;i++)s.place('dino_tooth',1.4+i*.4,1.2-i*.5);}},
  // camp: tents round a fire ring, crates and a barrow
  dino_dig_camp:{size:'medium',r:11,build(s){s.spot('dino_camp',0,0,18,16);
    for(let i=0;i<3;i++){const a=-.9+i*.9;s.place('dino_tent',Math.sin(a)*6.5,-Math.cos(a)*6.5,null,a+Math.PI);}
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;s.place('dino_rock',Math.sin(a)*1.4,Math.cos(a)*1.4,null,0,.6);}s.place('dino_amber',0,0,null,0,3);
    for(const [x,z] of [[5,4],[6,5.4],[-5.6,4.6]])s.place('dino_crate',x,z,null,0,1.6);s.place('dino_barrow',-2,6,1);}},
  // the big find: a giant skull in a pit, the crane lifting a bone, wheelbarrows lined up
  dino_big_find:{size:'large',r:14,build(s){s.spot('dino_pit',0,0,16,14);s.place('dino_bigskull',0,0);s.place('dino_crane',-9,-6);
    for(let i=0;i<3;i++)s.place('dino_barrow',6+i*2.2,7,0,0,1.65);for(const [x,z] of [[-7,-7],[7,-7],[-7,7],[7,7]])s.place('dino_flag',x,z,null,0,4.5);
    s.place('dino_fossilrock',9,-3);}},
  // a rock wall of fossils, with picks and buckets at its foot and a ramp up the spoil heap
  dino_fossil_wall:{size:'medium',r:12,build(s){for(let i=0;i<4;i++)s.place('dino_fossilrock',-5.4+i*3.6,-2,0);
    for(let i=0;i<4;i++)s.place(i%2?'dino_bucket':'dino_pick',-5+i*3.4,1.6,0,0,2.7);s.spot('dino_spoil',8,4,8,6);s.ramp(8,5,0,8,6,2.4);
    s.place('dino_claw',-8,3);s.place('dino_crate',0,4.6,null,0,1.6);}},
};

// a sand pit in one quadrant with a find or two in it, flags on its corners
function dinoPit(ctx){const p=dinoPool(ctx,'dino_pit',rand(10,20),rand(10,18));
  dinoPut(ctx,pick(['dino_skull','dino_claw','dino_fossilrock','dino_bigskull']),p.x,p.z,Math.random()*4|0);
  for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const lx=a*p.w/2,lz=b*p.d/2;
    dinoPut(ctx,'dino_flag',p.x+lx*Math.cos(p.th)+lz*Math.sin(p.th),p.z-lx*Math.sin(p.th)+lz*Math.cos(p.th));}
  return p;}
function dinoDusty(ctx,dense){ // the dig-site filler every chunk gets some of
  dinoScatter(ctx,dense?2:1,['dino_tent','dino_fossilrock','dino_boulder']);
  dinoScatter(ctx,dense?4:2,['dino_barrow','dino_claw','dino_bone','dino_cycad']);
  dinoScatter(ctx,dense?5:3,['dino_crate','dino_skull','dino_sieve','dino_bucket','dino_pick','dino_flag']);
  dinoScatter(ctx,dense?6:4,['dino_tooth','dino_brush','dino_bonelet','dino_amber']);}

registerZone({
  id:'dino_dig',
  letter:'B',
  ground:'#d9b26a',                         // sunny sand
  sky:{top:'#5fb4e6',horizon:'#fff0c2'},    // clear desert blue
  weight:0,                                 // Dino Land only
  music:dinoSounds(musicBank,{drive:'dino_dig_drive',boss:'dino_dig_boss'},{drive:'dino_drive',boss:'dino_boss'}),
  sfx:dinoSounds(sfxBank,{crash:'dino_dig_crash',boom:'dino_boom',land:'dino_dig_thump',ambient:'dino_dig_ambient'},
    {crash:'dino_bone',boom:'dino_boom',land:'dino_stomp',ambient:'dino_ambient'}),
  props:DINO_DIG_PROPS,
  scenes:DINO_DIG_SCENES,
  sizes:{
    micro:['dino_tooth','dino_brush','dino_bonelet','dino_amber'],
    mini:['dino_bucket','dino_flag','dino_pick','dino_shell'],
    tiny:['dino_crate','dino_skull','dino_sieve'],
    small:['dino_barrow','dino_claw','dino_bone'],
    medium:['dino_tent','dino_fossilrock','dino_boulder'],
    large:['dino_crane','dino_bigskull','dino_ribcage'],
    huge:['dino_office','dino_bigbones','dino_lodge'],
    mega:['dino_museum','dino_museum','dino_temple']
  },
  spots:{
    dino_pit:{micro:['dino_tooth','dino_bonelet','dino_brush'],mini:['dino_pick','dino_bucket','dino_shell'],tiny:['dino_skull','dino_sieve'],small:['dino_claw','dino_bone'],medium:['dino_fossilrock'],large:['dino_bigskull','dino_ribcage']},
    dino_camp:{micro:['dino_brush','dino_amber'],mini:['dino_bucket','dino_flag'],tiny:['dino_crate','dino_sieve'],small:['dino_barrow'],medium:['dino_tent']},
    dino_spoil:{micro:['dino_tooth'],mini:['dino_pick'],tiny:['dino_crate'],small:['dino_barrow']}
  },
  spotLook:{dino_pit:'#c08a4e',dino_camp:'#e7cf9b',dino_spoil:'#b58a5a'},
  herds:[['trike',3],['stego',2],['babyrex',3]],
  layout(ctx){
    if(typeof dinoLand==='function'&&dinoLand(ctx))return; // Adventure Dino Land: quest areas are built from dino_land.js
    const kind=dinoMarks('dino_dig','museum',['office','find','camp','wall','find','camp','office']).get(ctx.ci+','+ctx.cj);
    if(kind==='museum'){const p=dinoDrop(ctx,'dino_museum',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_museum+3,8,'dino_crate');dinoRing(ctx,p.x,p.z,DINO_R.dino_museum+7,6,'dino_fossilrock',.5);}
      dinoPit(ctx);dinoDusty(ctx,false);return;}
    if(kind==='office'){const p=dinoDrop(ctx,'dino_office',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_office+3,6,'dino_barrow');ctx.scene('dino_dig_camp',p.x+(p.x<ctx.cx?18:-18),p.z+(p.z<ctx.cz?18:-18),0);}
      dinoDusty(ctx,false);return;}
    if(kind==='find'){const q=Math.random()*4|0;ctx.scene('dino_big_find',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(0,6.3));
      dinoPit(ctx);dinoDusty(ctx,false);return;}
    if(kind==='camp'){for(const q of [0,3])ctx.scene('dino_dig_camp',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(0,6.3));
      ctx.scene('dino_dig_square',ctx.cx+20,ctx.cz-20,0);dinoHerd(ctx,ctx.cx-20,ctx.cz+20,3);dinoDusty(ctx,false);return;}
    if(kind==='wall'){for(const q of [1,2])ctx.scene('dino_fossil_wall',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),(Math.random()*4|0)*Math.PI/2);
      dinoDusty(ctx,false);return;}
    // open badlands: a sand pit or two, dig squares, a tent or a crane now and then, a ramp
    dinoPit(ctx);if(Math.random()<.4)dinoPit(ctx);
    if(Math.random()<.5)ctx.scene('dino_dig_square',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),rand(0,6.3));
    if(Math.random()<.3)dinoPut(ctx,'dino_crane',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    dinoDusty(ctx,true);
    if(Math.random()<.4)dinoHerd(ctx,rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),3);
    if(Math.random()<.5)for(let t=0;t<6;t++)if(ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2))break;
  }
});
