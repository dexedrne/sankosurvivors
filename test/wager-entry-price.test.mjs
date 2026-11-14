import test from 'node:test';
import assert from 'node:assert/strict';
import {entryForWeek,entryOptions,entryMessage} from '../src/ranked-entry-price.js';

test('standard and high wager use the same normal race with exact base-unit prices',()=>{
 assert.deepEqual(entryOptions(1).map(p=>[p.tier,p.entryDmt,p.entryWei,p.hard]),[
  ['standard','1','1000000000000000000',false],['high','10','10000000000000000000',false]
 ]);
 assert.equal(entryForWeek(1,'normal','high').name,entryForWeek(1).name);
 assert.equal(entryForWeek(0).entryDmt,'0.5');
 assert.equal(entryForWeek(1,'hard').entryDmt,'2');
});

test('unsupported wager tiers, historical high wagers and malformed weeks fail closed',()=>{
 for(const tier of ['10','HIGH','constructor','__proto__','',null,{},true])assert.equal(entryForWeek(1,'normal',tier),null);
 assert.equal(entryForWeek(0,'normal','high'),null);
 assert.equal(entryForWeek(1,'hard','high'),null);
 for(const week of [-1,NaN,1.2,'1',null])assert.equal(entryForWeek(week),null);
 assert.equal(entryForWeek(1,'constructor'),null);
 assert.deepEqual(entryOptions(0).map(p=>p.tier),['standard']);
});

test('signing text binds the exact wager while historical standard text remains byte-identical',()=>{
 assert.equal(entryMessage('abc',0),"SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week 0). Signing is free. Your wallet asks separately before sending the 0.5 DMT entry.\n\nNonce: abc");
 assert.match(entryMessage('abc',1,'normal',Date.UTC(2026,10,16),'high'),/sending the 10 DMT entry/);
 assert.match(entryMessage('abc',1,'normal',Date.UTC(2026,10,16),'high'),/stops at 2026-11-16T00:00:00\.000Z/);
 assert.equal(entryMessage('abc',0,'normal',undefined,'high'),null);
 assert.equal(entryMessage({},1),null);
});
