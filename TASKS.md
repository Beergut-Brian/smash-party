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

- [ ] **L24: Draw awake-but-untouched buildings from their proxy** `NEEDS LOGIC` (from world-props, D8c)
  - What exists: pack buildings carry `o.proxy` (L16), now sliced 3×3 (8 walls + slab per storey, so a 2-storey house is ~20 parts).
  - Problem: once a building wakes near a car, every part is its own mesh and draw call. At huge size the houses around the car are awake: ~76 meshes for 4 houses, 55 for one 6-storey skyscraper at 3×3. That's why the skyscraper keeps 2×2 slicing.
  - Needed in `game.js`: keep drawing `o.proxy` while a building is awake but has lost no parts, and swap to the parts on the first hit (`damageBuilding`/`collapse`/a blast). Then the skyscraper can go to `grid:3` as well.
  - Check: `__sp.stats().calls` at huge in town (`__sp.tp(240,-160)`) and at the skyscraper landmark should drop by ~50–100.

- [x] **L15: Zone plug-ins** (unblocks the `zone-<name>` agents; see `agents/zone.md`; was numbered L11, which is golden surprises)
  - New zones live in their own files: `src/world/zones/<name>.js`, loaded by `boot.mjs` from a list (e.g. `src/world/zones/index.json`), each registering `{id, letter, ground, sky?, props, layout(ctx), sizes}` via a `registerZone()` helper in core.js.
  - The zone map / NEW WORLD mixes registered zones in (town/farm/park stay common; themed zones show up some worlds), so each new world feels different.
  - Add a test helper (`__sp.zone('candy')` teleports into one). Document the contract in CLAUDE.md, ship an empty example zone, and add `NEEDS DESIGN` tasks for the first two zones (candy, dino).
  - Done (v0.20.0): `registerZone({id, letter, ground, sky, weight, props, sizes, herds, layout})` in core.js; `src/world/zones/index.json` lists zone files for boot.mjs; NEW WORLD mixes in up to two themed zones (one or two blobs each; the first world stays the hand-made map); the sky fades to a zone's tint while you're in it; `__sp.zone('<id>')` paints a 3×3 block of that zone next to the car and drives you in. Template: `src/world/zones/_example.js`. Contract in CLAUDE.md.

- [x] **AU1: Record the new car names** `NEEDS AUDIO` (audio agent; from PR #7)
  - Rex Rammer, Taco Tornado and Stomp King have no voice clips yet (robot voice for now). Run `make-voices.mjs --dry`, then generate.
  - Done: rex_rammer, taco_tornado, stomp_king clips (~35 ElevenLabs characters).

- [ ] **D12: More cars for the garage** `NEEDS DESIGN` (cars-ui; before L17 ships)
  - The level-up garage shows 3–4 cars per player from the new tier. Today's counts are tier 0: 3, tier 1: 8, tier 2: 11, tier 3: 5. Add **3+ tier-0 starters** (pedal car, shopping cart, toy scooter) and **4+ tier-3 showstoppers** from the D4 list (rocket sled, robot-leg walker, stegosaurus spike car, hover car) so both players get real choices.

- [ ] **B1: Candy Land boss** `NEEDS DESIGN` (world-bosses; needs L23 + Z1) — e.g. a wobbly gummy-bear giant or a gumball-machine robot. Built from `BP` parts in candy colors, weak spots on the outside. Kaden + son pick the concept and name.
- [ ] **B1a: Candy Land boss ideas** `NEEDS DESIGN` (world-bosses; from zone-candy, Z1 ✅; feeds B1, so pick one with Kaden + son and build it as B1)
  - **Gummo the Gummy Giant** 🐻: a big wobbly gummy bear (high `sway`, jiggles when hit) in bright candy colors (cherry red body, lime belly). Weak spots: two gumdrop buttons on the belly (phase 1), two candy-cane-striped toe caps (phase 2), a lollipop held low in its paw (phase 3). Each storey falls apart into fat gummy chunks.
  - **Gumbo-Tron 3000** 🍬: a walking gumball-machine robot, a twin of the zone's `candy_gumball` landmark with legs and a coin-slot mouth. Its head is a ball of gumballs (`whole:true` parts) that rain out as it takes damage. Weak spots: two coin-slot knobs on its chest (1), the silver turn-crank hands (2), the red hatch knees (3).
  - **Sir Sprinkles** 🎂: a walking three-tier birthday cake (same tiers as `candy_cake`, so its storeys pancake the same way) with frosting arms, licorice legs and a candle crown (candles as `whole:true` extras). Weak spots: cherry kneecaps (1), sprinkle patches on the bottom tier (2), the cake-board feet (3). When it's beaten, the candles pop off like fireworks.
  - The zone colors are global constants in `src/world/zones/candy.js` (`CANDY_BRIGHT`, `CANDY_PASTEL`, `CANDY_SCOOP`, `CANDY_RED`…); reuse them. Boss music is the zone's `candy_boss` track (AU3). Voice lines (intro, 2–3 taunts, defeat) go to the audio agent once a name is picked.

- [ ] **AU3: Candy Land sounds + music** `NEEDS AUDIO` (audio; from zone-candy, Z1 ✅; the candy part of AU2. L22 is needed to play them, but they can be generated now). The ids are already set in `src/world/zones/candy.js`. The sound: sugary, bouncy, crunchy and silly, never gross.
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

- [ ] **B2: Dino Valley boss** `NEEDS DESIGN` (world-bosses; needs L23 + Z2) — a goofy, clumsy giant dinosaur (big head, tiny arms, never scary).
- [ ] **B3: Bedroom boss** `NEEDS DESIGN` (world-bosses; needs L23 + L20) — a giant toy (wind-up robot, jack-in-the-box, or a living teddy bear) guarding the door out.

- [ ] **AU2: Zone music + sound effects** `NEEDS AUDIO` (audio; needs L22). ElevenLabs credits are plentiful, so go all in:
  - **Each themed zone** (candy, dino, bedroom, and the core town/farm/park if they don't have their own yet): a looping **drive** track and a **boss** track in that zone's flavor (keep the game's upbeat, kid-friendly style), plus **crash/smash** variants (3+ each), a **boom**, a **landing** sound and a quiet **ambient** loop. Candy: crunches, pops, squishes. Dino: stomps, cartoon roars, leafy crashes. Bedroom: toy squeaks, block clatters, plush thumps.
  - **Each themed boss:** an intro line, 2–3 fight taunts (funny, not scary) and a defeat line.
  - Add them to `tools/*-lines.json`, `--dry` first, then generate. Log total credits used in the PR.

- [x] **Z1: Candy Land zone** `NEEDS DESIGN` (zone-candy agent, see `agents/zone.md`; needs L15 ✅)
  - `src/world/zones/candy.js` from the template: pink/pastel ground and sky, lollipop trees, gumdrops, candy canes, cupcake houses (BP contract), a giant cake mega set piece, 15+ props across micro…mega, bunnies. No real candy brands.
  - Done: zone `candy` (letter C, frosting-pink ground, pink sky). 20 block-built props: micro wrapped candy / jelly beans / peppermints; mini gumdrops / mini lollipops / cookies; tiny candy canes / cupcakes; small lollipops / rolling donuts / marshmallow stacks; medium ice-cream cones / chocolate bars / gingerbread folks; large swirl-lollipop trees / candy-cane arches / **cupcake houses** (BP); huge **gingerbread houses** (BP, 2 storeys) / gumball machines; mega **three-tier birthday cake** (BP) / giant sundae. One cake, gumball machine and sundae per map; other chunks are cupcake-house streets, lollipop groves or gingerbread lanes, with 1–2 ramps and bunny/chick herds. Test: `__sp.zone('candy')`.
  - Draw calls (`__sp.stats().calls`, same spot, high quality): small 172 / medium 370 (both under the normal world's 227 / 540); mega 1684 vs 1505 for the normal world, which is already over the ~700 goal at mega size.

- [x] **Z2: Dino Valley zone** `NEEDS DESIGN` (zone-dino agent, see `agents/zone.md`; needs L15 ✅)
  - `src/world/zones/dino.js` from the template: warm jungle ground, ferns, palm trees, boulders, volcano mega set piece, giant eggs and bones, 15+ props across micro…mega. Goofy, never scary. Dino animals → `NEEDS DESIGN` for world-animals (+ `NEEDS LOGIC` for their sounds/herds).
  - Done: `src/world/zones/dino.js` (letter D, jungle ground, teal/warm sky). 28 block-built props, 3–4 per size: eggs, sprouts, bones, amber (micro) · ferns, rocks, shells · nests, stumps, flowers · big eggs, cycads, bones, crystals · boulders, hatchling eggs, logs, toadstools · palms, tree ferns, stone huts (BP), ribcages · a timber lodge (BP), a grinning long-neck skeleton, a giant nest · a stepped temple (BP), a hedge T-rex and a smiling volcano (BP, one per world, at the heart of the dino blob). Landmark chunks: volcano, temple, rex, villages (lodge + huts), skeleton, nest, dig site; the rest is wild jungle with ramps. Draw calls about the same as town/park (tiny ~170, medium ~295, huge ~455).
- [ ] **D14: Dino animals** `NEEDS DESIGN` (world-animals; from Z2)
  - Dino Valley already asks for herds of `trike`, `stego` and `bronto` (`DINO_HERD_KINDS` and `herds` in `src/world/zones/dino.js`); unknown kinds are skipped, so chicks and ducks stand in today.
  - Add `ANIMAL.trike` (baby triceratops, ~1.6 long), `ANIMAL.stego` (~2 long, rounded back plates) and `ANIMAL.bronto` (long neck, ~3 long) in `src/world/animals.js`. Chubby, big eyes, pastel: goofy, never scary. Each needs a sound (AU5).
- [ ] **AU5: Dino Valley sounds + music** `NEEDS AUDIO` (audio; from zone-dino, Z2 ✅; the dino part of AU2. L22 is needed to play them, but they can be generated now). The ids are already set in `src/world/zones/dino.js` (`music`, `sfx`, `DINO_SFX`). The sound: a sunny, stompy prehistoric jungle, big and boomy but goofy, never scary (no real roars, no growls).
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
- [ ] **B2a: Dino Valley boss ideas** `NEEDS DESIGN` (world-bosses; from zone-dino, Z2 ✅; feeds B2, so pick one with Kaden + son and build it as B2)
  - **Rexy Rumbleton** 🦖: a big clumsy T-rex with a giant head, a wide goofy grin, googly eyes and teeny flappy arms (high `sway`, it teeters when hit). Pastel green with a polka-dot belly. Weak spots: two big toenails (phase 1), two round knee pads (phase 2), the tip of its tail dragging on the ground (phase 3). Each storey falls apart into fat green chunks; the tiny arms pop off `whole:true`.
  - **Lava Larry** 🌋: the zone's smiling `dino_volcano` grown stubby dino legs and a tail, walking. Puffs white smoke rings from its crater (`whole:true` extras) and blinks its googly eyes. Weak spots: glowing orange lava vents low on its sides (1), its rock toes (2), the lava-drip "knees" (3). Its rock rings are its storeys, so it pancakes like the landmark; when beaten it lets out a huge burp of confetti.
  - **Mama Stegosaurus "Plates"** 🦕: a chunky stegosaurus whose back plates are a row of giant colorful pastel plates (each a `whole:true` extra that flies off), with a giant egg balanced on her tail. Weak spots: her four painted belly spots low on her sides (1), the tail-spike thumbs near the ground (2), her front feet (3). When beaten the egg on her tail hatches a baby that waves bye.
  - Zone colors are global constants in `src/world/zones/dino.js` (`DINO_LEAF`, `DINO_STONE`, `DINO_EGG`, `DINO_SPOT`, `DINO_BONE`, `DINO_LAVA`, `DINO_GLOW`…), and `dinoEyes(P,x,y,z,size,floor)` makes the googly eyes; reuse them. Boss music is the zone's `dino_boss` track (AU5). Voice lines (intro, 2–3 funny taunts, defeat) go to the audio agent once a name is picked.

### Play-test round 2 (Kaden + son, Nov 7): "it was fun!"

- [ ] **Z3: Inside the House (kid's bedroom) zone** `NEEDS DESIGN` (zone-bedroom agent, see `agents/zone.md`; needs L20)
  - Micro: crumbs, cereal, gummy bears, crayons, building bricks, marbles, toy cars. Small/medium: plush toys, toy trucks, block towers, a train set, books. Large/huge: bed, dresser, toy chest, bookshelf, desk and chair, lamp. Mega: the door/window you break out through.
  - Cozy, colorful kid's-room look. CC0 furniture/toy models where possible. Original designs only (no branded toys).

- [ ] **D9: Garage look + car stats and perks** `NEEDS DESIGN` (cars-ui; needs L17 + L18)
  - Give every recipe car `speed`, `power`, `handling` and a fitting `perk` (rocket cars get `autoRockets`, dozers get `bulldozer`, and so on). Balance: faster cars are weaker, strong cars are slower.
  - Style the garage: pads, spotlights, the floating stat cards (icons + bars, no text), the picked-car burst, the GO! prompt.

- [ ] **D11: Real neighborhoods** `NEEDS DESIGN` (world-props; needs L19)
  - Town: houses lined up along streets with yards, fences, driveways and mailboxes; shops on a main street; a park block. Farm: fenced fields with crops in rows, animals in pens, the barn yard. Park: paths, a playground area, the pond.
  - Mark spots with `ctx.spot()` so the filler lands where it belongs.

- [x] **L21: Camera follows your size + "where's my car?"** (play-test round 2; do before L17)
  - The start feels zoomed out and you lose your car. **Keep each car about the same size on screen at every size:** the camera distance scales with the players' size (close at micro, pulling back as you grow), with gentle easing on size-ups (a little "whoosh" pull-back is a nice size-up moment). Let the **world** make you feel small (giant curbs, flowers, mailboxes towering over you), not the camera.
  - Two players far apart: frame both, but clamp the zoom-out and gently pull the trailing car along instead of shrinking both cars to specks.
  - **Easy to find your car:** a bright player-colored ring and a bobbing arrow/marker above each car (P1/P2 color), bigger on spawn and after respawn/teleport/garage, fading to subtle while driving. A short spotlight + "beep beep!" intro on start.
  - **Start on a street:** spawn both players on a sidewalk/street spot in a town chunk, surrounded by micro props (pebbles, flowers, soda cans, leaves), with a curb and a mailbox towering over them, instead of open grass. (Ties into L19 spots; until then, pick a fixed street spot in the home area.)
  - Hand-off: `NEEDS DESIGN` world-props for a hand-placed "start street" set-dressing (curb, sidewalk cracks, puddle, toy-sized clutter) once the spawn spot exists.
  - Done: camera distance = 38 × car scale (a bit less above size 1), eased, with a little whoosh pull-back on LEVEL UP; near plane, shake, shadows and confetti scale with it, and the scatter radius follows the camera so the view stays full of your-size props. Two players: zoom out to 2.1× at most, then the trailing car (the one not driving away) is pulled along; one that ends up way off (teleport) pops back beside the other. A late joiner spawns next to the first player. Markers: a bobbing arrow in the player's color above each car, drawn through buildings; strong with a spotlight beam on spawn, NEW WORLD, new car and teleport; faint while driving; brighter again after ~3s parked. The P1/P2 tag sits on top of the arrow. A "beep beep!" horn + voice on start and NEW WORLD. Spawn: right lane of the home road (`SPAWN_DEFAULT`, overridable with `START_STREET`, see CLAUDE.md). Also fixed a crash (`o.inst is not iterable`) when a pooled scatter prop was removed while asleep.
  - Draw calls (1600×900, high): micro start 357 (main: 419), medium home ~745 (~940), medium town ~360 (331), huge town 795–995 (835), boss fight ~2.2–2.6k (main ~1.9–2.1k in the same run; noisy with debris).

- [ ] **D13: Start street set-dressing** `NEEDS DESIGN` (world-props; from L21)
  - The cars now start at micro size in the right lane of the home road (`SPAWN_DEFAULT` in game.js: [2.6,48] and [3.8,48.6], facing −Z). The camera is close, so props around it look giant. Dress the spot: a curb + sidewalk along the road edge (x≈5), sidewalk cracks, a puddle, a mailbox towering over the cars, toy-sized clutter (pebbles, leaves, soda cans, flowers). Move the spot with `const START_STREET=[[x,z],[x,z]]` in objects.js if a better one fits. Keep the first few meters in front of the cars drivable.

- [ ] **AU4: Record "Beep beep!"** `NEEDS AUDIO` (audio agent; from L21)
  - New line in `tools/voice-lines.json`, played with a synth horn when the cars appear. Run `make-voices.mjs --dry`, then generate.

- [ ] **L25: Boss fight draw calls** `NEEDS LOGIC` (**high priority**, found in PR #12): on a real GPU at high quality the boss fight measures **~1,800–3,700 draw calls** (main and branch alike), far over the ~900 budget, and it will stutter on the GTX 1060. Profile what's drawn during the fight (boss parts, arena debris, explosions, shots, awake buildings at GIANT range) and batch/merge/cap it. Re-measure on the real GPU, not headless (SwiftShader under-reports this: it showed ~500).

- [ ] **L22: Zone music + zone sound effects** (do right after L21; the zone agents need it)
  - **Music per zone:** `registerZone({…, music:{drive:'candy_drive', boss:'candy_boss'}})`. When the players drive into a zone, cross-fade to that zone's drive track (debounced so zone edges don't flicker; with two players in different zones, follow P1 or the zone most of the screen shows). Fall back to the default `drive` if a track is missing.
  - **Sound effects per zone:** `registerZone({…, sfx:{crash:'candy_crunch', boom:'candy_pop', land:'candy_squish', ambient:'candy_ambient'}})`. Smashing something plays its zone's variant (by the object's zone, not the player's), with a fallback to the default sound. Optional low-volume ambient loop per zone (birds on the farm, a soda-fizz shimmer in Candy Land).
  - Objects can override: `makeObj(…,{sfx:'gummy_squish'})`.
  - Document the contract in CLAUDE.md, then add `NEEDS AUDIO` tasks (AU2) for each existing zone.

- [ ] **L23: Themed world bosses**
  - Bosses get a `zone` field: `BOSSES=[{id, zone:'candy', …}]`. When the players go GIANT, summon the boss of **the themed zone they're in** (or, in a world with a themed zone, that zone's boss), else a random general boss. Each themed boss gets its own **boss music** (from the zone's `music.boss`), intro line ("Here comes <Name>!"), and arena flavor (debris colors from the zone).
  - Keep it co-op and no-fail as today. Test helper: `__sp.boss('id')` still works, plus `__sp.boss('zone:candy')`.
  - Add `NEEDS DESIGN` tasks B1–B3 for world-bosses (or confirm they exist).

- [ ] **L17: Level-up garage (pick your new car)**
  - Every car-tier unlock (every 2 sizes) opens a **garage** instead of the plain LEVEL UP: the world pauses and both players drop into a small showroom arena with 3–4 parked cars per player from the new tier on glowing pads, each with a **stat card** floating above it.
  - **Smash a car to pick it** (drive into it, with a big burst, fanfare and the car's name spoken). You then drive the new car around the garage until the other player picks. With one player, only one pick is needed.
  - When everyone has picked, a big **GO!** prompt (A / START) starts a **fresh world** (`newWorld`) and **resets the combo**.
  - **Remove LB/RB car switching** from normal play (keep a debug key). The garage is the only way to change cars.
  - Hand-offs: `NEEDS DESIGN` cars-ui for the garage look + stat cards (D9); voice lines ("Pick your ride!", "Let's go!") for audio.

- [ ] **L18: Car stats and perks + strength-based smashing**
  - Cars get stats: **speed**, **power** and **handling**, plus an optional **perk**: `autoRockets` (fires at the nearest smashable thing on its own), `magnet` (pulls small stuff in), `bulldozer` (plows through same-size buildings in one hit), `bouncy` (jump x2), and so on. Defaults come from the tier when a car doesn't set them.
  - **Power decides what you can damage above your size:** weak cars boing off anything bigger (as now). Only **high-power** cars can chip buildings 1–2 sizes above them. Today any car can wreck an over-size house with a few hits; that becomes a strong-car perk.
  - Expose the stats for the garage stat cards. **Show them as icons and bars, never text** (lightning = speed, fist = power, rocket = perk) since the main player can't read yet.
  - Hand-off: `NEEDS DESIGN` cars-ui to set stats/perks on every recipe (D9).

- [ ] **L19: Placement that makes sense (neighborhoods, not confetti)**
  - Today the size-matched filler scatters props anywhere in a chunk, so things look random. Let layouts declare **spots**: `ctx.spot(kind,x,z,w,d)` for yards, sidewalks, fields, playground sand, parking, porches. Filler then only goes into matching spots (garden gnomes in yards, cones on roads, hay in fields), with a little leftover scatter.
  - Hand-off: `NEEDS DESIGN` world-props to lay out real neighborhoods with spots (D11).

- [ ] **L20: "Inside the House" opening world**
  - A new world type: the game can **start inside a giant kid's bedroom**. You're micro-sized among snacks and small toys, grow into bigger toys, then furniture, then **break out** (smash the door or window). That transition launches you into the outdoor world at a matching size.
  - Indoors needs: walls/floor/ceiling instead of sky and roads, no streaming grid (one big room, maybe a hallway), indoor lighting, and a breakout event (a big crash, then the camera flies out to town).
  - Built on the zone plug-in system as a special zone (`bedroom`) with a `breakout` hook. Start-screen choice: **Bedroom** or **Outside** (pictures, not words).
  - Hand-off: `NEEDS DESIGN` zone-bedroom (Z3).

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

