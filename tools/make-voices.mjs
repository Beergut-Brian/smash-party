// Generate recorded voice lines with ElevenLabs, once. Owner: Claude Code (logic).
//   node --env-file=.env tools/make-voices.mjs          generate new or changed lines only
//   node --env-file=.env tools/make-voices.mjs --dry    list lines and character count, no API calls
//   node --env-file=.env tools/make-voices.mjs --force  regenerate everything
// Needs ELEVENLABS_API_KEY in .env (gitignored). Writes assets/sounds/voice/<slug>.mp3 + index.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'assets/sounds/voice');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/voice-lines.json'), 'utf8'));
const dry = process.argv.includes('--dry'), force = process.argv.includes('--force');

// must match voiceSlug() in src/core.js
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
// ALL-CAPS game text reads better to the voice as normal case ("MEGA SMASH!" -> "Mega smash!")
const speakable = t => /[a-z]/.test(t) ? t : t.charAt(0) + t.slice(1).toLowerCase();

const lines = cfg.lines.map(l => typeof l === 'string' ? { text: l } : l);
const carNames = new Set();
for (const m of fs.readFileSync(path.join(root, 'src/cars.js'), 'utf8').matchAll(/name:'([^']+)'/g)) carNames.add(m[1]);
try { for (const c of JSON.parse(fs.readFileSync(path.join(root, 'assets/cars/cars.json'), 'utf8'))) if (c.name) carNames.add(c.name); } catch {}
for (const n of carNames) lines.push({ text: n + '!' });

fs.mkdirSync(outDir, { recursive: true });
const indexPath = path.join(outDir, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
const key = process.env.ELEVENLABS_API_KEY;
if (!dry && !key) { console.error('Missing ELEVENLABS_API_KEY (put it in .env and run with --env-file=.env)'); process.exit(1); }

let chars = 0, made = 0;
for (const l of lines) {
  const id = slug(l.text), speak = l.speak || speakable(l.text);
  const hash = crypto.createHash('sha1').update([cfg.voice, cfg.model, JSON.stringify(cfg.settings), speak].join('|')).digest('hex').slice(0, 12);
  const file = path.join(outDir, id + '.mp3');
  if (!force && index[id]?.hash === hash && fs.existsSync(file)) continue;
  chars += speak.length;
  if (dry) { console.log(`would make ${id}.mp3  "${speak}"`); continue; }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: speak, model_id: cfg.model, voice_settings: cfg.settings })
  });
  if (!res.ok) { console.error(`FAILED ${id}: ${res.status} ${(await res.text()).slice(0, 300)}`); process.exitCode = 1; continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  index[id] = { text: l.text, speak, hash };
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 1) + '\n');
  made++; console.log(`made ${id}.mp3  "${speak}"`);
}
console.log(`${dry ? 'would use' : 'used'} ~${chars} characters, ${dry ? '' : made + ' files made, '}${lines.length} lines total`);
