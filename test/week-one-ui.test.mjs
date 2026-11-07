import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {raceForWeek,entryRacesOf} from '../src/ranked.js';
import {MIN_BUY_DMT,MAX_BUY_DMT} from '../src/swap.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const click=main.slice(main.indexOf("$('rankedenter').onclick ="),main.indexOf('async function startRankedEntry'));
function fixture(info,mode='normal',balance={dmt:10,eth:1},onBalance=()=>{}){
 if(info&&!Object.hasOwn(info,'races'))info.races=Object.fromEntries((info.week>=1?['normal','hard']:['normal']).map(m=>[m,raceForWeek(info.week,m)]));
 const nodes=new Map(),calls=[];let pending,balances=0;const $=id=>{if(!nodes.has(id))nodes.set(id,{replaceChildren(){}});return nodes.get(id);};
 Function('$','walletNow','raceList','rankedWeek','rankedMode','raceForWeek','raceOf','rankedAction','rankedMessage','refreshBalances','ETH_FOR_GAS','plain','payEntry','BASE','arbiscanTx','BUILD','SIM_ID',click)($,()=>({w:{}}),Function('entryRacesOf','return '+main.match(/const raceList = ([^\n]+);/)[1])(entryRacesOf),info,mode,raceForWeek,(d,m)=>d?.races?.[m]||(m==='normal'&&d?d:null),fn=>{pending=fn;},()=>{},async()=>{balances++;onBalance();return balance;},.000005,m=>new Error(m),async(...args)=>{calls.push(args);},'/',()=>'', 'fixture-build','abcdefabcdef');
 return{run(){nodes.get('rankedenter').onclick();return pending();},calls,balances:()=>balances};
}
test('ranked cannot start a payment before the displayed week is loaded',async()=>{
 const f=fixture(null);await assert.rejects(f.run(),/week|details/i);assert.equal(f.balances(),0);assert.equal(f.calls.length,0);
});
test('a cached Hard selection enters Standard at 1 DMT instead',async()=>{
 const f=fixture({week:1},'hard',{dmt:1.5,eth:1});await f.run();assert.equal(f.calls.length,1);assert.equal(f.calls[0][4],'normal');
});
test('an asynchronous refresh cannot replace the week selected before payment',async()=>{
 const info={week:0},f=fixture(info,'normal',{dmt:10,eth:1},()=>{info.week=1;});await f.run();assert.equal(f.calls.length,1);assert.equal(f.calls[0][5],0);
});
test('buy presets and suggested quantities remain inside 1–10 without old entry-count labels',()=>{
 const globals=main.slice(main.indexOf('let buyWant ='),main.indexOf('function bindBuy('));
 const f=Function('MIN_BUY_DMT','MAX_BUY_DMT','buyNoticeHTML','ETH_FOR_GAS','BRIDGE',globals+';return {html:()=>buyHTML(null),want:x=>{buyWant=x;}};')(MIN_BUY_DMT,MAX_BUY_DMT,()=>'',.000005,'fixture');
 const amounts=()=>Array.from(f.html().matchAll(/data-dmt="([^"]+)"/g),m=>Number(m[1]));assert.deepEqual(amounts(),[1,2,5,10]);
 for(const wanted of[.5,11,1.1]){f.want(wanted);assert.ok(amounts().every(n=>n>=1&&n<=10));}assert.doesNotMatch(f.html(),/1 entry|Hard entry/);assert.match(f.html(),/approximate output and guaranteed minimum/);
});

for(const[mode,shown]of[['normal','0.5'],['hard','1.5'],['normal',undefined],['hard',undefined]])test(`same-week ${mode} displayed fee ${shown} cannot start a different-priced payment`,async()=>{
 const f=fixture({week:1,races:{[mode]:{entryDmt:shown}}},mode);await assert.rejects(f.run(),/Refresh ranked details/);assert.equal(f.balances(),0);assert.equal(f.calls.length,0);
});
for(const[week,mode,shown]of[[0,'normal','0.5'],[1,'normal','1']])test(`matching displayed ${mode} price ${shown} reaches the selected-week payment flow`,async()=>{
 const f=fixture({week,races:{[mode]:{entryDmt:shown}}},mode);await f.run();assert.equal(f.calls.length,1);assert.equal(f.calls[0][4],mode);assert.equal(f.calls[0][5],week);assert.deepEqual(f.calls[0][6],{build:'fixture-build',sim:'abcdefabcdef'});
});
