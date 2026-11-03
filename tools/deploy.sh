#!/bin/bash
# Build and deploy the prebuilt site to Vercel, with the link-preview probe for crawlers.
set -e
cd "$(dirname "$0")/.."
# Live deploys: refresh the public GitHub copy first (clean snapshot, scanned), then point the game's files at jsDelivr,
# pinned to the public commit that last changed public/assets, so players fetch them from jsDelivr instead of Vercel and
# unchanged files keep the same address (and stay cached) from one deploy to the next. A GitHub problem never fails a
# deploy: the files are then served by Vercel as before.
unset VITE_ASSET_BASE_1 VITE_ASSET_BASE_2
if [ -z "$PREVIEW" ] && [ -z "$NO_CDN" ]; then
  bash tools/publish-github.sh || echo "github: not refreshed (see above)"
  if OUT=$(bash tools/publish-assets.sh); then
    S1=$(echo "$OUT" | awk '$1==1{print $2}'); S2=$(echo "$OUT" | awk '$1==2{print $2}')
    B1="https://cdn.jsdelivr.net/gh/dexedrne/sankosurvivors-assets-1@$S1/"; B2="https://cdn.jsdelivr.net/gh/dexedrne/sankosurvivors-assets-2@$S2/"
    if curl -sf -o /dev/null -m 30 "${B1}ui/items/item_Gold.png" && curl -sf -o /dev/null -m 30 "${B2}models/mobs/Skelly.glb"; then
      export VITE_ASSET_BASE_1="$B1" VITE_ASSET_BASE_2="$B2"; echo "assets: jsDelivr @ ${S1:0:7} / ${S2:0:7}"
    else echo "assets: jsDelivr not reachable, served by Vercel"; fi
  else echo "assets: not published (see above), served by Vercel"; fi
fi
# BUILD_HOST=alexbl: build on a job box and copy the result back (the laptop only orchestrates; it overheats)
if [ -n "$BUILD_HOST" ]; then bash tools/remote-build.sh "$BUILD_HOST"; else bash tools/build-vercel.sh; fi
# PREVIEW=1 ./tools/deploy.sh -> a private preview link (team login) instead of the live site
# security pass, 3 Nov: previews get the production server and ticket keys until those are unticked for Preview in
# Vercel, so a preview build would run any code with them; refuse unless that has been done (SQS_PREVIEW_KEYS_SPLIT=1)
if [ -n "$PREVIEW" ] && [ "${SQS_PREVIEW_KEYS_SPLIT:-}" != 1 ]; then echo "deploy: previews are off until the production keys are removed from Preview in Vercel"; exit 1; fi
if [ -n "$PREVIEW" ]; then vercel deploy --prebuilt --yes 2>&1 | grep -E "Preview|Error|error|https://" | head -3
else vercel deploy --prebuilt --prod --yes 2>&1 | grep -E "Production|Error|error" | head -3; fi
# warm jsDelivr in the background so the first players after a change do not wait on it fetching from GitHub
if [ -n "$VITE_ASSET_BASE_1" ]; then
  ( cd public/assets && find . -type f -print0 | xargs -0 -P 6 -I{} sh -c 'p=$(printf %s "$2" | sed "s#^\./##; s# #%20#g"); case "$p" in models/*|music/*) b=$1;; *) b=$0;; esac; curl -s -o /dev/null -m 60 "$b$p"' "$VITE_ASSET_BASE_1" "$VITE_ASSET_BASE_2" {} ) > /dev/null 2>&1 &
  echo "assets: warming jsDelivr in the background"
fi
