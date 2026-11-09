import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {walletPrize,dmtText} from '../src/prize-display.js';
import { MAPS, MAP_BY_ID, ADVENTURER_BY_ID } from '../src/content.js';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const source = main.slice(main.indexOf('const ADV_NAME ='), main.indexOf('// ---- something to chase'));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const response = (rows = []) => ({ ok: true, status: 200, json: async () => ({ rows }) });
const rows = (prefix) => Array.from({ length: 7 }, (_, i) => ({ name: `${prefix}${i}`, adv: 'adventurer', t: 900 - i, level: i + 1, kills: 700 - i, hard: i === 0, holder: i === 0, won: i === 0 }));
function board(fetch, overrides={}) {
  const nodes = Object.fromEntries(['lbtabs', 'lblist', 'lbmapsel', 'rankedbtn'].map(id => [id, { innerHTML: '', querySelectorAll: () => [], classList: { contains: () => false } }]));
  const env = { $: id => nodes[id], fetch, MAPS, MAP_BY_ID, ADVENTURER_BY_ID, BASE: '/', selMap: MAPS[0].id, load: () => 'me', fmtT: t => `${t}s`, localBest: () => 'best', rankedMode: 'normal', raceList: () => ['normal'], raceOf: d => ({ rows: d.rows || [] }), kpmRules: () => false, prizePlaces: () => [], prizeEstimate: () => null, poolReadout: () => 'ranked pot', prizeNotes: () => [],walletPrize,dmtText,noPrize:()=>false,completedRunText:()=> '1 completed run this week',...overrides };
  const api = Function('env', `with (env) { ${source}; return { showBoard, showRankedBoard }; }`)(env);
  return { ...api, nodes, html: () => nodes.lblist.innerHTML };
}

test('ranked board exposes six immutable week-0 receipts conserving 57.5 DMT',async()=>{
 const b=board(async()=>response());await b.showRankedBoard();const html=b.html();
 const hashes=[...html.matchAll(/href="https:\/\/arbiscan\.io\/tx\/(0x[0-9a-f]{64})"/g)].map(m=>m[1]);
 assert.equal(hashes.length,6);assert.equal(new Set(hashes).size,6);assert.match(html,/Week 0 · confirmed reward transactions/);assert.match(html,/ArkRide/);assert.match(html,/c3nt3no/);
 const amounts=[...html.matchAll(/<\/span> · (\d+(?:\.\d+)?) DMT/g)].map(m=>{const[a,b='']=m[1].split('.');return BigInt(a)*10n**18n+BigInt(b.padEnd(18,'0'));});
 assert.equal(amounts.reduce((a,b)=>a+b,0n),575n*10n**17n);
});

test('All maps fetches every shipped map and renders its first five in server order with existing badges and escaping', async () => {
  const calls = [];
  const b = board(async url => { calls.push(url); const map = new URL(url, 'https://test').searchParams.get('map'); const list = rows(`${map}-`); list[0].name = '<me>'; list[1].kills = 0; list[4].t = 9999; list[6].kills = 99999; return response(list); });
  await b.showBoard('all', 'casual');
  assert.equal(calls.length, MAPS.length);
  assert.match(b.nodes.lbtabs.innerHTML, /value="all" selected>All maps/);
  for (const map of MAPS) {
    const start = b.html().indexOf(`<h3>${map.name}</h3>`);
    assert.ok(start >= 0, map.name);
    const group = b.html().slice(start, b.html().indexOf('</section>', start));
    assert.equal((group.match(/<tr class=/g) || []).length, 5);
    assert.ok(group.indexOf(`${map.id}-1`) < group.indexOf(`${map.id}-4`));
    assert.ok(!group.includes(`${map.id}-5`));
    assert.match(group, /&lt;me&gt;/); assert.match(group, /<em>hard<\/em>/); assert.match(group, /class="dmtb"/); assert.match(group, /✔/);
  }
});

test('single map retains all returned rows and personal highlight', async () => {
  const list = rows('single-'); list[0].name = 'me'; const b = board(async () => response(list));
  await b.showBoard(MAPS[0].id, 'casual');
  assert.equal((b.html().match(/<tr class=/g) || []).length, 7);
  assert.match(b.html(), /class="won me"/); assert.ok(!b.html().includes('<h3>'));
});

test('All maps retains the Endless button and applies its captured filter to every request', async () => {
  const calls = [], b = board(async url => { calls.push(url); return response(); });
  const button = { dataset: { endless: '1' } };
  b.nodes.lbtabs.querySelectorAll = selector => selector === '[data-endless]' ? [button] : [];
  await b.showBoard('all', 'casual'); calls.length = 0;
  await button.onclick();
  // The handler launches the async refresh; wait for its requests and render.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, MAPS.length); assert.ok(calls.every(url => url.endsWith('&endless=1')));
  assert.equal((b.html().match(/No endless runs on this map yet/g) || []).length, MAPS.length);
});

test('map-local HTTP, network and JSON failures do not discard successful or empty map groups', async () => {
  const b = board(async url => {
    const i = MAPS.findIndex(m => url.includes(`map=${m.id}`));
    if (i === 0) throw Error('network');
    if (i === 1) return { ok: false, status: 500, json: async () => ({ rows: rows('bad') }) };
    if (i === 2) return { ok: true, status: 200, json: async () => { throw Error('json'); } };
    if (i === 3) return { ok: false, status: 503 };
    return response(i === 4 ? [] : rows('good'));
  });
  await b.showBoard('all', 'casual');
  assert.equal((b.html().match(/<h3>/g) || []).length, MAPS.length);
  for (let i = 0; i < 4; i++) {
    const group = b.html().split(`<h3>${MAPS[i].name}</h3>`)[1].split('</section>')[0];
    assert.match(group, i === 3 ? /opens soon/ : /Could not reach the leaderboard/);
  }
  assert.match(b.html(), /No runs on this map yet/); assert.match(b.html(), /good4/); assert.ok(!b.html().includes('bad'));
});

for (const failure of [false, true]) test(`delayed All maps ${failure ? 'failure' : 'success'} cannot replace a newer single-map result`, async () => {
  const old = deferred(); const b = board(url => url.includes(`map=${MAPS[1].id}`) ? Promise.resolve(response(rows('new'))) : old.promise);
  const pending = b.showBoard('all', 'casual'); await b.showBoard(MAPS[1].id, 'casual');
  const html = b.html(); failure ? old.reject(Error('old')) : old.resolve(response(rows('old')));
  await pending; assert.equal(b.html(), html); assert.match(html, /new0/);
});

test('a delayed casual result cannot replace a newer ranked board', async () => {
  const old = deferred(); const b = board(url => url.includes('ranked-week') ? Promise.resolve(response()) : old.promise);
  const pending = b.showBoard('all', 'casual'); await b.showBoard(null, 'ranked'); const html = b.html();
  old.resolve(response(rows('old'))); await pending; assert.equal(b.html(), html); assert.match(html, /ranked pot/);
});

for (const failure of [false, true]) test(`a ranked ${failure ? 'error' : 'JSON response'} arriving after switching to casual cannot replace it`, async () => {
  const old = deferred(); const b = board(url => url.includes('ranked-week') ? Promise.resolve({ ok: true, json: () => old.promise }) : Promise.resolve(response(rows('casual'))));
  const pending = b.showBoard(null, 'ranked'); await new Promise(resolve => setImmediate(resolve));
  await b.showBoard(MAPS[0].id, 'casual'); const html = b.html(); failure ? old.reject(Error('ranked')) : old.resolve({ rows: [] });
  await pending; assert.equal(b.html(), html); assert.match(html, /casual0/);
});


test('changing All maps to Endless prevents a late 15:00 result from replacing that filter', async () => {
  const old = deferred(), b = board(url => url.includes('&endless=1') ? Promise.resolve(response(rows('endless'))) : old.promise);
  const button = { dataset: { endless: '1' } };
  b.nodes.lbtabs.querySelectorAll = selector => selector === '[data-endless]' ? [button] : [];
  const pending = b.showBoard('all', 'casual'); button.onclick();
  await new Promise(resolve => setImmediate(resolve)); const html = b.html();
  old.resolve(response(rows('normal'))); await pending;
  assert.match(html, /endless0/); assert.equal(b.html(), html);
});

test('direct ranked refreshes share request ownership with mode switches and newer ranked refreshes', async () => {
  const old = deferred(); let count = 0;
  const b = board(() => ++count === 1 ? old.promise : Promise.resolve({ ok: true, json: async () => ({ map: MAPS[1].id, rows: [] }) }));
  const pending = b.showBoard(null, 'ranked'); await b.showRankedBoard(); const html = b.html();
  old.resolve({ ok: true, json: async () => ({ map: MAPS[0].id, rows: [] }) }); await pending;
  assert.match(html, new RegExp(MAPS[1].name)); assert.equal(b.html(), html);
});

test('single-map unavailable and current ranked errors preserve their existing feedback', async () => {
  const b = board(async url => url.includes('ranked-week') ? { ok: false, status: 500 } : { ok: false, status: 503 });
  await b.showBoard(MAPS[0].id, 'casual'); assert.match(b.html(), /opens soon. Your best run: best/);
  await b.showBoard(null, 'ranked'); assert.match(b.html(), /Could not reach ranked/);
});

test('ranked totals include participation and disclose rewards outside visible standings',async()=>{
 const wallet='0x'+ '1'.repeat(40),outside='0x'+'2'.repeat(40),row={wallet,name:'<first>',adv:'adventurer',t:180,kills:1};
 const b=board(async()=>({ok:true,json:async()=>({week:1,rows:[row]})}),{prizePlaces:()=>[0],prizeEstimate:()=>({prizes:['1000000000000000000'],participation:[{wallet,amount:'2000000000000000000'},{wallet:outside,amount:'3000000000000000000'}],rollover:'0'})});
 await b.showRankedBoard();assert.match(b.html(),/class="prizeamt">3 DMT/);assert.match(b.html(),/Participation rewards/);assert(b.html().includes(outside));assert.match(b.html(),/80% placing, 10% qualifying runs, 10% active playtime/);assert(!b.html().includes('<first>'));
});
