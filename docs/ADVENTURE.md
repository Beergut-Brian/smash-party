# Adventure plan: scenes, quests, the garage building and separate worlds

Play-test round 3 (Kaden + son, Nov 8). This is the design spec for the next big chunk of work. `TASKS.md` has the tasks (section "Play-test round 3"); this file is the why and the contracts. Contracts marked **draft** are the intended shape: the logic lane that builds them may adjust names, and documents the final version in `CLAUDE.md` like always.

What the play-test said:
1. **Too much stuff, too random.** Especially at the small sizes the screen is full of unrelated props, so you plow through everything and never explore. We want fewer objects and more **scenes**: little set-ups that tell a story (a row of toy cars lined up on the play mat for a race).
2. **The garage is great but cramped.** Space the cars out, make them bigger, and fix the flicker at the front and back of the garage floor.
3. **Dino Land and Candy Land should be places you go**, not patches of the home world. After the first boss, portals open and you pick one.
4. **A quest mode.** The normal game becomes **Adventure**: you start unable to break anything, meet funny characters who need help, and they give you upgrades (a hammer, hovering…). Today's smash-everything game becomes **Arcade**.
5. **The garage becomes a building you drive into**, and driving out of it is how the world gets set up for your new size.

Design rules still hold: co-op only, no losing, no timers that end anything, never require reading, big funny feedback, original characters only.

---

## 1. Two modes

The start screen gets a second picker row (pictures only):

| | 🗺️ **Adventure** (default) | 🕹️ **Arcade** |
|---|---|---|
| Smashing | Locked until the first quest gives you the 🔨 Bonk Hammer | Always on |
| Shooting, hover, other abilities | Earned from quests | All on |
| World | The **same hand-made Home World** every time, progress saved | A fresh random world each time (today) |
| Garage exit | Same world, refreshed around you for the new size | A fresh world at the new size (today) |
| Portals | Open after the Home World boss | Open after the first boss too; also pickable on the start screen once unlocked |
| Start | The street, right next to Hank | 🛏️ bedroom or 🌳 outside (today) |

Arcade is what we have today, plus the scene/spacing fixes and the portals.

### Before the hammer
In Adventure the first couple of minutes are "look but don't break". It still has to be fun and loud:
- Hitting anything makes it **wobble and boing**, sends up a star puff and bounces the car back a little. Nothing breaks and the smash meter doesn't move.
- **Animals still launch** (they never break anyway), so you can already kick chickens.
- Balls, gnomes and hay bales still **roll** when bumped (push puzzles use this).
- The very first quest is right next to the start and takes 1–2 minutes, so the "can't smash" part is short and becomes the setup for a big payoff: getting the hammer is a ceremony (the car spins up into the air, a hammer pops onto its roof, confetti, voice: "Now go SMASH stuff!").

---

## 2. Scenes instead of confetti (both modes)

### The idea
The world should look **planned, like a real place**: a suburb where the houses sit together on streets with yards, driveways, fences and sidewalks, a big park right next to the neighborhood, a downtown main street, farms out at the edge. Kenney's suburban sample scenes are the reference (Kaden, Nov 8). Planned beats random wherever it looks better; random filler becomes a small top-up, not the main way the world gets stocked.

Two building blocks, both hand-made by the design lanes:
- **Lots** (templates): one plot with everything on it at every scale. A house lot is the house (huge), the car in the driveway and the fence (medium/large), a mailbox, a bike and trash cans (small), a gnome and a flowerbed (mini), flowers, pebbles and a dropped toy (micro). A row of lots makes a street; the same few lot templates, mirrored and recolored, build a whole suburb.
- **Scenes**: a small arrangement that tells a story at a glance (a lemonade stand with a line of toy customers, a toy-car race on the play-mat road, a picnic with an ant parade). Scenes sit inside lots, parks and fields to give each block something to find.

So every size has planned things to smash: at micro you're among the flowerbeds and toys of a front yard, at medium you're knocking over cars and fences, at huge you're flattening the houses. Nothing appears out of nowhere.

**The Home World is fully planned** (Adventure, and Arcade's first world): one hand-made map where every 80×80 chunk is designed, with the neighborhood, park, downtown, school, farm belt, construction site and cornfield where the quests need them. **Arcade's random worlds** keep their random zone map but fill each chunk from a library of planned **blocks** (2–4 hand-made chunk layouts per zone, mirrored and rotated), so a random world still looks planned.

Performance: planned is as cheap as random or cheaper (fixed counts, the same few templates, everything sleeps in the instanced pools). The one risk is all the micro and mini detail across many chunks once the players are big; logic skips building props 3+ sizes below the players (they'd only get squished without counting anyway) and builds them again when you're small.

Targets (logic measures these before and after, on the start street and in a town chunk):
- **Random filler is a top-up only**: about 10–20% of what's on screen in planned areas (it keeps a freshly smashed area from staying empty), more only in zones that have no planned blocks yet.
- **Visible empty ground**: streets, lawns and plazas stay open enough to drive and explore.
- Growth pacing stays about the same; quests give big growth rewards on top.

### Scene contract (draft)
Scenes live in the design files: `SCENES` in `objects.js` (town, farm, park, home) and `registerZone({scenes:{…}})` in a zone file.

```js
const SCENES={
  lemonade_stand:{
    zones:['town'],        // where it can appear
    spot:'yard',           // optional: only inside this spot kind
    size:'small',          // the size its props are authored at
    r:9,                   // footprint radius at that size
    weight:1,              // how often the filler picks it
    build(s){              // s.place(type,x,z,arg,th), s.herd(kind,x,z,n), s.spot(kind,x,z,w,d,th), s.ramp(...)
      s.place('lemonade_stand',0,0);
      s.place('toy_car',-3,4,null,Math.PI); s.place('toy_car',-1,5,null,Math.PI); // the line of customers
      s.place('cone',3,2);
    }},
};
```

- Coordinates are local to the scene; **+Z is the front** (logic turns the front toward the nearest road or the camera).
- **Scenes scale.** Logic can build any scene at any size class: it scales the positions and each prop by 1.65 per size step (props already support a scale argument). So "toy-car race" works at micro on the bedroom rug and at medium in a parking lot. A scene can list `sizes:['micro','mini','tiny']` to limit where it's used.
- **Placing them.** Layouts place lots and scenes at fixed spots with `ctx.scene('house_lot_a',x,z,th)` (a lot is just a bigger scene). Logic can also drop a **filler scene** into open ground near the players as part of the small top-up, picked by zone, spot and size.
- Scenes are remembered per chunk like props (smashed stays smashed, regrows later).
- Quest stages (section 4) are just scenes that spawn when a quest starts.

### Scene ideas (for the design lanes)
Each zone wants 6–10 scenes across the size bands. Starters:

- **Bedroom (micro–large):** toy-car race on the play-mat road (8 cars on a starting grid, a ramp, a checkered flag, a block grandstand with plush fans), tea party (plushies around a little table with cups), block city skyline, sock mountain by the laundry basket, crayon art corner on a big sheet of paper, the train-set loop, dino toys facing off, a pillow fort, a marble run, a spilled snack bowl with gummy bears "sledding" down cereal.
- **Town, small sizes (micro–mini):** ant picnic on a dropped sandwich, snail race on the sidewalk, gnome tea party in a yard, chalk drawings with pebbles, a fallen popsicle with ants, puddle with a paper boat.
- **Town, bigger:** yard sale, lemonade stand, birthday party in a backyard (balloons, cake, bounce house), traffic jam at a crossing, car wash, ice-cream truck with a line of cones, garbage day (row of bins), pizza delivery, road works.
- **Farm:** pumpkin patch, veggie stand, hay-bale maze, muddy pig pen, tractor parade, laundry line, crop circle (the alien quest stage).
- **Park:** picnic, playground, sandcastle in the sandbox, duck pond with paddle boats, kite field, soccer game with cone goals, ice-cream corner, an outdoor concert.

---

## 3. The garage building

Today: at a new car tier the world stops and you're teleported into the showroom. New flow:

1. **LEVEL UP when a new tier is ready** (tiny, medium, huge): the **Grow-Up Garage** rises out of the ground a short drive ahead of the players (rumble, dust, a big beacon light and a gold arrow). It's scaled to the players, so it's always a short, easy drive.
2. **Drive in the big front door.** Each player who arrives drives inside; the camera swoops in. Nobody has to arrive at the same time; the first one in waits inside.
3. **Inside** is today's showroom, roomier: cars **about 1.5× bigger**, pads **about twice as far apart**, a wider floor, the stat cards as now. Pick a car by driving into it, as now.
4. **Exit door.** Once everyone has picked, the back door rolls up with a big glowing GO arrow (A / START still works). Drive through it.
5. **Driving out sets the scene.** The camera pulls back as you roll out the back door into the world built for your new size: the area around the exit fills with size-matched scenes (Adventure: the same world, regrown and restocked around you; Arcade: a fresh world, like GO today). The garage then sinks back into the ground with a "fwoomp".

Also: fix the floor flicker (the floor top and the stripes sit at exactly the same height as each other and as the ground, so they fight; lift each layer a hair and stop the ground showing through).

Contracts (draft): world-props builds the outside, `function buildGarageBuilding(){…}` in `objects.js` returning a `THREE.Group` (front door opening on +Z about 10 wide at car scale 1, roof sign, beacon on top, floor at y=0). cars-ui keeps the inside, `buildGarage()` in `cars.js`, now with a back exit door on −Z and the bigger floor. Logic does the drive-in / drive-out flow, the scaling and the door triggers.

---

## 4. Quests (Adventure)

### How it plays
- **Quest givers** are characters (mostly cars, plus a farmer, two aliens…) parked in the world with a big bouncing **"!" balloon showing their emoji** (gold = main quest, blue = side quest). Drive up to one and it talks to you in **its own voice** (not the announcer).
- While they talk, a **picture bubble** over them shows what they want: the item icon and dots for how many (🍱 ●, 🐔 ●●●●●●…). No words.
- The **gold arrow** (and a sparkle trail on the ground when you're far) always points at the next thing to do. One active quest at a time keeps it simple for a 5-year-old; meeting another giver swaps to theirs.
- Progress is **shared**: either player can catch, find or deliver. Each step pops confetti and a voice cheer from the giver ("Three more!").
- **Nothing can fail.** No timers. Items you drop come back. Things that run away (chickens) stay inside the quest stage.
- Coming back to a giver mid-quest replays a short reminder line and the bubble.
- When it's done: thank-you line, reward ceremony, the giver waves and stays around with an idle line or two.

### Quests are size-proof
Players grow and props have fixed sizes, so a quest built for one size would break at another. So:
- **Givers are always the players' size** (they grow with you, like the camera keeps your car the same size on screen).
- **Quest stages spawn when the quest starts, scaled to the players' current size** (stages are scenes, which scale). Twenty chickens are always chicken-sized for *you*.
- The world spot is fixed (a farm field, the cornfield), so the world still has places to explore.

### Chapters and the garage
Adventure is split into **4 chapters, one per car tier**: 1 = micro–mini, 2 = tiny–small, 3 = medium–large, 4 = huge–GIANT. Each chapter has **one main quest** (gold) and **2–3 side quests** (blue).
- You grow by smashing as usual (after the hammer) plus big growth bursts (⭐) from quest rewards.
- The garage for the next tier only rises once the chapter's **main quest** is done. Until then the LEVEL UP button shows the main-quest giver's emoji and the arrow points at them.
- Side quests stay available in later chapters (they scale like everything else). Nothing is ever lost.

### Quest contract (draft)
Quest files are design content: `src/world/quests/<world>.js` (new **quests** lane). The engine is logic's `src/quests.js`.

```js
registerQuest({
  id:'hank_lunchbox', world:'home', chapter:1, main:true,
  giver:{id:'hank', name:'Hammerhead Hank', emoji:'🔨', voice:'hank',
         at:[12,30],            // or spot:'construction' (a spot kind in a layout)
         build(){ … return group }},   // block-built, faces +Z, scale-1 car size (~4.5 long)
  needs:[],                     // quest ids that must be done first, or ability ids
  stage:'hank_yard',            // optional scene id spawned (at player size) when the quest starts
  steps:[
    {do:'talk', say:['Hey there, little buddy!', 'I lost my lunchbox!', 'My sandwich is in there!']},
    {do:'find', item:'lunchbox', icon:'🍱', at:'stage', say:{got:'My lunchbox! You found it!'}},
    {do:'bring', say:{start:'Bring it back to me!'}},
  ],
  reward:{ability:'hammer', stars:2, say:['Here, take my Bonk Hammer!', 'Now go smash stuff!']},
  after:['Smashing is the best, right?', 'Mmm, sandwich.'],   // idle lines once done
});
```

**Step verbs** logic provides (each step can have `icon`, `n`, `say:{start, each, got, hint}`):

| Verb | What happens |
|---|---|
| `talk` | Giver says its lines; continue by driving away or after the lines |
| `find` | `n` items appear (in the stage, at a spot, or hidden around the zone); touching one pops it onto your roof, bouncing |
| `bring` | Drive back to the giver; items fly off your roof into their arms |
| `catch` | `n` animals of a kind spawn in the stage and run around; bump one and it poofs into the giver's basket |
| `smash` | Smash `n` things in the stage (or of a type); a contained point bonanza |
| `deliver` | Drive through `n` glowing drop spots (picnic blankets, mailboxes) |
| `rings` | Drive through `n` arches or rings in order (a parade route); no timer, rings wait for you |
| `push` | Push `n` rolling things (balls, gnomes, sheep) into a goal circle |
| `reach` | Get somewhere (top of a hill, an island; may need an ability) |
| `boss` | Summon the world's boss; the step ends when it's beaten |

### Abilities (rewards)
Logic owns the ability list; each one is a flag that's always on in Arcade.

| Ability | Button | What it does |
|---|---|---|
| 🔨 `hammer` | — | Smashing works (and a hammer bonks on the car roof on every hit) |
| 🥚 `shoot` | X / Y | The car's weapon unlocks (bubble / cannon / rocket by tier as today). The first time it shoots eggs, because the farmer gave it to you |
| 🛸 `hover` | hold B in the air | Float for a few seconds, drift over water and gaps, alien "wooo" sound |
| 🚜 `dozer` | — | The bulldozer perk on every car |
| 🪁 `glide` | hold B after a jump | Little wings pop out; much longer jumps |
| Cosmetics | — | Party hat, bubble trail, sprinkle trail, confetti trail, crown, silly engine sounds (kazoo engine!) |

New abilities always come with a **button glyph that pulses on screen** (with a picture of what it does) until you use it once, plus the giver saying it out loud.

### Home World quests (draft; the quests lane writes the final ones)

**Chapter 1: the street (micro–mini)**
- 🔨 **Hammerhead Hank** (MAIN). A teeny yellow construction loader in a hard hat, sleepy eyes, grumpy but sweet. *Voice: slow, gravelly old-timer.* He lost his lunchbox ("my SANDWICH is in there!"). Find it in the yard scene next to the start, bring it back. **Reward: 🔨 Bonk Hammer** (smashing unlocked) + ⭐⭐.
- 🍄 **Garry the Gnome** (side). A garden gnome riding a tiny lawnmower. *Voice: tiny, whispery, very polite.* His gnome friends rolled away down the sidewalk: push 5 gnomes back into his garden. Reward: 🎩 party hat.
- ✉️ **Zippy the Mail Truck** (side). *Voice: talks super fast.* Deliver 4 letters by driving through the glowing mailboxes. Reward: 🎺 kazoo engine sound.

**Chapter 2: the farm and the park (tiny–small)**
- 🐔 **Farmer Fern** (MAIN). A cheerful red tractor with a straw hat. *Voice: loud, happy, laughs at everything.* "My chickens busted out of the coop!" A fenced pasture fills with **20 chickens** that run around flapping; bump each one into Fern's basket (big points, feathers everywhere). The last one is the rooster, perched on a hay bale. **Reward: 🥚 Egg Blaster** (shooting unlocked) + ⭐⭐⭐.
- 🚒 **Bubbles the Fire Truck** (side). *Voice: an eager, squeaky rookie.* The park's bubble fountain is clogged: find 3 soap bottles. Reward: bubble turbo trail.
- 🍦 **Pip the Ice-Cream Truck** (side). *Voice: sing-songy and sweet.* Deliver 5 ice creams to the picnic blankets. Reward: sprinkle trail.

**Chapter 3: the cornfield and the town (medium–large)**
- 👽 **Zorp and Blip** (MAIN). Two tiny aliens with a dented saucer in a crop circle, smoking and beeping. *Voices: Zorp high and squeaky, Blip low and bubbly; they finish each other's sentences.* Their Wobble Crystal broke into 3 pieces: one in a haystack (smash it open), one on top of the water tower (jump off the ramp), one at the bottom of the duck pond (they lend you a beam to suck it up). **Reward: 🛸 Hover** + ⭐⭐⭐. With hover you can reach the little island in the pond, which has a treasure chest full of points.
- 🚧 **Dozer Dot** (side). A tough little bulldozer in safety orange. *Voice: excited, shouty, "LET'S SMASH!"* It's demolition day: a fenced crate yard full of crates and barrels; smash all 60 (barrel chains!). Reward: 🚜 dozer blade + ⭐⭐⭐.
- 🎩 **Mayor Wheelie** (side). A pompous limo in a top hat. *Voice: booming, very proud of himself.* Lead the parade: drive through 10 balloon arches around town while marching-band music plays. Reward: 🎉 confetti trail.

**Chapter 4: the whole town (huge–GIANT)**
- 🪁 **Captain Kite** (side). A breezy hovercraft. *Voice: laid-back surfer.* His 5 kites are stuck on rooftops and tall trees; hover or jump to knock them down. Reward: 🪁 Glide.
- 🐑 **Woolly the Sheepdog Van** (side). *Voice: worried and huffy.* Push 8 sheep into the pen. Reward: 👑 crown.
- 🤖 **The Big Stomp** (MAIN). Mayor Wheelie: "A GIANT ROBOT is stomping toward the fair!" Boss fight (the world's boss, as today). Win and Zorp and Blip fly in: the boss's battery powers their Wobble Crystal and it **opens two portals**.

---

## 5. Worlds and portals

- A **world** is a set of zones with its own map, start, music, bosses and quests. **Home World** = town, farm, park, home (and the bedroom, as today's arcade start). **Dino Land** and **Candy Land** become their own worlds; they stop being mixed into the Home World's NEW WORLD.
- **Portals:** after the Home World boss, two big swirly portals rise from the ground near the fight: 🦖 a green-and-orange jungle swirl with a roar, 🍭 a pink sprinkle swirl with a giggle. "The portals are open! Pick one!" Drive into one: swirl, whoosh, and you pop out in that world.
- Each world has a **home portal** near its start to go back, and the other land's portal opens once that world's boss is beaten.
- What carries over: cars, abilities and cosmetics. **You shrink back to tiny in the portal**, so each land is a fresh grow-up adventure with its own 4 chapters.
- Arcade: once a land is unlocked, its picture shows on the start screen next to 🛏️ / 🌳.

Dino Land and Candy Land need more than one zone each to feel like worlds (sub-zones like jungle, volcano, swamp, fossil dig, nest hills / gumdrop forest, chocolate river, lollipop meadow, cake town, ice-cream mountains), plus their own scenes and quests. **That's the next phase** after the Home World; see the task list.

World contract (draft, logic's `src/worlds.js`):
```js
registerWorld({id:'dino', name:'Dino Land', emoji:'🦖', zones:['dino','dino_swamp','dino_volcano'],
  start:[[x,z],[x,z]], portal:{color:'#7ae582', sfx:'portal_dino'}, music:{drive:'dino_drive', boss:'dino_boss'}});
```

---

## 6. Saving
Adventure auto-saves to the browser (quests, abilities, cosmetics, cars, size, unlocked worlds) after every quest step and garage visit. The start screen shows a big ▶️ **Continue** picture and a 🆕 **New Adventure** picture that needs a 2-second hold, so the 5-year-old can't wipe it by accident. Arcade only remembers which worlds are unlocked.

---

## 7. Voices
Quest givers each get their **own ElevenLabs voice** (the announcer stays the announcer).
- `tools/voices.json` (new): the cast, e.g. `{"hank":{"voice":"<elevenlabs voice id>","model":"eleven_v3","settings":{…},"prefix":"[gruff] "}}`. The audio agent picks voices from the ElevenLabs voice library, or makes them with Voice Design from the personality notes above.
- `tools/voice-lines.json`: a line can say `"voice":"hank"`. `make-voices.mjs` uses that voice's settings; the clip id includes the voice, so the same words in two voices are two clips.
- Code: `say('Here, take my Bonk Hammer!',{voice:'hank'})`. Missing clip = robot voice, as today.
- About 10–15 lines per giver: hello (2–3), reminder (1–2), progress cheers (3), got-it (2), thanks + reward (2), idle after (2). **Short lines** (under ~8 words), lots of personality.
- Also needed: portal whoosh/roar/giggle, ability sounds (hammer bonk, egg plop, hover hum, glide whoosh, kazoo engine), quest jingles (quest start, step done, quest done), the parade march, the "wobble but don't break" boing.

---

## 8. Decisions (Kaden, Nov 8)
1. **Portal size:** you shrink back to tiny in each new land, so every land is a fresh grow-up adventure.
2. **Garage:** rises out of the ground a short drive ahead of the players at each level-up.
3. **Adventure start:** the street outside, with Hank right there. The bedroom stays an Arcade start.
4. **Saving:** auto-save with ▶️ Continue; 🆕 New Adventure needs a 2-second hold.

## 9. Order of work
- **Phase A (now, all in parallel):** scenes + calmer scatter (logic + world-props + zone-bedroom), the garage building (logic + world-props + cars-ui), the quest engine (logic), Home World quest writing (quests lane), the character voice tool (logic) and casting (audio).
- **Phase B:** abilities, the mode picker, saving, the Home World quests wired up end to end, voices recorded. QA plays the whole Home World adventure.
- **Phase C:** worlds + portals, then Dino Land and Candy Land as full worlds with their own sub-zones, scenes and quests.
