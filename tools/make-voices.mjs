// Generate recorded voice lines with ElevenLabs, once. Owner: Claude Code (logic).
//   node --env-file=.env tools/make-voices.mjs          generate new or changed lines only
//   node --env-file=.env tools/make-voices.mjs --dry    list lines and character count, no API calls
//   node --env-file=.env tools/make-voices.mjs --force  regenerate everything
//   node --env-file=.env tools/make-voices.mjs --voice=hank   only lines in that voice (--voice=announcer: lines without one)
// Needs ELEVENLABS_API_KEY in .env (gitignored). Optional "prefix" (e.g. "[excited] " for eleven_v3) is prepended to every line. Writes assets/sounds/voice/<slug>.mp3 + index.json.
// L34 character voices: a line with "voice":"hank" uses tools/voices.json's hank entry (voice id, model, settings, prefix)
// and is saved as hank__<slug>.mp3, so the same words in two voices are two clips. Uncast voices (empty id) are skipped.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'assets/sounds/voice');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/voice-lines.json'), 'utf8'));
const dry = process.argv.includes('--dry'), force = process.argv.includes('--force');
const only = (process.argv.find(a => a.startsWith('--voice=')) || '').slice(8) || null;
let cast = {};
try { cast = JSON.parse(fs.readFileSync(path.join(root, 'tools/voices.json'), 'utf8')); } catch (e) { if (fs.existsSync(path.join(root, 'tools/voices.json'))) { console.error('tools/voices.json: ' + e.message); process.exit(1); } }
// the voice a line is spoken in: the announcer (voice-lines.json's own voice/model/settings/prefix) or a cast member
function voiceOf(l) {
  if (!l.voice) return { name: 'announcer', voice: cfg.voice, model: cfg.model, settings: cfg.settings, prefix: cfg.prefix ?? '' };
  const c = cast[l.voice];
  if (!c || l.voice.startsWith('_')) { console.error(`unknown voice "${l.voice}" on "${l.text}" (add it to tools/voices.json)`); process.exit(1); }
  return { name: l.voice, voice: c.voice, model: c.model || cfg.model, settings: c.settings || cfg.settings, prefix: c.prefix ?? cfg.prefix ?? '' };
}

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

let chars = 0, made = 0;const per = {}, uncast = {}, seen = new Set();
for (const l of lines) {
  const v = voiceOf(l);if (only && v.name !== only) continue;
  const id = (l.voice ? l.voice + '__' : '') + slug(l.text), speak = l.speak || speakable(l.text), prefix = l.prefix ?? v.prefix;
  if (seen.has(id)) { console.error(`duplicate line ${id} ("${l.text}")`); process.exitCode = 1; continue; } seen.add(id);
  if (!v.voice) { uncast[v.name] = (uncast[v.name] || 0) + 1; continue; }
  // the announcer's hash stays as it was, so existing clips aren't remade; cast voices add their name
  const hash = crypto.createHash('sha1').update([v.voice, v.model, JSON.stringify(v.settings), prefix, speak].concat(l.voice ? [l.voice] : []).join('|')).digest('hex').slice(0, 12);
  const file = path.join(outDir, id + '.mp3');
  if (!force && index[id]?.hash === hash && fs.existsSync(file)) continue;
  chars += speak.length;const pv = per[v.name] || (per[v.name] = { lines: 0, chars: 0 });pv.lines++;pv.chars += speak.length;
  if (dry) { console.log(`would make ${id}.mp3  [${v.name}] "${speak}"`); continue; }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: prefix + speak, model_id: v.model, voice_settings: v.settings })
  });
  if (!res.ok) { console.error(`FAILED ${id}: ${res.status} ${(await res.text()).slice(0, 300)}`); process.exitCode = 1; continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  index[id] = l.voice ? { text: l.text, speak, voice: l.voice, hash } : { text: l.text, speak, hash };
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 1) + '\n');
  made++; console.log(`made ${id}.mp3  "${speak}"`);
}
for (const [n, p] of Object.entries(per)) console.log(`  ${n}: ${p.lines} lines, ~${p.chars} characters`);
for (const [n, k] of Object.entries(uncast)) console.log(`  ${n}: ${k} lines waiting (no voice id in tools/voices.json yet)`);
console.log(`${dry ? 'would use' : 'used'} ~${chars} characters, ${dry ? '' : made + ' files made, '}${lines.length} lines total`);
