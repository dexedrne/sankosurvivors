import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as content from '../src/content.js';
import { translateText } from '../src/i18n.js';
import { TRANSFER_KEYS, saveRunProgress } from '../src/progress-import.js';
import {prepareRunRewards} from '../src/run-rewards.js';
import {createSim} from '../src/sim.js';
import { summary, mergeSaves, betterRun } from '../src/cloud.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),J=JSON.stringify;
const profileSource=main.slice(main.indexOf('const load = '),main.indexOf('// ---- icons:'));
const bestSource=main.slice(main.indexOf('const bestKey ='),main.indexOf('// a label whose longest word'));
const codecSource=main.slice(main.indexOf('const b64 = '),main.indexOf("$('xferbtn').onclick ="));
const copySource=main.slice(main.indexOf("$('xfercopy').onclick ="),main.indexOf("$('xferin').oninput ="));
let helpers={};try{helpers=await import('../src/progress-values.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const bad={valueOf:0,toString:0};
function fixture(data={}){
 const values=new Map(Object.entries({'sq-coins':'850','sq-gear-reset1':'1',...data})),nodes=new Map();
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',selected:false,select(){this.selected=true;}});return nodes.get(id);};
 const run=Function('localStorage','content','$','profileValue','validProfileValue','numberValue','finiteNumber','transferKeys','profileBest','prepareRunRewards','saveRunProgress','createSim',`'use strict';
  const {MAPS,MAP_BY_ID,ADVENTURER_BY_ID,GEAR,GEAR_SLOTS,GEAR_MAX_LV,clampSkills}=content,params=new URLSearchParams();
  const fmtT=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'),XFER_KEYS=transferKeys;
  ${profileSource}
  ${bestSource}
  ${codecSource}
  function updateStats(){const sim=createSim();Object.assign(sim,{kills:1,t:1,over:'dead'});saveRunProgress(localStorage,prepareRunRewards(localStorage,sim,{earned:0}).data);}
  return{load,clearedMaps,questsDone,getCoins,getSkills,getGearLv,getStats,getBests,showBest,updateStats,read:xferRead,code:xferCode,pack:data=>{const body=b64(JSON.stringify(data));return 'SQS1.'+body+'.'+xferSum(body);}};
 `)(storage,content,$,helpers.profileValue,helpers.validProfileValue,helpers.numberValue,helpers.finiteNumber,TRANSFER_KEYS,helpers.profileBest,prepareRunRewards,saveRunProgress,createSim);
 return{...run,values,$,storage};
}
test('healthy legacy code keeps format, UTF8 and raw values',()=>{
 const f=fixture({'sq-name':J('Türkçe • Español • Filipino'),'sq-skills':J({combat:'2'}),'sq-cleared':J(['greentown'])}),code=f.code(),result=f.read(code);
 assert.equal(result.error,undefined);assert.equal(result.coins,850);assert.equal(result.ranks,2);assert.equal(result.maps,1);assert.equal(result.data['sq-name'],J('Türkçe • Español • Filipino'));assert.equal(result.data['sq-skills'],J({combat:'2'}));assert.match(code,/^SQS1\.[A-Za-z0-9+/=]+\.[a-z0-9]+$/);
});
for(const root of [null,[],42,'not an object'])test('malformed decoded root returns an error without throwing: '+J(root),()=>{
 const f=fixture();let result;assert.doesNotThrow(()=>{result=f.read(f.pack(root));});assert.equal(typeof result.error,'string');assert.equal(f.values.get('sq-coins'),'850');
});
const unsafe=[
 ['sq-skills','null'],['sq-skills',J({combat:bad})],['sq-cleared','{}'],['sq-quests','5'],['sq-bank','{}'],['sq-bank',J([{}])],
 ['sq-coins',J(bad)],['sq-coins','1e400'],['sq-stats','5'],['sq-stats',J({kills:bad})],['sq-gearlv','null'],['sq-gearlv',J({Boots:bad})],['sq-gear','[]'],
 ['sq-best',J({t:bad,kills:2,level:1})],['sq-bests',J({'greentown:n:r':{t:60,kills:2,level:bad}})],['sq-name',J(bad)],
];
for(const[key,value]of unsafe)test('unsafe included core field is refused before writes: '+key+' '+value.slice(0,60),()=>{
 const f=fixture(),before=[...f.values];let result;assert.doesNotThrow(()=>{result=f.read(f.pack({'sq-coins':'100',[key]:value}));});assert.equal(typeof result.error,'string');assert.deepEqual([...f.values],before);
});
test('graphics fallback policy and excluded credential keys remain compatible',()=>{
 const f=fixture(),result=f.read(f.pack({'sq-coins':'100','sq-settings':J('broken'),'sq-cloud':'fixture-session','sq-ranked-live':'fixture-ticket'}));assert.equal(result.error,undefined);assert.deepEqual(Object.keys(result.data).sort(),['sq-armoury','sq-coins','sq-settings']);assert.equal(result.data['sq-settings'],J('broken'));assert.equal(result.data['sq-armoury'],'null');
});
test('cached bad collections fall back without rewriting valid neighboring progress',()=>{
 const f=fixture({'sq-cleared':'{}','sq-quests':'5'}),before=[...f.values];assert.equal(f.clearedMaps().size,0);assert.equal(f.questsDone().size,0);assert.equal(f.getCoins(),850);assert.deepEqual([...f.values],before);
});
test('cached malformed skill/gear numeric values are safe before existing level clamps',()=>{
 const f=fixture({'sq-skills':J({combat:bad,mining:'2'}),'sq-gearlv':J({Boots:bad,FutureBoots:'2'})}),before=[...f.values];assert.equal(f.getSkills().combat,0);assert.equal(f.getSkills().mining,2);assert.equal(f.getGearLv().Boots,0);assert.equal(f.getGearLv().FutureBoots,2);assert.deepEqual([...f.values],before);
});
test('cached malformed coins and names cannot coerce hostile JSON objects',()=>{
 const f=fixture({'sq-coins':J(bad),'sq-name':J(bad)});assert.equal(f.getCoins(),0);assert.equal(f.load('sq-name',''),'');assert.equal(f.values.get('sq-coins'),J(bad));
});
test('actual run-stat update preserves metadata and safely increments known corrupt counters',()=>{
 const meta={label:'kept'},f=fixture({'sq-stats':J({kills:bad,bosses:'2',note:meta})});f.updateStats();const result=f.getStats();assert.equal(result.kills,1);assert.equal(result.bosses,2);assert.deepEqual(result.note,meta);assert.equal(f.getCoins(),850);
});
test('actual run-stat update tolerates a primitive old stats root',()=>{
 const f=fixture({'sq-stats':'5'});f.updateStats();assert.equal(f.getStats().kills,1);assert.equal(f.getCoins(),850);
});
test('best display uses safe labels while valid record ordering/ties retain their policy',()=>{
 const f=fixture({'sq-best':J({t:60,kills:2,level:bad,won:false})});assert.doesNotThrow(()=>f.showBest());assert.ok(!f.$('best').textContent.includes('[object Object]'));
 const a={t:60.1,kills:2,level:1,won:true},b={t:60.9,kills:2,level:9,won:true};assert.equal(betterRun(a,b),a);assert.equal(betterRun(a,{...b,kills:3}).kills,3);
});
test('safe export repairs only malformed core views and never rewrites originals',()=>{
 const f=fixture({'sq-cleared':'{}','sq-quests':'5','sq-skills':J({combat:bad,mining:'2'})}),before=[...f.values],result=f.read(f.code());assert.equal(result.error,undefined);assert.equal(result.coins,850);assert.equal(result.maps,0);assert.equal(result.ranks,2);assert.equal(J(JSON.parse(result.data['sq-cleared'])),'[]');assert.deepEqual([...f.values],before);
});
test('export refuses unreadable or oversized saves instead of silently omitting fields',()=>{
 const f=fixture({'sq-name':J('x'.repeat(20001))});assert.throws(()=>f.code());const g=fixture({'sq-name':J('kept')});g.storage.getItem=k=>{if(k==='sq-coins')throw Error('fixture read denied');return g.values.get(k)??null;};assert.throws(()=>g.code());
});
test('input has a gross size bound before checksum/decode work',()=>{
 const f=fixture(),result=f.read('SQS1.'+'A'.repeat(4000001)+'.0');assert.match(result.error,/too large/i);assert.equal(f.getCoins(),850);
});
test('healthy raw data and future metadata stay byte-compatible on export',()=>{
 const data={'sq-stats':J({kills:'3',note:{label:'future'}}),'sq-bests':J({future:{label:'kept'},'greentown:n:r':{t:60,kills:2,level:1}}),'sq-vol':J({s:.4,m:.2}),'sq-roofs':'auto'},f=fixture(data);
 const raw=Object.fromEntries(TRANSFER_KEYS.filter(k=>f.values.has(k)).map(k=>[k,f.values.get(k)])),expected=f.pack(raw);assert.equal(f.code(),expected);assert.equal(f.read(expected).error,undefined);assert.deepEqual(f.getStats().note,{label:'future'});assert.deepEqual(f.getBests().future,{label:'kept'});
});
test('every included malformed or oversize raw field refuses the whole code',()=>{
 const f=fixture();for(const value of [5,'{bad','"'+'x'.repeat(20001)+'"'])assert.equal(typeof f.read(f.pack({'sq-coins':'100','sq-name':value})).error,'string');
});
test('the input bound accepts worst legal UTF16 escaping in all transfer keys',()=>{
 const raw='"'+'\ud800'.repeat(19997)+'"',data=Object.fromEntries(TRANSFER_KEYS.map(k=>[k,k==='sq-roofs'?'auto':raw])),f=fixture(),code=f.pack(data);
 assert.ok(raw.length<20000);assert.ok(code.length>2800000);assert.ok(code.length<4000000);assert.doesNotMatch(f.read(code).error||'',/too large/i);
});
test('cloud summary and coin merge avoid coercing malformed numeric JSON',()=>{
 const s=summary({'sq-coins':J(bad),'sq-skills':J({combat:bad,mining:'2'}),'sq-cleared':'{}'});assert.equal(s.coins,0);assert.equal(s.ranks,2);assert.equal(s.maps,0);
 const merged=mergeSaves({'sq-coins':'0'},{'sq-coins':J(bad)},{'sq-coins':'2'});assert.equal(merged['sq-coins'],'2');
});
test('cloud metadata and level merges preserve valid math without numeric object exceptions',()=>{
 const base={'sq-stats':J({other:2}),'sq-skills':'{}'},mine={'sq-stats':J({other:3,kills:bad}),'sq-skills':J({combat:bad,mining:'2'})},theirs={'sq-stats':J({other:4,kills:6}),'sq-skills':J({combat:2,mining:1})};
 assert.throws(()=>mergeSaves(base,mine,theirs),e=>e.skillsConflict===true,'different shop histories now require a choice');
 const stats=mergeSaves({'sq-stats':base['sq-stats']},{'sq-stats':mine['sq-stats']},{'sq-stats':theirs['sq-stats']});assert.equal(JSON.parse(stats['sq-stats']).other,5);
 const ranks=mergeSaves(null,{'sq-skills':J({combat:bad,mining:0})},{'sq-skills':J({combat:2,mining:'2'})});assert.equal(JSON.parse(ranks['sq-skills']).combat,2);assert.equal(JSON.parse(ranks['sq-skills']).mining,2);
});
test('export UI contains export errors and retains manual clipboard fallback',async()=>{
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',selected:false,select(){this.selected=true;}});return nodes.get(id);};let copies=0;
 const bind=Function('$','navigator','xferCode',"'use strict';"+copySource);
 bind($,{clipboard:{writeText:async()=>{copies++;}}},()=>{throw Error('fixture export failure');});await assert.doesNotReject($('xfercopy').onclick());assert.equal(copies,0);assert.ok($('xfermsg').textContent);
 bind($,{clipboard:{writeText:async()=>{throw Error('fixture clipboard denied');}}},()=> 'SQS1.fixture.code');await $('xfercopy').onclick();assert.equal($('xferin').value,'SQS1.fixture.code');assert.equal($('xferin').selected,true);
});

test('export sanitizes malformed best labels but retains future dictionary metadata',()=>{
 const data={'sq-best':J({t:60,level:bad,kills:2}),'sq-bests':J({future:{label:'kept'},'greentown:n:r':{t:60,level:bad,kills:2}})},f=fixture(data),before=[...f.values],r=f.read(f.code());
 assert.equal(r.error,undefined);assert.equal(JSON.parse(r.data['sq-best']).level,0);assert.deepEqual(JSON.parse(r.data['sq-bests']).future,{label:'kept'});assert.deepEqual([...f.values],before);
});

for(const language of ['tr','es','fil'])test(language+': progress validation messages translate',()=>{for(const message of ["Safer progress codes", "Invalid progress codes are refused before replacing your save. Damaged saved fields no longer stop the game loading.", "Progress code contains invalid save data. Your current progress has not changed.", "This progress code is too large to load.", "This save is too large for a progress code. Keep this device’s save.", "Could not read saved progress. Keep this app installed."])assert.notEqual(translateText(message,language),message);});
