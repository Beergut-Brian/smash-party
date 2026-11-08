# 🦖 Dino Land: quest outline (Q2a)

The shared script for Dino Land. The **zone-dino** lane builds the places (sub-zones, `plan`, and every spot in `questAt`), **audio** casts and records the givers, **logic** adds the new ability and cosmetics, and the **quests** lane writes the pack (`src/world/quests/dino.js`, Q2) from this. Spec: `docs/ADVENTURE.md`; the Home pack (`src/world/quests/home.js`) is the worked example.

Design rules as always: no reading (voice + picture bubble + gold arrow), nothing can fail, either player does any step, lines under ~8 words, goofy never scary, original characters only.

## What's different from the Home World
- **You arrive with everything.** Hammer, shoot, hover, glide and dozer carry over, so quests here can lean on them from chapter 1: tar pits you hover over, ledges you glide to, stuff you shoot down. Nothing has to be locked.
- **One new ability:** 🦖 **Stomp** (chapter 2 main quest).
- **Rewards are mostly cosmetics and stars.** Main quests also unlock the next chapter, as at home.
- **The finale is Rexy Rumbleton** (`rexy`, already built). Lava Larry and Mama Stego stay in the Arcade boss pool.

## The new ability: 🦖 Stomp (`stomp`, for L42)
Land a jump (B) and the ground goes **BOOM**: a dusty shockwave ring knocks over, launches or chips everything around the car, about 3 car lengths across, more after a high jump or a hover. Animals bounce up and land fine. It works on anything you could smash anyway (same size rules), so it's one big satisfying hit, not a way past the size rules. Glyph: `b.btnB` + a footprint picture. Sound: a deep thump plus a dino roar (`stomp`, NEEDS AUDIO). Always on in Arcade.

## Sub-zones (proposal for Z5; the zone lane decides the final ones)
| Zone id | Name | What it is | Chapters |
|---|---|---|---|
| `dino` | Jungle Valley | The existing zone: ferns, palms, stone huts. **Pebble Village** (huts round a little square) is the start. | 1 |
| `dino_nest` | Nest Hills | Grassy rolling hills, giant nests, speckled eggs, a fruit tree, a bowling-pit hollow | 2 |
| `dino_swamp` | Tar-Pit Swamp | Bubbling tar pools (`water_deep`-like kind `tar`, + `water` lily shallows), logs, reeds, a trike corral at its dry edge | 3 |
| `dino_dig` | Fossil Dig | A sandy dig pit with ramps, bones, ribcages, tents and a big skeleton display stand | 3 |
| `dino_volcano` | Volcano Peak | The smiling volcano, lava rocks, warm ash ground, the boss arena; long-neck meadow on its slopes | 4 |

Suggested map (11×11, like `HOME_PLAN`): Pebble Village in the middle-south where the portal drops you, Nest Hills ringed around it, swamp to the west, the dig to the east, the volcano across the whole north edge. Each chapter's places are a short drive further out, like the Home World.

## Chapters
| Ch | Sizes | Where | Main (gold) | Sides (blue) |
|---|---|---|---|---|
| 1 | micro–mini | Pebble Village | 🥚 Grandma Gertie: the runaway egg | 🪨 Rocky's log race · 🐣 Mo's runaway hatchlings |
| 2 | tiny–small | Nest Hills | 👟 Theo: the lost sneakers → **Stomp** | 🪺 Petra's worm delivery · 🎳 Rolly's boulder bowling |
| 3 | medium–large | Swamp + Fossil Dig | 🦴 Professor Digby: the Mega-Saurus bones | 🛶 Mossy's lily-pad hoops · 🤠 Ranger Rosa's trike round-up |
| 4 | huge–GIANT | Volcano Peak + everywhere | 🦖 Theo: "My brother Rexy is having a TANTRUM!" (boss) | 🔥 Cinder's lava rocks · 📸 Gertie's family photo |

**Arrival size (NEEDS LOGIC, L44):** chapter = car tier + 1, so if the portal drops you at size *tiny* (tier 1), chapter 1 is skipped. The pack assumes you arrive at the **smallest size (micro)**, so chapter 1 is the village at toy scale. If logic prefers arriving at tiny, chapter 1 merges into chapter 2 and these quests move up a chapter.

## Quests

Each block: id · giver (emoji, name, look, voice for casting) · steps · reward · spots needed. Sample lines show the voice; the pack writes the full 10–15 per giver. Sizes of stages are at the chapter's first size, in world units (the engine scales everything with the players).

### Chapter 1: Pebble Village (micro–mini)

**`gertie_egg`** (MAIN) 🥚 **Grandma Gertie**
- *Look:* an old, round brontosaurus in big knitting glasses and a flowery shawl, a ball of yarn on her back. Signature: the glasses on a long, droopy neck.
- *Voice:* slow, warm, forgetful granny; loses her thread mid-sentence ("Now where was I?").
- *Steps:* talk → **push** her speckled egg (a big rolling egg, `build()`) back down the village path into her nest → **find** 3 fluffy leaves 🍃 around the square → **bring** them to tuck the egg in. The egg wiggles and peeps.
- *Lines:* "Oh dear, my egg rolled away!" · "Roll it back to my nest!" · "Now three soft leaves, sweetie." · "Snug as a bug!"
- *Reward:* ⭐⭐ + 🦕 **dino tail** cosmetic (`dinotail`: a wagging tail on the back of the car).
- *Spots:* `giver` by her nest at the edge of the square, right next to the start (r .8); `stage` the square, ~10×10; `nest` (goal circle, r ~1.5) at the giver; `egg` start a few car lengths down the path; `leaves` 3 points round the square.

**`rocky_race`** (side) 🪨 **Rocky Roadster**
- *Look:* a stone-wheeled caveman car: a log body, round rock wheels, a bone hood ornament, one big bushy eyebrow.
- *Voice:* deep, dopey, cheerful; talks about himself in the third person ("Rocky go FAST!").
- *Steps:* talk → **rings** 8 hollow-log arches in a loop through the village.
- *Lines:* "Rocky love race!" · "Go through logs!" · "Whoa, you fast!" · "Rocky dizzy. Good dizzy."
- *Reward:* 🐾 **footprint trail** cosmetic (`footprints`: dino footprints stamp behind the car).
- *Spots:* `giver` at the village gate (r .8); `stage` the village, ~24×30; `rings` 8 points looping round the huts.

**`mo_hatchlings`** (side) 🐣 **Mo the Nest-Sitter**
- *Look:* a flustered orange triceratops in a striped apron, a baby bottle in a holder on the side.
- *Voice:* high, frazzled, talks in breathless bursts, counts everything.
- *Steps:* talk → **catch** 6 baby dinos (kind `babyrex` from A5, `chick` until then) that scamper round the nursery.
- *Lines:* "They hatched! They RAN!" · "Catch my babies!" · "That's one! Wait, two!" · "All six! Phew!"
- *Reward:* 🥚 **eggshell hat** cosmetic (`eggshell`: a cracked eggshell sitting on the roof).
- *Spots:* `giver` at the nursery fence (r .8); `stage` the nursery (a fenced patch of nests), ~10×10.

### Chapter 2: Nest Hills (tiny–small)

**`theo_sneakers`** (MAIN) 👟 **Thunderfoot Theo**
- *Look:* a little green T-rex in a red sweatband, tiny arms, big grin, and bare feet (his huge white sneakers are missing until the quest is done).
- *Voice:* young sporty kid, coach energy, "C'mon, team!", jokes about his tiny arms.
- *Steps:* talk → **find** 2 sneakers 👟: one sitting on top of the giant nest (`lift:true`: bump the nest to grab it), one floating above the hill ramp (`y`: jump, hover or glide to grab it) → **bring**.
- *Lines:* "My stompers are gone!" · "My arms can't reach!" · "One sneaker! One more!" · "Now watch this. STOMP!"
- *Reward:* 🦖 **Stomp** ability + ⭐⭐⭐. Ceremony line: "Jump and land! STOMP!"
- *Spots:* `giver` at the foot of the first hill, the arrow's first stop after the village (r 1.5); `stage` ~40×40; `sneakers` 2 points: `nest` (the giant nest), `ramp` (above the end of the hill ramp; the ramp itself belongs in the layout).

**`petra_worms`** (side) 🪺 **Petra Pteranodon**
- *Look:* a pteranodon pilot with leather goggles and a long red scarf, a mail bag full of wiggly worms.
- *Voice:* breezy aviator, crisp radio talk ("Roger that!", "Over!").
- *Steps:* talk → **deliver** 5 worm snacks 🪱 to 5 hungry nests across the hills (open beaks, peeping).
- *Lines:* "Babies are hungry, over!" · "Drop worms in the nests!" · "Delivery! Roger!" · "Mission complete! Over and out!"
- *Reward:* ⭐⭐ + 🦖 **roar engine** cosmetic (`roar`: turbo starts with a little dino roar, like the kazoo).
- *Spots:* `giver` on a hilltop (r 1.5); `stage` ~70×50; `drops` 5 nests spread over the hills.

**`rolly_bowling`** (side) 🎳 **Rolly the Ankylosaurus**
- *Look:* a chunky ankylosaurus in a bowling shirt, club tail shaped like a bowling ball.
- *Voice:* goofy and chuckly, "hyuk hyuk", loves the word STRIKE.
- *Steps:* talk → **push** 5 big round boulders (`build()`) down into the bowling hollow.
- *Lines:* "Wanna go bowling?" · "Roll rocks in the hole!" · "STRIKE! Hyuk hyuk!" · "Best bowler ever!"
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` at the hollow's edge (r 1.5); `stage` ~30×30; `goal` the hollow (r ~5); boulders start on the slope above it.

### Chapter 3: Tar-Pit Swamp + Fossil Dig (medium–large)

**`digby_bones`** (MAIN) 🦴 **Professor Digby**
- *Look:* a dusty explorer jeep in a pith helmet, a magnifying glass on the hood, a bushy white mustache, a shovel on the side.
- *Voice:* excited old professor, big words for little things ("Extraordinary!", "Jolly good!").
- *Steps:* talk → **find** 3 giant bones 🦴: one in the tar pit (find items in deep spots count as wading), one on top of the ribcage arch (`lift:true`), one on a high ledge (`y`: glide or hover) → **smash** 5 rock mounds in the dig (`reveal:'bone'`, the last one pops the 4th bone) → **bring** all 4 to the display stand. The skeleton clicks together and waves.
- *Lines:* "The Mega-Saurus is missing bones!" · "Four bones, my friend!" · "Extraordinary! A leg bone!" · "It's complete! Jolly good!"
- *Reward:* ⭐⭐⭐⭐.
- *Spots (dig + swamp edge):* `giver` at the display stand in the dig (r 3); `stage` the dig pit ~50×50; `pieces` `tar` (in the nearest tar pool), `ribcage` (the ribcage arch), `ledge` (a high spot with a ramp nearby); `mounds` area for the 5 rock mounds inside the stage.

**`mossy_hoops`** (side) 🛶 **Mossy the Swamp Boat**
- *Look:* a mossy airboat with a big fan on the back, sleepy frog-ish eyes, a cattail sticking out like a straw.
- *Voice:* slow, drawly, relaxed, hums between words.
- *Steps:* talk → **rings** 8 lily-pad hoops over the tar pools (hover skims the tar; the deep tar washes you back if you try to drive it, nothing fails).
- *Lines:* "Mmm... float with me..." · "Through the hoops, slow and easy." · "Ooh, nice." · "Best swamp day ever."
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` on the swamp dock (r 3); `stage` ~120×80 over the swamp; `rings` 8 points, most of them over tar.

**`rosa_trikes`** (side) 🤠 **Ranger Rosa**
- *Look:* a green park-ranger pickup with a wide-brim ranger hat and a whistle on a cord.
- *Voice:* brisk, bossy-but-kind, blows her whistle a lot.
- *Steps:* talk → **push** 8 triceratops (`kind:'trike'`, already built) into the corral.
- *Lines:* "*Tweet!* Trikes on the loose!" · "Push them in the corral!" · "Good herding!" · "All in! Ranger approved!"
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` at the corral gate (r 3); `stage` ~60×60 at the swamp's dry edge; `goal` the corral (r ~10, gate facing the stage).

### Chapter 4: Volcano Peak (huge–GIANT)

**`theo_rexy`** (MAIN) 🦖 **Thunderfoot Theo** again (now in his sneakers)
- *Steps:* talk → **boss** `rexy` (Rexy Rumbleton) at the foot of the volcano.
- *Lines:* "My big brother Rexy is GRUMPY!" · "He needs a nap!" · "Use your STOMP!" · "He's sleepy now. Thanks, team!"
- *Reward:* ⭐⭐⭐⭐ + the land's portal moment (L33: the Candy Land / home portals).
- *Spots:* `giver` near the volcano road (r 6); `stage` the boss arena ~140×100.

**`cinder_rocks`** (side) 🔥 **Cinder the Dimetrodon**
- *Look:* a red sail-backed dimetrodon in a sun hat and sunglasses, fanning herself with a palm leaf.
- *Voice:* hot and bothered, dramatic sighs ("Phew! It's TOASTY!").
- *Steps:* talk → **smash** 40 lava rocks (`dino_boulder` / `dino_rock`) the volcano spat out round her beach chair.
- *Lines:* "The volcano hiccupped rocks!" · "Smash them all, honey!" · "Ooh, that's cooler!" · "Ahh, a nice breeze!"
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` on the volcano slope (r 6); `stage` ~100×80.

**`gertie_photo`** (side) 📸 **Grandma Gertie** again
- *Steps:* talk → **catch** 10 long-necks (`kind:'bronto'`, already built) for the family photo → flash and a cheer.
- *Lines:* "Family photo time!" · "Round up the long-necks!" · "Say CHEESE!" · "Oh, I'll frame this one."
- *Reward:* ⭐⭐⭐.
- *Spots:* `giver` on the long-neck meadow (r 6); `stage` ~120×80.

## Spot checklist for the zone lane (`questAt`)
Same shape as `HOME_QUEST_AT`: `{giver:[x,z], r, stage:[x,z,w,d], …point lists}`. The layouts mark each stage as a `quest_<id>` spot and keep each giver spot clear.

| Quest | Sub-zone | giver r | stage w×d | Point lists |
|---|---|---|---|---|
| `gertie_egg` | dino (Pebble Village) | .8 | 10×10 | `nest`, `egg`, `leaves`×3 |
| `rocky_race` | dino | .8 | 24×30 | `rings`×8 |
| `mo_hatchlings` | dino | .8 | 10×10 | (none) |
| `theo_sneakers` | dino_nest | 1.5 | 40×40 | `sneakers`: `nest`, `ramp` |
| `petra_worms` | dino_nest | 1.5 | 70×50 | `drops`×5 |
| `rolly_bowling` | dino_nest | 1.5 | 30×30 | `goal` (+ `r`) |
| `digby_bones` | dino_dig + swamp edge | 3 | 50×50 | `pieces`: `tar`, `ribcage`, `ledge` |
| `mossy_hoops` | dino_swamp | 3 | 120×80 | `rings`×8 |
| `rosa_trikes` | dino_swamp | 3 | 60×60 | `goal` (+ `r`) |
| `theo_rexy` | dino_volcano | 6 | 140×100 | (none) |
| `cinder_rocks` | dino_volcano | 6 | 100×80 | (none) |
| `gertie_photo` | dino_volcano (meadow) | 6 | 120×80 | (none) |

Scenery the layouts should build (no quest `stage` scenes, like Q1b): Gertie's nest, the nursery fence, the giant nest + hill ramp, the bowling hollow, the dig pit with a display stand, ribcage arch and a ramped ledge, the swamp dock, the trike corral, Cinder's beach chair, the boss arena.

## Hand-offs
- **Quest items (quests lane, in the pack):** `leaf`, `sneaker`, `worm`, `bone` (`QUEST_ITEMS`), push builds for the egg and the boulders.
- **Logic (L42, L44):** the `stomp` ability; cosmetics `dinotail`, `footprints`, `eggshell`, `roar`; arrival size.
- **Cars-ui (D22):** `buildCarPart` for `stomp` (if it shows: dusty feet?), `dinotail`, `eggshell`.
- **Animals (A5):** `babyrex` (Mo). `trike` and `bronto` exist.
- **Audio (AU14):** cast 10 givers (Gertie, Rocky, Mo, Theo, Petra, Rolly, Digby, Mossy, Rosa, Cinder) after Q2 writes the lines; `stomp` sound; `roar` engine clip.
