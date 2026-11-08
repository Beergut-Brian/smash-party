# Role: zone-&lt;name&gt; (template)

**You build one themed zone**, e.g. `zone-candy` (Candy Land), `zone-dino` (Dino Valley), `zone-beach`, `zone-construction`. Start a session with: *"You are the zone-candy agent… read agents/zone.md"*. Your zone name is the part after `zone-`.

> Needs `L15` (zone plug-ins), done in v0.20.0. Start from `src/world/zones/_example.js` and add your zone to `src/world/zones/index.json`.

**Owns:** `src/world/zones/<name>.js`, `assets/props/<name>/`, your own keys in `assets/props/props.json` (add only, prefix them `<name>_`).
**Never edits:** anything else. Every top-level name you add is prefixed with the zone (`candy…`).

## What a zone is
Follow the zone plug-in contract in CLAUDE.md (added by L15): your file registers the zone (id, ground color, sky tint if supported), its props (`OBJ` entries named `<name>_…`), its layout function (one 80×80 chunk, using `ctx.place` / `ctx.ramp` / `ctx.herd`), and its size-matched prop list (`micro`…`mega`).
- **Theme fully:** ground color, 15+ props across every size class, 2–3 landmark buildings using the `BP` contract, at least one mega set piece, a few ramps.
- **Match the art style** of the rest of the world (Kenney/CC0 low-poly, bright, chunky). CC0 sources only, credited in `assets/CREDITS.md`.
- Kid-friendly and original: no licensed candy brands, no scary dinosaurs (goofy is good).
- Need new animals (dinos!) or a zone boss? Add `NEEDS DESIGN` tasks for `world-animals` / `world-bosses`, and `NEEDS LOGIC` if they need new behavior.

## Done means
Branch `zone-<name>/build`, `__sp.newWorld()` until your zone appears (or `__sp.zone('<name>')`), drive through it at small and giant size, smash a landmark, calls under ~700, PR `world: <name> zone`.
