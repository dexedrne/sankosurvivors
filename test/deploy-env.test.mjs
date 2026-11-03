import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// tools/deploy.sh with fake vercel, curl, ssh and rsync on PATH (security pass 3): no real command, network or Vercel call.
// The build is a stub here; tools/build-scripts.test.mjs covers the builds.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const base = mkdtempSync(path.join(tmpdir(), 'sqs-deploy-'));
test.after(() => rmSync(base, { recursive: true, force: true }));
const CUR = 'aaaaaaaaaaaa';

const bin = path.join(base, 'bin');
mkdirSync(bin);
const fake = (name, body) => writeFileSync(path.join(bin, name), '#!/bin/bash\n' + body, { mode: 0o755 });
fake('vercel', `printf 'vercel %s\\n' "$*" >> "$FAKE_LOG"
case "$1 $2" in
  "env ls") [ -n "$FAKE_ENV" ] && cat "$FAKE_ENV"; exit "\${FAKE_ENV_RC:-0}";;
  "deploy --prebuilt") echo "Production: https://sqs-fake.vercel.app [2s]"; exit 0;;
esac
echo "fake vercel: unexpected call: $*" >&2; exit 9
`);
fake('curl', `printf 'curl %s\\n' "$*" >> "$FAKE_LOG"
[ -n "$FAKE_LIVE_BODY" ] || exit 7 # could not connect
printf %s "$FAKE_LIVE_BODY"
`);
for (const n of ['ssh', 'rsync']) fake(n, `printf '${n} %s\\n' "$*" >> "$FAKE_LOG"; exit 1\n`);

function repo() {
  const fx = mkdtempSync(path.join(base, 'repo-'));
  mkdirSync(path.join(fx, 'tools/vercel-api/sims'), { recursive: true });
  cpSync(path.join(ROOT, 'tools/deploy.sh'), path.join(fx, 'tools/deploy.sh'));
  writeFileSync(path.join(fx, 'tools/vercel-api/sims/current.txt'), CUR + '\n');
  const stub = (name, body) => writeFileSync(path.join(fx, 'tools', name), '#!/bin/bash\n' + body, { mode: 0o755 });
  stub('build-vercel.sh', 'echo build >> "$FAKE_LOG"\n');
  stub('remote-build.sh', 'echo remote-build >> "$FAKE_LOG"; exit 1\n');
  stub('ranked-active.sh', 'echo ranked-active >> "$FAKE_LOG"; [ -n "$FAKE_ACTIVE" ] || exit 1; echo "$FAKE_ACTIVE"\n');
  stub('publish-github.sh', 'echo publish >> "$FAKE_LOG"; exit 1\n');
  stub('publish-assets.sh', 'echo publish >> "$FAKE_LOG"; exit 1\n');
  return fx;
}
const OK = [
  { key: 'SQS_TICKET_SECRET', type: 'sensitive', target: ['production'] },
  { key: 'SQS_SERVER_KEY', type: 'sensitive', target: ['production'] },
  { key: 'SUPABASE_URL', type: 'plain', value: 'https://example.supabase.co', target: ['production', 'preview'] },
  { key: 'SUPABASE_KEY', type: 'encrypted', target: ['production'] },
  { key: 'SQS_RANKED', type: 'plain', value: 'on', target: ['production'] },
];
// runs tools/deploy.sh; envs: the list `vercel env ls --format json` prints (an array, or raw text)
function deploy({ envs = OK, live = CUR, env = {} } = {}) {
  const fx = repo(), log = path.join(fx, 'calls.log'), list = path.join(fx, 'envs.json');
  writeFileSync(log, '');
  writeFileSync(list, typeof envs === 'string' ? envs : JSON.stringify({ envs }, null, 2));
  const r = spawnSync('bash', ['tools/deploy.sh'], { cwd: fx, encoding: 'utf8', timeout: 60000, env: {
    PATH: `${bin}:${process.env.PATH}`, HOME: fx, NO_CDN: '1', FAKE_LOG: log, FAKE_ENV: list, FAKE_ACTIVE: '0',
    ...(live === null ? {} : { FAKE_LIVE_BODY: JSON.stringify({ build: 'abc1234', sim: live }) }), ...env } });
  const calls = readFileSync(log, 'utf8');
  return { status: r.status, out: r.stdout + r.stderr, calls, deployed: /^vercel deploy /m.test(calls), built: /^build$/m.test(calls) };
}

test('deploy: a list with only Sensitive, Production-only server secrets (plus SUPABASE_*) goes live', () => {
  const r = deploy();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.deployed && r.built, r.calls);
  assert.equal(r.calls.match(/^vercel env ls --format json$/gm).length, 2, 'checked first and again right before the deploy');
  assert.match(r.calls, /^vercel deploy --prebuilt --prod --yes$/m);
  assert.doesNotMatch(r.calls, /^(ssh|rsync|publish|remote-build)/m);
});

test("deploy: today's SQS_TICKET_SECRET (encrypted, Production and Preview) stops it before anything is built, and says exactly what to run", () => {
  const r = deploy({ envs: [{ key: 'SQS_TICKET_SECRET', type: 'encrypted', target: ['production', 'preview'] }, ...OK.slice(1)] });
  assert.equal(r.status, 1, r.out);
  assert.ok(!r.deployed && !r.built, r.calls);
  assert.match(r.out, /SQS_TICKET_SECRET: type encrypted, must be sensitive; targets preview, production, must be production only/);
  assert.match(r.out, /vercel env pull "\$T\/p" --environment=production --yes/);
  assert.match(r.out, /V=\$\(sed -n 's\/\^SQS_TICKET_SECRET="\\\(\.\*\\\)"\$\/\\1\/p' "\$T\/p"\)/);
  assert.match(r.out, /vercel env rm SQS_TICKET_SECRET -y && vercel env add SQS_TICKET_SECRET production --sensitive < "\$K" && rm -f "\$K"/);
  assert.match(r.out, /add failed: the value is kept in/, 'a failed re-add never loses the value');
  assert.match(r.out, /SQS_ENV_CHECK=off/);
  assert.doesNotMatch(r.out, /SQS_SERVER_KEY:/, 'only what is wrong is listed');
  // the printed block is valid shell the owner can paste as is
  const block = r.out.slice(r.out.indexOf('( umask 077'), r.out.indexOf('unset V )') + 'unset V )'.length);
  const sh = spawnSync('bash', ['-n', '-c', block], { encoding: 'utf8' });
  assert.equal(sh.status, 0, block + sh.stderr);
});

test('deploy: a Sensitive server secret that also reaches Preview (or anything but Production) is refused', () => {
  for (const target of [['production', 'preview'], ['preview'], ['production', 'development'], []]) {
    const r = deploy({ envs: [OK[0], { key: 'SQS_SERVER_KEY', type: 'sensitive', target }, ...OK.slice(2)] });
    assert.equal(r.status, 1, JSON.stringify(target) + r.out);
    assert.ok(!r.deployed, r.calls);
    assert.match(r.out, /SQS_SERVER_KEY: targets .*must be production only/);
    assert.match(r.out, /leave only Production ticked, keep the value/);
  }
  // a second Preview entry of the same key is caught too
  const r = deploy({ envs: [...OK, { key: 'SQS_TICKET_SECRET', type: 'sensitive', target: ['preview'], gitBranch: 'dev' }] });
  assert.equal(r.status, 1, r.out);
  assert.ok(!r.deployed);
});

test('deploy: a plain server secret, or a missing one, is refused', () => {
  let r = deploy({ envs: [OK[0], { key: 'SQS_SERVER_KEY', type: 'plain', value: 'x'.repeat(40), target: ['production'] }, ...OK.slice(2)] });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /SQS_SERVER_KEY: type plain, must be sensitive/);
  assert.doesNotMatch(r.out, /xxxxxxxx/, 'a value is never printed');
  r = deploy({ envs: OK.filter((e) => e.key !== 'SQS_SERVER_KEY') });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /SQS_SERVER_KEY: missing\. Add it as Sensitive, Production only: vercel env add SQS_SERVER_KEY production --sensitive/);
  assert.ok(!r.deployed);
});

test('deploy: any payout or wallet key, CRON_SECRET or TG_* variable in Vercel is refused, whatever its type', () => {
  for (const key of ['PAYOUT_WALLET_PRIVATE_KEY', 'PAYOUT_KEY', 'PAYOUT_LIVE', 'SQS_PAYOUT_TRANSFER_CAP', 'CRON_SECRET', 'TG_BOT_TOKEN', 'TG_CHAT_ID',
    'WALLET_PRIVATE_KEY', 'ENTRY_PRIVATE_KEY', 'KEYSTORE_PASSPHRASE', 'tg_bot_token']) {
    for (const type of ['sensitive', 'plain']) {
      const r = deploy({ envs: [...OK, { key, type, value: type === 'plain' ? '123456:VALUE-NEVER-SHOWN' : undefined, target: ['production'] }] });
      assert.equal(r.status, 1, key + r.out);
      assert.ok(!r.deployed && !r.built, key);
      assert.ok(r.out.includes(`${key}: must not be in Vercel at all`) && r.out.includes(`vercel env rm ${key} -y`), key + r.out);
      assert.doesNotMatch(r.out, /VALUE-NEVER-SHOWN/);
    }
  }
  const r = deploy({ envs: [...OK, { key: 'TG_BOT_TOKEN', type: 'plain', value: 'v', target: ['development'] }, { key: 'CRON_SECRET', type: 'encrypted', target: ['preview'] }] });
  assert.match(r.out, /TG_BOT_TOKEN: must not be/);
  assert.match(r.out, /CRON_SECRET: must not be/, 'every problem is listed at once');
});

test('deploy: an env list that cannot be read stops the deploy (fail closed)', () => {
  for (const envs of ['', 'Error: not logged in', '{"envs": "x"}', '{}', '[]', '{"envs":[{"type":"sensitive"}]}', '{"envs":[1]}', 'null']) {
    const r = deploy({ envs });
    assert.equal(r.status, 1, JSON.stringify(envs) + r.out);
    assert.ok(!r.deployed && !r.built, envs);
    assert.match(r.out, /could not read the Vercel env list/);
  }
  // the CLI failing is a refusal even if it printed a good list
  const r = deploy({ env: { FAKE_ENV_RC: '1' } });
  assert.equal(r.status, 1, r.out);
  assert.ok(!r.deployed);
  assert.match(r.out, /could not read the Vercel env list/);
});

test('deploy: the check also covers previews', () => {
  const r = deploy({ envs: [{ key: 'SQS_TICKET_SECRET', type: 'encrypted', target: ['production', 'preview'] }, ...OK.slice(1)], env: { PREVIEW: '1', SQS_PREVIEW_KEYS_SPLIT: '1' } });
  assert.equal(r.status, 1, r.out);
  assert.ok(!r.deployed, r.calls);
  assert.match(r.out, /SQS_TICKET_SECRET: type encrypted/);
});

test('deploy: SQS_ENV_CHECK=off is the emergency way past the check, and says so', () => {
  const r = deploy({ envs: [{ key: 'SQS_TICKET_SECRET', type: 'encrypted', target: ['production', 'preview'] }, ...OK.slice(1)], env: { SQS_ENV_CHECK: 'off' } });
  assert.equal(r.status, 0, r.out);
  assert.ok(r.deployed);
  assert.match(r.out, /WARNING: SQS_ENV_CHECK=off/);
  assert.doesNotMatch(r.calls, /^vercel env ls/m);
});

// fix 7: the ranked-version queue fails closed
test('deploy: when the live game version cannot be read, a build is not deployed (never skips the ranked queue)', () => {
  for (const live of [null, '', '<html>Vercel is down</html>', '{"build":"abc"}']) {
    const r = deploy({ live: null, env: live === null ? {} : { FAKE_LIVE_BODY: live } });
    assert.equal(r.status, 1, JSON.stringify(live) + r.out);
    assert.ok(!r.deployed, r.calls);
    assert.match(r.out, /could not read the live game version; try again, or FORCE_DEPLOY=1/);
    assert.match(r.calls, /^curl -s -m 20 https:\/\/sankosurvivors\.quest\/version\.json$/m);
    assert.doesNotMatch(r.calls, /^ranked-active$/m);
  }
});

test('deploy: the ranked queue still lets a same-version build out at once, and a new version once no run is in progress', () => {
  let r = deploy({ live: CUR, env: { FAKE_ACTIVE: '' } });
  assert.equal(r.status, 0, r.out);
  assert.ok(r.deployed);
  assert.doesNotMatch(r.calls, /^ranked-active$/m, 'the same version never waits');
  r = deploy({ live: 'bbbbbbbbbbbb' });
  assert.equal(r.status, 0, r.out);
  assert.ok(r.deployed);
  assert.match(r.calls, /^ranked-active$/m);
  assert.match(r.out, /no ranked run in progress, going live/);
  // FORCE_DEPLOY=1 is still the owner's way past it
  r = deploy({ live: null, env: { FORCE_DEPLOY: '1' } });
  assert.equal(r.status, 0, r.out);
  assert.ok(r.deployed);
  assert.doesNotMatch(r.calls, /^curl/m);
});
