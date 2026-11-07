#!/bin/bash
# Build and deploy the prebuilt site to Vercel, with the link-preview probe for crawlers.
set -e
cd "$(dirname "$0")/.."
# security pass 3: never deploy while a server secret is readable in Vercel (not Sensitive, so `vercel env pull` returns it
# to anyone or any job with the CLI login, or given to Preview builds, which run any branch's code), or while a payout or
# wallet key, CRON_SECRET or bot token is stored there at all (prizes are signed only on the laptop). A list that cannot be
# read stops the deploy too. Prints exactly what to change; never prints a value. SQS_ENV_CHECK=off skips it: emergencies only.
IFS= read -r -d '' ENV_CHECK_PY <<'PY' || true
import json, sys
# note: `vercel env ls --format json` (CLI 54) leaves out customEnvironmentIds; this project has no custom environments
SECRETS = ("SQS_TICKET_SECRET", "SQS_SERVER_KEY")
BANNED = ("PAYOUT_", "SQS_PAYOUT", "CRON_SECRET", "TG_", "WALLET", "KEYSTORE")
SAME_VALUE = r"""( umask 077; T=$(mktemp -d)
           vercel env pull "$T/p" --environment=production --yes >/dev/null 2>&1
           V=$(sed -n 's/^KEY="\(.*\)"$/\1/p' "$T/p"); rm -rf "$T"
           if [ ${#V} -ge 32 ]; then K=~/.config/sankosurvivors/KEY.recover; printf %s "$V" > "$K"; chmod 600 "$K"
             vercel env rm KEY -y && vercel env add KEY production --sensitive < "$K" && rm -f "$K" ||
               echo "add failed: the value is kept in $K (mode 600); retry: vercel env add KEY production --sensitive < $K, then delete it"
           else echo 'pull failed: nothing changed'; fi; unset V )"""
try:
    envs = json.load(sys.stdin)["envs"]
    assert isinstance(envs, list) and all(isinstance(x, dict) and isinstance(x.get("key"), str) for x in envs)
except Exception:
    print("deploy: could not read the Vercel env list (run `vercel env ls` to see why): not deploying")
    sys.exit(1)
fix = {}
for k in SECRETS:
    rows = [x for x in envs if x["key"] == k]
    if not rows:
        fix[k] = "missing. Add it as Sensitive, Production only: vercel env add " + k + " production --sensitive"
    for x in rows:
        t = x.get("target") or []
        t = sorted([t] if isinstance(t, str) else t)
        sens, prod = x.get("type") == "sensitive", t == ["production"]
        if sens and prod:
            continue
        what = ([] if sens else ["type " + str(x.get("type")) + ", must be sensitive"]) + \
               ([] if prod else ["targets " + (", ".join(t) or "a custom environment") + ", must be production only"])
        if sens:  # a Sensitive value cannot be read back, so keep it and change only where it goes
            how = "in the Vercel dashboard (Settings > Environment Variables) edit " + k + ", leave only Production ticked, keep the value"
        else:  # re-add the SAME value (a new ticket secret mid-week would void every paid but unstarted entry)
            how = "on the laptop, same value, nothing is shown:\n           " + SAME_VALUE.replace("KEY", k)
        fix[k] = "; ".join(what) + "\n    fix: " + how
for x in envs:
    k = x["key"]
    if k not in SECRETS and ("PRIVATE_KEY" in k.upper() or k.upper().startswith(BANNED)):
        fix[k] = "must not be in Vercel at all (payouts run only on the laptop). Remove it: vercel env rm " + k + " -y"
if fix:
    print("deploy: fix these Vercel env vars first, then deploy again (`vercel env ls` must then show SQS_TICKET_SECRET and SQS_SERVER_KEY as Sensitive, Production only):")
    for k, v in fix.items():
        print("  " + k + ": " + v)
    sys.exit(1)
PY
env_check() {
  if [ "${SQS_ENV_CHECK:-}" = off ]; then echo "deploy: WARNING: SQS_ENV_CHECK=off, the Vercel env check is skipped"; return 0; fi
  local L # the list stays in memory only (plain-type values are in it): never printed or written to a file
  L=$(vercel env ls --format json 2>/dev/null) || { echo 'deploy: could not read the Vercel env list (run `vercel env ls` to see why): not deploying'; exit 1; }
  printf %s "$L" | python3 -c "$ENV_CHECK_PY" || { echo "deploy: not deploying (SQS_ENV_CHECK=off skips this check, for emergencies only)"; exit 1; }
}
env_check # before anything is published or built, and again right before the deploy (a queued deploy can wait for hours)
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
# BUILD_HOST=alexbl: build the browser files on a job box and copy back only those; every server file is made here
# (tools/remote-build.sh). VERIFY_HOST=<a second box> also builds the client there and stops unless both match.
if [ -n "$BUILD_HOST" ]; then bash tools/remote-build.sh "$BUILD_HOST"; else bash tools/build-vercel.sh; fi
# PREVIEW=1 ./tools/deploy.sh -> a private preview link (team login) instead of the live site
# security pass, 3 Nov: previews get the production server and ticket keys until those are unticked for Preview in
# Vercel, so a preview build would run any code with them; refuse unless that has been done (SQS_PREVIEW_KEYS_SPLIT=1)
if [ -n "$PREVIEW" ] && [ "${SQS_PREVIEW_KEYS_SPLIT:-}" != 1 ]; then echo "deploy: previews are off until the production keys are removed from Preview in Vercel"; exit 1; fi
# owner 3 Nov: "updates should be queued for when nobody is on a ranked run": a build that changes the ranked game version
# waits until no ranked run is in progress (a run cannot finish on a version that is gone). Builds that keep the version
# (page, art, sound, menus) go out at once. FORCE_DEPLOY=1 skips the wait; if the count cannot be read, it keeps waiting;
# if the live version cannot be read, it stops (security pass 3: an empty LIVE used to skip the queue)
if [ -z "$PREVIEW" ] && [ -z "$FORCE_DEPLOY" ]; then
  NEW=$(cat tools/vercel-api/sims/current.txt)
  LIVE=$(curl -s -m 20 https://sankosurvivors.quest/version.json | python3 -c 'import json,sys; print(json.load(sys.stdin).get("sim",""))' 2>/dev/null || true)
  [ -n "$LIVE" ] || { echo "deploy: could not read the live game version; try again, or FORCE_DEPLOY=1 if you are sure no ranked run is in progress"; exit 1; }
  if [ "$NEW" != "$LIVE" ]; then
    while :; do
      N=$(bash tools/ranked-active.sh 2>/dev/null) || N="an unknown number of"
      [ "$N" = 0 ] && break
      echo "deploy: queued: this build changes the ranked game ($LIVE -> $NEW) and $N ranked run(s) are in progress; checking again in 2 minutes"
      sleep 120
    done
    echo "deploy: no ranked run in progress, going live"
  fi
fi
env_check
DEPLOY_ARGS=(deploy --prebuilt)
[ -n "$PREVIEW" ] || DEPLOY_ARGS+=(--prod)
DEPLOY_ARGS+=(--yes)
DEPLOY_RC=0
DEPLOY_OUT=$(vercel "${DEPLOY_ARGS[@]}" 2>&1) || DEPLOY_RC=$?
printf '%s\n' "$DEPLOY_OUT" | grep -E "Preview|Production|Error|error|https://" | head -3 || true
[ "$DEPLOY_RC" = 0 ] || exit "$DEPLOY_RC"
# warm jsDelivr in the background so the first players after a change do not wait on it fetching from GitHub
if [ -n "$VITE_ASSET_BASE_1" ]; then
  ( cd public/assets && find . -type f -print0 | xargs -0 -P 6 -I{} sh -c 'p=$(printf %s "$2" | sed "s#^\./##; s# #%20#g"); case "$p" in models/*|music/*|sanko/*) b=$1;; *) b=$0;; esac; curl -s -o /dev/null -m 60 "$b$p"' "$VITE_ASSET_BASE_1" "$VITE_ASSET_BASE_2" {} ) > /dev/null 2>&1 &
  echo "assets: warming jsDelivr in the background"
fi
