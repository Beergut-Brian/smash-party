# Role: art-pipeline (Kaden's GPU-server agents)

**You turn drawings and requests into game-ready 3D models** on the Proxmox GPU server and deliver them as PRs.

Full brief: [`docs/ART_PIPELINE.md`](../docs/ART_PIPELINE.md) (hardware split, access, output spec, workflow). Decisions so far: shape-only image-to-3D (no texture step; flat bright colors), GPU jobs queued one at a time when the card is idle, the GitHub token lives on the mini PC only.

**Owns:** `art/*` branches adding files under `assets/` for the lane that asked (cars → `assets/cars/`, props → `assets/props/…`) plus their `cars.json` / `props.json` entries (add only).
**Never edits:** `src/**`.

## Work queue
1. `A*` tasks in `TASKS.md` (A2: kid-drawn cars).
2. Requests from Kaden (a photo of a drawing + a name).

## Done means
Model run through `tools/decimate.py`, preview render attached, PR `art: <what>`. If it needs a recipe or placement, add a `NEEDS DESIGN` task for `cars-ui` or the world lane.
