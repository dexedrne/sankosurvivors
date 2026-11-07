import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import * as rules from '../src/ranked.js';
const {handle}=createRequire(import.meta.url)('../tools/vercel-api/ranked.js');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('new ranked entries use Standard only, independently of historical settlement races',()=>{
 assert.equal(typeof rules.entryRacesOf,'function');
 for(const week of[0,1,2,52])assert.deepEqual(rules.entryRacesOf(week),['normal']);
 assert.deepEqual(rules.racesOf(1),['normal','hard'],'keep historical liabilities visible to settlement');
});
test('the actual menu excludes Hard even with cached two-race metadata',()=>{
 const definition=main.match(/const raceList = ([^\n]+);/)[1];
 const list=Function('entryRacesOf','return '+definition)(rules.entryRacesOf);
 assert.deepEqual(list({week:1,races:{normal:{},hard:{}}}),['normal']);
 assert.deepEqual(list(null),['normal']);
});
test('week-one API publishes only Standard and refuses Hard before eligibility writes',async()=>{
 const now=Date.now,enabled=process.env.SQS_RANKED;Date.now=()=>rules.weekStart(1)+3600000;process.env.SQS_RANKED='on';
 const calls=[],send=(_,status,json)=>({status,json}),rpc=async(fn,p)=>{calls.push({fn,p});return{entries:0,paid:'0',incoming:'0',incoming_ready:true,rows:[]};};
 const ctx={send,rpc,unsign:x=>x};
 try{
  const board=await handle('ranked-week',{method:'GET'},{},ctx);
  assert.equal(board.status,200);assert.deepEqual(Object.keys(board.json.races),['normal']);
  assert.deepEqual(calls.map(c=>c.p.p_mode),['normal']);calls.length=0;
  const nonce=await handle('ranked-nonce',{method:'GET',url:'/?wallet=0x'+'1'.repeat(40)+'&mode=hard'},{},ctx);
  assert.equal(nonce.status,400);assert.match(nonce.json.error,/not open/);assert.deepEqual(calls,[]);
 }finally{Date.now=now;if(enabled===undefined)delete process.env.SQS_RANKED;else process.env.SQS_RANKED=enabled;}
});
