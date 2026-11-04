import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const source = readFileSync(new URL('../tools/vercel-api/index.js', import.meta.url), 'utf8');
const recover = Function('require', 'Buffer', 'process', 'module', source + '\nreturn recoverSigner;')(
  createRequire(new URL('../tools/vercel-api/index.js', import.meta.url)), Buffer, { env: {} }, { exports: {} });
// Compatibility vectors from the independently reproduced old bundle and public fixture key 1.
// The payout suite separately checks EIP-1559 bytes against fixed ethers vectors.
const vectors = JSON.parse(readFileSync(new URL('./fixtures/wallet-signatures.json', import.meta.url)));
test('wallet authentication preserves legacy low/high-S and 0/27 recovery encodings', () => {
  for (const v of vectors) assert.equal(recover(v.message, v.signature), v.address, JSON.stringify(v));
});
test('wallet authentication rejects malformed hex instead of truncating it to a valid signature', () => {
  const v = vectors[0];
  for (const bad of [v.signature + 'zz', v.signature + 'f', v.signature + ' ', v.signature.slice(0, -2) + 'zz', {}, null]) {
    assert.equal(recover(v.message, bad), null, String(bad));
  }
});
test('wallet authentication binds messages and rejects invalid recovery/scalar values', () => {
  const v = vectors[0];
  assert.notEqual(recover(v.message + ' changed', v.signature), v.address);
  for (const bad of ['0x' + '00'.repeat(65), v.signature.slice(0, -2) + '02', v.signature.slice(0, -2) + '1d', '0x' + 'ff'.repeat(32) + v.signature.slice(66)]) {
    assert.equal(recover(v.message, bad), null);
  }
});
