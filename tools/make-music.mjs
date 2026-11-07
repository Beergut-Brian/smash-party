// Generate background music with the ElevenLabs Music API, once. Owner: Claude Code (logic).
//   node --env-file=.env tools/make-music.mjs            new or changed tracks only
//   node --env-file=.env tools/make-music.mjs --dry      list what would be made
//   node --env-file=.env tools/make-music.mjs --only=boss  remake just these (comma list)
// Needs ELEVENLABS_API_KEY in .env (gitignored). Writes assets/sounds/music/<id>.mp3 + index.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'assets/sounds/music');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/music-lines.json'), 'utf8'));
const dry = process.argv.includes('--dry');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;

fs.mkdirSync(outDir, { recursive: true });
const indexPath = path.join(outDir, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
const key = process.env.ELEVENLABS_API_KEY;
if (!dry && !key) { console.error('Missing ELEVENLABS_API_KEY (put it in .env and run with --env-file=.env)'); process.exit(1); }

for (const [id, t] of Object.entries(cfg.tracks)) {
  if (only && !only.has(id)) continue;
  const body = { prompt: t.prompt + (cfg.style ? '. ' + cfg.style : ''), music_length_ms: Math.round(t.seconds * 1000), force_instrumental: true };
  const hash = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex').slice(0, 12);
  const file = path.join(outDir, id + '.mp3');
  if (!only && index[id]?.hash === hash && fs.existsSync(file)) continue;
  if (dry) { console.log(`would make ${id}.mp3 (${t.seconds}s)  "${body.prompt}"`); continue; }
  const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) { console.error(`FAILED ${id}: ${res.status} ${(await res.text()).slice(0, 300)}`); process.exitCode = 1; continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  index[id] = { prompt: t.prompt, seconds: t.seconds, hash };
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 1) + '\n');
  console.log(`made ${id}.mp3`);
}
