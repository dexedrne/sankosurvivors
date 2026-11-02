#!/bin/bash
# Build and deploy the prebuilt site to Vercel, with the link-preview probe for crawlers.
set -e
cd "$(dirname "$0")/.."
BUILD=$(git rev-parse --short HEAD)$(git diff --quiet || echo "+$(date +%s)")
# ranked runs replay on the server with the rules of the version they were played on: keep every version's simulation
# (bundled) and walk data under tools/vercel-api/sims/<id>/ (commit them), and tell the game its version id
node tools/build-ground.mjs >/dev/null
SIMTMP=$(mktemp -d)
node_modules/esbuild/bin/esbuild tools/vercel-api/ranked-entry.mjs --bundle --platform=node --format=cjs --target=node22 --log-level=error --outfile=$SIMTMP/ranked-bundle.cjs
SIM=$(cat $SIMTMP/ranked-bundle.cjs tools/vercel-api/ground.bin | sha256sum | cut -c1-12)
mkdir -p tools/vercel-api/sims/$SIM
[ -f tools/vercel-api/sims/$SIM/ranked-bundle.cjs ] || { cp $SIMTMP/ranked-bundle.cjs tools/vercel-api/sims/$SIM/; cp tools/vercel-api/ground.bin tools/vercel-api/sims/$SIM/; }
echo $SIM > tools/vercel-api/sims/current.txt
rm -rf $SIMTMP
VITE_SIM=$SIM VITE_BUILD=$BUILD npx vite build >/dev/null 2>&1
rm -rf .vercel/output && mkdir -p .vercel/output/functions/preview.func .vercel/output/functions/api.func
cp -r dist .vercel/output/static
# the game compares its own build with this one to offer an Update button
printf '{"build":"%s","sim":"%s"}\n' "$BUILD" "$SIM" > .vercel/output/static/version.json
cp tools/vercel-probe/index.js .vercel/output/functions/preview.func/index.js
cp dist/index.html .vercel/output/functions/preview.func/index.html
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false}' > .vercel/output/functions/preview.func/.vc-config.json
cp tools/vercel-api/index.js .vercel/output/functions/api.func/index.js
cp tools/vercel-api/noble-crypto.cjs .vercel/output/functions/api.func/noble-crypto.cjs
cp tools/vercel-api/ranked.js .vercel/output/functions/api.func/
cp -r tools/vercel-api/sims .vercel/output/functions/api.func/sims
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs","shouldAddHelpers":false,"maxDuration":60,"memory":1024}' > .vercel/output/functions/api.func/.vc-config.json
cat > .vercel/output/config.json <<'JSON'
{"version":3,"routes":[
  {"src":"/(.*)","headers":{"X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()"},"continue":true},
  {"src":"^/(index\\.html)?$","has":[{"type":"header","key":"user-agent","value":".*(TelegramBot|Twitterbot|facebookexternalhit|Discordbot|Slackbot|WhatsApp).*"}],"dest":"/preview"},
  {"src":"^/api/(scores|score|report|run|nonce|holder|ranked-week|ranked-nonce|ranked-enter|ranked-start|ranked-submit|ranked-void)$","dest":"/api?route=$1"},
  {"handle":"filesystem"}
]}
JSON
# PREVIEW=1 ./tools/deploy.sh -> a private preview link (team login) instead of the live site
if [ -n "$PREVIEW" ]; then vercel deploy --prebuilt --yes 2>&1 | grep -E "Preview|Error|error|https://" | head -3
else vercel deploy --prebuilt --prod --yes 2>&1 | grep -E "Production|Error|error" | head -3; fi
