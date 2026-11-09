/* Smash Party — WORLD: BOSSES. Owner: world-bosses session (Claude Code design). Loads after objects.js.
   BOSSES replaces logic's placeholders (BOSS_DEFAULT in game.js). Each entry: {id, name, emoji, sway, build(P,g,o){…}}.
   Built like a building at 1x scale (~11 tall, radius ~3.6; logic scales it ×BOSS_SCALE): P(BP(mesh,floor,kind),chunks,whole,half).
   Weak spots: P(bossWeak(mesh,floor,phase),3), two per phase, low (<3.5 at 1x) and on the outside. Logic swaps their
   material for the glowing one, so their color here doesn't matter.
   Every boss faces +Z, is a goofy toy (googly eyes, silly props) and never scary. Test with __sp.boss('id').
   Spinning bits: set mesh.userData.spin and list the mesh in o.spin (logic's updateSpin turns them while the boss lives).

   Clankzilla 🤖   a junk robot: washing-machine body (with a sock in the window), toaster head with toast popping out,
                   tin-can legs in sneakers, a plunger in one hand and a spatula in the other, propeller on top.
                   Weak spots: 1 knee bolts (front) · 2 sneaker heels (back) · 3 washer dial (front) + battery (back).
   Shelldozer 🦀   a beach crab with one giant fiddler claw, wearing a sandcastle as its shell, pinwheel on the keep.
                   Weak spots: 1 claw wrists (front) · 2 tickly back bumps · 3 castle shells (front-right, back-left).
   King Wobbles 👑 a roly-poly toy king: round purple bottom, wonky stacked-block tummy, curly mustache, tiny tilted
                   crown, lollipop scepter and a wind-up key turning in his back.
                   Weak spots: 1 slipper pompoms (front) · 2 belt buckle (front) + wind-up key (back) · 3 robe jewels (sides).
   Themed bosses (zone:'<id>' → L23 summons them in their zone; until then they join the random pick).
   Dino Land (B4): Rexy is the jungle's boss and the Adventure finale (quest theo_rexy asks for him by id),
   Lava Larry lives on Volcano Peak (dino_volcano) and Mama Stego in the Tar-Pit Swamp (dino_swamp). The Fossil Dig
   (dino_dig) has none yet, so it picks from the dino bosses on the map.
   Optional taunts:[…] and defeat:'…' are each boss's own voice lines (TODO(logic): play them instead of the generic ones):
   Gummo the Gummy Giant 🐻 (candy) a big wobbly cherry gummy bear with a lime belly, a tiny party hat with a
                   spinning peppermint, and a swirl lollipop in each paw. Very high sway, so he jiggles.
                   Weak spots: 1 gumdrop belly buttons · 2 candy-cane toe caps · 3 the two lollipops (held low).
   Rexy Rumbleton 🦖 (dino) a clumsy pastel T-rex: giant head, wide toothy grin, googly eyes, polka-dot belly,
                   rounded back plates and teeny arms that windmill. Teeters when hit.
                   Weak spots: 1 big toenails · 2 round knee pads · 3 the tail tip + tail bump dragging on the ground.
   Gumbo-Tron 3000 🍬 (candy) a walking gumball-machine robot: red base body with a coin-slot mouth, a glass-globe head
                   full of gumballs (they fly out whole), googly eyes on the glass, a ring of gumballs twirling on top.
                   Weak spots: 1 coin-slot knobs (chest) · 2 silver turn-crank hands · 3 red hatch knees.
   Lava Larry 🌋    (dino_volcano) the smiling volcano on four stubby legs with a rocky tail, googly eyes, lava drips and smoke
                   rings puffing out of his crater.
                   Weak spots: 1 glowing lava vents (sides) · 2 rock toes (front feet) · 3 lava-drip knees (back legs).
   Sir Sprinkles 🎂 (candy) a walking three-tier birthday cake on red licorice legs and cake-board feet, frosting
                   arms, a happy face on the middle tier and a crown of candles (they fly off like fireworks).
                   Weak spots: 1 cherry kneecaps · 2 sprinkle patches on the bottom tier · 3 the cake-board feet.
   Mama Stegosaurus "Plates" 🦕 (dino_swamp) a chunky pastel stego with a row of giant colorful back plates (they fly off
                   whole), eyelashes, a flower bow, and a spotted egg balanced on her tail.
                   Weak spots: 1 painted belly spots (sides) · 2 tail-spike thumbs on the ground · 3 front feet.
   Captain Cuddles 🧸 (bedroom) a big living teddy bear in striped pajamas and a floppy nightcap with a pompom, one
                   sleepy button eye, dragging his yellow blankie along.
                   Weak spots: 1 pajama buttons · 2 pink foot pads · 3 the blankie corner (front) + stubby tail (back). */

// helpers (prefixed boss… so no other lane collides)
function bossRot(m,x=0,y=0,z=0){m.rotation.set(x,y,z);return m;}
function bossGroup(x,y,z,...kids){const g=new THREE.Group();g.position.set(x,y,z);for(const k of kids)g.add(k);return g;}
// a smile: the bottom half of a ring (one shared geometry), scaled to fit a face
const BOSS_SMILE=new THREE.TorusGeometry(0.5,0.12,8,18,Math.PI);
const BOSS_RING=new THREE.TorusGeometry(0.5,0.17,8,20); // smoke rings
function bossTilt(m,rx,ry){m.rotation.order='YXZ';m.rotation.set(rx,ry,0);return m;}   // turn around Y, then tip around X
function bossSmile(color,x,y,z,sx,sy,sz){const m=new THREE.Mesh(BOSS_SMILE,M(color));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.rotation.z=Math.PI;m.castShadow=true;return m;}
// a googly eye: white ball + black pupil nudged toward (lx,ly) so each eye can look a different silly way
function bossEye(P,floor,x,y,z,s,lx,ly){
  P(BP(mk('sph',s,s,s*0.45,'#ffffff',x,y,z),floor,'extra'),1,true,0.4*s);
  P(BP(mk('sph',s*0.45,s*0.45,s*0.25,'#111111',x+lx*s*0.2,y+ly*s*0.2,z+s*0.2),floor,'extra'),1,true,0.2*s);
}

const BOSSES=[
  {id:'clankzilla',name:'Clankzilla',emoji:'🤖',sway:0.06,build(P,g,o){
    // floor 0: sneakers + tin-can legs
    for(const sx of [-1,1]){const x=sx*1.4;
      P(BP(mk('box',1.8,0.8,2.7,'#e63946',x,0.4,0.25),0,'wall'),4);                      // sneaker
      P(BP(mk('box',1.85,0.35,0.9,'#ffffff',x,0.25,1.25),0,'wall'),2);                  // white toe cap
      P(BP(mk('cyl',1.3,2.3,1.3,'#adb5bd',x,1.95,0),0,'wall'),5);                       // tin can
      P(BP(mk('cyl',1.4,0.3,1.4,'#3a86ff',x,2.2,0),0,'extra'),2,false,0.5);              // can label stripe
      P(bossWeak(mk('sph',1,1,1,'#ffd60a',x,1.8,0.75),0,1),3);                          // phase 1: knee bolts
      P(bossWeak(mk('sph',1,1,1,'#ffd60a',x,0.75,-1.35),0,2),3);}                       // phase 2: sneaker heels
    // floor 1: washing-machine body
    const by=4.9;
    P(BP(mk('box',4,0.4,2.6,'#6c757d',0,3.25,0),1,'slab'),4);                            // hips
    P(BP(mk('box',4.6,3.6,0.5,'#f1faee',0,by,1.25),1,'wall'),8);P(BP(mk('box',4.6,3.6,0.5,'#f1faee',0,by,-1.25),1,'wall'),8);
    for(const sx of [-1,1])P(BP(mk('box',0.5,3.6,2,'#e9ecef',sx*2.05,by,0),1,'wall'),5);
    P(BP(mk('box',4.7,0.4,3.1,'#ced4da',0,6.85,0),1,'slab'),4);                          // lid
    P(BP(bossRot(mk('cyl',2.6,0.3,2.6,'#6c757d',0.4,5.1,1.55),Math.PI/2),1,'extra'),3,true,1.2); // porthole ring
    P(BP(bossRot(mk('cyl',2.05,0.34,2.05,'#a0e7ff',0.4,5.1,1.6),Math.PI/2),1,'extra'),2,true,1);
    P(BP(bossRot(mk('box',0.55,1,0.12,'#ff8fab',0.5,4.9,1.8),0,0,0.6),1,'extra'),1,true,0.4); // a lost sock!
    P(BP(mk('sph',0.5,0.5,0.3,'#06d6a0',-1.65,6.25,1.55),1,'extra'),1,true,0.25);P(BP(mk('sph',0.5,0.5,0.3,'#ff006e',-1.05,6.25,1.55),1,'extra'),1,true,0.25);
    P(bossWeak(mk('sph',1.1,1.1,1.1,'#ffd60a',-1.45,3.6,1.6),1,3),3);                    // phase 3: washer dial (front)
    P(bossWeak(mk('sph',1.1,1.1,1.1,'#ffd60a',0,3.6,-1.6),1,3),3);                       //          battery (back)
    // floor 1: floppy arms holding a plunger and a spatula
    for(const sx of [-1,1]){
      P(BP(bossRot(mk('cyl',0.7,2.6,0.7,'#adb5bd',sx*2.85,4.7,0.3),0,0,sx*0.15),1,'extra'),2,true,0.8);
      P(BP(bossRot(mk('cyl',0.95,0.35,0.95,'#495057',sx*2.85,4.7,0.3),0,0,sx*0.15),1,'extra'),1,true,0.4); // elbow spring
      P(BP(mk('sph',0.9,0.9,0.9,'#6c757d',sx*3.05,3.35,0.45),1,'extra'),1,true,0.45);    // grabber hand
      P(BP(mk('cyl',0.22,2.6,0.22,'#bc6c25',sx*3.05,4.4,0.95),1,'extra'),1,true,0.6);}  // tool handles
    P(BP(mk('sph',1.4,0.8,1.4,'#e63946',-3.05,5.8,0.95),1,'extra'),1,true,0.6);          // plunger cup
    P(BP(mk('box',1.2,1.3,0.15,'#fb5607',3.05,6.2,0.95),1,'extra'),1,true,0.6);          // spatula
    // floor 2: toaster head
    const hy=7.95;
    for(const sx of [-1,1])P(BP(mk('box',1.6,2.1,2.2,'#ced4da',sx*0.8,hy,0),2,'wall'),4);
    P(BP(mk('box',0.3,0.3,0.9,'#222222',1.75,hy+0.3,0),2,'extra'),1,true,0.3);            // toaster lever
    P(BP(bossRot(mk('cyl',0.6,0.3,0.6,'#ffbe0b',-1.75,hy-0.2,0),0,0,Math.PI/2),2,'extra'),1,true,0.3); // ear bolt
    bossEye(P,2,-0.68,hy+0.25,1.15,1.05,-1,1);bossEye(P,2,0.68,hy+0.25,1.15,0.9,1,-1);   // mismatched googly eyes
    P(BP(mk('box',1.5,0.3,0.12,'#333333',0,hy-0.6,1.12),2,'extra'),1,true,0.3);           // grin
    P(BP(mk('box',0.32,0.3,0.13,'#ffffff',0.3,hy-0.62,1.14),2,'extra'),1,true,0.2);       // one silly tooth
    // floor 3: toast popping out + propeller beanie
    for(const z of [-0.45,0.45]){
      P(BP(bossRot(mk('box',1.3,1.3,0.3,'#e9c46a',0,hy+1.5,z),z*0.2),3,'roof'),2,true,0.6);
      P(BP(bossRot(mk('box',1.35,0.22,0.32,'#9c6644',0,hy+2.15,z*1.05),z*0.2),3,'roof'),1,true,0.3);}
    P(BP(mk('cyl',0.14,1.3,0.14,'#333333',-1,hy+1.7,-0.7),3,'roof'),1,true,0.6);
    const prop=mk('box',2,0.12,0.4,'#ff006e',-1,hy+2.4,-0.7);prop.userData.spin={axis:'y',speed:5};
    P(BP(prop,3,'roof'),1,true,0.6);P(BP(mk('sph',0.35,0.35,0.35,'#ffd60a',-1,hy+2.5,-0.7),3,'roof'),1,true,0.2);
    o.spin=[prop];}},

  {id:'shelldozer',name:'Shelldozer',emoji:'🦀',sway:0.04,build(P,g,o){
    // floor 0: round crab body, legs, claws
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',3.4,2.2,3,'#ff6b35',sx*1.1,1.7,sz*0.8),0,'wall'),5);
    P(BP(mk('cyl',4.6,0.5,4,'#ffb703',0,0.75,0),0,'slab'),4);                             // belly
    for(const sx of [-1,1])for(let k=0;k<3;k++)
      P(BP(bossRot(mk('box',2.4,0.38,0.42,'#e63946',sx*3.2,0.85,-1.5+k*1.1),0,sx*(k-1)*0.3,-sx*0.55),0,'extra'),2,true,0.4);
    for(const sx of [-1,1]){const k=sx>0?1.35:0.9,x=sx*(2.4+0.2*k);                       // one giant fiddler claw, one tiny one
      P(BP(bossRot(mk('cyl',0.6,1.6,0.6,'#e63946',sx*2.3,1.3,2.5),Math.PI/2),0,'extra'),2,true,0.5);
      P(BP(mk('sph',1.5*k,1.2*k,1.5*k,'#ff6b35',x,1.3+0.1*k,3.3+0.9*k),0,'extra'),3,true,0.6*k);       // claw palm
      P(BP(bossRot(mk('box',0.8*k,0.55*k,1.6*k,'#e85d04',x,1.3+0.45*k,3.3+2*k),-0.3),0,'extra'),2,true,0.5*k); // top pincer
      P(BP(bossRot(mk('box',0.7*k,0.45*k,1.3*k,'#e85d04',x,1.3-0.3*k,3.2+1.9*k),0.3),0,'extra'),2,true,0.4*k);
      P(bossWeak(mk('sph',1.05,1.05,1.05,'#ffd60a',sx*2.3,1.3,3.3),0,1),3);              // phase 1: claw wrists
      P(bossWeak(mk('sph',1,1,1,'#ffd60a',sx*2,1.1,-2.3),0,2),3);}                        // phase 2: tickly back bumps
    P(BP(mk('box',1.2,0.2,0.12,'#7a1d00',0,1.55,2.0),0,'extra'),1,true,0.3);             // smile
    for(const sx of [-1,1])P(BP(mk('sph',0.65,0.4,0.2,'#ffafcc',sx*1.35,1.8,2.28),0,'extra'),1,true,0.2); // rosy cheeks
    // floor 1: eye stalks + sandcastle base
    for(const sx of [-1,1]){P(BP(mk('cyl',0.3,1.7,0.3,'#e63946',sx*0.8,3.3,2.0),1,'extra'),1,true,0.5);
      bossEye(P,1,sx*0.8,4.35,2.1,1.15,sx*0.6,0.6);}
    P(BP(mk('cyl',4.4,0.4,4,'#e9c46a',0,2.95,0),1,'slab'),4);
    for(const sz of [-1,1])P(BP(mk('box',3.4,1.8,0.5,'#f4d58d',0,4.05,sz*1.45),1,'wall'),5);
    for(const sx of [-1,1])P(BP(mk('box',0.5,1.8,2.4,'#f4d58d',sx*1.45,4.05,0),1,'wall'),5);
    P(BP(mk('box',0.8,0.9,0.1,'#8d5524',0,3.6,1.72),1,'extra'),1,true,0.4);P(BP(bossRot(mk('cyl',0.8,0.1,0.8,'#8d5524',0,4.05,1.72),Math.PI/2),1,'extra'),1,true,0.4); // arched door
    P(BP(mk('sph',0.6,0.5,0.25,'#cdb4db',-1,4.35,1.75),1,'extra'),1,true,0.3);P(BP(mk('sph',0.55,0.45,0.25,'#ffc8dd',1.2,4.5,-1.75),1,'extra'),1,true,0.3); // seashells
    P(bossWeak(mk('sph',1.05,1.05,1.05,'#ffd60a',1,3.5,1.85),1,3),3);                    // phase 3: glowing shells
    P(bossWeak(mk('sph',1.05,1.05,1.05,'#ffd60a',-1,3.5,-1.85),1,3),3);
    // floor 2: towers + bucket keep
    for(const [x,z] of [[-1.45,-1.45],[1.45,-1.45],[-1.45,1.45],[1.45,1.45]])P(BP(mk('cyl',1.15,2,1.15,'#f4d58d',x,5.9,z),2,'wall'),3);
    P(BP(mk('cyl',1.9,2.8,1.9,'#e9c46a',0,6.3,0),2,'wall'),5);
    // floor 3: wet-sand caps, pinwheel
    for(const [x,z] of [[-1.45,-1.45],[1.45,-1.45],[-1.45,1.45],[1.45,1.45]])P(BP(mk('cyl',1.4,0.4,1.4,'#d4a373',x,7.1,z),3,'roof'),1,true,0.5);
    P(BP(mk('cyl',2.2,0.4,2.2,'#d4a373',0,7.9,0),3,'roof'),3,true,0.8);
    P(BP(mk('cyl',0.12,1.8,0.12,'#ffffff',0,9,0),3,'roof'),1,true,0.6);
    const wheel=bossGroup(0,9.9,0.15,mk('box',1.9,0.4,0.08,'#06d6a0'),mk('box',0.4,1.9,0.08,'#3a86ff'),
      bossRot(mk('box',1.9,0.4,0.08,'#ffbe0b'),0,0,Math.PI/4),bossRot(mk('box',1.9,0.4,0.08,'#ff006e'),0,0,-Math.PI/4),mk('sph',0.3,0.3,0.3,'#ffffff',0,0,0.08));
    wheel.userData.spin={axis:'z',speed:3};P(BP(wheel,3,'roof'),2,true,0.8);
    o.spin=[wheel];}},

  {id:'kingwobbles',name:'King Wobbles',emoji:'👑',sway:0.14,build(P,g,o){
    // floor 0: roly-poly bottom, slippers, belt, wind-up key
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',3,2.8,3,'#7b2cbf',sx*0.85,1.45,sz*0.85),0,'wall'),5);
    for(const sx of [-1,1]){P(BP(mk('box',1,0.5,1.4,'#ffbe0b',sx*0.9,0.25,2.1),0,'extra'),1,true,0.4); // curly slippers
      P(bossWeak(mk('sph',1,1,1,'#ffd60a',sx*0.9,0.55,2.85),0,1),3);                     // phase 1: slipper pompoms
      P(bossWeak(mk('sph',1.1,1.1,1.1,'#ffd60a',sx*2.45,1.4,0),0,3),3);}                 // phase 3: robe jewels (sides)
    P(BP(mk('cyl',4.3,0.45,4.3,'#ffd60a',0,2.25,0),0,'extra'),4,false,0.5);               // belt
    P(bossWeak(mk('sph',1,1,1,'#ffd60a',0,2.25,2.2),0,2),3);                              // phase 2: belt buckle (front)
    P(bossWeak(mk('sph',1,1,1,'#ffd60a',0,2.25,-2.2),0,2),3);                             //          key hub (back)
    const key=bossGroup(0,2.25,-3,bossRot(mk('cyl',0.3,1,0.3,'#ced4da'),Math.PI/2),
      bossRot(mk('cyl',1,0.25,1,'#ced4da',-0.6,0,-0.4),Math.PI/2),bossRot(mk('cyl',1,0.25,1,'#ced4da',0.6,0,-0.4),Math.PI/2));
    key.userData.spin={axis:'z',speed:1.6};P(BP(key,0,'extra'),2,true,0.6);
    // floor 1: ermine collar, wonky stacked-block tummy, cape, arms
    P(BP(mk('cyl',3.8,0.5,3.8,'#f8f9fa',0,2.95,0),1,'slab'),3);
    for(const x of [-0.9,0,0.9])P(BP(mk('sph',0.28,0.28,0.2,'#111111',x,2.95,1.88),1,'extra'),1,true,0.15);
    const blocks=[[-0.8,3.9,'#e63946','#ffbe0b',0.05],[0.8,3.9,'#3a86ff','#ffffff',-0.05],[-0.6,5.3,'#ffbe0b','#e63946',0.14],[0.9,5.3,'#06d6a0','#fff3b0',0.12]];
    for(const [x,y,c,ci,ry] of blocks){P(BP(bossRot(mk('box',1.6,1.4,2,c,x,y,0),0,ry),1,'wall'),3);
      P(BP(bossRot(mk('box',0.9,0.8,0.08,ci,x+Math.sin(ry)*1.02,y,Math.cos(ry)*1.02),0,ry),1,'extra'),1,true,0.3);}
    P(BP(bossRot(mk('box',3.6,3.3,0.25,'#d00000',0,4.35,-1.2),0.12),1,'extra'),3,true,1.2);  // cape
    P(BP(bossRot(mk('box',0.8,1.7,0.8,'#9d4edd',-2,4.6,0.2),0,0,-0.35),1,'extra'),2,true,0.6); // arm down
    P(BP(mk('sph',0.9,0.9,0.9,'#ffffff',-2.35,3.7,0.3),1,'extra'),1,true,0.45);
    P(BP(bossRot(mk('box',0.8,1.7,0.8,'#9d4edd',2.1,5.6,0.3),0,0,-0.5),1,'extra'),2,true,0.6);  // arm up, waving the scepter
    // floor 2: big round head, googly eyes, mustache, lollipop scepter
    P(BP(mk('sph',0.9,0.9,0.9,'#ffffff',2.55,6.4,0.4),2,'extra'),1,true,0.45);
    P(BP(mk('cyl',0.22,3,0.22,'#ffffff',2.55,6.9,0.6),2,'extra'),1,true,0.6);
    const pop=bossGroup(2.55,8.9,0.6,bossRot(mk('cyl',1.9,0.35,1.9,'#ff5d8f'),Math.PI/2),
      bossRot(mk('cyl',1.1,0.37,1.1,'#ffffff',0.22,0.12,0),Math.PI/2),bossRot(mk('cyl',0.5,0.39,0.5,'#ff5d8f',0.32,0.22,0),Math.PI/2));
    pop.userData.spin={axis:'z',speed:2.2};P(BP(pop,2,'extra'),2,true,0.8);
    P(BP(mk('sph',3,2.8,2.8,'#ffd7ba',0,7.4,0),2,'wall'),6);
    bossEye(P,2,-0.6,7.75,1.25,1,-1,1);bossEye(P,2,0.6,7.75,1.25,1,1,-1);
    P(BP(mk('sph',0.8,0.7,0.7,'#ff8fa3',0,7.25,1.5),2,'extra'),1,true,0.35);             // round nose
    for(const sx of [-1,1]){P(BP(bossRot(mk('box',1.3,0.32,0.3,'#6f4518',sx*0.65,6.95,1.38),0,0,sx*0.3),2,'extra'),1,true,0.4); // curly mustache
      P(BP(mk('sph',0.42,0.42,0.42,'#6f4518',sx*1.3,7.2,1.25),2,'extra'),1,true,0.2);
      P(BP(mk('sph',0.55,0.4,0.2,'#ffafcc',sx*1.05,7.05,0.97),2,'extra'),1,true,0.2);}  // rosy cheeks
    P(BP(mk('sph',0.35,0.35,0.2,'#5a1e1e',0,6.6,1.18),2,'extra'),1,true,0.2);            // tiny "oh!" mouth
    // floor 3: a crown way too small for his head, sliding off to one side
    const crown=bossGroup(0.4,8.95,0,mk('cyl',1.3,0.55,1.3,'#ffd60a'),
      ...[0,1,2,3].map(i=>{const a=i/4*Math.PI*2+0.4;return mk('cone',0.32,0.55,0.32,'#ffd60a',Math.sin(a)*0.5,0.52,Math.cos(a)*0.5);}),
      mk('sph',0.32,0.32,0.2,'#e63946',0,0.05,0.65));
    crown.rotation.z=-0.28;P(BP(crown,3,'roof'),2,true,0.6);
    o.spin=[key,pop];}},
  {id:'gummo',zone:'candy',name:'Gummo the Gummy Giant',emoji:'🐻',sway:0.17,
   taunts:['Squishy squishy! You can\'t catch me!','I\'m all wiggly jiggly!','Want a lollipop? Come and get it!'],
   defeat:'Aww, I\'m all melty now. Good job, friends!',build(P,g,o){
    const red='#e63946',deep='#c1121f',lime='#b9fbc0',pink='#ff8fab';                   // CANDY_RED + candy-zone pastels
    // floor 0: chubby feet, stubby legs, round tummy
    for(const sx of [-1,1]){const x=sx*1.25;
      P(BP(mk('sph',1.9,1.1,2.5,red,x,0.55,0.5),0,'wall'),4);                             // foot
      P(BP(bossRot(mk('cyl',1.25,0.28,1.15,'#ffffff',x,0.6,1.25),Math.PI/2),0,'extra'),1,true,0.4); // candy-cane stripes
      P(BP(bossRot(mk('cyl',1.2,0.28,1.1,red,x,0.6,1.5),Math.PI/2),0,'extra'),1,true,0.4);
      P(bossWeak(mk('sph',1.05,0.95,1,'#ffd60a',x,0.6,1.85),0,2),3);                     // phase 2: candy-cane toe caps
      P(BP(mk('sph',1.9,2.2,1.9,red,sx*1.15,1.8,0),0,'wall'),4);}                        // leg
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',3,3.4,3,red,sx*0.85,3.6,sz*0.8),0,'wall'),4);
    P(BP(mk('sph',3,3.2,1.4,lime,0,3.6,1.65),0,'extra'),4,true,1.2);                       // lime belly
    for(const sx of [-1,1])P(bossWeak(mk('sph',1,0.9,0.9,'#ffd60a',sx*0.65,3.05,2.35),0,1),3); // phase 1: gumdrop belly buttons
    P(BP(mk('sph',1,1,0.9,deep,0,2.6,-2.3),0,'extra'),1,true,0.4);                        // stubby tail
    // floor 1: chest, floppy arms, a lollipop in each paw (held low)
    P(BP(mk('cyl',3.6,0.45,3.4,deep,0,5.25,0),1,'slab'),3);
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',2.6,2.8,2.6,red,sx*0.75,6.5,sz*0.6),1,'wall'),3);
    for(const sx of [-1,1]){const x=sx*2.75;
      P(BP(bossRot(mk('sph',1.15,2.7,1.15,red,sx*2.3,4.7,0.6),0,0,sx*0.35),1,'extra'),2,true,0.6); // arm
      P(BP(mk('sph',1.25,1.2,1.25,deep,x,3.1,0.9),1,'extra'),1,true,0.5);                // paw
      P(BP(bossRot(mk('cyl',0.2,1.5,0.2,'#ffffff',x,2.75,1.6),Math.PI/2),1,'extra'),1,true,0.4); // lollipop stick
      P(bossWeak(bossRot(mk('cyl',1.4,0.35,1.4,'#ffd60a',x,2.75,2.4),Math.PI/2),1,3),3);} // phase 3: lollipops
    // floor 2: big round head, snout, googly eyes, toothy smile
    for(const sx of [-1,1])P(BP(mk('sph',2.3,3,2.8,red,sx*0.7,9,0.1),2,'wall'),4);
    P(BP(mk('sph',3,2.8,1.8,red,0,9,-0.7),2,'wall'),3);
    P(BP(mk('sph',1.9,1.35,1.4,pink,0,8.6,1.45),2,'extra'),1,true,0.5);                   // snout
    P(BP(mk('sph',0.75,0.55,0.5,'#5c3317',0,8.95,2.1),2,'extra'),1,true,0.3);            // chocolate nose
    P(BP(mk('box',1,0.18,0.12,'#5c3317',0,8.25,2.12),2,'extra'),1,true,0.3);              // smile
    P(BP(mk('box',0.3,0.28,0.1,'#ffffff',0,8.08,2.12),2,'extra'),1,true,0.2);             // one buck tooth
    bossEye(P,2,-0.62,9.65,1.35,0.95,-1,0.6);bossEye(P,2,0.62,9.65,1.35,1.1,1,-0.8);     // mismatched googly eyes
    for(const sx of [-1,1])P(BP(mk('sph',0.6,0.4,0.2,'#ffafcc',sx*1.15,8.75,1.3),2,'extra'),1,true,0.2); // rosy cheeks
    // floor 3: round ears + a tiny party hat with a spinning peppermint
    for(const sx of [-1,1]){P(BP(mk('sph',1.15,1.15,0.7,red,sx*1.2,10.35,0),3,'roof'),2,true,0.5);
      P(BP(mk('sph',0.6,0.6,0.3,pink,sx*1.2,10.35,0.3),3,'roof'),1,true,0.25);}
    const hat=bossRot(mk('cone',1,1.4,1,'#8338ec',0.15,11,0),0,0,-0.25);P(BP(hat,3,'roof'),1,true,0.5);
    const mint=bossGroup(0.35,11.85,0.1,bossRot(mk('cyl',0.9,0.2,0.9,'#ffffff'),Math.PI/2),
      bossRot(mk('box',0.85,0.16,0.22,red,0,0,0),0,0,0),bossRot(mk('box',0.85,0.16,0.22,red,0,0,0),0,0,Math.PI/2));
    for(const k of mint.children)k.position.z=k.geometry===GEO.box?0.06:0;
    mint.userData.spin={axis:'z',speed:4};P(BP(mint,3,'roof'),1,true,0.4);
    o.spin=[mint];}},

  {id:'rexy',zone:'dino',name:'Rexy Rumbleton',emoji:'🦖',sway:0.13,
   taunts:['Rawr! That means hello!','My arms are too tiny to stop you!','Stompy stomp stomp!'],
   defeat:'Oof! Rexy needs a nap. You did it!',build(P,g,o){
    const grn='#80ed99',dk='#57cc99',belly='#fff1c1',ink='#22223b',spots=['#ff8fab','#4cc9f0','#ffbe0b','#9b5de5']; // dino-zone pastels
    // floor 0: big feet, shins, chunky thighs, and a tail dragging along the ground
    for(const sx of [-1,1]){const x=sx*1.3;
      P(BP(mk('box',1.7,0.75,2.5,dk,x,0.38,0.6),0,'wall'),4);                             // foot
      for(const tx of [-0.55,0.55])P(BP(mk('sph',0.45,0.4,0.5,'#fff4dc',x+tx,0.35,1.85),0,'extra'),1,true,0.2); // little toenails
      P(bossWeak(mk('sph',0.95,0.8,0.9,'#ffd60a',x,0.45,1.95),0,1),3);                   // phase 1: big middle toenail
      P(BP(mk('cyl',1.3,1.7,1.3,grn,x,1.5,0.1),0,'wall'),3);                              // shin
      P(BP(mk('sph',2.2,2.6,2.4,grn,sx*1.35,3,-0.1),0,'wall'),4);                         // thigh
      P(bossWeak(mk('sph',1.15,1.05,0.9,'#ffd60a',sx*1.45,2.35,1.05),0,2),3);}          // phase 2: round knee pads
    const tail=[[0,3.2,-2,2.3],[0,2.4,-3.1,1.9],[0,1.6,-4.1,1.5],[0,1,-4.9,1.15]];
    for(const [x,y,z,s] of tail)P(BP(mk('sph',s,s*0.9,s*1.3,grn,x,y,z),0,'extra'),2,true,s*0.45);
    for(const [y,z,c] of [[3.6,-2.6,0],[2.75,-3.6,1],[1.95,-4.5,2]])P(BP(mk('sph',0.7,0.6,0.7,spots[c],0,y,z),0,'extra'),1,true,0.3); // tail plates
    P(bossWeak(mk('sph',1.05,0.95,1.3,'#ffd60a',0,0.6,-5.6),0,3),3);                     // phase 3: tail tip …
    P(bossWeak(mk('sph',0.9,0.8,0.9,'#ffd60a',0,1.7,-4.1),0,3),3);                       //          … and the tail bump
    P(BP(mk('cyl',3.8,0.5,3.2,dk,0,3.95,0),0,'slab'),3);                                 // hips
    // floor 1: pear-shaped body, polka-dot belly, rounded back plates, teeny windmilling arms
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',2.8,3.4,2.8,grn,sx*0.75,5.7,sz*0.6),1,'wall'),3);
    P(BP(mk('sph',3,3.6,1.6,belly,0,5.5,1.25),1,'extra'),3,true,1.2);
    for(const [x,y,c] of [[-0.6,6.4,0],[0.55,5.9,1],[-0.4,4.9,2],[0.7,4.6,3],[0.05,5.4,0]])
      P(BP(mk('sph',0.55,0.55,0.2,spots[c],x,y,2.05),1,'extra'),1,true,0.2);             // polka dots
    for(const [y,z,c] of [[7,-1.3,1],[5.9,-1.85,3],[4.7,-2.05,0]])P(BP(mk('sph',0.9,0.8,0.9,spots[c],0,y,z),1,'extra'),1,true,0.35); // back plates
    const arms=[];
    for(const sx of [-1,1]){const arm=bossGroup(sx*1.55,6.6,1.5,mk('box',0.4,0.4,0.9,grn,0,0,0.35),
        mk('sph',0.45,0.45,0.45,dk,0,0,0.85),mk('box',0.12,0.12,0.3,'#fff4dc',sx*0.1,-0.05,1.1));
      arm.userData.spin={axis:'x',speed:sx*5};P(BP(arm,1,'extra'),1,true,0.4);arms.push(arm);}
    P(BP(mk('cyl',2.8,0.5,2.5,dk,0,7.6,0),1,'slab'),3);                                  // neck
    // floor 2: giant head with a wide toothy grin and googly eyes
    for(const sx of [-1,1])P(BP(mk('sph',2.5,2.7,4.5,grn,sx*0.75,9.05,0.9),2,'wall'),4);
    P(BP(mk('sph',3.3,1.3,3.7,dk,0,7.95,1.25),2,'wall'),3);                              // lower jaw
    P(BP(bossSmile(ink,0,8.95,2.72,2.7,1.3,2),2,'extra'),1,true,0.4);                    // big wide grin
    for(const tx of [-0.3,0.3])P(BP(mk('box',0.42,0.4,0.16,'#ffffff',tx,8.18,2.78),2,'extra'),1,true,0.15); // two goofy buck teeth
    for(const sx of [-1,1]){P(BP(mk('sph',0.28,0.22,0.2,ink,sx*0.4,9.4,3.25),2,'extra'),1,true,0.15); // nostrils
      P(BP(mk('sph',0.7,0.45,0.25,'#ffafcc',sx*1.3,8.9,2.6),2,'extra'),1,true,0.2);}   // rosy cheeks
    bossEye(P,2,-0.85,10.15,2,1.3,-0.8,1);bossEye(P,2,0.85,10.15,2,1.1,1,-0.6);            // googly eyes looking two ways
    // floor 3: a row of rounded head bumps
    for(const [z,c] of [[1.4,0],[0.3,2],[-0.8,1]])P(BP(mk('sph',0.8,0.7,0.8,spots[c],0,10.45,z),3,'roof'),1,true,0.35);
    o.spin=arms;}},

  {id:'gumbotron',zone:'candy',name:'Gumbo-Tron 3000',emoji:'🍬',sway:0.07,
   taunts:['Insert coin to play! Just kidding!','Beep boop! Gumball attack!','My gumballs are extra bouncy!'],
   defeat:'Out of order! Out of order! Free gumballs for everyone!',
   build(P,g,o){
    const red='#e63946',silver='#ced4da',steel='#adb5bd',glass='#fff0f6',balls=['#ff006e','#ff4d6d','#8338ec','#3a86ff','#06d6a0','#ffbe0b','#fb5607'];
    // floor 0: chunky silver feet, red robot legs with hatch knees
    for(const sx of [-1,1]){const x=sx*1.25;
      P(BP(mk('box',1.9,0.6,2.5,silver,x,0.3,0.3),0,'wall'),4);                           // foot
      P(BP(mk('cyl',1.35,1.8,1.35,red,x,1.45,0),0,'wall'),4);                             // leg
      P(BP(mk('cyl',1.55,0.25,1.55,steel,x,0.75,0),0,'extra'),1,true,0.4);                // ankle ring
      P(bossWeak(mk('sph',0.95,0.95,0.7,'#ffd60a',x,1.5,0.75),0,3),3);}                  // phase 3: red hatch knees
    P(BP(mk('cyl',4,0.5,3.4,steel,0,2.55,0),0,'slab'),3);                                 // hips
    // floor 1: the red machine base with a coin-slot mouth, crank arms
    P(BP(mk('box',3.8,3,0.5,red,0,4.3,1.5),1,'wall'),5);P(BP(mk('box',3.8,3,0.5,red,0,4.3,-1.5),1,'wall'),5);
    for(const sx of [-1,1])P(BP(mk('box',0.5,3,2.6,red,sx*1.65,4.3,0),1,'wall'),4);
    P(BP(mk('box',1.6,1,0.15,silver,0,4.75,1.8),1,'extra'),1,true,0.4);                   // coin-slot plate
    P(BP(mk('box',1,0.18,0.1,'#22223b',0,4.8,1.88),1,'extra'),1,true,0.3);                // the coin slot (its mouth)
    P(BP(mk('box',1.3,0.7,0.15,silver,0,3.55,1.8),1,'extra'),1,true,0.4);                 // gumball door
    for(const sx of [-1,1])P(bossWeak(mk('sph',0.85,0.85,0.6,'#ffd60a',sx*1.1,3.15,1.9),1,1),3); // phase 1: coin-slot knobs
    P(BP(mk('box',0.8,0.8,0.1,'#ffbe0b',-1.1,5.3,1.79),1,'extra'),1,true,0.3);            // a sticker
    P(BP(mk('box',4.2,0.5,3.6,red,0,6.05,0),1,'slab'),4);                                  // top of the base
    for(const sx of [-1,1]){
      P(BP(bossRot(mk('cyl',0.6,2.2,0.6,steel,sx*2.35,4.3,0.3),0,0,sx*0.25),1,'extra'),2,true,0.6); // arm
      for(const y of [3.9,4.6])P(BP(mk('cyl',0.8,0.18,0.8,'#495057',sx*2.3,y,0.3),1,'extra'),1,true,0.3); // accordion rings
      P(BP(bossRot(mk('cyl',0.25,1.1,0.25,silver,sx*2.7,2.95,0.85),Math.PI/2),1,'extra'),1,true,0.3); // crank handle
      P(bossWeak(mk('sph',1,1,1,'#ffd60a',sx*2.65,2.85,0.25),1,2),3);}                    // phase 2: turn-crank hands
    // floor 2: the glass globe head full of gumballs, googly eyes on the glass
    for(const sx of [-1,1])P(BP(mk('sph',3.6,4.4,4.6,glass,sx*0.55,8.4,0),2,'wall'),4);
    const n=16;for(let i=0;i<n;i++){const yy=1-(i+0.5)/n*2,rr=Math.sqrt(1-yy*yy),a=i*2.39996;
      if(Math.cos(a)*rr>0.35&&yy>-0.75&&yy<0.55)continue;                                 // keep the face clear
      P(BP(mk('sph',1.05,1.05,1.05,balls[i%balls.length],Math.sin(a)*rr*2.35,8.4+yy*2.1,Math.cos(a)*rr*2.3),2,'extra'),1,true,0.5);}
    bossEye(P,2,-0.75,8.7,2.15,1.15,-1,0.8);bossEye(P,2,0.75,8.7,2.15,1.15,1,0.8);
    P(BP(bossSmile('#22223b',0,7.9,2.15,1.4,0.8,1.2),2,'extra'),1,true,0.3);
    // floor 3: red cap, knob and a ring of gumballs twirling on top
    P(BP(mk('cyl',2.6,0.6,2.6,red,0,10.6,0),3,'roof'),2,true,0.9);
    P(BP(mk('sph',0.8,0.8,0.8,red,0,11.1,0),3,'roof'),1,true,0.3);
    const twirl=bossGroup(0,11.4,0,mk('cyl',0.12,0.9,0.12,steel,0,0.1,0),
      ...[0,1,2,3].map(i=>{const a=i/4*Math.PI*2;return mk('sph',0.55,0.55,0.55,balls[i*2],Math.sin(a)*0.9,0.5,Math.cos(a)*0.9);}));
    twirl.userData.spin={axis:'y',speed:3};P(BP(twirl,3,'roof'),1,true,0.6);
    o.spin=[twirl];}},

  {id:'lavalarry',zone:'dino_volcano',name:'Lava Larry',emoji:'🌋',sway:0.05,
   taunts:['Rumble rumble! Hee hee!','I feel a big burp coming!','Hot lava hugs for everyone!'],
   defeat:'BUUURP! Ahh, much better. Bye bye!',
   build(P,g,o){
    const rock=['#8d7b68','#a39282','#7f6a59'],lava='#ff6d00',glow='#ffd60a',ink='#22223b';
    // floor 0: four stubby legs, rock toes, a rocky tail
    for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*1.9,z=sz*1.5;
      P(BP(mk('cyl',1.5,1.7,1.5,rock[sz>0?0:2],x,0.85,z),0,'wall'),3);}
    for(const sx of [-1,1]){const x=sx*1.9;
      for(const tx of [-0.45,0.45])P(BP(mk('sph',0.55,0.45,0.6,rock[1],x+tx,0.25,2.4),0,'extra'),1,true,0.2);
      P(bossWeak(mk('sph',0.9,0.75,0.9,'#ffd60a',x,0.4,2.45),0,2),3);                    // phase 2: rock toes
      P(BP(mk('box',0.35,0.9,0.2,lava,sx*2.6,1.35,-1.1),0,'extra'),1,true,0.3);           // lava drip
      P(bossWeak(mk('sph',0.95,0.95,0.95,'#ffd60a',sx*2.6,1,-1.6),0,3),3);}              // phase 3: lava-drip knees
    for(const [y,z,s,c] of [[1.9,-3.6,1.7,0],[1.2,-4.6,1.3,1],[0.6,-5.4,0.95,2]])P(BP(mk('sph',s,s*0.85,s*1.2,rock[c],0,y,z),0,'extra'),2,true,s*0.4);
    P(BP(mk('sph',0.6,0.5,0.6,lava,0,0.75,-5.95),0,'extra'),1,true,0.25);                 // glowing tail tip
    P(BP(mk('cyl',6.6,0.5,6,rock[2],0,1.9,0),0,'slab'),3);
    // floors 1–3: three leaning rings of rock, smaller each storey (like the zone's volcano)
    const R=[3.1,2.3,1.6],H=[3,2.7,2.4],lean=0.28;let y=2.15;const ys=[];
    for(let f=0;f<3;f++){const w=2*R[f]*Math.tan(Math.PI/6)*1.2;ys.push(y);
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;P(BP(bossTilt(mk('box',w,H[f],1.3,rock[(i+f)%3],Math.sin(a)*R[f],y+H[f]/2,Math.cos(a)*R[f]),-lean,a),f+1,'wall'),3);}
      P(BP(mk('cyl',R[f]*1.9,0.4,R[f]*1.9,rock[f],0,y+H[f]-0.2,0),f+1,'slab'),3);y+=H[f];}
    for(const sx of [-1,1])P(bossWeak(mk('sph',1.1,1.1,1.1,'#ffd60a',sx*3.45,3.1,0.4),1,1),3); // phase 1: lava vents (sides)
    // the happy face on the front: googly eyes + a wide smile, rosy cheeks
    bossEye(P,2,-0.9,ys[1]+1.5,R[1]+0.55,1.3,-0.7,1);bossEye(P,2,0.9,ys[1]+1.5,R[1]+0.55,1.3,0.9,-0.5);
    P(BP(bossSmile(ink,0,ys[1]+0.3,R[0]+0.35,2.4,1.1,1.6),1,'extra'),1,true,0.4);
    for(const sx of [-1,1])P(BP(mk('sph',0.7,0.45,0.25,'#ff8fab',sx*1.65,ys[1]+0.05,R[0]+0.25),1,'extra'),1,true,0.2);
    for(const a of [0.75,-0.75,2.4,-2.4])P(BP(bossTilt(mk('box',0.75,0.3,2.4,lava,Math.sin(a)*2.3,ys[2]+1.1,Math.cos(a)*2.3),1.29,a),3,'extra'),1,true,0.4); // lava drips running down
    // floor 4: lava crater, glowing blob and smoke rings
    P(BP(mk('cyl',3,0.4,3,lava,0,y+0.05,0),4,'roof'),3);
    P(BP(mk('sph',1.4,0.8,1.4,glow,0,y+0.3,0),4,'roof'),1,true,0.5);
    for(const [dy,s,dx] of [[1.1,2.2,0],[2.3,1.6,0.35]]){const ring=new THREE.Mesh(BOSS_RING,M('#ffffff'));  // puffy smoke rings
      ring.scale.set(s,s,s*1.6);ring.position.set(dx,y+dy,-dx);ring.rotation.x=Math.PI/2;ring.castShadow=true;P(BP(ring,4,'extra'),1,true,0.5);}
  }},

  {id:'sirsprinkles',zone:'candy',name:'Sir Sprinkles',emoji:'🎂',sway:0.1,
   taunts:['Happy birthday to ME!','Want a slice? Come and get it!','I\'m the sweetest cake in town!'],
   defeat:'Make a wish! Pop pop pop! Thanks for the party!',
   build(P,g,o){
    const lic='#c1121f',board='#e9ecef',spr=['#ff006e','#3a86ff','#06d6a0','#ffbe0b','#8338ec'];
    // a tier: n wall slabs in a ring of radius R, then a frosting plate on top
    const tier=(f,R,h,y,n,cols,frost)=>{const w=2*R*Math.tan(Math.PI/n)*1.08;
      for(let i=0;i<n;i++){const a=(i+0.5)/n*Math.PI*2;P(BP(bossRot(mk('box',w,h,0.9,cols[i%2],Math.sin(a)*(R-0.45),y+h/2,Math.cos(a)*(R-0.45)),0,a),f,'wall'),3);}
      P(BP(mk('cyl',R*2+0.5,0.45,R*2+0.5,frost,0,y+h+0.22,0),f,'slab'),3);return y+h+0.45;};
    // floor 0: cake-board feet, red licorice legs with cherry kneecaps
    for(const sx of [-1,1]){const x=sx*1.25;
      P(BP(mk('cyl',2.1,0.35,2.4,board,x,0.18,0.35),0,'wall'),3);                        // cake-board foot
      P(bossWeak(mk('cyl',1.2,0.45,0.8,'#ffd60a',x,0.25,1.45),0,3),3);                   // phase 3: the cake-board feet (toes)
      P(BP(mk('cyl',0.85,1.8,0.85,lic,x,1.25,0),0,'wall'),3);                             // licorice leg
      for(const y of [0.8,1.45])P(BP(mk('cyl',0.95,0.15,0.95,'#ffffff',x,y,0),0,'extra'),1,true,0.3); // candy stripes
      P(bossWeak(mk('sph',0.95,0.95,0.95,'#ffd60a',x,1.35,0.55),0,1),3);}                // phase 1: cherry kneecaps
    P(BP(mk('cyl',6.8,0.3,6.8,board,0,2.2,0),0,'slab'),3);                               // the cake board
    // floor 1: bottom tier (pink), sprinkle patches, frosting arms
    let y=tier(1,3.2,2.4,2.35,8,['#ffafcc','#ffc8dd'],'#fffaf5');
    for(const sx of [-1,1])P(bossWeak(mk('sph',1.15,1,0.6,'#ffd60a',sx*1.55,3.05,2.75),1,2),3); // phase 2: sprinkle patches
    for(let i=0;i<6;i++){const a=i*1.05+0.3;P(BP(bossRot(mk('box',0.45,0.14,0.14,spr[i%5],Math.sin(a)*3.25,3.9+(i%2)*0.5,Math.cos(a)*3.25),0,a,i),1,'extra'),1,true,0.2);}
    for(const sx of [-1,1]){
      P(BP(bossRot(mk('sph',0.95,2.6,0.95,'#fffaf5',sx*3.55,4.2,0.4),0,0,sx*0.45),1,'extra'),2,true,0.6); // frosting arm
      P(BP(mk('sph',1.1,1,1.1,'#ff8fab',sx*4.1,3.05,0.6),1,'extra'),1,true,0.4);}          // frosting-swirl hand
    // floor 2: middle tier (vanilla) with the happy face
    const y2=y;y=tier(2,2.3,2.2,y,6,['#fffaf5','#fff1f6'],'#ff8fab');
    bossEye(P,2,-0.7,y2+1.35,2.25,1.05,-0.8,0.8);bossEye(P,2,0.7,y2+1.35,2.25,1.2,1,-0.6);
    P(BP(bossSmile('#5c3317',0,y2+0.85,2.2,1.6,0.9,1.4),2,'extra'),1,true,0.3);
    for(const sx of [-1,1])P(BP(mk('sph',0.55,0.38,0.2,'#ff8fab',sx*1.3,y2+0.65,2.05),2,'extra'),1,true,0.2);
    // floor 3: top tier (mint)
    y=tier(3,1.5,1.7,y,4,['#b9fbc0','#d8f3dc'],'#fffaf5');
    // floor 4: a crown of candles and a cherry on top
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+0.3,cx=Math.sin(a)*1.05,cz=Math.cos(a)*1.05;
      P(BP(mk('cyl',0.32,1.3,0.32,spr[i],cx,y+0.65,cz),4,'roof'),1,true,0.5);
      P(BP(mk('cone',0.32,0.55,0.32,'#ffbe0b',cx,y+1.6,cz),4,'roof'),1,true,0.3);}
    P(BP(mk('sph',0.9,0.9,0.9,'#e63946',0,y+0.4,0),4,'roof'),1,true,0.4);
  }},

  {id:'mamastego',zone:'dino_swamp',name:'Mama Stegosaurus',emoji:'🦕',sway:0.06,
   taunts:['Careful, kiddos! Mama\'s coming through!','Look at my pretty plates!','Shh! Don\'t wake my egg!'],
   defeat:'Oh my! Time to go keep my egg warm. Bye bye, sweeties!',
   build(P,g,o){
    const body='#a0c4ff',dk='#7aa6e8',belly='#fff1c1',ink='#22223b',plates=['#ff8fab','#ffbe0b','#80ed99','#9b5de5','#4cc9f0'];
    // floor 0: four sturdy legs, toes, the tail dragging on the ground (spikes + an egg on top)
    for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*1.5,z=sz*1.8;
      P(BP(mk('cyl',1.5,2.5,1.5,body,x,1.25,z),0,'wall'),3);
      P(BP(mk('sph',1.7,0.7,1.9,dk,x,0.35,z+0.2),0,'wall'),2);}
    for(const sx of [-1,1])P(bossWeak(mk('sph',1.1,0.8,0.9,'#ffd60a',sx*1.5,0.45,2.9),0,3),3); // phase 3: front feet
    for(const [y,z,s] of [[2.7,-3.6,2],[1.7,-4.9,1.55],[0.95,-6,1.15]])P(BP(mk('sph',s,s*0.85,s*1.25,body,0,y,z),0,'extra'),2,true,s*0.4);
    for(const sx of [-1,1]){P(BP(bossRot(mk('cone',0.5,1.5,0.5,'#fff4dc',sx*0.85,1.2,-6.4),0,0,-sx*1.1),0,'extra'),1,true,0.3); // tail spikes
      P(bossWeak(mk('sph',0.95,0.85,0.95,'#ffd60a',sx*0.75,0.55,-6.05),0,2),3);}         // phase 2: tail-spike thumbs
    P(BP(mk('sph',1.4,1.8,1.4,'#fff1c1',0,4.25,-4.3),0,'extra'),2,true,0.6);              // the egg on her tail
    for(const [dx,dy,c] of [[-0.45,0.3,0],[0.4,-0.2,4],[0,0.75,2]])P(BP(mk('sph',0.4,0.4,0.2,plates[c],dx,4.25+dy,-3.62),0,'extra'),1,true,0.15);
    P(BP(mk('box',4,0.5,5,dk,0,2.6,0),0,'slab'),3);                                      // hips
    // floor 1: big round body, belly, painted belly spots, the head and neck
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',3,3.4,4.4,body,sx*0.8,4.2,sz*1.1),1,'wall'),3);
    P(BP(mk('sph',3.4,1.4,5.6,belly,0,3,0),1,'extra'),2,true,1);
    for(const sx of [-1,1])P(bossWeak(mk('sph',0.6,1.1,1.1,'#ffd60a',sx*2.25,3.3,0.4),1,1),3); // phase 1: belly spots
    P(BP(mk('sph',1.6,1.6,2.2,body,0,4,3.4),1,'extra'),2,true,0.7);                       // neck
    P(BP(mk('sph',2.5,2.1,2.5,body,0,4.2,4.7),1,'extra'),3,true,0.8);                     // head
    for(const sx of [-1,1]){const ex=sx*0.62;
      P(BP(mk('sph',1.15,1.15,0.8,'#ffffff',ex,4.85,5.7),1,'extra'),1,true,0.4);
      P(BP(mk('sph',0.55,0.55,0.35,ink,ex+sx*0.1,4.8,6.05),1,'extra'),1,true,0.2);
      for(const k of [-1,0,1])P(BP(bossRot(mk('box',0.08,0.45,0.08,ink,ex+k*0.28,5.5,5.75),0,0,k*0.4+sx*0.2),1,'extra'),1,true,0.1); // eyelashes
      P(BP(mk('sph',0.5,0.32,0.2,'#ff8fab',sx*0.95,4.05,5.6),1,'extra'),1,true,0.15);}
    P(BP(bossSmile(ink,0,4.1,5.85,1,0.55,1.2),1,'extra'),1,true,0.2);
    for(const sx of [-1,1])P(BP(mk('sph',0.55,0.5,0.35,'#ff006e',0.75+sx*0.3,5.3,4.3),1,'extra'),1,true,0.2); // flower bow
    // floor 2: the row of giant pastel back plates (each flies off whole)
    const pl=[[2.3,1.6],[1.1,2.4],[-0.2,2.9],[-1.5,2.5],[-2.7,1.8]];
    pl.forEach(([z,s],i)=>{const x=(i%2?0.4:-0.4);
      P(BP(bossRot(mk('box',0.35,s,s,plates[i],x,5.6+s*0.45,z),Math.PI/4),2,'roof'),1,true,s*0.5);});
  }},

  {id:'cuddles',zone:'bedroom',name:'Captain Cuddles',emoji:'🧸',sway:0.12,
   taunts:['Yaaawn! Is it bedtime yet?','No pillow fights allowed! Hee hee!','You can\'t catch the Captain!'],
   defeat:'Okay, okay! Nap time. Night night, friends!',
   build(P,g,o){
    const fur='#c68b59',muz='#f1d3b3',pj='#a0c4ff',stripe='#ffffff',pink='#ffafcc',blank='#fff3b0',ink='#3d2b1f';
    // floor 0: furry feet with pink pads, pajama legs, round pajama tummy
    for(const sx of [-1,1]){const x=sx*1.25;
      P(BP(mk('sph',1.9,1.1,2.5,fur,x,0.55,0.5),0,'wall'),4);                             // foot
      P(bossWeak(mk('sph',1.1,0.95,0.55,'#ffd60a',x,0.6,1.7),0,2),3);                    // phase 2: pink foot pads
      P(BP(mk('sph',1.9,2.2,1.9,pj,sx*1.15,1.8,0),0,'wall'),4);                          // pajama leg
      P(BP(mk('cyl',1.7,0.3,1.7,stripe,sx*1.15,1.05,0),0,'extra'),1,true,0.4);}           // pajama cuff
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',3,3.4,3,pj,sx*0.85,3.6,sz*0.8),0,'wall'),4);
    for(const y of [2.4,4.6])P(BP(mk('cyl',4.5,0.4,4.4,stripe,0,y,0),0,'extra'),2,true,1);  // pajama stripes
    P(BP(mk('sph',2.6,3,1.4,pj,0,3.6,1.6),0,'extra'),3,true,1);                           // pajama front
    P(bossWeak(mk('sph',0.9,0.9,0.45,'#ffd60a',0,3.35,2.35),0,1),3);                     // phase 1: pajama buttons
    P(bossWeak(mk('sph',0.9,0.9,0.45,'#ffd60a',0,2.5,2.15),0,1),3);
    P(bossWeak(mk('sph',1.1,1,1,'#ffd60a',0,2.5,-2.3),0,3),3);                           // phase 3: stubby tail (back)
    // floor 1: chest, pajama sleeves, paws, the blankie dragging from his right paw
    P(BP(mk('cyl',3.6,0.45,3.4,pj,0,5.25,0),1,'slab'),3);
    for(const sx of [-1,1])for(const sz of [-1,1])P(BP(mk('sph',2.6,2.8,2.6,pj,sx*0.75,6.5,sz*0.6),1,'wall'),3);
    P(BP(mk('cyl',3.7,0.4,3.4,stripe,0,6.3,0),1,'extra'),2,true,0.8);
    P(BP(mk('cyl',2.6,0.45,2.4,stripe,0,7.75,0),1,'extra'),2,true,0.7);                  // pajama collar
    for(const sx of [-1,1]){
      P(BP(bossRot(mk('sph',1.15,2.7,1.15,pj,sx*2.3,4.7,0.6),0,0,sx*0.35),1,'extra'),2,true,0.6); // sleeve
      P(BP(mk('sph',1.25,1.2,1.25,fur,sx*2.75,3.3,0.9),1,'extra'),1,true,0.5);}           // paw
    P(BP(bossRot(mk('box',1.7,2.6,0.14,blank,2.95,1.85,1.1),0.15,0,-0.12),0,'extra'),2,true,0.7); // blankie hanging…
    P(BP(mk('box',2,0.14,1.8,blank,3.1,0.08,2.2),0,'extra'),2,true,0.7);                   // …and dragging on the floor
    for(const [x,y,z] of [[2.6,2.4,1.2],[3.2,1.4,1.05],[2.7,0.18,2.5]])P(BP(mk('sph',0.4,0.4,0.15,pink,x,y,z),0,'extra'),1,true,0.15); // polka dots
    P(bossWeak(mk('sph',1.1,0.6,1.1,'#ffd60a',3.4,0.35,3),0,3),3);                       // phase 3: the blankie corner (front)
    // floor 2: big furry head, muzzle, one wide button eye and one sleepy one
    for(const sx of [-1,1])P(BP(mk('sph',2.3,3,2.8,fur,sx*0.7,9,0.1),2,'wall'),4);
    P(BP(mk('sph',3,2.8,1.8,fur,0,9,-0.7),2,'wall'),3);
    P(BP(mk('sph',1.9,1.4,1.4,muz,0,8.55,1.45),2,'extra'),1,true,0.5);                    // muzzle
    P(BP(mk('sph',0.8,0.55,0.5,ink,0,8.95,2.1),2,'extra'),1,true,0.3);                    // nose
    P(BP(bossSmile(ink,0,8.45,2.05,1,0.6,1),2,'extra'),1,true,0.3);
    P(BP(bossRot(mk('cyl',0.85,0.2,0.85,'#111111',-0.62,9.7,1.4),Math.PI/2),2,'extra'),1,true,0.3); // wide-awake button eye
    P(BP(bossRot(mk('cyl',0.75,0.2,0.75,'#111111',0.62,9.65,1.4),Math.PI/2),2,'extra'),1,true,0.3); // sleepy button eye…
    P(BP(mk('sph',0.9,0.42,0.42,fur,0.62,9.82,1.52),2,'extra'),1,true,0.3);               // …with a droopy lid
    P(BP(mk('box',0.85,0.09,0.1,ink,0.62,9.62,1.74),2,'extra'),1,true,0.15);               // sleepy lash line
    for(const sx of [-1,1])P(BP(mk('sph',0.6,0.4,0.2,pink,sx*1.15,8.75,1.3),2,'extra'),1,true,0.2); // rosy cheeks
    // floor 3: round ears + a floppy striped nightcap with a pompom
    for(const sx of [-1,1]){P(BP(mk('sph',1.15,1.15,0.7,fur,sx*1.3,10.25,0),3,'roof'),2,true,0.5);
      P(BP(mk('sph',0.6,0.6,0.3,pink,sx*1.3,10.25,0.3),3,'roof'),1,true,0.25);}
    P(BP(mk('cyl',2.4,0.45,2.3,stripe,0,10.45,0),3,'roof'),1,true,0.6);                   // cap brim
    P(BP(bossRot(mk('cone',2,2.3,2,pj,0.5,11.4,0),0,0,-0.8),3,'roof'),2,true,0.7);     // floppy cap
    P(BP(bossRot(mk('cyl',1.25,0.3,1.25,stripe,0.65,11.45,0),0,0,-0.75),3,'roof'),1,true,0.4); // cap stripe
    P(BP(mk('sph',0.9,0.9,0.9,stripe,1.6,11.55,0),3,'roof'),1,true,0.4);                 // pompom
  }}
];
