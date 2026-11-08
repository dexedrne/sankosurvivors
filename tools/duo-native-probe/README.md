# Offline Duo screen probe

This separate app tests whether a native UIKit window/current SDK can fill the right-side region that installed Safari reserves. It shows a local checkerboard, yellow boundary/pink right edge and native/window/web geometry. A solid colour behind the clock is not success. No game code, remote URLs, wallet, secrets, save access, uploads or dependencies are included. It neither replaces nor migrates the installed game.

The owner’s M2 MacBook Air is connected over Tailscale. Xcode27.2/27B52 is installed; unsigned simulator and physical-SDK builds succeeded. The iOS27.2 Duo runtime and actual device execution are separate checks; see DUO_COOP_FEEDBACK_RELEASE_2026-11-07.md in the repository root for current evidence. Web game builds/tests stay on alexbl. The iOS probe alone uses Mac tools; Linux/static checks are not native execution proof.

On the Mac, first validate project/plist and build for Simulator without signing:

```sh
cd tools/duo-native-probe
plutil -lint Info.plist DuoScreenProbe.xcodeproj/project.pbxproj
xcodebuild -version
xcodebuild -project DuoScreenProbe.xcodeproj -target DuoScreenProbe -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
```

Then open the project in Xcode. For a physical test the owner selects their own signing team in Xcode, pairs the Duo and follows Xcode's Developer Mode instructions. No credential values need to be shared/read. Select the Duo and Run; local development install is sufficient, no App Store/TestFlight submission or paid enrollment is performed by these instructions. Signing eligibility remains the owner's existing Apple setup.

Capture fully open portrait, both landscape directions, and half-fold Flex pose. Require a visible grid plus non-null native report and builtWithSDK27.1+; a blank screen/green-only region is not passing evidence. Compare nativeView/nativeWindow/nativeWebView with webViewport/webCanvas. Record nativeStatusBarHidden and nativeSafeArea too. This is a prototype, not a promised fix; Simulator evidence is not physical-device proof. Do not import real progress or connect a wallet to this probe.

Later game integration, wallet-return handling, independent app storage/progress recovery, background audio, safe areas, ranked replay and distribution are separate gates. Existing PWA stays installed throughout.
