import test from 'node:test';
import assert from 'node:assert/strict';
import {dmtText,prizeEstimate,poolReadout,prizeNotes,walletPrize} from '../src/prize-display.js';
import {translateText} from '../src/i18n.js';
import {makePlan} from '../tools/payout/core.mjs';
import {RANKED} from '../src/ranked.js';
test('DMT display preserves all base units, without rounding or scientific notation',()=>{
  for(const [wei,text]of[['0','0'],['1','0.000000000000000001'],['3487500000000000000','3.4875'],['1000000000000000000001','1000.000000000000000001']]) assert.equal(dmtText(wei),text);
  for(const invalid of [null,undefined,1,'01','-1','1e18','0x12','1.2',(1n<<256n).toString()])assert.equal(dmtText(invalid),'—');
});
test('wallet estimates combine placing and participation, including wallets beyond the placing list',()=>{
 const e={prizes:['101'],participation:[{wallet:'first',amount:'9'},{wallet:'outside',amount:'17'}]};
 assert.equal(walletPrize(e,'first',0),'110');assert.equal(walletPrize(e,'outside',-1),'17');assert.equal(walletPrize(e,'outside',25),'17');assert.equal(walletPrize(e,'missing',-1),'0');assert.equal(walletPrize(null,'first',0),null);
});
test('prize estimates match the canonical payout shares/dust/rollover for 0 to 7 eligible winners',()=>{
  for(const paid of ['0','1','10','10001','15500000000000000000'])for(const incoming of ['0','1','1116000000000000001'])for(let n=0;n<=7;n++){
    const report={week:0,paid,top:Array.from({length:n},(_,i)=>({wallet:'0x'+String(i+1).repeat(40),t:180,kills:1}))};
    const canonical=makePlan(report,incoming);
    const estimate=prizeEstimate({poolWei:canonical.pool,rolloverReady:true},Array.from({length:n},(_,i)=>i),RANKED.payouts);
    assert.deepEqual(estimate,{prizes:canonical.prizes.map(p=>p.amount),rollover:canonical.rollover},`${paid}/${incoming}/${n}`);
  }
});
test('ineligible rows do not win or receive dust, and incomplete amounts give no estimate',()=>{
  assert.deepEqual(prizeEstimate({poolWei:'10001',rolloverReady:true},[-1,0,-1,1,2,3],RANKED.payouts),{prizes:['4000','2500','1500','1201'],rollover:'800'});
  for(const race of [{poolWei:null,rolloverReady:false},{poolDmt:13.95},{poolWei:'1.2',rolloverReady:true}])assert.equal(prizeEstimate(race,[0],RANKED.payouts),null);
});
test('pool descriptions distinguish total, entry contribution and unavailable legacy details',()=>{
  assert.equal(poolReadout({entries:31,poolWei:'13950000000000000000',rolloverReady:true}),'31 entries · 13.95 DMT pool.');
  const pending={entries:1,entryPoolWei:'450000000000000000',poolWei:null,rolloverReady:false};
  assert.equal(poolReadout(pending),'1 entries · 0.45 DMT from entries.');
  assert.deepEqual(prizeNotes(pending,null),['Rollover pending settlement; prizes unavailable.']);
  assert.match(poolReadout({poolDmt:13.95}),/updating/);
  const ready={poolWei:'1566000000000000000',incomingWei:'1116000000000000000',rolloverReady:true};
  const notes=prizeNotes(ready,prizeEstimate(ready,[0],RANKED.payouts));
  assert(notes.includes('Includes 1.116 DMT rollover.'));assert(notes[0].includes('before review'));
});
for(const language of ['tr','es','fil'])test(`${language}: precise prize copy translates while amounts stay exact`,()=>{
  for(const source of ['Estimated prize','Estimates at current standings, before review.','Rollover pending settlement; prizes unavailable.','Pool details are updating. Refresh shortly.','Could not refresh ranked standings. Try again shortly.','31 entries · 13.95 DMT pool.','1 entries · 0.45 DMT from entries.','Includes 1.116 DMT rollover.','Unfilled places: 1.116000000000000001 DMT rollover.','Unfilled rewards: 1.116000000000000001 DMT rollover.','Participation rewards','1st: 0.32 DMT + participation','5th: 0.064000000000000001 DMT + participation','Prize pool: 80% placing, 10% qualifying runs, 10% active playtime. No run or time caps; verified runs must last at least 3:00. Pauses earn no participation. The developer earns no prizes.']) {
    const translated=translateText(source,language);assert.notEqual(translated,source,source);
    for(const number of source.match(/\d+(?:\.\d+)?/g)||[])assert(translated.includes(number),number);
  }
});

test('estimated DMT rounds to exactly two decimals with integer arithmetic',async()=>{
 const {estimatedDmtText}=await import('../src/prize-display.js');assert.equal(typeof estimatedDmtText,'function');
 for(const [wei,want]of [['0','0.00'],['1','0.00'],['4999999999999999','0.00'],['5000000000000000','0.01'],['3487500000000000000','3.49'],['1994999999999999999','1.99'],['1995000000000000000','2.00'],['1000000000000000000001','1000.00']])assert.equal(estimatedDmtText(wei),want);
 for(const bad of [null,undefined,1,'01','-1','1e18','0x12','1.2',(1n<<256n).toString()])assert.equal(estimatedDmtText(bad),'—');
});
