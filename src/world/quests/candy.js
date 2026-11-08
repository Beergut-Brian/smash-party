/* Smash Party — Candy Land quest pack (Q3). Owner: quests lane (agents/quests.md). Outline: docs/worlds/candy.md.
   Twelve quests in four chapters (chapter = car tier + 1; the portal drops you at micro, so chapter 1 is toy scale):
     1 Frosting Lane (micro–mini)    🧁 Baker Bun (MAIN: cherry hat) · 🍬 Minty (side: gumball trail) · 🍪 Sergeant Snap (side: band hat)
     2 Gumdrop Forest (tiny–small)   🍭 Lolly Lou (MAIN: 🍭 Sugar Rush) · ☕ Cocoa (side) · 🍩 Officer Glaze (side: siren engine)
     3 Chocolate River               ⚓ Captain Wafer (MAIN) · 💎 Jawbreaker Jo (side) · 🥤 Fizzy (side: burp horn)
       (medium–large)
     4 Ice-Cream Mountains + the     🎂 Baker Bun: Sir Sprinkles (MAIN: boss sirsprinkles) · 🍨 Sundae (side: rainbow trail) ·
       cake plaza (huge–GIANT)       ☁️ Puff (side)
   You arrive with every Home World ability, so the river is hover country and the mountain is jump-and-float country.
   Places: the zone-candy lane fills registerWorld({id:'candy', questAt:{…}}) in candy_land.js (Z6 part 2: giver,
   stage [x,z,w,d] and point lists, keys as in the outline's spot checklist) and marks each stage as a `quest_<id>` spot.
   Until then the pack uses the fallback numbers in QUEST_CANDY_AT, read off CANDY_LAND_PLAN (start on Candy Meadow at
   (−157,350), the Gumdrop Forest west of it, the chocolate river down x≈20, the mountains along the north), so every
   quest plays today. No quest has a `stage` scene: the zone lane builds the scenery into the layouts (like Q1b).
   Every top-level name here starts with `quest`; helpers from home.js (questAdd, questEyes, questSmile, questMouthO,
   questWheels) are shared, and QUEST_ITEMS gets new looks with Object.assign. */

/* ---------- where things are ---------- */
// fallback spots (world units). Roads run every 160 (x and z = −320, −160, 0, 160, 320); givers stand off them.
const QUEST_CANDY_AT={
  bun_cherries:{giver:[-150,343],stage:[-146,334,12,20],cherries:{street:[-151,329],roof:[-141,341]}},
  minty_gumballs:{giver:[-167,344],stage:[-171,336,14,14]},
  snap_march:{giver:[-167,328],stage:[-158,340,30,30]},
  lolly_cubs:{giver:[-276,346],stage:[-302,352,40,40]},
  cocoa_cups:{giver:[-328,292],stage:[-300,220,70,50],drops:[[-350,258],[-298,248],[-262,182],[-346,192],[-292,138]]},
  glaze_donuts:{giver:[-238,174],stage:[-250,192,40,40]},
  wafer_rings:{giver:[40,62],stage:[22,40,80,60],rings_at:{river:[20,34],bridge:[19,84],island:[21,4],falls:[20,-28]}},
  jo_quarry:{giver:[48,-46],stage:[72,-70,60,50]},
  fizzy_hoops:{giver:[40,148]},
  bun_sprinkles:{giver:[-62,-128],stage:[-80,-160,140,100]},
  sundae_summit:{giver:[-118,-252],stage:[-150,-300,120,120],summit:[-160,-328],summitH:3},
  puff_sheep:{giver:[190,-252],stage:[220,-300,120,80]}};
function questCandyAt(id,k){
  const W=typeof WORLDS!=='undefined'&&WORLDS.candy,m=W&&W.questAt&&W.questAt[id],v=m&&m[k]!=null?m[k]:(QUEST_CANDY_AT[id]||{})[k];
  return k==='stage'&&v&&v.length>2?[v[0],v[1]]:v;} // questAt's stage is [x,z,w,d]: the pack wants its center
const questCandyLoop=(c,r,n,a0=0)=>Array.from({length:n},(_,i)=>{const a=a0+i/n*Math.PI*2;return [c[0]+Math.sin(a)*r,c[1]+Math.cos(a)*r];});
const questCandyPts=(id,k,fb)=>{const v=questCandyAt(id,k);return Array.isArray(v)&&Array.isArray(v[0])&&v.length?v:fb();};
// a named point map from questAt ({street, roof} …) as a list, else null
const questCandyMap=(id,k,keys)=>{const v=questCandyAt(id,k);if(!v)return null;const l=keys.map(n=>v[n]).filter(Boolean);return l.length?l:null;};

/* ---------- giver looks (car scale 1, ~4.5 long, facing +Z, feet at y=0, M() colors) ---------- */
// Baker Bun: a round puffy cream bun on a little cake-delivery scooter, a tall baker's hat, rosy cheeks, a whisk
function questBunBuild(){const g=new THREE.Group();
  questAdd(g,'box',1.6,0.35,3.6,'#ff8fab',0,0.75,0);questAdd(g,'box',1.4,1.0,1.4,'#ffc2d1',0,1.3,-1.1);      // scooter + cake box
  questAdd(g,'box',1.42,0.2,1.42,'#ffffff',0,1.75,-1.1);questAdd(g,'sph',0.3,0.3,0.3,'#e63946',0,1.95,-1.1);
  questAdd(g,'cyl',0.12,1.4,0.12,'#adb5bd',0,1.5,1.5).rotation.x=-0.3;questAdd(g,'box',1.4,0.14,0.14,'#adb5bd',0,2.2,1.7);
  questAdd(g,'sph',2.4,2.1,2.2,'#f3d5a6',0,2.15,0.1);questAdd(g,'sph',2.2,0.6,2.0,'#fff3e0',0,3.0,0.1);    // the bun + its cream top
  questEyes(g,2.45,1.12,0.42,0.52);for(const sx of [-1,1])questAdd(g,'sph',0.45,0.3,0.12,'#ff8fa3',sx*0.75,2.0,1.12);
  questSmile(g,1.7,1.18,0.6);
  questAdd(g,'cyl',1.3,1.3,1.3,'#ffffff',0,3.85,0.1);for(const [x,z] of [[-0.45,0],[0.45,0],[0,0.4],[0,-0.4]])questAdd(g,'sph',0.9,0.7,0.9,'#ffffff',x,4.55,0.1+z); // baker's hat
  questAdd(g,'cyl',0.08,0.9,0.08,'#adb5bd',0.95,1.5,-0.3);for(let i=0;i<3;i++)questAdd(g,'sph',0.35,0.6,0.35,'#ced4da',0.95,2.15,-0.3).rotation.y=i;  // whisk
  for(const z of [1.2,-1.3]){questAdd(g,'wheel',0.4,0.9,0.9,'#262626',0,0.45,z);questAdd(g,'wheel',0.44,0.45,0.45,'#ff8fab',0,0.45,z);}
  return g;}
// Minty: a peppermint-swirl race car with mint-candy wheels and a little wrapper spoiler
function questMintyBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,0.9,4.4,'#ffffff',0,0.85,0);for(let i=0;i<5;i++)questAdd(g,'box',2.44,0.92,0.35,'#e63946',0,0.85,-1.8+i*0.9).rotation.y=0.35;
  questAdd(g,'sph',1.9,1.1,2.0,'#ffffff',0,1.55,-0.3);questAdd(g,'box',1.6,0.5,0.08,'#bde0fe',0,1.75,0.68);
  questEyes(g,1.8,0.74,0.42,0.5,{lids:'#ffffff'});questSmile(g,1.05,2.22,0.8);
  for(const sx of [-1,1])questAdd(g,'pyr',0.7,0.5,0.6,'#80ffdb',sx*0.9,1.9,-2.3);questAdd(g,'box',2.0,0.12,0.6,'#80ffdb',0,1.9,-2.3); // wrapper spoiler
  for(const [x,z] of [[-1.25,1.4],[1.25,1.4],[-1.25,-1.4],[1.25,-1.4]]){questAdd(g,'wheel',0.5,1.1,1.1,'#ffffff',x,0.55,z);
    for(let i=0;i<3;i++){const s=questAdd(g,'box',0.52,1.0,0.2,'#06d6a0',x,0.55,z);s.rotation.x=i*Math.PI/3;}}
  return g;}
// Sergeant Snap: a gingerbread soldier on a cookie tricycle, icing buttons, a tall band hat with a gumdrop, a drum
function questSnapBuild(){const g=new THREE.Group(),C='#c68642';
  questAdd(g,'box',0.8,0.3,3.2,'#ffe8d6',0,0.8,0);questAdd(g,'wheel',0.4,1.5,1.5,'#d4a373',0,0.75,1.4);questAdd(g,'wheel',0.42,0.5,0.5,'#ffffff',0,0.75,1.4);
  for(const sx of [-1,1]){questAdd(g,'wheel',0.35,1.0,1.0,'#d4a373',sx*1.0,0.5,-1.2);questAdd(g,'wheel',0.37,0.4,0.4,'#ffffff',sx*1.0,0.5,-1.2);}
  questAdd(g,'box',1.6,1.8,0.9,C,0,1.9,-0.3);for(let i=0;i<3;i++)questAdd(g,'sph',0.22,0.22,0.12,['#e63946','#06d6a0','#ffd60a'][i],0,2.4-i*0.45,0.17);
  questAdd(g,'box',1.62,0.12,0.92,'#ffffff',0,1.15,-0.3);for(const sx of [-1,1])questAdd(g,'box',0.4,1.2,0.4,C,sx*1.0,2.05,0.1).rotation.x=-0.8;
  questAdd(g,'sph',1.4,1.3,1.2,C,0,3.4,-0.3);questEyes(g,3.55,0.28,0.3,0.4);questSmile(g,3.05,0.3,0.5,'#ffffff');
  questAdd(g,'cyl',1.1,1.6,1.1,'#e63946',0,4.65,-0.3);questAdd(g,'cyl',1.14,0.2,1.14,'#ffd60a',0,3.95,-0.3);questAdd(g,'sph',0.55,0.45,0.55,'#06d6a0',0,5.6,-0.3); // band hat
  questAdd(g,'box',1.0,0.12,0.12,'#ffd60a',0,3.85,0.32);
  questAdd(g,'cyl',1.2,0.7,1.2,'#ffffff',0,1.65,1.0);questAdd(g,'cyl',1.22,0.15,1.22,'#e63946',0,1.95,1.0);questAdd(g,'cyl',1.22,0.15,1.22,'#e63946',0,1.35,1.0); // drum
  return g;}
// Lolly Lou: a little go-kart with a giant swirly lollipop for a head, licorice pigtails, a sparkle sticker
function questLollyBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.2,0.6,3.8,'#7209b7',0,0.6,0);questAdd(g,'box',2.24,0.2,3.84,'#f72585',0,0.85,0);
  questAdd(g,'pyr',0.6,0.6,0.1,'#ffd60a',1.13,0.65,0).rotation.z=Math.PI/2;
  questAdd(g,'cyl',0.25,1.8,0.25,'#ffffff',0,1.8,-0.2);
  questAdd(g,'cyl',2.8,0.5,2.8,'#ff4d6d',0,3.6,-0.2).rotation.x=Math.PI/2;                           // the lollipop head
  for(let i=0;i<4;i++)questAdd(g,'cyl',2.4-i*0.6,0.52+i*0.01,2.4-i*0.6,i%2?'#ff4d6d':'#ffffff',0,3.6,-0.18).rotation.x=Math.PI/2;
  questEyes(g,3.9,0.12,0.5,0.6);questSmile(g,3.15,0.1,0.8);
  for(const sx of [-1,1]){for(let k=0;k<3;k++){const p=questAdd(g,'cyl',0.22,0.8,0.22,'#1b1b1b',sx*(1.6+k*0.25),3.9-k*0.55,-0.2);p.rotation.z=sx*0.6;}
    questAdd(g,'sph',0.35,0.35,0.35,'#f72585',sx*1.5,4.2,-0.2);}                                  // licorice pigtails
  questWheels(g,1.1,1.3,-1.3,0.45,0.45,'#262626','#ffd60a');return g;}
// Cocoa: a hot-chocolate truck shaped like a mug, a marshmallow lid, steam swirls, cozy sleepy eyes
function questCocoaBuild(){const g=new THREE.Group();
  questAdd(g,'cyl',3.0,2.6,3.6,'#ffffff',0,1.7,-0.3);questAdd(g,'cyl',2.7,0.2,3.3,'#7f4f24',0,3.0,-0.3);
  for(let i=0;i<4;i++)questAdd(g,'cyl',3.04,0.25,3.64,i%2?'#ff8fab':'#bde0fe',0,0.8+i*0.55,-0.3);
  const h=questAdd(g,'cyl',1.6,0.4,1.6,'#ffffff',1.75,1.8,-0.3);h.rotation.z=Math.PI/2;questAdd(g,'cyl',0.9,0.45,0.9,'#7f4f24',1.75,1.8,-0.3).rotation.z=Math.PI/2; // handle
  questAdd(g,'box',1.8,1.4,1.4,'#fff3e0',0,3.55,-0.3);questAdd(g,'box',1.82,0.2,1.42,'#ffe8d6',0,4.2,-0.3); // marshmallow lid
  questEyes(g,2.1,1.3,0.48,0.55,{lids:'#ffffff'});questSmile(g,1.4,1.4,0.6);
  for(const [x,y,z,s] of [[-0.5,4.8,-0.3,0.6],[0.2,5.4,-0.5,0.5],[-0.2,6.0,-0.4,0.4]])questAdd(g,'sph',s,s*1.4,s,'#e9ecef',x,y,z);
  questWheels(g,1.35,1.0,-1.6,0.5,0.45);return g;}
// Officer Glaze: a donut-shaped police car with pink frosting and sprinkles, a sprinkle siren on the roof, a badge
function questGlazeBuild(){const g=new THREE.Group();
  const d=questAdd(g,'cyl',4.2,1.3,4.2,'#e9c46a',0,0.95,0);questAdd(g,'cyl',4.0,0.35,4.0,'#ff8fab',0,1.65,0);questAdd(g,'cyl',1.3,1.36,1.3,'#ffffff',0,0.95,0);d.castShadow=true;
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=1.3+(i%3)*0.25;const s=questAdd(g,'box',0.4,0.1,0.1,['#3a86ff','#ffd60a','#06d6a0','#ffffff'][i%4],Math.sin(a)*r,1.85,Math.cos(a)*r);s.rotation.y=a*2;}
  questEyes(g,1.25,2.05,0.5,0.55,{brow:'#1b1b1b',browTilt:0.1});questSmile(g,0.7,2.1,0.6);
  questAdd(g,'box',1.4,0.4,0.6,'#3a86ff',0,2.05,-0.7);questAdd(g,'box',0.7,0.42,0.62,'#e63946',0.35,2.05,-0.7);  // the siren
  questAdd(g,'pyr',0.5,0.5,0.1,'#ffd60a',1.6,1.0,1.4).rotation.z=Math.PI/2;                         // badge
  for(const [x,z] of [[-1.6,1.1],[1.6,1.1],[-1.6,-1.1],[1.6,-1.1]])questAdd(g,'wheel',0.4,0.7,0.7,'#262626',x,0.35,z);
  return g;}
// Captain Wafer: a wafer-cookie riverboat with a paddle wheel, a captain's hat and a big whipped-cream beard
function questWaferBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.8,1.0,4.6,'#e9c46a',0,0.6,0);for(let i=0;i<5;i++)questAdd(g,'box',2.84,0.08,0.08,'#bc8a5f',0,0.95,-2+i*1.0);
  questAdd(g,'box',2.2,1.4,2.0,'#f4d58d',0,1.8,-0.2);questAdd(g,'box',2.0,0.6,0.08,'#bde0fe',0,2.1,0.82);
  questEyes(g,2.2,0.88,0.45,0.5,{brow:'#ffffff'});
  for(const [x,y,s] of [[0,1.4,1.0],[-0.5,1.25,0.7],[0.5,1.25,0.7],[0,1.05,0.6]])questAdd(g,'sph',s,s,0.6,'#ffffff',x,y,1.0);  // whipped-cream beard
  questAdd(g,'cyl',2.0,0.5,2.0,'#1b263b',0,2.75,-0.2);questAdd(g,'cyl',2.2,0.12,2.2,'#1b263b',0,2.5,-0.2);questAdd(g,'box',0.5,0.4,0.1,'#ffd60a',0,2.75,0.82);
  questAdd(g,'cyl',2.2,1.0,2.2,'#e63946',0,1.1,-2.6).rotation.z=Math.PI/2;for(let i=0;i<4;i++){const p=questAdd(g,'box',1.05,2.3,0.15,'#bc8a5f',0,1.1,-2.6);p.rotation.x=i*Math.PI/4;}
  questAdd(g,'cyl',0.4,1.3,0.4,'#7f4f24',0.6,3.3,-0.6);questAdd(g,'sph',0.5,0.6,0.5,'#e9ecef',0.6,4.2,-0.6);
  return g;}
// Jawbreaker Jo: a round stubborn rock-candy truck, a striped jawbreaker cab, big square teeth in the grille, a pickaxe
function questJoBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.6,1.2,4.6,'#4cc9f0',0,1.0,-0.2);for(const [x,z,c] of [[-0.6,-1.4,'#f72585'],[0.5,-1.0,'#ffd60a'],[0,-2.0,'#80ffdb']])questAdd(g,'pyr',0.8,1.0,0.8,c,x,2.0,z); // rock candy in the back
  questAdd(g,'sph',2.4,2.2,2.2,'#ff006e',0,2.2,1.0);for(let i=0;i<3;i++)questAdd(g,'sph',2.44-i*0.02,0.3,2.24,['#ffd60a','#4cc9f0','#ffffff'][i],0,1.6+i*0.55,1.0);
  questEyes(g,2.75,2.05,0.45,0.5,{brow:'#1b1b1b',browTilt:-0.3});
  for(let i=0;i<5;i++)questAdd(g,'box',0.36,0.42,0.1,'#ffffff',-0.8+i*0.4,1.0,2.15);questAdd(g,'box',2.1,0.1,0.1,'#1b1b1b',0,0.75,2.15);
  const pk=questAdd(g,'box',0.12,1.8,0.12,'#7f5539',1.35,1.8,-0.8);pk.rotation.x=0.3;const hd=questAdd(g,'box',0.12,0.15,1.3,'#adb5bd',1.35,2.65,-0.55);hd.rotation.x=0.3;
  questWheels(g,1.3,1.4,-1.6,0.6,0.55,'#262626','#f72585');return g;}
// Fizzy: a soda-bottle jet-ski with a bendy straw for a mast and bubbles popping out the back
function questFizzyBuild(){const g=new THREE.Group();
  const b=questAdd(g,'cyl',1.8,4.2,1.8,'#06d6a0',0,0.95,-0.2);b.rotation.x=Math.PI/2;questAdd(g,'cone',1.8,1.0,1.8,'#06d6a0',0,0.95,2.4).rotation.x=Math.PI/2;
  questAdd(g,'cyl',0.7,0.4,0.7,'#e63946',0,0.95,3.0).rotation.x=Math.PI/2;questAdd(g,'cyl',1.84,1.2,1.84,'#ffd60a',0,0.95,0.3).rotation.x=Math.PI/2; // cap + label
  questAdd(g,'box',2.8,0.3,1.4,'#118ab2',0,0.3,-0.4);
  questEyes(g,1.4,1.2,0.42,0.48,{look:1});questMouthO(g,0.85,1.25,0.32);
  questAdd(g,'cyl',0.18,2.4,0.18,'#ff006e',0,2.8,-0.8);const st=questAdd(g,'cyl',0.18,1.0,0.18,'#ff006e',0.3,4.15,-0.8);st.rotation.z=-0.9; // bendy straw
  for(let i=0;i<5;i++)questAdd(g,'box',0.2,0.04,0.2,'#ffffff',0,1.8+i*0.4,-0.8);
  for(const [x,y,z,s] of [[0.2,1.2,-2.7,0.5],[-0.3,1.7,-3.1,0.4],[0.3,2.2,-3.4,0.3],[-0.1,2.6,-3.7,0.25]])questAdd(g,'sph',s,s,s,'#caf0f8',x,y,z);
  return g;}
// Sundae the Snowplow: an ice-cream-scoop snowplow with a waffle-cone blade, a scarf and chattering teeth
function questSundaeBuild(){const g=new THREE.Group();
  for(const sx of [-1,1]){questAdd(g,'box',0.8,0.9,3.4,'#5c4033',sx*1.15,0.45,-0.3);for(let i=0;i<4;i++)questAdd(g,'wheel',0.82,0.6,0.6,'#8d6e63',sx*1.15,0.45,-1.5+i*0.8);}
  questAdd(g,'box',1.8,1.0,2.8,'#ffc6ff',0,1.3,-0.4);questAdd(g,'sph',2.0,1.6,2.0,'#caffbf',0,2.35,-0.9);questAdd(g,'sph',1.7,1.4,1.7,'#fdffb6',0,3.35,-0.9);
  questAdd(g,'sph',0.45,0.45,0.45,'#e63946',0,4.1,-0.9);
  questEyes(g,2.45,0.05,0.38,0.5,{look:-1});
  for(let i=0;i<4;i++)questAdd(g,'box',0.22,0.25,0.1,'#ffffff',-0.33+i*0.22,1.8,1.0);questAdd(g,'box',1.0,0.06,0.08,'#1b1b1b',0,1.8,1.04);  // chattering teeth
  questAdd(g,'cyl',2.1,0.35,2.1,'#3a86ff',0,1.95,-0.6);questAdd(g,'box',0.4,1.0,0.12,'#3a86ff',0.7,1.45,0.48).rotation.z=0.2;  // scarf
  const bl=questAdd(g,'box',3.2,1.2,0.3,'#e9c46a',0,0.75,1.6);bl.rotation.x=-0.2;
  for(let i=0;i<4;i++)questAdd(g,'box',0.08,1.2,0.32,'#bc8a5f',-1.2+i*0.8,0.75,1.62).rotation.x=-0.2;questAdd(g,'box',3.2,0.08,0.32,'#bc8a5f',0,0.75,1.62).rotation.x=-0.2;
  return g;}
// Puff: a cotton-candy cloud bus, pink and blue fluff all over, dreamy half-shut eyes
function questPuffBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.4,1.6,4.4,'#ffc8dd',0,1.3,0);questAdd(g,'box',2.0,0.6,0.08,'#bde0fe',0,1.75,2.21);
  questEyes(g,1.85,2.27,0.5,0.55,{lids:'#ffc8dd'});questSmile(g,1.1,2.25,0.6);
  for(let i=0;i<9;i++){const x=((i%3)-1)*0.9,z=(Math.floor(i/3)-1)*1.4;questAdd(g,'sph',1.5,1.1,1.6,i%2?'#bde0fe':'#ffafcc',x,2.35+(i%2)*0.2,z);}
  for(const [x,z] of [[-1.3,0.8],[1.3,-0.6],[-1.3,-1.4],[1.3,1.5]])questAdd(g,'sph',0.9,0.8,0.9,'#ffffff',x,1.0,z);
  questWheels(g,1.15,1.4,-1.4,0.5,0.45,'#cdb4db','#ffffff');return g;}

/* ---------- quest items + pushables (~1 unit at scale 1, origin at the bottom) ---------- */
Object.assign(QUEST_ITEMS,{
  cherry(){const g=new THREE.Group();questAdd(g,'sph',0.8,0.75,0.8,'#d00000',0,0.4,0);questAdd(g,'sph',0.2,0.2,0.1,'#ff8fa3',0.18,0.55,0.35);
    const s=questAdd(g,'cyl',0.07,0.7,0.07,'#55a630',0.1,1.05,0);s.rotation.z=-0.3;questAdd(g,'sph',0.35,0.1,0.2,'#80b918',0.35,1.3,0).rotation.z=0.4;return g;},
  lifering(){const g=new THREE.Group();const r=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.2,8,20),M('#ffffff'));r.rotation.x=Math.PI/2;r.position.y=0.2;r.castShadow=true;g.add(r);
    for(let i=0;i<4;i++){const a=i/4*Math.PI*2;questAdd(g,'box',0.3,0.42,0.42,'#ff4d6d',Math.sin(a)*0.5,0.2,Math.cos(a)*0.5).rotation.y=a;}return g;}});
// Minty's runaway gumballs (big shiny balls, a dot of shine)
function questMintyGumball(){const g=new THREE.Group();questAdd(g,'sph',2.0,2.0,2.0,pick(['#ff4d6d','#4cc9f0','#ffd60a','#80ffdb','#c77dff']),0,1.0,0);
  questAdd(g,'sph',0.45,0.45,0.2,'#ffffff',0.45,1.5,0.85);return g;}
// Officer Glaze's rolling donuts (stand on their edge)
function questGlazeDonut(){const g=new THREE.Group();const d=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.5,10,22),M('#e9c46a'));d.position.y=1.4;d.castShadow=true;g.add(d);
  const f=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.42,8,22,Math.PI),M(pick(['#ff8fab','#7f4f24','#ffffff'])));f.position.set(0,1.4,0.12);f.castShadow=true;g.add(f);
  for(let i=0;i<5;i++){const a=0.4+i*0.55;questAdd(g,'box',0.3,0.08,0.08,['#3a86ff','#ffd60a','#06d6a0'][i%3],Math.cos(a)*0.9,1.4+Math.sin(a)*0.9,0.5).rotation.z=a;}
  return g;}

/* ---------- the quests ----------
   Voices (for AU14 casting; robot voice until cast):
   bun     Baker Bun: jolly, puffy and warm; every sentence ends in a giggle ("Hee hee!").
   minty   Minty: cool, breezy surfer-cousin of a peppermint; says "fresh!" and "buddy".
   snap    Sergeant Snap: crisp marching-band drill sergeant, but silly ("Left! Right! CRUNCH!").
   lolly   Lolly Lou: sugar-crazy cheerleader; squeals "WHEEE!", cheers every little thing.
   cocoa   Cocoa: cozy and sleepy, big yawns, talks like it's bedtime (slow, trailing off "...").
   glaze   Officer Glaze: deep, slow, very serious cop who keeps getting distracted by snacks ("Hmm. Suspicious. ...Delicious.").
   wafer   Captain Wafer: jolly old sailor, "Ahoy!", "Sweet seas!", "matey".
   jo      Jawbreaker Jo: gravelly, giggly granny who LOVES crunching things; "dearie".
   fizzy   Fizzy: bubbly and bouncy, burps mid-sentence and says "'scuse me!".
   sundae  Sundae the Snowplow: shivery, teeth chattering ("B-b-brr!"), but brave and excited.
   puff    Puff: dreamy, whispery, floaty; everything is "sooo fluffy". */
const QUEST_CANDY_BUN={id:'bun',name:'Baker Bun',emoji:'🧁',voice:'bun',h:5.2,build:questBunBuild};

// ===== Chapter 1: Frosting Lane (micro–mini) =====
// Bun waits outside the bakery next to the start. One cherry fell into the gumdrop piles (smash them: it pops out of
// the last one; bring it, a short trip), then the other two: one on the bakery street, one on top of a cupcake house
// (`lift`: bump the house to grab it). Then back to Bun.
registerQuest({
  id:'bun_cherries',world:'candy',chapter:1,main:true,
  giver:Object.assign({},QUEST_CANDY_BUN,{at:questCandyAt('bun_cherries','giver')}),
  stageAt:questCandyAt('bun_cherries','stage'),stageR:4,
  remind:['Three cherries for the cake! Hee!','My cherries! Hee hee!'],
  steps:[
    {do:'talk',icon:'🍒',n:3,say:['Party today! Hee hee!','My cherries rolled away!','Find my three cherries! Hee!']},
    {do:'smash',n:3,type:'candy_gumdrop',icon:'🍬',at:questCandyAt('bun_cherries','piles'),reveal:'cherry',revealIcon:'🍒',
      say:{start:'One is in the gumdrops! Smash them!',each:['Not this one! Hee!','Gumdrops everywhere! Hee!'],hint:'Smash the gumdrops! Hee hee!',got:'One cherry! Hee!'}},
    {do:'bring',n:1,icon:'🍒',say:{start:'Bring it here! Hee!',hint:'Over here, sugar!'}},
    {do:'find',n:2,item:'cherry',icon:'🍒',lift:true,at:questCandyMap('bun_cherries','cherries',['street','roof'])||'stage',
      say:{start:'Two more! The street and a rooftop!',each:['Another cherry! Hee!'],hint:['Down the street! Hee!','On the cupcake house! Bump it!'],got:'All my cherries! Hee hee!'}},
    {do:'bring',n:1,icon:'🍒',say:{start:'Bring them to Baker Bun!',hint:'Over here! Hee hee!'}}],
  reward:{cosmetic:'cherry',stars:2,say:['Cherries on top! Perfect!','A cherry hat for you! Hee!']},
  after:['Hee hee! Party soon!','Mmm, smells like cake!']});

// Minty waits by the gumball machine; the goal circle (the stage center) is the bowl under it, and the five gumballs
// rolled out onto the lane round it.
const questMintyAt=(()=>{const c=questCandyAt('minty_gumballs','goal')||questCandyAt('minty_gumballs','stage');return {c,balls:questCandyLoop(c,3.2,5,0.5)};})();
registerQuest({
  id:'minty_gumballs',world:'candy',chapter:1,main:false,needs:['bun_cherries'],
  giver:{id:'minty',name:'Minty',emoji:'🍬',voice:'minty',at:questCandyAt('minty_gumballs','giver'),h:2.6,build:questMintyBuild},
  stageAt:questMintyAt.c,stageR:7,
  remind:['Five gumballs in the bowl, buddy!'],
  steps:[
    {do:'talk',icon:'🔵',n:5,say:['Yo! Minty here. Fresh!','Whoa, gumballs everywhere!','Roll five gumballs into the bowl!']},
    {do:'push',n:5,icon:'🔵',r:22,build:questMintyGumball,at:questMintyAt.balls,
      say:{start:'The bowl is by the gumball machine!',each:['Fresh!','Nice roll, buddy!','Minty fresh!'],hint:'Into the green circle, buddy!',got:'All five! Super fresh!'}}],
  reward:{cosmetic:'gumballs',stars:1,say:['Super fresh. Thanks!','Have a gumball trail, buddy!']},
  after:['Stay fresh, buddy!','Minty cool.']});

// Snap waits at the end of Frosting Lane; eight frosting arches loop round Cake Town while the march plays.
registerQuest({
  id:'snap_march',world:'candy',chapter:1,main:false,needs:['bun_cherries'],
  giver:{id:'snap',name:'Sergeant Snap',emoji:'🍪',voice:'snap',at:questCandyAt('snap_march','giver'),h:6.0,build:questSnapBuild},
  remind:['Eight arches! Left! Right!'],
  steps:[
    {do:'talk',icon:'🥁',n:8,say:['Ten-HUT! Sergeant Snap!','Band, ready! March!','Drive through eight frosting arches!']},
    {do:'rings',n:8,icon:'🥁',music:'parade',at:questCandyPts('snap_march','rings',()=>questCandyLoop(questCandyAt('snap_march','stage'),11,8,Math.PI)),
      say:{start:'Arches go round Cake Town! March!',each:['Left! Right! CRUNCH!','Good marching!','Keep the beat!','Hup hup!'],hint:'The gold arch! March!',got:'Best parade! At ease!'}}],
  reward:{cosmetic:'bandhat',stars:1,say:['Splendid marching, troops!','A band hat for you! CRUNCH!']},
  after:['Left! Right! Crunch!','At ease, troops.']});

// ===== Chapter 2: Gumdrop Forest (tiny–small) =====
// Lolly Lou waits at the forest edge, the arrow's first stop out of Cake Town; ten gummy cubs bounce round the clearing.
registerQuest({
  id:'lolly_cubs',world:'candy',chapter:2,main:true,
  giver:{id:'lolly',name:'Lolly Lou',emoji:'🍭',voice:'lolly',at:questCandyAt('lolly_cubs','giver'),h:5.0,build:questLollyBuild},
  stageAt:questCandyAt('lolly_cubs','stage'),stageR:10,
  remind:['Ten gummy cubs! WHEEE!'],
  steps:[
    {do:'talk',icon:'🐻',n:10,say:['Hiii! I\'m Lolly Lou!','The gummy cubs got out!','Catch ten gummy cubs! WHEEE!']},
    {do:'catch',kind:'gummybear',n:10,icon:'🐻',
      say:{start:'They\'re bouncing in the forest clearing!',each:['Gotcha, gummy!','WHEEE! One more!','Yay yay yay!','So bouncy!'],hint:'Bump the gummy cubs!',got:'All ten! You\'re FAST!'}}],
  reward:{ability:'sugarrush',stars:3,say:['Want to be FASTER?','Hold turbo! SUGAR RUSH!','WHEEE!']},
  after:['Sugar rush! WHEEE!','Go go go!']});

// Cocoa waits by the forest road; five gingerbread doorsteps glow round the forest.
registerQuest({
  id:'cocoa_cups',world:'candy',chapter:2,main:false,
  giver:{id:'cocoa',name:'Cocoa',emoji:'☕',voice:'cocoa',at:questCandyAt('cocoa_cups','giver'),h:4.4,build:questCocoaBuild},
  remind:['Five cups of cocoa... yawn...'],
  steps:[
    {do:'talk',icon:'☕',n:5,say:['Mmm... hello, friend...','Mmm, cocoa time...','Bring cocoa to five houses...']},
    {do:'deliver',n:5,icon:'☕',at:questCandyPts('cocoa_cups','drops',()=>questCandyLoop(questCandyAt('cocoa_cups','stage'),28,5)),
      say:{start:'The gingerbread houses... in the forest...',each:['Warm and cozy!','Mmm... lovely...','Yawn... nice one.'],hint:'The glowing doorstep... that way...',got:'All done... so cozy...'}}],
  reward:{stars:3,say:['Thank you... so cozy...','Time for a nap...']},
  after:['Mmm... cocoa...','Zzz... oh, hi.']});

// Glaze waits at the donut shop; the goal circle (the stage center) is the shop lot, the six donuts rolled off round it.
const questGlazeAt=(()=>{const c=questCandyAt('glaze_donuts','goal')||questCandyAt('glaze_donuts','stage');return {c,donuts:questCandyLoop(c,8,6,0.3)};})();
registerQuest({
  id:'glaze_donuts',world:'candy',chapter:2,main:false,
  giver:{id:'glaze',name:'Officer Glaze',emoji:'🍩',voice:'glaze',at:questCandyAt('glaze_donuts','giver'),h:2.6,r:2.6,build:questGlazeBuild},
  stageAt:questGlazeAt.c,stageR:9,
  remind:['Six donuts. Roll them back.'],
  steps:[
    {do:'talk',icon:'🍩',n:6,say:['Officer Glaze. Hmm.','Runaway donuts. Serious business.','Roll six donuts back to the shop.']},
    {do:'push',n:6,icon:'🍩',r:30,build:questGlazeDonut,at:questGlazeAt.donuts,
      say:{start:'The shop lot is right here.',each:['Good work, deputy.','Hmm. Suspicious. Delicious.','Roll on, deputy.'],hint:'Into the green circle, deputy.',got:'Case closed.'}}],
  reward:{cosmetic:'siren',stars:2,say:['Case closed. Snack time.','Here is a siren. Woo woo.']},
  after:['Hmm. Delicious.','Serious business.']});

// ===== Chapter 3: Chocolate River (medium–large) =====
// Wafer waits on his dock. The four life rings: floating on the river (a find item in a deep spot counts as wading),
// under the wafer bridge, on a marshmallow island and at the chocolate falls (`lift`: one on a prop sits on top; bump
// it to grab it). Then back to the dock.
registerQuest({
  id:'wafer_rings',world:'candy',chapter:3,main:true,
  giver:{id:'wafer',name:'Captain Wafer',emoji:'⚓',voice:'wafer',at:questCandyAt('wafer_rings','giver'),h:4.6,build:questWaferBuild},
  stageAt:questCandyAt('wafer_rings','stage'),stageR:10,
  remind:['Four life rings, matey!'],
  steps:[
    {do:'talk',icon:'🛟',n:4,say:['Ahoy there, mateys!','My life rings floated off!','Find four life rings, matey!']},
    {do:'find',n:4,item:'lifering',icon:'🛟',lift:true,at:questCandyMap('wafer_rings','rings_at',['river','bridge','island','falls'])||'stage',
      say:{start:'They are all down the river! Ahoy!',each:['Ha! Another one!','Sweet seas!','Ha! One more!'],
        hint:['Float over the chocolate!','Under the wafer bridge!','By the waterfall, matey!'],got:'All four rings! Ahoy!'}},
    {do:'bring',n:1,icon:'🛟',say:{start:'Bring them to my dock!',hint:'Over here, matey!'}}],
  reward:{stars:4,say:['Sweet seas! Thank ye!','You are real sailors now!']},
  after:['Ahoy!','Sweet seas, mateys!']});

// Jo waits at the quarry gate on the riverbank; fifty rock-candy crystals fill the quarry.
registerQuest({
  id:'jo_quarry',world:'candy',chapter:3,main:false,
  giver:{id:'jo',name:'Jawbreaker Jo',emoji:'💎',voice:'jo',at:questCandyAt('jo_quarry','giver'),h:4.0,build:questJoBuild},
  stageAt:questCandyAt('jo_quarry','stage'),stageR:9,
  remind:['Fifty crystals, dearie! Crunch!'],
  steps:[
    {do:'talk',icon:'💎',n:50,say:['Ooh, hello, dearie!','A quarry full of crunch!','Crunch fifty candy crystals, dearie!']},
    {do:'smash',n:50,type:['candy_crystal','candy_crystal','candy_rock'],icon:'💎',at:questCandyAt('jo_quarry','crystals'),
      say:{start:'They are all in my quarry!',each:['Crunchy! Hee hee!','Crunch it, dearie!','Ooh, sparkly!','More crunch!'],hint:'More crystals, dearie!',got:'Best crunch of my life.'}}],
  reward:{stars:3,say:['Hee hee! Crunchy!','You crunch like a champ!']},
  after:['Crunch crunch!','Ooh, my teeth! Hee hee!']});

// Fizzy waits on the riverbank; eight hoops zig-zag down the chocolate river (hover skims the deep middle).
registerQuest({
  id:'fizzy_hoops',world:'candy',chapter:3,main:false,
  giver:{id:'fizzy',name:'Fizzy',emoji:'🥤',voice:'fizzy',at:questCandyAt('fizzy_hoops','giver'),h:4.6,build:questFizzyBuild},
  remind:['Eight hoops on the river! Burp!'],
  steps:[
    {do:'talk',icon:'🫧',n:8,say:['Heya! Fizzy here!','Hoop race on the river!','Fly through eight hoops! Burp!']},
    {do:'rings',n:8,icon:'🫧',at:questCandyPts('fizzy_hoops','rings',()=>Array.from({length:8},(_,i)=>[20+(i%2?5:-5),196-i*34])),
      say:{start:'Hoops over the chocolate river!',each:['\'Scuse me! Nice one!','Fizztastic!','Pop pop pop!','Whoosh! Burp!'],hint:['Hold jump to float!','The gold hoop! That way!'],got:'Fizztastic! You did it!'}}],
  reward:{cosmetic:'burp',stars:3,say:['You\'re fizztastic!','Here, a burp horn! BURP!']},
  after:['Burp! \'Scuse me!','Fizz fizz!']});

// ===== Chapter 4: Ice-Cream Mountains + the cake plaza (huge–GIANT) =====
// Bun again, at the edge of the birthday cake plaza: Sir Sprinkles crashes the party.
registerQuest({
  id:'bun_sprinkles',world:'candy',chapter:4,main:true,
  giver:Object.assign({},QUEST_CANDY_BUN,{at:questCandyAt('bun_sprinkles','giver')}),
  stageAt:questCandyAt('bun_sprinkles','stage'),
  remind:['Save the cake! Smash Sir Sprinkles!'],
  steps:[
    {do:'talk',icon:'🎂',n:1,say:['Oh no! Oh no! Hee... no!','Sir Sprinkles wants the WHOLE cake!','Smash Sir Sprinkles! Save the party!']},
    {do:'boss',boss:'sirsprinkles',n:1,icon:'🎂',say:{start:'He is at the cake plaza!',hint:'Smash his frosting!'}},
    {do:'talk',icon:'🎉',say:['Party saved! Hee hee!','Cake for everyone!']}],
  reward:{stars:4,say:['Happy birthday, Candy Land!','You are the sweetest heroes!']},
  after:['Hee hee! More cake?','Best party ever!']});

// Sundae waits at the foot of Ice-Cream Mountain; the cherry sits on the summit (`lift`: on the mountain top prop,
// bump it; with nothing there it floats `y` up). Keep y ≤ 3: at huge a jump only reaches ~2.4 (2.6 with hover).
const questSundaeTop=(()=>{const s=questCandyAt('sundae_summit','summit')||questCandyAt('sundae_summit','stage');
  return {at:[s[0],s[1]],y:s[2]!=null?s[2]:(questCandyAt('sundae_summit','summitH')??3)};})();
registerQuest({
  id:'sundae_summit',world:'candy',chapter:4,main:false,
  giver:{id:'sundae',name:'Sundae the Snowplow',emoji:'🍨',voice:'sundae',at:questCandyAt('sundae_summit','giver'),h:4.6,build:questSundaeBuild},
  stageAt:questCandyAt('sundae_summit','stage'),
  remind:['The cherry on top! B-b-brave!'],
  steps:[
    {do:'talk',icon:'🍒',n:1,say:['B-b-brr! Hi there!','I want the cherry on top!','Get the cherry from the mountain top!']},
    {do:'find',n:1,item:'cherry',icon:'🍒',lift:true,y:questSundaeTop.y,at:[questSundaeTop.at],
      say:{start:'Up up up the mountain! B-b-brr!',hint:['Higher! B-b-brave!','Jump and float up!'],got:'You got it! W-w-wow!'}},
    {do:'bring',n:1,icon:'🍒',say:{start:'Bring it down to me!',hint:'Over here! B-b-brr!'}}],
  reward:{cosmetic:'rainbow',stars:3,say:['You did it! W-w-wow!','A rainbow trail for you!']},
  after:['B-b-brr! So cold!','W-w-what a view!']});

// Puff waits on the cloud meadow; twelve marshmallow sheep float about on it.
registerQuest({
  id:'puff_sheep',world:'candy',chapter:4,main:false,
  giver:{id:'puff',name:'Puff',emoji:'☁️',voice:'puff',at:questCandyAt('puff_sheep','giver'),h:3.6,build:questPuffBuild},
  stageAt:questCandyAt('puff_sheep','stage'),stageR:12,
  remind:['Twelve fluffy sheep... gently...'],
  steps:[
    {do:'talk',icon:'🐑',n:12,say:['Oh... hello... sooo fluffy...','My marshmallow sheep floated off...','Catch twelve fluffy sheep... gently...']},
    {do:'catch',kind:'marshmallow_sheep',n:12,icon:'🐑',
      say:{start:'They are on the cloud meadow...',each:['Sooo fluffy...','Gently... nice...','Baa... fluffy...'],hint:'Bump the fluffy sheep...',got:'All home... sweet dreams...'}}],
  reward:{stars:3,say:['Thank you... sooo nice...','Sweet dreams...']},
  after:['Sooo fluffy...','Zzz... baa...']});
