import noble from '../vercel-api/noble-crypto.cjs';
import { createDecipheriv, scryptSync, timingSafeEqual } from 'node:crypto';
const { keccak_256, secp256k1 } = noble;
export const hash = bytes => '0x' + Buffer.from(keccak_256(bytes)).toString('hex');
export const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
export function address(value) {
  if (!ADDRESS.test(value) || /^0x0{40}$/i.test(value)) throw new Error('invalid destination');
  return value.toLowerCase();
}
function hexBytes(value, length) {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(value) || (length != null && value.length !== length * 2)) throw new Error('invalid hex');
  return Buffer.from(value, 'hex');
}
export function privateBytes(value) {
  const bytes = hexBytes(value?.replace(/^0x/, ''), 32);
  if (!secp256k1.utils.isValidSecretKey(bytes)) throw new Error('invalid private key');
  return bytes;
}
export function addressOf(key) {
  return '0x' + Buffer.from(keccak_256(secp256k1.getPublicKey(privateBytes(key), false).subarray(1))).subarray(-20).toString('hex');
}
export function rlp(value) {
  if (Array.isArray(value)) return prefix(Buffer.concat(value.map(rlp)), 0xc0);
  let bytes;
  if (typeof value === 'bigint' || typeof value === 'number') {
    const n = BigInt(value); if (n < 0n) throw new Error('negative RLP integer');
    const h = n.toString(16); bytes = n === 0n ? Buffer.alloc(0) : Buffer.from(h.padStart(h.length + h.length % 2, '0'), 'hex');
  } else if (typeof value === 'string') bytes = hexBytes(value.replace(/^0x/, ''));
  else bytes = Buffer.from(value);
  return bytes.length === 1 && bytes[0] < 128 ? bytes : prefix(bytes, 0x80);
}
function prefix(bytes, offset) {
  if (bytes.length < 56) return Buffer.concat([Buffer.from([offset + bytes.length]), bytes]);
  const h = bytes.length.toString(16), size = Buffer.from(h.padStart(h.length + h.length % 2, '0'), 'hex');
  return Buffer.concat([Buffer.from([offset + 55 + size.length]), size, bytes]);
}
export function transferData(wallet, amount) {
  wallet = address(wallet); amount = BigInt(amount);
  if (amount <= 0n || amount >= 1n << 256n) throw new Error('invalid transfer amount');
  return '0xa9059cbb' + wallet.slice(2).padStart(64,'0') + amount.toString(16).padStart(64,'0');
}
export function sign1559(tx, key) {
  const fields = [BigInt(tx.chainId), BigInt(tx.nonce), BigInt(tx.priority), BigInt(tx.maxFee), BigInt(tx.gas), address(tx.to), BigInt(tx.value ?? 0), tx.data ?? '0x', []];
  if (fields[3] < fields[2] || fields[4] < 21000n) throw new Error('invalid transaction fees');
  const digest = keccak_256(Buffer.concat([Buffer.from([2]), rlp(fields)]));
  const sig = secp256k1.Signature.fromBytes(secp256k1.sign(digest, privateBytes(key), { prehash: false, lowS: true, format: 'recovered' }), 'recovered');
  if (sig.recovery > 1) throw new Error('unsupported signature recovery');
  const raw = '0x02' + rlp([...fields, BigInt(sig.recovery), sig.r, sig.s]).toString('hex');
  return { raw, hash: hash(Buffer.from(raw.slice(2), 'hex')) };
}
export function decryptKeystore(store, password) {
  const c = store.crypto ?? store.Crypto, k = c?.kdfparams;
  if (store.version !== 3 || c?.cipher !== 'aes-128-ctr' || c.kdf !== 'scrypt' || k?.dklen !== 32 || !Number.isSafeInteger(k.n) || k.n < 2 || k.n > 1048576 || (k.n & (k.n - 1)) || !Number.isSafeInteger(k.r) || k.r < 1 || k.r > 32 || !Number.isSafeInteger(k.p) || k.p < 1 || k.p > 16 || 128 * k.n * k.r > 512 * 1024 * 1024) throw new Error('unsupported keystore parameters');
  const ciphertext = hexBytes(c.ciphertext,32), iv = hexBytes(c.cipherparams?.iv,16);
  const derived = scryptSync(password, hexBytes(k.salt,32), 32, { N:k.n, r:k.r, p:k.p, maxmem: 128 * k.n * k.r + 64 * 1024 * 1024 });
  try {
    const mac = Buffer.from(keccak_256(Buffer.concat([derived.subarray(16,32), ciphertext])));
    if (!timingSafeEqual(mac, hexBytes(c.mac,32))) throw new Error('keystore authentication failed');
    const decipher = createDecipheriv('aes-128-ctr', derived.subarray(0,16), iv);
    const key = Buffer.concat([decipher.update(ciphertext),decipher.final()]);
    const encoded = '0x' + key.toString('hex'); key.fill(0);
    if (store.address && addressOf(encoded) !== address('0x' + store.address.replace(/^0x/,''))) throw new Error('keystore address mismatch');
    privateBytes(encoded); return encoded;
  } finally { derived.fill(0); }
}

// Decode and verify persisted bytes before any recovery broadcast.
export function decode1559(raw) {
  const bytes=hexBytes(raw?.replace(/^0x/,''));
  if(bytes[0]!==2 || bytes.length>10000) throw new Error('invalid saved transaction');
  function item(at) {
    const tag=bytes[at];if(tag===undefined) throw new Error('truncated RLP');
    if(tag<128) return [bytes.subarray(at,at+1),at+1];
    const list=tag>=192, base=list?192:128;let len=tag-base,begin=at+1;
    if(len>55) {const size=len-55;if(size>4 || begin+size>bytes.length) throw new Error('bad RLP length');len=Number(BigInt('0x'+bytes.subarray(begin,begin+size).toString('hex')));begin+=size;}
    const end=begin+len;if(end>bytes.length) throw new Error('truncated RLP');
    if(!list) return [bytes.subarray(begin,end),end];
    const result=[];while(begin<end){const [child,next]=item(begin);result.push(child);begin=next;}
    if(begin!==end) throw new Error('bad RLP list');return [result,end];
  }
  const [fields,end]=item(1);
  if(end!==bytes.length || !Array.isArray(fields) || fields.length!==12 || !Array.isArray(fields[8]) || fields[8].length || !Buffer.concat([Buffer.from([2]),rlp(fields)]).equals(bytes)) throw new Error('invalid transaction fields');
  const integer=i=>{const b=fields[i];if(!Buffer.isBuffer(b) || b.length>32 || b[0]===0) throw new Error('noncanonical integer');return b.length?BigInt('0x'+b.toString('hex')):0n;};
  const sig=new secp256k1.Signature(integer(10),integer(11)).addRecoveryBit(Number(integer(9)));
  const digest=keccak_256(Buffer.concat([Buffer.from([2]),rlp(fields.slice(0,9))]));
  const encoded=sig.toBytes('recovered');
  const pub=sig.recoverPublicKey(digest).toBytes(false);
  if(sig.hasHighS() || !secp256k1.verify(encoded,digest,pub,{prehash:false,lowS:true,format:'recovered'})) throw new Error('invalid transaction signature');
  return {chainId:integer(0),nonce:integer(1),priority:integer(2),maxFee:integer(3),gas:integer(4),to:address('0x'+fields[5].toString('hex')),value:integer(6),data:'0x'+fields[7].toString('hex'),from:'0x'+Buffer.from(keccak_256(pub.subarray(1))).subarray(-20).toString('hex'),hash:hash(bytes)};
}
