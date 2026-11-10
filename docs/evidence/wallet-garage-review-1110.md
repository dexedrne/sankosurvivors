# Wallet cancellation and public hub garage source review

Reviewed 10 November 2026. Read-only independent source review; no product edits, Git mutations, browser runs, network writes, signatures, transactions or player-state access.

Main baseline: `a622da757a719c1adaeb9af8060b4283bb7be5c2` in `SQS workspace`.
Racers baseline: `f20b1a90522e9c399d29ae3dbf85b776a75b8b61` in `Racers workspace`.

## Verdict

**0 Critical, 0 Important. Source changes accepted, subject to the coordinating agent's test, native UI and deployment gates.** This is not browser or production acceptance.

Main change gives one connection attempt ownership before SDK loading, shows Cancel immediately, and prevents retired SDK generations from adopting accounts or clearing newer readiness. The garage exposes actual validated hub snapshots and folds secondary controls using existing native elements.

## Reviewed behavior

- Traced every helper request branch, existing wallet selection/passive restore caller, modal render/back handlers and changed locale strings.
- Cancellation promptly rejects while import, SDK initialization or pairing remains pending. Both pre-init and post-init generation checks prevent retired work from restoring accounts; late initialized SDKs close independently.
- Old failures cannot reset a newer ready promise. Old pairing events and finalizers cannot replace or hide a newer attempt's screen.
- Retirement clears local ownership before awaiting disconnect. Cancellation during retirement leaves the attempt invalidated; the continuation checks ownership before constructing or using its replacement.
- Passive restore and explicit connection may share initialization; cancel invalidates that generation. The outer wallet selection generation guards prevent late passive restoration from replacing a newer user choice.
- An approved connection has no pending pairing to cancel. Back during an approved signature/transaction request only hides that request screen. Payload forwarding, chain binding and result/error forwarding remain unchanged; no financial retry path was added.
- Revoke of an unused helper does not import the SDK. Revoke during loading cancels the attempt and cannot initialize a replacement.
- Presence consumes the existing validated hub state. Connected-before-snapshot, connecting, disconnected and self-only states do not invent users. Counts identify inclusion of self only when the snapshot contains self.
- Names use textContent. Rosters clear offline and rebuild only for identity/name/self changes, not changing car positions. Work is bounded by the existing 16-driver limit.
- Existing control IDs remain unique. Solo controls remain under native details; selected solo modes reopen the fold. Existing controller filtering excludes closed-details descendants. Network protocol, server, physics and assets are outside the product diff.
- Both tracked diffs passed `git diff --check`.

## Initial minor observation — resolved in final polish

The initial review found repeated `root.dataset.state` and `empty.hidden` writes on unchanged snapshots. Final polish adds equality guards, also guards roster visibility, and adds a regression that counts attribute writes on position-only updates. This observation is resolved.

## Validation limits

Read the new lifecycle, modal, presence and markup tests plus existing wallet/controller/hub tests. Did not execute tests or builds in this review; coordinating agent owns remote test evidence. Did not run a browser. Native desktop/phone/Duo geometry, short-landscape chat overlap, wallet loading/cancel/retry interactions, and real peer/disconnect/reconnect flows still need the coordinating agent's gate. Existing controller navigation is scoped to the panel/dialog while chat lives outside it; the new Chat button should be exercised in that native pass. Physical phone wallet pairing, Safari, controller hardware and performance remain device checks.

## Reviewed source fingerprints

Main:

```text
110205a8580d9bea289728b271f94eff3a4827096a36f63b497ea52dcde21a8e  src/wallet-connect.js
0889826f6e04f1ac508929918771fba483dfa3792e0c8b92176e02eb61dd7bf2  src/main.js
8a28849cb962e8d93e74350faa0a06105061991d960a74b153ac7c94220c24b9  test/wallet-connect.test.mjs
f0af7948b5960995f54511818690a3a062ab0b0be8daee5ae477b25e9a9e4aa8  test/pwa-wallet-modal.test.mjs
```

Racers:

```text
42df6c1c474db45ed05b499fc558392e1314b1c8d8c3cecf751e6852ffae4f3d  index.html
88475fece14c8d7d3b831b430128ea6af31f677125c07fcb877252fcdd4f60b4  src/main.js
e985843ba6b58bb79277fa489003cc929541dacd4578d6ade2b025df287f6294  src/style.css
ed4bc4218345ce8b86069f6667a1ba245dd7d8c8306fa671fae901971c3b9624  src/hub-presence.js
fed8af50c89dad031d568c5c8cf9323435be45f647a9cbb5967b922163bf1bc6  test/hub-presence.test.mjs
```

Not checked: remote test/build execution, browser appearance, production deployment or physical hardware. No product or release mutations were performed.

## Final polish review

Fresh review of the full current Racer diff plus main release notes/locales: **0 Critical, 0 Important.** Main wallet helper remains byte-identical to the reviewed SHA above. The original source verdict remains accepted subject to release gates.

Reviewed compact heading/private-race button, hidden redundant self roster, folded nested controls, accessible hidden Vehicle label, closed-chat visibility, mode switching, and Chat Escape. Escape prevents propagation before closing chat, so it does not activate the game's Escape start/pause handler. In setup it restores focus to the visible Chat action. Existing hidden-details focus filtering also excludes children of the newly nested controls fold. Public hub is hidden only while already selected and returns when another mode is chosen. Error/disconnected network statuses remain visible while redundant normal status text is hidden. No protocol, physics, assets or wallet behavior is introduced by the polish.

The current release descriptions match the source behavior and do not promise artificial activity or new networking. Turkish, Spanish and Filipino entries include both the new title/items and loading message.

One minor feedback edge was sent to root: while Connecting, the status element was hidden but Reconnect remained available. An empty name followed by Reconnect wrote its validation error without unhiding that element. Root fixed `src/main.js:165` to set `hub-status.hidden=false` in the invalid-name branch. Fresh source read confirms that exact correction; the tracked diff still passes `git diff --check`. **Final source verdict: 0 Critical, 0 Important, 0 open Minor.**

Root reports final 237 Racer tests passing (6.855s), build passing (6.18s), main focused 65 passing, and native desktop 1280 / phone 393 / Duo 867 checks with real hub joins/leaves, chat focus and offline transitions passing. These are coordinating-agent results, not independently executed by this reviewer. The original lane's checked-in evidence still records its earlier 236-test run; do not confuse those two checkpoints. Main causal native baseline and full release gates were still in progress at this review request.

Final-polish fingerprints (before the minor invalid-name visibility correction):

```text
0f5b1dd705d642f1807c98841da911a8ee7f219c4ccc6e29e9eac6d4181651c5  index.html
9db1ac4cf1214fa20e528cf04645045665fcb0757ff9c17a989bdbefdfa5559f  src/main.js
6eba3bbb290e97d1fc6cd1dbe6b6e6e9b8987bb67bf996bc4471205bb943c4d2  src/style.css
cc9cd2506ccbde076bfaf377add15b0eb49a6e3bb0a11fc52d5c6ece794f63af  src/hub-presence.js
20e1055bdbf0bd14f5606ea8e5332b27c1e9a64c28dcabbcd842136520e29ecb  test/hub-presence.test.mjs
75525a047e32b43abf5f1b5ab6acc75a7796e184dcb362f26c86fd31374d5a0e  src/updates.js
```

Both final tracked diffs pass `git diff --check`. No independent browser, test/build, deployment or device claim is made.

Final accepted Racer `src/main.js` SHA after validation-message correction: `57f6844573cd633b04e9cb20e92caef908739ee7243c34f311098db6acdbbd61`. All other final-polish fingerprints above remain the reviewed checkpoint. Root reports the final 237-test/build rerun in progress. The old native baseline reproduced missing cancellation during held import, but two unrelated stub 404s remain under root investigation; this review does not count it as an error-free native baseline. Final native and release acceptance remain root-owned gates.
