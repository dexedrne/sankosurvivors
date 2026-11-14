import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {entryForWeek,entryOptions} from '../src/ranked-entry-price.js';
import {raceForWeek} from '../src/ranked.js';

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function setup(tier,balance=async()=>({dmt:20,eth:1})){
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{replaceChildren(){},innerHTML:''});return nodes.get(id);};
 const c={rankedTier:tier,rankedMode:'normal',rankedWeek:{week:1,races:{normal:{entryDmt:'1',entryOptions:entryOptions(1)}}},walletNow:()=>({w:{}}),$,showRankedWalletChoices(){throw Error('Unexpected wallet chooser');},raceList:()=>['normal'],raceOf:(w,m)=>w.races[m],raceForWeek,entryForWeek,Number,rankedAction(fn){c.pending=fn();},plain:text=>Error(text),rankedConsent:()=>123,rankedMessage(){},refreshBalances:balance,ETH_FOR_GAS:.001,payEntry:async(...args)=>{c.payment=args;},BASE:'/',BUILD:'test-client',SIM_ID:'abcdefabcdef',arbiscanTx:()=>'/tx'};
 vm.createContext(c);const a=main.indexOf("$('rankedenter').onclick ="),b=main.indexOf('async function startRankedEntry(',a);assert(a>=0&&b>a);vm.runInContext(main.slice(a,b),c);return c;
}
for(const tier of ['standard','high'])test('actual entry handler captures exact selected '+tier+' wager',async()=>{
 const c=setup(tier);c.$('rankedenter').onclick();await c.pending;
 assert.equal(c.payment[4],'normal');assert.equal(c.payment[5],1);assert.equal(c.payment[7],tier);
});
test('changing the displayed wager during the balance await cannot change the captured payment',async()=>{
 let release;const c=setup('high',()=>new Promise(resolve=>release=resolve));c.$('rankedenter').onclick();c.rankedTier='standard';release({dmt:20,eth:1});await c.pending;assert.equal(c.payment[7],'high');
});
test('a high entry needs its own displayed10DMT quote, not just the standard price',async()=>{
 const c=setup('high');c.rankedWeek.races.normal.entryOptions=[entryForWeek(1)];c.$('rankedenter').onclick();await assert.rejects(c.pending,/Refresh ranked details/);assert.equal(c.payment,undefined);
});
