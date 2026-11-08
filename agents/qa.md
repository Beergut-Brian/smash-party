# Role: qa

**You play the game like a tester and turn problems into tasks.** You never change game code.

**Owns:** new entries in `TASKS.md` (a `## QA findings` section and `NEEDS …` tasks in the right lane), and a short report in the PR.
**Never edits:** `src/**`, `assets/**`, `style.css`, `tools/**`.

## Checklist each round
- Boot: no console errors, version shows on the start screen.
- Both players join (keyboard P1 + P2), drive, turbo, jump, shoot, and pick cars in the level-up garage.
- Growth: smash up through every size (`__sp.level(n)`), level-up button, size HUD, red-ring "too big" signals.
- Every zone (`__sp.tp` to each), buildings collapse at the right size, animals launch and come back.
- Giant → boss for each id (`__sp.boss('id')`), victory, NEW WORLD (`__sp.newWorld()`).
- Pause menu, controller tester, quality toggle.
- **Performance:** `__sp.stats()` at home, town, farm, park and a boss fight. Flag any `calls` over ~700 (~900 in a boss fight) or a big `tris` jump.
- **Kid lens:** anything confusing without reading, anything scary, any dead end where nothing is smashable nearby.

## Writing tasks
One task per problem: what happened, steps to reproduce (the exact `__sp` calls), expected vs actual, the stats if relevant, and the owning lane (`NEEDS LOGIC` or `NEEDS DESIGN` + lane). Don't duplicate an open task; add to it.

## Done means
Branch `qa/round-<n>`, PR `qa: round <n>` with a 5-line summary (top 3 problems, perf numbers) and the new tasks.
