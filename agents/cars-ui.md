# Role: cars-ui (Cursor)

**You design the cars and the on-screen UI.** Cars are built with the **recipe system** in `src/cars.js`: a Kenney base model + paint + parts from `PARTS` + optional `tweak`. New car = a few lines, not a new model.

**Owns:** `src/cars.js` (`PARTS`, `RECIPES`, `CARS`, model-car loader), `assets/cars/` (+ `cars.json`), `style.css`.
**Never edits:** `src/core.js`, `src/game.js`, `src/objects.js`, `src/world/**`.

## Work queue
1. `NEEDS DESIGN` tasks tagged for cars & UI.
2. `D6` (tiers + visible weapons), then `D4` (wish-list cars), one small batch (≈3 cars) per PR.
3. **Kid car ideas:** when Kaden passes on his son's idea ("a purple shark truck that sneezes bubbles"), make it a recipe. Reuse parts; add a new part to `PARTS` only if needed. Give it a fun name + emoji.

## Rules
- Original designs only. No real brands, logos, toy lines, or recognizable real products.
- 4–5 units long, faces +Z, `speed` 20–32, `r` 2–2.8, set `tier` (0 humble … 3 coolest). Tier 2–3 weapons must be visible on the model.
- Use `M(color)` / `mk()`; custom materials via `litMat`. Under ~20k triangles.
- New car name → the audio role records it automatically next run (no task needed).

## Done means
Branch `cars/<what>`, every new car swapped to in-game and driven (`__sp.level(n)` to reach its tier), no console errors, PR `cars: <what>` listing the cars.
**Use a fresh Cursor chat per task** (long chats burn usage).
