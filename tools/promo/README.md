# Native portrait promo capture

Offline staged SankoSurvivors trailer. This tooling does not change the game.

Scope: native renderer QA hooks, original terrain/models/rig animations/spell effects,
original Miata GLB and seated native human from the accepted Racers driver module.
The copy is original fan advertising dialogue, not quest lore. Rendered frames are
staged; they are neither a submitted ranked run nor a hardware FPS measurement.

Pinned product source: cadade1b90bcb677264058df28f18d606e3ea2e3.
Native static source: retained local v0.44.73 QA build in
~/work/sqs-racers-npc-1109/.vercel/output/static on alexbl, from the same
unchanged product source (BUILD=test-local, SIM02fb72a72387). This does not
claim exact deployed LIVE73 artifact bytes. Existing Three186 dependencies/decoder
come from that same work directory.

Run only on alexbl, nice19, while holding the single muted SwiftShader browser lease:

1. Copy this tools/promo directory to ~/work/sqs-engine-trailer-1109/promo.
2. Copy src/character.js and src/content.js from the pinned checkout to promo/source/.
3. Extract Ubuntu's ffmpeg .deb nonprivileged in encoder/ (`/usr/bin/apt-get download ffmpeg`,
   then `dpkg-deb -x`). Existing system runtime libraries are sufficient.
4. `PROMO_TRIAL=1 nice -n 19 node promo/capture.mjs` captures seven composition samples.
5. `nice -n 19 python3 promo/check-server.py` verifies encoded spaces and16
   GET/HEAD traversal, absolute-path, backslash, NUL and symlink escape refusals.
6. `nice -n 19 node --test promo/transport.test.mjs` verifies child failure,
   blocked writes, socket disconnect/error/timeout and successful transport.
7. `nice -n 19 node promo/capture.mjs` streams both versions to local ffmpeg.

Native output: 720x1280, 24fps, 480frames, 20seconds, H.264/yuv420p/CRF18,
faststart MP4. No upscaling. The browser is muted. Both exports use the original Apache Adobe_Fantasy.mp3
as a quiet editorial bed (volume0.16), with0.6s fade-in and1.5s fade-out; AAC160kbps.
Only representative frames are retained. The runner owns and closes its browser,
loopback server and disposable browser profile in finally, including on error.

Staging: Greentown opening, original Apache combat with native spell/actor motion,
actual open-top Miata drive-by with native seated driver, brand/site end card.
Copy claims only current Standard Apache1DMT/run and score=kills+whole seconds.
No prize, winner, earnings, real wallet, payment, or leaderboard footage.

The clean master omits all editorial copy, including the end card. Output provenance,
asset hashes, encoder details and selected frame validation accompany the delivered
artifacts under Documents/sankosurvivors/engine-trailer-20261109.
