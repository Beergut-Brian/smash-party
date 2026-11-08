# Smash Party agents

Start any session with one line:

> **You are the `<role>` agent for Smash Party. Read `agents/<role>.md` and go.**

The card tells the agent what it owns, what to work on, how to test, and how to hand off. Every card assumes `CLAUDE.md` (= `AGENTS.md`) and `TASKS.md` are read first.

| Role | Tool | Owns | Picks up |
|---|---|---|---|
| [`logic-systems`](logic.md) | Claude Code | `core.js`, `boot.mjs`, `worlds.js`, and `game.js` systems (audio, rendering, streaming, scatter, world, saving) | L31, L34, L37, L33 |
| [`logic-gameplay`](logic.md) | Claude Code | `quests.js` and `game.js` gameplay (bosses, smashing, players, garage, abilities) | L32, L35, L36 |
| [`audio`](audio.md) | Claude Code (on the Mac with the ElevenLabs key) | `tools/*-lines.json`, generated `assets/sounds/voice|sfx|music/` | New voice lines, car names, animal sounds, music |
| [`cars-ui`](cars-ui.md) | Cursor (moving to Claude Code) | `src/cars.js`, `assets/cars/`, `style.css` | `D4`, `D6`, car/UI `NEEDS DESIGN`, kid car ideas |
| [`world-props`](world-props.md) | Claude Code | `src/objects.js`, `assets/props/` (top level), `assets/textures/` | `D8b`, `D7`, town/farm/park/home, prop `NEEDS DESIGN` |
| [`world-animals`](world-animals.md) | Claude Code | `src/world/animals.js`, `assets/props/animals/` | Animal `NEEDS DESIGN` |
| [`world-bosses`](world-bosses.md) | Claude Code | `src/world/bosses.js`, `assets/props/bosses/` | Boss `NEEDS DESIGN` |
| [`zone`](zone.md) (template: `zone-candy`, `zone-dino`…) | Claude Code | `src/world/zones/<name>.js`, `assets/props/<name>/` | One themed zone each (needs L15 ✅) |
| [`quests`](quests.md) | Claude Code | `src/world/quests/<world>.js`, `assets/props/quests/` | `Q*` quest packs: characters, lines, steps (spec: `docs/ADVENTURE.md`) |
| [`qa`](qa.md) | Claude Code | `TASKS.md` entries only (no game code) | Play-test, perf, bug reports |
| [`reviewer`](reviewer.md) | Claude Code (or chat) | Merging to `main`, `version.json`, conflict fixes | Open PRs |
| [`art-pipeline`](art-pipeline.md) | Kaden's server agents | `art/*` PRs into `assets/` | `A*` tasks, kid drawings → 3D |

## Rules every role follows
1. **Own worktree, own branch.** `git fetch origin && git worktree add ../smash-party-<role> -b <role>/<task> origin/dev`, work only there, and open the PR into `dev` (`gh pr create --base dev`). `dev` is where features get tested together; `main` is the TV and only gets `dev` merged in once it plays well (plus urgent fixes). Never `git checkout` in the shared main folder.
2. **Only your files.** Anything else → a `NEEDS LOGIC` / `NEEDS DESIGN` task in `TASKS.md` for the right lane.
3. **One task, one PR.** Small PRs merge fast. Don't bump `version.json` (the reviewer does on merge).
4. **Test before the PR** with the `__sp` helpers; note `__sp.stats().calls` if you touched anything visual.
5. **Stop when your queue is empty.** Say so in one line; don't invent work outside your lane.
