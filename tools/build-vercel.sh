#!/bin/bash
# Build the prebuilt site and functions locally. No Vercel command or credentials needed.
set -e
cd "$(dirname "$0")/.."
node tools/build-crypto.mjs --check
BUILD=${BUILD:-$(git rev-parse --short HEAD)$(git diff --quiet || echo "+$(date +%s)")} # tools/remote-build.sh passes it in
# ranked runs replay on the server with the rules of the version they were played on: keep every version's simulation
# (bundled) and walk data under tools/vercel-api/sims/<id>/ (commit them), and tell the game its version id
node tools/build-fences.mjs >/dev/null # fences as walls, read by build-ground and the browser
node tools/build-ground.mjs >/dev/null
SIMTMP=$(mktemp -d)
node_modules/esbuild/bin/esbuild tools/vercel-api/ranked-entry.mjs --bundle --platform=node --format=cjs --target=node22 --log-level=error --outfile=$SIMTMP/ranked-bundle.cjs
SIM=$(cat $SIMTMP/ranked-bundle.cjs tools/vercel-api/ground.bin | sha256sum | cut -c1-12)
mkdir -p tools/vercel-api/sims/$SIM
[ -f tools/vercel-api/sims/$SIM/ranked-bundle.cjs ] || { cp $SIMTMP/ranked-bundle.cjs tools/vercel-api/sims/$SIM/; cp tools/vercel-api/ground.bin tools/vercel-api/sims/$SIM/; }
# when each version goes live, for the server's refund check (a run is refunded only if it was alive when its version was replaced)
[ "$(cat tools/vercel-api/sims/current.txt 2>/dev/null)" = "$SIM" ] || echo "$(date +%s)000 $SIM" >> tools/vercel-api/sims/history.txt
echo $SIM > tools/vercel-api/sims/current.txt
rm -rf $SIMTMP
# SQS_PREBUILT_DIST=1: tools/remote-build.sh brought dist (the browser files only) back from the job box, so no vite here;
# everything the server runs below is still made from this tree (security pass 3)
if [ -n "${SQS_PREBUILT_DIST:-}" ]; then [ -f dist/index.html ] || { echo "build-vercel: SQS_PREBUILT_DIST is set but there is no dist/index.html"; exit 1; }
else VITE_SIM=$SIM VITE_BUILD=$BUILD node_modules/.bin/vite build >/dev/null 2>&1; fi # the repo's own vite, never a downloaded one
rm -rf .vercel/output && mkdir -p .vercel/output/functions/preview.func .vercel/output/functions/api.func
# no payout function here (security pass, 3 Nov): prizes are signed only on the owner's laptop, from the encrypted keystore
# (node tools/payout/run.mjs), so no deployed function ever holds the entry wallet's key
cp -r dist .vercel/output/static
# Browser and API admission share the exact build identity supplied to Vite.
node - "$BUILD" "$SIM" <<'JS'
const [build,sim]=process.argv.slice(2);
if (!/^[A-Za-z0-9+._-]{1,80}$/.test(build) || build==='dev' || !/^[0-9a-f]{12}$/.test(sim)) throw Error('Invalid build identity');
require('node:fs').writeFileSync('.vercel/output/static/version.json', JSON.stringify({build,sim})+'\n');
JS
cp tools/vercel-probe/index.js .vercel/output/functions/preview.func/index.js
cp dist/index.html .vercel/output/functions/preview.func/index.html
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false}' > .vercel/output/functions/preview.func/.vc-config.json
cp tools/vercel-api/index.js .vercel/output/functions/api.func/index.js
cp tools/vercel-api/noble-crypto.cjs .vercel/output/functions/api.func/noble-crypto.cjs
cp tools/vercel-api/noble-LICENSE.txt .vercel/output/functions/api.func/
cp tools/vercel-api/ranked.js .vercel/output/functions/api.func/
cp tools/vercel-api/cloud.js .vercel/output/functions/api.func/
cp -r tools/vercel-api/sims .vercel/output/functions/api.func/sims
cp .vercel/output/static/version.json .vercel/output/functions/api.func/sims/client.json
# 800 s, a full vCPU: ranked-submit replays the whole run, and endless ranked runs last up to 2:00:00 (about 143 s
# locally, 5-7 min here; RANKED2.md has the timings)
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false,"maxDuration":800,"memory":2048}' > .vercel/output/functions/api.func/.vc-config.json
# Bundle server code without substituting environment values; secrets exist only at runtime.
cat > .vercel/output/config.json <<'JSON'
{"version":3,"routes":[
  {"src":"/(.*)","headers":{"X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()","X-Frame-Options":"DENY","Content-Security-Policy":"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'"},"continue":true},
  {"src":"^/assets/[^/]+-[A-Za-z0-9_-]{8,}\\.(js|css)$","headers":{"Cache-Control":"public, max-age=31536000, immutable"},"continue":true},
  {"src":"^/assets/(models|world|music|sound|anim|ui|draco)/.*$","headers":{"Cache-Control":"public, max-age=86400, stale-while-revalidate=604800"},"continue":true},
  {"src":"^/fun/racers/(racers-[0-9a-f]{16}\\.(js|css)|preview-[0-9a-f]{12}\\.png)$","headers":{"Cache-Control":"public, max-age=31536000, immutable"},"continue":true},
  {"src":"^/assets/racers/world/tiles/(fences-[0-9a-f]{12}\\.json|surfaces-[0-9a-f]{12}\\.bin)$","headers":{"Cache-Control":"public, max-age=31536000, immutable"},"continue":true},
  {"src":"^/(index\\.html)?$","has":[{"type":"host","value":{"eq":"gts.sankosurvivors.quest"}}],"dest":"/racers/index.html"},
  {"src":"^/(index\\.html)?$","has":[{"type":"header","key":"user-agent","value":".*(TelegramBot|Twitterbot|facebookexternalhit|Discordbot|Slackbot|WhatsApp).*"}],"dest":"/preview"},
  {"src":"^/api/(scores|score|report|run|nonce|holder|ranked-week|ranked-version|ranked-nonce|ranked-enter|ranked-start|ranked-clock|ranked-submit|ranked-void|save-nonce|save-login|save-get|save-put)$","dest":"/api?route=$1"},
  {"handle":"filesystem"}
],"crons":[]}
JSON
