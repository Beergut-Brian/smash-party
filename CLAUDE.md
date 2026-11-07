# Smash Party — guide for AI collaborators

A co-op driving-and-smashing game for a dad and his 5-year-old, played on a TV with two controllers. Plain HTML + three.js (r128, global `THREE`), no build step, no frameworks. GitHub Pages serves `main` as-is.

## Design rules (do not break these)
- **Co-op only.** No losing, no timers that end the game, no player-vs-player scoring. Everything feeds one shared smash meter.
- **Kid-simple controls.** Stick = point where you want to go. A/RT = turbo, B = jump, X/Y = next car. Never require reading.
- **Big, loud, funny feedback.** Every action should have a sound, a puff, or a wobble.
- **Original designs only.** No real car brands, toy lines, logos, or licensed characters.
- Must run smoothly at 1080p on a GTX 1060 and stay playable on a phone (touch controls).

## Layout & who owns what
Two tools work on this repo at the same time. Stay in your lane to avoid merge conflicts.

| File | Owner | What's in it |
|---|---|---|
| `src/cars.js` | **Cursor** (design) | Block-built car models + the `CARS` list, model-car loader |
| `src/objects.js` | **Cursor** (design) | Smashable objects (`OBJ`), arena layout (`buildWorld`), respawn mix (`SPAWN_W`) |
| `style.css` | **Cursor** (design) | All UI styles |
| `assets/**` | **Cursor** (design) | `.glb` models, `cars.json`, textures, sounds |
| `src/core.js` | **Claude Code** (logic) | Helpers (`mk`, `M`, `E`, `rand`…), renderer, scene, ground/roads/walls, ramps + `groundH`, audio |
| `src/game.js` | **Claude Code** (logic) | Debris, smashing, scoring, respawn, celebration, players/driving, input, collisions, camera, HUD, main loop |
| `index.html`, `CLAUDE.md` | Shared | Change rarely; mention it in the commit message |

Scripts are plain (no modules) and load in order: `core.js` → `cars.js` → `objects.js` → `game.js`. Top-level `const`/`function` names are shared across files, so never reuse a name.

If a design change needs new logic (or the other way around), make the part in your own file and leave a `// TODO(logic):` or `// TODO(design):` note for the other tool instead of editing their file.

## Tasks
Check `TASKS.md` before starting. Take the top unchecked task in your section, check it off in the same commit as the work, and add follow-up tasks for the other tool when needed.

## Git workflow
- **Pull before you start. Commit small. Push when done.** Never force-push `main`.
- `main` is live on the TV (GitHub Pages: https://beergut-brian.github.io/smash-party/), so only push working code. Use a branch for big experiments.
- Commit messages start with the area: `cars: add Comet Crusher`, `logic: bigger barrel explosions`.

## Coordinate conventions
- Y is up. Forward for any car/object is **+Z** at `rotation.y = 0`; heading θ points along `(sin θ, cos θ)`.
- The camera looks from +Z toward −Z, so screen-up is world −Z.
- The world spans ±440 (`ARENA`) as an 11×11 grid of 80×80 chunks (`CHUNK`); chunk (0,0) is centered on the origin. The original hand-built arena (`buildWorld`) fills the middle, ±72 (`HOME`). Roads run every 160 units. Units ≈ meters; a car is ~4–5 long.
- Only chunks near the players are built. Far objects sleep as instanced meshes and wake into real meshes near a car. Smashed things are remembered per chunk and regrow after a couple of minutes.

## Adding things
- **Block-built car:** write `buildX()` returning `{g, wheels, ex, h}` (see `buildMonster`) and add it to `CARS` with `name, emoji, speed (20–32), r (collision radius ~2–2.8)`.
- **Model car (for graphics models/tools):** drop `name.glb` in `assets/cars/` and add to `cars.json`:
  `{"name":"Comet Crusher","emoji":"☄️","file":"comet.glb","speed":27,"r":2.3,"scale":1,"y":0,"rotateY":0,"height":3,"exhaust":[0,1,-2.5]}`
  Model faces +Z, about 4–5 units long, under ~20k triangles. Meshes named `*wheel*` spin.
- **Zone layout:** define `const ZONE_LAYOUT={town(ctx){…},farm(ctx){…},park(ctx){…},home(ctx){…}}` in `objects.js`. Each function fills one 80×80 chunk. `ctx` has `zone, ci, cj, x0, z0, x1, z1, cx, cz, size` plus `place(type,x,z,arg,r)`, `ramp(x,z,th,L,W,H)` and `free(x,z,r)`. `place` and `ramp` return false (and do nothing) if the spot is off the chunk, on a road, on a ramp or overlapping. `Math.random`/`rand`/`pick` are seeded while a layout runs, so the same chunk always comes out the same. Which zone each chunk is in lives in `ZONE_MAP` (`core.js`).
- **Smashable object:** add to `OBJ` using `makeObj(x,z,radius,height,points,build)`. In `build`, register parts with `P(mesh, chunks, whole, half)` — `whole:true` flies off intact, otherwise it shatters into `chunks` boxes. Add it to `SPAWN_W` to respawn.

## Testing
- Serve locally (`python3 -m http.server`) — model cars only load over http, not `file://`.
- `window.__sp.mega()`, `__sp.explode(x,z)`, `__sp.addScore(n)` in the console trigger events for testing.
- Keyboard: P1 WASD/Space/E/Q, P2 Arrows/Enter/RShift//. Check both players, a ramp jump, a barrel chain, and a MEGA SMASH before pushing.
