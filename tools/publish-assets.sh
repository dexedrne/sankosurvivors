#!/bin/bash
# Mirror public/assets into two public GitHub repos that jsDelivr serves (it caps a repo at 50 MB, so the files are
# split in two). Commits only when something changed, so each repo's last commit, and with it every file's address on
# jsDelivr, stays the same until the files really change. Prints "1 <sha>" and "2 <sha>" (the commits to pin to).
set -e
cd "$(dirname "$0")/.."
SRC=$PWD/public/assets; WORK="${SQS_ASSETS_DIR:-$HOME/work/sqs-assets}"
declare -A PARTS=([1]="world anim ui sound" [2]="models music")
P="pase""kaalex|prestig""ious|claude""-tech|/home/""alex|sk-""ant-|PRIVATE_KEY="
export GH_TOKEN=$(gh auth token --user dexedrne)
for n in 1 2; do
  repo=dexedrne/sankosurvivors-assets-$n; dir=$WORK/$n
  if [ ! -d "$dir/.git" ]; then mkdir -p "$dir"; git -C "$dir" init -q -b main; fi
  for d in ${PARTS[$n]}; do mkdir -p "$dir/$d"; rsync -a --delete "$SRC/$d/" "$dir/$d/"; done
  printf '# SankoQuest Survivors game files (%s)\n\nModels, maps, music and art for [sankosurvivors.quest](https://sankosurvivors.quest), served through jsDelivr. SankoQuest art and models belong to Sanko GameCorp.\n' "${PARTS[$n]}" > "$dir/README.md"
  if HITS=$(grep -rlIiE "$P" "$dir" --exclude-dir=.git); then echo "assets: refusing to publish part $n, check: $HITS" >&2; exit 1; fi
  cd "$dir"; git add -A
  if ! git diff --cached --quiet; then
    git -c user.name=dexedrne -c user.email=331735862+dexedrne@users.noreply.github.com commit -q -m "Game files $(date -u +%Y-%m-%d)"
    git -c credential.helper= -c 'credential.helper=!f() { echo username=dexedrne; echo "password=$GH_TOKEN"; }; f' push -q https://github.com/$repo.git main
  fi
  echo "$n $(git rev-parse HEAD)"; cd - > /dev/null
done
