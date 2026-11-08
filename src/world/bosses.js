/* Smash Party — WORLD: BOSSES. Owner: world-bosses session (Claude Code design). Loads after objects.js.
   Fill BOSSES to replace logic's placeholders (BOSS_DEFAULT in game.js: Clankzilla, Shelldozer, King Wobbles).
   Leave it empty and the placeholders are used. Each entry: {id, name, emoji, sway, build(P,g){…}}. Build like a
   building at 1x scale (~11 tall, radius ~3.6): P(BP(mesh,floor,kind),chunks,whole,half). Weak spots:
   P(bossWeak(mesh,floor,phase),3) with phases 1,2,3… (2 per phase), low (<3.5 at 1x) and on the outside.
   Chunky, funny, never scary. Put boss models in assets/props/bosses/. Test with __sp.boss('id'). */
const BOSSES=[
];
