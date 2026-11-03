#!/bin/bash
# Run tools/build-vercel.sh on a job box and copy back what it makes: .vercel/output, dist, and the ranked version
# archive (tools/vercel-api/sims/<id>/, current.txt, ground.bin) to commit. Same source, same node_modules and the same
# esbuild, so the version id matches a local build. Usage: tools/remote-build.sh <ssh host>
set -e
cd "$(dirname "$0")/.."
H="${1:?usage: remote-build.sh <ssh host>}"; R=work/sqs-build
BUILD=$(git rev-parse --short HEAD)$(git diff --quiet || echo "+$(date +%s)")
ssh "$H" "mkdir -p $R"
rsync -a --delete --exclude .git --exclude node_modules --exclude dist --exclude .vercel --exclude qa-out ./ "$H:$R/"
rsync -a --delete "$(readlink -f node_modules)/" "$H:$R/node_modules/"
ssh "$H" "cd $R && BUILD='$BUILD' VITE_ASSET_BASE_1='${VITE_ASSET_BASE_1:-}' VITE_ASSET_BASE_2='${VITE_ASSET_BASE_2:-}' nice -n 5 bash tools/build-vercel.sh"
rm -rf .vercel/output dist; mkdir -p .vercel
rsync -a "$H:$R/.vercel/output" .vercel/
rsync -a "$H:$R/dist" ./
rsync -a "$H:$R/tools/vercel-api/sims/" tools/vercel-api/sims/
rsync -a "$H:$R/tools/vercel-api/ground.bin" tools/vercel-api/ground.bin
echo "built on $H: $(cat .vercel/output/static/version.json)"
