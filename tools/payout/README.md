# Ranked payouts (the owner's laptop only)

Prizes, the house fee and refunds use the owner-local encrypted-keystore runner.
Manual live operations need owner approval. The owner separately approved the
bounded **week-0 prize/house schedule** below; refunds and future weeks are outside
that approval. Nothing on Vercel holds a wallet key or pays anyone, and job boxes
never run payouts.

With owner-applied SQL16, new plans can settle after reset once all applicable
submission windows and accepted replay claims finish. New-policy runs stop at
00:00 UTC and have five minutes for transport; already-started legacy runs retain
their 180-minute grace. Existing plans keep their original pay_at. Finality,
reserves, caps, holds and nonce checks can delay actual sends. Reset is queue
eligibility, not a guarantee of immediate confirmation.
Each prize pool pays **40% / 25% / 15% / 12% / 8%**. Missing places roll over;
the last actual winner gets rounding dust. A manual invocation defaults to dry
run: plans and previews, no key loading, signing or sending.

## Approved week-0 schedule

`scheduled.mjs --week 0` runs only from9November00:00UTC until11November00:00UTC.
It checks SQL16 availability without a valid server key before any ledger changes,
reviews candidates, previews scoped rows, then sends only those exact approved
week-0 prize/house rows. It reserves refunds but never sends them. An unrelated
in-flight transfer pauses the schedule. Confirmed completion writes a device-local
marker; uncertain/finality-pending work retries the same ledger and signed bytes.
Local journal messages are used; this scheduler does not send Telegram messages.

The checked service/timer templates live beside this README. Install them on the
owner laptop only, after SQL16 and release verification. Keep the frozen source
worktree at `%h/work/sqs-rollover-clock-1108` until the bounded window ends. The
laptop must stay awake, online and logged in; it cannot pay while offline. Check
`systemctl --user status sqs-week0-payout.timer` and
`journalctl --user -u sqs-week0-payout.service` for actual progress. The timer is
not permission for another week or refunds.

Receipt checks bind counted refund Transfer events to their transaction and block,
reject removed or repeated log indices, and preserve genuine split transfers.
Event signatures compare hex values without case sensitivity. Outgoing proof also
checks topic counts and address encoding before terminal decisions. Contradictory
failed receipts containing DMT events stay in flight; corrected proof follows the
same saved transaction, without preparing a replacement payment.
Refund sources require both the existing 20-L2-block depth/canonical checks and
Arbitrum's `finalized` checkpoint. Each invocation checks that checkpoint against
its numeric canonical header and current head. Missing or inconsistent finality
data stops new signing/broadcasts; there is no fallback to a shorter block count.
Saved refund transaction bytes recheck the source before rebroadcast too.
See [Arbitrum's confirmation model](https://developer.arbitrum.io/how-arbitrum-works/reference/finality-and-reorgs).

A planned immature refund waits while mature awards proceed. An already claimed
nonce waits in order. Prize/house payments also wait until the finalized checkpoint
has passed their week's end. Verified mined transfers can progress through the
batch while their ledger rows remain `sent`; rows become `confirmed` only after
finality. Run the tool again later to follow those same hashes. Saved bytes are
never replaced or re-signed. All live invocations still require the owner's approval.

The RPC's finality report remains trusted; this tool does not independently prove
Ethereum consensus. Entry registration keeps its existing fast canonical checks.

Before signing, the DMT budget also protects gross fees in every race without a
payout plan, including active and submission-grace pots. Planned awards, held
money and the latest rollover remain covered without counting their gross fees
again. Current/previous-week reports also cover refunds registered since the
initial ledger read, including a week-0 Hard reset refund. Imported, mined and
confirmed refunds are matched by source transaction and amount to avoid duplicate
reserves. These checks reuse the existing guarded read-only reports; no SQL update
is needed. Unavailable or inconsistent reports pause the run before signing.

This is a preflight snapshot of registered liabilities. It does not reconstruct
unregistered chain payments or independently reconcile historical entries/plans.
Keep the manual prize review and owner approval before live operations.

After preflight, a nonce claim cannot change the approved recipient, amount,
race or refund source. The tool keeps the checked source transaction and accepts
only a validated nonce reservation from the acknowledgment, before loading a key.
Inconsistent claims pause without signing; a key-loading failure leaves the
unsigned claim recoverable on a later invocation. This uses the existing SQL
contract and needs no migration.

## Current ranked rules

Week0 ends9November00:00UTC and keeps its original survival-time, then kills
order. Week1 uses Apache Desert, **Standard only at1DMT/run**, ranked by total
kills + whole seconds survived, one point each. Runs under3:00 cannot place;
equal points use KPM truncated to millionths, then kills, earlier finish and ID.
The developer wallet cannot win prizes. The legacy Hard pot schema remains for
historical recovery; the current game admits Standard only. Each pot's 10% house
fee, five shares and same-race rollover use exact integer token units.

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
4. Apply `update14.sql`, then `update15.sql` and `update16.sql` after update10. It bundles incoming-pool metadata
   (update11), atomic rate admission (update12), and the key-helper path/rotation
   hardening. The owner pastes all SQL; a prepared file is not proof it is live.
   The helper preserves the existing current and `:next` rotation slots. The
   current schema preserves already configured key hashes when pasted again;
   intentional key rotation must use the explicit owner configuration procedure.

**Re-pasting:** each file is safe to paste again, but an older file brings back older functions. After any re-paste of
`ranked.sql`, `payouts.sql` or `update6.sql`, paste `update7.sql` through `update10.sql` again,
plus update14, update15 and update16 once installed. Otherwise old permissions/restart/refund functions can return
and the recovery APIs can be missing. Reapply update9 after update5 as well.
Reapply updates14–16 after restoring older schema/security/board files so the current guard, rate admission and pool metadata stay installed. Paste required repairs
**before deploying** the new game build: the new API calls the new signatures.
Do not re-paste the base schema to install these updates; use the current update files. After a necessary full-schema re-paste, restore updates4 through10 in order, then14–16, so older overloads and grants are repaired too.
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
