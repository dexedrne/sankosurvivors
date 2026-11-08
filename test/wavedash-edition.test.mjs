import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformMain, transformHtml, assertCasualBundle, wavedashEdition } from '../tools/wavedash/edition.mjs';
import { createWavedashLoader } from '../src/wavedash.js';
import { betterRun } from '../src/personal-record.js';
import { betterRun as existing } from '../src/cloud.js';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const qa = readFileSync(new URL('../tools/wavedash/qa.mjs', import.meta.url), 'utf8');

test('wallet-free layout instructions name the actual phone Settings choice',async()=>{
  const code=transformMain(main),start=code.indexOf('const SETTINGS ='),end=code.indexOf(';function buildSettings()',start);
  assert(start>=0&&end>start);const settings=Function(code.slice(start,end)+';return SETTINGS;')();
  const label=settings.find(row=>row.id==='layout').opts.find(([value])=>value==='ds')[1];
  const generated=wavedashEdition().transform('', '/fixture/src/changelog.js').code;
  const {CHANGELOG}=await import('data:text/javascript,'+encodeURIComponent(generated));
  const instruction=CHANGELOG.flatMap(note=>note.items).find(text=>text.endsWith('is available on phones only.'));
  assert(instruction);assert(instruction.includes(label),`${instruction} does not name the available ${label} setting`);
});

test('casual renderer keeps ordinary companions and excludes Bun ownership and model modules',()=>{
  const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8'),result=wavedashEdition().transform(source,'/fixture/src/render.js');
  assert.equal(typeof result?.code,'string');assert.match(result.code,/createPetRenderer/);assert.match(result.code,/NATIVE_PETS/);
  assert.doesNotMatch(result.code,/bunModels|bun-models|bun-actor|bun-catalogue/);
});

test('casual pet presentation has no relay authority dependency',()=>{
  const code=transformMain(main),line=code.split('\n').find(line=>line.includes('view.petActive ='));
  assert.ok(line);assert.doesNotMatch(line,/\bcoop\b/);
});

for (const language of ['tr', 'es', 'fil']) test(`casual scaling keeps its existing ${language} explanation without ranked copy`, async () => {
  const original = await import(`../src/locales/${language}.js`);
  const generated = wavedashEdition().transform('', `/fixture/src/locales/${language}.js`).code;
  const casual = await import('data:text/javascript,' + encodeURIComponent(generated));
  const source = Object.keys(original.text).find(key => key.startsWith('Each skill rank adds 1.5%'));
  const key = source.replace(' Ranked ignores both.', '');
  assert.ok(transformHtml(html).includes(key));
  const translated = original.text[source].slice(0, original.text[source].lastIndexOf('. ') + 1);
  assert.equal(casual.text[key], translated);
});

async function qaResult(event, failed = false) {
  const start = qa.indexOf("  ws.addEventListener('message'"), end = qa.indexOf('\n  const evaluate=', start);
  assert.ok(start >= 0 && end > start);
  const issues = []; let handler;
  Function('ws', 'issues', qa.slice(start, end))({ addEventListener(_name, callback) { handler = callback; } }, issues);
  if (event) await handler({ data: JSON.stringify(event) });
  const process = {};
  Function('failed', 'issues', 'process', qa.slice(qa.lastIndexOf('process.exitCode=')))(failed, issues, process);
  return { issues, exit: process.exitCode };
}
for (const event of [
  { method:'Runtime.exceptionThrown',params:{exceptionDetails:{text:'unexpected fixture exception'}} },
  { method:'Network.responseReceived',params:{response:{status:404,url:'http://localhost/assets/missing.glb'}} },
  { method:'Network.loadingFailed',params:{canceled:false,errorText:'fixture network failure'} },
]) test(`QA fails on collected ${event.method} even when game assertions pass`, async () => {
  const result = await qaResult(event); assert.equal(result.issues.length,1); assert.equal(result.exit,1);
});
test('QA success and intentional request exemptions stay green, assertion failures stay red', async () => {
  for (const event of [null,{method:'Network.loadingFailed',params:{canceled:true,errorText:'canceled'}},{method:'Network.responseReceived',params:{response:{status:404,url:'http://localhost/favicon.ico'}}}]) assert.deepEqual(await qaResult(event),{issues:[],exit:0});
  assert.equal((await qaResult(null,true)).exit,1);
});

test('casual entry excludes all account/network services and preserves actual game/reward controls', () => {
  const code = transformMain(main);
  assert.doesNotMatch(code, /from ['"].*(?:wallet|ranked|cloud|swap|dmt|prize|config)/);
  assert.doesNotMatch(code, /fetch\(|serviceWorker|caches\.|savedPass|walletNow|createCloud|api\/|TIP_ETH|rankedApi|openRanked|submitScore/);
  for (const part of ['createSim(', 'saveRunProgress(localStorage, receipt.data)', 'recoverRunProgress(localStorage)', 'prepareRunRewards(', 'createScreenLayout(', 'function doReroll(', 'const hop = () =>', 'function showLevelUp(']) assert.ok(code.includes(part), part);
  assert.match(code, /showLocalRecords/);
});
test('every literal panel ID used by the extracted entry exists in its HTML', () => {
  const code = transformMain(main), page = transformHtml(html);
  const ids = [...code.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
  for (const list of code.matchAll(/for \(const id of \[([^\]]+)\]/g)) ids.push(...[...list[1].matchAll(/'([^']+)'/g)].map(match => match[1]));
  for (const id of ids) assert.ok(page.includes(`id="${id}"`), `Missing casual element ${id}`);
});
test('source drift aborts preparation rather than shipping the default paid entry', () => {
  assert.throws(() => transformMain(main.replace('// ---- ranked: paid tickets', '// changed ranked: paid tickets')), /anchor|expected/i);
  assert.throws(() => transformMain(main + '\nfetch("/api/new-service");'), /forbidden|network/i);
  assert.throws(() => transformHtml(html.replace('id="walletchip"', 'id="walletchanged"')), /element|expected/i);
});
test('casual HTML removes account/payment/PWA/backend UI and legacy redirects', () => {
  const result = transformHtml(html);
  assert.doesNotMatch(result, /wallet|ranked|DMT|ethereum|manifest|sankosurvivors\.quest|id="bug|id="lbname|id="sharex/i);
  for (const id of ['start', 'gearbtn', 'skillsbtn', 'questbtn', 'lbbtn', 'setbtn', 'xferbtn', 'progressrecovery', 'levelup', 'tumblebtn']) assert.ok(result.includes(`id="${id}"`), id);
  assert.match(result, /Best run/);
  assert.doesNotMatch(result, /(?:href|src)="\//);
});
test('bundle audit rejects an accidental provider, production API, updater or private integration', () => {
  assertCasualBundle('game();', ['index.html', 'assets/index.js', 'draco/draco_decoder.wasm']);
  for (const text of ['https://relay.walletconnect.com', 'api/ranked-week', 'api/run', 'ethereum:0x123', 'd22a7b277a3923fe996af92b3a13386c', 'navigator.serviceWorker.register("/sw.js")', '0xb85ff44289b768ecff58fead92f815b642e3cbb2', 'https://pet-metadata.sanko.xyz/buns/3351', 'sanko/buns/Mini.glb', 'sanko/pets/portraits/Mini.png']) assert.throws(() => assertCasualBundle(text, ['index.html']), /forbidden/i, text);
  for (const name of ['sw.js', 'manifest.webmanifest', '.env', 'api/index.js', 'src/wallet.js', 'assets/.env', 'assets/../api/index.js', 'assets/sub/.hidden', 'assets/sanko/buns/Mini.glb', 'assets/sanko/pets/portraits/Mini.png']) assert.throws(() => assertCasualBundle('', ['index.html', name]), /forbidden/i, name);
});
test('platform loader reports actual progress monotonically and initializes once', () => {
  const calls = [], sdk = { updateLoadProgressZeroToOne: v => calls.push(v), init: () => calls.push('init') };
  const load = createWavedashLoader(sdk);
  load.progress(.6); load.progress(.2); load.progress(NaN); load.ready(); load.ready();
  assert.deepEqual(calls, [.6, .6, 1, 'init']);
  const standalone = createWavedashLoader(undefined); standalone.progress(.5); standalone.ready();
});
test('failed boot never initializes SDK or claims ready; successful boot does', async () => {
  const code = transformMain(main), start = code.indexOf('boot().then('), end = code.indexOf('// QA hooks', start);
  assert.ok(start > 0 && end > start);
  for (const success of [false, true]) {
    let ready = 0;
    const window = {};
    await Function('boot', 'refreshPendingTitleProgress', 'window', 'wavedashLoader', `return ${code.slice(start, end).trim().replace(/;$/, '')}`)(async () => success, async () => {}, window, { ready() { ready++; } });
    assert.equal(ready, success ? 1 : 0); assert.equal(window.__sqReady === true, success);
  }
});
test('existing score comparator is identical: whole seconds, kills and old full tie', () => {
  assert.equal(existing, betterRun);
  const a = { won: true, t: 200.9, kills: 7 }, tie = { ...a, t: 200.1 };
  assert.equal(betterRun(a, tie), a);
  assert.equal(betterRun(a, { ...tie, kills: 8 }).kills, 8);
});

function focusHarness() {
  const code = transformMain(main);
  const start = code.indexOf('let resumeMode ='), end = code.indexOf("$('start').onclick", start);
  assert.ok(start > 0 && end > start, 'edition focus suspension code');
  const panels = new Map(['pause','levelup','casket'].map(id => [id, { hidden:id!=='levelup', classList:{toggle(_name,on){panels.get(id).hidden=on;}} }]));
  let focused = true, hidden = false;
  const document = { get hidden(){return hidden;}, hasFocus:()=>focused, addEventListener(){} };
  const api = Function('$','document', `let mode='title',runStarting=false,acc=4,last=0,pendingUse=null; const keys=new Set(['d']),clearTouch=()=>{},audio={duck(){}};const addEventListener=()=>{};
    ${code.slice(start,end)}
    return {pause,suspendPage,set(modeValue,starting=false){mode=modeValue;runStarting=starting;},state(){return{mode,acc,focusLostWhileStarting,resumeMode,keys:keys.size};},enter(){mode='play';${code.slice(code.indexOf('    if (focusLostWhileStarting'),code.indexOf('\n  } finally { runStarting',code.indexOf('    if (focusLostWhileStarting')))}}};
  `)(id=>panels.get(id),document);
  return {...api,panels,focus(value){focused=value;},hide(value){hidden=value;}};
}
for (const mode of ['levelup','casket','play']) test(`focus loss suspends ${mode} until deliberate Resume and preserves the reward menu`, () => {
  const f=focusHarness();f.set(mode);f.focus(false);f.suspendPage();
  assert.equal(f.state().mode,'pause');assert.equal(f.state().acc,0);assert.equal(f.state().keys,0);
  f.focus(true);assert.equal(f.state().mode,'pause');f.pause(false);assert.equal(f.state().mode,mode);
  if(mode!=='play')assert.equal(f.panels.get(mode).hidden,false);
});
test('focus loss while Start awaits assets latches suspension even if focus returns first', async () => {
  const f=focusHarness();f.set('title',true);f.focus(false);f.suspendPage();assert.equal(f.state().focusLostWhileStarting,true);
  await Promise.resolve();f.focus(true);f.enter();assert.equal(f.state().mode,'pause');f.pause(false);assert.equal(f.state().mode,'play');
});
test('hidden or unfocused iframe returns before simulation/reward timers and clears elapsed time', () => {
  const code=transformMain(main),start=code.indexOf('function loop(ts)'),end=code.indexOf('  const cap =',start);
  assert.ok(start>=0&&end>start);
  for(const [hidden,focused]of [[true,true],[false,false]]){
    let suspended=0;
    const result=Function('document','suspendPage',`let last=0,acc=5;const sim={};const requestAnimationFrame=()=>{};${code.slice(start,end)}return 'advanced';}loop(5000);return{last,acc};`)({hidden,hasFocus:()=>focused},()=>suspended++);
    assert.equal(suspended,1);assert.deepEqual(result,{last:5000,acc:0});
  }
});
test('title backdrop can render before the player first focuses the iframe', () => {
  const code=transformMain(main),start=code.indexOf('function loop(ts)'),end=code.indexOf('  const cap =',start);
  const result=Function('document','suspendPage',`let last=0,acc=0;const mode='title',sim=null,inspectedElement=null,requestAnimationFrame=()=>{},setMapPeek=()=>{},hideItemInspection=()=>{};${code.slice(start,end)}return 'title can render';}return loop(5000);`)({hidden:false,hasFocus:()=>false},()=>assert.fail('no live run to suspend'));
  assert.equal(result,'title can render');
});
