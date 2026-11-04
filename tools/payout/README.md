# Ranked payouts (the owner's laptop only)

Prizes, the house fee and refunds are paid by `node tools/payout/run.mjs`, run by hand
on the owner's laptop. It signs with the entry wallet's key, decrypted from an
encrypted Web3 v3 keystore (`KEYSTORE_PATH` + `KEYSTORE_PASSPHRASE_FILE`); a raw
wallet key in the env file is refused. Nothing on Vercel holds the wallet key or pays
anyone: the site has no payout function and no cron (security pass, 3 Nov), and a job
box never runs payouts.

Each run announces finished weeks after the 180-minute submission grace (a 2:00:00
ranked run, plus the API's 40 late minutes, plus its replay), then pays prizes/house
24 hours after Monday 00:00 UTC. Refunds are due immediately.
Each prize pool goes to five wallets: **40% / 25% / 15% / 12% / 8%**. Missing
places roll over; the last actual winner gets rounding dust. Default is **dry
run**: plans and Telegram previews, no key loading, signing or sending.

Receipt checks bind counted refund Transfer events to their transaction and block,
reject removed or repeated log indices, and preserve genuine split transfers.
Refund sources and outgoing confirmations also require the current 20-L2-block
depth and canonical-block checks. This is **soft confirmation**, not Ethereum
finality; see [Arbitrum's confirmation model](https://developer.arbitrum.io/how-arbitrum-works/reference/finality-and-reorgs).
Entry registration checks current canonical receipt consistency without adding a
new confirmation wait. No short L2 block count proves a block irreversible.

## Two pots from week 1

Week 0 (to Mon 9 Nov 00:00 UTC) has one race, Normal, ranked by won, then time,
then kills. From week 1 every week has **two races with two pots**: **Normal**
(0.5 DMT a run) and **Hard** (1.5 DMT a run, hard rules on the same map), both
ranked by kills per minute among runs of 3:00 or more. Each pot is planned on its
own (`sqs_payout_plan(key, week, plan, mode)`): its own 10% house fee (both to the
same house wallet), its own top 5, its own rollover into **the same race** next
week. The Hard chain starts at week 1 from nothing. The developer wallet wins
nothing in either race. Every payout row has a `mode` (`normal`/`hard`); refunds
take their entry's race. Holds are per week and wallet and cover both races. The
`WEEK_DMT_CAP` counts both pots of a week together. Telegram gets one results
message per pot (`Week N Normal ranked results`, `Week N Hard ranked results`).

### Upgrading the live install (paste order)

In Supabase's SQL editor, paste in this order, each file whole:

1. [tools/supabase/ranked.sql](../supabase/ranked.sql): adds the `mode` column
   (every existing entry becomes Normal), the scoring helpers and the per-race
   functions, and drops the old function signatures.
2. [tools/supabase/payouts.sql](../supabase/payouts.sql): adds `mode` to the
   payout rows and weekly plans, changes the weekly plan key to (week, mode) and the
   transfer uniqueness to (week, mode, kind, wallet). Existing plans, nonces, sent
   transfers and refunds are kept.

3. Then `update4.sql` through `update10.sql`, in order: cloud saves, boards,
   fail-closed guards, bound restarts, payout caps, permissions and recoverable submissions.
4. Apply `update11.sql` for incoming-pool metadata and `update12.sql` for atomic
   rate admission. Update12 is independent of update11. The owner pastes all SQL;
   the presence of a migration file does not mean it has been applied.

**Re-pasting:** each file is safe to paste again, but an older file brings back older functions. After any re-paste of
`ranked.sql`, `payouts.sql` or `update6.sql`, paste `update7.sql` through `update10.sql` again,
plus update11 once installed. Otherwise old permissions/restart/refund functions can return
and the recovery APIs can be missing. Reapply update9 after update5 as well.
Reapply update12 after restoring an older schema.sql; other numbered updates do not replace its helper. Paste required repairs
**before deploying** the new game build: the new API calls the new signatures.
Do not reapply the older `schema.sql` placeholders. A fresh install pastes
`schema.sql`, `ranked.sql`, `payouts.sql`, then the updates in order.

## Owner setup (laptop only)

**Never copy, select or display a key or the wallet key.** Selecting text in a
terminal sets the primary selection, which clipboard sharing can send to other
computers. Never pass a key on a command line (no `--value`), and never use a
wallet app's copy-private-key.

1. In Supabase's SQL editor, paste all of
   [tools/supabase/payouts.sql](../supabase/payouts.sql). The existing game schema
   and ranked SQL must already be installed (upgrading: see the paste order above). Reapplying this payout script keeps
   configured hashes/history; do not reapply the older `schema.sql` placeholders.
2. Make the payout key and the bot's reports key on the laptop. Each key goes
   straight into the env file and only its hash is shown:

   ```sh
   umask 077; mkdir -p ~/.config/sankosurvivors
   K=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
   printf 'PAYOUT_KEY=%s\n' "$K" >> ~/.config/sankosurvivors/payout.env
   printf %s "$K" | sha256sum      # only this hash goes into the SQL editor
   unset K
   K=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
   printf 'REPORTS_KEY=%s\n' "$K" >> ~/.config/sankosurvivors/payout.env
   printf %s "$K" | sha256sum
   unset K
   ```

   Paste only the two hashes into the SQL editor, replacing the placeholders:

   ```sql
   insert into public.sqs_admin(k,v) values
     ('payout_key_sha256','<PAYOUT_KEY_SHA256>'),
     ('reports_key_sha256','<BOT_REPORTS_KEY_SHA256>')
   on conflict(k) do update set v=excluded.v;
   ```

   The reports hash is shared by existing report tools; update those tools to the
   new reports key too.
3. Finish `~/.config/sankosurvivors/payout.env` (mode 600) from
   [payout.env.example](payout.env.example):

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | The project URL |
   | `SUPABASE_KEY` | The publishable key |
   | `REPORTS_KEY` | From step 2 (not its hash) |
   | `PAYOUT_KEY` | From step 2 (not its hash) |
   | `TG_BOT_TOKEN` | The Telegram bot token |
   | `TG_CHAT_ID` | Destination chat ID |
   | `PAYOUT_LIVE` | `0` until the dry run looks right |
   | `KEYSTORE_PATH` | Absolute path of the entry wallet's encrypted keystore (mode 600) |
   | `KEYSTORE_PASSPHRASE_FILE` | Absolute path of its passphrase file (mode 600) |

   The keystore must unlock `0xa1e6E6EE71300C238935B7d59c8983B06e991Be0`.
   `node tools/payout/check-keystore.mjs` checks the one at
   `~/Documents/sankosurvivors/ranked-wallet-keystore.json` with
   `~/.config/sankosurvivors/ranked-wallet.passphrase` (point the two variables at
   those files) and prints only the address it unlocks.
   `grep -c '^WALLET_PRIVATE_KEY=' ~/.config/sankosurvivors/payout.env` must print
   0: a raw key there stops every run.
   Optional caps: `WEEK_DMT_CAP=1000`, `TRANSFER_DMT_CAP=500`,
   `ETH_RUN_CAP=0.005`, `MAX_FEE_GWEI=2`; these are also the defaults.
4. Put a little **ETH on Arbitrum One (42161)** in the entry wallet for gas.
   **0.005 ETH is plenty for an ordinary small weekly batch** and covers the
   default per-run gas cap; actual estimates are checked before sending. Mainnet
   ETH does not pay Arbitrum gas. Keep enough DMT for prizes, house, refunds and
   reserves. Low funds pause the batch and send a deduplicated alert. Only the rows over a cap are held back (the
   rest are sent, with a notice); a row already signed and over a cap still pauses.
5. Dry run: `node tools/payout/run.mjs`. Expect `DRY RUN: sending disabled`,
   then `WOULD SEND` rows with full destinations and amounts. Telegram shows all
   five eligible winners, names/times (from week 1 kills per minute), awards,
   refunds, rollover and due time, once per pot.
   With no finished/due week, `No transfers due.` is expected; a preview cannot
   show future winners. Telegram is **sendMessage only**, so an existing bot
   can keep polling elsewhere.
6. Before a week's prizes are paid, review its top 5 (below). Then set
   `PAYOUT_LIVE=1` in the env file and run `node tools/payout/run.mjs` again.
   It shows `LIVE payout run`, then `SENT` and `CONFIRMED` hashes as transfers
   become due. Run it again later for transfers that were not due yet. To stop
   new sending, set `PAYOUT_LIVE=0`. Already broadcast transactions cannot be
   recalled.

## Review the top 5, hold a winner

A run searched offline, or replayed from saved states, passes the server's replay,
so every week's top 5 are looked at before they are paid. Week 0 ends 9 Nov 00:00
UTC, planning opens at 03:00 and prizes are due 10 Nov 00:00 UTC.

```sh
node tools/payout/review.mjs 0
```

It is read-only (reports key) and prints each race's top 5 with input statistics.
`<< REVIEW` means watch that run, never an automatic reject: gamepads also make many
input changes. For each flagged or implausible run (for example, reacting to
monsters before they are on screen), hold it:

```sh
node tools/payout/hold.mjs 0 0xFULL_WINNER_WALLET "tool-assisted run under review"
node tools/payout/hold.mjs 0 0xFULL_WINNER_WALLET --clear
```

Both take `--env /path/payout.env`; the default is
`~/.config/sankosurvivors/payout.env`. A wallet key is not needed to review, hold or
run dry. Or paste this one line in Supabase SQL editor with your payout API key and
winner:

```sql
select public.sqs_payout_hold('<PAYOUT_KEY>',0,'0xFULL_WINNER_WALLET','review this run');
```

Use `null` instead of the reason to clear it. Holds apply only to prizes, including
before planning. Once sending starts, a hold does nothing and the RPC/CLI says so.

## Build and recovery

`bash tools/build-vercel.sh` builds the site/API **without deploying**, with no payout
function and an empty cron list; `test/payout-build.test.mjs` checks that nothing in
the build scripts brings either back. `tools/deploy.sh` uses that build and then
deploys. No systemd units or server key-file setup is used.

The database lease and immutable nonce/signed transaction let the next run resume
safely after a crash or a lost connection. Never delete/reset a sending row or clear
its nonce/hash. Keep the wallet exclusive to this tool. See [PAYOUT.md](../../PAYOUT.md)
for SQL, verification, recovery and limits. Telegram attempts are at most once per
mode/week or alert condition; an ambiguous delivery failure can lose a message.
