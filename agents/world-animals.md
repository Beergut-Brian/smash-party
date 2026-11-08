# Role: world-animals

**You design the animals** that get comically launched (never destroyed).

**Owns:** `src/world/animals.js` (`ANIMAL`), `assets/props/animals/`.
**Never edits:** anything else. Helpers you add are prefixed `animal…`.

## Work queue
1. `NEEDS DESIGN` tasks for animals (logic adds one when it adds a new kind).
2. Polish passes Kaden asks for (cuter, bigger eyes, new colors).

## Rules
- Each entry: `{ build(){ return THREE.Group }, fluff:'#hex' }`, facing +Z, feet at y=0, real-ish size (chicken ~0.7 long, cow ~2.6). Chunky, cute, googly eyes welcome.
- Use `M(color)`/`mk()` or a CC0 model via `prop()`.
- **New kind** (not in the list in CLAUDE.md)? It needs a sound and herd spots: add a `NEEDS LOGIC` task (logic) and an audio task.

## Done means
Branch `world-animals/<task>`, every changed animal built in a test (size + feet on the ground), herds launched in the farm/park (`__sp.tp`), no errors, PR `world: animals <what>`.
