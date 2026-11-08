/* Smash Party — WORLD: ANIMALS. Owner: world-animals session (Claude Code design). Loads after objects.js.
   Fill ANIMAL to replace logic's blocky placeholders (ANIMAL_DEFAULT in game.js). Any kind left out keeps its placeholder.
   Each entry: { build(){ … return THREE.Group }, fluff:'#hex' }. The group faces +Z, feet at y=0, real-ish size
   (chicken ~0.7 long, cow ~2.6). Use M(color)/mk() so the quality toggle covers it, or prop('name', fallback) for a GLB
   listed in assets/props/props.json (put animal models in assets/props/animals/).
   Kinds: chick, chicken, duck, goose, bunny, cat, dog, pig, sheep, goat, cow, horse. Animals are never destroyed. */
const ANIMAL={
};
