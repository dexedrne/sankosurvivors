# Ranked payouts on Vercel

The game's **sankoquest-survivors** Vercel project runs `/api/payout-cron` every
15 minutes in Production. It announces finished weeks after the 56-minute submit
grace, then pays prizes/house 24 hours after Monday 00:00 UTC. Refunds are due
immediately. The prize pool goes to five wallets: **40% / 25% / 15% / 12% / 8%**.
Missing places roll over; the last actual winner gets rounding dust. Default is
**dry run**: plans and Telegram previews, no key loading, signing or sending.

## Owner setup

1. In Supabase's SQL editor, paste all of
   [tools/supabase/payouts.sql](../supabase/payouts.sql). The existing game schema
   and ranked SQL must already be installed. Reapplying this payout script keeps
   configured hashes/history; do not reapply the older `schema.sql` placeholders.
2. On your own trusted computer, run this one-line command **twice** to make two
   independent keys and their hashes. Keep the generated values private:

   ```sh
   node -e 'const c=require("node:crypto"),key=c.randomBytes(32).toString("hex");console.log(JSON.stringify({key,sha256:c.createHash("sha256").update(key).digest("hex")}))'
   ```

   Use one for the payout key, one for the bot's reports key. Paste only their
   hashes into the SQL editor, replacing the placeholders:

   ```sql
   insert into public.sqs_admin(k,v) values
     ('payout_key_sha256','<PAYOUT_KEY_SHA256>'),
     ('reports_key_sha256','<BOT_REPORTS_KEY_SHA256>')
   on conflict(k) do update set v=excluded.v;
   ```

   The reports hash is shared by existing report tools; update those tools to the
   new reports key too. Run the generator a third time for `CRON_SECRET` (use its
   key, no database hash needed).
3. Open Vercel → **sankoquest-survivors → Settings → Environment Variables**.
   Select **Production**. Type these values into the dashboard:

   | Variable | Value | Sensitive |
   | --- | --- | --- |
   | `SUPABASE_URL` | Already configured project URL | Existing |
   | `SUPABASE_KEY` | Already configured publishable key | Existing |
   | `SQS_PAYOUT_REPORTS_KEY` | New reports key, not its hash | Yes |
   | `SQS_PAYOUT_KEY` | New payout key, not its hash | Yes |
   | `PAYOUT_WALLET_PRIVATE_KEY` | Entry wallet private key | Yes |
   | `TG_BOT_TOKEN` | Your existing Telegram bot token | Yes |
   | `TG_CHAT_ID` | Destination chat ID | No |
   | `CRON_SECRET` | Third independent random key | Yes |
   | `PAYOUT_LIVE` | `0` for the first deployment | No |

   Mark all five **Yes** entries Sensitive; newer dashboards call this type
   **Secret**. They are write-only after saving. Do not download them to a server
   or put the wallet key in source/build files. The key must derive to
   `0xa1e6E6EE71300C238935B7d59c8983B06e991Be0`.
   [Vercel's Secret-variable instructions](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

   Optional caps: `WEEK_DMT_CAP=1000`, `TRANSFER_DMT_CAP=500`,
   `ETH_RUN_CAP=0.005`, `MAX_FEE_GWEI=2`; these are also the defaults.
4. Put a little **ETH on Arbitrum One (42161)** in the entry wallet for gas.
   **0.005 ETH is plenty for an ordinary small weekly batch** and covers the
   default per-run gas cap; actual estimates are checked before sending. Mainnet
   ETH does not pay Arbitrum gas. Keep enough DMT for prizes, house, refunds and
   reserves. Low funds/cap breaches pause the batch and send a deduplicated alert.
5. Deploy through the game's normal release process (owner action, e.g.
   `./tools/deploy.sh`). Wait for the next Production cron. View the function
   logs for `/api/payout-cron` and Telegram. Expect `DRY RUN: sending disabled`,
   then `WOULD SEND` rows with full destinations and amounts. Telegram shows all
   five eligible winners, names/times, awards, refunds, rollover and due time.
   With no finished/due week, `No transfers due.` is expected; a preview cannot
   show future winners. Missing config returns 503 with a fixed configuration log.
   Cron auth without the correct secret returns 401. The scheduled header is sent
   automatically by Vercel. Telegram is **sendMessage only**, so an existing bot
   can keep polling elsewhere.
6. After checking the dry preview, set `PAYOUT_LIVE=1` in Production and **redeploy**.
   Logs show `LIVE payout cron`, then `SENT` and `CONFIRMED` hashes as transfers
   become due. To stop new sending, set `PAYOUT_LIVE=0` and redeploy. Already
   broadcast transactions cannot be recalled. A 15-minute cron needs a Vercel plan
   supporting that frequency; Hobby permits only daily schedules.
   [Cron authentication and limits](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## Hold a winner

On your trusted computer, copy `payout.env.example` to a private env file
(`chmod 600`), using `REPORTS_KEY`/`PAYOUT_KEY` for the same keys named
`SQS_PAYOUT_REPORTS_KEY`/`SQS_PAYOUT_KEY` on Vercel. Fill its other required fields.
A wallet key is unnecessary to hold or run dry. Then:

```sh
node tools/payout/hold.mjs 0 0xFULL_WINNER_WALLET "review this run" --env /path/payout.env
node tools/payout/hold.mjs 0 0xFULL_WINNER_WALLET --clear --env /path/payout.env
```

Or paste this one line in Supabase SQL editor with your payout API key and winner:

```sql
select public.sqs_payout_hold('<PAYOUT_KEY>',0,'0xFULL_WINNER_WALLET','review this run');
```

Use `null` instead of the reason to clear it. Holds apply only to prizes, including
before planning. Once sending starts, a hold does nothing and the RPC/CLI says so.
The default CLI env path is `~/.config/sankosurvivors/payout.env`. Manual dry run:
`node tools/payout/run.mjs --env /path/payout.env`.

## Build and recovery

`bash tools/build-vercel.sh` builds the site/API plus the separate CommonJS payout
function **without deploying** and needs no payout configuration. `tools/deploy.sh`
uses that build and then deploys. No systemd units or server key-file setup is used.

Each call has a 300-second runtime limit; a four-minute abort budget stops outbound
work early. The database lease and immutable nonce/signed transaction let the next
cron resume safely. Never delete/reset a sending row or clear its nonce/hash.
Keep the wallet exclusive to this bot. See [PAYOUT.md](../../PAYOUT.md) for SQL,
verification, recovery and limits. Telegram attempts are at most once per mode/week
or alert condition; an ambiguous delivery failure can lose a message.
