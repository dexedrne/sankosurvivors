import test from 'node:test';
import assert from 'node:assert/strict';
import noble from '../tools/vercel-api/noble-crypto.cjs';
import { rlp, decode1559, hash } from '../tools/payout/crypto.mjs';
import { run } from '../tools/payout/runner.mjs';
import { fixture, key } from './helpers/payout.mjs';

const { secp256k1, keccak_256 } = noble;
const base = [42161n, 0n, 0n, 100000000n, 2000000n, '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8', 0n, '0xdeadbeef', []];
// Sign deliberately malformed fields with the published fixture key only.
function signFields(fields) {
  const digest = keccak_256(Buffer.concat([Buffer.from([2]), rlp(fields)]));
  const sig = secp256k1.Signature.fromBytes(secp256k1.sign(digest, Buffer.from(key.slice(2), 'hex'), { prehash: false, lowS: true, format: 'recovered' }), 'recovered');
  return '0x02' + rlp([...fields, BigInt(sig.recovery), sig.r, sig.s]).toString('hex');
}

test('saved transactions require byte-string destination and data fields', () => {
  assert.equal(decode1559(signFields(base)).data, '0xdeadbeef');
  for (const [index, value] of [[5, [Buffer.from(base[5].slice(2))]], [7, [Buffer.from('deadbeef')]], [7, []]]) {
    const fields = [...base]; fields[index] = value;
    assert.throws(() => decode1559(signFields(fields)), `field ${index} must not accept an RLP list`);
  }
});

for (const parity of [2n, 3n]) test(`saved transaction parity ${parity} is not a Boolean y-parity`, () => {
  // Generic secp256k1 recovery also supports IDs2/3 for small r; EIP1559 does not.
  for (let r = 1n; r < 16n; r++)
    assert.throws(() => decode1559('0x02' + rlp([...base, parity, r, 1n]).toString('hex')));
});

for (const index of [5, 7]) test(`recovery refuses list-shaped field ${index} before any broadcast or key request`, async () => {
  const f = fixture(3);
  f.db.crashPrepared = true;
  await assert.rejects(run(f.config, f.ports));
  f.db.crashPrepared = false;
  const row = f.db.rows.find(r => r.status === 'sending'), tx = decode1559(row.raw_tx);
  const fields = [tx.chainId, tx.nonce, tx.priority, tx.maxFee, tx.gas, tx.to, tx.value, tx.data, []];
  fields[index] = [Buffer.from(fields[index].slice(2))];
  row.raw_tx = signFields(fields); row.tx_hash = hash(Buffer.from(row.raw_tx.slice(2), 'hex'));
  let keyRequests = 0;
  f.ports.key = async () => { keyRequests++; return key; };
  await run(f.config, f.ports);
  assert.equal(f.chain.broadcasts.length, 0);
  assert.equal(keyRequests, 0);
  assert.ok(f.logs.some(text => text.includes('chain recovery unavailable')));
});
