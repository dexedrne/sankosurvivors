import test from 'node:test';
import assert from 'node:assert/strict';
import {allocateRewards,rewardPolicy,REWARD_HOUSE} from '../src/reward-policy.js';
import {prizeEstimate} from '../src/prize-display.js';
import {makePlan} from '../tools/payout/core.mjs';

const a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40),dmt=n=>String(BigInt(n)*10n**18n);
const activity=(wallet,paid,seconds='30',runs='1')=>({wallet,paid:dmt(paid),seconds,runs});

test('current rewards keep skill placement and split participation by contributed DMT and active time',()=>{
 assert.deepEqual(rewardPolicy(1),{version:2,placing:80,paid:10,seconds:10,minSeconds:30,placeMinSeconds:180,capped:false});
 const out=allocateRewards('10000',5,1,[activity(a,10),activity(b,1)]);
 assert.deepEqual(out.prizes,['3200','2000','1200','960','640']);
 assert.deepEqual(out.participation,[{wallet:a,amount:'1409'},{wallet:b,amount:'591'}]);
 assert.equal(out.rollover,'0');
});

test('each participation bucket conserves base units and resolves equal dust by wallet',()=>{
 for(const pool of [0n,1n,9n,10n,101n,10007n,2n**128n-1n]){
  const out=allocateRewards(pool,2,1,[activity(b,1,'60'),activity(a,1,'60')]);
  const total=[...out.prizes,...out.participation.map(r=>r.amount),out.rollover].reduce((n,s)=>n+BigInt(s),0n);
  assert.equal(total,pool);
  assert(BigInt(out.participation[0].amount)>=BigInt(out.participation[1].amount));
 }
 assert.equal(allocateRewards('10000',0,1,[]).rollover,'10000');
});

test('short completed runs participate from30seconds; malformed or zero-weight rows fail closed',()=>{
 assert.equal(allocateRewards('1000',0,1,[activity(a,1)]).participation[0].amount,'200');
 for(const row of [{...activity(a,1),seconds:'29'},{...activity(a,1),paid:'0'},{...activity(a,1),paid:'1e18'},{...activity(a,1),paid:1},{...activity(a,1),runs:'0'}])assert.throws(()=>allocateRewards('1000',0,1,[row]));
 assert.throws(()=>allocateRewards('1000',0,1,[activity(a,1),activity(a,1)]));
 assert.deepEqual(allocateRewards('1000',0,1,[activity(REWARD_HOUSE,10)]).participation,[]);
});

test('recorded policy1 snapshots and historical week0 retain their old exact allocation',()=>{
 const rows=[{wallet:a,runs:'2',seconds:'360'},{wallet:b,runs:'1',seconds:'180'}];
 const out=allocateRewards('10000',1,1,rows,1);
 assert.deepEqual(out,{prizes:['3200'],participation:[{wallet:a,amount:'1334'},{wallet:b,amount:'666'}],rollover:'4800'});
 assert.equal(rewardPolicy(1,1).runs,10);assert.equal(rewardPolicy(1,1).minSeconds,180);
 assert.deepEqual(allocateRewards('100',1,0),{prizes:['40'],rollover:'60'});
});

test('public estimates distinguish version2 activity while stored version1 plans remain reproducible',()=>{
 const rows=[activity(a,10),activity(b,1)],payouts=[.4,.25,.15,.12,.08];
 const race={week:1,poolWei:'10000',rolloverReady:true,rewards:rewardPolicy(1),rewardActivity:rows};
 assert.deepEqual(prizeEstimate(race,[],payouts),allocateRewards('10000',0,1,rows));
 assert.equal(prizeEstimate({...race,rewardActivity:undefined,activity:rows},[],payouts),null,'missing new activity must not silently use a legacy bucket');
 const legacy=[{wallet:a,runs:'1',seconds:'180'}];
 const expected=allocateRewards('90',0,1,legacy,1);
 assert.deepEqual(makePlan({paid:'100',top:[],activity:legacy,reward_version:1},'0',1).participation,expected.participation);
 assert.deepEqual(prizeEstimate({...race,rewards:rewardPolicy(1,1),activity:legacy},[],payouts),allocateRewards('10000',0,1,legacy,1));
});
