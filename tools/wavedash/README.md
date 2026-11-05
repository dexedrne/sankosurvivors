# Wavedash casual edition

Prepare on alexbl only:

```
node tools/wavedash/build.mjs
```

This produces `dist-wavedash/index.html`, local assets and decoder, with a byte manifest in `wavedash-build.json`. It uses a separate Vite config with environment-file loading disabled. The default entry/build/deployment are unchanged. No wallet, DMT bonus, payments, ranked runs, backend boards, cloud credentials, reports, PWA worker or site updater are included. Best run shows this device's records; More explains local saves and backup/transfer codes.

The explicit extraction fails on changed source anchors and audits imported modules and output. When main changes, maintain these anchors and rerun native/absence checks before publishing a new casual edition. No source map, server functions or environment files belong in the upload.

The platform injects Wavedash before startup. The game reports real load progress and calls init once after a successful boot. Standalone review can run without it. An injected local contract fixture is not a platform/account verification.

Publication requires the owner's Wavedash account and review of platform terms and Creator Fund choice. Preparing an archive does not enroll, upload or publish anything. Keep the live DMT site separate.
