# Art pipeline: GPU server brief (task A1/A2)

For the agents that run Kaden's Proxmox GPU server. Goal: produce **models and textures** for Smash Party and deliver them to the repo as pull requests. You never edit game code.

## Hardware split
| GPU | VRAM | Job |
|---|---|---|
| RTX 3060 | 12 GB | Image → 3D models; ComfyUI texture/art generation |
| RTX 2060 | 6 GB | Prep work: background removal, upscaling, small image jobs, Blender decimate/export |

Give each GPU its own VM/LXC with PCI passthrough (they can't pool VRAM). Jobs queue per GPU.

## Software to install
- **Blender 4.x** (headless, `blender -b`): runs `tools/decimate.py` from this repo.
- **Image → 3D:** an open-source image-to-3D model with a **low-VRAM mode that fits 12 GB** (e.g. Hunyuan3D 2 mini/turbo, or a low-VRAM TRELLIS fork; check what's current and pick whatever runs reliably on the 3060). Shape + texture if it fits; shape-only plus a simple texture pass is fine.
- **Background removal** (e.g. rembg) for the 2060.
- **ComfyUI** (already in use for thumbnails) for textures, decals, title art.
- **git** + **GitHub CLI** with access to `Beergut-Brian/smash-party` only (see Access).

## Access (least privilege)
- Create a **fine-grained GitHub token** (or a GitHub App/bot account) limited to **only** `Beergut-Brian/smash-party`, with **Contents: read/write** and **Pull requests: read/write**. Nothing else.
- Agents **never push to `main`**. Work on `art/<short-name>` branches and open a PR. Kaden merges after playing it.
- Claude Code and Cursor don't need access to the server. The repo is the hand-off point.

## Output spec (must follow, or the game won't load it right)
- Format: **`.glb`**, textures embedded, PNG/JPG, max **1024px**.
- **Cars:** about 4.5 units long, facing **+Z**, wheels resting at y=0, under **20k triangles**. Name wheel meshes `wheel_*` (they spin). Save to `assets/cars/<name>.glb` and add a line to `assets/cars/cars.json`:
  `{"name":"Comet Crusher","emoji":"☄️","file":"comet.glb","speed":27,"r":2.3,"scale":1,"y":0,"rotateY":0,"height":3,"exhaust":[0,1,-2.5]}`
- **Props/buildings:** save to `assets/props/<name>.glb`, base at y=0, under **5k triangles** (buildings 15k). Real-world-ish scale: a house is ~6 units tall.
- **Textures:** `assets/textures/<name>.png`, tileable where it makes sense (grass, road, brick), 512–1024px.
- Run every model through: `blender -b -P tools/decimate.py -- in.glb out.glb --tris 20000 --length 4.5 --wheels` (props: smaller `--tris`, `--length` = intended size).
- Style: **chunky, bright, toy-like, cute.** Matches a low-poly cartoon look.
- **Original designs only:** no real car brands, logos, toy lines, or licensed characters. If a prompt or drawing looks like a real branded product, make it clearly original.
- Add each item to `assets/CREDITS.md` (source: "generated on GPU server", or the CC0 pack name).

## Workflow per request
1. Take the request (from TASKS.md `A*` items or from Kaden).
2. **Kid drawings (A2):** photo → background removal (2060) → image-to-3D (3060) → `decimate.py` → glb.
3. Render a quick preview image of each model (Blender headless, 3/4 view) and attach it to the PR description.
4. Commit only `assets/**` (and `cars.json`) on an `art/*` branch, then open a PR titled `art: <what>`.
5. Note anything that needs game changes as a `TODO(logic)` / `TODO(design)` line in the PR description, not in code.
