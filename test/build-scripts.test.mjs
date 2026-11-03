import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, readdirSync, readlinkSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// tools/remote-build.sh and tools/build-vercel.sh (security pass 3, fix 4): only the browser files come back from a job box,
// every server file is made here. Fake ssh, rsync and vite on PATH: each "host" is a directory, nothing leaves this machine.
// Each test builds in a copy of the repo (src, tools/vercel-api, tools/vercel-probe, the three scripts) with the real
// esbuild; build-fences/build-ground are stubs (the committed fences and ground.bin), so the ranked version is the committed one.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NM = path.join(ROOT, 'node_modules');
const base = mkdtempSync(path.join(tmpdir(), 'sqs-build-'));
test.after(() => rmSync(base, { recursive: true, force: true }));
const CURRENT = readFileSync(path.join(ROOT, 'tools/vercel-api/sims/current.txt'), 'utf8').trim();

const bin = path.join(base, 'bin');
mkdirSync(bin);
const put = (file, body) => writeFileSync(file, body, { mode: 0o755 });
put(path.join(bin, 'ssh'), `#!/bin/bash
# fake ssh: the host is a directory under $FAKE_BOXES; after a build there, $FAKE_TAMPER plays a compromised box
printf 'ssh %s\\n' "$*" >> "$FAKE_LOG"
h=$1; shift
mkdir -p "$FAKE_BOXES/$h" && cd "$FAKE_BOXES/$h" || exit 255
FAKE_HOST=$h bash -c "$*" || exit $?
case "$*" in *build-vercel.sh*) [ -z "$FAKE_TAMPER" ] || (cd work/sqs-build && bash "$FAKE_TAMPER");; esac
`);
put(path.join(bin, 'rsync'), `#!/usr/bin/env node
// fake rsync: "host:path" is $FAKE_BOXES/host/path. Knows what the build scripts use: -a -r -L --checksum --delete
// --no-links --no-devices --no-specials --exclude. A node_modules tree is linked, not copied.
const fs = require('fs'), path = require('path');
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_LOG, 'rsync ' + JSON.stringify(argv) + '\\n');
let links = false, follow = false, del = false; const ex = [], pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--exclude') ex.push(argv[++i]);
  else if (a === '--delete') del = true;
  else if (a === '--no-links') links = false;
  else if (['--checksum', '--no-devices', '--no-specials'].includes(a)) {}
  else if (/^-[arL]+$/.test(a)) { if (a.includes('a')) links = true; if (a.includes('L')) follow = true; }
  else if (a.startsWith('-')) { console.error('fake rsync: unknown option ' + a); process.exit(1); }
  else pos.push(a);
}
if (pos.length !== 2) { console.error('fake rsync: one source and one destination'); process.exit(1); }
const at = (p) => { const m = /^([A-Za-z0-9_.@-]+):(.*)$/.exec(p); return path.resolve(m ? path.join(process.env.FAKE_BOXES, m[1], m[2]) : p); };
const lst = (p) => { try { return fs.lstatSync(p); } catch { return null; } };
const [src, dst] = pos, S = at(src), D = at(dst), st = lst(S);
if (!st) { console.error('rsync: link_stat "' + src + '" failed: No such file or directory'); process.exit(23); }
const into = src.endsWith('/') ? D : (st.isDirectory() || dst.endsWith('/') || lst(D)?.isDirectory()) ? path.join(D, path.basename(S)) : D;
if (path.basename(S) === 'node_modules') { fs.mkdirSync(path.dirname(into), { recursive: true }); fs.rmSync(into, { recursive: true, force: true }); fs.symlinkSync(fs.realpathSync(S), into); process.exit(0); }
function copy(s, d) {
  let t = fs.lstatSync(s);
  if (t.isSymbolicLink()) {
    if (follow) { s = fs.realpathSync(s); t = fs.statSync(s); }
    else if (!links) { console.error('skipping non-regular file "' + path.relative(S, s) + '"'); return; }
    else { fs.rmSync(d, { recursive: true, force: true }); fs.symlinkSync(fs.readlinkSync(s), d); return; }
  }
  if (t.isDirectory()) {
    if (lst(d) && !lst(d).isDirectory()) fs.rmSync(d, { force: true });
    fs.mkdirSync(d, { recursive: true });
    const names = fs.readdirSync(s).filter((n) => !ex.includes(n));
    for (const n of names) copy(path.join(s, n), path.join(d, n));
    if (del) for (const n of fs.readdirSync(d)) if (!ex.includes(n) && !names.includes(n)) fs.rmSync(path.join(d, n), { recursive: true, force: true });
  } else if (t.isFile()) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
}
copy(S, into);
`);
put(path.join(bin, 'vercel'), `#!/bin/bash
printf 'vercel %s\\n' "$*" >> "$FAKE_LOG"
case "$1 $2" in "env ls") cat "$FAKE_ENV";; "deploy --prebuilt") echo "Production: https://sqs-fake.vercel.app";; *) exit 9;; esac
`);
put(path.join(bin, 'curl'), `#!/bin/bash\nprintf 'curl %s\\n' "$*" >> "$FAKE_LOG"; printf '{"sim":"%s"}' "$FAKE_LIVE"\n`);
const FAKE_VITE = `#!/bin/bash
# fake vite: a tiny client for the version it is given. On a fake job box (FAKE_HOST), FAKE_CLIENT_<host> changes the
# client, FAKE_SIM builds it for another version, and the box leaves a symlink in it (which must never come back)
printf 'vite %s host=%s\\n' "$*" "\${FAKE_HOST:-here}" >> "$FAKE_LOG"
[ "$1" = build ] || exit 2
rm -rf dist; mkdir -p dist/assets
printf '<!doctype html><title>SQS %s</title>\\n' "$VITE_BUILD" > dist/index.html
x=; if [ -n "$FAKE_HOST" ]; then v="FAKE_CLIENT_\${FAKE_HOST//[^A-Za-z0-9]/_}"; x=\${!v}; ln -s /etc/passwd dist/assets/link.js; fi
printf 'const SIM="%s",BUILD="%s";%s\\n' "\${FAKE_SIM:-$VITE_SIM}" "$VITE_BUILD" "$x" > dist/assets/index-AbCd1234.js
`;
// what a compromised job box could leave next to the client it built (none of it may reach the deploy)
const TAMPER = path.join(base, 'tamper.sh');
put(TAMPER, `set -e
F=.vercel/output/functions S=tools/vercel-api/sims
cur=$(cat $S/current.txt); old=$(ls $S | grep -vx -e current.txt -e history.txt -e "$cur" | head -1)
echo '{"runtime":"nodejs22.x","handler":"evil.js","launcherType":"Nodejs","shouldAddHelpers":false}' > $F/api.func/.vc-config.json
echo 'module.exports = (q, s) => s.end("box code")' > $F/api.func/evil.js
mkdir -p $F/x.func; echo 'module.exports = (q, s) => s.end()' > $F/x.func/index.js
echo '{"runtime":"nodejs22.x","handler":"index.js","launcherType":"Nodejs"}' > $F/x.func/.vc-config.json
echo '{"version":3,"routes":[{"src":"^/x$","dest":"/x"},{"handle":"filesystem"}],"crons":[{"path":"/x","schedule":"*/5 * * * *"}]}' > .vercel/output/config.json
echo ';globalThis.boxCode = 1;' >> $S/$old/ranked-bundle.cjs; echo ';globalThis.boxCode = 1;' >> $F/api.func/sims/$old/ranked-bundle.cjs
[ -n "$FAKE_TAMPER_ALL" ] || exit 0 # the quiet kind stops here: nothing the old version-id check could see
printf x >> $S/$cur/ground.bin; printf x >> tools/vercel-api/ground.bin
echo '// edited on the box' >> tools/vercel-api/ranked.js; echo '// edited on the box' >> tools/vercel-probe/index.js
echo "0 $old" >> $S/history.txt; echo "$old" > $S/current.txt
`);

const GIT_ENV = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
function makeRepo() {
  // the repo copy, its fake boxes, the call log and a HOME, side by side (the boxes must not be inside the pushed tree)
  const dir = mkdtempSync(path.join(base, 'case-')), fx = path.join(dir, 'repo'), boxes = path.join(dir, 'boxes');
  const log = path.join(dir, 'calls.log'), home = path.join(dir, 'home');
  for (const d of [fx, boxes, home]) mkdirSync(d);
  writeFileSync(log, '');
  for (const d of ['src', 'tools/vercel-api', 'tools/vercel-probe']) cpSync(path.join(ROOT, d), path.join(fx, d), { recursive: true });
  for (const f of ['remote-build.sh', 'build-vercel.sh', 'deploy.sh']) cpSync(path.join(ROOT, 'tools', f), path.join(fx, 'tools', f));
  const stub = '// test stub: this copy keeps the committed fences and tools/vercel-api/ground.bin\n';
  for (const f of ['build-fences.mjs', 'build-ground.mjs']) writeFileSync(path.join(fx, 'tools', f), stub);
  mkdirSync(path.join(fx, 'node_modules/.bin'), { recursive: true }); // the real packages (esbuild), with the fake vite
  for (const n of readdirSync(NM)) if (n !== '.bin') symlinkSync(path.join(NM, n), path.join(fx, 'node_modules', n));
  put(path.join(fx, 'node_modules/.bin/vite'), FAKE_VITE);
  writeFileSync(path.join(fx, '.gitignore'), 'node_modules\ndist\n.vercel\n');
  const git = (...a) => execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', ...a], { cwd: fx, env: { ...process.env, ...GIT_ENV }, stdio: 'pipe' });
  git('init', '-q'); git('add', '-A'); git('commit', '-qm', 'fixture');
  return { dir, fx, boxes, log, home };
}
function run({ fx, boxes, log, home }, cmd, extra = {}) {
  // tests that build on one box say so (remote-build.sh refuses otherwise); the refusal itself is tested below
  const env = { PATH: `${bin}:${process.env.PATH}`, HOME: home, LANG: 'C', FAKE_LOG: log, FAKE_BOXES: boxes, ...GIT_ENV, SQS_TRUST_BUILD_HOST: extra.VERIFY_HOST ? '' : '1', ...extra };
  const r = spawnSync('bash', cmd, { cwd: fx, env, encoding: 'utf8', timeout: 120000 });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || ''), calls: readFileSync(log, 'utf8') };
}
// every file under dir: path -> sha256 (or the symlink's target)
function tree(dir) {
  const out = {};
  (function walk(d, rel) {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isSymbolicLink()) out[r] = 'symlink -> ' + readlinkSync(p);
      else if (e.isDirectory()) walk(p, r);
      else out[r] = createHash('sha256').update(readFileSync(p)).digest('hex');
    }
  })(dir, '');
  return out;
}
const rsyncs = (calls) => calls.split('\n').filter((l) => l.startsWith('rsync ')).map((l) => {
  const a = JSON.parse(l.slice(6)), pos = a.filter((x, i) => !x.startsWith('-') && a[i - 1] !== '--exclude');
  return { a, src: pos[0], dst: pos[1] };
});
const pulls = (calls) => rsyncs(calls).filter((r) => /^[^/]+:/.test(r.src));
// what build-vercel.sh alone makes here, with the client the honest fake vite builds for the same BUILD
function reference(build) {
  const ref = makeRepo(), r = run(ref, ['tools/build-vercel.sh'], { BUILD: build });
  assert.equal(r.status, 0, r.out);
  assert.equal(readFileSync(path.join(ref.fx, 'tools/vercel-api/sims/current.txt'), 'utf8').trim(), CURRENT, 'the ranked game version is unchanged');
  assert.deepEqual(tree(path.join(ref.fx, 'tools/vercel-api')), tree(path.join(ROOT, 'tools/vercel-api')), 'a local build adds no version');
  return tree(path.join(ref.fx, '.vercel/output'));
}
const builtOf = (fx) => JSON.parse(readFileSync(path.join(fx, '.vercel/output/static/version.json'), 'utf8'));

test('remote-build.sh, statically: nothing but dist comes back from a box, always as plain files', () => {
  const s = readFileSync(path.join(ROOT, 'tools/remote-build.sh'), 'utf8');
  // a copy back has a box as its source: `rsync ... "$H:..." <destination>` (a push ends on the box)
  const back = s.split('\n').filter((l) => /\brsync\b.*"\$(H|VERIFY_HOST):[^"]*"\s+\S/.test(l));
  assert.ok(s.split('\n').filter((l) => /\brsync\b/.test(l)).every((l) => back.includes(l) || /"\$(H|VERIFY_HOST):[^"]*"\s*$/.test(l)), 'every rsync is a push or one of these');
  assert.equal(back.length, 2, back.join('\n'));
  for (const l of back) {
    assert.match(l, /rsync -r --no-links --no-devices --no-specials "\$(H|VERIFY_HOST):\$R\/dist" /, l);
    assert.doesNotMatch(l, /\s-[a-zA-Z]*[alL]/, 'no -a, -l or -L on a copy back: ' + l);
  }
  assert.doesNotMatch(s, /"\$(H|VERIFY_HOST):\$R\/(\.vercel|tools)/, 'no server file, sims/ or ground.bin from a box');
  assert.doesNotMatch(s, /:\$R\/[^"]*(sims|ground\.bin|\.vercel)/);
  assert.match(s, /^SQS_PREBUILT_DIST=1 BUILD="\$BUILD" bash tools\/build-vercel\.sh$/m);
  assert.match(readFileSync(path.join(ROOT, 'tools/build-vercel.sh'), 'utf8'), /if \[ -n "\$\{SQS_PREBUILT_DIST:-\}" \]; then/);
});

for (const all of [false, true]) test(`remote-build.sh: a compromised box's functions, crons, archived bundles${all ? ', walk data and version files' : ''} never reach the deploy`, () => {
  const box = makeRepo(), r = run(box, ['tools/remote-build.sh', 'alexbl'], { FAKE_TAMPER: TAMPER, ...(all ? { FAKE_TAMPER_ALL: '1' } : {}) });
  assert.equal(r.status, 0, r.out);
  // the box really did leave all of it behind (so this test means something)
  const on = (p) => readFileSync(path.join(box.boxes, 'alexbl/work/sqs-build', p), 'utf8');
  assert.match(on('.vercel/output/config.json'), /"crons":\[\{/);
  assert.match(on('.vercel/output/functions/api.func/.vc-config.json'), /evil\.js/);
  assert.ok(existsSync(path.join(box.boxes, 'alexbl/work/sqs-build/.vercel/output/functions/x.func/index.js')));
  const edited = readdirSync(path.join(box.boxes, 'alexbl/work/sqs-build/tools/vercel-api/sims'))
    .filter((d) => !d.endsWith('.txt') && on(`tools/vercel-api/sims/${d}/ranked-bundle.cjs`).includes('boxCode'));
  assert.equal(edited.length, 1, 'one archived bundle was edited on the box');
  assert.notEqual(edited[0], CURRENT);
  if (all) assert.notEqual(on('tools/vercel-api/sims/current.txt').trim(), CURRENT);
  assert.match(r.calls, /^vite build host=alexbl$/m);
  assert.doesNotMatch(r.calls, /^vite build host=here$/m, 'no vite here');
  // only dist came back, as plain files
  assert.deepEqual(pulls(r.calls).map((p) => p.src), ['alexbl:work/sqs-build/dist']);
  for (const p of pulls(r.calls)) assert.ok(p.a.includes('--no-links') && !p.a.some((x) => /^-[a-zA-Z]*[alL]/.test(x)), p.a.join(' '));
  // every file deployed, server and static, is what build-vercel.sh makes here on its own
  const out = tree(path.join(box.fx, '.vercel/output')), build = builtOf(box.fx);
  assert.equal(build.sim, CURRENT);
  assert.deepEqual(out, reference(build.build));
  assert.ok(!Object.keys(out).some((f) => /x\.func|evil\.js|link\.js/.test(f)), Object.keys(out).join('\n'));
  assert.deepEqual(JSON.parse(readFileSync(path.join(box.fx, '.vercel/output/config.json'), 'utf8')).crons, []);
  assert.deepEqual(JSON.parse(readFileSync(path.join(box.fx, '.vercel/output/functions/api.func/.vc-config.json'), 'utf8')).handler, 'index.js');
  // and nothing from the box landed in the tree (sims/, current.txt, history.txt, ground.bin, ranked.js, the probe)
  assert.deepEqual(tree(path.join(box.fx, 'tools/vercel-api')), tree(path.join(ROOT, 'tools/vercel-api')));
  assert.deepEqual(tree(path.join(box.fx, 'tools/vercel-probe')), tree(path.join(ROOT, 'tools/vercel-probe')));
});

test('remote-build.sh: VERIFY_HOST building the same client passes, and only dist comes back from it too', () => {
  const box = makeRepo(), r = run(box, ['tools/remote-build.sh', 'alexbl'], { VERIFY_HOST: 'verifybox', FAKE_TAMPER: TAMPER });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /verifybox built the same client/);
  assert.match(r.calls, /^ssh verifybox cd work\/sqs-build && BUILD='[^']+' .*bash tools\/build-vercel\.sh$/m);
  assert.match(r.calls, /^vite build host=verifybox$/m);
  assert.deepEqual(pulls(r.calls).map((p) => p.src), ['alexbl:work/sqs-build/dist', 'verifybox:work/sqs-build/dist']);
  for (const p of pulls(r.calls)) assert.ok(p.a.includes('--no-links') && !p.a.some((x) => /^-[a-zA-Z]*[alL]/.test(x)), p.a.join(' '));
  assert.deepEqual(tree(path.join(box.fx, '.vercel/output')), reference(builtOf(box.fx).build));
});

test('deploy.sh: when VERIFY_HOST builds a different client, it stops before any deploy', () => {
  const box = makeRepo(), envs = path.join(box.dir, 'envs.json');
  writeFileSync(envs, JSON.stringify({ envs: [{ key: 'SQS_TICKET_SECRET', type: 'sensitive', target: ['production'] }, { key: 'SQS_SERVER_KEY', type: 'sensitive', target: ['production'] }] }));
  const env = { NO_CDN: '1', FAKE_ENV: envs, FAKE_LIVE: CURRENT, BUILD_HOST: 'alexbl', VERIFY_HOST: 'verifybox' };
  let r = run(box, ['tools/deploy.sh'], { ...env, FAKE_CLIENT_verifybox: '/* not the same */' });
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /remote build: alexbl and verifybox built different clients: not deploying/);
  assert.doesNotMatch(r.calls, /^vercel deploy/m);
  assert.ok(!existsSync(path.join(box.fx, '.vercel/output')), 'nothing left to deploy by hand either');
  // the same box twice is not a second opinion
  r = run(box, ['tools/deploy.sh'], { ...env, VERIFY_HOST: 'alexbl' });
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /VERIFY_HOST must be a different box/);
  assert.doesNotMatch(r.calls, /^vercel deploy/m);
  // and with the same client, it deploys
  r = run(box, ['tools/deploy.sh'], env);
  assert.equal(r.status, 0, r.out);
  assert.match(r.calls, /^vercel deploy --prebuilt --prod --yes$/m);
});

test('remote-build.sh: a client built for another game version is refused', () => {
  const box = makeRepo(), r = run(box, ['tools/remote-build.sh', 'alexbl'], { FAKE_SIM: '0123456789ab' });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, new RegExp(`the client from alexbl is not built for game version ${CURRENT}: not deploying`));
  assert.ok(!existsSync(path.join(box.fx, '.vercel/output')));
});

test('build-vercel.sh: SQS_PREBUILT_DIST=1 never runs vite and uses the dist it is given; without a dist it stops', () => {
  const box = makeRepo();
  mkdirSync(path.join(box.fx, 'dist/assets'), { recursive: true });
  writeFileSync(path.join(box.fx, 'dist/index.html'), '<!doctype html><title>given</title>\n');
  writeFileSync(path.join(box.fx, 'dist/assets/index-Given123.js'), `const SIM="${CURRENT}";\n`);
  let r = run(box, ['tools/build-vercel.sh'], { SQS_PREBUILT_DIST: '1', BUILD: 'given1' });
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.calls, /^vite/m);
  assert.equal(readFileSync(path.join(box.fx, '.vercel/output/static/index.html'), 'utf8'), '<!doctype html><title>given</title>\n');
  assert.deepEqual(builtOf(box.fx), { build: 'given1', sim: CURRENT });
  rmSync(path.join(box.fx, 'dist'), { recursive: true });
  r = run(box, ['tools/build-vercel.sh'], { SQS_PREBUILT_DIST: '1', BUILD: 'given2' });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /SQS_PREBUILT_DIST is set but there is no dist\/index\.html/);
  assert.doesNotMatch(r.calls, /^vite/m);
  // without it, the repo's own vite builds the client
  r = run(box, ['tools/build-vercel.sh'], { BUILD: 'given3' });
  assert.equal(r.status, 0, r.out);
  assert.match(r.calls, /^vite build host=here$/m);
});

test('remote-build.sh: without VERIFY_HOST it refuses, unless SQS_TRUST_BUILD_HOST=1 says so (security pass 3 review)', () => {
  const box = makeRepo(), r = run(box, ['tools/remote-build.sh', 'alexbl'], { SQS_TRUST_BUILD_HOST: '' });
  assert.notEqual(r.status, 0); assert.match(r.out, /set VERIFY_HOST=/);
  assert.doesNotMatch(r.calls, /\bssh\b|\brsync\b/, 'nothing reached the box');
});
