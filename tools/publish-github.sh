#!/bin/bash
# Mirror a clean copy of the game to the public repo github.com/dexedrne/sankosurvivors (run by deploy.sh after a live
# deploy). The public copy leaves out the captured reference material, QA kit and internal notes, refuses to publish
# anything that looks like a secret or personal detail, and is committed and pushed as dexedrne.
set -e
cd "$(dirname "$0")/.."
SRC=$PWD; PUB="${SQS_PUBLIC_DIR:-$HOME/work/sqs-public}"; REPO=dexedrne/sankosurvivors
[ -d "$PUB/.git" ] || { echo "github: no public copy at $PUB, skipped"; exit 0; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
git archive HEAD | tar -x -C "$TMP"
rm -rf "$TMP/reference" "$TMP/qa-kit" "$TMP/docs/superpowers"
find "$TMP" -maxdepth 1 -name '*.md' ! -name README.md -delete      # internal reports and notes stay private
[ -d "$TMP/docs" ] && [ -z "$(ls -A "$TMP/docs")" ] && rmdir "$TMP/docs"
# refuse on anything personal, any AI attribution, home paths or secrets (patterns split so this file never matches)
P="pase""kaalex|pase""ka|prestig""ious|claude""-tech|co-authored""-by|/home/""alex|sk-""ant-|ghp""_[A-Za-z0-9]{20}|PRIVATE_KEY=0x[0-9a-f]{64}|-----BEGIN [A-Z ]*PRIV""ATE"
if HITS=$(grep -rlIiE "$P" "$TMP" | grep -v 'package-lock.json$'); then echo "github: refusing to publish, check: ${HITS//$TMP\//}"; exit 1; fi
rsync -a --delete --exclude .git "$TMP"/ "$PUB"/
cd "$PUB"; git add -A
if git diff --cached --quiet; then echo "github: up to date"; exit 0; fi
VER=$(node -e "import('$SRC/src/changelog.js').then((m) => console.log(m.CHANGELOG[0].version))")
git -c user.name=dexedrne -c user.email=331735862+dexedrne@users.noreply.github.com commit -q -m "v$VER update ($(git -C "$SRC" rev-parse --short HEAD))"
export GH_TOKEN=$(gh auth token --user dexedrne)
git -c credential.helper= -c 'credential.helper=!f() { echo username=dexedrne; echo "password=$GH_TOKEN"; }; f' push -q https://github.com/$REPO.git main
echo "github: pushed $(git rev-parse --short HEAD)"
