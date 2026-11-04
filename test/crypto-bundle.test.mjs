import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('packaged cryptography reproduces from the locked source packages', () => {
  const result = spawnSync(process.execPath, ['tools/build-crypto.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('bundle check refuses altered executable bytes without overwriting them', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sqs-crypto-bundle-'));
  try {
    await mkdir(join(dir, 'tools/vercel-api'), { recursive: true });
    for (const file of ['package.json', 'package-lock.json', 'tools/build-crypto.mjs', 'tools/vercel-api/noble-entry.mjs', 'tools/vercel-api/noble-crypto.cjs', 'tools/vercel-api/noble-LICENSE.txt']) {
      await copyFile(join(root, file), join(dir, file));
    }
    await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir');
    const path = join(dir, 'tools/vercel-api/noble-crypto.cjs');
    const altered = await readFile(path, 'utf8') + '\nmodule.exports.keccak_256 = () => new Uint8Array(32);\n';
    await writeFile(path, altered);
    const result = spawnSync(process.execPath, ['tools/build-crypto.mjs', '--check'], { cwd: dir, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /cryptography bundle differs/);
    assert.equal(await readFile(path, 'utf8'), altered);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
