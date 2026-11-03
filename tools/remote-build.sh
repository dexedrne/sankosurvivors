#!/bin/bash
# Build the browser files (dist) on a job box and copy back only those. Every server file is made here by build-vercel.sh.
# Same source and the same node_modules, so the client is built for the version id this machine computes.
# VERIFY_HOST=<a second, independent box> also builds the client there and refuses to deploy unless both are byte-identical.
# Usage: VERIFY_HOST=<ssh host> tools/remote-build.sh <ssh host>   (or SQS_TRUST_BUILD_HOST=1 to skip the second build)
set -e
cd "$(dirname "$0")/.."
H="${1:?usage: remote-build.sh <ssh host>}"; R=work/sqs-build
[ "${VERIFY_HOST:-}" != "$H" ] || { echo "remote build: VERIFY_HOST must be a different box from $H"; exit 1; }
# fail closed (security pass 3 review): the client builds every DMT payment, so a client built on one box alone needs an
# explicit SQS_TRUST_BUILD_HOST=1
[ -n "${VERIFY_HOST:-}" ] || [ "${SQS_TRUST_BUILD_HOST:-}" = 1 ] || { echo "remote build: set VERIFY_HOST=<a second box> (or SQS_TRUST_BUILD_HOST=1 to ship a client built only on $H)"; exit 1; }
BUILD=$(git rev-parse --short HEAD)$(git diff --quiet || echo "+$(date +%s)")
ssh "$H" "mkdir -p $R"
# --checksum: a file changed on the job box but with the same size and time is put back too (security pass, 3 Nov)
rsync -a --checksum --delete --exclude .git --exclude node_modules --exclude dist --exclude .vercel --exclude qa-out ./ "$H:$R/"
rsync -a --checksum --delete "$(readlink -f node_modules)/" "$H:$R/node_modules/"
ssh "$H" "cd $R && BUILD='$BUILD' VITE_ASSET_BASE_1='${VITE_ASSET_BASE_1:-}' VITE_ASSET_BASE_2='${VITE_ASSET_BASE_2:-}' nice -n 5 bash tools/build-vercel.sh"
rm -rf .vercel/output dist
# only the browser files come back from the job box, as plain files; everything the server runs (fences, walk data, the
# ranked bundle, sims/, current.txt, history.txt, functions, .vc-config.json, config.json) is made here from this tree
# (security pass 3: an archived sims/<id>/ bundle or an extra function from the box would run with the server's keys)
rsync -r --no-links --no-devices --no-specials "$H:$R/dist" ./
V=$(mktemp -d); trap 'rm -rf "$V"' EXIT
if [ -n "${VERIFY_HOST:-}" ]; then # a second, independent box must build a byte-identical client
  ssh "$VERIFY_HOST" "mkdir -p $R"
  rsync -a --checksum --delete --exclude .git --exclude node_modules --exclude dist --exclude .vercel --exclude qa-out ./ "$VERIFY_HOST:$R/"
  rsync -a --checksum --delete "$(readlink -f node_modules)/" "$VERIFY_HOST:$R/node_modules/"
  ssh "$VERIFY_HOST" "cd $R && BUILD='$BUILD' VITE_ASSET_BASE_1='${VITE_ASSET_BASE_1:-}' VITE_ASSET_BASE_2='${VITE_ASSET_BASE_2:-}' nice -n 5 bash tools/build-vercel.sh"
  rsync -r --no-links --no-devices --no-specials "$VERIFY_HOST:$R/dist" "$V/"
  diff -rq dist "$V/dist" >/dev/null || { echo "remote build: $H and $VERIFY_HOST built different clients: not deploying"; exit 1; }
  echo "remote build: $VERIFY_HOST built the same client"
fi
SQS_PREBUILT_DIST=1 BUILD="$BUILD" bash tools/build-vercel.sh
SIMID=$(cat tools/vercel-api/sims/current.txt)
grep -rqF "$SIMID" dist/assets || { rm -rf .vercel/output; echo "remote build: the client from $H is not built for game version $SIMID: not deploying"; exit 1; }
echo "built on $H: $(cat .vercel/output/static/version.json)"
