# Bundled cryptography

`noble-crypto.cjs` exports secp256k1 and Keccak-256 from the development-only
`@noble/curves` and `@noble/hashes` packages. Production functions use the bundled
file; they do not install these packages or operate a payout service.
The separate local payout tool imports the same primitives.

Inputs are pinned to **2.4.0** in package.json and package-lock.json, including
npm tarball SHA-512 integrity values. esbuild is the existing locked build tool
(0.25.12). `noble-entry.mjs` is the complete input entry. The generator checks
installed versions against the lock and preserves inline upstream notices plus
the full licenses in `noble-LICENSE.txt`.

On the build host, after installing the lock with `npm ci`:

```
node tools/build-crypto.mjs --check
node tools/build-crypto.mjs --write  # after reviewing a deliberate dependency update
```

The normal Vercel build checks the committed bytes before packaging. A mismatch
fails the build and leaves the bundle untouched. This proves correspondence to
the installed locked inputs; it does not prove a compromised build host or
modified package/lock/source is trustworthy. Review dependency changes and use
the required independent build-host verification.

Primary sources:

- [curves 2.4.0 source/release](https://github.com/paulmillr/noble-curves/tree/2.4.0)
- [hashes 2.4.0 source/release](https://github.com/paulmillr/noble-hashes/tree/2.4.0)
- [curves security policy](https://github.com/paulmillr/noble-curves/blob/main/SECURITY.md)
- [hashes security policy](https://github.com/paulmillr/noble-hashes/blob/main/SECURITY.md)

Ethereum callers supply Keccak digests: sign/verify explicitly use `prehash:false`.
Signature-instance `recoverPublicKey` accepts the already computed digest and
returns a Point; callers request uncompressed bytes for the Ethereum address.
Personal messages accept valid high-S signatures and v=0/1 or 27/28. Transaction
decoding continues to require low-S, canonical RLP and the existing ledger match.
Do not switch to the new default SHA-256 prehash or hash a compressed key for an
Ethereum address.
