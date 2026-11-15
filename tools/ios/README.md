# SankoSurvivors iPhone edition

Prepared beta3: 1.0.0/build3, bundle identifier`quest.sankosurvivors.casual`. Bundled solo casual game, local saves/backups, ordinary pets, original assets/music. No wallet, paid ranked, token perks, purchases, co-op, GTS, website updater, remote API or platform SDK. Separate app storage leaves website/PWA saves in place. Progress codes remain the explicit import/export path. App review, asset permissions and Apple signing remain distinct from compiling a web bundle.

Build3 refreshes the bundled game from website0.45.56, including native menu controls and share-card image recovery. Paid membership is active. Signed archive and App Store Connect IPA export pass; the exported app has a valid deep/strict signature, debugging disabled and all 875 exact bundled web files. The signed IPA is saved in Documents/sankosurvivors/ios-beta3-20261115. Beta1 and both beta2 products remain preserved. The owner created the App Store Connect record; the single reconciled upload retry succeeded on 15 November. Apple reports the uploaded package processing. Processing completion, installation availability, tester invitations and App Review approval remain unverified. Do not repeat the upload as a health check. Physical-device and native system-transition checks remain unverified.

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
