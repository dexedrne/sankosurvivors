import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSaves,createCloud,isFresh} from '../src/cloud.js';
import {prepareArmoury} from '../src/armoury.js';
import {prepareSkills} from '../src/skill-purchases.js';
const J=JSON.stringify,profile=(coins,skills)=>({'sq-coins':J(coins),'sq-skills':J(skills)}),base=()=>profile(1000,{combat:1}),refund=()=>profile(1060,{});
test('one-side refund plus ordinary earnings keeps both deltas and refunded ranks',()=>{
 const b=base(),theirs={...b,'sq-coins':'1020','sq-stats':'{"kills":12}'},d=mergeSaves(b,refund(),theirs);assert.equal(d['sq-coins'],'1080');assert.equal(d['sq-skills'],'{}');assert.equal(d['sq-stats'],theirs['sq-stats']);
});
test('equal balances after a refund and independent earnings retain both coin deltas',()=>{
 const b=base(),theirs={...b,'sq-coins':'1060','sq-stats':'{"kills":12}'},d=mergeSaves(b,refund(),theirs);assert.equal(d['sq-coins'],'1120');assert.equal(d['sq-skills'],'{}');assert.equal(d['sq-stats'],theirs['sq-stats']);
});
test('equal balances after independent Gear and Skills purchases debit both costs',()=>{
 const b={...profile(1000,{}),'sq-bank':J(['Bronze Helmet','Bronze Chestplate','Bronze Boots']),'sq-gearlv':'{}'},mine={...b,...prepareSkills({getItem:k=>b[k]??null},{kind:'train',id:'coins'}).data};let theirs={...b};
 for(const name of JSON.parse(b['sq-bank']))theirs={...theirs,...prepareArmoury({getItem:k=>theirs[k]??null},{kind:'reinforce',name}).data};
 assert.equal(mine['sq-coins'],'850');assert.equal(theirs['sq-coins'],'850');const d=mergeSaves(b,mine,theirs);assert.equal(d['sq-coins'],'700');assert.deepEqual(JSON.parse(d['sq-skills']),{coins:1});assert.equal(JSON.parse(d['sq-armoury']).paid,150);
 const refunded={...d,...prepareSkills({getItem:k=>d[k]??null},{kind:'refund'}).data};Object.assign(refunded,prepareArmoury({getItem:k=>refunded[k]??null},{kind:'refund'}).data);assert.equal(refunded['sq-coins'],'1000');
});
test('equal balances with shared quest rewards deduct the shared reward once',()=>{
 const b={...profile(1000,{}),'sq-quests':'[]'},mine={...profile(1160,{}),'sq-quests':'["goblins"]','sq-stats':'{"kills":10}'},theirs={...mine,'sq-stats':'{"kills":11}'};assert.equal(mergeSaves(b,mine,theirs)['sq-coins'],'1170');
});
test('a missing coin side still keeps the defined balance',()=>{
 const b=base();assert.equal(mergeSaves(b,refund(),{'sq-skills':b['sq-skills']})['sq-coins'],'1060');assert.equal(mergeSaves(b,{'sq-skills':b['sq-skills']},refund())['sq-coins'],'1060');
});
for(const theirs of[profile(805,{combat:2}),profile(1070,{}),profile(940,{magic:1})])test('both changed skill histories require a choice: '+J(theirs),()=>{
 const b=base(),mine=refund(),before=J([b,mine,theirs]);assert.throws(()=>mergeSaves(b,mine,theirs),e=>e.skillsConflict===true);assert.equal(J([b,mine,theirs]),before);
});
test('identical complete saves stay idempotent after a refund',()=>{const mine=refund();assert.deepEqual(mergeSaves(base(),mine,mine),mine)});
test('baseless empty map versus real ranks does not invent a Skills conflict',()=>{
 assert.equal(mergeSaves(null,profile(10,{}),profile(940,{combat:1}))['sq-coins'],'950');
});
test('competing baseless positive skill histories require a choice',()=>assert.throws(()=>mergeSaves(null,profile(940,{combat:1}),profile(940,{magic:1})),e=>e.skillsConflict===true));
test('key ordering alone does not turn ordinary earnings into a skill conflict',()=>{
 const b=profile(1000,{combat:1,magic:1}),mine=profile(1020,{magic:1,combat:1}),theirs=profile(805,{combat:2,magic:1});const d=mergeSaves(b,mine,theirs);assert.equal(d['sq-coins'],'825');assert.deepEqual(JSON.parse(d['sq-skills']),{combat:2,magic:1});
});
test('a one-sided Skills refund can merge an independent Gear refund',()=>{
 const b={...base(),'sq-bank':'["Bronze Helmet"]','sq-gearlv':'{"Bronze Helmet":1}','sq-armoury':J({v:1,rev:1,paid:50,legacy:0,levels:{'Bronze Helmet':1}})},mine={...b,...refund()},theirs={...b,...prepareArmoury({getItem:k=>b[k]??null},{kind:'refund'}).data},d=mergeSaves(b,mine,theirs);assert.equal(d['sq-coins'],'1110');assert.equal(d['sq-skills'],'{}');assert.equal(d['sq-gearlv'],'{}');assert.equal(JSON.parse(d['sq-armoury']).paid,0);
});
for(const skills of[{combat:0},{FutureCraft:0},{combat:1,FutureCraft:-1}])test('nonempty skill history cannot be silently treated as fresh: '+J(skills),()=>assert.equal(isFresh({'sq-skills':J(skills)}),false));
test('a genuinely empty skill map retains fresh profile behavior',()=>assert.equal(isFresh({'sq-skills':'{}'}),true));
for(const mode of['push','pull'])test('actual cloud '+mode+' pauses conflicting Skills without adoption or retry',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const mine=refund(),theirs=profile(805,{combat:2}),values=new Map(Object.entries({...mine,'sq-cloud':J({a:'fixture-wallet',key:'fixture',rev:1}),'sq-cloud-base':J(base())})),old=globalThis.localStorage,sets=[],calls=[],notes=[],merged=[];let cloud,answered=false;
 globalThis.localStorage={getItem:k=>values.get(k)??null,setItem(k,v){sets.push([k,v,answered]);values.set(k,v)},removeItem:k=>values.delete(k)};
 t.mock.method(globalThis,'fetch',async(_url,o)=>{calls.push(o);answered=true;return new Response(J(mode==='push'?{conflict:true,rev:2,data:theirs}:{rev:2,data:theirs}),{status:mode==='push'?409:200})});
 try{
  cloud=createCloud('./',{note:n=>notes.push(n),merged:(...v)=>merged.push(v)});assert.equal(await cloud[mode](true),false);assert.equal(cloud.state(),null);for(const[k,v]of Object.entries(mine))assert.equal(values.get(k),v);assert(!values.has('sq-import-backup-v1'));assert.deepEqual(merged,[]);assert(notes.some(n=>/skills/i.test(n)&&/choose/i.test(n)));assert(sets.filter(([k])=>k==='sq-cloud-upload').every(([,v,after])=>!after),'conflict cannot rewrite the pre-request upload marker');assert(!values.has('sq-cloud-upload'));t.mock.timers.tick(15000);for(let i=0;i<20;i++)await Promise.resolve();assert.equal(calls.length,1);
 }finally{cloud?.signOut();globalThis.localStorage=old}
});

test('key ordering cannot resurrect ranks during a one-sided refund',()=>{
 const b=profile(1000,{combat:1,magic:1}),mine=profile(1020,{magic:1,combat:1}),theirs=profile(1120,{}),d=mergeSaves(b,mine,theirs);assert.equal(d['sq-coins'],'1140');assert.deepEqual(JSON.parse(d['sq-skills']),{});
});
