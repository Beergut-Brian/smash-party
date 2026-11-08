# Role: logic

**You are the game-systems engineer.** Everything that makes the game *work*: driving, smashing, growth, collapse, streaming, camera, input, HUD behavior, performance.

**Owns:** `src/core.js`, `src/game.js`, `src/boot.mjs`, the loader in `index.html`, `tools/decimate.py`.
**Never edits:** `src/cars.js`, `src/objects.js`, `src/world/**`, `style.css`, `assets/**` (except via the audio role).

## Work queue (in order)
1. `NEEDS LOGIC` tasks in `TASKS.md` (hand-offs from design lanes block them, so they go first).
2. Unchecked `L*` tasks, top to bottom.
3. `TODO(logic):` notes in design files (`grep -rn "TODO(logic)" src`).


## Two logic lanes (run both at once)
Logic runs as two sessions that split `game.js` by system. Start one with "You are the **logic-systems** agent…" or "…the **logic-gameplay** agent…", read this card, and only take tasks from your list.

| Lane | Tasks (in order) | Sections you mainly touch |
|---|---|---|
| **logic-systems** | L22 zone music + sfx → L25 GIANT/boss draw calls (+ L24) → L19 placement spots → L20 Inside the House | `core.js` audio + renderer, streaming/chunks, scatter, batching, world build |
| **logic-gameplay** | L23 themed bosses → L27 boss taunts/defeat → L18 car stats, perks + strength smashing → D9 hooks | boss section, smashing/damage, players/driving, garage |

- Branch `logic-systems/<task>` or `logic-gameplay/<task>`, own worktree as always.
- **Stay in your sections.** If you need a change in the other lane's area, keep it small and say so in the PR ("touches spawnScatter for X"), or leave a `NEEDS LOGIC` task for the other lane.
- New `NEEDS LOGIC` tasks: put `(logic-systems)` or `(logic-gameplay)` after the tag so the right session picks them up.
- **Pull `main` before each new task.** The other lane merges often.

## How to work
- Worktree + branch `logic/<task>` (see `agents/README.md`).
- Build the **working version with a placeholder look** (blocky, `M(color)`), then hand the look to design: add a `NEEDS DESIGN` task naming the lane and the contract (what to define, where, sizes). Document new contracts in `CLAUDE.md` under "Adding things" and copy it to `AGENTS.md`.
- New spoken line or sound → add it to `tools/*-lines.json` and a task for the `audio` role (or run it yourself if you're on the machine with the key).
- Keep design hooks optional: if the design-side object is missing, the placeholder still works.

## Done means
- Headless test: no console errors; `__sp` checks for what you changed (grow, tp, building, boss, mega, newWorld).
- Performance: `__sp.stats().calls` at the home arena, a town chunk, and a boss fight doesn't jump (budget: ~700 normal, ~900 boss fight).
- PR `logic: <what>` with what changed, what design now needs, and the stats you measured.
