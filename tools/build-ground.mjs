// Bakes the world's walk data (public/assets/world/tiles/nav.png + height.bin, through the same terrainFromTiles the
// browser uses) into tools/vercel-api/ground.bin for the game server. Run: node tools/build-ground.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { terrainFromTiles } from '../src/terrain.js';
import { packGround, groundHash } from '../src/ground-pack.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// a small PNG reader: 8-bit RGBA or RGB, not interlaced (what the tile builder writes)
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace || (colorType !== 6 && colorType !== 2)) throw new Error(`unsupported PNG (depth ${bitDepth}, colour ${colorType}, interlace ${interlace})`);
  const bpp = colorType === 6 ? 4 : 3, stride = w * bpp, raw = inflateSync(Buffer.concat(idat)), px = new Uint8Array(w * h * bpp);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[src + x], a = x >= bpp ? px[dst + x - bpp] : 0, b = y ? px[dst - stride + x] : 0, c = x >= bpp && y ? px[dst - stride + x - bpp] : 0;
      let r;
      if (f === 0) r = v; else if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[dst + x] = r & 255;
    }
  }
  if (bpp === 4) return { w, h, rgba: px };
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { rgba[i * 4] = px[i * 3]; rgba[i * 4 + 1] = px[i * 3 + 1]; rgba[i * 4 + 2] = px[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
  return { w, h, rgba };
}

export function worldGround() {
  const tiles = path.join(ROOT, 'public/assets/world/tiles');
  const hb = readFileSync(path.join(tiles, 'height.bin'));
  const height = new Float32Array(hb.buffer.slice(hb.byteOffset, hb.byteOffset + hb.byteLength));
  const nav = decodePng(readFileSync(path.join(tiles, 'nav.png')));
  const T = terrainFromTiles({ height, nav: nav.rgba, S: nav.w });
  return { n: T.cells, blocked: T.blocked, cell: true, water: T.water, walls: T.walls };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const g = worldGround(), bytes = packGround(g);
  writeFileSync(path.join(ROOT, 'tools/vercel-api/ground.bin'), bytes);
  console.log(`ground.bin: ${bytes.length} bytes, n ${g.n}, hash ${groundHash(g)}`);
}
