#!/bin/bash
# Build the prebuilt site and functions locally. No Vercel command or credentials needed.
set -e
cd "$(dirname "$0")/.."
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
echo $SIM > tools/vercel-api/sims/current.txt
rm -rf $SIMTMP
VITE_SIM=$SIM VITE_BUILD=$BUILD npx vite build >/dev/null 2>&1
rm -rf .vercel/output && mkdir -p .vercel/output/functions/preview.func .vercel/output/functions/api.func .vercel/output/functions/payout.func
cp -r dist .vercel/output/static
# the game compares its own build with this one to offer an Update button
printf '{"build":"%s","sim":"%s"}\n' "$BUILD" "$SIM" > .vercel/output/static/version.json
cp tools/vercel-probe/index.js .vercel/output/functions/preview.func/index.js
cp dist/index.html .vercel/output/functions/preview.func/index.html
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false}' > .vercel/output/functions/preview.func/.vc-config.json
cp tools/vercel-api/index.js .vercel/output/functions/api.func/index.js
cp tools/vercel-api/noble-crypto.cjs .vercel/output/functions/api.func/noble-crypto.cjs
cp tools/vercel-api/ranked.js .vercel/output/functions/api.func/
cp tools/vercel-api/cloud.js .vercel/output/functions/api.func/
cp -r tools/vercel-api/sims .vercel/output/functions/api.func/sims
# 800 s, a full vCPU: ranked-submit replays the whole run, and endless ranked runs last up to 2:00:00 (about 143 s
# locally, 5-7 min here; RANKED2.md has the timings)
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false,"maxDuration":800,"memory":2048}' > .vercel/output/functions/api.func/.vc-config.json
# Bundle server code without substituting environment values; secrets exist only at runtime.
node_modules/esbuild/bin/esbuild tools/payout/vercel.mjs --bundle --platform=node --format=cjs --target=node22 --log-level=error --footer:js='module.exports = module.exports.default;' --outfile=.vercel/output/functions/payout.func/index.js
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false,"maxDuration":300}' > .vercel/output/functions/payout.func/.vc-config.json
cat > .vercel/output/config.json <<'JSON'
{"version":3,"routes":[
  {"src":"/(.*)","headers":{"X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()"},"continue":true},
  {"src":"^/assets/[^/]+-[A-Za-z0-9_-]{8,}\\.(js|css)$","headers":{"Cache-Control":"public, max-age=31536000, immutable"},"continue":true},
  {"src":"^/assets/(models|world|music|sound|anim|ui|draco)/.*$","headers":{"Cache-Control":"public, max-age=86400, stale-while-revalidate=604800"},"continue":true},
  {"src":"^/(index\\.html)?$","has":[{"type":"header","key":"user-agent","value":".*(TelegramBot|Twitterbot|facebookexternalhit|Discordbot|Slackbot|WhatsApp).*"}],"dest":"/preview"},
  {"src":"^/api/(scores|score|report|run|nonce|holder|ranked-week|ranked-nonce|ranked-enter|ranked-start|ranked-submit|ranked-void|save-nonce|save-login|save-get|save-put)$","dest":"/api?route=$1"},
  {"src":"^/api/payout-cron$","dest":"/payout"},
  {"handle":"filesystem"}
],"crons":[{"path":"/api/payout-cron","schedule":"*/15 * * * *"}]}
JSON
