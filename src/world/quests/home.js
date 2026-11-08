/* Smash Party — Home World quest pack (Q1). Owner: quests lane (agents/quests.md).
   Twelve quests in four chapters (spec docs/ADVENTURE.md §4, contract in CLAUDE.md "Quest"). Chapter = car tier + 1:
     1 Hank's Street (micro–mini) 🔨 Hank (MAIN: hammer) · 🍄 Garry (side: party hat) · ✉️ Zippy (side: kazoo engine)
     2 the ring round the start   🐔 Fern (MAIN: egg blaster) · 🚒 Bubbles (side: bubble trail) · 🍦 Pip (side: sprinkle trail)
       (tiny–small)
     3 farm, pond and downtown    👽 Zorp & Blip (MAIN: hover) · 🚧 Dozer Dot (side: dozer) · 🎩 Mayor Wheelie (side: confetti)
       (medium–large)
     4 the whole town (huge–GIANT) 🤖 The Big Stomp (MAIN: boss, Mayor Wheelie) · 🪁 Captain Kite (side: glide) · 🐑 Woolly (side: crown)
   No reading anywhere: every step is the giver's voice + the picture bubble (icon + dots) + the gold arrow.
   Places come from the planned Home World map (D18, objects.js): HOME_QUEST_AT has every quest's giver spot, stage
   rectangle and point lists (mailboxes, picnic blankets, parade arches, crystal pieces, kite roofs), and the layouts
   mark each stage as a `quest_<id>` spot, which the engine uses as the stage center and size. Hank's Street (ch1) is
   the start; Fern's pasture (west), the bubble fountain (north) and Pip's picnic meadow (south) ring it (ch2); the crop
   circle, water tower and duck pond are out north-west, Dot's crate yard and downtown north-east (ch3); the kite
   meadow and the fair are south, Woolly's pen south-east (ch4). The pack reads HOME_QUEST_AT and keeps a copy of
   D18's numbers as the fallback. No quest has a `stage`: every stage is already standing in the Home World (D18's
   hank_yard, garry_garden, crop_circle, crate_site, sheep_pen, duck_pond, plus the pasture, fountain plaza and picnic
   meadow built by homeMargin), so spawning one again would build it twice.
   Every top-level name here starts with `quest` (plus the shared QUEST_ITEMS table: later packs add to it with
   Object.assign(QUEST_ITEMS,{…}), never redefine it). */

/* ---------- build helpers (car scale 1, facing +Z, feet at y=0, M() colors only) ---------- */
function questAdd(g,...a){const m=mk(...a);g.add(m);return m;}
// big cartoon eyes on the front of something: y = eye height, z = front face, gap = half the distance between them
function questEyes(g,y,z,gap,size=0.62,o={}){
  for(const sx of [-1,1]){const x=sx*gap;
    questAdd(g,'sph',size,size*1.1,size*0.5,'#ffffff',x,y,z);
    questAdd(g,'sph',size*0.45,size*0.5,size*0.3,o.pupil||'#1b1b1b',x+(o.look||0)*size*0.12,y-size*0.05,z+size*0.2);
    questAdd(g,'sph',size*0.14,size*0.14,size*0.1,'#ffffff',x+size*0.08,y+size*0.12,z+size*0.33);
    if(o.lids)questAdd(g,'box',size*1.1,size*0.42,size*0.55,o.lids,x,y+size*0.36,z+0.03);          // sleepy half-lids
    if(o.brow){const b=questAdd(g,'box',size*0.95,size*0.16,size*0.2,o.brow,x,y+size*0.72,z+0.05);b.rotation.z=sx*(o.browTilt??0.3);}}}
function questSmile(g,y,z,w=0.9,col='#1b1b1b'){questAdd(g,'box',w,0.13,0.1,col,0,y,z);for(const sx of [-1,1])questAdd(g,'box',0.13,0.25,0.1,col,sx*w/2,y+0.1,z);}
function questMouthO(g,y,z,s=0.42){questAdd(g,'sph',s,s*1.1,0.15,'#5a1a1a',0,y,z);questAdd(g,'sph',s*0.55,s*0.3,0.1,'#ff8fa3',0,y-s*0.25,z+0.05);}
function questWheels(g,hw,zf,zb,r=0.55,w=0.5,col='#262626',hub='#d9d9d9'){
  for(const [x,z] of [[-hw,zf],[hw,zf],[-hw,zb],[hw,zb]]){questAdd(g,'wheel',w,r*2,r*2,col,x,r,z);questAdd(g,'wheel',w+0.04,r*0.9,r*0.9,hub,x,r,z);}}

/* ---------- giver looks ---------- */
// Hank: a teeny yellow loader in an orange hard hat, sleepy eyes, gray mustache, bucket in front
function questHankBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,1.1,3.0,'#ffbe0b',0,1.05,-0.3);questAdd(g,'box',2.0,1.3,1.7,'#ffd166',0,2.25,-0.7);
  questAdd(g,'box',1.7,0.9,0.08,'#bde0fe',0,2.35,0.16);                                          // windshield
  questEyes(g,2.45,0.22,0.42,0.55,{lids:'#ffd166'});
  questAdd(g,'box',1.0,0.22,0.2,'#8d99ae',0,1.95,0.25);for(const sx of [-1,1])questAdd(g,'sph',0.45,0.25,0.22,'#8d99ae',sx*0.45,1.88,0.26);
  questAdd(g,'cyl',2.4,0.12,2.4,'#ff9f1c',0,3.0,-0.7);questAdd(g,'sph',1.7,1.2,1.7,'#ff9f1c',0,3.05,-0.7);questAdd(g,'box',0.25,0.25,1.6,'#ffbe0b',0,3.55,-0.7);
  for(const sx of [-1,1]){const a=questAdd(g,'box',0.22,0.22,1.7,'#6c757d',sx*1.0,1.0,1.5);a.rotation.x=0.35;}
  questAdd(g,'box',2.6,0.9,0.25,'#e09f3e',0,0.55,2.35);questAdd(g,'box',2.6,0.2,0.8,'#e09f3e',0,0.15,2.05);// bucket
  questWheels(g,1.25,0.6,-1.3,0.62,0.55);return g;}
// Garry: a garden gnome (tall red hat, white beard) riding a little green lawnmower
function questGarryBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.6,0.6,3.2,'#2a9d8f',0,0.65,0);questAdd(g,'box',2.8,0.3,1.0,'#264653',0,0.4,1.5);
  for(let i=0;i<5;i++)questAdd(g,'box',0.12,0.25,0.12,'#80ed99',-1.2+i*0.6,0.3,2.1);                // grass bits
  questAdd(g,'cone',1.6,1.5,1.4,'#3a86ff',0,1.7,-0.3);questAdd(g,'sph',1.0,1.0,1.0,'#ffcdb2',0,2.55,-0.2);
  questAdd(g,'sph',0.3,0.3,0.3,'#f4978e',0,2.5,0.32);                                              // nose
  const beard=questAdd(g,'cone',0.95,1.1,0.6,'#ffffff',0,2.05,0.12);beard.rotation.x=Math.PI;
  questEyes(g,2.75,0.32,0.22,0.3);
  questAdd(g,'cone',1.05,2.0,1.05,'#e63946',0,3.85,-0.25);
  for(const sx of [-1,1]){const h=questAdd(g,'box',0.14,1.4,0.14,'#adb5bd',sx*0.7,1.6,-1.4);h.rotation.x=-0.4;}
  questAdd(g,'box',1.6,0.14,0.14,'#adb5bd',0,2.2,-1.65);
  questWheels(g,1.25,1.0,-1.1,0.38,0.35);return g;}
// Zippy: a tall white mail truck with a blue stripe and a big envelope on the roof, wide excited eyes
function questZippyBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.5,2.6,3.0,'#f8f9fa',0,1.75,-0.6);questAdd(g,'box',2.4,1.4,1.4,'#f8f9fa',0,1.15,1.5);
  questAdd(g,'box',2.56,0.35,4.4,'#3a86ff',0,1.4,0.05);questAdd(g,'box',2.56,0.18,4.4,'#e63946',0,1.15,0.05);
  questAdd(g,'box',2.0,0.9,0.08,'#bde0fe',0,2.4,0.92);questEyes(g,2.45,0.98,0.5,0.62,{brow:'#3a86ff',browTilt:-0.2});
  questMouthO(g,1.2,2.22,0.4);
  const env=questAdd(g,'box',2.0,0.12,1.4,'#fff3b0',0,3.15,-0.7);env.rotation.z=0.15;
  const flap=questAdd(g,'pyr',1.4,0.5,1.4,'#ffe066',0,3.3,-0.7);flap.rotation.z=0.15;flap.scale.set(1.4,0.35,1.0);
  questAdd(g,'sph',0.35,0.35,0.15,'#e63946',0.1,3.36,-0.7);
  for(let i=0;i<3;i++)questAdd(g,'box',0.08,0.08,0.9,'#adb5bd',-1.35,1.9+i*0.45,-2.4-i*0.25);      // speed lines
  questWheels(g,1.2,1.4,-1.4,0.55,0.5);return g;}
// Fern: a cheerful red tractor in a big straw hat with a daisy, freckles, a laughing open mouth
function questFernBuild(){const g=new THREE.Group();
  questAdd(g,'box',1.8,1.2,2.6,'#d62828',0,1.3,0.6);questAdd(g,'box',2.2,1.6,1.6,'#d62828',0,1.9,-1.1);
  questAdd(g,'box',1.9,1.0,0.08,'#bde0fe',0,2.25,-0.28);questAdd(g,'cyl',0.25,1.0,0.25,'#495057',0.5,2.2,1.4);
  questEyes(g,2.3,-0.22,0.45,0.55);for(const sx of [-1,1])for(let k=0;k<3;k++)questAdd(g,'sph',0.1,0.1,0.06,'#f4a261',sx*(0.55+k*0.13),1.85+(k%2)*0.1,-0.26);
  questMouthO(g,1.55,1.92,0.5);
  questAdd(g,'cyl',3.4,0.1,3.4,'#e9c46a',0,2.75,-1.1);questAdd(g,'cyl',1.8,0.9,1.8,'#e9c46a',0,3.2,-1.1);questAdd(g,'cyl',1.85,0.22,1.85,'#d62828',0,2.95,-1.1);
  questAdd(g,'sph',0.45,0.18,0.45,'#ffffff',0.8,3.1,-0.3);questAdd(g,'sph',0.2,0.2,0.2,'#ffd60a',0.8,3.15,-0.3);
  for(const sx of [-1,1]){questAdd(g,'wheel',0.7,2.0,2.0,'#262626',sx*1.35,1.0,-1.2);questAdd(g,'wheel',0.74,1.0,1.0,'#ffd60a',sx*1.35,1.0,-1.2);
    questAdd(g,'wheel',0.45,1.0,1.0,'#262626',sx*1.0,0.5,1.4);questAdd(g,'wheel',0.5,0.5,0.5,'#ffd60a',sx*1.0,0.5,1.4);}
  return g;}
// Bubbles: a little red fire truck rookie with a ladder, a bubble wand and bubbles floating off it, round eager eyes
function questBubblesBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,1.4,4.2,'#e63946',0,1.15,-0.2);questAdd(g,'box',2.3,1.1,1.5,'#e63946',0,2.3,0.95);
  questAdd(g,'box',2.0,0.75,0.08,'#bde0fe',0,2.45,1.72);questEyes(g,2.45,1.78,0.48,0.66,{look:1});questSmile(g,1.45,1.75,0.8,'#ffffff');
  questAdd(g,'box',2.44,0.25,4.24,'#f8f9fa',0,1.3,-0.2);
  for(const sx of [-1,1])questAdd(g,'box',0.12,0.12,3.0,'#ced4da',sx*0.5,2.05,-1.1);for(let i=0;i<6;i++)questAdd(g,'box',1.0,0.1,0.1,'#ced4da',0,2.05,-2.4+i*0.5);
  questAdd(g,'box',0.5,0.3,0.6,'#ffd60a',0,3.0,0.95);                                              // siren
  questAdd(g,'cyl',0.1,1.2,0.1,'#ffd60a',0.8,3.0,-0.8);questAdd(g,'cyl',0.7,0.1,0.7,'#ffd60a',0.8,3.65,-0.8);
  for(const [x,y,z,s] of [[1.2,4.0,-0.6,0.7],[0.5,4.6,-1.3,0.5],[1.4,4.9,-1.8,0.4]])questAdd(g,'sph',s,s,s,'#bde0fe',x,y,z);
  questWheels(g,1.2,1.3,-1.6,0.55,0.5);return g;}
// Pip: a pastel pink ice-cream truck with a giant three-scoop cone on top and a cherry, rosy cheeks
function questPipBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,2.2,4.0,'#ffafcc',0,1.55,-0.2);questAdd(g,'box',2.44,0.4,4.04,'#cdb4db',0,0.75,-0.2);
  questAdd(g,'box',2.0,0.8,0.08,'#bde0fe',0,2.1,1.82);questEyes(g,2.2,1.85,0.5,0.6,{lids:'#ffafcc'});questSmile(g,1.35,1.82,0.7);
  for(const sx of [-1,1])questAdd(g,'sph',0.45,0.3,0.1,'#ff8fab',sx*0.85,1.65,1.83);
  questAdd(g,'box',0.08,1.0,1.6,'#fff1e6',1.22,1.8,-0.6);                                           // serving window
  const cone=questAdd(g,'cone',1.0,1.6,1.0,'#e9c46a',0,3.25,-0.8);cone.rotation.x=Math.PI;
  questAdd(g,'sph',1.2,1.0,1.2,'#caffbf',0,4.1,-0.8);questAdd(g,'sph',1.05,0.9,1.05,'#ffc6ff',0,4.8,-0.8);questAdd(g,'sph',0.9,0.8,0.9,'#fdffb6',0,5.4,-0.8);
  questAdd(g,'sph',0.35,0.35,0.35,'#e63946',0,5.9,-0.8);
  questWheels(g,1.2,1.2,-1.6,0.55,0.5);return g;}
// Zorp and Blip: two tiny aliens standing on their dented saucer (tilted, one dent, a bent antenna). Zorp: tall, green,
// one big eye on a stalk. Blip: round, purple, three little eyes. Feet of the saucer at y=0.
function questZorpBuild(){const g=new THREE.Group();
  const sc=new THREE.Group();g.add(sc);sc.scale.setScalar(1.25);sc.rotation.z=0.12;sc.rotation.x=-0.06;
  questAdd(sc,'sph',4.6,0.9,4.6,'#adb5bd',0,0.6,0);questAdd(sc,'cyl',4.7,0.18,4.7,'#6c757d',0,0.6,0);
  questAdd(sc,'sph',0.9,0.5,0.6,'#868e96',1.6,0.85,1.2);                                            // the dent
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;questAdd(sc,'sph',0.32,0.32,0.32,i%2?'#ffd60a':'#80ed99',Math.cos(a)*2.15,0.55,Math.sin(a)*2.15);}
  const ant=questAdd(sc,'box',0.08,0.9,0.08,'#495057',-1.6,1.3,-0.6);ant.rotation.z=0.9;
  // Zorp
  questAdd(sc,'cyl',0.6,1.4,0.6,'#70e000',-0.6,1.75,0);questAdd(sc,'sph',0.95,0.95,0.95,'#70e000',-0.6,2.75,0);
  questAdd(sc,'cyl',0.1,0.7,0.1,'#70e000',-0.6,3.4,0);questAdd(sc,'sph',0.75,0.75,0.75,'#ffffff',-0.6,3.85,0.1);questAdd(sc,'sph',0.36,0.36,0.3,'#1b1b1b',-0.6,3.85,0.4);
  questAdd(sc,'box',0.4,0.08,0.1,'#1b1b1b',-0.6,2.55,0.45);
  // Blip
  questAdd(sc,'sph',1.5,1.4,1.5,'#9d4edd',0.85,1.7,0.1);
  for(const [x,y] of [[0.5,2.0],[0.85,2.15],[1.2,2.0]]){questAdd(sc,'sph',0.32,0.36,0.2,'#ffffff',x,y,0.78);questAdd(sc,'sph',0.15,0.16,0.1,'#1b1b1b',x,y,0.86);}
  questAdd(sc,'box',0.5,0.1,0.1,'#3c096c',0.85,1.55,0.82);for(const sx of [-1,1])questAdd(sc,'sph',0.3,0.3,0.3,'#c77dff',0.85+sx*0.55,2.45,0);
  for(const [x,y,z,s] of [[1.9,1.4,-1.0,0.6],[2.2,2.0,-1.3,0.5],[2.4,2.6,-1.5,0.4]])questAdd(g,'sph',s,s,s,'#dee2e6',x,y,z); // smoke puffs
  return g;}
// Dozer Dot: a tough little orange bulldozer with tracks, a big blade, a red bow and determined eyebrows
function questDotBuild(){const g=new THREE.Group();
  for(const sx of [-1,1]){questAdd(g,'box',0.8,0.9,3.6,'#343a40',sx*1.15,0.45,-0.2);for(let i=0;i<4;i++)questAdd(g,'wheel',0.82,0.6,0.6,'#6c757d',sx*1.15,0.45,-1.5+i*0.9);}
  questAdd(g,'box',1.8,1.2,3.0,'#fb8500',0,1.4,-0.3);questAdd(g,'box',1.7,1.2,1.4,'#ffb703',0,2.6,-0.8);
  questAdd(g,'box',1.4,0.7,0.08,'#bde0fe',0,2.7,-0.08);questEyes(g,2.75,-0.02,0.38,0.5,{brow:'#1b1b1b',browTilt:-0.35});questSmile(g,1.7,1.22,0.7);
  questAdd(g,'box',2.4,0.18,0.08,'#1b1b1b',0,1.25,1.22);for(let i=0;i<3;i++){const st=questAdd(g,'box',0.3,0.18,0.1,'#ffd60a',-0.8+i*0.8,1.25,1.25);st.rotation.z=0.6;}
  const bl=questAdd(g,'box',3.2,1.2,0.25,'#ffb703',0,0.75,2.0);bl.rotation.x=-0.15;
  for(const sx of [-1,1]){const a=questAdd(g,'box',0.2,0.2,1.0,'#6c757d',sx*0.8,0.9,1.45);a.rotation.x=0.2;}
  for(const sx of [-1,1]){const b=questAdd(g,'sph',0.7,0.45,0.5,'#e63946',sx*0.45,3.35,-0.8);b.rotation.z=sx*0.35;}questAdd(g,'sph',0.3,0.3,0.3,'#e63946',0,3.35,-0.8);
  questAdd(g,'cyl',0.3,0.3,0.3,'#ffd60a',0.6,3.35,-1.3);                                            // beacon
  return g;}
// Mayor Wheelie: a long purple limo in a tall top hat with a monocle, a big mustache and a gold sash
function questWheelieBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,1.0,5.0,'#5a189a',0,0.95,0);questAdd(g,'box',2.1,0.9,2.6,'#7b2cbf',0,1.85,-0.5);
  questAdd(g,'box',1.8,0.7,0.08,'#bde0fe',0,1.95,0.82);questEyes(g,2.0,0.88,0.42,0.55,{brow:'#1b1b1b',browTilt:0.15});
  questAdd(g,'cyl',0.62,0.62,0.06,'#ffd60a',0.42,2.0,1.07).rotation.x=Math.PI/2;                    // monocle rim
  questAdd(g,'box',0.06,0.7,0.06,'#ffd60a',0.7,1.6,1.05);
  for(const sx of [-1,1]){const m=questAdd(g,'sph',0.8,0.32,0.3,'#1b1b1b',sx*0.38,1.45,2.53);m.rotation.z=sx*-0.3;}
  const sash=questAdd(g,'box',2.44,0.3,0.2,'#ffd60a',0,1.0,0.6);sash.rotation.y=0.6;sash.scale.x=2.6;
  questAdd(g,'cyl',2.0,0.12,2.0,'#1b1b1b',0,2.36,-0.5);questAdd(g,'cyl',1.3,1.8,1.3,'#1b1b1b',0,3.3,-0.5);questAdd(g,'cyl',1.32,0.3,1.32,'#e63946',0,2.6,-0.5);
  questAdd(g,'box',0.3,0.3,0.2,'#ffd60a',0.3,1.0,2.52);questAdd(g,'box',0.3,0.3,0.2,'#ffd60a',-0.3,1.0,2.52);
  questWheels(g,1.2,1.7,-1.7,0.5,0.45,'#262626','#ffd60a');return g;}
// Captain Kite: a breezy teal hovercraft on a black skirt, big fan at the back, sunglasses, a kite flying off its mast
function questKiteBuild(){const g=new THREE.Group();
  questAdd(g,'sph',3.0,0.9,4.6,'#212529',0,0.45,0);questAdd(g,'box',2.4,1.0,3.6,'#00b4d8',0,1.25,0);questAdd(g,'box',1.9,0.9,1.6,'#90e0ef',0,2.15,0.3);
  for(const sx of [-1,1])questAdd(g,'box',0.75,0.45,0.1,'#1b1b1b',sx*0.42,2.3,1.12);questAdd(g,'box',0.3,0.08,0.1,'#1b1b1b',0,2.4,1.12);
  questSmile(g,1.55,1.82,0.9);
  questAdd(g,'cyl',2.2,2.2,0.3,'#495057',0,2.0,-1.9).rotation.x=Math.PI/2;questAdd(g,'cyl',0.4,0.4,0.4,'#ffd60a',0,2.0,-1.9).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const b=questAdd(g,'box',0.25,1.8,0.08,'#adb5bd',0,2.0,-1.9);b.rotation.z=i*Math.PI/3;}
  questAdd(g,'cyl',0.08,2.2,0.08,'#adb5bd',0.9,3.1,-0.5);
  const kite=questAdd(g,'pyr',1.3,0.12,1.3,'#ff006e',1.6,4.6,-1.2);kite.rotation.set(Math.PI/2,0,0.6);kite.scale.set(1.3,1.3,0.12);
  for(let i=0;i<4;i++)questAdd(g,'box',0.25,0.25,0.06,i%2?'#ffd60a':'#3a86ff',1.4-i*0.25,3.8-i*0.4,-1.2);
  return g;}
// Woolly: a gray-and-white sheepdog van, a shaggy mop of fur hiding its eyes, floppy ears, a pink tongue
function questWoollyBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,2.0,4.2,'#dee2e6',0,1.45,-0.2);questAdd(g,'box',2.44,0.8,2.2,'#6c757d',0,1.0,-1.1);
  questAdd(g,'box',2.0,0.7,0.08,'#bde0fe',0,2.0,1.92);
  for(let i=0;i<7;i++)questAdd(g,'sph',0.9,0.8,0.7,i%2?'#f8f9fa':'#e9ecef',-1.0+i*0.33,2.35+(i%2)*0.12,1.95);  // fur fringe over the eyes
  for(let i=0;i<5;i++)questAdd(g,'sph',1.0,0.8,1.0,'#f8f9fa',-0.8+i*0.4,2.55,0.6-i*0.55);
  questAdd(g,'sph',0.5,0.4,0.3,'#1b1b1b',0,1.5,2.1);questAdd(g,'sph',0.4,0.5,0.15,'#ff8fa3',0,1.05,2.08);
  for(const sx of [-1,1]){const e=questAdd(g,'sph',0.5,1.3,0.9,'#adb5bd',sx*1.28,2.0,1.2);e.rotation.z=sx*0.25;}
  questWheels(g,1.2,1.3,-1.6,0.55,0.5);return g;}

/* ---------- quest items (QUEST_ITEMS contract: ~1 unit at scale 1, origin at the bottom) ---------- */
const QUEST_ITEMS={
  lunchbox(){const g=new THREE.Group();questAdd(g,'box',1.3,0.85,0.8,'#3a86ff',0,0.45,0);questAdd(g,'box',1.34,0.2,0.84,'#ffbe0b',0,0.7,0);
    questAdd(g,'box',0.6,0.12,0.12,'#e63946',0,1.0,0);for(const sx of [-1,1])questAdd(g,'box',0.1,0.25,0.1,'#e63946',sx*0.3,0.92,0);return g;},
  soap(){const g=new THREE.Group();questAdd(g,'box',0.7,1.0,0.45,'#4cc9f0',0,0.5,0);questAdd(g,'cyl',0.25,0.3,0.25,'#f8f9fa',0,1.15,0);
    questAdd(g,'box',0.4,0.08,0.08,'#f8f9fa',0.15,1.32,0);for(const [x,y,s] of [[0.5,1.4,0.3],[0.7,1.7,0.22]])questAdd(g,'sph',s,s,s,'#caf0f8',x,y,0);return g;},
  egg(){const g=new THREE.Group();questAdd(g,'sph',0.75,1.0,0.75,'#fff8e7',0,0.5,0);questAdd(g,'sph',0.2,0.2,0.1,'#ffd6a5',0.2,0.65,0.33);return g;},
  crystal(){const g=new THREE.Group();const a=questAdd(g,'pyr',0.8,1.0,0.8,'#80ffdb',0,0.95,0);questAdd(g,'pyr',0.8,0.6,0.8,'#64dfdf',0,0.3,0).rotation.x=Math.PI;a.rotation.y=0.3;
    questAdd(g,'sph',0.25,0.25,0.25,'#ffffff',0.15,1.0,0.25);return g;},
  kite(){const g=new THREE.Group();const k=questAdd(g,'pyr',1.0,0.1,1.3,'#ff006e',0,0.9,0);k.rotation.x=Math.PI/2;k.scale.set(1.0,1.3,0.1);
    questAdd(g,'box',0.06,1.2,0.06,'#ffd60a',0,0.9,0.05);questAdd(g,'box',0.9,0.06,0.06,'#ffd60a',0,1.0,0.05);
    for(let i=0;i<3;i++)questAdd(g,'box',0.2,0.2,0.05,i%2?'#3a86ff':'#ffd60a',0.1*i,0.25-i*0.05,0);return g;},
  icecream(){const g=new THREE.Group();const c=questAdd(g,'cone',0.6,0.9,0.6,'#e9c46a',0,0.45,0);c.rotation.x=Math.PI;questAdd(g,'sph',0.7,0.6,0.7,'#ffc6ff',0,1.05,0);
    questAdd(g,'sph',0.2,0.2,0.2,'#e63946',0,1.4,0);return g;}
};
// pushables (built at car scale 1): Garry's runaway gnome friends
function questGarryGnome(){const g=new THREE.Group();
  questAdd(g,'cone',1.2,1.3,1.2,pick(['#3a86ff','#2a9d8f','#ffbe0b']),0,0.65,0);questAdd(g,'sph',0.75,0.75,0.75,'#ffcdb2',0,1.5,0);
  const b=questAdd(g,'cone',0.7,0.8,0.5,'#ffffff',0,1.15,0.2);b.rotation.x=Math.PI;questAdd(g,'cone',0.8,1.3,0.8,'#e63946',0,2.4,0);
  questEyes(g,1.62,0.32,0.15,0.22);return g;}

/* ---------- the quests ----------
   Voices (for AU13 casting; robot voice until cast):
   hank    Hammerhead Hank: slow, gravelly old-timer; grumpy-sweet; yawns and grumbles about his sandwich.
   garry   Garry the Gnome: tiny, whispery and very polite; says "please" and "oh my".
   zippy   Zippy the Mail Truck: talks super fast, runs words together, always in a hurry.
   fern    Farmer Fern: loud, happy country farmer; laughs at everything ("Ha-HA!").
   bubbles Bubbles the Fire Truck: eager, squeaky rookie; voice cracks when excited.
   pip     Pip the Ice-Cream Truck: sing-songy and sweet, half-sings her lines like a jingle.
   zorp    Zorp: high, squeaky alien; starts sentences, beeps. blip  Blip: low, bubbly, slow alien; finishes them, boops.
           (Zorp & Blip are one giver: lines are Zorp's, `questBlip('…')` lines are Blip's (L40 per-line voices).)
   dot     Dozer Dot: excited, shouty little kid energy; "LET'S SMASH!"
   wheelie Mayor Wheelie: booming, pompous, very proud of himself; rolls his R's.
   kite    Captain Kite: laid-back surfer dude, "duuude", slow and sunny.
   woolly  Woolly the Sheepdog Van: worried and huffy, out of breath, a little bark in it. */
/* Where things are (Q1b): D18's HOME_QUEST_AT, else the copy here (same numbers, so the pack still works if the map
   table is renamed or a quest is missing from it). */
const QUEST_HOME_AT={
  hank_lunchbox:{giver:[8,45],stage:[12,45]}, garry_gnomes:{giver:[-8,31],stage:[-13.4,33]},
  zippy_mail:{giver:[-7,44],drops:[[7.2,58],[-7.2,36],[7.2,26],[-7.2,16]]},
  fern_chickens:{giver:[-88,10.5],stage:[-97,38]}, bubbles_soap:{giver:[-9.8,-84],stage:[-22,-96]},
  pip_icecream:{giver:[9.8,84],stage:[0,96],drops:[[-24,84],[-14,106],[18,84],[16,104],[-32,100]]},
  zorp_crystal:{giver:[-230,-232],stage:[-240,-240],pieces:{hay:[-258,-224],tower:[-140,-236],pond:[-70,-246]}},
  dot_demolition:{giver:[228,-64],stage:[240,-84]},
  wheelie_parade:{giver:[372,-206],stage:[240,-200],
    rings:[[300,-160],[260,-160],[220,-160],[180,-160],[160,-200],[160,-240],[160,-280],[200,-320],[250,-320],[300,-320]]},
  kite_kites:{giver:[-80,176],stage:[-80,160],roofs:[[80,-240],[240,-240],[400,-240],[-96,-62],[-80,240]]},
  woolly_sheep:{giver:[232,262],stage:[240,236]}, big_stomp:{giver:[24,212],stage:[0,240]}};
function questHomeAt(id,k){const m=typeof HOME_QUEST_AT!=='undefined'&&HOME_QUEST_AT[id],v=m&&m[k]!=null?m[k]:(QUEST_HOME_AT[id]||{})[k];
  return k==='stage'&&v&&v.length>2?[v[0],v[1]]:v;} // D18's stage is [x,z,w,d]: the pack wants its center
// a point near a building (kites, the water-tower crystal): `d` out from its middle toward (dx,dz), so it's reachable
const questHomeBy=(p,dx,dz,d)=>{const l=Math.hypot(dx,dz)||1;return [p[0]+dx/l*d,p[1]+dz/l*d];};
const QUEST_HOME_WHEELIE={id:'wheelie',name:'Mayor Wheelie',emoji:'🎩',voice:'wheelie',at:questHomeAt('wheelie_parade','giver'),h:4.4,build:questWheelieBuild};

// ===== Chapter 1: Hank's Street (micro–mini) =====
// Hank waits on the sidewalk in front of his yard (right of the start); the lunchbox is in his dig in the front yard.
registerQuest({
  id:'hank_lunchbox',world:'home',chapter:1,main:true,
  giver:{id:'hank',name:'Hammerhead Hank',emoji:'🔨',voice:'hank',at:questHomeAt('hank_lunchbox','giver'),h:3.8,build:questHankBuild},
  stageAt:questHomeAt('hank_lunchbox','stage'),stageR:3,
  remind:['My lunchbox! In my dirt pile!','Still hungry over here!'],
  steps:[
    {do:'talk',say:['Hey there, little buddy!','I lost my lunchbox!','My SANDWICH is in there!']},
    {do:'find',item:'lunchbox',icon:'🍱',at:'stage',say:{start:'It is in the dirt by my house!',hint:'In the dirt! Go go go!',got:'My lunchbox! You found it!'}},
    {do:'bring',icon:'🍱',say:{start:'Bring it back to old Hank!',hint:'Bring it here, buddy!'}}],
  reward:{ability:'hammer',stars:2,say:['Mmm! Thank you, buddy!','Here, take my Bonk Hammer!','Now go SMASH stuff!']},
  after:['Smashing is the best, right?','Mmm. Sandwich.','Bonk bonk! Ha!']});

// Garry waits across the street; the goal is the round flowerbed in his front yard. His gnomes rolled onto the
// sidewalk and the lawn around it (the engine keeps pushables within ~1.8× the bed's size, so they start close).
const questGarryAt=(()=>{const c=questHomeAt('garry_gnomes','stage');
  return [[3.8,1.6],[3.4,-2.6],[0.8,4],[-3,-2.6],[2.2,-3.4]].map(([dx,dz])=>[c[0]+dx,c[1]+dz]);})();
registerQuest({
  id:'garry_gnomes',world:'home',chapter:1,main:false,needs:['hank_lunchbox'],
  giver:{id:'garry',name:'Garry the Gnome',emoji:'🍄',voice:'garry',at:questHomeAt('garry_gnomes','giver'),h:4.4,build:questGarryBuild},
  stageAt:questHomeAt('garry_gnomes','stage'),stageR:4,
  remind:['Push my friends home, please!'],
  steps:[
    {do:'talk',say:['Oh my! Hello there.','My gnome friends rolled away!','Could you push them home, please?']},
    {do:'push',n:5,icon:'🍄',r:14,build:questGarryGnome,at:questGarryAt,
      say:{start:'Push them into my garden!',each:['Oh, thank you!','One more friend home!','Lovely pushing!'],hint:'Into the green circle, please!',got:'Everyone is home! Oh my!'}}],
  reward:{cosmetic:'hat',stars:1,say:['You are so kind.','Please, have a party hat!']},
  after:['Tea time with my friends.','Oh my, what a nice hat.']});

// Zippy waits on the left sidewalk; the four glowing mailboxes go up and down the street.
registerQuest({
  id:'zippy_mail',world:'home',chapter:1,main:false,needs:['hank_lunchbox'],
  giver:{id:'zippy',name:'Zippy the Mail Truck',emoji:'✉️',voice:'zippy',at:questHomeAt('zippy_mail','giver'),h:3.8,build:questZippyBuild},
  remind:['Mail mail mail! Hurry hurry!'],
  steps:[
    {do:'talk',say:['Hi hi hi! No time!','Mail day! Help me, quick quick!']},
    {do:'deliver',n:4,icon:'✉️',at:questHomeAt('zippy_mail','drops'),
      say:{start:'Drive through the glowing mailboxes!',each:['Zip! Delivered!','Zoom zoom, next one!','Woo, so fast!'],hint:'The glowing ones! Go go go!',got:'All the mail is done!'}}],
  reward:{cosmetic:'kazoo',stars:1,say:['You zip like me!','Here, a kazoo engine! Bzzz!']},
  after:['Gotta go fast!','Bzzzz! Love that kazoo!']});

// ===== Chapter 2: the ring round Hank's Street (tiny–small) =====
// Fern stands at the gate of her fenced chicken pasture, west of the start; the flock and the eggs are inside it.
registerQuest({
  id:'fern_chickens',world:'home',chapter:2,main:true,
  giver:{id:'fern',name:'Farmer Fern',emoji:'🐔',voice:'fern',at:questHomeAt('fern_chickens','giver'),h:4.0,build:questFernBuild},
  stageAt:questHomeAt('fern_chickens','stage'),stageR:20,
  remind:['Catch my chickens! Ha-HA!','My chickens are loose in the pasture!'],
  steps:[
    {do:'talk',say:['Howdy, little racers! Ha-HA!','My chickens busted out of the coop!','Bump them back to me!']},
    {do:'catch',kind:'chicken',n:20,icon:'🐔',
      say:{start:'Bump every chicken!',each:['Gotcha! Ha-HA!','Bawk bawk! Nice one!','Feathers everywhere! Ha!','Keep bumping!'],hint:'Chickens! Bump them all!',got:'Every chicken is back! Ha-HA!'}},
    {do:'find',n:3,item:'egg',icon:'🥚',at:'stage',say:{start:'Ooh! They laid eggs! Grab them!',each:['An egg! Careful now!'],got:'Three eggs! Ha!'}},
    {do:'bring',icon:'🥚',say:{start:'Bring the eggs to Fern!',hint:'Bring them here, sugar!'}}],
  reward:{ability:'shoot',stars:3,say:['Ha-HA! You did it!','Take my Egg Blaster!','Push the shoot button! Pow!']},
  after:['Best chicken catchers ever! Ha!','Bawk bawk! Ha-HA!']});

// Bubbles waits by the road north of the start; the soap bottles sit round the bubble fountain, between its benches.
const questBubblesAt=(()=>{const c=questHomeAt('bubbles_soap','stage');return [0.8,2.9,5].map(a=>[c[0]+Math.sin(a)*8,c[1]+Math.cos(a)*8]);})();
registerQuest({
  id:'bubbles_soap',world:'home',chapter:2,main:false,
  giver:{id:'bubbles',name:'Bubbles the Fire Truck',emoji:'🚒',voice:'bubbles',at:questHomeAt('bubbles_soap','giver'),h:4.4,build:questBubblesBuild},
  stageAt:questHomeAt('bubbles_soap','stage'),stageR:8,
  remind:['Soap! Find the soap bottles!'],
  steps:[
    {do:'talk',say:['Oh! Hi! I am Bubbles!','The bubble fountain is all clogged!','I need soap! Lots of soap!']},
    {do:'find',n:3,item:'soap',icon:'🧴',at:questBubblesAt,say:{start:'Find three soap bottles!',each:['Soap! Yes yes yes!','One more! You got this!'],hint:'Look by the fountain!',got:'All the soap!'}},
    {do:'bring',icon:'🧴',say:{start:'Bring it to me! Hurry!',hint:'Over here! It is me!'}}],
  reward:{cosmetic:'bubbles',stars:1,say:['Bubbles everywhere! Wheee!','Now YOU make bubbles too!']},
  after:['Pop pop pop! Hee!','I love bubbles so much!']});

// Pip waits by the road south of the start; the drop spots are the picnic blankets on the meadow.
registerQuest({
  id:'pip_icecream',world:'home',chapter:2,main:false,
  giver:{id:'pip',name:'Pip the Ice-Cream Truck',emoji:'🍦',voice:'pip',at:questHomeAt('pip_icecream','giver'),h:6.2,build:questPipBuild},
  stageAt:questHomeAt('pip_icecream','stage'),stageR:9,
  remind:['Ice cream for the picnics! La la!'],
  steps:[
    {do:'talk',say:['La la la! Hello, sweeties!','Everyone at the picnic wants ice cream!']},
    {do:'deliver',n:5,icon:'🍦',at:questHomeAt('pip_icecream','drops'),
      say:{start:'Drive to the picnic blankets!',each:['Yum yum! La la!','Sprinkles for you!','Ice cream time!'],hint:'The glowing blankets, sweetie!',got:'Everyone has ice cream!'}}],
  reward:{cosmetic:'sprinkles',stars:1,say:['You are so sweet!','Have a sprinkle trail! La la!']},
  after:['Ding ding! Ice cream!','Sprinkles make it better!']});

// ===== Chapter 3: the farm, the duck pond and downtown (medium–large) =====
// Zorp & Blip stand by their crashed saucer in the crop circle. The crystal broke in three: one in a haystack at the
// edge of the circle (smash the new bales by the big haystack and it pops out of the last one: bring it to the
// saucer), one at the foot of the farm's water tower, one on the treasure chest on the duck pond's island (bump the
// chest to grab it). Then back to the saucer. Zorp (high, beeps) starts the sentences, Blip (low, boops) finishes them.
const questBlip=t=>({text:t,voice:'blip'});
const questZorpPieces=(()=>{const P=questHomeAt('zorp_crystal','pieces')||{},c=questHomeAt('zorp_crystal','stage'),h=P.hay||[c[0]-18,c[1]+16];
  // three bales between the big haystack and the circle's middle (inside the flattened ring, off the corn)
  const dx=c[0]-h[0],dz=c[1]-h[1],l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
  const hay=[[9,0],[13,-5],[13,5]].map(([a,b])=>[h[0]+ux*a-uz*b,h[1]+uz*a+ux*b]);
  const tw=P.tower||[-140,-236];
  // D18's duck_pond scene stands at (-80,-240) with its island chest at (+1.6,+0.6); `lift` sits the piece on top
  return {hay,far:[questHomeBy(tw,0,1,11),[-78.4,-239.4]]};})(); // the tower piece lies on its ramp side (+Z)
registerQuest({
  id:'zorp_crystal',world:'home',chapter:3,main:true,
  giver:{id:'zorp',name:'Zorp and Blip',emoji:'👽',voice:'zorp',at:questHomeAt('zorp_crystal','giver'),h:4.6,r:2.8,build:questZorpBuild},
  stageAt:questHomeAt('zorp_crystal','stage'),stageR:9,
  remind:['Beep! The crystal pieces!',questBlip('Pieces, please. Boop.')],
  steps:[
    {do:'talk',say:['Beep boop! Earth friends!',questBlip('Hellooo. Boop.'),'Our saucer went CRASH!',questBlip('Our crystal broke. Boop.')]},
    {do:'smash',n:3,type:'hay',icon:'🌾',at:questZorpPieces.hay,reveal:'crystal',revealIcon:'💎',
      say:{start:'One piece is in a haystack!',each:['Not this one! Beep!',questBlip('Hay everywhere. Boop.')],hint:['Smash the haystacks! Beep!',questBlip('Smash the hay. Boop.')],got:'A crystal piece! Beep beep!'}},
    {do:'bring',icon:'💎',say:{start:questBlip('To the saucer. Boop.'),hint:'Back to the saucer! Beep!'}},
    {do:'find',n:2,item:'crystal',icon:'💎',at:questZorpPieces.far,lift:true,
      say:{start:'Water tower! Duck pond! Two pieces! Beep!',each:[questBlip('Piece number two. Boop.')],hint:['The water tower! Beep!','The duck pond! Quack! Beep!',questBlip('On the treasure chest. Boop.')],got:'All the pieces! Beep boop!'}},
    {do:'bring',icon:'💎',say:{start:'Bring the pieces to the saucer!',hint:['Back to the saucer! Beep!',questBlip('Saucer. This way. Boop.')]}}],
  reward:{ability:'hover',stars:3,say:['The crystal works! Beep boop!',questBlip('Hold jump in the air.'),'Now you can float! Wooo!']},
  after:['Wooo! Floaty! Beep!',questBlip('Earth is so smashy. Boop.')]});

// Dot waits outside the gate of her fenced crate yard (D18's crate_site); the 40 crates and barrels spawn inside its
// fence on a jittered 8×5 grid (a random spot in the stage circle would spill out of the yard and onto Dot), round
// the two scaffold towers.
const questDotAt=(()=>{const c=questHomeAt('dot_demolition','stage'),out=[];let k=0;
  for(let j=0;j<5;j++)for(let i=0;i<8;i++){k++;let x=-17.5+i*5+Math.sin(k*12.9898)*1.2,z=-12+j*5.6+Math.cos(k*78.233)*1.2;
    for(const [tx,tz] of [[-6,-1],[6,-2]]){const d=Math.hypot(x-tx,z-tz);if(d<3.6){x=tx+(x-tx)/(d||1)*3.6;z=tz+(z-tz)/(d||1)*3.6;}}
    out.push([c[0]+x,c[1]+z]);}
  return out;})();
registerQuest({
  id:'dot_demolition',world:'home',chapter:3,main:false,
  giver:{id:'dot',name:'Dozer Dot',emoji:'🚧',voice:'dot',at:questHomeAt('dot_demolition','giver'),h:4.0,build:questDotBuild},
  stageAt:questHomeAt('dot_demolition','stage'),stageR:8,
  remind:['The crates! SMASH THEM ALL!'],
  steps:[
    {do:'talk',say:['HI! I am Dozer Dot!','It is DEMOLITION DAY!','LET\'S SMASH!']},
    {do:'smash',n:40,type:['crates','crates','barrel'],icon:'📦',at:questDotAt,
      say:{start:'Smash every crate! GO!',each:['YEAH! SMASH!','KABOOM! More!','So many crates! WOO!','Barrel BOOM!'],hint:'More crates! SMASH!',got:'ALL SMASHED! YEAH!'}}],
  reward:{ability:'dozer',stars:3,say:['You are SO strong!','Take my dozer blade! PUSH!']},
  after:['SMASH! Ha ha!','Every day is demolition day!']});

// Mayor Wheelie waits by city hall; the balloon arches loop round downtown's main streets.
registerQuest({
  id:'wheelie_parade',world:'home',chapter:3,main:false,
  giver:QUEST_HOME_WHEELIE,
  remind:['Through the balloon arches, my friends!'],
  steps:[
    {do:'talk',say:['I am Mayor Wheelie! Marvelous!','Today is my parade!','You shall lead it!']},
    {do:'rings',n:10,icon:'🎈',at:questHomeAt('wheelie_parade','rings'),
      say:{start:'Drive through the balloon arches!',each:['Splendid!','Wave to the crowd!','Magnificent driving!','Onward!'],hint:'The golden arch! That way!',got:'What a parade! Bravo!'}}],
  reward:{cosmetic:'confetti',stars:2,say:['A parade fit for a mayor!','Confetti for you! Hooray for me!']},
  after:['Have you seen my hat? Splendid!','I am a marvelous mayor.']});

// ===== Chapter 4: the whole town (huge–GIANT) =====
// For the finale the mayor waits at the fair (same giver, its own spot), where the robot comes stomping in.
registerQuest({
  id:'big_stomp',world:'home',chapter:4,main:true,
  giver:Object.assign({},QUEST_HOME_WHEELIE,{at:questHomeAt('big_stomp','giver')}),
  stageAt:questHomeAt('big_stomp','stage'),
  remind:['The robot! Stop the giant robot!'],
  steps:[
    {do:'talk',say:['Help! Help! Oh dear!','A GIANT ROBOT is coming!','Save my town, my friends!']},
    {do:'boss',icon:'🤖',say:{start:'Here it comes! Smash it!',hint:'Smash the robot! Hurry!'}},
    {do:'talk',say:['You did it! Hooray!','Look! Zorp and Blip!','The robot battery fixed their crystal!']}],
  reward:{stars:4,say:['You saved Smashville!','You are the best heroes ever!']},
  after:['Hooray for the heroes!','My town is saved! Marvelous!']});

// Captain Kite waits on the kite meadow; the wind blew his kites onto the roofs of the big buildings (school,
// skyscraper, city hall, Fern's barn, the ferris wheel). `lift` sits each kite on top of its building: bump the
// building (or knock it down) to grab it.
const questKiteAt=questHomeAt('kite_kites','roofs');
registerQuest({
  id:'kite_kites',world:'home',chapter:4,main:false,
  giver:{id:'kite',name:'Captain Kite',emoji:'🪁',voice:'kite',at:questHomeAt('kite_kites','giver'),h:5.2,build:questKiteBuild},
  stageAt:questHomeAt('kite_kites','stage'),
  remind:['My kites, dude! All over town!'],
  steps:[
    {do:'talk',say:['Duuude. Hey.','A big wind blew my kites away.','Bummer. Can you find them?']},
    {do:'find',n:5,item:'kite',icon:'🪁',at:questKiteAt,lift:true,
      say:{start:'Five kites! Follow the arrow, dude!',each:['Righteous!','Gnarly find, dude!','So rad!'],hint:['Follow the arrow, dude!','Up on the roof! Bump it, dude!'],got:'All my kites! Duuude!'}},
    {do:'bring',icon:'🪁',say:{start:'Bring them back, dude!',hint:'Over here, little dude!'}}],
  reward:{ability:'glide',stars:2,say:['Totally awesome, dude!','Take some wings! Hold jump!','Glide like a kite!']},
  after:['Catch the wind, dude!','So chill. So breezy.']});

// Woolly waits by the pen's open gate (D18's sheep_pen, gate facing +Z); the goal circle is the pen, and the eight
// sheep start out on the meadow round it (in front of the gate and along the sides).
const questWoollyAt=(()=>{const c=questHomeAt('woolly_sheep','stage');
  return [[0,22],[-19,14],[19,14],[10,22],[-20,4],[20,5],[-21,-6],[21,-6]].map(([dx,dz])=>[c[0]+dx,c[1]+dz]);})();
registerQuest({
  id:'woolly_sheep',world:'home',chapter:4,main:false,
  giver:{id:'woolly',name:'Woolly the Sheepdog Van',emoji:'🐑',voice:'woolly',at:questHomeAt('woolly_sheep','giver'),h:4.0,build:questWoollyBuild},
  stageAt:questHomeAt('woolly_sheep','stage'),stageR:6,
  remind:['The sheep! Push them in the pen! Huff!'],
  steps:[
    {do:'talk',say:['Huff, huff! Oh no, oh no!','My sheep got out!','Push them into the pen! Woof!']},
    {do:'push',n:8,kind:'sheep',icon:'🐑',r:5,at:questWoollyAt,
      say:{start:'Push the sheep in the circle!',each:['Phew! One is safe!','Good push! Woof!','Baa! In you go!'],hint:'Into the green circle! Huff!',got:'All my sheep! Phew!'}}],
  reward:{cosmetic:'crown',stars:2,say:['You saved my sheep!','Here, a crown! Woof woof!']},
  after:['Phew. All safe. Woof.','Baa baa! Huff!']});
