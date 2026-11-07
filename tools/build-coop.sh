#!/usr/bin/env bash
# Build only on alexbl; the runtime artifact needs no package install or credentials.
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:-dist-coop}"
mkdir -p "$out"
node_modules/.bin/esbuild tools/coop-relay.mjs --bundle --platform=node --target=node22 --format=esm --legal-comments=eof --banner:js='import {createRequire} from "node:module";const require=createRequire(import.meta.url);' --outfile="$out/relay.mjs"
cp node_modules/ws/LICENSE "$out/ws-LICENSE.txt"
cp public/licenses/run-escape.txt "$out/run-escape-LICENSE.txt"
