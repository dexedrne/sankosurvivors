#!/bin/bash
# Run tools/build-vercel.sh on a job box and copy back what it makes: .vercel/output, dist, and the ranked version
# archive (tools/vercel-api/sims/<id>/, current.txt, ground.bin) to commit. Same source, same node_modules and the same
# esbuild, so the version id matches a local build. Usage: tools/remote-build.sh <ssh host>
set -e
cd "$(dirname "$0")/.."
H="${1:?usage: remote-build.sh <ssh host>}"; R=work/sqs-build
BUILD=$(git rev-parse --short HEAD)$(git diff --quiet || echo "+$(date +%s)")
ssh "$H" "mkdir -p $R"
# --checksum: a file changed on the job box but with the same size and time is put back too (security pass, 3 Nov)
rsync -a --checksum --delete --exclude .git --exclude node_modules --exclude dist --exclude .vercel --exclude qa-out ./ "$H:$R/"
rsync -a --checksum --delete "$(readlink -f node_modules)/" "$H:$R/node_modules/"
ssh "$H" "cd $R && BUILD='$BUILD' VITE_ASSET_BASE_1='${VITE_ASSET_BASE_1:-}' VITE_ASSET_BASE_2='${VITE_ASSET_BASE_2:-}' nice -n 5 bash tools/build-vercel.sh"
rm -rf .vercel/output dist; mkdir -p .vercel
rsync -a "$H:$R/.vercel/output" .vercel/
rsync -a "$H:$R/dist" ./
rsync -a "$H:$R/tools/vercel-api/sims/" tools/vercel-api/sims/
rsync -a "$H:$R/tools/vercel-api/ground.bin" tools/vercel-api/ground.bin
# trust only the browser files from the job box: the server code is put back from this machine, and the ranked game
# bundle it made must be byte for byte what this machine makes from the same source
F=.vercel/output/functions
cp tools/vercel-api/index.js tools/vercel-api/noble-crypto.cjs tools/vercel-api/ranked.js tools/vercel-api/cloud.js $F/api.func/
cp tools/vercel-probe/index.js $F/preview.func/index.js
node_modules/esbuild/bin/esbuild tools/payout/vercel.mjs --bundle --platform=node --format=cjs --target=node22 --log-level=error --footer:js='module.exports = module.exports.default;' --outfile=$F/payout.func/index.js
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
node_modules/esbuild/bin/esbuild tools/vercel-api/ranked-entry.mjs --bundle --platform=node --format=cjs --target=node22 --log-level=error --outfile=$T/rb.cjs
SIMID=$(cat tools/vercel-api/sims/current.txt)
cmp -s $T/rb.cjs tools/vercel-api/sims/$SIMID/ranked-bundle.cjs || { echo "remote build: the ranked bundle from $H differs from a local build: not deploying"; exit 1; }
[ "$(cat $T/rb.cjs tools/vercel-api/ground.bin | sha256sum | cut -c1-12)" = "$SIMID" ] || { echo "remote build: version id mismatch: not deploying"; exit 1; }
rm -rf $F/api.func/sims && cp -r tools/vercel-api/sims $F/api.func/sims # every archived version, from this machine
echo "built on $H: $(cat .vercel/output/static/version.json)"
