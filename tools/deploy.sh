#!/bin/bash
# Build and deploy the prebuilt site to Vercel, with the link-preview probe for crawlers.
set -e
cd "$(dirname "$0")/.."
bash tools/build-vercel.sh
# PREVIEW=1 ./tools/deploy.sh -> a private preview link (team login) instead of the live site
if [ -n "$PREVIEW" ]; then vercel deploy --prebuilt --yes 2>&1 | grep -E "Preview|Error|error|https://" | head -3
else vercel deploy --prebuilt --prod --yes 2>&1 | grep -E "Production|Error|error" | head -3; fi
# a live deploy also refreshes the public GitHub copy (clean snapshot, scanned); a GitHub problem never fails a deploy
if [ -z "$PREVIEW" ]; then bash tools/publish-github.sh || echo "github: not refreshed (see above)"; fi
