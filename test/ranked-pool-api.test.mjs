import {FIRST_BONUS} from '../src/first-bonus.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {handle} = createRequire(import.meta.url)('../tools/vercel-api/ranked.js');
const epoch=Date.UTC(2026,10,2), originalNow=Date.now;
async function week(week,boards) {
  Date.now=()=>epoch+week*7*86400000+3600000;
  let result;
  try { await handle('ranked-week',{method:'GET'},{},{rpc:async(fn,p)=>fn==='sqs_ranked_bonus'?{amountWei:FIRST_BONUS.amountWei,tx:FIRST_BONUS.tx}:boards[p.p_mode],send:(_,status,json)=>{result={status,json};}}); }
  finally {Date.now=originalNow;}
  return result;
}
const board=(paid,incoming='0',ready=true)=>({entries:1,paid,incoming,incoming_ready:ready,reward_version:2,activity:[],rows:[]});
test('first race week exposes exact integer fees and pool even with a legacy board RPC',async()=>{
  const r=await week(0,{normal:{entries:1,paid:'10001',rows:[]}});
  assert.equal(r.status,200);
  assert.deepEqual([r.json.races.normal.paidWei,r.json.races.normal.houseWei,r.json.races.normal.entryPoolWei,r.json.races.normal.incomingWei,r.json.races.normal.poolWei,r.json.races.normal.rolloverReady],['10001','1000','9001','0','9001',true]);
});
test('Standard retains its exact rollover while the closed Hard race is omitted',async()=>{
  const r=await week(1,{normal:board('500000000000000000','1116000000000000000'),hard:board('1500000000000000000',null,false)});
  assert.equal(r.status,200);
  assert.equal(r.json.races.normal.poolWei,'1566000000000000000');
  assert.equal(r.json.races.normal.poolDmt,1.566);
  assert.equal(r.json.races.hard,undefined);
});
test('unsettled or legacy rollover is explicitly unknown after a race starts',async()=>{
  for(const normal of [board('500000000000000000',null,false),{entries:1,paid:'500000000000000000',reward_version:2,activity:[],rows:[]}]) {
    const r=await week(2,{normal,hard:board('1500000000000000000','7')});
    assert.equal(r.status,200);assert.equal(r.json.races.normal.poolWei,null);
    assert.equal(r.json.races.normal.incomingWei,null);assert.equal(r.json.races.normal.rolloverReady,false);
    assert.equal(r.json.races.normal.entryPoolWei,'450000000000000000');
    assert.equal(r.json.races.hard,undefined);
  }
});
test('unreadable or malformed pool data never becomes an empty or invented pot',async()=>{
  for(const normal of [null,{error:'private'},board('-1'),board('1.2'),board('1e18'),board('0x12'),board((1n<<256n).toString())]) {
    assert.equal((await week(0,{normal})).status,503);
  }
  assert.equal((await week(2,{normal:board('5','-1'),hard:board('5')})).status,503);
  for(const entries of [null,false,'',-1,1.5,Number.MAX_SAFE_INTEGER+1])assert.equal((await week(0,{normal:{...board('5'),entries}})).status,503);
});
test('week1 publishes only safe complete activity aggregates and fails closed if missing/malformed',async()=>{
 const wallet='0x'+'1'.repeat(40),normal={...board('21000000000000000000'),entries:21,activity:[{wallet,runs:'21',seconds:'18000',paid:'21000000000000000000',log:'private fixture'}]};
 const r=await week(1,{normal});assert.equal(r.status,200);
 assert.deepEqual(r.json.races.normal.rewardActivity,[{wallet,runs:'21',seconds:'18000',paid:'21000000000000000000'}]);
 assert.equal(r.json.races.normal.activity,undefined,'old pages must fail closed instead of calculating run-weighted estimates');
 assert.deepEqual(r.json.rewards,{version:2,placing:80,paid:10,seconds:10,minSeconds:30,placeMinSeconds:180,capped:false});
 for(const activity of [undefined,[{wallet,runs:'0',seconds:'180'}],[{wallet,runs:'1',seconds:'29'}],[...normal.activity,...normal.activity]])assert.equal((await week(1,{normal:{...normal,activity}})).status,503);
});


test('inconsistent contributed DMT and run totals never become public prize estimates',async()=>{
 const wallet='0x'+'1'.repeat(40);
 for(const data of [{...board('1'),activity:[{wallet,runs:'1',seconds:'30',paid:'2'}]},{...board('10'),activity:[{wallet,runs:'2',seconds:'60',paid:'2'}]}])assert.equal((await week(1,{normal:data})).status,503);
});
