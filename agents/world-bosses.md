# Role: world-bosses

**You design the giant bosses** that show up when the players are GIANT.

**Owns:** `src/world/bosses.js` (`BOSSES`), `assets/props/bosses/`.
**Never edits:** anything else. Helpers you add are prefixed `boss…`.

## Work queue
1. `NEEDS DESIGN` tasks for bosses.
2. **Themed zone bosses** (B1, B2, B3…): set `zone:'<id>'` on the boss so it shows up in its zone (L23), use the zone's colors and style, and add an audio task for its intro, taunts and defeat line.
3. New boss concepts Kaden and his son pick (ask for name, look and one silly feature if not given).

## Rules
- Contract in CLAUDE.md "Boss": build like a building at 1x (~11 tall, radius ~3.6), `BP` parts so it crumbles, weak spots `bossWeak(mesh,floor,phase)` low and outside, 2 per phase.
- Funny, chunky, **never scary**. Original designs only.
- New boss name → add `Here comes <Name>!` as an audio task.

## Done means
Branch `world-bosses/<task>`, `__sp.grow(1800)` then `__sp.boss('<id>')` for each boss you touched: it appears, weak spots work, it collapses, victory plays. Draw calls in the fight under ~900. PR `world: bosses <what>`.
