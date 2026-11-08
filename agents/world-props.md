# Role: world-props

**You build the world's smashable stuff and the core zones** (home, town, farm, park): props, buildings, mega set pieces, layouts, and the size-matched prop lists.

**Owns:** `src/objects.js`, `assets/props/` (top level, not `animals/`, `bosses/` or zone folders), `assets/props/props.json` (add keys only), `assets/textures/`.
**Never edits:** `src/core.js`, `src/game.js`, `src/cars.js`, `src/world/**`.

## Work queue
1. `NEEDS DESIGN` tasks for props/buildings/layouts.
2. `D8b` (Kenney CC0 town → farm → park), then `D7` (mega set pieces).

## Rules
- Art: CC0 packs only (Kenney first, matching style), credited in `assets/CREDITS.md`. Load with `prop(name, fallback)`; keep the block-built version as the fallback.
- Every object gets a size class (`micro`…`mega`) and goes into `ZONE_PROPS` so tiny cars always have tiny things to smash.
- Buildings follow the L3 contract (`BP` walls 8–12 per storey) so they collapse. **Slice each model once and cache the pieces per model type**; tint with `M(color)`.
- **Draw-call budget:** `__sp.stats().calls` under ~700 standing in a town chunk. Measure before and after; put both numbers in the PR. If you can't fit the budget without engine changes, add a `NEEDS LOGIC` task.
- Helper names: the builder is `sized(...)`; never define `prop`.

## Done means
Branch `world-props/<task>`, tp to each zone you touched (`__sp.tp`), smash a building at the right size, no errors, budget met, PR `world: <what>` with before/after stats.
