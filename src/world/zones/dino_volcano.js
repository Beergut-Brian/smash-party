/* Smash Party — VOLCANO PEAK, a Dino Land sub-zone (Z5). Owner: zone-dino agent (see agents/zone.md).
   Warm dark rock, glowing lava streams (too deep for wheels: hover over them), steamy geysers, basalt columns, eggs kept
   cozy by the warm stones, a hot-spring spa where a long-neck relaxes with a towel on its head, and a stepped crag.
   Friendly and goofy: the lava smiles back. Uses the shared helpers and colors from dino.js (loaded first).
   weight:0 = never mixed into the Home World; Dino Land's plan (and Arcade's random Dino Land) puts it on the map.
   Test: __sp.zone('dino_volcano'). */
const DINO_ASH='#4a3f3a',DINO_ASH2='#5c4d47',DINO_BASALT=['#4a3f3a','#5c4d47','#3d3434'];
Object.assign(DINO_R,{
  dino_cinder:.2,dino_ember:.18,dino_lavarock:.8,dino_vent:.7,dino_obsidian:.6,dino_warmegg:.7,
  dino_geyser:1,dino_magma:.9,dino_basalt:1.7,dino_cindercone:1.7,dino_hotspring:3.3,dino_lookout:2.1,
  dino_spa:5,dino_lavafall:4.6,dino_crag:10.4
});
const DINO_VOLCANO_PROPS={
  /* ---- micro ---- */
  dino_cinder:(x,z)=>sized(x,z,DINO_R.dino_cinder,.22,1,'micro',P=>{
    P(mk('sph',.3,.2,.26,pick(DINO_BASALT),0,.1,0),1,true,.1);P(dinoFlat(mk('sph',.1,.06,.1,DINO_LAVA,.05,.19,.03)),1);}),
  dino_ember:(x,z)=>sized(x,z,DINO_R.dino_ember,.32,1,'micro',P=>{
    P(mk('pyr',.22,.3,.22,DINO_GLOW,0,.15,0),1,true,.1);P(mk('pyr',.14,.2,.14,DINO_LAVA,.11,.1,.05),1);}),
  /* ---- mini ---- */
  dino_lavarock:(x,z)=>sized(x,z,DINO_R.dino_lavarock,.8,1,'mini',P=>{const c=pick(DINO_BASALT); // dark rock with glowing cracks
    P(mk('sph',1.3,.8,1.1,c,0,.35,0),2);P(mk('sph',.55,.45,.55,c,-.4,.55,.15),1,true,.2);
    P(dinoFlat(dinoM('box',.8,.07,.1,DINO_LAVA,.05,.72,0,0,.5)),1);P(dinoFlat(dinoM('box',.5,.07,.09,DINO_GLOW,.25,.66,.25,0,-.6)),1);}),
  dino_vent:(x,z)=>sized(x,z,DINO_R.dino_vent,1.3,1,'mini',P=>{ // a little ring of rocks puffing steam
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;P(mk('sph',.42,.32,.42,pick(DINO_BASALT),Math.sin(a)*.36,.14,Math.cos(a)*.36),1,true,.15);}
    P(mk('cyl',.4,.05,.4,DINO_LAVA,0,.05,0),1);
    P(mk('sph',.55,.45,.55,'#ffffff',0,.62,0),1,true,.2);P(mk('sph',.38,.32,.38,'#f1f1f1',.12,1.02,-.05),1,true,.15);}),
  /* ---- tiny ---- */
  dino_obsidian:(x,z)=>sized(x,z,DINO_R.dino_obsidian,1.1,1,'tiny',P=>{ // shiny purple-black shards
    P(mk('pyr',.5,1.1,.5,'#3c096c',0,.55,0),2,false,.3);P(dinoM('pyr',.36,.75,.36,'#5a189a',.32,.32,.12,0,0,-.4),1,true,.25);
    P(dinoM('pyr',.3,.6,.3,'#c77dff',-.28,.26,-.1,.3,0,.35),1,true,.2);}),
  dino_warmegg:(x,z)=>sized(x,z,DINO_R.dino_warmegg,.8,1,'tiny',P=>{ // an egg kept cozy by warm stones
    P(dinoFlat(mk('cyl',.75,.06,.75,DINO_LAVA,0,.03,0)),1);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(mk('sph',.3,.24,.3,pick(DINO_BASALT),Math.sin(a)*.48,.1,Math.cos(a)*.48),1,true,.12);}
    dinoEggAt(P,0,0,.48,.64,.04,2);}),
  /* ---- small ---- */
  dino_geyser:(x,z)=>sized(x,z,DINO_R.dino_geyser,3.3,2,'small',P=>{ // a rock cone with a whoosh of water and steam
    P(mk('cone',1.9,1,1.9,'#8d7b68',0,.5,0),3);P(mk('cyl',.7,.12,.7,'#a0e7ff',0,1,0),1);
    P(mk('cyl',.32,1.5,.32,'#a0e7ff',0,1.7,0),1,true,.4);
    P(mk('sph',1.1,.9,1.1,'#ffffff',0,2.6,0),1,true,.4);P(mk('sph',.8,.7,.8,'#f1f1f1',.3,3.05,.1),1,true,.3);}),
  dino_magma:(x,z)=>sized(x,z,DINO_R.dino_magma,1.3,2,'small',P=>{ // a warm glowing blob with a dark crust
    P(mk('sph',1.5,1.2,1.4,'#ff9f1c',0,.6,0),3,false,.6);dinoSpots(P,0,.6,0,.74,.6,6,.42,DINO_ASH);
    P(mk('sph',.5,.3,.5,DINO_GLOW,.1,1.18,0),1,true,.2);}),
  /* ---- medium ---- */
  dino_basalt:(x,z)=>sized(x,z,DINO_R.dino_basalt,3.4,5,'medium',P=>{ // a cluster of stone columns
    const cols=[[0,0,3.4],[.95,.3,2.6],[-.85,.45,2.2],[.3,-.9,2.9],[-.6,-.7,1.6],[1,-.7,1.3]];
    cols.forEach(([x,z,h],i)=>{P(mk('cyl',.95,h,.95,DINO_BASALT[i%3],x,h/2,z),i?1:2,!!i,.5);});
    P(dinoFlat(mk('cyl',.7,.05,.7,DINO_GLOW,0,3.42,0)),1);}),
  dino_cindercone:(x,z,arg)=>sized(x,z,DINO_R.dino_cindercone,3.2,5,'medium',(P,g)=>{ // a baby volcano with a smile
    P(mk('cone',3.4,2.4,3.4,DINO_ASH2,0,1.2,0),4);P(mk('cyl',.9,.2,.9,DINO_LAVA,0,2.3,0),1);
    P(mk('sph',1.1,.9,1.1,'#ffffff',0,2.9,0),1,true,.4);dinoEyes(P,.42,1.05,1,.42);
    P(dinoFlat(mk('box',.8,.14,.2,DINO_INK,0,.6,1.3)),1);face(g,arg);}),
  /* ---- large ---- */
  dino_hotspring:(x,z,arg)=>sized(x,z,DINO_R.dino_hotspring,3,8,'large',(P,g)=>{ // a long-neck soaking in a warm pool
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;P(mk('sph',1.3,1,1.3,pick(DINO_STONE),Math.sin(a)*2.6,.4,Math.cos(a)*2.6),1,true,.5);}
    P(mk('cyl',4.8,.5,4.8,'#7fd8f0',0,.35,0),3);
    const skin='#c8b6ff';P(mk('sph',2.2,1,1.8,skin,0,.6,-.4),2);P(mk('cyl',.65,1.8,.65,skin,0,1.4,.4),2); // back + neck
    P(mk('sph',1.1,.85,1.3,skin,0,2.4,.7),2,false,.4);dinoEyes(P,.26,2.6,1.25,.32);
    P(dinoFlat(mk('box',.4,.08,.08,DINO_INK,0,2.2,1.33)),1);P(mk('box',.9,.22,.9,'#ff8fab',0,2.9,.65),1,true,.3);  // grin + towel
    for(let i=0;i<3;i++)P(mk('sph',.8,.6,.8,'#ffffff',-1.4+i*1.4,1+i*.25,-1.2+(i%2)),1,true,.3);face(g,arg);}),       // steam
  dino_lookout:(x,z,arg)=>sized(x,z,DINO_R.dino_lookout,8.6,9,'large',(P,g)=>{ // a round stone lookout tower (BP)
    const R=1.55;for(let f=0;f<2;f++){const h=f?2.6:3,y=f?3.2:0,st=f?'#a39282':'#8d7b68';
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(BP(dinoM('box',1.9,h,.55,i%2?st:'#5c4d47',Math.sin(a)*R,y+h/2,Math.cos(a)*R,0,a),f,'wall'),2);}
      P(BP(mk('cyl',3.6,.3,3.6,'#deb887',0,y+h+.05,0),f,'slab'),2);}
    P(BP(mk('cone',4.2,2,4.2,'#e76f51',0,7,0),2,'roof'),3);
    P(BP(mk('box',1,1.6,.2,DINO_INK,0,.8,R+.3),0,'extra'),1,true,.4);P(BP(mk('box',.8,.7,.16,'#a0e7ff',0,4.4,R+.3),1,'extra'),1,true,.3);
    P(BP(mk('cyl',.12,1.4,.12,DINO_WOOD,0,8.5,0),2,'extra'),1,true,.3);P(BP(mk('box',.9,.55,.06,DINO_LAVA,.45,8.9,0),2,'extra'),1,true,.3);
    face(g,arg);},{building:true}),
  /* ---- huge ---- */
  dino_spa:(x,z,arg)=>sized(x,z,DINO_R.dino_spa,10,18,'huge',(P,g)=>{ // the hot-spring spa lodge (BP)
    story(P,8,6,3,0,0,'#8d7b68',2);slab(P,7.8,5.8,3.05,0,'#deb887');
    story(P,6.8,5,2.6,3.1,1,'#c68b59',2);roofOf(P,9,7.4,2.6,7,2,'#e76f51');
    P(BP(mk('box',1.4,2,.2,DINO_INK,0,1,3.1),0,'extra'),1,true,.5);
    for(const sx of [-1,1])P(BP(mk('box',1,.9,.16,'#a0e7ff',sx*2.4,1.8,3.08),0,'extra'),1,true,.3);
    P(BP(mk('box',1.8,.6,.2,'#ff8fab',0,2.5,3.15),0,'extra'),1,true,.4);                                    // towel sign
    P(BP(mk('box',.9,2,.9,'#5c4d47',2.2,8,-1),2,'extra'),1,true,.4);                                         // chimney
    for(let i=0;i<2;i++)P(BP(mk('sph',1.3-i*.3,1-i*.2,1.3-i*.3,'#ffffff',2.2+i*.4,9.5+i*.9,-1),2,'extra'),1,true,.4);
    P(BP(mk('cyl',3.6,.4,2.4,'#7fd8f0',-2.4,.2,4.6),0,'extra'),1,true,.6);face(g,arg);                       // a little foot pool
  },{building:true}),
  dino_lavafall:(x,z,arg)=>sized(x,z,DINO_R.dino_lavafall,6.6,16,'huge',(P,g)=>{ // a smiling rock cliff with a lava fall
    P(mk('box',8.4,3.4,4.6,DINO_ASH2,0,1.7,-.4),5);P(mk('box',6.2,2.4,3.6,DINO_ASH,-.4,4.6,-.8),4);P(mk('box',3.2,1.4,2.6,DINO_ASH2,.6,6.5,-.8),2);
    P(mk('box',1.5,6.4,.4,DINO_LAVA,1.6,3.3,1.92),2,false,.5);P(mk('box',.7,6,.42,DINO_GLOW,1.6,3.4,2),1,true,.4);
    P(mk('cyl',3.4,.25,2.4,DINO_LAVA,1.6,.13,3),2);P(mk('sph',.7,.4,.7,DINO_GLOW,.9,.3,3.4),1,true,.3);
    dinoEyes(P,1.9,4.6,1.05,.9);P(dinoFlat(mk('box',1.8,.3,.2,DINO_INK,-1.9,3.6,1.9)),1);face(g,arg);}),
  /* ---- mega ---- */
  dino_crag:(x,z,arg)=>sized(x,z,DINO_R.dino_crag,15,55,'mega',(P,g)=>{ // a stepped rock mesa with lava falls (BP)
    const W=[15.6,11.6,7.6],cols=['#5c4d47','#4a3f3a','#6d5c55'];let y=0;
    for(let f=0;f<3;f++){story(P,W[f],W[f]*.9,3.6,y,f,cols[f],2);slab(P,W[f]+.4,W[f]*.9+.4,y+3.7,f,cols[(f+1)%3]);
      P(BP(mk('box',1.4,3.4,.3,DINO_LAVA,W[f]*.18,y+1.8,W[f]*.45+.5),f,'extra'),1,true,.6);                 // a lava fall on each step
      P(BP(mk('sph',1.2,.6,1.2,DINO_GLOW,-W[f]*.25,y+3.9,W[f]*.3),f+1,'extra'),1,true,.4);y+=3.85;}
    roofOf(P,5,5,2.6,y+1.3,3,'#e76f51');P(BP(mk('sph',1.2,1.2,1.2,'#ff006e',0,y+3.1,0),3,'extra'),1,true,.5);      // a red gem on top
    dinoEyes(P,2.2,2.2,7.4,1.3,0);P(BP(dinoFlat(mk('box',3,.4,.3,DINO_INK,0,1,7.3)),0,'extra'),1,true,.5);face(g,arg);
  },{building:true})
};
dinoWithSfx(DINO_VOLCANO_PROPS,{
  dino_cinder:'dino_rock',dino_lavarock:'dino_rock',dino_basalt:'dino_rock',dino_lavafall:'dino_rock',dino_crag:'dino_rock',dino_lookout:'dino_rock',
  dino_ember:'dino_crystal',dino_obsidian:'dino_crystal',dino_warmegg:'dino_egg',dino_spa:'dino_wood',dino_cindercone:'dino_volcano',
  dino_vent:'dino_steam',dino_geyser:'dino_steam',dino_hotspring:'dino_steam',dino_magma:'dino_lava'   // new clips (AU15); fall back to the zone's crash
});

/* Scenes: little volcano stories. Lava and spring spots stay in layouts (filler:false), so they never land on a road. */
const DINO_VOLCANO_SCENES={
  // eggs tucked into the warm stones around a steamy vent, a mama's footprint trail of embers
  dino_warm_nest:{size:'tiny',r:6,build(s){s.spot('dino_ash',0,0,9,9);s.place('dino_vent',0,0);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3;s.place('dino_warmegg',Math.sin(a)*2.6,Math.cos(a)*2.6);}
    for(let i=0;i<4;i++)s.place('dino_ember',-1+i*.7,4.2+i*.5);s.place('dino_obsidian',3.6,-2.6);}},
  // three geysers in a row and a ramp to jump them
  dino_geyser_row:{size:'small',r:9,build(s){s.spot('dino_ash',0,0,7,16);
    for(const z of [-5,0,5])s.place('dino_geyser',0,z);s.ramp(0,10.5,Math.PI,8,5,2.6);
    for(const [x,z] of [[-3,-3],[3,2],[-3.2,4],[3.4,-5]])s.place('dino_lavarock',x,z);s.place('dino_magma',3.6,6.5);}},
  // spa day: a long-neck in the hot spring, towel on, stones and steam vents around, a lookout keeping watch
  dino_spa_day:{size:'large',r:14,build(s){s.spot('dino_ash',0,0,22,22);s.place('dino_hotspring',0,0);s.place('dino_lookout',-8,-7);
    for(const [x,z] of [[6,-4],[7,3],[-6,5]])s.place('dino_vent',x*.9,z*.9,null,0,1.6);s.place('dino_basalt',8,-8);
    s.place('dino_warmegg',4,7,null,0,2.6);s.place('dino_warmegg',-2,8,null,0,2.6);}},
  // a lava stream with a stone bridge path across (the path is dry land, so you can drive over)
  dino_lava_bridge:{size:'medium',r:13,filler:false,build(s){s.spot('dino_lava',0,0,26,5.5,0);s.spot('dino_rockpath',0,0,5,8);
    for(const [x,z] of [[-7,4.2],[-3.5,-4.4],[4,4.4],[8,-4.2]])s.place('dino_magma',x,z);
    s.place('dino_basalt',-11,5.5);s.place('dino_basalt',11,-5.5);for(const x of [-2.6,2.6])s.place('dino_lavarock',x,5.2);}},
  // the warm-egg hatchery under the lava falls
  dino_ember_falls:{size:'huge',r:12,build(s){s.place('dino_lavafall',0,-3);for(let i=0;i<5;i++)s.place('dino_warmegg',-6+i*3,6,null,0,4.5);
    s.place('dino_cindercone',-9,-2);s.place('dino_geyser',8.5,3,null,0,2.7);}},
};

// a lava stream across one quadrant, sometimes with a stone path over it and magma lumps on the banks
function dinoLavaStream(ctx){const p=dinoPool(ctx,'dino_lava',rand(16,26),rand(4,6.5));
  if(Math.random()<.6)ctx.spot('dino_rockpath',p.x,p.z,4.5,p.d+3,p.th);
  for(let i=0;i<4;i++){const t=rand(-.5,.5)*p.w,side=i%2?1:-1,o=p.d/2+1.4;
    dinoPut(ctx,'dino_magma',p.x+Math.cos(p.th)*t+Math.sin(p.th)*side*o,p.z-Math.sin(p.th)*t+Math.cos(p.th)*side*o);}
  return p;}
function dinoAshy(ctx,dense){ // the rocky filler every volcano chunk gets some of
  dinoScatter(ctx,dense?3:2,['dino_basalt','dino_cindercone','dino_boulder']);
  dinoScatter(ctx,dense?4:2,['dino_geyser','dino_magma','dino_crystal']);
  dinoScatter(ctx,dense?5:3,['dino_lavarock','dino_vent','dino_obsidian','dino_warmegg','dino_rock']);
  dinoScatter(ctx,dense?6:4,['dino_cinder','dino_ember','dino_amber']);}

registerZone({
  id:'dino_volcano',
  letter:'V',
  ground:'#6e5a50',                         // warm dark rock
  sky:{top:'#6c9bd2',horizon:'#ffb38a'},    // a warm glowing horizon
  weight:0,                                 // Dino Land only
  music:dinoSounds(musicBank,{drive:'dino_volcano_drive',boss:'dino_volcano_boss'},{drive:'dino_drive',boss:'dino_boss'}),
  sfx:dinoSounds(sfxBank,{crash:'dino_volcano_crash',boom:'dino_boom',land:'dino_stomp',ambient:'dino_volcano_ambient'},
    {crash:'dino_rock',boom:'dino_boom',land:'dino_stomp',ambient:'dino_ambient'}),
  props:DINO_VOLCANO_PROPS,
  scenes:DINO_VOLCANO_SCENES,
  sizes:{
    micro:['dino_cinder','dino_ember','dino_amber','dino_cinder'],
    mini:['dino_lavarock','dino_vent','dino_rock'],
    tiny:['dino_obsidian','dino_warmegg','dino_warmegg'],
    small:['dino_geyser','dino_magma','dino_crystal'],
    medium:['dino_basalt','dino_cindercone','dino_boulder'],
    large:['dino_hotspring','dino_lookout','dino_ribcage'],
    huge:['dino_spa','dino_lavafall','dino_bigbones'],
    mega:['dino_crag','dino_crag','dino_temple']
  },
  // lava: hot little lumps bob in it (hover over to smash them); ash patches: vents, cinders and geysers
  spots:{
    dino_lava:{micro:['dino_ember'],mini:['dino_lavarock'],tiny:['dino_obsidian'],small:['dino_magma'],medium:['dino_basalt'],large:['dino_basalt']},
    dino_ash:{micro:['dino_cinder','dino_ember'],mini:['dino_vent','dino_lavarock'],tiny:['dino_warmegg','dino_obsidian'],small:['dino_geyser','dino_magma'],medium:['dino_cindercone','dino_basalt']},
    dino_rockpath:{micro:['dino_cinder'],mini:['dino_lavarock'],tiny:['dino_obsidian']}
  },
  spotLook:{dino_lava:'#ff7b00',dino_ash:'#4a3f3a',dino_rockpath:'#a39282',dino_spring:'#7fd8f0'},
  water:{dino_lava:2,dino_spring:1},       // lava is too hot for wheels (hover over it); the springs are for wading
  herds:[['stego',2],['trike',2]],
  layout(ctx){
    const kind=dinoMarks('dino_volcano','volcano',['crag','spa','falls','geysers','crag','spa','bridge']).get(ctx.ci+','+ctx.cj);
    if(kind==='volcano'){const p=dinoDrop(ctx,'dino_volcano',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_volcano+4,8,'dino_basalt');dinoRing(ctx,p.x,p.z,DINO_R.dino_volcano+8,10,'dino_magma',.6);}
      dinoAshy(ctx,false);return;}
    if(kind==='crag'){const p=dinoDrop(ctx,'dino_crag',0);
      if(p){dinoRing(ctx,p.x,p.z,DINO_R.dino_crag+3,7,'dino_cindercone');dinoRing(ctx,p.x,p.z,DINO_R.dino_crag+7,8,'dino_geyser',.4);}
      dinoLavaStream(ctx);dinoAshy(ctx,false);return;}
    if(kind==='spa'){const p=dinoDrop(ctx,'dino_spa',0);
      if(p){ctx.scene('dino_spa_day',p.x+(p.x<ctx.cx?16:-16),p.z+(p.z<ctx.cz?16:-16),0);dinoRing(ctx,p.x,p.z,DINO_R.dino_spa+3,6,'dino_vent');}
      dinoHerd(ctx,ctx.cx+rand(-8,8),ctx.cz+rand(-8,8),3);dinoAshy(ctx,false);return;}
    if(kind==='falls'){const p=dinoDrop(ctx,'dino_lavafall',0);if(p)ctx.scene('dino_ember_falls',p.x,p.z,0);
      dinoLavaStream(ctx);dinoAshy(ctx,false);return;}
    if(kind==='geysers'){for(const [dx,dz] of [[-20,-20],[20,20]])ctx.scene('dino_geyser_row',ctx.cx+dx,ctx.cz+dz,(Math.random()*4|0)*Math.PI/2);
      ctx.scene('dino_warm_nest',ctx.cx+20,ctx.cz-20,0);dinoAshy(ctx,false);return;}
    if(kind==='bridge'){const q=Math.random()*4|0;ctx.scene('dino_lava_bridge',ctx.cx+(q&1?20:-20),ctx.cz+(q&2?20:-20),rand(-.4,.4));
      dinoPool(ctx,'dino_spring',12,9,3-q);dinoAshy(ctx,false);return;}
    // wild slopes: a lava stream or two, ash patches, a lookout or a baby volcano now and then, a ramp
    dinoLavaStream(ctx);if(Math.random()<.35)dinoLavaStream(ctx);
    if(Math.random()<.5)ctx.scene('dino_warm_nest',rand(ctx.x0+10,ctx.x1-10),rand(ctx.z0+10,ctx.z1-10),rand(0,6.3));
    if(Math.random()<.3)dinoPut(ctx,'dino_lookout',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    if(Math.random()<.3)dinoPut(ctx,'dino_hotspring',rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),Math.random()*4|0);
    dinoAshy(ctx,true);
    if(Math.random()<.35)dinoHerd(ctx,rand(ctx.x0+12,ctx.x1-12),rand(ctx.z0+12,ctx.z1-12),2);
    if(Math.random()<.5)for(let t=0;t<6;t++)if(ctx.ramp(rand(ctx.x0+14,ctx.x1-14),rand(ctx.z0+14,ctx.z1-14),(Math.random()*4|0)*Math.PI/2))break;
  }
});
