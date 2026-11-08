// Run on alexbl. This never calls a deployment or reads environment files.
import { build } from 'vite';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { assertCasualBundle } from './edition.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = resolve(root, 'dist-wavedash');
await build({ root, configFile: resolve(root, 'vite.wavedash.config.mjs') });
// Vite copies public files. Only the game's local assets/decoder belong in this upload.
for (const file of await readdir(out)) if (file !== 'index.html' && file !== 'assets' && file !== 'draco' && file !== 'licenses') await rm(resolve(out, file), { recursive: true });
await rm(resolve(out, 'assets/sanko'), { recursive: true, force: true });
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else {
      if (!entry.isFile()) throw Error(`Unexpected upload entry: ${path}`);
      const name = relative(out, path);
      assertCasualBundle('', [name]);
      const bytes = await readFile(path);
      files.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
      if (/\.(?:js|html|css)$/.test(name)) assertCasualBundle(bytes.toString('utf8'), [name]);
    }
  }
}
await walk(out);
assertCasualBundle('', files.map(file => file.name));
const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
if (bytes > 1_000_000_000 || !(await stat(resolve(out, 'index.html'))).isFile()) throw Error('Invalid Wavedash upload');
await writeFile(resolve(root, 'wavedash-build.json'), JSON.stringify({ edition: '0.44.53-casual.14', bytes, files: files.sort((a,b) => a.name.localeCompare(b.name)) }, null, 2) + '\n');
console.log(`Casual upload audit passed: ${files.length} files, ${bytes} bytes; no deployment performed.`);
