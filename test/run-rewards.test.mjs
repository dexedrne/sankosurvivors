import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
import * as journal from '../src/progress-import.js';
let prepareRunRewards;try{({prepareRunRewards}=await import('../src/run-rewards.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const KEY='sq-run-save-v1',initial={'sq-coins':'100','sq-bank':'["Bronze Helmet"]','sq-stats':'{"kills":299,"kills.goblin":299,"future":{"keep":true}}','sq-gear-reset1':'1','sq-cloud':'fixture-session','sq-ranked-live':'fixture-ticket','sq-settings':'{"future":true}'};
function store(values=initial){assert.equal(typeof journal.saveRunProgress,'function');assert.equal(typeof journal.recoverRunProgress,'function');const data=new Map(Object.entries(values)),calls=[];let fault=null;const storage={getItem(k){calls.push(['read',k]);if(fault?.('read',k))throw Error('denied read');return data.get(k)??null;},setItem(k,v){calls.push(['write',k]);if(fault?.('write',k))throw Error('quota');data.set(k,String(v));},removeItem(k){calls.push(['remove',k]);if(fault?.('remove',k))throw Error('cleanup denied');data.delete(k);}};return{data,calls,storage,fail(fn){fault=fn;},restore(){fault=null;}};}
function sim(){const s=createSim({map:MAP_BY_ID.greentown});Object.assign(s,{over:'win',t:600,kills:6,bossKills:0,evolves:0,loot:['Bronze Helmet','Iron Helmet'],alched:[],killsByType:{goblin:6}});Object.assign(s.players[0],{coins:2,alch:7});return s;}
function prepare(storage,s=sim(),options={}){assert.equal(typeof prepareRunRewards,'function','real reward calculator required');return prepareRunRewards(storage,s,{earned:134,...options});}
function write(storage,data){assert.equal(typeof journal.saveRunProgress,'function');return journal.saveRunProgress(storage,data);}
function recover(storage){assert.equal(typeof journal.recoverRunProgress,'function');return journal.recoverRunProgress(storage);}
test('pure finished-run batch preserves all rewards/metadata and performs no writes',()=>{
 const f=store(),r=prepare(f.storage);assert.equal(r.data['sq-coins'],'609');assert.deepEqual(JSON.parse(r.data['sq-bank']),['Bronze Helmet','Iron Helmet','Bowler Hat','Cape']);assert.deepEqual(JSON.parse(r.data['sq-quests']),['goblins','survivor','achievement-first-clear']);assert.deepEqual(JSON.parse(r.data['sq-cleared']),['greentown']);assert.deepEqual(JSON.parse(r.data['sq-stats']).future,{keep:true});assert.equal(JSON.parse(r.data['sq-stats']).kills,305);assert.equal(r.loot[0].fresh,false);assert.equal(r.loot[1].fresh,true);assert.equal(r.quests.length,3);assert.equal(r.clearedBefore,0);assert.equal(r.newPersonalBest,true);assert.deepEqual(JSON.parse(r.data['sq-bests'])['greentown:n:r'],{t:600,level:1,kills:6,won:true});assert.ok(f.calls.every(c=>c[0]==='read'));
});
test('ranked batch keeps casual bests intact; loss does not clear a map',()=>{
 const f=store({...initial,'sq-bests':'{"future":{"keep":true}}'}),s=sim();s.over='dead';const r=prepare(f.storage,s,{ranked:true,earned:14});assert.equal(r.data['sq-coins'],'489');assert.equal(Object.hasOwn(r.data,'sq-bests'),false);assert.equal(Object.hasOwn(r.data,'sq-cleared'),false);assert.equal(r.newPersonalBest,false);
});
test('high-alched duplicates and run-only weapon metals never pay another sale or enter the bank',()=>{
 const f=store({...initial,'sq-quests':'["goblins","survivor"]'}),s=sim();s.loot=['Bronze Helmet','Bronze Helmet','Iron Helmet','Iron Katana'];s.alched=['Bronze Helmet'];const r=prepare(f.storage,s);assert.equal(r.data['sq-coins'],'259');assert.equal(r.loot[0].wasAlched,true);assert.equal(r.loot[1].wasAlched,false);assert.ok(!JSON.parse(r.data['sq-bank']).includes('Iron Katana'));
});
for(const key of ['sq-best','sq-bests','sq-cleared','sq-coins','sq-bank','sq-stats','sq-quests'])test(`snapshot read failure at ${key} aborts before any mutation`,()=>{const f=store();f.fail((action,k)=>action==='read'&&k===key);assert.throws(()=>prepare(f.storage));assert.ok(f.calls.every(c=>c[0]==='read'));});
test('forward journal is reserved before every reward key and never contains credentials/tickets/preferences',()=>{
 const f=store(),r=prepare(f.storage);write(f.storage,r.data);const mutations=f.calls.filter(c=>c[0]!=='read');assert.deepEqual(mutations[0],['write',KEY]);assert.deepEqual(mutations.at(-1),['remove',KEY]);assert.equal(f.data.has(KEY),false);for(const[k,v]of Object.entries(r.data))assert.equal(f.data.get(k),v);for(const key of ['sq-cloud','sq-ranked-live','sq-settings'])assert.equal(f.data.get(key),initial[key]);
});
for(const key of [KEY,'sq-best','sq-cleared','sq-coins','sq-bank','sq-stats','sq-quests','sq-bests'])test(`failed ${key} write retains same absolute reward intent for retry/reload`,()=>{
 const f=store(),r=prepare(f.storage),before=new Map(f.data);f.fail((action,k)=>action==='write'&&k===key);assert.throws(()=>write(f.storage,r.data));if(key===KEY)assert.deepEqual(f.data,before);else{assert.deepEqual(JSON.parse(f.data.get(KEY)).data,r.data);assert.equal(recoverAfterFreshContext(f,r.data),true);}
 f.restore();write(f.storage,r.data);assert.equal(f.data.get('sq-coins'),'609');assert.equal(f.data.has(KEY),false);assert.equal(recover(f.storage),false);
});
function recoverAfterFreshContext(f,expected){f.restore();const reloaded=store(Object.fromEntries(f.data));assert.equal(recover(reloaded.storage),true);for(const[k,v]of Object.entries(expected))assert.equal(reloaded.data.get(k),v);assert.equal(reloaded.data.get('sq-coins'),'609');assert.equal(reloaded.data.has(KEY),false);return true;}
test('failed journal cleanup can repeat recovery without duplicating rewards',()=>{
 const f=store(),r=prepare(f.storage);f.fail((action,k)=>action==='remove'&&k===KEY);assert.throws(()=>write(f.storage,r.data));assert.equal(f.data.get('sq-coins'),'609');assert.ok(f.data.has(KEY));assert.throws(()=>recover(f.storage));f.restore();assert.equal(recover(f.storage),true);assert.equal(f.data.get('sq-coins'),'609');assert.equal(f.data.has(KEY),false);
});
test('pending run refuses a different result or manual import without replacing the original intent',()=>{
 const f=store(),r=prepare(f.storage);f.data.set(KEY,JSON.stringify({v:1,data:r.data}));const raw=f.data.get(KEY);assert.throws(()=>write(f.storage,{'sq-coins':'999'}));assert.throws(()=>journal.importProgress(f.storage,{'sq-coins':'999'}));assert.equal(f.data.get(KEY),raw);assert.equal(f.data.get('sq-coins'),'100');
});
test('pending import blocks run commit/recovery without reordering either journal',()=>{
 const f=store(),r=prepare(f.storage);f.data.set(journal.IMPORT_BACKUP_KEY,JSON.stringify({v:1,before:{'sq-coins':'50'}}));assert.throws(()=>write(f.storage,r.data));f.data.set(KEY,JSON.stringify({v:1,data:r.data}));assert.throws(()=>recover(f.storage));assert.equal(f.data.get('sq-coins'),'100');assert.ok(f.data.has(KEY));assert.ok(f.data.has(journal.IMPORT_BACKUP_KEY));
});
for(const unreadable of [false,true])test(`import rollback refuses a pending or unreadable run journal before any mutation: unreadable=${unreadable}`,()=>{
 const f=store(),r=prepare(f.storage);f.data.set(KEY,JSON.stringify({v:1,data:r.data}));f.data.set(journal.IMPORT_BACKUP_KEY,JSON.stringify({v:1,before:{'sq-coins':'50'}}));const before=new Map(f.data);if(unreadable)f.fail((action,k)=>action==='read'&&k===KEY);assert.throws(()=>journal.recoverProgressImport(f.storage));assert.deepEqual(f.data,before);assert.ok(f.calls.every(c=>c[0]==='read'));
});
for(const raw of ['broken','[]','{"v":2,"data":{"sq-coins":"1"}}','{"v":1,"data":{}}','{"v":1,"data":{"sq-cloud":"bad"}}','{"v":1,"data":{"sq-coins":"{}"}}','{"v":1,"data":{"sq-bank":"{}"}}','{"v":1,"data":{"__proto__":"{}"}}'])test(`malformed run journal cannot mutate saved progress: ${raw}`,()=>{
 const f=store();f.data.set(KEY,raw);assert.throws(()=>recover(f.storage));assert.equal(f.data.get('sq-coins'),'100');assert.equal(f.data.get(KEY),raw);assert.ok(f.calls.every(c=>c[0]==='read'));
});
