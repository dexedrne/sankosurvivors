# Casual relay deployment

Prepared configuration for the existing owned VPS. This does not purchase hosting, run a deployment or change the live game. Build and test on alexbl. The website remains on Vercel; this process handles invite rooms only and never loads wallet, payment, database or player-save code.

1. Build with `bash tools/build-coop.sh` on alexbl. Copy only `dist-coop/relay.mjs`, `ws-LICENSE.txt` and `run-escape-LICENSE.txt` to a new root-owned release directory under `/opt/sankosurvivors-coop/releases/`. Use the artifact SHA256 as the directory name; verify its bytes after copying. Directories0755/files0644. No npm install, environment file or credential is needed on the VPS.
2. After the whole-branch review, point `/opt/sankosurvivors-coop/current` at that verified release and install `sqs-coop.service` as `/etc/systemd/system/sqs-coop.service`. Stop if an unrelated existing file or service occupies either name. Use `systemd-analyze verify`, then `systemctl daemon-reload` and start the dedicated service. Verify DynamicUser, restrictions, limits and loopback-only listen on8787. Do not restart any unrelated service.
3. Owner7Nov authorized DNS setup through any existing provider. The dedicated Vercel-managed A record `sankosurvivors-coop.spidertag.app` points to `178.105.224.16` (TTL60, record rec_a5bf2eeece426a9daf44a65a). Verify authoritative DNS and ordinary recursive resolution before public activation. This replaces the unavailable Porkbun setup; no website records or nameservers change. The relay connects directly to Caddy, without a CDN/proxy in front.
4. Integrate only `coop.Caddyfile` into the existing Caddy configuration. Do not read, print or copy credential values or replace unrelated routes. Validate the complete configuration opaquely with output suppressed; inspect only this dedicated fragment if validation fails. Preserve and verify other hosts when activating. A global Caddy reload can close existing WebSockets whose routes have no delay; coordinate a quiet window rather than interrupting unrelated sessions. The new route itself retains old streams for30minutes on reload.
5. Verify public DNS, a publicly trusted TLS certificate, HTTPS health, exact origin/path restrictions, canonical client-address handling, capacities, version mismatch, two external clients, reconnect and service restart. Private TLS and loopback results are preparation, not proof that the public route works.
6. Enable the public frontend URL only for the verified release. Run the required exact `BUILD_HOST=alexbl VERIFY_HOST=t490 bash tools/deploy.sh`, retain its ranked-run queue and archive the new SIM only AFTER deployment. The Wavedash edition remains solo-only until separately verified on that platform.

Rollback: stop the dedicated service and restore its previously verified release/fragment only. Do not remove shared Caddy configuration or another service. First public installation has no previous relay; return its frontend to unavailable if any public check fails. Relay restart ends unfinished casual rooms visibly; it never fabricates completion or persistent rewards.

## Trust and bounds

`--loopback-proxy` accepts X-Real-IP only from exact loopback proxy peers; the Caddy fragment overwrites that header from the actual socket remote host. Direct mode ignores all forwarding headers. Missing/malformed proxy identity is rejected. Other local processes are part of this trusted-host boundary; no untrusted tenant should run on the host.

128 WebSockets total,16 per client address,64 rooms; bounded attempts/messages/bytes/fragments/queues and recovery timers. HTTP has8KiB headers, finite timeouts and256 connections. The service has one CPU core of quota,256MiB maximum memory and32 tasks; non-root transient identity, no capabilities or privilege escalation, read-only system, hidden home/processes, private tmp/devices, loopback-only IP traffic, with outbound connection/send/io_uring calls denied even to localhost. Accepted HTTP/WebSocket streams still receive replies; the worker cannot initiate calls to other local services. No access/payload logging is enabled here. This is scoped isolation, not a universal DDoS or host-compromise guarantee.

## Retained checks

- `node --test test/coop-relay.test.mjs test/coop-client.test.mjs test/coop-server.test.mjs`
- `node qa-kit/coop-proxy.mjs <evidence> <exact-installed-caddy-binary>` on alexbl: private verifiedTLS1.3, two actual client drivers, reconnection/version/restart and spoofed forwarding limits. Its private CA is generated and deleted opaquely; no production TLS key is read.
- `sudo -n python3 qa-kit/coop-service.py <evidence> [exact-node-binary]` on alexbl: actual systemd service with public canaries verifies filesystem/home/process/tmp/IP isolation and resource policy, then removes its own unit/canaries. Positive outside-network control prevents confusing a missing endpoint with a firewall. Build the artifact as the ordinary user first. It also serves real packaged HTTP/WebSocket traffic inside the sandbox. Negative controls for home, outbound calls and source-IP restrictions must fail. `sudo -n python3 qa-kit/coop-service-collision.py <evidence>` checks preservation of caller-owned collision fixtures.
- Full offline runner, native two-client/persistence/both-edition checks, immutable replay archives and one whole-branch fresh review remain release gates.

## Two-host gameplay probe

Build the portable verifier on alexbl only. It bundles the same actual client/driver/simulation and installed transport; no package installation, account, wallet or profile is needed on the second verification host.

```sh
node_modules/.bin/esbuild qa-kit/coop-external.mjs --bundle --platform=node --target=node22 --format=esm --banner:js='import {createRequire} from "node:module";const require=createRequire(import.meta.url);' --outfile=../sqs-coop-qa-1106/coop-external.mjs
```

Copy only this public artifact, the candidate's packed `ground.bin` and MIT/BSD notices to each verification host; compare their SHA256s. Use the same candidate BUILD/SIM values and distinct new output directories. Keep resume tokens internal to the client: never capture raw packets, environment values or account files.

```sh
node coop-external.mjs host wss://sankosurvivors-coop.spidertag.app/coop ground.bin BUILD SIM new-host-output
node coop-external.mjs guest wss://sankosurvivors-coop.spidertag.app/coop ground.bin BUILD SIM new-guest-output INVITE
```

The host first verifies rejection of a mismatched build, then prints its six-character INVITE. Start the guest on the other host. Each prints READY only after at least960network frames, its own acknowledged upgrade, one load/onRun, and (for the guest) actual socket reconnect. The public endpoint additionally requires normal hostname/certificate validation and verified TLS1.2/1.3; no custom CA or insecure option exists in the probe.

When BOTH probes print READY and only these private verification rooms are present, restart only the dedicated relay. Both must end visibly without completion; the host then proves the old invite is missing. Compare RESULT.json files: at least30 common canonical frame hashes must agree, upgrade selections must differ, guest reconnected=true, host versionMismatch/oldInviteMissing=true, one load/onRun and no issues. No gameplay time/health/spawns/loadout is mutated by the observers; normal movement and choice inputs earn the evidence. Restart promptly after READY; a natural death or timeout fails the check rather than fabricating success.

`node --test test/coop-external.test.mjs` runs an actual bundled two-process/real-ground/relay-restart regression on alexbl. Loopback URLs are allowed for private testing and always produce public=false. Two-host traffic through private SSH tunnels is useful operational evidence, but does NOT prove public DNS, TLS, Caddy forwarding rules, platform UI, saves or hardware performance. Retain those separate gates before frontend activation.
