#!/usr/bin/env node
/* Smash Party — bake a CC0 pack model (Kenney) into a game-ready prop GLB. Owner: world-props session.
   node assets/props/bake.mjs <in.glb> <out.glb> [colormap.png] [--recolor]
   - merges every node/primitive into ONE mesh with ONE plain white material,
   - turns the texture (Kenney's palette "colormap.png") or each material's flat color into vertex colors (COLOR_0),
   - drops UVs and textures, so the GLB is self-contained and the kits' same-named colormaps never clash.
   objects.js reads the vertex colors to split a model into colored parts (and buildings into wall/roof pieces).
   --recolor swaps Kenney Nature Kit's pastel material colors for the game's brighter toy palette. */
import fs from 'fs';
import zlib from 'zlib';

const [inp, out, cmap] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const RECOLOR = process.argv.includes('--recolor');
if (!inp || !out) { console.error('usage: bake.mjs in.glb out.glb [colormap.png] [--recolor]'); process.exit(1); }

/* Nature Kit material name → toy color (sRGB). Unlisted names keep their own color. */
const TOY = {
  leafsGreen: '#3fb950', leafsDark: '#2d8f4e', grass: '#5cbf4a', woodBark: '#8d5a32', woodBarkDark: '#6d4325',
  wood: '#c8874a', woodDark: '#9a6234', woodInner: '#e9c79a', woodBirch: '#f1e7d6', dirt: '#b97a45', dirtDark: '#94592c',
  leafsFall: '#f7a325', colorRed: '#e63946', colorRedDark: '#b5222e', colorYellow: '#ffd23f', colorPurple: '#9b5de5',
  colorTan: '#e9c46a', stone: '#c9d1d9', corn: '#ffd23f', _defaultMat: '#f8f9fa'
};

/* ---- tiny PNG decoder (8-bit, palette / RGB / RGBA, non-interlaced: what Kenney ships) ---- */
function readPNG(file) {
  const b = fs.readFileSync(file); let p = 8, w, h, ct, pal = null, trns = null; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[12]) throw Error('png: only 8-bit non-interlaced'); ct = d[9]; }
    else if (type === 'PLTE') pal = d; else if (type === 'tRNS') trns = d; else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
  }
  const bpp = { 2: 3, 3: 1, 6: 4, 0: 1, 4: 2 }[ct], raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++], line = Buffer.from(raw.subarray(q, q + stride)); q += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      const pr = f === 4 ? (() => { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); return pa <= pb && pa <= pc ? a : pb <= pc ? up : c; })() : 0;
      line[i] = (line[i] + [0, a, up, (a + up) >> 1, pr][f]) & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (ct === 3) { const k = line[x]; px[o] = pal[k * 3]; px[o + 1] = pal[k * 3 + 1]; px[o + 2] = pal[k * 3 + 2]; px[o + 3] = trns && k < trns.length ? trns[k] : 255; }
      else if (ct === 2 || ct === 6) { line.copy(px, o, x * bpp, x * bpp + 3); px[o + 3] = ct === 6 ? line[x * bpp + 3] : 255; }
      else { px[o] = px[o + 1] = px[o + 2] = line[x * bpp]; px[o + 3] = 255; }
    }
    prev = line;
  }
  return { w, h, px };
}
const lin = v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const hexLin = s => [1, 3, 5].map(i => lin(parseInt(s.slice(i, i + 2), 16) / 255));

/* ---- GLB in ---- */
const B = fs.readFileSync(inp), jl = B.readUInt32LE(12), J = JSON.parse(B.toString('utf8', 20, 20 + jl));
const BIN = B.subarray(20 + jl + 8);
const COMP = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function acc(i) {
  const a = J.accessors[i], v = J.bufferViews[a.bufferView], [T, sz] = COMP[a.componentType], n = NC[a.type];
  const stride = v.byteStride || sz * n, base = (v.byteOffset || 0) + (a.byteOffset || 0), out = new Float64Array(a.count * n);
  const dv = new DataView(BIN.buffer, BIN.byteOffset);
  const rd = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
    let x = dv[rd](base + k * stride + c * sz, true);
    if (a.normalized) x = a.componentType === 5121 ? x / 255 : a.componentType === 5123 ? x / 65535 : x;
    out[k * n + c] = x;
  }
  return out;
}
const tex = cmap ? readPNG(cmap) : null;
function sample(u, v) { // glTF UVs: (0,0) is the image's top-left
  const x = Math.min(tex.w - 1, Math.max(0, Math.floor((u - Math.floor(u)) * tex.w))), y = Math.min(tex.h - 1, Math.max(0, Math.floor((v - Math.floor(v)) * tex.h)));
  const o = (y * tex.w + x) * 4; return [lin(tex.px[o] / 255), lin(tex.px[o + 1] / 255), lin(tex.px[o + 2] / 255)];
}

/* 4x4 column-major matrices */
const mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; };
function trs(n) {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1];
}
const P = [], N = [], C = [], I = [];
function addMesh(mi, m) {
  // normal matrix = inverse-transpose of the upper 3x3; for Kenney's rotations + scales, cofactors do it
  const a = m, cof = [a[5] * a[10] - a[6] * a[9], a[6] * a[8] - a[4] * a[10], a[4] * a[9] - a[5] * a[8],
    a[2] * a[9] - a[1] * a[10], a[0] * a[10] - a[2] * a[8], a[1] * a[8] - a[0] * a[9],
    a[1] * a[6] - a[2] * a[5], a[2] * a[4] - a[0] * a[6], a[0] * a[5] - a[1] * a[4]];
  for (const pr of J.meshes[mi].primitives) {
    if ((pr.mode ?? 4) !== 4) continue;
    const pos = acc(pr.attributes.POSITION), nrm = pr.attributes.NORMAL != null ? acc(pr.attributes.NORMAL) : null;
    const uv = pr.attributes.TEXCOORD_0 != null ? acc(pr.attributes.TEXCOORD_0) : null, cnt = pos.length / 3;
    const mat = J.materials?.[pr.material] || {}, pbr = mat.pbrMetallicRoughness || {};
    const textured = tex && uv && pbr.baseColorTexture;
    let flat = (pbr.baseColorFactor || [1, 1, 1]).slice(0, 3);
    if (RECOLOR && TOY[mat.name]) flat = hexLin(TOY[mat.name]);
    else if (!textured) flat = flat.map(v => lin(v)); // Kenney stores these as sRGB numbers; as linear they look washed out
    const base = P.length / 3;
    for (let k = 0; k < cnt; k++) {
      const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
      P.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
      if (nrm) {
        const nx = nrm[k * 3], ny = nrm[k * 3 + 1], nz = nrm[k * 3 + 2];
        let X = cof[0] * nx + cof[3] * ny + cof[6] * nz, Y = cof[1] * nx + cof[4] * ny + cof[7] * nz, Z = cof[2] * nx + cof[5] * ny + cof[8] * nz;
        const l = Math.hypot(X, Y, Z) || 1; N.push(X / l, Y / l, Z / l);
      } else N.push(0, 1, 0);
      C.push(...(textured ? sample(uv[k * 2], uv[k * 2 + 1]) : flat));
    }
    const idx = pr.indices != null ? acc(pr.indices) : Array.from({ length: cnt }, (_, i) => i);
    for (const i of idx) I.push(base + i);
  }
}
(function walk(list, m) { for (const ni of list) { const n = J.nodes[ni], w = mul(m, trs(n)); if (n.mesh != null) addMesh(n.mesh, w); walk(n.children || [], w); } })(J.scenes[J.scene || 0].nodes, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/* ---- GLB out ---- */
const vc = P.length / 3, big = vc > 65535;
const parts = [new Float32Array(P), new Float32Array(N), new Float32Array(C), big ? new Uint32Array(I) : new Uint16Array(I)];
const views = [], bufs = []; let off = 0;
for (const a of parts) { const b = Buffer.from(a.buffer); views.push({ buffer: 0, byteOffset: off, byteLength: b.length }); bufs.push(b); off += b.length; const pad = (4 - (off % 4)) % 4; if (pad) { bufs.push(Buffer.alloc(pad)); off += pad; } }
const mn = [0, 1, 2].map(k => Math.min(...P.filter((_, i) => i % 3 === k))), mx = [0, 1, 2].map(k => Math.max(...P.filter((_, i) => i % 3 === k)));
const name = out.split('/').pop().replace(/\.glb$/, '');
const G = {
  asset: { version: '2.0', generator: 'smash-party bake.mjs' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name, mesh: 0 }],
  meshes: [{ name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0 }] }],
  materials: [{ name: 'vertex', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.7 } }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: vc, type: 'VEC3', min: mn, max: mx },
    { bufferView: 1, componentType: 5126, count: vc, type: 'VEC3' },
    { bufferView: 2, componentType: 5126, count: vc, type: 'VEC3' },
    { bufferView: 3, componentType: big ? 5125 : 5123, count: I.length, type: 'SCALAR' }],
  bufferViews: views, buffers: [{ byteLength: off }]
};
let js = Buffer.from(JSON.stringify(G)); if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - (js.length % 4), 32)]);
const bin = Buffer.concat(bufs), hdr = Buffer.alloc(12);
hdr.write('glTF', 0); hdr.writeUInt32LE(2, 4); hdr.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
const ch = (len, t) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.write(t, 4); return b; };
fs.writeFileSync(out, Buffer.concat([hdr, ch(js.length, 'JSON'), js, ch(bin.length, 'BIN\0'), bin]));
console.log(`${name}: ${I.length / 3} tris, ${vc} verts, ${(off / 1024).toFixed(0)} KB, size ${mx.map((v, k) => (v - mn[k]).toFixed(2)).join('x')}`);
