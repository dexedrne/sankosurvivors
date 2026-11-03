#!/bin/bash
# Needs @gltf-transform/cli (npx). Run after adding or updating any model.
# Compress every GLB under the game's public/assets in place: meshopt geometry at high precision + lossless WebP textures.
# A file is only replaced when the result is smaller; files already meshopt-compressed are skipped.
A="$(cd "$(dirname "$0")/.." && pwd)/public/assets"
Q="--level medium --quantize-position 16 --quantize-normal 12 --quantize-texcoord 14 --quantize-color 10 --quantize-weight 12"
T=$(mktemp -d); trap "rm -rf $T" EXIT; before=0; after=0; n=0; kept=0
while IFS= read -r -d '' f; do
  case "$f" in */models/playerCharacter/*) continue;; esac # the hero is assembled from part files on one skeleton: quantized parts break it
  n=$((n+1)); s0=$(stat -c%s "$f"); before=$((before+s0))
  if grep -q "EXT_meshopt_compression" <(head -c 4000 "$f"); then after=$((after+s0)); continue; fi
  if npx --no-install gltf-transform meshopt "$f" "$T/a.glb" $Q >/dev/null 2>&1 && npx --no-install gltf-transform webp "$T/a.glb" "$T/b.glb" --lossless true >/dev/null 2>&1; then
    s1=$(stat -c%s "$T/b.glb")
    if [ "$s1" -lt "$s0" ]; then cp "$T/b.glb" "$f.part" && mv "$f.part" "$f"; after=$((after+s1)); else after=$((after+s0)); kept=$((kept+1)); fi
  else echo "FAILED $f"; after=$((after+s0)); kept=$((kept+1)); fi
done < <(find $A -name '*.glb' -print0)
echo "files $n, left as they were $kept, $((before/1048576)) MB -> $((after/1048576)) MB"
