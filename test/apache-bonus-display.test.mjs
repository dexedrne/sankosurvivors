import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FIRST_BONUS} from '../src/first-bonus.js';
import {allocateRewards,rewardPolicy} from '../src/reward-policy.js';
import {prizeEstimate,prizeNotes,walletPrize} from '../src/prize-display.js';
const {handle}=createRequire(import.meta.url)('../tools/vercel-api/ranked.js');
const a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40),w=n=>String(BigInt(n)*10n**18n),payouts=[.4,.25,.15,.12,.08];
const race=()=>({week:1,mode:'normal',poolWei:w(10),incomingWei:'0',rolloverReady:true,rewards:rewardPolicy(1),rewardActivity:[{wallet:a,runs:'1',seconds:'600',paid:w(10)},{wallet:b,runs:'1',seconds:'300',paid:w(1)}],firstBonusWei:FIRST_BONUS.amountWei,firstBonusTx:FIRST_BONUS.tx});
test('only first-place estimate adds20; ordinary allocation and participation stay exact',()=>{
 const r=race(),base=allocateRewards(w(10),2,1,r.rewardActivity),shown=prizeEstimate(r,[0,1],payouts);assert.equal(shown.prizes[0],String(BigInt(base.prizes[0])+BigInt(w(20))));assert.equal(shown.prizes[1],base.prizes[1]);assert.deepEqual(shown.participation,base.participation);assert.equal(shown.rollover,base.rollover);assert.equal(walletPrize(shown,a,0),String(BigInt(base.prizes[0])+BigInt(w(20))+BigInt(base.participation.find(p=>p.wallet===a).amount)));assert(prizeNotes(r,shown).some(s=>s.includes('20 DMT')&&s.includes('first place')));
});
test('without an eligible placing wallet,20is not redistributed or added to ordinary rollover',()=>{
 const r=race(),base=allocateRewards(w(10),0,1,r.rewardActivity),shown=prizeEstimate(r,[],payouts);assert.deepEqual(shown.prizes,[]);assert.equal(shown.rollover,base.rollover);assert.deepEqual(shown.participation,base.participation);
});
for(const wrong of [{week:0},{week:2},{mode:'hard'},{firstBonusWei:w(19)},{firstBonusTx:'0x'+'f'.repeat(64)}])test('unexpected bonusmetadata never becomes a forecast '+JSON.stringify(wrong),()=>{assert.equal(prizeEstimate({...race(),...wrong},[0],payouts),null);});
test('legacy pages/boards without bonusmetadata retain ordinary estimates',()=>{
 const r=race();delete r.firstBonusWei;delete r.firstBonusTx;assert.deepEqual(prizeEstimate(r,[0],payouts),allocateRewards(w(10),1,1,r.rewardActivity));
});
async function api(bonus={amountWei:FIRST_BONUS.amountWei,tx:FIRST_BONUS.tx},week=1){
 const now=Date.now;Date.now=()=>Date.UTC(2026,10,2)+week*7*86400000+3600000;const calls=[];let out;
 try{await handle('ranked-week',{method:'GET'},{},{rpc:async(fn,p)=>{calls.push(fn);if(fn==='sqs_ranked_bonus')return bonus;return{reward_version:2,entries:0,paid:'0',incoming:'0',incoming_ready:true,rows:[],activity:[]};},send:(_,status,json)=>out={status,json}});}finally{Date.now=now;}return{...out,calls};
}
test('rankedAPI publishes fixed funded bonus separately from pool and fees',async()=>{
 const r=await api();assert.equal(r.status,200);assert.equal(r.json.races.normal.firstBonusWei,w(20));assert.equal(r.json.races.normal.firstBonusTx,FIRST_BONUS.tx);assert.equal(r.json.races.normal.poolWei,'0');assert.equal(r.json.races.normal.paidWei,'0');assert(r.calls.includes('sqs_ranked_bonus'));
});
test('missing or inconsistent bonusmigration metadata fails before a new quote',async()=>{
 for(const data of [null,{amountWei:w(19),tx:FIRST_BONUS.tx},{amountWei:w(20),tx:'0x'+'f'.repeat(64)},{error:'not installed'}])assert.equal((await api(data)).status,503);
});
test('future weeks do not gain this bonus or call the bonusRPC',async()=>{
 const r=await api(null,2);assert.equal(r.status,200);assert.equal(r.json.races.normal.firstBonusWei,'0');assert(!r.calls.includes('sqs_ranked_bonus'));
});
