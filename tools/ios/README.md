# SankoSurvivors iPhone edition

Current beta: 1.0.0/build4, bundle identifier `quest.sankosurvivors.casual`. Bundled solo casual game with local saves/backups, ordinary pets and original assets/music; no wallet, paid ranked, purchases, co-op, GTS, analytics, cloud save or remote API. Separate app storage preserves website/PWA saves; progress codes are the explicit transfer path.

Build4 fixes second-finger Tumble while moving, adds Cheese→Ogre Shield and Beret→Swordstorm evolution alternatives, and allows the title backdrop up to60FPS at60/Max using elapsed animation time. Gameplay remaining at30FPS on the owner's phone is still under investigation, with LowPowerMode confirmed off. Native-only Settings→Frame diagnostics shows callback rate, draw rate, render CPU time, canvas size and last gameplay sample. These bounded readings stay in memory and are never uploaded.

All875embedded web files and the exported distribution signature/metadata are verified. Apple accepted build4 on15November and reports it processing; processing completion/device performance remain unverified. The owner installed build3 successfully through TestFlight. All previous beta products/archives are preserved. No public App Store release or App Review approval is claimed.

Web compilation and tests run on alexbl only. Native compilation/signing/simulator/device work requires the owner's M2 MacBook Air with Xcode. Use`DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` per command; no global developer-tool change or administrator prompt is needed. Never read signing credentials/keychain data/API keys; Xcode uses its existing account opaquely. No wallet action is part of this workflow.

From repository root on alexbl:

```
node --test test/ios-edition.test.mjs test/wavedash-edition.test.mjs
node tools/ios/build.mjs
cd tools/ios
npm ci --ignore-scripts --no-audit --no-fund
./node_modules/.bin/cap sync ios
```

The existing native project is source-controlled; do not run`cap add ios`again. SwiftPM pins Capacitor8.6.2. No native plugins or analytics dependencies are installed; SystemBars is part of Capacitor core. Keep `plugins.SystemBars` configured to hide the system bars. The web extractor inherits the tested wallet-free transform and fails on changed anchors. iPhone version notes and loader are local.

The app requires iOS15.4or newer because its existing profile save lock uses Web Locks. Do not lower that minimum without a working save-ownership implementation. The Capacitor Swift package's own lower framework minimum is independent of the app minimum.

After installing the app in a simulator, run the single standalone native smoke test on the Mac:

```
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project smoke/Smoke.xcodeproj -scheme Smoke -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_ID' -derivedDataPath SmokeData -resultBundlePath smoke.xcresult -only-testing:Smoke/SmokeTests/testBundledGame CODE_SIGNING_ALLOWED=NO test
```

The core test uses real XCTest taps, starts/quits a run, manually pauses/resumes and verifies that the displayed best record survives relaunch. Run`Smoke/SmokeTests/testSystemTransitions`separately for landscape and background pause. The earlier Duo simulation did not deliver rotation or an interruption callback. The latest standard-simulator system check failed during accessibility test-runner initialization before any app test; it does not establish an app defect or a fix. Those system checks remain unverified. Neither test proves physical-device audio or performance. Keep derived data/results outside the repository.

Transfer only the iOS project and audited bundled web files to`~/Developer/SankoSurvivors/`on the Mac. Preserve build logs, screenshots, source fingerprints and manifests outside the mutable build root. Do not copy website credentials or runtime configuration. Keep outputs/private Xcode user state out of git.

Use Xcode to archive and export an App Store Connect build with the owner's paid team. No certificate private keys or Apple account passwords belong in scripts. App Store metadata, privacy/support URL, encryption declaration, rating questionnaire and any requested artwork/music permission evidence must match the actual casual edition. A successful archive/export is not TestFlight processing or App Review approval.
