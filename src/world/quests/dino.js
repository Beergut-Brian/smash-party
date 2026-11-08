/* Smash Party — Dino Land quest pack (Q2). Owner: quests lane (agents/quests.md). Outline: docs/worlds/dino.md.
   Twelve quests in four chapters (chapter = car tier + 1; the portal drops you at micro, so chapter 1 is toy scale):
     1 Pebble Village (micro–mini)   🥚 Grandma Gertie (MAIN: dino tail) · 🪨 Rocky (side: footprints) · 🐣 Mo (side: eggshell hat)
     2 Nest Hills (tiny–small)       👟 Thunderfoot Theo (MAIN: 🦖 Stomp) · 🪺 Petra (side: roar engine) · 🎳 Rolly (side)
     3 Swamp + Fossil Dig            🦴 Professor Digby (MAIN) · 🛶 Mossy (side) · 🤠 Ranger Rosa (side)
       (medium–large)
     4 Volcano Peak (huge–GIANT)     🦖 Theo: Rexy's tantrum (MAIN: boss rexy) · 🔥 Cinder (side: 30 lava rocks) · 📸 Gertie's photo (side)
   You arrive with every Home World ability, so steps lean on hover / jump / shoot from chapter 1.
   Places: the zone-dino lane fills registerWorld({id:'dino', questAt:{…}}) (Z5b: giver, stage [x,z,w,d] and point
   lists, keys as in the outline's spot checklist) and marks each stage as a `quest_<id>` spot. Until then the pack
   uses the fallback numbers in QUEST_DINO_AT (around the default start, the road at x=0), so every quest plays today.
   No quest has a `stage` scene: the zone lane builds the scenery into the layouts (like the Home World, Q1b).
   Every top-level name here starts with `quest`; helpers from home.js (questAdd, questEyes, questSmile, questMouthO,
   questWheels) are shared, and QUEST_ITEMS gets new looks with Object.assign. */

/* ---------- where things are ---------- */
// fallback spots (world units; the default start is (2.6,48) facing −Z). Chapter 1 is within ~25 units of the start
// (micro speed), chapter 2 within ~110, chapters 3–4 further out. Givers stand off the road lines (every 160).
const QUEST_DINO_AT={
  gertie_egg:{giver:[9,43],stage:[13,38,10,10],nest:[13,38],egg:[11,42.5],leaves:[[20,34],[16,46],[7,33]]},
  rocky_race:{giver:[-8,55],stage:[0,40,24,30]},
  mo_hatchlings:{giver:[-9,31],stage:[-15,26,10,10]},
  theo_sneakers:{giver:[-58,34],stage:[-74,44,40,40],sneakers:{nest:[-86,36],ramp:[-66,60]}},
  petra_worms:{giver:[62,70],stage:[80,80,70,50],drops:[[48,92],[78,58],[104,74],[96,108],[62,120]]},
  rolly_bowling:{giver:[46,-36],stage:[60,-50,30,30]},
  digby_bones:{giver:[228,-68],stage:[250,-92,50,50],pieces:{tar:[186,-128],ribcage:[266,-112],ledge:[282,-68]}},
  mossy_hoops:{giver:[-226,-66],stage:[-250,-110,120,80]},
  rosa_trikes:{giver:[-198,72],stage:[-232,94,60,60]},
  theo_rexy:{giver:[24,-232],stage:[0,-282,140,100]},
  cinder_rocks:{giver:[-138,-292],stage:[-150,-332,100,80]},
  gertie_photo:{giver:[148,-292],stage:[178,-332,120,80]}};
function questDinoAt(id,k){
  const W=typeof WORLDS!=='undefined'&&WORLDS.dino,m=W&&W.questAt&&W.questAt[id],v=m&&m[k]!=null?m[k]:(QUEST_DINO_AT[id]||{})[k];
  return k==='stage'&&v&&v.length>2?[v[0],v[1]]:v;} // questAt's stage is [x,z,w,d]: the pack wants its center
// n points on a loop round c (rings, flocks' start spots), the first one toward +Z (the start side)
const questDinoLoop=(c,r,n,a0=0)=>Array.from({length:n},(_,i)=>{const a=a0+i/n*Math.PI*2;return [c[0]+Math.sin(a)*r,c[1]+Math.cos(a)*r];});
// a point list from questAt, else the loop
const questDinoPts=(id,k,c,r,n,a0)=>{const v=questDinoAt(id,k);return Array.isArray(v)&&Array.isArray(v[0])&&v.length?v:questDinoLoop(c,r,n,a0);};

/* ---------- giver looks (car scale 1, ~4.5 long, facing +Z, feet at y=0, M() colors) ---------- */
// Grandma Gertie: an old round brontosaurus in a flowery shawl, big knitting glasses on her long droopy neck, yarn on her back
function questGertieBuild(){const g=new THREE.Group(),C='#b5a8e0',B='#e6ddff';
  questAdd(g,'sph',2.8,2.2,3.6,C,0,1.9,-0.6);questAdd(g,'sph',2.2,1.2,2.8,B,0,1.35,-0.4);
  for(const [x,z] of [[-0.9,0.4],[0.9,0.4],[-0.9,-1.6],[0.9,-1.6]])questAdd(g,'cyl',0.75,1.2,0.75,C,x,0.6,z);
  const tail=questAdd(g,'cone',0.9,2.4,0.9,C,0,1.6,-2.9);tail.rotation.x=-1.9;
  for(let i=0;i<4;i++)questAdd(g,'sph',0.85-i*0.05,0.85-i*0.05,0.85-i*0.05,C,0,2.6+i*0.45-(i>2?0.25:0),0.7+i*0.45);  // the neck, drooping at the end
  questAdd(g,'sph',1.25,1.0,1.35,C,0,3.55,2.35);questSmile(g,3.2,2.98,0.55);
  for(const sx of [-1,1]){questAdd(g,'sph',0.42,0.46,0.25,'#ffffff',sx*0.32,3.75,2.95);questAdd(g,'sph',0.2,0.22,0.12,'#1b1b1b',sx*0.32,3.72,3.05);
    const rim=questAdd(g,'cyl',0.62,0.08,0.62,'#c1121f',sx*0.32,3.75,3.06);rim.rotation.x=Math.PI/2;}
  questAdd(g,'box',0.2,0.07,0.07,'#c1121f',0,3.8,3.06);
  questAdd(g,'sph',3.0,1.0,2.4,'#ff8fab',0,2.65,-0.5);                                          // the shawl
  for(const [x,z,c] of [[-0.8,0.2,'#ffd60a'],[0.7,-0.2,'#ffffff'],[0,-1.2,'#ffd60a'],[-0.5,-1.0,'#ffffff'],[0.9,-1.1,'#ffd60a']])questAdd(g,'sph',0.32,0.2,0.32,c,x,3.12,z);
  questAdd(g,'sph',1.0,1.0,1.0,'#e63946',0.2,3.55,-1.0);for(const a of [0.4,-0.4])questAdd(g,'box',0.05,1.4,0.05,'#adb5bd',0.2+a,3.9,-1.0).rotation.z=a;  // yarn + needles
  return g;}
// Rocky Roadster: a caveman car: a log body on round rock wheels, a bone hood ornament, one big bushy eyebrow
function questRockyBuild(){const g=new THREE.Group();
  const log=questAdd(g,'cyl',2.2,4.4,2.0,'#8b5e34',0,1.45,0);log.rotation.x=Math.PI/2;
  questAdd(g,'cyl',1.8,0.1,1.8,'#d4a373',0,1.45,2.22).rotation.x=Math.PI/2;questAdd(g,'cyl',1.0,0.12,1.0,'#a47148',0,1.45,2.24).rotation.x=Math.PI/2;
  questEyes(g,1.75,2.3,0.45,0.55);questAdd(g,'box',1.6,0.32,0.35,'#3d2b1f',0,2.25,2.3);            // the one big eyebrow
  questSmile(g,1.0,2.32,0.7);
  questAdd(g,'box',1.4,1.0,1.6,'#a47148',0,2.7,-0.6);questAdd(g,'cyl',1.4,0.2,1.4,'#6c757d',0,3.25,-0.6);
  questAdd(g,'box',0.9,0.18,0.18,'#fff8e7',0,2.55,1.5);for(const sx of [-1,1])questAdd(g,'sph',0.3,0.3,0.3,'#fff8e7',sx*0.45,2.55,1.5);  // bone
  for(const [x,z] of [[-1.25,1.3],[1.25,1.3],[-1.25,-1.3],[1.25,-1.3]])questAdd(g,'sph',1.2,1.2,0.6,'#8d99ae',x,0.6,z);
  return g;}
// Mo the Nest-Sitter: a flustered orange triceratops in a striped apron, a baby bottle in a holder on her side
function questMoBuild(){const g=new THREE.Group(),C='#ff9e3d';
  questAdd(g,'sph',2.6,2.0,3.8,C,0,1.6,-0.4);for(const [x,z] of [[-0.9,0.6],[0.9,0.6],[-0.9,-1.4],[0.9,-1.4]])questAdd(g,'cyl',0.7,1.0,0.7,C,x,0.5,z);
  const fr=questAdd(g,'cyl',3.0,0.3,2.4,'#ffbe0b',0,2.75,1.0);fr.rotation.x=Math.PI/2-0.35;
  for(let i=0;i<7;i++){const a=-1.3+i*0.43;questAdd(g,'sph',0.35,0.35,0.2,'#ff6b6b',Math.sin(a)*1.45,2.75+Math.cos(a)*1.1,0.9);}
  questAdd(g,'sph',1.6,1.4,1.6,C,0,2.2,1.7);questEyes(g,2.55,2.4,0.38,0.5,{brow:'#7f4f24',browTilt:-0.4});questMouthO(g,1.85,2.48,0.35);
  questAdd(g,'cone',0.3,1.0,0.3,'#fff8e7',0,2.0,2.7).rotation.x=Math.PI/2;
  for(const sx of [-1,1]){const h=questAdd(g,'cone',0.3,1.2,0.3,'#fff8e7',sx*0.5,3.15,2.2);h.rotation.x=1.0;}
  for(let i=0;i<4;i++)questAdd(g,'box',1.9,0.32,0.1,i%2?'#ffffff':'#4cc9f0',0,1.1+i*0.32,1.18);     // striped apron
  questAdd(g,'cyl',0.4,0.9,0.4,'#ffffff',1.35,1.8,-0.6);questAdd(g,'cone',0.25,0.4,0.25,'#ffafcc',1.35,2.45,-0.6); // baby bottle
  return g;}
// Thunderfoot Theo: a little green T-rex in a red sweatband, tiny arms, big grin. Barefoot until his sneakers come back.
function questTheoBuild(){const g=new THREE.Group(),C='#52b788',shoes=questDone.has('theo_sneakers');
  questAdd(g,'sph',2.2,2.6,2.6,C,0,2.1,-0.4);questAdd(g,'sph',1.6,1.8,1.4,'#b7e4c7',0,1.9,0.5);
  const tail=questAdd(g,'cone',1.2,3.0,1.0,C,0,1.6,-2.4);tail.rotation.x=-1.85;
  questAdd(g,'sph',2.0,1.6,2.4,C,0,3.75,0.7);questEyes(g,4.25,1.7,0.48,0.55,{brow:'#1b1b1b',browTilt:-0.25});
  questAdd(g,'box',1.4,0.15,0.1,'#ffffff',0,3.3,1.95);questSmile(g,3.35,1.95,1.2);
  questAdd(g,'cyl',2.05,0.35,2.05,'#e63946',0,4.55,0.6);                                           // sweatband
  for(const sx of [-1,1]){const a=questAdd(g,'box',0.25,0.25,0.7,C,sx*0.8,2.5,1.0);a.rotation.x=0.6;questAdd(g,'sph',0.3,0.3,0.3,C,sx*0.8,2.25,1.3);} // tiny arms
  for(const sx of [-1,1]){questAdd(g,'cyl',0.7,1.0,0.7,C,sx*0.7,0.6,-0.2);
    if(shoes){questAdd(g,'box',1.0,0.6,1.8,'#ffffff',sx*0.7,0.3,0.2);questAdd(g,'box',1.04,0.15,1.84,'#e63946',sx*0.7,0.2,0.2);}
    else for(let k=-1;k<=1;k++)questAdd(g,'sph',0.3,0.25,0.4,'#2d6a4f',sx*0.7+k*0.25,0.12,0.45);}  // bare toes
  return g;}
// Petra Pteranodon: a pilot pteranodon with leather goggles, a long red scarf and a mail bag of wiggly worms
function questPetraBuild(){const g=new THREE.Group(),C='#8ecae6';
  questAdd(g,'sph',1.4,1.6,2.2,C,0,1.6,0);for(const sx of [-1,1]){questAdd(g,'cyl',0.25,0.9,0.25,'#f4a261',sx*0.4,0.45,0);
    const w=questAdd(g,'box',2.6,0.12,1.6,'#ffe5a0',sx*1.9,2.0,-0.2);w.rotation.z=sx*0.35;}
  questAdd(g,'sph',1.2,1.1,1.4,C,0,2.8,0.7);const bk=questAdd(g,'cone',0.5,2.0,0.4,'#f4a261',0,2.65,2.2);bk.rotation.x=Math.PI/2;
  const cr=questAdd(g,'cone',0.4,1.4,0.3,'#219ebc',0,3.4,-0.1);cr.rotation.x=-1.1;
  for(const sx of [-1,1]){questAdd(g,'cyl',0.55,0.25,0.55,'#7f5539',sx*0.32,3.05,1.3).rotation.x=Math.PI/2;questAdd(g,'sph',0.36,0.36,0.15,'#bde0fe',sx*0.32,3.05,1.43);
    questAdd(g,'sph',0.15,0.15,0.08,'#1b1b1b',sx*0.32,3.0,1.5);}
  questAdd(g,'box',1.3,0.12,0.12,'#7f5539',0,3.05,1.36);
  questAdd(g,'cyl',1.25,0.35,1.25,'#e63946',0,2.25,0.6);for(let i=0;i<3;i++)questAdd(g,'box',0.4,0.15,0.7,'#e63946',0.3+i*0.1,2.4-i*0.25,-0.5-i*0.6); // scarf
  questAdd(g,'box',0.7,0.8,0.9,'#a47148',0.85,1.3,-0.3);for(let i=0;i<3;i++)questAdd(g,'cyl',0.12,0.5,0.12,'#ff8fa3',0.7+i*0.15,1.85+(i%2)*0.1,-0.3); // mail bag of worms
  return g;}
// Rolly the Ankylosaurus: chunky, low and wide in a bowling shirt, his club tail shaped like a bowling ball
function questRollyBuild(){const g=new THREE.Group(),C='#bc8a5f';
  questAdd(g,'sph',3.0,1.8,3.6,C,0,1.3,-0.3);for(const [x,z] of [[-1.0,0.6],[1.0,0.6],[-1.0,-1.2],[1.0,-1.2]])questAdd(g,'cyl',0.75,0.8,0.75,C,x,0.4,z);
  for(let i=0;i<6;i++)questAdd(g,'pyr',0.5,0.5,0.5,'#7f5539',(i%2?0.6:-0.6),2.2,0.6-i*0.4);
  questAdd(g,'box',3.04,0.5,2.2,'#4361ee',0,1.4,0.2);questAdd(g,'box',3.06,0.18,2.22,'#ffffff',0,1.4,0.2);  // bowling shirt
  questAdd(g,'sph',1.5,1.2,1.4,C,0,1.4,1.7);questEyes(g,1.75,2.3,0.4,0.5,{look:1});questSmile(g,1.1,2.36,0.6);
  const t=questAdd(g,'cyl',0.4,2.0,0.4,C,0,1.1,-2.6);t.rotation.x=Math.PI/2;questAdd(g,'sph',1.3,1.3,1.3,'#1b1b1b',0,1.1,-3.7);
  for(const [x,y] of [[-0.2,1.4],[0.2,1.4],[0,1.15]])questAdd(g,'sph',0.18,0.18,0.1,'#6c757d',x,y,-3.1);
  return g;}
// Professor Digby: a dusty explorer jeep in a pith helmet, a bushy white mustache, a magnifying glass and a shovel
function questDigbyBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.6,1.2,4.4,'#c9a66b',0,1.1,0);questAdd(g,'box',2.2,0.9,1.8,'#d8bc8a',0,2.15,-0.6);
  questAdd(g,'box',2.0,0.75,0.08,'#bde0fe',0,2.2,0.32);questEyes(g,2.3,0.38,0.45,0.52,{brow:'#ffffff',browTilt:0.25});
  for(const sx of [-1,1]){const m=questAdd(g,'sph',0.9,0.38,0.35,'#ffffff',sx*0.42,1.45,2.25);m.rotation.z=sx*0.35;}
  questAdd(g,'cyl',2.8,0.1,2.8,'#e9d8a6',0,2.65,-0.6);questAdd(g,'sph',1.8,1.3,1.8,'#e9d8a6',0,2.75,-0.6);questAdd(g,'cyl',1.82,0.2,1.82,'#7f5539',0,2.85,-0.6);
  questAdd(g,'cyl',0.8,0.1,0.8,'#adb5bd',0.6,1.85,1.6).rotation.x=0.4;questAdd(g,'cyl',0.66,0.12,0.66,'#caf0f8',0.6,1.86,1.62).rotation.x=0.4; // magnifying glass
  questAdd(g,'box',0.12,0.12,0.8,'#7f5539',0.6,1.75,0.95);
  const sh=questAdd(g,'box',0.12,0.12,2.6,'#7f5539',1.36,1.4,-0.4);sh.rotation.x=0.1;questAdd(g,'box',0.1,0.5,0.7,'#adb5bd',1.36,1.25,-1.9);
  questWheels(g,1.3,1.4,-1.4,0.62,0.55,'#3d2b1f','#c9a66b');return g;}
// Mossy the Swamp Boat: a mossy airboat with a big fan on the back, sleepy frog eyes on top and a cattail straw
function questMossyBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.8,0.8,4.4,'#6a994e',0,0.45,0);questAdd(g,'box',2.4,0.3,1.2,'#6a994e',0,0.7,2.4).rotation.x=-0.4;
  for(const [x,z,s] of [[-0.9,0.8,0.8],[0.7,-0.4,1.0],[-0.4,-1.5,0.7],[1.0,1.4,0.6]])questAdd(g,'sph',s,0.45,s,'#386641',x,0.95,z);
  for(const sx of [-1,1]){questAdd(g,'sph',0.9,0.8,0.8,'#a7c957',sx*0.55,1.45,1.3);questAdd(g,'sph',0.55,0.5,0.3,'#ffffff',sx*0.55,1.55,1.68);
    questAdd(g,'sph',0.28,0.24,0.15,'#1b1b1b',sx*0.55,1.5,1.8);questAdd(g,'box',0.65,0.25,0.4,'#a7c957',sx*0.55,1.78,1.62);}  // sleepy frog eyes
  questSmile(g,1.0,2.0,0.9,'#386641');
  questAdd(g,'box',0.25,1.8,0.25,'#495057',0,1.6,-1.3);questAdd(g,'cyl',2.6,0.3,2.6,'#495057',0,2.4,-1.8).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const b=questAdd(g,'box',0.3,2.2,0.08,'#dee2e6',0,2.4,-1.9);b.rotation.z=i*Math.PI/3;}
  questAdd(g,'cyl',0.08,2.0,0.08,'#6a994e',0.9,1.9,0.6).rotation.z=-0.3;questAdd(g,'cyl',0.25,0.7,0.25,'#7f5539',1.2,2.9,0.6).rotation.z=-0.3; // cattail
  return g;}
// Ranger Rosa: a green park-ranger pickup in a wide-brim ranger hat, a whistle on a cord
function questRosaBuild(){const g=new THREE.Group();
  questAdd(g,'box',2.5,1.1,4.6,'#2d6a4f',0,1.05,0);questAdd(g,'box',2.2,1.1,1.8,'#40916c',0,2.15,0.4);
  questAdd(g,'box',1.9,0.8,0.08,'#bde0fe',0,2.25,1.32);questEyes(g,2.3,1.38,0.45,0.55,{brow:'#1b1b1b',browTilt:-0.15});
  questSmile(g,1.35,2.32,0.8);questAdd(g,'box',2.5,0.25,2.0,'#1b4332',0,1.7,-1.3);
  questAdd(g,'cyl',3.0,0.1,3.0,'#a47148',0,2.75,0.4);questAdd(g,'cone',1.6,1.1,1.6,'#a47148',0,3.3,0.4);questAdd(g,'cyl',1.5,0.18,1.5,'#7f5539',0,2.9,0.4);
  questAdd(g,'box',0.06,0.8,0.06,'#ffd60a',0.5,1.75,2.33);questAdd(g,'cyl',0.22,0.4,0.22,'#c0c0c0',0.5,1.3,2.38).rotation.x=Math.PI/2; // whistle
  questAdd(g,'box',0.5,0.5,0.1,'#ffd60a',-0.6,1.15,2.33);                                          // badge
  questWheels(g,1.25,1.5,-1.5,0.6,0.55);return g;}
// Cinder the Dimetrodon: red, with a tall sail on her back, a sun hat, sunglasses, fanning herself with a palm leaf
function questCinderBuild(){const g=new THREE.Group(),C='#e85d04';
  questAdd(g,'sph',2.2,1.4,4.2,C,0,1.1,-0.3);for(const [x,z] of [[-0.9,0.9],[0.9,0.9],[-0.9,-1.4],[0.9,-1.4]])questAdd(g,'cyl',0.55,0.7,0.55,C,x,0.35,z);
  for(let i=0;i<7;i++){const h=1.4+Math.sin((i+0.5)/7*Math.PI)*1.8;questAdd(g,'box',0.12,h,0.5,i%2?'#ffba08':'#f48c06',0,1.6+h/2,0.9-i*0.45);}  // the sail
  const tail=questAdd(g,'cone',0.7,2.4,0.6,C,0,0.9,-3.0);tail.rotation.x=-1.75;
  questAdd(g,'sph',1.4,1.1,1.8,C,0,1.4,2.0);
  for(const sx of [-1,1])questAdd(g,'box',0.55,0.35,0.1,'#1b1b1b',sx*0.32,1.7,2.88);questAdd(g,'box',0.25,0.08,0.1,'#1b1b1b',0,1.75,2.88);
  questSmile(g,1.15,2.85,0.55);
  questAdd(g,'cyl',2.2,0.1,2.2,'#ffe066',0,2.05,1.9);questAdd(g,'cyl',1.0,0.6,1.0,'#ffe066',0,2.35,1.9);questAdd(g,'cyl',1.02,0.15,1.02,'#ff006e',0,2.2,1.9);
  const lf=questAdd(g,'sph',0.9,0.12,1.8,'#55a630',1.4,2.6,1.2);lf.rotation.set(0.3,0,-0.8);questAdd(g,'cyl',0.08,1.2,0.08,'#7f5539',1.1,1.9,1.4).rotation.z=-0.5;
  return g;}

/* ---------- quest items + pushables (~1 unit at scale 1, origin at the bottom) ---------- */
Object.assign(QUEST_ITEMS,{
  leaf(){const g=new THREE.Group();const l=questAdd(g,'sph',1.1,0.2,1.5,'#80ed99',0,0.3,0);l.rotation.x=0.2;questAdd(g,'box',0.08,0.08,1.4,'#38b000',0,0.42,0);
    questAdd(g,'box',0.06,0.3,0.06,'#38b000',0,0.2,-0.75);return g;},
  sneaker(){const g=new THREE.Group();questAdd(g,'box',0.8,0.5,1.4,'#ffffff',0,0.25,0);questAdd(g,'box',0.8,0.5,0.6,'#ffffff',0,0.6,-0.35);
    questAdd(g,'box',0.84,0.14,1.44,'#e63946',0,0.08,0);for(let i=0;i<3;i++)questAdd(g,'box',0.5,0.06,0.08,'#3a86ff',0,0.52,0.15+i*0.18);return g;},
  bone(){const g=new THREE.Group();const b=questAdd(g,'cyl',0.3,1.4,0.3,'#fff8e7',0,0.5,0);b.rotation.z=Math.PI/2;
    for(const sx of [-1,1])for(const sz of [-1,1])questAdd(g,'sph',0.42,0.42,0.42,'#fff8e7',sx*0.7,0.5,sz*0.16);return g;}});
// Gertie's big speckled egg (it wiggles in the nest; rolls when pushed)
function questGertieEgg(){const g=new THREE.Group();questAdd(g,'sph',1.8,2.3,1.8,'#fff3d6',0,1.15,0);
  for(const [x,y,z] of [[0.6,1.5,0.6],[-0.7,1.0,0.4],[0.1,1.9,-0.7],[0.5,0.6,-0.6],[-0.3,1.7,0.75]])questAdd(g,'sph',0.35,0.3,0.15,'#9d8bd1',x,y,z);
  return g;}
// Rolly's bowling boulders
function questRollyBoulder(){const g=new THREE.Group(),c=pick(['#8d99ae','#adb5bd','#a39171']);questAdd(g,'sph',2.0,1.85,2.0,c,0,0.95,0);
  questAdd(g,'sph',0.9,0.5,0.9,'#6a994e',0.4,1.7,0.2);questAdd(g,'sph',0.5,0.4,0.3,'#6c757d',-0.6,1.1,0.8);return g;}

/* ---------- the quests ----------
   Voices (for AU14 casting; robot voice until cast):
   gertie  Grandma Gertie: slow, warm, forgetful granny; loses her thread mid-sentence ("Now where was I?"); "sweetie".
   rocky   Rocky Roadster: deep, dopey and cheerful; talks about himself in the third person ("Rocky go FAST!").
   mo      Mo the Nest-Sitter: high, frazzled, breathless bursts; counts everything.
   theo    Thunderfoot Theo: young sporty kid with coach energy ("C'mon, team!"); jokes about his tiny arms.
   petra   Petra Pteranodon: breezy aviator, crisp radio talk ("Roger that!", "Over!").
   rolly   Rolly the Ankylosaurus: goofy and chuckly, "hyuk hyuk", LOVES the word STRIKE.
   digby   Professor Digby: excited old professor, big words for little things ("Extraordinary!", "Jolly good!").
   mossy   Mossy the Swamp Boat: slow, drawly and relaxed, hums between words ("Mmm…").
   rosa    Ranger Rosa: brisk, bossy-but-kind park ranger; blows her whistle a lot ("Tweet!").
   cinder  Cinder the Dimetrodon: hot and bothered, dramatic sighs ("Phew! It's TOASTY!"), calls you "honey". */
const QUEST_DINO_GERTIE={id:'gertie',name:'Grandma Gertie',emoji:'🥚',voice:'gertie',h:4.4,r:2.4,build:questGertieBuild};
const QUEST_DINO_THEO={id:'theo',name:'Thunderfoot Theo',emoji:'👟',voice:'theo',h:5.0,build:questTheoBuild};

// ===== Chapter 1: Pebble Village (micro–mini) =====
// Gertie sits by her nest at the edge of the square, next to the start. Her egg rolled a few car lengths down the
// path: push it back into the nest (the goal circle is the stage center = the nest), then three soft leaves to tuck it in.
registerQuest({
  id:'gertie_egg',world:'dino',chapter:1,main:true,
  giver:Object.assign({},QUEST_DINO_GERTIE,{at:questDinoAt('gertie_egg','giver')}),
  stageAt:questDinoAt('gertie_egg','nest')||questDinoAt('gertie_egg','stage'),stageR:6,
  remind:['Roll my egg home, sweetie!','Now where was I? Oh, my egg!'],
  steps:[
    {do:'talk',icon:'🥚',n:1,say:['Oh, hello there, sweetie.','My egg rolled away! Oh dear.','Roll my egg back to my nest!']},
    {do:'push',n:1,icon:'🥚',r:14,build:questGertieEgg,at:[questDinoAt('gertie_egg','egg')],
      say:{start:'It rolled down the path, dear!',hint:'Into the green circle, sweetie!',got:'Back in the nest! Lovely!'}},
    {do:'find',n:3,item:'leaf',icon:'🍃',at:questDinoAt('gertie_egg','leaves'),
      say:{start:'Now three soft leaves, sweetie.',each:['A soft one! Lovely!','Now where was I? Oh, leaves!'],hint:'Leaves round the square, dear!',got:'Three leaves! Perfect!'}},
    {do:'bring',n:1,icon:'🍃',say:{start:'Bring them here to tuck it in.',hint:'Over here, sweetie!'}}],
  reward:{cosmetic:'dinotail',stars:2,say:['Snug as a bug!','Peep peep! It says thank you!','Have a waggy dino tail!']},
  after:['Now where was I?','Shh. My egg is napping.']});

// Rocky waits at the village gate; eight hollow-log arches loop round the huts.
registerQuest({
  id:'rocky_race',world:'dino',chapter:1,main:false,needs:['gertie_egg'],
  giver:{id:'rocky',name:'Rocky Roadster',emoji:'🪨',voice:'rocky',at:questDinoAt('rocky_race','giver'),h:3.6,build:questRockyBuild},
  remind:['Rocky race! Eight logs!'],
  steps:[
    {do:'talk',icon:'🪵',n:8,say:['Rocky Roadster here!','Rocky love race!','Go through eight logs! Rocky race!']},
    {do:'rings',n:8,icon:'🪵',at:questDinoPts('rocky_race','rings',questDinoAt('rocky_race','stage'),11,8),
      say:{start:'Logs go round the village! Go!',each:['Whoa, you fast!','Rocky like!','Vroom vroom! Next log!','Faster than Rocky!'],hint:'Gold log! That way!',got:'Rocky dizzy. Good dizzy.'}}],
  reward:{cosmetic:'footprints',stars:1,say:['You fast like Rocky!','Rocky give you dino feet!']},
  after:['Rocky go FAST!','Rocky still dizzy.']});

// Mo waits at the nursery fence; six baby rexes scamper round the nursery.
registerQuest({
  id:'mo_hatchlings',world:'dino',chapter:1,main:false,needs:['gertie_egg'],
  giver:{id:'mo',name:'Mo the Nest-Sitter',emoji:'🐣',voice:'mo',at:questDinoAt('mo_hatchlings','giver'),h:3.8,build:questMoBuild},
  stageAt:questDinoAt('mo_hatchlings','stage'),stageR:8,
  remind:['Six babies! Catch them!'],
  steps:[
    {do:'talk',icon:'🐣',n:6,say:['Oh! Hi! Busy busy!','They hatched! They RAN!','Catch my six babies! Quick!']},
    {do:'catch',kind:'babyrex',n:6,icon:'🐣',
      say:{start:'They are running round my nursery!',each:['That\'s one! Wait, two!','Gotcha, little one!','Count count count!'],hint:'Bump the babies! Gently!',got:'All six! Phew!'}}],
  reward:{cosmetic:'eggshell',stars:1,say:['You are super sitters!','Here, an eggshell hat! Peep!']},
  after:['One, two, three... all here!','Phew. Nap time. Maybe.']});

// ===== Chapter 2: Nest Hills (tiny–small) =====
// Theo stands at the foot of the first hill. One sneaker sits on top of the giant nest (`lift`: bump the nest), the
// other floats above the end of the hill ramp (`y` 5: a jump at tiny/small reaches ~6.5, so it's a real hop up). With `lift` + `y` the one on a
// prop sits on it and the one in the open floats.
registerQuest({
  id:'theo_sneakers',world:'dino',chapter:2,main:true,
  giver:Object.assign({},QUEST_DINO_THEO,{at:questDinoAt('theo_sneakers','giver')}),
  stageAt:questDinoAt('theo_sneakers','stage'),stageR:10,
  remind:['Find my two sneakers, team!','No sneakers, no stomp!'],
  steps:[
    {do:'talk',icon:'👟',n:2,say:['Hey, team! Theo here!','My stompers are gone!','Find my two big sneakers!']},
    {do:'find',n:2,item:'sneaker',icon:'👟',lift:true,y:5,
      at:(s=>s?[s.nest,s.ramp].filter(Boolean):null)(questDinoAt('theo_sneakers','sneakers'))||'stage',
      say:{start:'One on the big nest! One up high!',each:['One sneaker! One more!'],
        hint:['Bump the big nest!','Jump off the ramp! Grab it!','My arms can\'t reach! You can!'],got:'Both sneakers! Yes!'}},
    {do:'bring',n:1,icon:'👟',say:{start:'Bring them here, team!',hint:'Over here! Tiny arms waving!'}}],
  reward:{ability:'stomp',stars:3,say:['Sneakers on! Now watch this.','Jump and land! STOMP!']},
  after:['Stomp stomp stomp!','Tiny arms, big feet!']});

// Petra waits on a hilltop; five hungry nests are spread over the hills.
registerQuest({
  id:'petra_worms',world:'dino',chapter:2,main:false,
  giver:{id:'petra',name:'Petra Pteranodon',emoji:'🪺',voice:'petra',at:questDinoAt('petra_worms','giver'),h:4.0,build:questPetraBuild},
  remind:['Five hungry nests, over!'],
  steps:[
    {do:'talk',icon:'🪱',n:5,say:['Petra here! Come in!','Babies are hungry, over!','Drop worms in five nests!']},
    {do:'deliver',n:5,icon:'🪱',at:questDinoPts('petra_worms','drops',questDinoAt('petra_worms','stage'),26,5),
      say:{start:'Nests are all over the hills, over!',each:['Delivery! Roger!','Chirp chirp! Got it!','Right on target!'],hint:'Glowing nest! Go go!',got:'All fed! Roger that!'}}],
  reward:{cosmetic:'roar',stars:2,say:['Mission complete! Over and out!','Here is a dino roar! RAWR!']},
  after:['Roger that!','Clear skies! Over!']});

// Rolly waits at the edge of the bowling hollow (the goal circle = the stage center); his five boulders sit on the
// slope above it.
const questRollyAt=(()=>{const c=questDinoAt('rolly_bowling','goal')||questDinoAt('rolly_bowling','stage');
  return {c,rocks:questDinoLoop(c,6.5,5,0.6)};})();
registerQuest({
  id:'rolly_bowling',world:'dino',chapter:2,main:false,
  giver:{id:'rolly',name:'Rolly the Ankylosaurus',emoji:'🎳',voice:'rolly',at:questDinoAt('rolly_bowling','giver'),h:3.2,build:questRollyBuild},
  stageAt:questRollyAt.c,stageR:8,
  remind:['Five rocks in the hole! Hyuk!'],
  steps:[
    {do:'talk',icon:'🪨',n:5,say:['Hyuk hyuk! Hiya!','Wanna go bowling?','Roll five rocks in the hole!']},
    {do:'push',n:5,icon:'🪨',r:22,build:questRollyBoulder,at:questRollyAt.rocks,
      say:{start:'The hole is right here! Hyuk!',each:['STRIKE! Hyuk hyuk!','Spare! Hyuk!','Roll roll roll!'],hint:'Into the green circle! Hyuk!',got:'Five strikes! Wowee!'}}],
  reward:{stars:3,say:['Best bowler ever!','Hyuk hyuk! High five!']},
  after:['STRIKE! Hyuk!','Bowling is the best.']});

// ===== Chapter 3: Tar-Pit Swamp + Fossil Dig (medium–large) =====
// Digby waits by the skeleton display stand in the dig. First the rock mounds in the dig (the last one pops out a
// bone: bring it to the stand, a short trip), then the three far bones: in the tar pit (a find item in a deep spot
// counts as wading), on top of the ribcage arch and up on the high ledge (`lift`: bump what it sits on), then back.
const questDigbyFar=(()=>{const P=questDinoAt('digby_bones','pieces')||{},c=questDinoAt('digby_bones','stage');
  return [P.tar||[c[0]-60,c[1]-36],P.ribcage||[c[0]+16,c[1]-20],P.ledge||[c[0]+32,c[1]+24]];})();
registerQuest({
  id:'digby_bones',world:'dino',chapter:3,main:true,
  giver:{id:'digby',name:'Professor Digby',emoji:'🦴',voice:'digby',at:questDinoAt('digby_bones','giver'),h:4.0,build:questDigbyBuild},
  stageAt:questDinoAt('digby_bones','stage'),stageR:9,
  remind:['Four bones, my friend!','The Mega-Saurus needs its bones!'],
  steps:[
    {do:'talk',icon:'🦴',n:4,say:['Ah! Explorers! Extraordinary!','The Mega-Saurus is missing bones!','Find four giant bones, my friend!']},
    {do:'smash',n:5,type:['dino_fossilrock','dino_rock'],icon:'🪨',at:questDinoAt('digby_bones','mounds'),reveal:'bone',revealIcon:'🦴',
      say:{start:'Smash the rock mounds in my dig!',each:['Not in this one!','Keep digging, chum!'],hint:'Smash the rocks! Jolly good!',got:'Extraordinary! A leg bone!'}},
    {do:'bring',n:1,icon:'🦴',say:{start:'Bring it to the display stand!',hint:'Over here, my friend!'}},
    {do:'find',n:3,item:'bone',icon:'🦴',at:questDigbyFar,lift:true,
      say:{start:'Three more! Tar pit, ribcage, high rock!',each:['Jolly good! Another bone!'],
        hint:['In the sticky tar pit!','On top of the big ribcage!','Up on the high rock!'],got:'All the bones! Marvelous!'}},
    {do:'bring',n:1,icon:'🦴',say:{start:'To the stand, quick quick!',hint:'Bring the bones to me!'}}],
  reward:{stars:4,say:['It is complete! Jolly good!','Look! It waves! Extraordinary!']},
  after:['What an extraordinary day!','Mind the bones, chum.']});

// Mossy waits on the swamp dock; eight lily-pad hoops loop over the tar pools (hover skims the tar; the deep tar
// just washes a driving car back, nothing fails).
registerQuest({
  id:'mossy_hoops',world:'dino',chapter:3,main:false,
  giver:{id:'mossy',name:'Mossy the Swamp Boat',emoji:'🛶',voice:'mossy',at:questDinoAt('mossy_hoops','giver'),h:3.4,build:questMossyBuild},
  remind:['Eight hoops... slow and easy...'],
  steps:[
    {do:'talk',icon:'🪷',n:8,say:['Mmm... hey there...','Float with me...','Through eight hoops... over the tar...']},
    {do:'rings',n:8,icon:'🪷',at:questDinoPts('mossy_hoops','rings',questDinoAt('mossy_hoops','stage'),40,8,0.5),
      say:{start:'Hoops are over the swamp... float...',each:['Ooh, nice.','Mmm... smooth.','Float on...'],hint:['Hold jump to float...','The gold hoop... that way...'],got:'Best swamp day ever.'}}],
  reward:{stars:3,say:['Mmm... you float good.','Come back... any time...']},
  after:['Mmm... floaty...','Hmm hmm hmm...']});

// Rosa waits at the corral gate (the goal circle = the corral); her eight trikes wander round it.
const questRosaAt=(()=>{const c=questDinoAt('rosa_trikes','goal')||questDinoAt('rosa_trikes','stage');return {c,trikes:questDinoLoop(c,17,8,0.3)};})();
registerQuest({
  id:'rosa_trikes',world:'dino',chapter:3,main:false,
  giver:{id:'rosa',name:'Ranger Rosa',emoji:'🤠',voice:'rosa',at:questDinoAt('rosa_trikes','giver'),h:4.2,build:questRosaBuild},
  stageAt:questRosaAt.c,stageR:8,
  remind:['Tweet! Eight trikes in the corral!'],
  steps:[
    {do:'talk',icon:'🦕',n:8,say:['Tweet tweet! Ranger Rosa!','Trikes on the loose!','Push eight trikes in the corral!']},
    {do:'push',n:8,kind:'trike',icon:'🦕',r:22,at:questRosaAt.trikes,
      say:{start:'The corral is right here! Tweet!',each:['Good herding!','Tweet! One more!','In you go, trike!'],hint:'Into the green circle! Tweet!',got:'All in! Ranger approved!'}}],
  reward:{stars:3,say:['Tweet! Great work, rangers!','You are honorary rangers!']},
  after:['Tweet tweet!','All trikes safe. Tweet!']});

// ===== Chapter 4: Volcano Peak (huge–GIANT) =====
// Theo again, now in his sneakers, by the volcano road; Rexy Rumbleton stomps in at the foot of the volcano.
registerQuest({
  id:'theo_rexy',world:'dino',chapter:4,main:true,
  giver:Object.assign({},QUEST_DINO_THEO,{at:questDinoAt('theo_rexy','giver')}),
  stageAt:questDinoAt('theo_rexy','stage'),
  remind:['Calm down Rexy! Use your STOMP!'],
  steps:[
    {do:'talk',icon:'🦖',n:1,say:['Team! Big trouble!','My big brother Rexy is GRUMPY!','Smash Rexy! He needs a nap!']},
    {do:'boss',boss:'rexy',n:1,icon:'🦖',say:{start:'He is stomping by the volcano!',hint:'Use your STOMP!'}},
    {do:'talk',icon:'😴',say:['He is sleepy now.','Shh. Night night, Rexy.']}],
  reward:{stars:4,say:['Thanks, team! Best team ever!','Dino Land is saved!']},
  after:['Shh! Rexy is napping.','Stomp quietly, team!']});

// Cinder fans herself on her beach chair on the volcano slope; thirty lava rocks lie round it (30, half of them the
// 2-mesh cinders: 40 lava rocks added ~300+ draw calls at huge).
registerQuest({
  id:'cinder_rocks',world:'dino',chapter:4,main:false,
  giver:{id:'cinder',name:'Cinder the Dimetrodon',emoji:'🔥',voice:'cinder',at:questDinoAt('cinder_rocks','giver'),h:4.0,build:questCinderBuild},
  stageAt:questDinoAt('cinder_rocks','stage'),stageR:9,
  remind:['Thirty rocks, honey! Smash them!'],
  steps:[
    {do:'talk',icon:'🪨',n:30,say:['Phew! It is TOASTY!','The volcano hiccupped rocks!','Smash thirty lava rocks, honey!']},
    {do:'smash',n:30,type:['dino_lavarock','dino_cinder'],icon:'🪨',at:questDinoAt('cinder_rocks','rocks'),
      say:{start:'They are all round my beach chair!',each:['Ooh, that\'s cooler!','Smash! Lovely!','Keep going, honey!','Phew! Nice one!'],hint:'More rocks, honey!',got:'Ahh, a nice breeze!'}}],
  reward:{stars:3,say:['You are so cool, honey!','Ahh. Much better.']},
  after:['Phew! Still toasty.','Pass the palm leaf, honey.']});

// Gertie again, on the long-neck meadow: round up ten long-necks for the family photo.
registerQuest({
  id:'gertie_photo',world:'dino',chapter:4,main:false,
  giver:Object.assign({},QUEST_DINO_GERTIE,{at:questDinoAt('gertie_photo','giver')}),
  stageAt:questDinoAt('gertie_photo','stage'),stageR:12,
  remind:['Ten long-necks for the photo!'],
  steps:[
    {do:'talk',icon:'🦕',n:10,say:['Oh, hello again, sweetie!','Family photo time!','Round up ten long-necks!']},
    {do:'catch',kind:'bronto',n:10,icon:'🦕',
      say:{start:'They are out on the meadow, dear!',each:['Say CHEESE!','Now where was I? Oh, yes!','Lovely! Next one!'],hint:'Bump the long-necks, sweetie!',got:'Everyone is here! Say CHEESE!'}}],
  reward:{stars:3,say:['Oh, I will frame this one.','Thank you, sweetie!']},
  after:['What a lovely family.','Say cheese, sweetie!']});
