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

- [x] **L16: Draw sleeping pack buildings from their proxy** `NEEDS LOGIC` (from world-props, D8b; filed as L15, which is zone plug-ins)
  - What exists: every Kenney building (`o.proxy`, set in `objects.js` by `kitBuilding`/`kitProxy`) carries its intact look as 2 meshes in the object's local space, not added to `o.g`: one vertex-colored mesh (material `userData.plainVC`) + the roof cap (a plain `M()` color). Geometry is shared by every copy of a model.
  - Needed in `game.js`: while a building is asleep and has lost no parts (`!rec.gone`), batch `o.proxy` instead of its parts (`loadChunk` + `poolAdopt`/`sleepObj`/`wakeObj`); wake swaps back to the parts. Also batch `userData.plainVC` materials like `PLAIN_INST`: key by geometry only, one shared `vertexColors:true` instance material, per-instance color = `material.color`.
  - Why: today every slice of a building is its own instanced batch while it sleeps (~6–10 per building type per chunk), so a town chunk is ~1.4–2× the block town's draw calls. With this, a sleeping building is 2 batches per model whatever its slicing, and world-props can switch to 8 walls per storey (`KIT_GRID=3`) and per-house wall colors.
  - Check: `__sp.stats().calls` standing in town (`__sp.tp(240,-160)`) at medium and huge, before/after.
  - Done (v0.21.1): sleeping undamaged buildings batch `o.proxy` (chunk batches and scatter pools); `userData.plainVC` materials batch by geometry with one shared vertex-color instance material + per-instance color. A proxied building that loses parts stays awake as real parts (never pops back intact); reloads with remembered damage build from parts. Town draw calls: medium 393 → 301, huge 938 → 575 (same look, compared side by side).

- [x] **D8c: Finer building slices + per-house wall colors** `NEEDS DESIGN` (world-props; unblocked by L16)
  - L16 is done, so sleeping buildings cost the same however they're sliced: switch `KIT_GRID` to 3 (8 walls + a slab per storey, closer to the L3 contract) and pick wall colors per house instead of per chunk. Check `__sp.stats().calls` in town (`__sp.tp(240,-160)`) at medium and huge stays near 300 / 575.
  - Done (world-props/D8c): `KIT_GRID=3`, so pack buildings have 8 walls + a slab per storey, and each house, villa, shop, farmhouse and skyscraper picks its own wall color (seeded per chunk). A model can override the grid with cut `{grid}`; the skyscraper keeps 2 (see L22). Town `calls` before → after (two runs each): medium 280–314 → 308–309, huge 588–634 → 630–641; skyscraper chunk (-240,240) huge ~600 → 652–699. The 575 target was already beaten by main's own huge numbers (more mega scatter since it was set). Follow-up: L22.

- [x] **L24: Draw awake-but-untouched buildings from their proxy** `NEEDS LOGIC` (from world-props, D8c)
  - What exists: pack buildings carry `o.proxy` (L16), now sliced 3×3 (8 walls + slab per storey, so a 2-storey house is ~20 parts).
  - Problem: once a building wakes near a car, every part is its own mesh and draw call. At huge size the houses around the car are awake: ~76 meshes for 4 houses, 55 for one 6-storey skyscraper at 3×3. That's why the skyscraper keeps 2×2 slicing.
  - Needed in `game.js`: keep drawing `o.proxy` while a building is awake but has lost no parts, and swap to the parts on the first hit (`damageBuilding`/`collapse`/a blast). Then the skyscraper can go to `grid:3` as well.
  - Check: `__sp.stats().calls` at huge in town (`__sp.tp(240,-160)`) and at the skyscraper landmark should drop by ~50–100.
  - Done in L25: nothing wakes just for being near a car any more, so an untouched building (proxy or not) stays in its batch until the first hit. Huge town 810 → 295, skyscraper area (-240,240) at huge 1,100 → 470. Follow-up: D15 (skyscraper `grid:3`).

- [x] **D15: Skyscraper at 3×3 slicing** `NEEDS DESIGN` (world-props; from L24/L25)
  - Untouched buildings no longer cost draw calls of their own while a car is near (L24/L25), so the skyscraper's 2×2 cut (kept because a woken 3×3 skyscraper was 55 meshes) can go to `grid:3` like the other pack buildings. Only a building that is being smashed draws as parts now. Check `__sp.stats().calls` at huge by the skyscraper landmark (`__sp.tp(-240,240)`, ~470 today) stays under ~600.
  - Done (world-props/D15): the skyscraper uses `KIT_GRID` (3×3: 8 walls + a slab per storey), 25 → 55 parts for a 6-storey tower. `__sp.stats().calls` at huge by (-240,240), 1600×900 high: standing 340 → 336, while it collapses after barrel blasts 334–337 → 357–361. Under the ~600 budget.

- [x] **L15: Zone plug-ins** (unblocks the `zone-<name>` agents; see `agents/zone.md`; was numbered L11, which is golden surprises)
  - New zones live in their own files: `src/world/zones/<name>.js`, loaded by `boot.mjs` from a list (e.g. `src/world/zones/index.json`), each registering `{id, letter, ground, sky?, props, layout(ctx), sizes}` via a `registerZone()` helper in core.js.
  - The zone map / NEW WORLD mixes registered zones in (town/farm/park stay common; themed zones show up some worlds), so each new world feels different.
  - Add a test helper (`__sp.zone('candy')` teleports into one). Document the contract in CLAUDE.md, ship an empty example zone, and add `NEEDS DESIGN` tasks for the first two zones (candy, dino).
  - Done (v0.20.0): `registerZone({id, letter, ground, sky, weight, props, sizes, herds, layout})` in core.js; `src/world/zones/index.json` lists zone files for boot.mjs; NEW WORLD mixes in up to two themed zones (one or two blobs each; the first world stays the hand-made map); the sky fades to a zone's tint while you're in it; `__sp.zone('<id>')` paints a 3×3 block of that zone next to the car and drives you in. Template: `src/world/zones/_example.js`. Contract in CLAUDE.md.

- [x] **AU1: Record the new car names** `NEEDS AUDIO` (audio agent; from PR #7)
  - Rex Rammer, Taco Tornado and Stomp King have no voice clips yet (robot voice for now). Run `make-voices.mjs --dry`, then generate.
  - Done: rex_rammer, taco_tornado, stomp_king clips (~35 ElevenLabs characters).

- [x] **D12: More cars for the garage** `NEEDS DESIGN` (cars-ui; L17 shipped with placeholders)
  - The garage shows 4 cars per player from the new tier, different for each player once a tier has 6+. Counts now: tier 0: 6 ✅ (starters, not shown in a garage), tier 1: 8 ✅, tier 2: 11 ✅, **tier 3: 9** (Rocket Racer, Shark Attack, Rex Rammer, Stomp King, Comet Cruiser + D12 batch).
  - ✅ Done (`cars/D12`): **Rocket Sled** 🛷 (long race sled + runners + rockets), **Robo Walker** 🤖 (truck on robot legs), **Spike-o-saurus** 🦕 (stego spike plates + plow snout), **Hover Zoomer** 🛸 (future racer under a glow saucer). All `tier:3` / `weapon:'rocket'` with visible `PARTS.rockets`. Exact `GARAGE_WANTED` names so the ❓ placeholders go away. New parts: `sledRunners`, `roboLegs`, `stegoSpikes`, `hoverDisc`.

- [x] **B1+B2 order (Kaden + son picked, Nov 7): build ALL three bosses for each zone, in this order** (world-bosses; set `zone:'candy'` / `zone:'dino'` on each so L23 can pick them)
  1. **Gummo the Gummy Giant** 🐻 (candy), then **Rexy Rumbleton** 🦖 (dino): first, they're the favorites ✅ (world-bosses/B1-B2)
  2. **Gumbo-Tron 3000** 🍬 (candy) and **Lava Larry** 🌋 (dino) ✅ (world-bosses/B-pair2)
  3. **Sir Sprinkles** 🎂 (candy) and **Mama Stegosaurus "Plates"** 🦕 (dino) ✅ (world-bosses/B-pair3)
  - Concepts and weak-spot ideas are in B1a / B2a below. One PR per pair is fine. Each new boss: add an audio task (AU7) with its intro, 2–3 taunts and defeat line.

- [x] **B1: Candy Land boss** `NEEDS DESIGN` (world-bosses; needs L23 + Z1) — e.g. a wobbly gummy-bear giant or a gumball-machine robot. Built from `BP` parts in candy colors, weak spots on the outside. Kaden + son pick the concept and name.
  - Done (world-bosses/B1-B2): Kaden + son picked **Gummo the Gummy Giant** 🐻 (`id:'gummo'`, `zone:'candy'`) in `src/world/bosses.js`: cherry-red gummy bear, lime belly, mismatched googly eyes, buck tooth, party hat with a spinning peppermint, sway 0.17. 50 parts, weak spots gumdrop belly buttons → candy-cane toe caps → the lollipop in each paw. Until L23 lands he joins the random boss pick.
- [x] **B1a: Candy Land boss ideas** (all three built: Gummo, Gumbo-Tron, Sir Sprinkles) `NEEDS DESIGN` (world-bosses; from zone-candy, Z1 ✅; feeds B1, so pick one with Kaden + son and build it as B1)
  - **Gummo the Gummy Giant** 🐻: a big wobbly gummy bear (high `sway`, jiggles when hit) in bright candy colors (cherry red body, lime belly). Weak spots: two gumdrop buttons on the belly (phase 1), two candy-cane-striped toe caps (phase 2), a lollipop held low in its paw (phase 3). Each storey falls apart into fat gummy chunks.
  - **Gumbo-Tron 3000** 🍬: a walking gumball-machine robot, a twin of the zone's `candy_gumball` landmark with legs and a coin-slot mouth. Its head is a ball of gumballs (`whole:true` parts) that rain out as it takes damage. Weak spots: two coin-slot knobs on its chest (1), the silver turn-crank hands (2), the red hatch knees (3).
  - **Sir Sprinkles** 🎂: a walking three-tier birthday cake (same tiers as `candy_cake`, so its storeys pancake the same way) with frosting arms, licorice legs and a candle crown (candles as `whole:true` extras). Weak spots: cherry kneecaps (1), sprinkle patches on the bottom tier (2), the cake-board feet (3). When it's beaten, the candles pop off like fireworks.
  - The zone colors are global constants in `src/world/zones/candy.js` (`CANDY_BRIGHT`, `CANDY_PASTEL`, `CANDY_SCOOP`, `CANDY_RED`…); reuse them. Boss music is the zone's `candy_boss` track (AU3). Voice lines (intro, 2–3 taunts, defeat) go to the audio agent once a name is picked.

- [x] **AU3: Candy Land sounds + music** `NEEDS AUDIO` (audio; from zone-candy, Z1 ✅; the candy part of AU2. L22 is needed to play them, but they can be generated now). The ids are already set in `src/world/zones/candy.js`. The sound: sugary, bouncy, crunchy and silly, never gross.
  - **Music** (`tools/music-lines.json`, same chiptune style as the other tracks):
    - `candy_drive` (~90 s loop): a sweet sugar-rush driving tune: bouncy bubbly bassline, twinkly music-box / glockenspiel lead, skippy happy groove, like cruising through a candy shop. Seamless loop.
    - `candy_boss` (~90 s loop): a goofy giant-dessert showdown, fast and dramatic but silly: oompah tuba bass, wobbly jelly synth, a chorus of kazoos, sparkly runs. Seamless loop.
  - **Zone sfx** (`tools/sfx-lines.json`; the `_1…` variants are picked at random):
    - `candy_crunch_1`…`_4` (crash, ~0.6 s): a crunchy hard-candy smash, a glassy sugar shatter, a crisp wafer crunch, a cookie snapping into crumbs.
    - `candy_pop_1`…`_3` (boom, ~1.2 s): a huge popcorn / bubble-gum POP with a fizzy soda burst and a tinkle of falling sprinkles.
    - `candy_squish_1`…`_3` (land, ~0.5 s): a soft, springy marshmallow squish / jelly splat landing.
    - `candy_ambient` (~20 s loop, very quiet): a soda-fizz shimmer, a distant music-box twinkle, the odd bubble-gum pop far away.
  - **Per-prop sfx** (overrides, see `CANDY_SFX` in candy.js):
    - `candy_boing_1`…`_3` (~0.6 s): a rubbery gumdrop / marshmallow boing with a jiggly wobble (marshmallows, gumdrops, rolling donuts).
    - `candy_gumballs_1`…`_2` (~1.5 s): a gumball machine bursting, dozens of gumballs clattering and bouncing everywhere.
    - `candy_snap_1`…`_3` (~0.6 s): a chocolate-bar snap / gingerbread crack / candy-cane crack (chocolate bars, cookies, canes, gingerbread people and houses).
    - `candy_splat_1`…`_3` (~0.8 s): a big frosting SPLAT with a wobbly cake thud (cupcakes, cupcake houses, ice cream, the sundae, the birthday cake).
  - Voice lines for the candy boss come with B1a/B1 once Kaden + son pick one.
  - Done: `candy_drive` + `candy_boss` (90 s), 22 sfx (`candy_crunch_1…4`, `candy_pop_1…3`, `candy_squish_1…3`, `candy_boing_1…3`, `candy_gumballs_1…2`, `candy_snap_1…3`, `candy_splat_1…3`, `candy_ambient`). The ambient loop is pre-leveled to about −40 dB mean (same as `dino_ambient`), so one ambient volume works for every zone.

- [x] **B2: Dino Valley boss** `NEEDS DESIGN` (world-bosses; needs L23 + Z2) — a goofy, clumsy giant dinosaur (big head, tiny arms, never scary).
  - Done (world-bosses/B1-B2): Kaden + son picked **Rexy Rumbleton** 🦖 (`id:'rexy'`, `zone:'dino'`): pastel T-rex, big head with a wide grin and buck teeth, googly eyes looking two ways, polka-dot belly, rounded back plates, teeny arms that windmill, tail dragging on the ground, sway 0.13. 57 parts, weak spots big toenails → knee pads → tail tip + tail bump. Joins the random pick until L23.
- [x] **AU7: Gummo + Rexy voice lines** `NEEDS AUDIO` (audio; from B1/B2). Add to `tools/voice-lines.json` and generate: `Here comes Gummo the Gummy Giant!`, `Here comes Rexy Rumbleton!`, plus each boss's `taunts` and `defeat` line (exact text in `BOSSES` in `src/world/bosses.js`). Goofy and friendly: Gummo is a squishy, giggly bear; Rexy is a big clumsy happy dino.
  - Done: all 10 lines recorded (2 intros, 6 taunts, 2 defeat lines), each with its own eleven_v3 direction tag (`[giggles]`, `[playfully]`, `[sighs happily]` for Gummo; `[goofy, friendly]`, `[laughing]`, `[yawns]` for Rexy). They play as soon as L27 says them.
- [x] **AU10: Sir Sprinkles + Mama Stegosaurus voice lines** `NEEDS AUDIO` (audio; from B pair 3). Add to `tools/voice-lines.json` and generate: `Here comes Sir Sprinkles!`, `Here comes Mama Stegosaurus!`, plus each boss's `taunts` and `defeat` line (exact text in `BOSSES` in `src/world/bosses.js`; logic already plays them). Sir Sprinkles is a posh, cheerful birthday cake; Mama Stegosaurus is a warm, gentle, slightly flustered mom.
  - Done: 10 lines recorded (2 intros, 6 taunts, 2 defeats). Sir Sprinkles is tagged `[posh, delighted]`, `[posh, playfully]`, `[posh, proudly, giggles]`, `[posh, cheerful, laughing]`; Mama Stegosaurus `[warm, motherly, flustered]`, `[warm, motherly, proudly]`, `[whispers]` ("Shh! Don't wake my egg!"), `[warm, motherly, laughing]`.
- [x] **AU8: Gumbo-Tron + Lava Larry voice lines** `NEEDS AUDIO` (audio; from B pair 2). Add to `tools/voice-lines.json` and generate: `Here comes Gumbo-Tron 3000!`, `Here comes Lava Larry!`, plus each boss's `taunts` and `defeat` line (exact text in `BOSSES` in `src/world/bosses.js`). Gumbo-Tron is a cheerful beepy robot; Lava Larry is a big, warm, rumbly goofball (his defeat line starts with a giant burp).
  - Done: all 10 lines recorded (2 intros, 6 taunts, 2 defeat lines). Gumbo-Tron's are tagged `[robotic, cheerful]`, `[robotic, excited]`, `[robotic, glitching, happy]`; Lava Larry's are `[deep voice, giggles]`, `[deep voice, warm, laughing]`, and his defeat line opens with `[burps loudly]`.
- [x] **L27: Per-boss taunts and defeat line** `NEEDS LOGIC` (logic; from B1/B2). Bosses can now carry `taunts:[…]` and `defeat:'…'` (Gummo and Rexy do). In `hitWeak`, use `boss.def.taunts` (when present) instead of the generic `'Ouch!','Bonk!','Again! Again!'`, and say `boss.def.defeat` before `'You beat the boss!'`. Fall back to today's lines when a boss has none.
  - Done (logic-gameplay/L23): hit lines come from `def.taunts`; on the win the boss says `def.defeat`, then "You beat the boss!" ~3.4 s later and "Hooray!" after that. The `TODO(logic)` note in the bosses.js header can go (world-bosses).
- [x] **AU9: Bedroom breakout lines** `NEEDS AUDIO` (audio; from L20). New lines in `tools/voice-lines.json`: "Break out!", "We're outside!", "Smash the door!". Run `make-voices.mjs --dry`, then generate.
  - Done: "Break out!", "We're outside!" and "Smash the door!" are recorded.
- [x] **D16: Start-screen world picker look** `NEEDS DESIGN` (cars-ui; from L20). `#worldPick` holds two `.wp` buttons (🛏️ bedroom, 🌳 outside; `.sel` = picked) above PLAY. Logic injects a plain default style before style.css, so any rule in style.css wins. Pictures only, no words.
  - ✅ Done (`cars/D16`): big square toy tiles (pink→purple bedroom, sky→grass outside), thick white borders + chunky shadow like PLAY, gold ring + bob on `.sel`. No words.
- [x] **B3: Bedroom boss** `NEEDS DESIGN` (world-bosses; needs L23 + L20) — a giant toy (wind-up robot, jack-in-the-box, or a living teddy bear) guarding the door out.
  - Done (world-bosses/B3): world-bosses built **Captain Cuddles** (its own pick from the teddy idea; Kaden + son haven't chosen yet) 🧸 (`id:'cuddles'`, `zone:'bedroom'`): a living teddy bear in striped pajamas and a floppy nightcap with a pompom, one wide button eye and one sleepy one, dragging his yellow polka-dot blankie. 56 parts, sway 0.12. Weak spots: pajama buttons → pink foot pads → blankie corner (front) + stubby tail (back). Test: `__sp.boss('cuddles')`.
- [x] **L29: Boss in the bedroom** `NEEDS LOGIC` (logic; from B3). Today `goGiant()` skips the boss when `roomZ` is set and goes straight to NEW WORLD, so Captain Cuddles never shows up in the bedroom. Summon the bedroom boss there too ("guarding the door out": walk in front of the door; beating him could knock the door open = breakout, or show NEW WORLD as now). At `BOSS_SCALE` 7 he's ~90 tall, about twice the 44-tall room walls, so scale him down in the room (~×4) and keep his drop-in inside the room.
  - Done (logic-gameplay/L29): at GIANT in the room the boss comes too (`pickBoss` picks the bedroom's, so Captain Cuddles), scaled ×4 (`BOSS_SCALE_ROOM`, ~44 tall = wall height), dropping in right in front of the door and pacing between the door and the cars instead of roaming. His stomps and feet never break the door. Beating him: BOSS BEATEN!, then the door bursts open = BREAK OUT into an outdoor world, still GIANT, with the NEW WORLD button. Breaking out before beating him (or without a fight) brings an outdoor boss instead. Knockback, arrows and hit reach scale with the boss. Draw calls in the room fight: ~400–800 while he walks (~1,200 for a moment at the landing smash).
- [x] **AU11: Captain Cuddles voice lines + bedroom boss music** `NEEDS AUDIO` (audio; from B3). `Here comes Captain Cuddles!` plus his `taunts` and `defeat` line (exact text in `BOSSES` in `src/world/bosses.js`). A big, warm, sleepy, giggly teddy voice (yawns welcome). If the bedroom gets `music.boss`, make it a goofy lullaby-turned-showdown: music box and toy xylophone over a bouncy tuba beat.
  - Done: intro, 3 taunts and defeat line recorded (`[yawns] [sleepy, warm]`, `[sleepy, giggles]`, `[warm, playfully, laughing]`, defeat ends on a yawn). The bedroom's `music.boss` is `bedroom_boss` (AU12), made as the lullaby-turned-showdown march. He's heard once L29 summons him in the room.
- [ ] **B3a: Bedroom boss ideas** `NEEDS DESIGN` (world-bosses; from zone-bedroom, Z3 ✅; Captain Cuddles 🧸 already covers the teddy idea; build the other two as extra bedroom bosses if Kaden + son want them). Set `zone:'bedroom'`. Note: indoors at GIANT logic shows NEW WORLD instead of a boss today (L20), so a bedroom boss also needs a `NEEDS LOGIC` task to summon it in the room (or guard the door).
  - **Sir Snuggles** 🧸: a giant patchwork teddy bear with a button nose, mismatched button eyes and a big bow tie. Waddles and gives slow "hugs" (high `sway`). Weak spots: stitched patches on his feet (1), his round belly button and pocket (2), the loose thread on his bottom seam (3). Each storey pops out stuffing puffs (white `whole:true` chunks).
  - **Jack-in-the-Box Jack** 🎁: a huge toy box with crank on the side; the clown-free spring head (a smiling star with googly eyes) boings up and down. Weak spots: the box's corner bumpers (1), the crank (2), the spring coils (3). When beaten the lid slams shut and confetti shoots out.
  - **Clanky the Wind-Up** 🤖: a tall tin wind-up robot with a giant key turning on its back, square head and antenna. Weak spots: its tin feet (1), knee bolts (2), the slowly turning key at its back (3). It winds down and tips over slowly when beaten.
  - Zone colors are globals in `src/world/zones/bedroom.js` (`BEDROOM_TOY`, `BEDROOM_PASTEL`, `BEDROOM_FUR`, `BEDROOM_FUR2`, `BEDROOM_WHITE`, `BEDROOM_INK`…). Boss music is the zone's `bedroom_boss` track (AU10).
- [x] **AU12: Bedroom sounds + music** `NEEDS AUDIO` (audio; from zone-bedroom, Z3 ✅; the bedroom part of AU2). The ids are already set in `src/world/zones/bedroom.js` (`music`, `sfx`, `BEDROOM_SFX`). The sound: a cozy, playful toy box come to life, light and bouncy, never scary.
  - **Music:** `bedroom_drive` (90 s loop: music-box and toy-piano melody over a bouncy ukulele/glockenspiel groove, toy drums, kazoo hooks, upbeat) and `bedroom_boss` (a bigger march: toy-soldier drums, tin trumpets, xylophone runs, wind-up whirs).
  - **Zone sfx:** `bedroom_clatter` ×3 (wooden toy blocks tumbling), `bedroom_boom` ×2 (a toy box crashing open: a bonk, a spring boing and clattering toys), `bedroom_thump` ×3 (a soft thump on a wooden floor), `bedroom_ambient` (a quiet cozy room: a clock ticking, a faint music box far away, birds outside the window; leveled low like `dino_ambient`).
  - **Per-prop crash sounds** (`BEDROOM_SFX`): `bedroom_crunch` ×3 (cereal and cookie crunch), `bedroom_squish` ×2 (gummy squish), `bedroom_snap` ×2 (a crayon snapping), `bedroom_clink` ×2 (glass marbles clinking), `bedroom_squeak` ×3 (rubber-duck squeaks), `bedroom_plush` ×3 (a soft plush flump with a tiny squeaker), `bedroom_toy` ×3 (plastic toy crash with a little electronic beep-boop), `bedroom_boing` ×2 (a bouncy ball boing), `bedroom_drum` ×2 (a toy drum ba-dum), `bedroom_cardboard` ×2 (a cardboard box crumpling), `bedroom_wood` ×3 (wooden furniture crash, chunky and cartoony), `bedroom_door` ×1 (a big door bursting open with a creak and a whoosh).
  - Done: `bedroom_drive` + `bedroom_boss` (90 s, 2 takes each; take 2 kept), all 37 zone and per-prop clips (`bedroom_clatter`…`bedroom_door`). `bedroom_drum_1/2`, `bedroom_thump_1` came out near-silent and were peak-normalized; `bedroom_ambient` was raised +20 dB to sit at `dino_ambient`'s level.

- [ ] **AU2: Zone music + sound effects** `NEEDS AUDIO` (audio; needs L22). ElevenLabs credits are plentiful, so go all in:
  - **Each themed zone** (candy, dino, bedroom, and the core town/farm/park if they don't have their own yet): a looping **drive** track and a **boss** track in that zone's flavor (keep the game's upbeat, kid-friendly style), plus **crash/smash** variants (3+ each), a **boom**, a **landing** sound and a quiet **ambient** loop. Candy: crunches, pops, squishes. Dino: stomps, cartoon roars, leafy crashes. Bedroom: toy squeaks, block clatters, plush thumps.
  - **Each themed boss:** an intro line, 2–3 fight taunts (funny, not scary) and a defeat line.
  - Add them to `tools/*-lines.json`, `--dry` first, then generate. Log total credits used in the PR.
  - Progress: candy (AU3) and dino (AU5) are done. Bedroom (AU12) and all boss lines through Captain Cuddles (AU10/AU11) are done too. Still to do: town/farm/park drive/boss tracks and sfx (needs those core zones to name their ids; today they use the default tracks). Gummo + Rexy lines are done (AU7).

- [x] **Z1: Candy Land zone** `NEEDS DESIGN` (zone-candy agent, see `agents/zone.md`; needs L15 ✅)
  - `src/world/zones/candy.js` from the template: pink/pastel ground and sky, lollipop trees, gumdrops, candy canes, cupcake houses (BP contract), a giant cake mega set piece, 15+ props across micro…mega, bunnies. No real candy brands.
  - Done: zone `candy` (letter C, frosting-pink ground, pink sky). 20 block-built props: micro wrapped candy / jelly beans / peppermints; mini gumdrops / mini lollipops / cookies; tiny candy canes / cupcakes; small lollipops / rolling donuts / marshmallow stacks; medium ice-cream cones / chocolate bars / gingerbread folks; large swirl-lollipop trees / candy-cane arches / **cupcake houses** (BP); huge **gingerbread houses** (BP, 2 storeys) / gumball machines; mega **three-tier birthday cake** (BP) / giant sundae. One cake, gumball machine and sundae per map; other chunks are cupcake-house streets, lollipop groves or gingerbread lanes, with 1–2 ramps and bunny/chick herds. Test: `__sp.zone('candy')`.
  - Draw calls (`__sp.stats().calls`, same spot, high quality): small 172 / medium 370 (both under the normal world's 227 / 540); mega 1684 vs 1505 for the normal world, which is already over the ~700 goal at mega size.

- [x] **Z2: Dino Valley zone** `NEEDS DESIGN` (zone-dino agent, see `agents/zone.md`; needs L15 ✅)
  - `src/world/zones/dino.js` from the template: warm jungle ground, ferns, palm trees, boulders, volcano mega set piece, giant eggs and bones, 15+ props across micro…mega. Goofy, never scary. Dino animals → `NEEDS DESIGN` for world-animals (+ `NEEDS LOGIC` for their sounds/herds).
  - Done: `src/world/zones/dino.js` (letter D, jungle ground, teal/warm sky). 28 block-built props, 3–4 per size: eggs, sprouts, bones, amber (micro) · ferns, rocks, shells · nests, stumps, flowers · big eggs, cycads, bones, crystals · boulders, hatchling eggs, logs, toadstools · palms, tree ferns, stone huts (BP), ribcages · a timber lodge (BP), a grinning long-neck skeleton, a giant nest · a stepped temple (BP), a hedge T-rex and a smiling volcano (BP, one per world, at the heart of the dino blob). Landmark chunks: volcano, temple, rex, villages (lodge + huts), skeleton, nest, dig site; the rest is wild jungle with ramps. Draw calls about the same as town/park (tiny ~170, medium ~295, huge ~455).
- [x] **D14: Dino animals** `NEEDS DESIGN` (world-animals; from Z2)
  - Dino Valley already asks for herds of `trike`, `stego` and `bronto` (`DINO_HERD_KINDS` and `herds` in `src/world/zones/dino.js`); unknown kinds are skipped, so chicks and ducks stand in today.
  - Add `ANIMAL.trike` (baby triceratops, ~1.6 long), `ANIMAL.stego` (~2 long, rounded back plates) and `ANIMAL.bronto` (long neck, ~3 long) in `src/world/animals.js`. Chubby, big eyes, pastel: goofy, never scary. Each needs a sound (AU5).
  - ✅ Done in `src/world/animals.js`: **trike** (mint, peach frill with pink bobbles, three soft cream horns; 1.6 long, small), **stego** (lime, alternating coral/lemon round back plates, bobbly tail; 2.2 long, medium), **bronto** (lavender, pale belly, smooth tapered neck and tail; 3.1 long, 2.5 tall, medium). Big googly eyes, smiles and pink cheeks; 6–7 colors and 3.5–4.1k triangles each. Dino Valley herds now spawn them instead of the chick/duck stand-ins (no logic change needed). Sounds still come from AU5 (`trike`, `stego`, `bronto`); until then the launch uses the synth beep.
- [x] **AU5: Dino Valley sounds + music** `NEEDS AUDIO` (audio; from zone-dino, Z2 ✅; the dino part of AU2. L22 is needed to play them, but they can be generated now). The ids are already set in `src/world/zones/dino.js` (`music`, `sfx`, `DINO_SFX`). The sound: a sunny, stompy prehistoric jungle, big and boomy but goofy, never scary (no real roars, no growls).
  - **Music** (`tools/music-lines.json`, same chiptune style as the other tracks):
    - `dino_drive` (~90 s loop): a happy jungle stomp: tribal toy drums and log marimba, a bouncy tuba/bass walking line, a whistled or ocarina lead, the odd goofy honk on the beat. Feels like a cartoon dino parade. Seamless loop.
    - `dino_boss` (~90 s loop): a clumsy giant's showdown: big boomy timpani stomps, a low brass riff that trips over itself, rumbling volcano bass, silly slide-whistle and kazoo stabs, rising excitement. Seamless loop.
  - **Zone sfx** (`tools/sfx-lines.json`; the `_1…` variants are picked at random):
    - `dino_crash_1`…`_4` (default crash, ~0.6 s): a leafy jungle smash with snapping twigs, a crunchy stone crumble, a hollow wooden clonk, a rustly bush burst.
    - `dino_boom_1`…`_3` (boom, ~1.3 s): a deep volcano KA-BOOM with a rumbly echo and a pitter-patter of falling pebbles, ending in a little lava "bloop".
    - `dino_stomp_1`…`_3` (land, ~0.5 s): a heavy cartoon dino-foot STOMP on soft jungle ground, a thump with a tiny ground shake.
    - `dino_ambient` (~20 s loop, very quiet): warm jungle air, chirpy birds and frogs, a distant friendly dino honk, a soft volcano rumble far away now and then.
  - **Per-prop sfx** (`DINO_SFX`; 2–3 variants each, ~0.5 s unless noted):
    - `dino_egg_1`…`_3`: a big eggshell CRACK and crunch (cartoon, no gooey sounds). `dino_hatch_1`…`_2` (~0.9 s): an egg crack then a tiny happy baby-dino squeak.
    - `dino_bone_1`…`_3`: hollow wooden-xylophone bone clatter, like a pile of giant bones falling over.
    - `dino_leafy_1`…`_3`: a whooshy rustle of big palm fronds and ferns with a springy swish.
    - `dino_rock_1`…`_3`: chunky stone blocks tumbling and crumbling. `dino_crystal_1`…`_3`: a sparkly glassy crystal shatter with a chime.
    - `dino_wood_1`…`_3`: a hollow log thunk and splintering crack. `dino_boing_1`…`_2`: a big rubbery mushroom BOING.
    - `dino_volcano_1`…`_2` (~2 s): a huge rumble that ends in a giant goofy volcano BURP and a fizz.
  - **Animal sounds** (once D14 lands; ids = the kind names, like the other animals): `trike` a short happy trumpety honk, `stego` a deep goofy "hoo-hoo" toot, `bronto` a long low friendly foghorn "hoooonk".
  - Done: `dino_drive` (90 s) + `dino_boss` (take 2 of 2, trimmed to 87.8 s to cut its fade-out), 38 sfx (every id above, incl. `dino_ambient` leveled to −40 dB mean) and the `trike`, `stego`, `bronto` animal sounds, ready for D14.
- [x] **B2a: Dino Valley boss ideas** (all three built: Rexy, Lava Larry, Mama Stegosaurus) `NEEDS DESIGN` (world-bosses; from zone-dino, Z2 ✅; feeds B2, so pick one with Kaden + son and build it as B2)
  - **Rexy Rumbleton** 🦖: a big clumsy T-rex with a giant head, a wide goofy grin, googly eyes and teeny flappy arms (high `sway`, it teeters when hit). Pastel green with a polka-dot belly. Weak spots: two big toenails (phase 1), two round knee pads (phase 2), the tip of its tail dragging on the ground (phase 3). Each storey falls apart into fat green chunks; the tiny arms pop off `whole:true`.
  - **Lava Larry** 🌋: the zone's smiling `dino_volcano` grown stubby dino legs and a tail, walking. Puffs white smoke rings from its crater (`whole:true` extras) and blinks its googly eyes. Weak spots: glowing orange lava vents low on its sides (1), its rock toes (2), the lava-drip "knees" (3). Its rock rings are its storeys, so it pancakes like the landmark; when beaten it lets out a huge burp of confetti.
  - **Mama Stegosaurus "Plates"** 🦕: a chunky stegosaurus whose back plates are a row of giant colorful pastel plates (each a `whole:true` extra that flies off), with a giant egg balanced on her tail. Weak spots: her four painted belly spots low on her sides (1), the tail-spike thumbs near the ground (2), her front feet (3). When beaten the egg on her tail hatches a baby that waves bye.
  - Zone colors are global constants in `src/world/zones/dino.js` (`DINO_LEAF`, `DINO_STONE`, `DINO_EGG`, `DINO_SPOT`, `DINO_BONE`, `DINO_LAVA`, `DINO_GLOW`…), and `dinoEyes(P,x,y,z,size,floor)` makes the googly eyes; reuse them. Boss music is the zone's `dino_boss` track (AU5). Voice lines (intro, 2–3 funny taunts, defeat) go to the audio agent once a name is picked.

### Play-test round 3 (Kaden + son, Nov 8): scenes, quests, worlds
Full spec and contracts: **`docs/ADVENTURE.md`** (read it before any task below). Decisions: portals shrink you back to tiny, the garage rises out of the ground near you, Adventure starts on the street, Adventure auto-saves.

**Phase A (start now, in parallel)**

- [ ] **L31: Scenes + calmer filler** `NEEDS LOGIC` (logic-systems; spec §2)
  - Scene contract: `SCENES` in objects.js and `registerZone({scenes})`, `ctx.scene(id,x,z,th)` in layouts, filler scenes dropped into open ground near the players by zone/spot/size. Scenes scale to any size class (positions and props ×1.65 per step), are remembered per chunk, and face their +Z toward the nearest road or the camera.
  - Cut the random filler to about 40% at micro–small and about 60% at medium+, keep empty ground between scenes, and keep growth pacing about the same (tune points if needed). Both modes.
  - Placeholder scenes from today's props so it's testable before design lands. Measure props on screen and `__sp.stats().calls` on the start street, a town chunk and in the bedroom, before and after.
  - Hand-off: D18 (world-props) and Z4 (zone-bedroom) write the real scenes.

- [ ] **L32: The garage is a building you drive into** `NEEDS LOGIC` (logic-gameplay; spec §3)
  - At a new tier, LEVEL UP raises the Grow-Up Garage out of the ground a short drive ahead (rumble, dust, beacon, gold arrow), scaled to the players. Drive in the front door → camera swoops inside → pick (as today) → the back door rolls up with the GO arrow (A / START still works) → drive out into the world set up for the new size (Arcade: fresh world as today; Adventure: same world, regrown and restocked around the exit) → the garage sinks away.
  - Roomier inside: cars ~1.5× bigger, pads ~2× farther apart, a wider floor.
  - Fix the floor flicker at the front and back of the garage floor (placeholder floor, stripes and the ground are all at y=0; lift each layer and keep the ground from showing through).
  - Hooks: `buildGarageBuilding()` in objects.js (outside; D18), `buildGarage()` in cars.js gets a back exit door (D19). Placeholder looks until then.

- [ ] **L35: Quest engine** `NEEDS LOGIC` (logic-gameplay, after L32; spec §4)
  - New file `src/quests.js` (logic) loaded before `src/world/quests/*.js` (from `src/world/quests/index.json`, like zones) and before game.js. `registerQuest({...})` as drafted in the spec; final contract in CLAUDE.md.
  - Givers: NPC characters at the players' size, idle bob, "!" balloon with their emoji (gold main, blue side), picture bubble with item icon + dots, voice via `say(text,{voice})` (L34), reminder when you come back.
  - Step verbs: `talk`, `find`, `bring`, `catch`, `smash`, `deliver`, `rings`, `push`, `reach`, `boss`. Quest stages are scenes (L31) spawned at the players' size when the quest starts. Items ride on the car roof. Nothing can fail, no timers.
  - One active quest at a time, the gold arrow + ground sparkle trail point at the next target, shared co-op progress, confetti + voice cheer per step, reward ceremony.
  - Chapters: 4, one per car tier. The next garage only rises once the chapter's main quest is done (the LEVEL UP button shows that giver's emoji meanwhile).
  - Placeholder Hank quest with a blocky giver so it's testable. `__sp.quest('id')` starts one, `__sp.quest('id',true)` finishes it.
  - Hand-off: Q1 (quests lane) writes the real Home World quests; D19 styles the bubbles.

- [ ] **L34: Character voices** `NEEDS LOGIC` (logic-systems; spec §7)
  - `tools/voices.json` cast (`{"hank":{"voice":"<id>","model":"…","settings":{…},"prefix":"…"}}`), `"voice":"hank"` on lines in `tools/voice-lines.json`, `make-voices.mjs` uses each line's voice (clip id includes the voice; `--dry` shows cost per voice), `say(text,{voice})` in core.js plays it (robot voice fallback, maybe pitched per character). The announcer stays the default.
  - Hand-off: AU13 (audio) casts the voices.

- [ ] **D18: Home World scenes + quest spots + garage outside** `NEEDS DESIGN` (world-props; needs L31 for scenes, L32 for the garage hook)
  - 6–10 `SCENES` each for town, farm, park and home, across the size bands (ideas in spec §2: ant picnic, snail race, gnome tea party at micro; yard sale, lemonade stand, birthday party, car wash, traffic jam; pumpkin patch, hay maze, pig pen; picnic, sandcastle, kite field, soccer game…).
  - Quest stages for the Home World quests (spec §4): Hank's yard by the start, Garry's garden, the chicken pasture, the crop circle with the crashed saucer, Dozer Dot's crate yard, the parade route arches, the pond island with a treasure chest, the sheep pen. Mark each with a `ctx.spot('quest_<id>',…)` at a fixed spot in the hand-made Home World map.
  - `buildGarageBuilding()`: the Grow-Up Garage outside (front door on +Z ~10 wide at car scale 1, roof sign, beacon; floor at y=0).

- [ ] **Z4: Bedroom scenes, less clutter** `NEEDS DESIGN` (zone-bedroom; needs L31)
  - Replace most of the random toys with scenes: toy-car race on the play-mat road (8 cars on a starting grid, ramp, checkered flag, block grandstand with plush fans), tea party, block city, sock mountain by the laundry basket, crayon art corner, train loop, dino-toy standoff, pillow fort, marble run, snack-bowl spill. Fewer repeats of the castles and towers at the big sizes.

**Phase B (after Phase A merges)**

- [ ] **Q1: Home World quest pack** `NEEDS DESIGN` (quests lane, see `agents/quests.md`; needs L35)
  - `src/world/quests/home.js`: the 11 quests in spec §4 (Hank, Garry, Zippy, Farmer Fern, Bubbles, Pip, Zorp & Blip, Dozer Dot, Mayor Wheelie, Captain Kite, Woolly, then The Big Stomp). Polish the ideas, keep them silly, keep every step doable by a 5-year-old without reading.
  - Block-built giver looks with faces and personality (original designs, `M()` colors), their stage scene ids (from D18), all their lines (~10–15 each, short), and a voice description per character for casting.
  - Hand-off: `NEEDS AUDIO` (AU13) with the cast list + lines added to `tools/voice-lines.json` with `"voice"`.

- [ ] **L36: Abilities + Adventure / Arcade modes** `NEEDS LOGIC` (logic-gameplay; needs L35; spec §1 and §4)
  - Start screen: 🗺️ Adventure / 🕹️ Arcade picture picker (remembered). Adventure = the hand-made Home World with quests; Arcade = today.
  - Ability flags (`hammer`, `shoot`, `hover`, `dozer`, `glide`) plus cosmetics (hats, trails, engine sounds); Arcade turns them all on. Before the hammer: hits wobble + boing + star puff + small bounce-back, no damage, no meter; animals still launch, rollers still roll. Hover: hold B in the air, drift over water. Glide: hold B after a jump.
  - Each new ability: ceremony (car spins up, the part pops onto the car) and a pulsing button glyph with a picture until first use.
  - Hand-off: `NEEDS DESIGN` cars-ui (D19) for the hammer, wings, hover glow and cosmetic parts on the cars + the mode picker look.

- [ ] **L37: Save + Continue** `NEEDS LOGIC` (logic-systems; needs L35; spec §6)
  - Adventure auto-saves to localStorage after each quest step and garage visit (quests, abilities, cosmetics, cars, size, unlocked worlds). Start screen: ▶️ Continue and 🆕 New Adventure (2-second hold). Arcade only remembers unlocked worlds.

- [ ] **D19: Garage inside v2 + quest UI** `NEEDS DESIGN` (cars-ui; needs L32, L35, L36)
  - `buildGarage()` with the roomier floor and a back exit door; the GO arrow over the door.
  - Style the giver "!" balloons (gold / blue), picture bubbles with dots, the ability glyph pop-up, the mode picker and Continue / New tiles. Icons only.
  - Car parts for abilities and cosmetics: roof hammer, egg-blaster nozzle, hover glow ring, glide wings, party hat, crown.

- [ ] **AU13: Character voices + quest sounds** `NEEDS AUDIO` (audio; needs L34 and Q1)
  - Cast every giver in `tools/voices.json` from the ElevenLabs voice library or with Voice Design, matching the personality notes (Hank gravelly old-timer, Fern loud and laughing, Zorp high and squeaky, Blip low and bubbly, Zippy super fast…). Generate all Q1 lines.
  - Sfx: portal whoosh + roar (dino) + giggle (candy), hammer bonk, egg plop, hover hum, glide whoosh, kazoo engine, quest start / step / done jingles, the wobble-but-don't-break boing. Music: the parade march.

- [ ] **QA round 3** (qa; after Phase B): play the whole Home World adventure from Hank to the boss with two controllers, check spacing/scenes at every size, the garage drive-in/out, saving and continue.

**Phase C (after QA round 3)**

- [ ] **L33: Worlds + portals** `NEEDS LOGIC` (logic-systems; spec §5)
  - `src/worlds.js`: `registerWorld({id, name, emoji, zones, start, portal, music})`. Home World = town/farm/park/home; Dino Land and Candy Land become their own worlds and stop being mixed into Home World's NEW WORLD.
  - After the Home World boss: two portals rise (🦖 jungle swirl + roar, 🍭 sprinkle swirl + giggle); driving in = swirl transition, arrive tiny in that world (cars, abilities, cosmetics carry over). A home portal near each world's start. Arcade: unlocked worlds show on the start screen.
  - Hand-off: Z5, Z6 (zone lanes), Q2, Q3 (quests lane).
- [ ] **Z5: Dino Land as a whole world** `NEEDS DESIGN` (zone-dino; needs L33): 3–4 more sub-zones (jungle, volcano, tar-pit swamp, fossil dig, nest hills), each with layouts, scenes and quest spots.
- [ ] **Z6: Candy Land as a whole world** `NEEDS DESIGN` (zone-candy; needs L33): 3–4 more sub-zones (gumdrop forest, chocolate river, lollipop meadow, cake town, ice-cream mountains), each with layouts, scenes and quest spots.
- [ ] **Q2 / Q3: Dino Land and Candy Land quest packs** `NEEDS DESIGN` (quests lane; needs Z5 / Z6): 4 chapters each, new givers and land abilities, ending at that land's boss.

### Play-test round 2 (Kaden + son, Nov 7): "it was fun!"

- [x] **Z3: Inside the House (kid's bedroom) zone** `NEEDS DESIGN` (zone-bedroom agent, see `agents/zone.md`; needs L20)
  - L20 ✅ is live: write `src/world/zones/bedroom.js` with `registerZone({id:'bedroom', indoor:{half:80,wallH:44}, room(half){…}, breakout:['bedroom_door'], start, props, sizes, layout, sky, herds:[]})` (contract in CLAUDE.md, "Indoor zone"). The placeholder (`BEDROOM_DEFAULT` in game.js) shows the scale: room ±80, walls 44 tall, door 16×30 on the north wall. Pick the door's size class with pacing in mind: `large` breaks out at size 6 of 8 and leaves the last sizes for outside; `mega` keeps the whole game indoors. Test with `__sp.room()`.
  - Micro: crumbs, cereal, gummy bears, crayons, building bricks, marbles, toy cars. Small/medium: plush toys, toy trucks, block towers, a train set, books. Large/huge: bed, dresser, toy chest, bookshelf, desk and chair, lamp. Mega: the door/window you break out through.
  - Cozy, colorful kid's-room look. CC0 furniture/toy models where possible. Original designs only (no branded toys).
  - Done: `src/world/zones/bedroom.js` registers `bedroom` (letter R, weight 0, indoor ±80, walls 44). Room shell: plank floor, cloud-and-star wallpaper with a mint lower wall and chair rail, a **play-mat road rug** (roads, houses, pond) in the middle, a round rug, a window with curtains, a rocket poster, a rainbow poster, a light switch, an outlet and a night-light at micro height, a shelf of plushies, and a sky-and-garden view behind the door. Everything is drawn on canvas textures, so there are no image files and nothing to credit. 37 block-built props: micro crumbs / cereal rings (roll) / gummy bears / building bricks; mini crayons / marbles / brick stacks / dice; tiny toy blocks / rubber ducks / toy cars / socks; small teddies / book stacks / sippy cups / wind-up robots / bouncy balls; medium dump trucks / trains / **block towers** (BP) / drums / plush bunnies; large **toy chest** (BP, lid flies) / **dollhouse** (BP) / floor lamps / desk chair / desk / rocking horse / beanbag; huge **dresser** (BP) / **bookshelf** (BP, books fly out) / giant teddy / **play teepee** (BP) / **the door**; mega **bunk bed with a slide** (BP) / **cardboard-box castle** (BP). Furniture stands at fixed room spots; spots `rug`, `snack`, `nook` steer the filler (toy town on the rug, cereal spill by the start); 3 ramps.
  - Pacing: the door is `huge`, so you break out at size 7 of 8 and mega is left for outside. The mega pieces are there for anyone who stays in.
  - Draw calls (`__sp.stats().calls`, high quality, in the room): micro 85, small 93, large 123, huge 290, GIANT 437.

- [ ] **D17: Start-screen help text is out of date** `NEEDS DESIGN` (cars-ui; found reviewing PR #40). The three control cards on the start screen (index.html, shared) still say "LB / RB: switch car", "Q: switch car" and "/ : switch car". Cars now change only in the level-up garage. Update the cards (and the pause menu, if it repeats them) to match CLAUDE.md's controls, mention the garage ("new cars: drive into the one you want"), and add the 🛏️/🌳 picker hint.

- [ ] **D9: Garage look + car stats and perks** `NEEDS DESIGN` (cars-ui; needs L17 + L18)
  - Give every recipe car `speed`, `power`, `handling` and a fitting `perk` (rocket cars get `autoRockets`, dozers get `bulldozer`, and so on). Balance: faster cars are weaker, strong cars are slower.
  - L18 ✅: the stats are live (contract in CLAUDE.md under Block-built car). Today's defaults: `carStats` + `CAR_PERK` in game.js (setting them in cars.js overrides). Card markup: three dot rows (⚡ 💪 🌀) then the weapon icon and `<i class="perk">` (🚀 🧲 🚜 🦘); style `.garageCard .perk`.
  - Style the garage: pads, spotlights, the floating stat cards (icons + bars, no text), the picked-car burst, the GO! prompt.
  - Hooks now live (L17 ✅): `function buildGarage(){…}` in cars.js replaces the placeholder showroom (contract in CLAUDE.md); style `.garageCard` (`.soon` = placeholder car, `--pc` = player color) and `#garageGo` in style.css. The garage look can ship before L18; the stats part needs L18.

- [x] **D11: Real neighborhoods** `NEEDS DESIGN` (world-props; needs L19)
  - Town: houses lined up along streets with yards, fences, driveways and mailboxes; shops on a main street; a park block. Farm: fenced fields with crops in rows, animals in pens, the barn yard. Park: paths, a playground area, the pond.
  - Mark spots with `ctx.spot()` so the filler lands where it belongs. Now live (L19 ✅): `ctx.spot(kind,x,z,w,d,th)` + `const SPOT_PROPS={yard:{mini:[…],…},sidewalk:{…},field:{…},…}` in objects.js (contract in CLAUDE.md). Check with `__sp.spots()`.
  - Done (world-props/D11), in `objects.js` (`hood…` helpers above `ZONE_LAYOUT`). A chunk has a road down its middle when `ci` is even and across it when `cj` is even, so the layouts follow the roads. **Town:** a one-road chunk is a street of houses (5 lots a side) facing the road: sidewalk, front yard with a path and flowers, mailbox, driveway (a parked car about half the time), back yard with a tree / doghouse / swing, picket and back fences. About 1 in 4 is a main street instead: shops on a wide sidewalk with benches and bins, parking lots behind. A crossing is main street on all four arms with a little plaza on each corner. The middle of a block (no road) is a pocket park. **Farm:** each corner is a crop field in rows, a pumpkin patch, a fenced pen with animals (pig, sheep, cow, goat or horse) and a gate, or a hay yard (tractor or farmhouse, chickens), with a fence and a mailbox gate along the road. The barn yard gets a fenced paddock with animals in the far corner. **Park:** paths down the middle, a fountain where two paths meet, and the corners get a playground (sand, swing, slide, climbing frame), a duck pond with benches, a picnic lawn and woods. Landmark chunks keep their layouts and get sidewalks along their roads.
  - Spots: `sidewalk`, `plaza`, `parking`, `yard`, `backyard`, `path`, `lawn`, `sand`, `field`, `patch`, `pen`, each listed in `SPOT_PROPS`. New filler props for the thin sizes: `beachball` (mini, rolls), `pumpkin` (mini), `trashcan` and `birdbath` (tiny), `doghouse` (small), also added to `ZONE_PROPS`.
  - `__sp.stats().calls` before → after (1600×900, high, same chunks): small 145–243 → 123–236, large 209–315 → 159–312. Loaded objects go up ~3× (fences, crops, pumpkins, lots), but worst frame times barely change, even with the CPU throttled 4× (10–14 ms vs 9–13 ms). Follow-up: L30.

- [x] **L30: Paint spots on the ground** `NEEDS LOGIC` (logic-systems; from world-props, D11)
  - What exists: layouts mark sidewalks, driveways, yards, paths, fields, pens… as spots (L19), but they're invisible, so a sidewalk or a field is just grass. `const SPOT_LOOK={sidewalk:'#d9d9d9',path:'#e9d8a6',parking:'#9aa0a6',…}` in objects.js gives a ground color per spot kind.
  - Needed in game.js: draw each built chunk's spots whose kind is in `SPOT_LOOK` as flat tiles just above the ground (below roads and ramps), merged per chunk (one draw call per chunk, or instanced with per-instance color), built and dropped with the chunk. Spots can overlap (a path over a lawn), so draw smaller areas on top or nudge by area. Skip kinds not in `SPOT_LOOK`.
  - Check: town street, farm and park chunks show sidewalks, driveways, dirt fields and sand boxes; `calls` goes up by no more than ~1 per loaded chunk.
  - Done (logic-systems/L30): `spotTiles(c)` (game.js) merges a chunk's `SPOT_LOOK` spots into one mesh with per-vertex colors, built in `loadChunk` and disposed with the chunk. Tiles sit at y=0.03 (over the zone ground, under the roads) and don't write depth; bigger spots are drawn first so a path or driveway shows over a lawn, with no z-fighting up to GIANT. Kinds without a color (the bedroom's `rug`/`snack`/`nook`) are skipped. Zones can add/override colors with `registerZone({spotLook:{…}})`. Real GPU (Metal, high, 1600×900), tiles on → off: start 272/271, small town 269/268, small farm 153/151, medium town 382/376 (+1 per loaded chunk with tiles, as budgeted). No errors.

- [x] **L21: Camera follows your size + "where's my car?"** (play-test round 2; do before L17)
  - The start feels zoomed out and you lose your car. **Keep each car about the same size on screen at every size:** the camera distance scales with the players' size (close at micro, pulling back as you grow), with gentle easing on size-ups (a little "whoosh" pull-back is a nice size-up moment). Let the **world** make you feel small (giant curbs, flowers, mailboxes towering over you), not the camera.
  - Two players far apart: frame both, but clamp the zoom-out and gently pull the trailing car along instead of shrinking both cars to specks.
  - **Easy to find your car:** a bright player-colored ring and a bobbing arrow/marker above each car (P1/P2 color), bigger on spawn and after respawn/teleport/garage, fading to subtle while driving. A short spotlight + "beep beep!" intro on start.
  - **Start on a street:** spawn both players on a sidewalk/street spot in a town chunk, surrounded by micro props (pebbles, flowers, soda cans, leaves), with a curb and a mailbox towering over them, instead of open grass. (Ties into L19 spots; until then, pick a fixed street spot in the home area.)
  - Hand-off: `NEEDS DESIGN` world-props for a hand-placed "start street" set-dressing (curb, sidewalk cracks, puddle, toy-sized clutter) once the spawn spot exists.
  - Done: camera distance = 38 × car scale (a bit less above size 1), eased, with a little whoosh pull-back on LEVEL UP; near plane, shake, shadows and confetti scale with it, and the scatter radius follows the camera so the view stays full of your-size props. Two players: zoom out to 2.1× at most, then the trailing car (the one not driving away) is pulled along; one that ends up way off (teleport) pops back beside the other. A late joiner spawns next to the first player. Markers: a bobbing arrow in the player's color above each car, drawn through buildings; strong with a spotlight beam on spawn, NEW WORLD, new car and teleport; faint while driving; brighter again after ~3s parked. The P1/P2 tag sits on top of the arrow. A "beep beep!" horn + voice on start and NEW WORLD. Spawn: right lane of the home road (`SPAWN_DEFAULT`, overridable with `START_STREET`, see CLAUDE.md). Also fixed a crash (`o.inst is not iterable`) when a pooled scatter prop was removed while asleep.
  - Draw calls (1600×900, high): micro start 357 (main: 419), medium home ~745 (~940), medium town ~360 (331), huge town 795–995 (835), boss fight ~2.2–2.6k (main ~1.9–2.1k in the same run; noisy with debris).

- [x] **D13: Start street set-dressing** `NEEDS DESIGN` (world-props; from L21)
  - The cars now start at micro size in the right lane of the home road (`SPAWN_DEFAULT` in game.js: [2.6,48] and [3.8,48.6], facing −Z). The camera is close, so props around it look giant. Dress the spot: a curb + sidewalk along the road edge (x≈5), sidewalk cracks, a puddle, a mailbox towering over the cars, toy-sized clutter (pebbles, leaves, soda cans, flowers). Move the spot with `const START_STREET=[[x,z],[x,z]]` in objects.js if a better one fits. Keep the first few meters in front of the cars drivable.
  - Done (world-props/D13): `START_STREET` (same spot as `SPAWN_DEFAULT`) in objects.js. Static dressing, built once and merged into one mesh (1 draw call): curbs both sides at x=±5.1, sidewalks with slab seams and cracks, a storm drain at the curb, a puddle in the lane ahead, fallen leaves. Smashables on the sidewalk: a mailbox towering over the cars, a hydrant, a lamp, plus 16 pieces of micro clutter (cans, pebbles, flowers, acorns, toy blocks, a toy duck…), a few of them in the lane for first smashes. `place()` keeps the lane in front of the cars (`startLane(x,z)`) clear of anything bigger than micro, keeps ~1 unit round each spawn, and no longer stacks props on top of each other. Start view: ~306 calls. Follow-up: L26.

- [x] **L26: Keep the start lane clear of scatter** `NEEDS LOGIC` (from world-props, D13)
  - What exists: `startLane(x,z)` and `MICRO_T` in objects.js (the right lane in front of the spawn), and `place()` already respects them.
  - Problem: the opening "props rain in" fill (`spawnScatter` in game.js) drops mini/tiny props (bushes, gnomes, mailboxes, benches) into the lane and onto the road, so 2 of 3 test runs got boinged within the first 1–3 units.
  - Needed: in `spawnScatter`, skip spots where `typeof startLane!=='undefined'&&startLane(x,z)` unless the prop is a size at or below the players' (or simply skip `onRoad(x,z)` for anything bigger than the players). The default chick flock on the home road could start off the road too.
  - Done: `spawnScatter` skips any spot on a road (`onRoad(x,z,r)`) or in `startLane` for props bigger than the players' size; your-size and smaller props still land there to smash. Herds already stay 3+ units off roads (`chunkHerd`). Too-big scatter on the road 5s after start, 3 runs each: main 5/5/10 → branch 0/0/0. Start view calls unchanged (~400).

- [x] **AU6: Record the garage lines** `NEEDS AUDIO` (audio agent; from L17)
  - "Pick your ride!" (garage opens) and "Let's go!" (GO! button shows) are in `tools/voice-lines.json`. Also the 4 placeholder car names when they get real cars (D12).
  - Done: `pick_your_ride.mp3`, `let_s_go.mp3`, plus the new car names Pedal Putter, Cart Crash, Scoot Zoom.

- [x] **AU4: Record "Beep beep!"** `NEEDS AUDIO` (audio agent; from L21)
  - New line in `tools/voice-lines.json`, played with a synth horn when the cars appear. Run `make-voices.mjs --dry`, then generate.
  - Done: `beep_beep.mp3`.

- [x] **L25: GIANT-size and boss fight draw calls** `NEEDS LOGIC` (**high priority**, found in PRs #12 and #13): at GIANT size **every zone** swings around ~1,500 draw calls (zone-dino measured it), and on a real GPU at high quality the boss fight measures **~1,800–3,700 draw calls** (main and branch alike), far over the ~900 budget, and it will stutter on the GTX 1060. Fold in L24 (awake-but-untouched buildings drawn from their proxy). Profile what's drawn at GIANT and during the fight (boss parts, arena debris, explosions, shots, awake buildings at GIANT range) and batch/merge/cap it. Re-measure on the real GPU, not headless (SwiftShader under-reports this: it showed ~500).
  - Done: profiled every draw call by what it belongs to (main and shadow pass) and fixed the big ones. (1) **Lazy wake:** objects no longer wake just because a car is near; they stay in their batch until smashed, hit, wobbled or rolled (this is L24, for every object). (2) **Shared pools for chunk objects:** sleepers go into the world-wide instanced pools the scatter uses (one InstancedMesh per shape, grows when full) instead of a batch per shape per chunk. At GIANT ~70 chunks were ~850 batches, 358 of them holding a single copy; drawing all loaded chunks costs ~200k extra triangles, far cheaper. (3) **Animals instanced** per kind and material (they were up to ~450 main + ~790 shadow calls at GIANT); gold animals stay real meshes. (4) **Cars merged** per material except the wheels (37 → ~20 calls per car). (5) **Puffs and flashes** draw from one InstancedMesh with per-instance color and opacity (were a mesh + material each). (6) At most 40 intact flying parts at once; past that they shatter into the box debris.
  - Draw calls, real GPU (Metal), high, 1600×900, two players, main → branch: micro start 388 → 294; medium home 556 → 352; medium town 365 → 291; huge town 810 → 295; huge skyscraper area 1,100 → 470; GIANT skyscraper area 2,050 → 600; GIANT town 2,510 → 630; boss idle 2,790 → 660; boss fight (explosion every second) 2,200–2,560 → 740–800 (~1,000–1,280 for a second or two while buildings break apart). Still 60 fps. Triangles go up at GIANT (~1.9M → ~2.4M with shadows) because pools draw every loaded chunk.

- [x] **L22: Zone music + zone sound effects** (do right after L21; the zone agents need it)
  - **Music per zone:** `registerZone({…, music:{drive:'candy_drive', boss:'candy_boss'}})`. When the players drive into a zone, cross-fade to that zone's drive track (debounced so zone edges don't flicker; with two players in different zones, follow P1 or the zone most of the screen shows). Fall back to the default `drive` if a track is missing.
  - **Sound effects per zone:** `registerZone({…, sfx:{crash:'candy_crunch', boom:'candy_pop', land:'candy_squish', ambient:'candy_ambient'}})`. Smashing something plays its zone's variant (by the object's zone, not the player's), with a fallback to the default sound. Optional low-volume ambient loop per zone (birds on the farm, a soda-fizz shimmer in Candy Land).
  - Objects can override: `makeObj(…,{sfx:'gummy_squish'})`.
  - Document the contract in CLAUDE.md, then add `NEEDS AUDIO` tasks (AU2) for each existing zone.
  - Done (logic-systems/L22): `sfxIn(zone,kind,own)` in core.js picks the prop's own clip → the zone's `crash`/`boom`/`land` → default clip → synth; smash, building damage/collapse, barrel blasts, slams, car landings and falling props use the zone of where they happen (`zoneXZ`). Music: `drive` follows the zone under the camera after a 2.5 s hold (no flicker on edges), `boss` locks to the zone it started in (`music('boss',{zone})` for L23), missing tracks fall back. Zone `ambient` loops at low volume and cross-fades with the zone (off in the garage). Tested candy + dino: candy_drive/dino_drive, candy_snap/crunch/pop/squish, dino_stomp, town → default crash, no errors; draw calls unchanged (audio only). AU2 covers the remaining zones.

- [x] **L23: Themed world bosses**
  - Bosses get a `zone` field: `BOSSES=[{id, zone:'candy', …}]`. When the players go GIANT, summon a boss of **the themed zone they're in** (each zone can have **several** bosses: pick one at random, avoiding the one you just fought) (or, in a world with a themed zone, that zone's boss), else a random general boss. Each themed boss gets its own **boss music** (from the zone's `music.boss`), intro line ("Here comes <Name>!"), and arena flavor (debris colors from the zone).
  - Keep it co-op and no-fail as today. Test helper: `__sp.boss('id')` still works, plus `__sp.boss('zone:candy')`.
  - Add `NEEDS DESIGN` tasks B1–B3 for world-bosses (or confirm they exist).
  - Done (logic-gameplay/L23): `pickBoss` in game.js: the zone under the players' center → a themed zone anywhere on this world's map → general bosses (no `zone`, or an unregistered one); skips the last boss when there's another. Music = the zone's `music.boss` when that clip exists, else `boss`. Landing dust = zone `bossDust` or `ground`. `__sp.boss('zone:candy')` works. B1–B3 exist (plus the B1+B2 order for pairs 2 and 3). Draw calls are unchanged by this (it only picks); the GIANT/boss count is L25.

- [x] **L17: Level-up garage (pick your new car)**
  - Every car-tier unlock (every 2 sizes) opens a **garage** instead of the plain LEVEL UP: the world pauses and both players drop into a small showroom arena with 3–4 parked cars per player from the new tier on glowing pads, each with a **stat card** floating above it.
  - **Smash a car to pick it** (drive into it, with a big burst, fanfare and the car's name spoken). You then drive the new car around the garage until the other player picks. With one player, only one pick is needed.
  - When everyone has picked, a big **GO!** prompt (A / START) starts a **fresh world** (`newWorld`) and **resets the combo**.
  - **Remove LB/RB car switching** from normal play (keep a debug key). The garage is the only way to change cars.
  - Hand-offs: `NEEDS DESIGN` cars-ui for the garage look + stat cards (D9); voice lines ("Pick your ride!", "Let's go!") for audio.
  - Done: tier unlocks (tiny, medium, huge) open a round showroom just outside the arena, scaled to the players' size (world streaming, scatter, animals, gold and pads stop meanwhile). One player: a row of 4 cars; two players: a 2×2 block each side on pads in their color, different cars each when the tier has 6+ (real + wanted). Drive into one of yours to pick it (flash, confetti, fanfare, crash, its name spoken); the rest of your row goes poof; other cars are solid. Joining mid-garage gives the new player a row. When everyone has picked: GO! button (A / B / Space / START / click) → `rollWorld(true)` = fresh world at the same size, combo reset, beep-beep intro. LB/RB no longer switch cars (they still LEVEL UP); ` cycles cars for testing. Stat cards: ⚡ speed dots, 💪 power dots (from size + tier until L18), weapon icon. Missing cars are placeholders from `GARAGE_WANTED` (see D12). Test: `__sp.garage()`, `__sp.level(n,true)` skips it.
  - Draw calls in the garage: 300 (tiny), ~480 (medium), ~500–630 (huge).

- [x] **L18: Car stats and perks + strength-based smashing**
  - Cars get stats: **speed**, **power** and **handling**, plus an optional **perk**: `autoRockets` (fires at the nearest smashable thing on its own), `magnet` (pulls small stuff in), `bulldozer` (plows through same-size buildings in one hit), `bouncy` (jump x2), and so on. Defaults come from the tier when a car doesn't set them.
  - **Power decides what you can damage above your size:** weak cars boing off anything bigger (as now). Only **high-power** cars can chip buildings 1–2 sizes above them. Today any car can wreck an over-size house with a few hits; that becomes a strong-car perk.
  - Expose the stats for the garage stat cards. **Show them as icons and bars, never text** (lightning = speed, fist = power, rocket = perk) since the main player can't read yet.
  - Hand-off: `NEEDS DESIGN` cars-ui to set stats/perks on every recipe (D9).
  - Done (logic-gameplay/L18): `power`, `handling`, `perk` on CARS entries (contract in CLAUDE.md); defaults from tier/size/speed via `carStats(c)`, placeholder perks for 9 cars in `CAR_PERK` (game.js) until design sets them. Handling scales turning (×0.8–1.2) and grip. Buildings 1 size bigger need power 3+, 2 bigger need 4+ (else boing + red ring); power 5 chips an extra piece. Perks: autoRockets (a rocket every ~2.4 s at the nearest smashable thing or boss weak spot), magnet (slurps up to 2 smaller non-building things within ~3.5 car radii every 0.2 s), bulldozer (same-size buildings fall in one hit, +1 power), bouncy (jump ×2 height + boing). Garage cards: ⚡ speed, 💪 power, 🌀 handling dots, weapon icon + perk icon (`<i class="perk">`). Test: `__sp.perk('magnet')`, `__sp.carStats(CARS[0])`.

- [x] **L28: Cheap bosses** `NEEDS LOGIC` (logic-systems; found reviewing PRs #21/#22). After L25 most fights are ~600–800 calls, but **Gumbo-Tron 3000** still measures ~1,600 (lots of separate gumball parts). Draw each boss's untouched parts merged per material (like the cars), splitting a part out only when it's hit or flies off, so any boss design stays cheap. Re-measure all 7 bosses on the real GPU.
  - Done (logic-systems/L28): `bossMerge(o)` (game.js, at summon) merges every untouched non-weak, non-spinning boss part into one mesh per material under `o.g` (it moves, sways and wobbles with the boss); the real part meshes stay in place, hidden. A part breaking splits its merge groups back into real meshes first (`bossSplit` in `breakPart`), and `collapse`/`rollWorld` unmerge everything, so smashing looks the same. Weak spots (own pulsing material) and `userData.spin` bits stay live. Boss-only draw calls on the real GPU (Metal, `?q=high`, main → L28): Clankzilla 104→58, Shelldozer 116→50, King Wobbles 110→56, Gummo 102→36, Rexy 122→48, Gumbo-Tron 52 (was 112), Lava Larry 114→30. The ~1,600 for Gumbo-Tron didn't reproduce on today's main (the boss itself was 112; whole fights measured ~680–990 on main and ~670–970 on L28, swinging with world/debris, not the boss). All 7 fights played through to the crumble, no errors.

- [x] **L19: Placement that makes sense (neighborhoods, not confetti)**
  - Today the size-matched filler scatters props anywhere in a chunk, so things look random. Let layouts declare **spots**: `ctx.spot(kind,x,z,w,d)` for yards, sidewalks, fields, playground sand, parking, porches. Filler then only goes into matching spots (garden gnomes in yards, cones on roads, hay in fields), with a little leftover scatter.
  - Hand-off: `NEEDS DESIGN` world-props to lay out real neighborhoods with spots (D11).
  - Done (logic-systems/L19): `ctx.spot(kind,x,z,w,d,th)` (rotated rectangles, clipped to the chunk). `spawnScatter` puts ~85% (`SPOT_LEFTOVER`=0.15) of the filler inside a spot in reach (same ring around the car as before; no spot in reach = old behavior) and picks props from `registerZone({spots})` → `SPOT_PROPS[kind][size]` (objects.js) → the zone's size list. Until design defines `SPOT_PROPS`, logic's `DEFAULT_SPOT_PROPS` uses today's types shrunk/grown. `__sp.spots()` debug overlay. Tested with test spots in every chunk: small 28/86 and mega 68/116 scatter inside spots, micro unchanged (no spot in reach); no errors; draw calls unchanged apart from the overlay.

- [x] **L20: "Inside the House" opening world**
  - A new world type: the game can **start inside a giant kid's bedroom**. You're micro-sized among snacks and small toys, grow into bigger toys, then furniture, then **break out** (smash the door or window). That transition launches you into the outdoor world at a matching size.
  - Indoors needs: walls/floor/ceiling instead of sky and roads, no streaming grid (one big room, maybe a hallway), indoor lighting, and a breakout event (a big crash, then the camera flies out to town).
  - Built on the zone plug-in system as a special zone (`bedroom`) with a `breakout` hook. Start-screen choice: **Bedroom** or **Outside** (pictures, not words).
  - Hand-off: `NEEDS DESIGN` zone-bedroom (Z3).
  - Done (logic-systems/L20): indoor zones (`indoor:{half,…}` on `registerZone`, contract in CLAUDE.md). The room is the whole world (zone map all bedroom, world bound `WB` = the room, roads/zone ground/edge walls/start-street dressing hidden, no home arena, no herds, no boss: at GIANT indoors the NEW WORLD button shows instead). Logic placeholder: wood floor + rug, pink walls with a window, a baseboard toward the camera, an orange `room_door` (size `large`) on the north wall, today's toys scaled as filler. When the players reach the door's size an arrow bobs over it ("Smash the door!"); smashing it = BREAK OUT! (crash, confetti, camera pulls way back) → fresh outdoor world at the same size, camera swoops in ("We're outside!"). The garage's GO keeps you in the room. Start screen: 🛏️ / 🌳 picture buttons (stick, arrows or A/D to switch, remembered). Draw calls in the room: 255 micro, 653 small, ~300 large. New voice lines → AU8.

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
- **world-animals** (Claude Code design): `src/world/animals.js`, `assets/props/animals/`. Task: D14 ✅.
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

- [x] **D8: Swap in a free CC0 low-poly art pack** (biggest visual win). Split: **D8a cars → Cursor** (Kenney car kit, in progress); **D8b world → Claude Code design** (town, farm, park props/buildings via the L9 GLB prop loader, in `objects.js` + `assets/props/`)
  - Use **CC0** packs only (free for any use, no attribution needed): Kenney, Quaternius, or KayKit. Pick **one** main style so everything matches. Note the pack and license in `assets/CREDITS.md`.
  - Start with the **town** (houses, shops, trees, street props) and **cars**, then the farm, park and animals.
  - Put models in `assets/props/` and `assets/cars/`. Keep each prop under ~5k triangles, cars under ~20k.
  - Buildings still need the L3 part contract to collapse. For a pack building, either keep it one piece (it smashes but doesn't pancake) or split walls/roof into separate meshes in Blender, and tag them in a small manifest.
  - Needs: L9 GLB prop loader for the cleanest path. Cars can start now via `assets/cars/cars.json`.
  - D8a started: Kenney car kit (CC0, `assets/CREDITS.md`). The driveable cars are in `assets/cars/` and show up in the car swap. Town, farm, and park models are D8b (world lane).
  - ✅ **D8b done** (world-props/D8b): town, farm and park use Kenney CC0 models (City Kit Suburban + Commercial + Roads, Nature Kit, Fantasy Town, Holiday Kit, Car Kit; credited in `assets/CREDITS.md`). 58 models in `assets/props/`, baked by `assets/props/bake.mjs` into one mesh with vertex colors each (no textures). In `objects.js`, `kitPieces()` slices each model once (cached, shared by every size): buildings into storeys of walls + roof with the L3 part contract (they still pancake), trees/flowers by color (leaves fly off whole), snowmen into balls. Houses, cottages, villas, shops, the tall boss building, farmhouse, trees, bushes, flowers, mushrooms, pebbles, lamps, cones, benches, parked cars, tractor, fences, crops, melons, snowmen, fountain and windmill sails all switched; every type keeps its block version as the fallback. Still block-built: school, fire station, water tower, barn, silo, coop, hay, scarecrow, playground, gazebo, bounce house and the home-arena toys.
  - ✅ **Landmarks converted** (world-props/D7): barn (Styloo Cozy Farm, CC0), school (Kenney Modular Buildings, plus a block flagpole), fire station (Kenney Racing Kit garage painted red, plus the block hose tower and siren), water tower (KayKit City Builder), silo (Kenney Industrial stack recolored, plus a dome), gazebo (Kenney Pirate Kit pavilion, random roof color), bounce house (Kenney Minigolf castle in party colors), slide (Mini Skate quarter pipe + Platformer ladder) and climbing gym (Mini Skate frame). Still block-built: swing (no CC0 model fits), coop, hay, scarecrow and the home-arena toys. `kitPieces` mode `bld` now takes `{eave, noCap}` for models outside the city kits.
  - Draw calls: each building slice is its own instanced batch while asleep, so a chunk shares one model + wall color per building type (roofs still vary per house) and walls are 4 per storey (`KIT_GRID=2`) for now. Back to 8 per storey (`KIT_GRID=3`) after **L15**.

- [x] **D5: Boss model(s)** (world lane)
  - Done (world-bosses/D5): `BOSSES` in `src/world/bosses.js` replaces all three placeholders, block-built, 47–55 parts, 3 phases × 2 weak spots each, spinning bits via `o.spin`. **Clankzilla**: washing-machine robot (sock in the window), toaster head with toast popping out, tin-can legs in sneakers, plunger + spatula, propeller; weak spots knees → heels → dial + battery. **Shelldozer**: beach crab with one giant fiddler claw wearing a sandcastle, pinwheel on top; claw wrists → back bumps → castle shells. **King Wobbles**: roly-poly toy king, stacked-block tummy, curly mustache, tilted crown, spinning lollipop scepter and wind-up key; slipper pompoms → buckle + key → side jewels. Same ids and names, so the recorded intros still play.
  - One original boss for max size, built from L3-contract parts plus `BP(mesh, floor, 'weak')` glowing weak spots. Chunky, funny, not scary. Kaden and son to pick the concept (and maybe name it).
  - Needs: L6 spec. ✅ L6 is done. The format is in `CLAUDE.md` under "Boss". Logic has three blocky placeholders to replace or polish (Kaden picked all three ideas, one random per world): **Clankzilla** (junk robot), **Shelldozer** (crab carrying a sandcastle), **King Wobbles** (wobbly block king). New bosses welcome; Kaden and son will invent more.

- [x] **D6: Car upgrade path** (Cars: Cursor) (from play-test round 1)
  - Done on `cars/D6`: every car has `tier` 0–3 (block-built + `cars.json` + `RECIPES`). Tier 2 cars set `weapon:'cannon'`, tier 3 set `weapon:'rocket'`, with visible `PARTS.cannon` / `PARTS.rockets` on the model (block builds mount them too). Logic still falls back to `CAR_TIER` / `WEAPON_BY_TIER` for any car missing a field.
  - New car names (Rex Rammer, Taco Tornado, Stomp King) need a recorded voice once someone runs `tools/make-voices.mjs`.

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
  - Started: `PARTS` + `RECIPES` in `src/cars.js`. Yellow Cab, Hose Hero, and Dash Racer are Kenney bases with paint and parts. New from this list: Honk Bus (school bus), Snow Pusher (snowplow), Spinny Mixer (cement mixer). Also (D6 pass): Rex Rammer (T-rex truck), Taco Tornado (taco truck), Stomp King (monster truck). Tier-0 starters: Pedal Putter (pedal car), Cart Crash (shopping cart), Scoot Zoom (scooter).

- [x] **D7: More mega set pieces** (world lane)
  - Still just ideas: stadium, skyscraper, cargo ship, ferris wheel. Build them with `BP` when a zone has room. The mountain-sized boss is D5.
  - Done (world-props/D7), one landmark each per world (`pickLandmarks`: `sky` in town; `stadium`, `ferris` and `ship` in park), all `mega` with block fallbacks:
    - **Skyscraper** (`skyscraper`): Kenney Modular Buildings towers (4–6 storeys, ~19–30 tall), sliced with the L3 contract so floors pancake; uses `o.proxy` while asleep. Also in `ZONE_PROPS.town.mega`.
    - **Stadium** (`stadium`, radius 13): eight Kenney Racing Kit grandstands (walls + roof each) around a pitch with goals and a big ball.
    - **Ferris wheel** (`ferris`): original block build; the wheel is merged into one mesh and spins, and flies off whole when the legs break. Landmark only, because spinning things never sleep.
    - **Ship** (`ship`): the Kenney Pirate Kit ship run aground, ringed by barrels (chain blasts) and crates. Also in `ZONE_PROPS.park.mega`.

---

## Art pipeline (GPU server, run by Kaden's agents)

- [ ] **A1: Set up the art factory on the Proxmox GPU server.** Full brief: `docs/ART_PIPELINE.md`.
- [ ] **A2: Kid-drawn cars.** Photo of a drawing → 3D model → `assets/cars/` + `cars.json` entry, delivered as a PR.

