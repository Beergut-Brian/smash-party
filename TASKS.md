# Smash Party: Task Board

Shared to-do list for both tools. **Pick the top unchecked task in your section**, follow its notes, check it off (`[x]`) in the same commit as the work, and add follow-up tasks for the other tool if needed.

- **Claude Code** owns the Logic tasks (`src/core.js`, `src/game.js`).
- **Cursor** owns the Design tasks (`src/cars.js`, `src/objects.js`, `style.css`, `assets/`).
- `Needs:` means wait until that task is checked off.
- Big features go on a branch (`feature/<id>`) and merge to `main` only when playable. `main` is live on the TV.

## The big picture (v2)
A much bigger world with **zones** (town, farm, park, and more) where **everything is destructible**. Buildings collapse, and animals get comically launched but never hurt. You **start tiny and grow** by smashing things: the bigger you get, the bigger your hit box and the bigger the stuff you can wreck, until you're a giant stomping through the town. Still co-op only, with no losing.

---

## Logic (Claude Code)

- [ ] **L1: Bigger world and chunk streaming**
  - Grow the world from ±70 to roughly ±400 (tune for fun). Keep a soft wall or edge at the boundary.
  - Split the world into a grid of chunks (~80×80). Only build objects in chunks near the players (radius grows with player size). Unload far chunks.
  - Remember what's destroyed per chunk, so leaving and coming back doesn't magically rebuild everything. Slowly regrow over time so the world never runs out.
  - Zone map: a data table that says which zone each chunk is in (town, farm, park…). Design fills zones through `objects.js`.
  - Performance: share geometries and materials, use instanced meshes for repeated props (fences, crops, trees), cap debris. Must hold 60fps at 1080p on a GTX 1060.
  - Leave `// TODO(design):` hooks where each zone's layout function plugs in.

- [ ] **L2: Grow-by-smashing**
  - Players start **small** (about 1/3 the current size). Each smash adds "growth" by the object's mass/points. Car model, hit box (`r`), speed, jump height, camera zoom and engine pitch all scale with size.
  - Objects get a **size class** (tiny / small / medium / large / huge). You can only smash things at or below your size. Bigger things **wobble and bump you back** with a funny boing. Never a fail state.
  - Growth is **shared** between both players (co-op), so the 5-year-old never falls behind.
  - Big milestone moments: a size-up fanfare, a screen shake and a voice callout ("BIGGER!"). Show size on the HUD as a picture (a car icon growing), not a number.
  - Open question for Kaden: at max size, do we "shrink and start a new world" as a celebration, or stay giant forever?
  - Needs: L1 (camera and streaming radius must scale with size).

- [ ] **L3: Collapsing buildings**
  - Replace instant shatter with **staged destruction**: hits knock out wall chunks, and when enough support is gone the building collapses floor by floor (upper parts drop, tilt and crumble), with a dust cloud and rumble.
  - Small players chip pieces off. Big players smash straight through. Giant players flatten in one hit.
  - Define a building "part contract" that design follows (floors, walls, roof, extras), and document it in `CLAUDE.md`.
  - Needs: L2 (size decides how much damage a hit does).

- [ ] **L4: Animal launch ("kick the chicken")**
  - Animals are **never destroyed**. On hit they get launched in a big silly arc, spinning, with a cartoon sound (bawk, moo, oink) and a little feather/fluff puff. They land, shake it off, and wander again.
  - Simple wander AI: idle, walk and flee a little when cars are near. Herds and flocks stick together.
  - Launching animals gives a small bonus to the meter but **no growth** (we don't "eat" animals).
  - If launched out of the loaded area, quietly respawn them back near their pen.

- [ ] **L5: Tune and test pass**
  - Play-test the whole v2 loop: small, then medium, then giant. Make sure growth pacing feels good in a ~20 minute session with a 5-year-old.
  - Check touch controls and phone performance still work (lower view radius on phones).

---

## Design (Cursor)

- [ ] **D1: Zone layouts**
  - **Town:** streets with houses of different sizes, shops, a school, a fire station, a water tower, mailboxes, street lights, hydrants, parked cars (original designs), and a tall "boss" building to topple when giant.
  - **Farm:** big red barn, silo, farmhouse, hay bales (roll when hit), fences, crop rows, a pond, windmill, chicken coop, scarecrow, parked tractor.
  - **Park:** playground (swings, slide, jungle gym), fountain, benches, picnic tables, trees, a gazebo, a pond with ducks, a giant bounce-house.
  - Ideas for later zones: construction site, beach boardwalk, candy land, dino valley.
  - Every prop gets a **size class** (tiny / small / medium / large / huge) so small players have plenty to smash early.
  - Needs: L1 (zone map + layout hooks).

- [ ] **D2: Destructible buildings**
  - Build every building from separate parts per the L3 part contract (floors, walls, roof, details) so they can crumble in stages. Vary colors and styles. Chunky, toy-like, readable from far away.
  - Needs: L3 (part contract).

- [ ] **D3: Farm and park animals**
  - Cute, chunky, low-poly: chicken, rooster, duck, cow, pig, sheep, goat, horse, dog, cat, bunny, goose.
  - Built as single whole pieces (they get launched intact, never broken). Big googly eyes encouraged.
  - Needs: L4 (animal format and how they're registered).

- [ ] **D4: Vehicle wish list (inspiration only)**
  Design **original** takes on these, with no real brands, logos or copied designs. Every one should look like a toy: big wheels, bright colors, a silly face or feature.
  - **Real-life vehicle types:** dump truck, cement mixer, garbage truck, school bus, fire engine, ambulance, tow truck, street sweeper, snowplow, bulldozer, excavator, steamroller, forklift, farm tractor, combine harvester, ice-rink resurfacer, double-decker bus, limo, RV/camper, food truck, taxi, police cruiser, mail truck, delivery van, race car, dune buggy, monster truck, rally car, go-kart, hovercraft, golf cart, lawn mower, armored truck, ladder truck, crane truck, tank (cartoon, no weapons)
  - **Futuristic:** angular armored "future truck", hover car, robot-leg walker, rocket sled, solar-panel buggy, bubble-dome moon rover
  - **Wacky toy racers:** car with giant rear wheels and exposed engine, flame-painted hot rod, loop-track speedster, twin-engine dragster, shark car (done), dino cars (T-rex truck, triceratops ram-car, stegosaurus with spike plates, pterodactyl wing-glider), sneaker car, hot dog (done), ice cream (done), birthday cake car, rubber-duck boat car, pickle car, taco truck shaped like a taco, toaster car, bathtub racer, shopping cart racer, rocket skateboard
  - **Son-designed car:** reserved spot. Ask him for a name, color and silly feature.
  - Each car: 4–5 units long, faces +Z, `speed` 20–32, `r` 2–2.8. Scales automatically once L2 lands.
