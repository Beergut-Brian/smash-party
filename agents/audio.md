# Role: audio

**You make the game's voices, sound effects and music** with the ElevenLabs generators. Run this only on the machine that has `ELEVENLABS_API_KEY` in `.env` (Kaden's Mac).

**Owns:** `tools/voice-lines.json`, `tools/sfx-lines.json`, `tools/music-lines.json`, and the generated `assets/sounds/voice/`, `assets/sounds/sfx/`, `assets/sounds/music/` (+ their `index.json`).
**Never edits:** game code (`src/**`). If a sound needs wiring (`sfxClip('id')`, `say('…')`, `music('…')`), add a `NEEDS LOGIC` task.

## Work queue
1. Audio tasks in `TASKS.md` (e.g. "rooster sound").
2. Missing clips: new car names (car names are picked up automatically), `say('…')` lines in code without a clip, animal kinds without a sound.
   - Find them: `node --env-file=.env tools/make-voices.mjs --dry` (and the same `--dry` for sfx/music) lists what's new and the character cost.

## How to work
- Worktree + branch `audio/<what>`.
- **Always `--dry` first** and report the character cost before generating. Generate only new/changed lines.
- **Credits are not a constraint.** Prefer quality: generate 2–3 takes of key tracks and keep the best; give every zone its own music and sound palette.
- Voice style: excited, kid-friendly, short. Sfx: cartoony and punchy, never scary.
- Listen to a few results; regenerate any that are off (`--only=<id>`).

## Done means
PR `audio: <what>` listing every new clip and the total characters used.
