import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,wallet,TRANSFER} from './helpers/payout.mjs';
import {run} from '../tools/payout/runner.mjs';
import {decimal,DMT,HOUSE} from '../tools/payout/core.mjs';
import {FIRST_BONUS} from '../src/first-bonus.js';
function setup({afterReset=false,eligible=true,balance='100',live=false}={}){
 const f=fixture(5);f.db.refunds=[];f.config.live=live;f.db.now=afterReset?Date.UTC(2026,10,17,1):1794590545000+60000;f.chain.dmt=decimal(balance);const original=f.ports.rpc;f.rpcCalls=[];
 if(afterReset)f.db.reports.set(1,{week:1,mode:'normal',paid:decimal('11').toString(),top:eligible?[{wallet:wallet(1),t:600,kills:600}]:[],activity:[{wallet:wallet(1),paid:decimal('10').toString(),seconds:'600',runs:'1'},{wallet:wallet(2),paid:decimal('1').toString(),seconds:'300',runs:'1'}]});
 f.ports.rpc=async(fn,p)=>{f.rpcCalls.push(fn);if(fn==='sqs_payout_first_bonus'){
  const prize=f.db.rows.find(r=>r.week===1&&r.mode==='normal'&&r.kind==='prize1');if(!prize)return{ok:true,waiting:true};if(f.db.rows.some(r=>r.kind==='prize-bonus'))return{ok:true,again:true};
  f.db.row(1,'prize-bonus',prize.wallet,FIRST_BONUS.amountWei,{status:f.db.holds.some(h=>h.week===1&&h.wallet===prize.wallet)?'held':'planned'});return{ok:true};
 }return original(fn,p);};
 const tx=FIRST_BONUS.tx,block='0x3ca',blockHash='0x'+'c'.repeat(64);
 f.chain.receipts.set(tx,{transactionHash:tx,status:'0x1',blockNumber:block,blockHash,logs:[{address:DMT,topics:[TRANSFER,'0x'+HOUSE.slice(2).padStart(64,'0'),'0x'+f.config.wallet.slice(2).padStart(64,'0')],data:'0x'+BigInt(FIRST_BONUS.amountWei).toString(16).padStart(64,'0'),removed:false,transactionHash:tx,blockNumber:block,blockHash,logIndex:'0x0'}]});return f;
}
for(const balance of ['29.999999999999999999','30'])test('unplanned funded bonus20 stays reserved; balance'+balance,async()=>{
 const f=setup({balance});await run(f.config,f.ports);assert.equal(f.logs.some(s=>s.startsWith('WOULD SEND')),balance==='30');assert.equal(f.chain.broadcasts.length,0);
});
test('new worker creates bonus once alongside unchanged normal plan and pays it only to first place',async()=>{
 const f=setup({afterReset:true,live:true});await run(f.config,f.ports);await run(f.config,f.ports);
 const bonus=f.db.rows.filter(r=>r.kind==='prize-bonus');assert.equal(bonus.length,1);assert.equal(bonus[0].wallet,wallet(1));assert.equal(bonus[0].amount,FIRST_BONUS.amountWei);assert.equal(bonus[0].status,'confirmed');
 assert(f.rpcCalls.includes('sqs_payout_first_bonus'));assert(f.chain.broadcasts.some(tx=>tx.data.endsWith(BigInt(FIRST_BONUS.amountWei).toString(16).padStart(64,'0'))));
 const p=f.db.weeks.find(w=>w.week===1&&w.mode==='normal');assert.equal(p.house,decimal('1.1').toString());assert.equal(p.pool,decimal('9.9').toString());
});
test('an empty eligible board keeps bonus20 reserved after the week has settled',async()=>{
 const f=setup({afterReset:true,eligible:false,balance:'21'});await run(f.config,f.ports);assert.equal(f.db.rows.some(r=>r.kind==='prize-bonus'),false);assert(!f.logs.some(s=>s.startsWith('WOULD SEND')));assert.equal(f.chain.broadcasts.length,0);
});
for(const flaw of ['missing','wrong amount','removed','duplicate index','wrong from','wrong block','unfinalized'])test('bonus fundingproof fails safely for '+flaw,async()=>{
 const f=setup({afterReset:true}),r=f.chain.receipts.get(FIRST_BONUS.tx),e=r.logs[0];
 if(flaw==='missing')f.chain.receipts.delete(FIRST_BONUS.tx);
 if(flaw==='wrong amount')e.data='0x'+BigInt(decimal('19')).toString(16).padStart(64,'0');
 if(flaw==='removed')e.removed=true;
 if(flaw==='duplicate index')r.logs.push({...e});
 if(flaw==='wrong from')e.topics[1]='0x'+wallet(99).slice(2).padStart(64,'0');
 if(flaw==='wrong block')r.blockHash='0x'+'d'.repeat(64);
 if(flaw==='unfinalized')f.chain.finalized=960n;
 await run(f.config,f.ports);assert(!f.logs.some(s=>s.includes('WOULD SEND')&&s.includes('prize-bonus')));assert.equal(f.chain.broadcasts.length,0);
});

test('a refund cannot spend the pledged bonus deposit',async()=>{
 const f=setup({afterReset:true,live:true});f.db.row(1,'refund',wallet(9),FIRST_BONUS.amountWei,{source_entry_id:'999',source_tx:FIRST_BONUS.tx});await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,0);assert(f.logs.some(s=>s.includes('invalid ledger')));
});
for(const field of ['amount','wallet','week'])test('a forged bonus'+field+' fails before any wallet use',async()=>{
 const f=setup({afterReset:true});await run(f.config,f.ports);const row=f.db.rows.find(r=>r.kind==='prize-bonus');row[field]=field==='amount'?'1':field==='wallet'?wallet(99):0;f.config.live=true;f.logs.length=0;await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,0);assert(f.logs.some(s=>s.includes('invalid ledger')));
});
