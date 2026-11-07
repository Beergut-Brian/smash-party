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

- [ ] **L5: Tune and test pass**
  - Round 1 (Kaden's first play-test) ✅: slower when small; car tiers (cooler cars unlock every 2 sizes, Y switches within the tier); big cars shoot (X: cannon / rocket, also hits boss weak spots); LEVEL UP button instead of auto-growing; new `micro` bottom size, scatter mostly at your size with bigger things rarer; stuck detection → jump becomes 💥 BOOM.
  - Play-test the whole v2 loop: small, then medium, then giant. Make sure growth pacing feels good in a ~20 minute session with a 5-year-old.
  - Check touch controls and phone performance still work (lower view radius on phones).

---

## Design (Cursor)

> **New car or spoken line?** Car names get a recorded voice automatically, but someone with the ElevenLabs key has to run `node --env-file=.env tools/make-voices.mjs` (see CLAUDE.md). Until then the robot voice reads it.

- [ ] **D0: Size classes + growth HUD styling** (from L2)
  - Give every smashable a size class: pass `{size:'mini'…'mega'}` in `makeObj`'s opts (see CLAUDE.md). Until then, logic guesses via `TYPE_SIZE` in `game.js`.
  - Players start tiny, so the home arena (`buildWorld`) and every zone need lots of tiny and small stuff.
  - Style `#sizeHud` (spans get `.lit` / `.now`, plus `.crown`), `#sizeBar`/`#sizeFill`, `#newWorld` and the `.growPop` bubble in `style.css`. Signal ring colors are `SIGNAL_COL` in game.js. Logic injects plain defaults with zero specificity (`:where()`), so anything in `style.css` wins.

- [ ] **D0 v2: Mini props, size lists, giant stuff** (for L2c)
  - Sizes are now `mini, tiny, small, medium, large, huge, mega`. Lots of **mini** props: flowers, pebbles, mushrooms, acorns, toy blocks, soda cans, rubber ducks, garden gnomes, snails (original designs only).
  - ✅ Logic side is done (L2c). Today's props are shrunk or grown as placeholders (e.g. dollhouses at mini size), so real mini props will make a big difference. The size mapping today is in `TYPE_SIZE` (game.js): cone/melon/fence/pin = small, barrel/crates/snowman = medium, tree/tower = large, house = huge.
  - Fill `const ZONE_PROPS={town:{mini:[...],tiny:[...],...},farm:{...},park:{...}}` with `OBJ` type names per zone per size. Logic scatters from it.
  - Plan **huge** and **mega** objects using the L3 building contract: apartment tower, water tower, silo, stadium, skyscraper, cargo ship, ferris wheel, mountain-sized "boss" building.

- [ ] **D5: Boss model(s)**
  - One original boss for max size, built from L3-contract parts plus `BP(mesh, floor, 'weak')` glowing weak spots. Chunky, funny, not scary. Kaden and son to pick the concept (and maybe name it).
  - Needs: L6 spec. ✅ L6 is done. The format is in `CLAUDE.md` under "Boss". Logic has three blocky placeholders to replace or polish (Kaden picked all three ideas, one random per world): **Clankzilla** (junk robot), **Shelldozer** (crab carrying a sandcastle), **King Wobbles** (wobbly block king). New bosses welcome; Kaden and son will invent more.

- [ ] **D6: Car upgrade path** (from play-test round 1)
  - Set `tier` on every car: 0 = humble starter cars for the tiniest sizes (toy-ish: pedal car, scooter, shopping cart…), up to 3 = the super cool ones (rocket racer, monster machines). About 2–3 cars per tier so Y has something to switch to. Logic's guess today: `CAR_TIER` in game.js.
  - Tier 2–3 cars can shoot: set `weapon:'cannon'` or `'rocket'` (logic handles the shots). Make the weapon visible on the model (a cannon barrel, rocket pods).
  - New car names get a recorded voice once someone runs `tools/make-voices.mjs`.

- [ ] **D1: Zone layouts**
  - **Town:** streets with houses of different sizes, shops, a school, a fire station, a water tower, mailboxes, street lights, hydrants, parked cars (original designs), and a tall "boss" building to topple when giant.
  - **Farm:** big red barn, silo, farmhouse, hay bales (roll when hit), fences, crop rows, a pond, windmill, chicken coop, scarecrow, parked tractor.
  - **Park:** playground (swings, slide, jungle gym), fountain, benches, picnic tables, trees, a gazebo, a pond with ducks, a giant bounce-house.
  - Ideas for later zones: construction site, beach boardwalk, candy land, dino valley.
  - Every prop gets a **size class** (tiny / small / medium / large / huge) so small players have plenty to smash early.
  - Needs: L1 (zone map + layout hooks). ✅ L1 is done. The zone map is `ZONE_MAP` in `core.js`; the layout contract (`ZONE_LAYOUT` + the `ctx` API) is documented in `CLAUDE.md` under "Adding things". Until `ZONE_LAYOUT` exists, `DEFAULT_LAYOUT` in `game.js` fills zones with placeholders.
  - Also add a `home` layout if you want to dress the ring of chunks around the original arena (the arena itself still comes from `buildWorld`).
  - New prop types need an entry in `REC_R` (game.js) or pass `r` to `ctx.place`. Ask logic to add it, or just pass `r`.

- [ ] **D2: Destructible buildings**
  - Build every building from separate parts per the L3 part contract (floors, walls, roof, details) so they can crumble in stages. Vary colors and styles. Chunky, toy-like, readable from far away.
  - Needs: L3 (part contract). ✅ L3 is done. The contract is in `CLAUDE.md` under "Building (staged destruction)", with a working example in `demoBuilding()` (game.js). Convert today's `house` to the contract too, so the home arena's houses crumble.

- [ ] **D3: Farm and park animals**
  - Cute, chunky, low-poly: chicken, rooster, duck, cow, pig, sheep, goat, horse, dog, cat, bunny, goose.
  - Built as single whole pieces (they get launched intact, never broken). Big googly eyes encouraged.
  - Needs: L4 (animal format and how they're registered). ✅ L4 is done. The format is in `CLAUDE.md` under "Animal"; logic has blocky placeholders in `ANIMAL_DEFAULT` (game.js) to replace. Animal sounds are already recorded.

- [ ] **D4: Vehicle wish list (inspiration only)**
  Design **original** takes on these, with no real brands, logos or copied designs. Every one should look like a toy: big wheels, bright colors, a silly face or feature.
  - **Real-life vehicle types:** dump truck, cement mixer, garbage truck, school bus, fire engine, ambulance, tow truck, street sweeper, snowplow, bulldozer, excavator, steamroller, forklift, farm tractor, combine harvester, ice-rink resurfacer, double-decker bus, limo, RV/camper, food truck, taxi, police cruiser, mail truck, delivery van, race car, dune buggy, monster truck, rally car, go-kart, hovercraft, golf cart, lawn mower, armored truck, ladder truck, crane truck, tank (cartoon, no weapons)
  - **Futuristic:** angular armored "future truck", hover car, robot-leg walker, rocket sled, solar-panel buggy, bubble-dome moon rover
  - **Wacky toy racers:** car with giant rear wheels and exposed engine, flame-painted hot rod, loop-track speedster, twin-engine dragster, shark car (done), dino cars (T-rex truck, triceratops ram-car, stegosaurus with spike plates, pterodactyl wing-glider), sneaker car, hot dog (done), ice cream (done), birthday cake car, rubber-duck boat car, pickle car, taco truck shaped like a taco, toaster car, bathtub racer, shopping cart racer, rocket skateboard
  - **Son-designed car:** reserved spot. Ask him for a name, color and silly feature.
  - Each car: 4–5 units long, faces +Z, `speed` 20–32, `r` 2–2.8. Scales automatically once L2 lands.
