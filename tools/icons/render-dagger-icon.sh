#!/usr/bin/env bash
# Draw public/assets/ui/items/item_Dagger.png from the original dagger model. Run on the build box, from the repo root:
#   bash tools/icons/render-dagger-icon.sh        (uses the one muted QA browser, then closes it)
set -euo pipefail
R=$(pwd); W=$(mktemp -d "$HOME/work/sqs-qa/tmp/dagger-icon.XXXXXX"); trap 'rm -rf "$W"' EXIT
mkdir -p "$W/dist" "$W/out"
cp tools/icons/dagger-icon.html "$W/dist/index.html"
cp public/assets/models/environment/hand_dagger.glb node_modules/three/build/three.module.js "$W/dist/"
[ -f node_modules/three/build/three.core.js ] && cp node_modules/three/build/three.core.js "$W/dist/" # newer three splits its module
mkdir -p "$W/dist/jsm"; cp -r node_modules/three/examples/jsm/loaders node_modules/three/examples/jsm/utils "$W/dist/jsm/"
QA_DIST="$W/dist" QA_W=320 QA_H=320 ICON_OUT="$W/out" node "$HOME/work/sqs-qa/kit/qa.mjs" "$R/tools/icons/dagger-icon.steps.mjs" "$W/out" icon
cat "$W/out/log.txt"
cp "$W/out/item_Dagger.png" public/assets/ui/items/item_Dagger.png
cp "$W/out/preview.png" "${ICON_PREVIEW:-/dev/null}" 2>/dev/null || true
sha256sum public/assets/ui/items/item_Dagger.png
