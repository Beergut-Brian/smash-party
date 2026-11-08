# 🍭 Candy Land: quest outline (Q3a)

The shared script for Candy Land. The **zone-candy** lane builds the places (sub-zones, `plan`, and every spot in `questAt`), **audio** casts and records the givers, **logic** adds the new ability and cosmetics, and the **quests** lane writes the pack (`src/world/quests/candy.js`, Q3) from this. Spec: `docs/ADVENTURE.md`; the Home pack (`src/world/quests/home.js`) is the worked example; Dino Land's outline (`docs/worlds/dino.md`) has the same shape.

Design rules as always: no reading (voice + picture bubble + gold arrow), nothing can fail, either player does any step, lines under ~8 words, goofy never scary, original characters only (no real candy brands or mascots).

## What's different from the Home World
- **You arrive with everything** (hammer, shoot, hover, glide, dozer, plus Stomp if you did Dino Land first), so quests use them from chapter 1: the chocolate river is hover country, the ice-cream mountain is glide country.
- **One new ability:** 🍭 **Sugar Rush** (chapter 2 main quest).
- **Rewards are mostly cosmetics and stars.** Main quests unlock the next chapter, as at home.
- **The finale is Sir Sprinkles** (`sirsprinkles`, the cake knight, already built), who crashes the birthday party from chapter 1. Gummo and Gumbo-Tron stay in the Arcade boss pool.

## The new ability: 🍭 Sugar Rush (`sugarrush`, for L42)
Hold turbo (A / RT) for about a second and the car **sugar-rushes**: it glows rainbow, goes about 1.5× turbo speed, leaves a candy-stripe trail of little bouncing sweets, and jumps off ramps much farther. Let go and it fizzles back with a giggle. No meter, no running out. Glyph: the A button (held) + a lollipop picture. Sound: a rising slide-whistle + fizz (`sugarrush`, NEEDS AUDIO). Always on in Arcade.

## Sub-zones (proposal for Z6; the zone lane decides the final ones)
| Zone id | Name | What it is | Chapters |
|---|---|---|---|
| `candy` | Cake Town | The existing zone: cupcake houses, gingerbread houses, the gumball machine. **Frosting Lane** (Baker Bun's bakery street) is the start; the **birthday cake plaza** is its big square | 1, 4 (boss) |
| `candy_forest` | Gumdrop Forest | Lollipop trees, candy-cane groves, gumdrop bushes, a donut shop clearing | 2 |
| `candy_river` | Chocolate River | A chocolate river (`water` kind `choco`, deep middle `choco_deep`), wafer bridges, marshmallow islands, a choco waterfall, a rock-candy quarry on the bank | 3 |
| `candy_mountain` | Ice-Cream Mountains | Scoop hills with sprinkle slopes and ramps, a cotton-candy cloud meadow, a cherry on the summit | 4 |

Suggested map (11×11): Cake Town in the middle-south (portal arrival), Gumdrop Forest wrapped round it, the chocolate river winding across the west and north, the ice-cream mountains along the east and north-east edge. The birthday cake plaza sits at Cake Town's far side, so the finale comes back home.

## Chapters
| Ch | Sizes | Where | Main (gold) | Sides (blue) |
|---|---|---|---|---|
| 1 | micro–mini | Frosting Lane | 🧁 Baker Bun: cherries for the birthday cake | 🍬 Minty's runaway gumballs · 🍪 Sergeant Snap's band march |
| 2 | tiny–small | Gumdrop Forest | 🍭 Lolly Lou: the gummy cubs → **Sugar Rush** | ☕ Cocoa's hot-chocolate run · 🍩 Officer Glaze's rolling donuts |
| 3 | medium–large | Chocolate River | ⚓ Captain Wafer: the lost life rings | 💎 Jawbreaker Jo's rock-candy quarry · 🥤 Fizzy's river hoops |
| 4 | huge–GIANT | Ice-Cream Mountains + Cake Town | 🎂 Baker Bun: "Sir Sprinkles wants the WHOLE cake!" (boss) | 🍨 Sundae's summit · ☁️ Puff's marshmallow sheep |

**Arrival size:** as in Dino Land, the pack assumes the portal drops you at micro, so chapter 1 exists (NEEDS LOGIC, L44).

## Quests

Each block: id · giver (emoji, name, look, voice for casting) · steps · reward · spots needed. Sample lines show the voice; the pack writes the full 10–15 per giver. Stage sizes are at the chapter's first size, in world units.

### Chapter 1: Frosting Lane (micro–mini)

**`bun_cherries`** (MAIN) 🧁 **Baker Bun**
- *Look:* a round, puffy cream bun on a little cake-delivery scooter, a tall white baker's hat, rosy cheeks, a whisk in a holder.
- *Voice:* jolly, puffy and warm, every sentence ends in a giggle.
- *Steps:* talk → **find** 2 cherries 🍒: one on the bakery street, one on top of a cupcake house (`lift:true`) → **smash** 3 gumdrop piles (`reveal:'cherry'`: the last one pops out the 3rd cherry) → **bring** all 3 to the birthday cake.
- *Lines:* "Party today! Hee hee!" · "My cherries rolled away!" · "One cherry! Hee!" · "Cherries on top! Perfect!"
- *Reward:* ⭐⭐ + 🍒 **cherry hat** cosmetic (`cherry`: a cherry with a stem on the roof).
- *Spots:* `giver` outside the bakery, right next to the start (r .8); `stage` Frosting Lane ~12×20; `cherries`: `street`, `roof` (a cupcake house); `piles` area for the 3 gumdrop piles.

**`minty_gumballs`** (side) 🍬 **Minty**
- *Look:* a peppermint-swirl race car with mint-candy wheels and a little wrapper spoiler.
- *Voice:* cool, breezy, chill surfer-cousin of a peppermint, says "fresh!".
- *Steps:* talk → **push** 5 runaway gumballs (`build()`, big shiny balls) back into the bowl under the gumball machine.
- *Lines:* "Whoa, gumballs everywhere!" · "Roll 'em back, buddy!" · "Fresh!" · "Super fresh. Thanks!"
- *Reward:* ⭐⭐ + 🔵 **gumball trail** cosmetic (`gumballs`: little gumballs bounce out behind the car).
- *Spots:* `giver` by the gumball machine (r .8); `stage` ~14×14; `goal` the bowl (r ~2).

**`snap_march`** (side) 🍪 **Sergeant Snap**
- *Look:* a gingerbread soldier on a cookie tricycle, icing buttons, a tall band hat with a gumdrop on top, a drum on the handlebars.
- *Voice:* crisp marching-band drill sergeant, but silly: "Left! Right! CRUNCH!"
- *Steps:* talk → **rings** 8 frosting arches round Cake Town while the march plays (`music:'parade'`, from L41).
- *Lines:* "Band, ready! March!" · "Through the arches!" · "Left! Right! CRUNCH!" · "Best parade! At ease!"
- *Reward:* ⭐⭐ + 💂 **band hat** cosmetic (`bandhat`).
- *Spots:* `giver` at the end of Frosting Lane (r .8); `stage` ~30×30; `rings` 8 points.

### Chapter 2: Gumdrop Forest (tiny–small)

**`lolly_cubs`** (MAIN) 🍭 **Lolly Lou**
- *Look:* a little go-kart with a giant swirly lollipop for a head, pigtails made of licorice, a sugar-sparkle sticker on the side.
- *Voice:* sugar-crazy cheerleader, squeals "WHEEE!", cheers every little thing.
- *Steps:* talk → **catch** 10 gummy bear cubs (kind `gummybear` from A5, `bunny` until then) bouncing round the forest clearing.
- *Lines:* "The gummy cubs got out!" · "Catch them! WHEEE!" · "Gotcha, gummy!" · "You're FAST! Want to be FASTER?"
- *Reward:* 🍭 **Sugar Rush** ability + ⭐⭐⭐. Ceremony line: "Hold turbo! SUGAR RUSH!"
- *Spots:* `giver` at the forest edge, the arrow's first stop out of Cake Town (r 1.5); `stage` the clearing ~40×40.

**`cocoa_cups`** (side) ☕ **Cocoa**
- *Look:* a hot-chocolate truck shaped like a mug, a marshmallow on the roof for a lid, steam swirls, cozy sleepy eyes.
- *Voice:* cozy and sleepy, big yawns, talks like it's bedtime.
- *Steps:* talk → **deliver** 5 cups of cocoa ☕ to the gingerbread houses in the forest (glowing doorsteps).
- *Lines:* "Mmm, cocoa time..." · "Bring cups to the houses." · "Warm and cozy!" · "*Yawn* ...all done. Thanks."
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` on the forest road (r 1.5); `stage` ~70×50; `drops` 5 gingerbread doorsteps.

**`glaze_donuts`** (side) 🍩 **Officer Glaze**
- *Look:* a donut-shaped police car with pink frosting and sprinkles, a sprinkle siren on the roof, a badge.
- *Voice:* deep, slow, very serious cop who keeps getting distracted by snacks ("Hmm. Suspicious. ...Delicious.").
- *Steps:* talk → **push** 6 giant rolling donuts (`build()`, they roll on their edge) back into the donut shop lot.
- *Lines:* "Runaway donuts. Serious business." · "Roll them back to the shop." · "Good work, deputy." · "Case closed. Snack time."
- *Reward:* ⭐⭐ + 🚨 **siren** engine cosmetic (`siren`: turbo plays a goofy woo-woo, like the kazoo).
- *Spots:* `giver` at the donut shop (r 1.5); `stage` ~40×40; `goal` the shop lot (r ~6).

### Chapter 3: Chocolate River (medium–large)

**`wafer_rings`** (MAIN) ⚓ **Captain Wafer**
- *Look:* a wafer-cookie riverboat with a paddle wheel, a captain's hat, a big white beard of whipped cream.
- *Voice:* jolly old sailor, "Ahoy!", "Sweet seas!"
- *Steps:* talk → **find** 4 marshmallow life rings 🛟: one floating on the river (deep spots with a find item count as wading), one under the wafer bridge, one on a marshmallow island (hover or glide over), one at the top of the choco waterfall (`y`) → **bring** them to the dock.
- *Lines:* "Ahoy! My life rings floated off!" · "Four rings, matey!" · "Ha! One more!" · "Sweet seas! Thank ye!"
- *Reward:* ⭐⭐⭐⭐.
- *Spots:* `giver` on the dock (r 3); `stage` ~80×60 along the river; `rings_at` 4 points: `river`, `bridge`, `island`, `falls` (+ its height).

**`jo_quarry`** (side) 💎 **Jawbreaker Jo**
- *Look:* a round, stubborn rock-candy truck with a striped jawbreaker cab, big square teeth in the grille, a pickaxe.
- *Voice:* gravelly, giggly granny who LOVES crunching things, "Crunch it, dearie!"
- *Steps:* talk → **smash** 50 rock-candy crystals in the quarry (a new zone-candy prop, e.g. `candy_rockcandy`; `candy_gumdrop` / `candy_mint` until it exists).
- *Lines:* "Ooh, a quarry full of crunch!" · "Crunch it all, dearie!" · "Crunchy! Hee hee!" · "Best crunch of my life."
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` at the quarry gate (r 3); `stage` ~60×50 on the riverbank.

**`fizzy_hoops`** (side) 🥤 **Fizzy**
- *Look:* a soda-bottle jet-ski with a bendy straw for a mast and bubbles popping out of the back.
- *Voice:* bubbly and bouncy, burps mid-sentence and says "'scuse me!"
- *Steps:* talk → **rings** 8 hoops over the chocolate river and down past the waterfall (hover, glide or Sugar Rush off the bank ramps).
- *Lines:* "Hoop race on the river!" · "Fly through the hoops! *Burp*" · "'Scuse me! Nice one!" · "Fizztastic!"
- *Reward:* ⭐⭐⭐ + 🫧 **burp horn** cosmetic (`burp`: turbo starts with a big fizzy burp).
- *Spots:* `giver` on the riverbank (r 3); `stage` ~140×80; `rings` 8 points, most over the river; a couple of bank ramps in the layout.

### Chapter 4: Ice-Cream Mountains + Cake Town (huge–GIANT)

**`bun_sprinkles`** (MAIN) 🎂 **Baker Bun** again
- *Steps:* talk → **boss** `sirsprinkles` at the birthday cake plaza.
- *Lines:* "Sir Sprinkles wants the WHOLE cake!" · "Save the party!" · "Smash his frosting!" · "Party saved! Cake for everyone!"
- *Reward:* ⭐⭐⭐⭐ + the land's portal moment (L33).
- *Spots:* `giver` at the plaza edge (r 6); `stage` the plaza ~140×100.

**`sundae_summit`** (side) 🍨 **Sundae the Snowplow**
- *Look:* an ice-cream-scoop snowplow with a waffle-cone plow blade, a scarf, chattering teeth.
- *Voice:* shivery, teeth chattering ("B-b-brr!"), but brave and excited.
- *Steps:* talk → **reach** the cherry on top of Ice-Cream Mountain (`y` high; take the sprinkle-slope ramps with Sugar Rush, then glide or hover).
- *Lines:* "B-b-brr! Climb the mountain!" · "Get the cherry on top!" · "Higher! B-b-brave!" · "You did it! W-w-wow!"
- *Reward:* ⭐⭐⭐ + 🌈 **rainbow trail** cosmetic (`rainbow`).
- *Spots:* `giver` at the foot of the mountain (r 6); `stage` the mountain ~120×120; `summit` [x,z] + height.

**`puff_sheep`** (side) ☁️ **Puff**
- *Look:* a cotton-candy cloud bus, pink and blue fluff all over, dreamy half-shut eyes.
- *Voice:* dreamy, whispery, floaty, everything is "sooo fluffy".
- *Steps:* talk → **catch** 12 marshmallow sheep (kind `marshmallow_sheep` from A5, `sheep` until then) on the cloud meadow.
- *Lines:* "My marshmallow sheep floated off..." · "Catch them, gently..." · "Sooo fluffy..." · "All home. Sweet dreams..."
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` on the cloud meadow (r 6); `stage` ~120×80.

## Where it is (Z6, built)
`CANDY_QUEST_AT` in `src/world/zones/candy_land.js` (the land's `questAt`, so `worldQuestAt(id,k)` works in Candy Land) has every spot below. Notes for the pack:
- Map: Frosting Lane (start, x −160, z 290–360) · Gumdrop Forest west (ch2, x −290…−330, z 130–330) · the river hub east of the plaza (ch3, x 0–120, z −120…20) · the cake plaza (x −80, z −140) · the mountains north (ch4, z < −200).
- `bun_cherries`: `cake` is the party cake next to Bun (a `bring` goes back to the giver, who stands beside it); `cherries.roof` is a cupcake house (use `lift:true`); `piles` are 3 painted patches for the `smash` step.
- `minty_gumballs` / `glaze_donuts`: `goal` + `goalR` (world units at the chapter's first size).
- `wafer_rings`: `rings_at.falls` is on top of the Chocolate Falls, `fallsY` = 15.5 world units high; a `find` item's `y` is at car scale 1, so use about `fallsY / car scale` (≈28 at medium). The island is a dry `mallow_isle` spot in the deep middle.
- `sundae_summit`: `summit` is the top of the long slope beside the volcano, `summitY` = 10 (world units, like a `reach` step's `y`).
- `fizzy_hoops`: `rings` are 8 points down the river, two of them past the Falls; `ramps` are the two bank jumps.
- The sub-zone ids are `candy`, `candy_forest`, `candy_river`, `candy_peaks` (not `candy_mountain`).

## Spot checklist for the zone lane (`questAt`)
Same shape as `HOME_QUEST_AT`: `{giver:[x,z], r, stage:[x,z,w,d], …point lists}`. The layouts mark each stage as a `quest_<id>` spot and keep each giver spot clear.

| Quest | Sub-zone | giver r | stage w×d | Point lists |
|---|---|---|---|---|
| `bun_cherries` | candy (Frosting Lane) | .8 | 12×20 | `cherries`: `street`, `roof`; `piles` area |
| `minty_gumballs` | candy | .8 | 14×14 | `goal` (+ `r`) |
| `snap_march` | candy | .8 | 30×30 | `rings`×8 |
| `lolly_cubs` | candy_forest | 1.5 | 40×40 | (none) |
| `cocoa_cups` | candy_forest | 1.5 | 70×50 | `drops`×5 |
| `glaze_donuts` | candy_forest | 1.5 | 40×40 | `goal` (+ `r`) |
| `wafer_rings` | candy_river | 3 | 80×60 | `rings_at`: `river`, `bridge`, `island`, `falls` (+ height) |
| `jo_quarry` | candy_river | 3 | 60×50 | (none) |
| `fizzy_hoops` | candy_river | 3 | 140×80 | `rings`×8 |
| `bun_sprinkles` | candy (cake plaza) | 6 | 140×100 | (none) |
| `sundae_summit` | candy_mountain | 6 | 120×120 | `summit` (+ height) |
| `puff_sheep` | candy_mountain (cloud meadow) | 6 | 120×80 | (none) |

Scenery the layouts should build (no quest `stage` scenes, like Q1b): the bakery and the birthday cake on Frosting Lane, the gumball machine bowl, the forest clearing, gingerbread doorsteps, the donut shop lot, the dock, wafer bridge, a marshmallow island and the waterfall, the quarry, bank ramps, the cake plaza, the mountain with ramps and a summit cherry, the cloud meadow.

## How the pack reads the spots (Q3, for Z6 part 2)
`src/world/quests/candy.js` reads `registerWorld({id:'candy', questAt})` (candy_land.js) once when it loads, key by key, and falls back to its own numbers (`QUEST_CANDY_AT`, read off `CANDY_LAND_PLAN`) for anything missing, so you can fill quests one at a time. Rules of thumb from the engine:
- **Push quests (`minty_gumballs`, `glaze_donuts`):** the goal circle sits at the **stage center**, and a `quest_<id>` spot (if the layout marks one) wins over `stage`. So center the `quest_<id>` spot (or `stage`) on the **bowl / shop lot**, or give the pack a `goal:[x,z]`. The pushables start in a ring ~3 (gumballs) / ~8 (donuts) units round it.
- **Point lists:** `cherries:{street,roof}` and optional `piles` (Bun), `rings` (Snap, Fizzy), `drops` (Cocoa), `goal` (Minty, Glaze), `rings_at:{river,bridge,island,falls}` (Wafer), optional `crystals` (Jo), `summit:[x,z,h]` or `summit` + `summitH` (Sundae). Anything left out is spread over the stage.
- **`lift` items** (Bun's roof cherry, Wafer's rings, Sundae's cherry) sit on top of whatever prop is at the point: put it right on the cupcake house / falls / summit prop. With no prop there Sundae's cherry floats at `summitH` (default 3, in car-scale-1 units): **keep it at 3 or less**, since at huge a jump only reaches ~2.4 (2.6 with hover).
- The quarry uses `candy_crystal` (and some `candy_rock`) for its 50 rock-candy crystals, so no new prop is needed.
- Sub-zone ids in the pack's comments follow Z6: the mountains are `candy_peaks`.

## Hand-offs
- **Quest items (quests lane, in the pack):** `cherry`, `cocoa`, `lifering` (`QUEST_ITEMS`), push builds for the gumballs and the donuts.
- **Logic (L42, L44):** the `sugarrush` ability; cosmetics `cherry`, `gumballs`, `bandhat`, `siren`, `burp`, `rainbow`; arrival size. Any cosmetic that doesn't make it: the quest gives ⭐⭐ instead.
- **Cars-ui (D22):** `buildCarPart` for `cherry`, `bandhat`, and a rainbow glow for `sugarrush`.
- **Zone-candy (Z6):** the rock-candy crystal prop for Jo's quarry.
- **Animals (A5):** `gummybear` (Lolly Lou), `marshmallow_sheep` (Puff).
- **Audio (AU14):** cast 11 givers (Bun, Minty, Snap, Lolly Lou, Cocoa, Glaze, Wafer, Jo, Fizzy, Sundae, Puff) after Q3 writes the lines; `sugarrush` sound; `siren` and `burp` engine clips.
