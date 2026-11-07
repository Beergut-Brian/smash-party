# Smash Party — guide for AI collaborators

A co-op driving-and-smashing game for a dad and his 5-year-old, played on a TV with two controllers. Plain HTML + three.js (r128, global `THREE`), no build step. GitHub Pages serves `main` as-is.

## Design rules (do not break these)
- **Co-op only.** No losing, no timers that end the game, no player-vs-player scoring. Everything feeds one shared smash meter.
- **Kid-simple controls.** Stick = point where you want to go. A/RT = turbo, B = jump, X/Y = next car. Never require reading.
- **Big, loud, funny feedback.** Every action should have a sound, a puff, or a wobble.
- **Original designs only.** No real car brands, toy lines, logos, or licensed characters.
- Must run smoothly at 1080p on a GTX 1060 and stay playable on a phone (touch controls).

## Layout
- `index.html` — page shell, HUD, start screen.
- `style.css` — all UI styles.
- `src/game.js` — the whole game, in labeled sections (`/* ---------- name ---------- */`):
  renderer/scene · geometry helpers · world & ramps · audio · cars · model cars · smashable objects · debris & particles · smashing · respawn · celebration · players · input · collisions · camera & HUD · loop.
- `assets/cars/` — `.glb` car models plus `cars.json` manifest.
- `assets/textures/`, `assets/sounds/` — for future art and audio.

## Coordinate conventions
- Y is up. Forward for any car/object is **+Z** at `rotation.y = 0`; heading θ points along `(sin θ, cos θ)`.
- The camera looks from +Z toward −Z, so screen-up is world −Z.
- Arena spans ±70 (`ARENA`). Units ≈ meters; a car is ~4–5 long.

## Adding things
- **Block-built car:** write `buildX()` returning `{g, wheels, ex, h}` (see `buildMonster`) and add it to `CARS` with `name, emoji, speed (20–32), r (collision radius ~2–2.8)`.
- **Model car (for graphics models/tools):** drop `name.glb` in `assets/cars/` and add to `cars.json`:
  `{"name":"Comet Crusher","emoji":"☄️","file":"comet.glb","speed":27,"r":2.3,"scale":1,"y":0,"rotateY":0,"height":3,"exhaust":[0,1,-2.5]}`
  Model faces +Z, about 4–5 units long, under ~20k triangles. Meshes named `*wheel*` spin.
- **Smashable object:** add to `OBJ` using `makeObj(x,z,radius,height,points,build)`. In `build`, register parts with `P(mesh, chunks, whole, half)` — `whole:true` flies off intact, otherwise it shatters into `chunks` boxes. Add it to `SPAWN_W` to respawn.

## Testing
- Serve locally (`python3 -m http.server`) — model cars only load over http, not `file://`.
- `window.__sp.mega()`, `__sp.explode(x,z)`, `__sp.addScore(n)` in the console trigger events for testing.
- Keyboard: P1 WASD/Space/E/Q, P2 Arrows/Enter/RShift//. Check both players, a ramp jump, a barrel chain, and a MEGA SMASH before pushing.
