# Smash Party — guide for AI collaborators

A co-op driving-and-smashing game for a dad and his 5-year-old, played on a TV with two controllers. Plain HTML + three.js (r186 via an import map; `src/boot.mjs` exposes it as the global `THREE`), no build step, no frameworks. GitHub Pages serves `main` as-is.

## Design rules (do not break these)
- **Co-op only.** No losing, no timers that end the game, no player-vs-player scoring. Everything feeds one shared smash meter.
- **Kid-simple controls.** Stick = point where you want to go. A/RT = turbo, B = jump (becomes 💥 BOOM when stuck), X or Y = shoot (and LEVEL UP when the gold button shows; either works because 8BitDo/Nintendo pads swap the X/Y labels), LB/RB = switch car. Never require reading.
- **Big, loud, funny feedback.** Every action should have a sound, a puff, or a wobble.
- **Original designs only.** No real car brands, toy lines, logos, or licensed characters.
- Must run smoothly at 1080p on a GTX 1060. Computer only (TV via PC + controllers); phone/touch support isn't needed, so don't spend time on it.

## Layout & who owns what
Three lanes work on this repo at the same time: **logic** (Claude Code), **cars & UI** (Cursor) and **world** (a Claude Code *design* session). Stay in your lane to avoid merge conflicts.

| File | Owner | What's in it |
|---|---|---|
| `src/cars.js` | **Cursor** (cars & UI) | Block-built car models + the `CARS` list, model-car loader |
| `src/objects.js` | **Claude Code design session** (world) | Smashable objects (`OBJ`), arena layout (`buildWorld`), respawn mix (`SPAWN_W`) |
| `style.css` | **Cursor** (cars & UI) | All UI styles |
| `assets/**` | **Cursor**: `assets/cars/`, UI art. **World session**: `assets/props/`, `assets/textures/` | `.glb` models, `cars.json`, textures, sounds (except the generated `assets/sounds/voice/`, `sfx/` and `music/`) |
| `tools/`, `assets/sounds/voice/`, `sfx/`, `music/` | **Claude Code** (logic) | ElevenLabs generators (`make-voices.mjs`, `make-sfx.mjs`, `make-music.mjs`), their lists (`*-lines.json`), and the generated mp3s + `index.json` |
| `src/core.js` | **Claude Code** (logic) | Helpers (`mk`, `M`, `E`, `rand`…), renderer, scene, ground/roads/walls, ramps + `groundH`, audio |
| `src/game.js` | **Claude Code** (logic) | Debris, smashing, scoring, respawn, celebration, players/driving, input, collisions, camera, HUD, main loop |
| `src/boot.mjs` | **Claude Code** (logic) | Imports three.js + addons, sets `window.THREE`, loads the plain scripts in order |
| `index.html`, `CLAUDE.md` | Shared | Change rarely; mention it in the commit message |

Scripts are plain (no modules); `src/boot.mjs` loads them in order: `core.js` → `cars.js` → `objects.js` → `game.js`. Materials: use `M(color)` / `mk()` (toy-plastic `MeshStandardMaterial` on high, Lambert on FAST) or `litMat({...})` for custom ones, so the quality toggle covers them. **Prefer `M(color)`:** sleeping props, scatter and debris are batched by shape with the color per instance, so `M()` colors are nearly free to draw, while each custom material adds its own draw call per chunk. Top-level `const`/`function` names are shared across files, so never reuse a name.

If a design change needs new logic (or the other way around), make the part in your own file and leave a `// TODO(logic):` or `// TODO(design):` note for the other tool instead of editing their file.

## Tasks
Check `TASKS.md` before starting. Take the top unchecked task in your section, check it off in the same commit as the work, and add follow-up tasks for the other tool when needed.

## Git workflow
- **Version:** bump `version.json` with every push to `main` (patch `0.12.1` for fixes, minor `0.13.0` for features). The start screen and pause menu show it, and the loader in `index.html` loads the game files with `?v=<version>` so the TV picks up new code. If two pushes collide on it, keep the higher number and bump once more.
- **Pull before you start. Commit small. Push when done.** Never force-push `main`.
- `main` is live on the TV (GitHub Pages: https://beergut-brian.github.io/smash-party/), so only push working code. Use a branch for big experiments.
- Commit messages start with the area: `cars: add Comet Crusher`, `logic: bigger barrel explosions`.

## Coordinate conventions
- Y is up. Forward for any car/object is **+Z** at `rotation.y = 0`; heading θ points along `(sin θ, cos θ)`.
- The camera looks from +Z toward −Z, so screen-up is world −Z.
- The world spans ±440 (`ARENA`) as an 11×11 grid of 80×80 chunks (`CHUNK`); chunk (0,0) is centered on the origin. The original hand-built arena (`buildWorld`) fills the middle, ±72 (`HOME`). Roads run every 160 units. Units ≈ meters; a car is ~4–5 long.
- Only chunks near the players are built. Far objects sleep as instanced meshes and wake into real meshes near a car. Smashed things are remembered per chunk and regrow after a couple of minutes.

## Adding things
- **Block-built car:** write `buildX()` returning `{g, wheels, ex, h}` (see `buildMonster`) and add it to `CARS` with `name, emoji, speed (20–32), r (collision radius ~2–2.8)`, plus `tier` (0 = starter cars at the tiniest sizes … 3 = the coolest cars at the biggest sizes; a new tier unlocks every 2 sizes) and optionally `weapon: 'bubble' | 'cannon' | 'rocket'` (default: tiers 0–1 bubble, tier 2 cannon, tier 3 rocket). Until `tier` is set, `CAR_TIER` in game.js decides.
- **Model car (for graphics models/tools):** drop `name.glb` in `assets/cars/` and add to `cars.json`:
  `{"name":"Comet Crusher","emoji":"☄️","file":"comet.glb","speed":27,"r":2.3,"scale":1,"y":0,"rotateY":0,"height":3,"exhaust":[0,1,-2.5]}`
  Model faces +Z, about 4–5 units long, under ~20k triangles. Meshes named `*wheel*` spin.
- **Zone layout:** define `const ZONE_LAYOUT={town(ctx){…},farm(ctx){…},park(ctx){…},home(ctx){…}}` in `objects.js`. Each function fills one 80×80 chunk. `ctx` has `zone, ci, cj, x0, z0, x1, z1, cx, cz, size` plus `place(type,x,z,arg,r)`, `ramp(x,z,th,L,W,H)` and `free(x,z,r)`. `place` and `ramp` return false (and do nothing) if the spot is off the chunk, on a road, on a ramp or overlapping. `Math.random`/`rand`/`pick` are seeded while a layout runs, so the same chunk always comes out the same. Which zone each chunk is in lives in `ZONE_MAP` (`core.js`).
- **GLB prop (art pack models):** drop `name.glb` in `assets/props/` and list it in `assets/props/props.json`: `{"oak_tree":{"file":"oak_tree.glb","scale":1,"y":0,"rotateY":0}}` (model faces +Z, feet at y=0, under ~5k triangles). In a builder, use `prop('oak_tree', () => blockBuiltFallback())`: it returns a cheap copy of the model, or the fallback if the model isn't there. The world waits for listed models to load before it builds. A model used as one part (`P(prop('oak_tree'),5)`) shatters into chunks colored like its first material.
- **Smashable object:** add to `OBJ` using `makeObj(x,z,radius,height,points,build)`. In `build`, register parts with `P(mesh, chunks, whole, half)` — `whole:true` flies off intact, otherwise it shatters into `chunks` boxes. Add it to `SPAWN_W` to respawn. Give it a size class with opts `{size:'micro'|'mini'|'tiny'|'small'|'medium'|'large'|'huge'|'mega'}` (each size is ~1.65× the last; a `small` thing is about the size of a car at scale 0.2, a cone is `small`… see `TYPE_SIZE` in game.js: cone = small, house = huge). Players can only smash things at or below their size; bigger things get a red ring and boing them back; things 3+ sizes below get squished without counting. Any `OBJ` type can also be built shrunk or grown: `OBJ.cone(x,z,arg,scale)`.
- **Size-matched props:** define `const ZONE_PROPS={town:{mini:['flower',…],tiny:[…],small:[…],…},farm:{…},park:{…},home:{…}}` in `objects.js` (OBJ type names per zone per size). Logic keeps the area around the cars stocked from it: mostly the players' size, some a size or two bigger, a few smaller. Missing entries fall back to today's props shrunk or grown.
- **Building (staged destruction):** make it with `makeObj(x,z,r,h,points,build,{building:true,size:'huge'})` and tag every part with `BP(mesh, floor, kind)` (from `core.js`): `P(BP(mk(...), 0, 'wall'), 3)`.
  - `floor`: 0 = ground floor, counting up. Put the roof on the floor above the top storey (or tag it `'roof'` on the top floor).
  - `kind`: `'wall'` holds up everything above it. Build each storey from **several** wall pieces (about 8–12, e.g. 3 per side) so they can be knocked out one at a time. `'slab'` is a floor or ceiling plate, `'roof'` is the roof, and `'extra'` covers windows, doors, signs and chimneys (usually `whole:true` so they pop off intact).
  - Storey heights come from the parts themselves, so no numbers are needed. Keep it under ~60 parts.
  - What happens: when fewer than half (`SUPPORT`) of a storey's walls are left, everything above it drops, tilts and pancakes storey by storey, then the stump crumbles. Way-smaller cars boing off, smaller cars chip 1–2 pieces, same-size cars plow through and bigger cars flatten it. Barrel blasts blow out nearby parts. Knocked-out parts are remembered per chunk.
  - Working example: `demoBuilding()` in `game.js`. Try `__sp.building(x,z,floors)` in the console.
- **Voice line:** call `say('Exact Text!')` in code and add the same text to `tools/voice-lines.json` (car names are picked up automatically). Then on the machine with the ElevenLabs key in `.env`, run `node --env-file=.env tools/make-voices.mjs` (`--dry` first to see what it will make and the character cost). It only generates new or changed lines. Lines without a clip use the browser's robot voice, so nothing breaks while a line is waiting for a recording.
- **Music:** tracks live in `tools/music-lines.json` (`title`, `drive`, `boss`, `victory`), made with `node --env-file=.env tools/make-music.mjs` (`--only=boss` to redo one). Code switches tracks with `music('boss')` or `music('victory',{loop:false,then:'drive'})`.
- **Sound effect:** add `id: {prompt, dur}` to `tools/sfx-lines.json` (ids like `crash_1`, `crash_2` are random variants of `crash`; the built-in `sfx.*` sounds use clips with the same names when they exist), run `node --env-file=.env tools/make-sfx.mjs`, and play it with `sfxClip('id')` (it returns false if the clip isn't there, so keep a synth fallback).
- **Animal:** define `const ANIMAL={chicken:{build(){…return group},fluff:'#ffffff'},…}` in `objects.js` to replace logic's placeholder looks (`ANIMAL_DEFAULT` in game.js). `build()` returns a `THREE.Group` facing +Z with its feet at y=0, real-ish size (chicken ~0.7 long, cow ~2.6); size class is worked out from its size. `fluff` is the puff color when launched. Kinds today: chick, chicken, duck, goose, bunny, cat, dog, pig, sheep, goat, cow, horse (each has a sound in `sfx-lines.json`; a new kind needs one too). Zone layouts place herds with `ctx.herd(kind,x,z,n)`; chunks without herds get a default mix from `ZONE_HERDS`.
- **Boss:** define `const BOSSES=[{id,name,emoji,sway,build(P,g){…}},…]` in `objects.js` to replace logic's placeholders (`BOSS_DEFAULT`: Clankzilla, Shelldozer, King Wobbles). A random one drops in each world once the players are GIANT. `build` works like a building: `P(BP(mesh,floor,kind),chunks,whole,half)` at 1x scale (about 11 tall, radius ~3.6; logic scales it ×`BOSS_SCALE`). Weak spots: `P(bossWeak(mesh,floor,phase),3)` with phase 1, 2, 3… (2 per phase works well), placed low (under ~3.5 at 1x) and on the outside. Add `Here comes <Name>!` to `tools/voice-lines.json`. Test with `__sp.boss('id')`.

## Testing
- Serve locally (`python3 -m http.server`) — the game (ES module boot) and models only load over http, not `file://`. `?q=phone` / `?q=high` forces a quality (also in the pause menu).
- Headless SwiftShader can't render the new shadows reliably; for visual checks run Chromium on the real GPU (`--use-angle=metal --enable-gpu` on a Mac).
- `window.__sp.mega()`, `__sp.explode(x,z)`, `__sp.addScore(n)`, `__sp.grow(n)` (1800 = GIANT), `__sp.newWorld()`, `__sp.tp(x,z)` and `__sp.stats()` in the console help with testing. Press N (or START) when giant for a new world.
- Keyboard: P1 WASD/Space/E/Q/R, P2 Arrows/Enter/RShift///. Esc / START / ⏸ pauses (the pause menu also shows what each controller button reports). (drive/turbo/jump/switch car/shoot; switch or shoot keys LEVEL UP when ready). `__sp.level(n)` jumps ahead n sizes. Check both players, a ramp jump, a barrel chain, and a MEGA SMASH before pushing.
