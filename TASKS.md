# Smash Party: Task Board

Shared to-do list for both tools. **Pick the top unchecked task in your section**, follow its notes, check it off (`[x]`) in the same commit as the work, and add follow-up tasks for the other tool if needed.

- **Claude Code** owns the Logic tasks (`src/core.js`, `src/game.js`).
- **Cursor** owns the Design tasks (`src/cars.js`, `src/objects.js`, `style.css`, `assets/`).
- `Needs:` means wait until that task is checked off.
- Big features go on a branch (`feature/<id>`) and merge to `main` only when playable. `main` is live on the TV.

## The big picture (v2)
A much bigger world with **zones** (town, farm, park, and more) where **everything is destructible**. Buildings collapse, and animals get comically launched but never hurt. You **start tiny and grow** by smashing things: the bigger you get, the bigger your hit box and the bigger the stuff you can wreck, until you're a giant stomping through the town. Still co-op only, with no losing.

**Long-term:** the world will be **procedurally generated** as more zones get built. Keep zones and layouts data-driven (`ZONE_MAP`, `ZONE_LAYOUT`) so the zone map can later be generated instead of hand-written, and a "new world" can roll a fresh one.

---

## Logic (Claude Code)

- [x] **L1: Bigger world and chunk streaming**
  - Grow the world from ±70 to roughly ±400 (tune for fun). Keep a soft wall or edge at the boundary.
  - Split the world into a grid of chunks (~80×80). Only build objects in chunks near the players (radius grows with player size). Unload far chunks.
  - Remember what's destroyed per chunk, so leaving and coming back doesn't magically rebuild everything. Slowly regrow over time so the world never runs out.
  - Zone map: a data table that says which zone each chunk is in (town, farm, park…). Design fills zones through `objects.js`.
  - Performance: share geometries and materials, use instanced meshes for repeated props (fences, crops, trees), cap debris. Must hold 60fps at 1080p on a GTX 1060.
  - Leave `// TODO(design):` hooks where each zone's layout function plugs in.

- [x] **L2: Grow-by-smashing**
  - Players start **small** (about 1/3 the current size). Each smash adds "growth" by the object's mass/points. Car model, hit box (`r`), speed, jump height, camera zoom and engine pitch all scale with size.
  - Objects get a **size class** (tiny / small / medium / large / huge). You can only smash things at or below your size. Bigger things **wobble and bump you back** with a funny boing. Never a fail state.
  - Growth is **shared** between both players (co-op), so the 5-year-old never falls behind.
  - Big milestone moments: a size-up fanfare, a screen shake and a voice callout ("BIGGER!"). Show size on the HUD as a picture (a car icon growing), not a number.
  - **Max size (decided):** stay giant. Show a big on-screen celebration with a clear "NEW WORLD!" button (controller button + tap) that starts a fresh world when the players choose. Never forced.
  - Needs: L1 (camera and streaming radius must scale with size).

- [x] **L3: Collapsing buildings**
  - Replace instant shatter with **staged destruction**: hits knock out wall chunks, and when enough support is gone the building collapses floor by floor (upper parts drop, tilt and crumble), with a dust cloud and rumble.
  - Small players chip pieces off. Big players smash straight through. Giant players flatten in one hit.
  - Define a building "part contract" that design follows (floors, walls, roof, extras), and document it in `CLAUDE.md`.
  - Needs: L2 (size decides how much damage a hit does).

- [x] **L2b: "Can I smash it?" signals** (play-test feedback: a 5-year-old needs to see it at a glance)
  - Too big for you: a pulsing **red ring** on the ground around it, plus a little "grow first" badge (🚙⬆️) when you're close. Bumping it pops a "GROW BIGGER!" bubble.
  - After a size-up, everything you can now smash nearby flashes **green** for a few seconds ("now you can smash these!").
  - Only show rings near the players (instanced, one draw call). Leave the colors as tokens for design.

- [x] **L2c: Size ladder v2: start super small, every size-up matters**
  - 7 sizes: `mini, tiny, small, medium, large, huge, mega`. Start at ~0.12 scale (a toy car among flowers) and grow about 1.65× per size, up to ~4× today's car at max.
  - Re-tune growth so each size takes about 2–3 minutes and max size lands around minute 15–18.
  - **Things way below you (3+ sizes) don't count anymore:** you squish them flat as you drive over (tiny pop, no growth, no slowdown), and they stop appearing near you.
  - **The world fills with stuff your size:** each loaded chunk gets a "scatter" layer of props picked from design's `ZONE_PROPS` (per zone, per size), re-rolled when you size up. Mix: your size ~50%, one smaller ~15%, one bigger ~20%, two bigger ~10% (goals to aim for), and nothing 3+ below. Landmarks (houses, barns, towers) stay put; regrowth also uses the current mix.
  - Needs: D0 v2 (mini props + `ZONE_PROPS`). Until then, scale today's props to fill the gaps.

- [x] **L6: Boss at max size** (co-op, no losing, no timer)
  - Reaching max size triggers a BOSS: a huge original character/structure that strolls in with music and a voice intro.
  - Built on the L3 building contract plus glowing **weak spots**. Both players smash weak spots, each hit knocks big parts off, and the boss wobbles, stomps (harmless boings) and changes phase. Beating it gives a giant celebration, then the NEW WORLD button.
  - Bosses can rotate per world/zone later.
  - Needs: D5 (boss model), L2c.

- [x] **L7: Recorded voices (ElevenLabs, generated once)**
  - `say(id)` plays `assets/sounds/voice/<id>.mp3` and falls back to today's robot voice if a file is missing.
  - `tools/voice-lines.json` (id → text) + `tools/make-voices.mjs`: calls the ElevenLabs API with `ELEVENLABS_API_KEY` (env var only, never committed) and skips files that already exist, so new lines only cost new characters.
  - Lines: size-ups, GIANT, NEW WORLD, MEGA SMASH variants, boss intro and defeat, every car name, animal launches.
  - Logic owns `assets/sounds/voice/` and `tools/` (note it in CLAUDE.md). Needs from Kaden: voice choice and API key.

- [x] **L4: Animal launch ("kick the chicken")**
  - Animals are **never destroyed**. On hit they get launched in a big silly arc, spinning, with a cartoon sound (bawk, moo, oink) and a little feather/fluff puff. They land, shake it off, and wander again.
  - Simple wander AI: idle, walk and flee a little when cars are near. Herds and flocks stick together.
  - Launching animals gives a small bonus to the meter but **no growth** (we don't "eat" animals).
  - If launched out of the loaded area, quietly respawn them back near their pen.

- [x] **L8: 8-bit music + recorded sound effects (ElevenLabs)**
  - Kaden upgraded ElevenLabs for this. `tools/make-sfx.mjs` + `sfx-lines.json` already make the animal sounds.
  - Chiptune / 8-bit background music: a calm "driving around" loop, a hype loop for MEGA/size-ups, a boss theme, and a giant/victory fanfare. Loop seamlessly and duck under voice lines.
  - Replace the synth sfx (crash, boom, boing, jump, thud, turbo, pop, fanfare) with generated ones in the same toy/8-bit style, keeping the synth versions as fallback. Keep total audio download small for phones (lazy-load music).

- [x] **L9: Rendering upgrade: look like a real game** (next up, before L5)
  - Upgrade three.js r128 → current. Current three ships only as ES modules (no `three.min.js`, no `examples/js`), so add an import map plus a tiny `src/boot.mjs` that imports `three` + `GLTFLoader`, sets `window.THREE` / `THREE.GLTFLoader`, then loads the classic scripts in order. That keeps the plain-script layout and file ownership unchanged. Fix any r128-only APIs it trips on.
  - Look: `MeshStandardMaterial` (or toon) instead of Lambert, sRGB output + ACES tone mapping, a warm hemisphere + sun setup with softer shadows, a sky gradient, light fog, and optional outlines or SSAO only if a GTX 1060 holds 60fps.
  - Make `mk()` / `M()` produce the new materials so every existing prop upgrades at once.
  - A shared **GLB prop loader** for design: `loadProp(name)` returns a cached clone from `assets/props/`, with an optional fallback to the old block-built version until the model exists. Document it in CLAUDE.md.
  - Keep a quality toggle (high / phone) and test on phone.
  - ✅ Done (v0.13.0): three r186 via import map + `src/boot.mjs`; `M()`/`mk()` make toy-plastic `MeshStandardMaterial` (Lambert on phone); Neutral tone mapping (ACES washed out the toy colors), sky gradient dome, warm sun + bounce light, soft PCF shadows, studio environment light on high; `prop(name, fallback)` GLB loader with `assets/props/props.json`; LOOKS: BEST / FAST toggle in the pause menu (`?q=phone`). Same draw calls as r128 and 60 fps on a real GPU in tests. Follow-up: the town can hit ~1,000+ draw calls (most of it the shadow pass), worth trimming before phone tuning.

- [x] **L13: Rolling hay + spinning windmills** (from Cursor's TODO(logic) notes, v0.14.0)
  - `{roll:true}` objects (hay) tumble off when hit: they plow through smaller stuff, launch animals, bounce off bigger things, then burst. Windmill blades spin and windmills stay awake so they spin from afar. Any part can spin with `mesh.userData.spin = {axis:'z', speed:1.2}`. `RAD` is now a fallback for `ctx.place` radius.
  - Cursor: the two `TODO(logic)` notes above `OBJ` in objects.js (and the REC_R one) can be deleted.

- [x] **L10: Smash combos** (planned with Kaden, v0.15.0)
  - Smashes in quick succession build a combo: a big "×5 COMBO!" pop near the car, each crash a little higher in pitch, a small meter bonus that grows with the combo, and a voice line at milestones (×10, ×25). Shared between both players. Never punishes ending a combo.
  - Done: smashes, building collapses (count 3) and animal launches within 1.6s keep it going; label from ×3 over the cars, color/size grow with the combo; crash pitch rises up to +75%; meter bonus 0.15×combo per smash; recorded cheers at ×10/25/50/100. Tunables at the top of the combo section in game.js. Cursor (UI lane): `#combo` can be styled in style.css.

- [x] **L11: Golden surprises** (planned with Kaden, v0.16.0)
  - Rare sparkly gold versions of props/animals (golden chicken, treasure chest, gold crate) hidden around the world, with a twinkle sound when near. Smashing or launching one bursts confetti + coins, plays a fanfare and gives a big meter bonus. Something for a 5-year-old to hunt for. Design can provide gold models later; logic can start with a gold tint + sparkle particles.
  - Done: a golden prop at the players' size appears just off screen every 35–60s; ~30% of chunks hide a golden prop (seeded, may be too big at first); ~15% of herds have a golden animal. Gold = shiny gold material, sparkles, a light beam, a twinkle sound when it comes into view, and a gold ⭐ arrow at the screen edge toward the nearest one. Found: coin + confetti burst, treasure fanfare, voice ("You found a golden duck!"), +30 meter, combo +5, a little growth, ⭐ counter (`#goldCount`, `#goldArrow` can be styled by the UI lane). Real gold models (treasure chest etc.) are welcome from design later.

- [x] **L12: Launch pads** (planned with Kaden, v0.17.0)
  - Big bouncy launch pads (rainbow / trampoline style) placed near clusters of smashables, scaled to the players' size so they matter at every size. Driving over one launches the car high with a boing and a slow-motion-ish arc; landing on things smashes them (slam). Design can provide the pad look; logic handles placement, launch and landing.
  - Done: up to 3 rainbow pads near clusters of smashable stuff, placed between the car and the cluster, sized ~2× a car at every size; rebuilt after LEVEL UP. Driving over one: boing (new `pad` sfx), floaty 1.8s arc up to ~⅓ of the view height, voice ("Super bounce!"), and a big landing slam that smashes everything around the car (20 things at huge size in tests). Design can replace the look with `buildLaunchPad()` (see CLAUDE.md). Also: the normal hard-landing slam radius now scales with car size (was a fixed 3 units).

- [x] **L14: Rooster hookup** `NEEDS LOGIC` (from world-animals, PR #3; was numbered L10, which is the combos task)
  - `ANIMAL.rooster` exists in `src/world/animals.js`, but it's not a known kind yet. Add a `rooster` sound to `tools/sfx-lines.json` (generate it), and add roosters to the farm herds (`ZONE_HERDS` / the coop) so they appear.
  - Done (v0.19.1): recorded `rooster` sfx (cock-a-doodle-doo) and "You found a golden rooster!"; every chicken flock (coop, farm, home) now has one rooster. Also recorded the 16 new Kenney car names.

- [ ] **L15: Draw sleeping pack buildings from their proxy** `NEEDS LOGIC` (from world-props, D8b)
  - What exists: every Kenney building (`o.proxy`, set in `objects.js` by `kitBuilding`/`kitProxy`) carries its intact look as 2 meshes in the object's local space, not added to `o.g`: one vertex-colored mesh (material `userData.plainVC`) + the roof cap (a plain `M()` color). Geometry is shared by every copy of a model.
  - Needed in `game.js`: while a building is asleep and has lost no parts (`!rec.gone`), batch `o.proxy` instead of its parts (`loadChunk` + `poolAdopt`/`sleepObj`/`wakeObj`); wake swaps back to the parts. Also batch `userData.plainVC` materials like `PLAIN_INST`: key by geometry only, one shared `vertexColors:true` instance material, per-instance color = `material.color`.
  - Why: today every slice of a building is its own instanced batch while it sleeps (~6–10 per building type per chunk), so a town chunk is ~1.4–2× the block town's draw calls. With this, a sleeping building is 2 batches per model whatever its slicing, and world-props can switch to 8 walls per storey (`KIT_GRID=3`) and per-house wall colors.
  - Check: `__sp.stats().calls` standing in town (`__sp.tp(240,-160)`) at medium and huge, before/after.

- [ ] **L11: Zone plug-ins** (unblocks the `zone-<name>` agents; see `agents/zone.md`)
  - New zones live in their own files: `src/world/zones/<name>.js`, loaded by `boot.mjs` from a list (e.g. `src/world/zones/index.json`), each registering `{id, letter, ground, sky?, props, layout(ctx), sizes}` via a `registerZone()` helper in core.js.
  - The zone map / NEW WORLD mixes registered zones in (town/farm/park stay common; themed zones show up some worlds), so each new world feels different.
  - Add a test helper (`__sp.zone('candy')` teleports into one). Document the contract in CLAUDE.md, ship an empty example zone, and add `NEEDS DESIGN` tasks for the first two zones (candy, dino).

- [ ] **L5: Tune and test pass**
  - Round 1 (Kaden's first play-test) ✅: slower when small; car tiers (cooler cars unlock every 2 sizes, Y switches within the tier); big cars shoot (X: cannon / rocket, also hits boss weak spots); LEVEL UP button instead of auto-growing; new `micro` bottom size, scatter mostly at your size with bigger things rarer; stuck detection → jump becomes 💥 BOOM.
  - Play-test the whole v2 loop: small, then medium, then giant. Make sure growth pacing feels good in a ~20 minute session with a 5-year-old.
  - ~~Phone check~~: not needed, the game is computer only (Kaden, 2026-11-07).
  - ✅ Performance pass (v0.13.1): batch sleeping props by shape with per-instance colors, shared pools for scatter, wake radius scales with car size, merged animal models, herds only near the cars, debris boxes in one batch. Draw calls in the benchmark: micro 725→214, medium town 1,460→397, giant town 3,491→1,048, boss fight 6,412→880, debris storm 7,042→1,113; the 0.8 s level-up hitch is gone.

---

## Design (Cursor)

> **New car or spoken line?** Car names get a recorded voice automatically, but someone with the ElevenLabs key has to run `node --env-file=.env tools/make-voices.mjs` (see CLAUDE.md). Until then the robot voice reads it.

## Design lanes (two design agents)
Design is split by file so both can run at once without conflicts:
- **Cursor = Cars & UI:** `src/cars.js`, `assets/cars/`, `style.css`. Tasks: D8a, recipe system, D6, D4.
- **world-props** (Claude Code design): `src/objects.js`, `assets/props/`. Tasks: D8b, then D7.
- **world-animals** (Claude Code design): `src/world/animals.js`, `assets/props/animals/`. Task: D3.
- **world-bosses** (Claude Code design): `src/world/bosses.js`, `assets/props/bosses/`. Task: D5.
Claude Code's *logic* sessions still own `core.js`, `game.js` and `tools/`. A design session never edits those; it leaves `// TODO(logic):` notes.

- [x] **D0: Size classes + growth HUD styling** (from L2)
  - Done: every prop passes `{size:'micro'…'mega'}`. Flowers and pebbles are micro (the size you start at), bushes are mini, cones are small, houses are huge, and the clock tower, barn, and bounce house are mega.
  - The home arena puts micro props in front of the start spots (flowers, pebbles, mushrooms, acorns, toy blocks, cans, rubber ducks, snails) plus gnomes, bushes, and hydrants.
  - `#levelUp` and `#bossHud` use the same chunky style. The size meter glows when a level-up is ready.
  - `#sizeHud` (`.lit` / `.now` / `.crown`), `#sizeBar`/`#sizeFill`, `#newWorld`, and `.growPop` are styled in `style.css`. `SIGNAL_COL` stays in `game.js` (`#ff2d55` / `#3ddc84`), matching this HUD.

- [x] **D0 v2: Mini props, size lists, giant stuff** (for L2c)
  - Done: micro props are flowers, pebbles, mushrooms, acorns, toy blocks, soda cans, rubber ducks, and snails. Gnomes and bushes are mini. `ZONE_PROPS` lists real `OBJ` names for town, farm, park, and home from micro through mega, so scatter no longer shrinks dollhouses.
  - Huge and mega already in the world: house, villa, school, fire station, farmhouse, silo, windmill, water tower, gazebo (huge); clock tower, barn, bounce house (mega). All of the box ones use the L3 part contract.

- [ ] **D8: Swap in a free CC0 low-poly art pack** (biggest visual win). Split: **D8a cars → Cursor** (Kenney car kit, in progress); **D8b world → Claude Code design** (town, farm, park props/buildings via the L9 GLB prop loader, in `objects.js` + `assets/props/`)
  - Use **CC0** packs only (free for any use, no attribution needed): Kenney, Quaternius, or KayKit. Pick **one** main style so everything matches. Note the pack and license in `assets/CREDITS.md`.
  - Start with the **town** (houses, shops, trees, street props) and **cars**, then the farm, park and animals.
  - Put models in `assets/props/` and `assets/cars/`. Keep each prop under ~5k triangles, cars under ~20k.
  - Buildings still need the L3 part contract to collapse. For a pack building, either keep it one piece (it smashes but doesn't pancake) or split walls/roof into separate meshes in Blender, and tag them in a small manifest.
  - Needs: L9 GLB prop loader for the cleanest path. Cars can start now via `assets/cars/cars.json`.
  - D8a started: Kenney car kit (CC0, `assets/CREDITS.md`). The driveable cars are in `assets/cars/` and show up in the car swap. Town, farm, and park models are D8b (world lane).
  - ✅ **D8b done** (world-props/D8b): town, farm and park use Kenney CC0 models (City Kit Suburban + Commercial + Roads, Nature Kit, Fantasy Town, Holiday Kit, Car Kit; credited in `assets/CREDITS.md`). 58 models in `assets/props/`, baked by `assets/props/bake.mjs` into one mesh with vertex colors each (no textures). In `objects.js`, `kitPieces()` slices each model once (cached, shared by every size): buildings into storeys of walls + roof with the L3 part contract (they still pancake), trees/flowers by color (leaves fly off whole), snowmen into balls. Houses, cottages, villas, shops, the tall boss building, farmhouse, trees, bushes, flowers, mushrooms, pebbles, lamps, cones, benches, parked cars, tractor, fences, crops, melons, snowmen, fountain and windmill sails all switched; every type keeps its block version as the fallback. Still block-built: school, fire station, water tower, barn, silo, coop, hay, scarecrow, playground, gazebo, bounce house and the home-arena toys.
  - Draw calls: each building slice is its own instanced batch while asleep, so a chunk shares one model + wall color per building type (roofs still vary per house) and walls are 4 per storey (`KIT_GRID=2`) for now. Back to 8 per storey (`KIT_GRID=3`) after **L15**.

- [x] **D5: Boss model(s)** (world lane)
  - Done (world-bosses/D5): `BOSSES` in `src/world/bosses.js` replaces all three placeholders, block-built, 47–55 parts, 3 phases × 2 weak spots each, spinning bits via `o.spin`. **Clankzilla**: washing-machine robot (sock in the window), toaster head with toast popping out, tin-can legs in sneakers, plunger + spatula, propeller; weak spots knees → heels → dial + battery. **Shelldozer**: beach crab with one giant fiddler claw wearing a sandcastle, pinwheel on top; claw wrists → back bumps → castle shells. **King Wobbles**: roly-poly toy king, stacked-block tummy, curly mustache, tilted crown, spinning lollipop scepter and wind-up key; slipper pompoms → buckle + key → side jewels. Same ids and names, so the recorded intros still play.
  - One original boss for max size, built from L3-contract parts plus `BP(mesh, floor, 'weak')` glowing weak spots. Chunky, funny, not scary. Kaden and son to pick the concept (and maybe name it).
  - Needs: L6 spec. ✅ L6 is done. The format is in `CLAUDE.md` under "Boss". Logic has three blocky placeholders to replace or polish (Kaden picked all three ideas, one random per world): **Clankzilla** (junk robot), **Shelldozer** (crab carrying a sandcastle), **King Wobbles** (wobbly block king). New bosses welcome; Kaden and son will invent more.

- [ ] **D6: Car upgrade path** (Cars: Cursor) (from play-test round 1)
  - Set `tier` on every car: 0 = humble starter cars for the tiniest sizes (toy-ish: pedal car, scooter, shopping cart…), up to 3 = the super cool ones (rocket racer, monster machines). About 2–3 cars per tier so Y has something to switch to. Logic's guess today: `CAR_TIER` in game.js.
  - Tier 2–3 cars can shoot: set `weapon:'cannon'` or `'rocket'` (logic handles the shots). Make the weapon visible on the model (a cannon barrel, rocket pods).
  - New car names get a recorded voice once someone runs `tools/make-voices.mjs`.

- [x] **D1: Zone layouts**
  - Done in `ZONE_LAYOUT`: town streets (cottage / house / shop / villa rows, mailboxes, lamps, hydrants, parked toy cars) plus one clock-tower, school, fire station, and water tower. Farm has a barn, two silos, a farmhouse, hay, fences, crops, a pond, a windmill, a coop with chickens, scarecrows, and a tractor. Park has a clustered playground, fountain, benches, picnic tables, a gazebo, a duck pond, and a bounce house. Home dresses the ring around the original arena.
  - One of each landmark per map, recomputed when `zoneRows` changes so NEW WORLD moves them.
  - Layouts pass `r` from `RAD` (no `REC_R` update needed). The coop and the duck pond call `ctx.herd` so those animals launch instead of smashing. Other chunks still get the default `ZONE_HERDS` mix. Hay sets `roll:true` for a later tumble. Windmill boards are static until logic spins them.
  - **Town:** streets with houses of different sizes, shops, a school, a fire station, a water tower, mailboxes, street lights, hydrants, parked cars (original designs), and a tall "boss" building to topple when giant.
  - **Farm:** big red barn, silo, farmhouse, hay bales (roll when hit), fences, crop rows, a pond, windmill, chicken coop, scarecrow, parked tractor.
  - **Park:** playground (swings, slide, jungle gym), fountain, benches, picnic tables, trees, a gazebo, a pond with ducks, a giant bounce-house.
  - Ideas for later zones: construction site, beach boardwalk, candy land, dino valley.
  - Every prop gets a **size class** on the 7-step ladder (`mini` through `mega`) so a starting mini car has plenty to smash.
  - Needs: L1 (zone map + layout hooks). ✅ L1 is done. The zone map is `ZONE_MAP` in `core.js`; the layout contract (`ZONE_LAYOUT` + the `ctx` API) is documented in `CLAUDE.md` under "Adding things". Until `ZONE_LAYOUT` exists, `DEFAULT_LAYOUT` in `game.js` fills zones with placeholders.
  - Also add a `home` layout if you want to dress the ring of chunks around the original arena (the arena itself still comes from `buildWorld`).
  - New prop types need an entry in `REC_R` (game.js) or pass `r` to `ctx.place`. Ask logic to add it, or just pass `r`.

- [x] **D2: Destructible buildings**
  - Done for the box buildings: house, cottage, villa, shop, school, fire station, clock tower, barn, and farmhouse use `BP` walls (about 8–12 per storey), slabs, a roof, and whole extras (doors, windows). They pass `{building:true}`.
  - Still one-piece (fine to smash, they do not pancake): water tower, silo, gazebo, coop, windmill, and the little smash-tower. A later pass can shell those if they should collapse too.

- [x] **D3: Farm and park animals** (world lane)
  - Cute, chunky, low-poly: chicken, rooster, duck, cow, pig, sheep, goat, horse, dog, cat, bunny, goose.
  - Built as single whole pieces (they get launched intact, never broken). Big googly eyes encouraged.
  - Needs: L4 (animal format and how they're registered). ✅ L4 is done. The format is in `CLAUDE.md` under "Animal"; logic has blocky placeholders in `ANIMAL_DEFAULT` (game.js) to replace. Animal sounds are already recorded.
  - ✅ Done in `src/world/animals.js`: all 12 kinds are block-built toy animals (`M()` colors, low-poly shapes) with big googly eyes, chunky heads and stubby legs. Every kind keeps its old size class (chick and bunny mini … cow and horse medium), so gameplay doesn't change. Each animal uses 4–7 colors (= draw calls after logic's per-color merge) and 2–4.6k triangles (under the 5k prop budget).
  - Bonus: a `rooster` look is ready too. **Follow-up for logic:** to use it, add a `rooster` sound to `tools/sfx-lines.json` and put it in `ZONE_HERDS.farm` (or world-props can place `ctx.herd('rooster',…)`); until it has a sound, its launch uses the synth beep.

- [ ] **D4: Vehicle wish list (inspiration only)** (Cars: Cursor, via the recipe system)
  Design **original** takes on these, with no real brands, logos or copied designs. Every one should look like a toy: big wheels, bright colors, a silly face or feature.
  - **Real-life vehicle types:** dump truck, cement mixer, garbage truck, school bus, fire engine, ambulance, tow truck, street sweeper, snowplow, bulldozer, excavator, steamroller, forklift, farm tractor, combine harvester, ice-rink resurfacer, double-decker bus, limo, RV/camper, food truck, taxi, police cruiser, mail truck, delivery van, race car, dune buggy, monster truck, rally car, go-kart, hovercraft, golf cart, lawn mower, armored truck, ladder truck, crane truck, tank (cartoon, no weapons)
  - **Futuristic:** angular armored "future truck", hover car, robot-leg walker, rocket sled, solar-panel buggy, bubble-dome moon rover
  - **Wacky toy racers:** car with giant rear wheels and exposed engine, flame-painted hot rod, loop-track speedster, twin-engine dragster, shark car (done), dino cars (T-rex truck, triceratops ram-car, stegosaurus with spike plates, pterodactyl wing-glider), sneaker car, hot dog (done), ice cream (done), birthday cake car, rubber-duck boat car, pickle car, taco truck shaped like a taco, toaster car, bathtub racer, shopping cart racer, rocket skateboard
  - **Son-designed car:** reserved spot. Ask him for a name, color and silly feature.
  - Each car: 4–5 units long, faces +Z, `speed` 20–32, `r` 2–2.8. Scales automatically once L2 lands.
  - Started: `PARTS` + `RECIPES` in `src/cars.js`. Yellow Cab, Hose Hero, and Dash Racer are Kenney bases with paint and parts. New from this list: Honk Bus (school bus), Snow Pusher (snowplow), Spinny Mixer (cement mixer).

- [ ] **D7: More mega set pieces** (world lane)
  - Still just ideas: stadium, skyscraper, cargo ship, ferris wheel. Build them with `BP` when a zone has room. The mountain-sized boss is D5.

---

## Art pipeline (GPU server, run by Kaden's agents)

- [ ] **A1: Set up the art factory on the Proxmox GPU server.** Full brief: `docs/ART_PIPELINE.md`.
- [ ] **A2: Kid-drawn cars.** Photo of a drawing → 3D model → `assets/cars/` + `cars.json` entry, delivered as a PR.

