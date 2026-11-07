// Generate sound effects with ElevenLabs sound generation, once. Owner: Claude Code (logic).
//   node --env-file=.env tools/make-sfx.mjs          new or changed sounds only
//   node --env-file=.env tools/make-sfx.mjs --dry    list what would be made
//   node --env-file=.env tools/make-sfx.mjs --force  remake everything (or: --only chicken,cow)
// Needs ELEVENLABS_API_KEY in .env (gitignored). Writes assets/sounds/sfx/<id>.mp3 + index.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'assets/sounds/sfx');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/sfx-lines.json'), 'utf8'));
const dry = process.argv.includes('--dry'), force = process.argv.includes('--force');
const onlyArg = process.argv.find(a => a.startsWith('--only'));
const only = onlyArg ? new Set((onlyArg.split('=')[1] || process.argv[process.argv.indexOf(onlyArg) + 1] || '').split(',')) : null;

fs.mkdirSync(outDir, { recursive: true });
const indexPath = path.join(outDir, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
const key = process.env.ELEVENLABS_API_KEY;
if (!dry && !key) { console.error('Missing ELEVENLABS_API_KEY (put it in .env and run with --env-file=.env)'); process.exit(1); }

let made = 0;
for (const [id, s] of Object.entries(cfg.sounds)) {
  if (only && !only.has(id)) continue;
  const style = s.style ?? cfg.style, text = s.prompt + (style ? ', ' + style : '');
  const body = { text, duration_seconds: s.dur, prompt_influence: s.influence ?? 0.6 };
  const hash = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex').slice(0, 12);
  const file = path.join(outDir, id + '.mp3');
  if (!force && !only && index[id]?.hash === hash && fs.existsSync(file)) continue;
  if (dry) { console.log(`would make ${id}.mp3  "${text}" (${s.dur}s)`); continue; }
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) { console.error(`FAILED ${id}: ${res.status} ${(await res.text()).slice(0, 300)}`); process.exitCode = 1; continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  index[id] = { prompt: s.prompt, dur: s.dur, hash };
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 1) + '\n');
  made++; console.log(`made ${id}.mp3`);
}
console.log(dry ? 'dry run' : `${made} sounds made`);
