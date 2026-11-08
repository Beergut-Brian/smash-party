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
                   Weak spots: 1 slipper pompoms (front) · 2 belt buckle (front) + wind-up key (back) · 3 robe jewels (sides). */

// helpers (prefixed boss… so no other lane collides)
function bossRot(m,x=0,y=0,z=0){m.rotation.set(x,y,z);return m;}
function bossGroup(x,y,z,...kids){const g=new THREE.Group();g.position.set(x,y,z);for(const k of kids)g.add(k);return g;}
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
    o.spin=[key,pop];}}
];
