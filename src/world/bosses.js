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
   Optional taunts:[…] and defeat:'…' are each boss's own voice lines (TODO(logic): play them instead of the generic ones):
   Gummo the Gummy Giant 🐻 (candy) a big wobbly cherry gummy bear with a lime belly, a tiny party hat with a
                   spinning peppermint, and a swirl lollipop in each paw. Very high sway, so he jiggles.
                   Weak spots: 1 gumdrop belly buttons · 2 candy-cane toe caps · 3 the two lollipops (held low).
   Rexy Rumbleton 🦖 (dino) a clumsy pastel T-rex: giant head, wide toothy grin, googly eyes, polka-dot belly,
                   rounded back plates and teeny arms that windmill. Teeters when hit.
                   Weak spots: 1 big toenails · 2 round knee pads · 3 the tail tip + tail bump dragging on the ground. */

// helpers (prefixed boss… so no other lane collides)
function bossRot(m,x=0,y=0,z=0){m.rotation.set(x,y,z);return m;}
function bossGroup(x,y,z,...kids){const g=new THREE.Group();g.position.set(x,y,z);for(const k of kids)g.add(k);return g;}
// a smile: the bottom half of a ring (one shared geometry), scaled to fit a face
const BOSS_SMILE=new THREE.TorusGeometry(0.5,0.12,8,18,Math.PI);
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
    o.spin=arms;}}
];
