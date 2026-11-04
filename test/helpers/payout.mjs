import { makePlan, HOUSE, COLLECT, DMT, EPOCH, WEEK, GRACE_MS, firstWeek, decimal } from '../../tools/payout/core.mjs';
import { decode1559, hash, transferData, addressOf } from '../../tools/payout/crypto.mjs';
import { Arbitrum, quantity } from '../../tools/payout/ports.mjs';
export const key='0x'+'01'.padStart(64,'0');
export const wallet=n=>'0x'+n.toString(16).padStart(40,'0');
export const TRANSFER='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
export class FakePayoutDB {
  constructor(){this.weeks=[];this.rows=[];this.holds=[];this.notices=new Set();this.reports=new Map();this.refunds=[];this.owner=null;this.until=0;this.next=1;this.now=Date.UTC(2026,10,10,1);}
  row(week,kind,wallet,amount,extra={}){const r={id:String(this.next++),week,mode:'normal',kind,wallet,amount,status:'planned',nonce:null,tx_hash:null,raw_tx:null,scan_block:null,source_entry_id:null,...extra};this.rows.push(r);return r;}
  // a race's settlement report: reports.get(week) is Normal, reports.get(week+':hard') is Hard
  report(week,mode){return this.reports.get(mode==='hard'?week+':hard':week);}
  async rpc(fn,p={}) {
    const copy=x=>structuredClone(x),err=error=>({error});
    if(fn==='sqs_ranked_settle')return p.p_key==='reports-key'?copy(this.report(p.p_week,p.p_mode??'normal')??{week:p.p_week,mode:p.p_mode??'normal',paid:'0',top:[],refunds:[]}):err('forbidden');
    if(p.p_key!=='payout-key')return err('forbidden');
    switch(fn.replace('sqs_payout_','')) {
      case 'read':return copy({weeks:this.weeks.filter(w=>p.p_week==null||w.week===p.p_week),rows:this.rows.filter(r=>p.p_week==null||r.week===p.p_week).map(r=>this.badAddress&&r.kind==='prize1'?{...r,wallet:'bad'}:r),holds:this.holds});
      case 'plan':{
        const week=p.p_week,mode=p.p_mode??'normal';
        if(!['normal','hard'].includes(mode)||week<firstWeek(mode))return err('no such race that week');
        if(this.weeks.some(w=>w.week===week&&w.mode===mode))return {ok:true,again:true};
        if(week<0||this.now<EPOCH+(week+1)*WEEK+GRACE_MS)return err('submission grace');
        const prev=this.weeks.find(w=>w.week===week-1&&w.mode===mode);if(week>firstWeek(mode)&&!prev)return err('previous week missing');
        const report=this.report(week,mode)??{paid:'0',top:[]},incoming=prev?.rollover??'0',plan=makePlan(report,incoming,week);
        if(JSON.stringify(p.p_plan)!==JSON.stringify(plan))return err('plan differs from settlement');
        const winners=new Set(plan.prizes.map(x=>x.wallet));
        this.weeks.push({week,mode,paid:report.paid,incoming,...plan,top:copy(report.top.filter(x=>winners.has(x.wallet.toLowerCase()))),pay_at:new Date(EPOCH+(week+1)*WEEK+86400000).toISOString()});
        plan.prizes.forEach((prize,i)=>{if(BigInt(prize.amount)>0n)this.row(week,'prize'+(i+1),prize.wallet,prize.amount,{mode,status:this.holds.some(h=>h.week===week&&h.wallet===prize.wallet)?'held':'planned'});});
        if(BigInt(plan.house)>0n)this.row(week,'house',HOUSE,plan.house,{mode});
        this.row(week,'rollover-note',COLLECT,plan.rollover,{mode,status:'confirmed'});return {ok:true};
      }
      case 'refunds':{let added=0;for(const r of this.refunds)if(!this.rows.some(x=>x.source_entry_id===r.id)){const tx=r.tx??('0x'+r.id.padStart(64,'e'));const row=this.row(r.week,'refund',r.wallet,r.paid,{source_entry_id:r.id,mode:r.mode??'normal',source_tx:tx});if(!r.forged)this.onRefund?.(row);added++;}return {ok:true,added};}
      case 'lease':if(p.p_release){if(this.owner===p.p_owner)this.owner=null;return {ok:true};}if(this.owner&&this.owner!==p.p_owner&&this.until>this.now)return {ok:false};this.owner=p.p_owner;this.until=this.now+5*60000;return {ok:true};
      case 'notice':if(this.notices.has(p.p_name))return {ok:false};this.notices.add(p.p_name);return {ok:true};
      case 'hold':{
        const rs=this.rows.filter(r=>r.week===p.p_week&&r.wallet===p.p_wallet&&r.kind.startsWith('prize'));
        const unchanged=rs.filter(r=>['sending','sent','confirmed','failed'].includes(r.status)).length;
        this.holds=this.holds.filter(h=>h.week!==p.p_week||h.wallet!==p.p_wallet);
        if(p.p_reason!=null)this.holds.push({week:p.p_week,wallet:p.p_wallet,reason:p.p_reason});
        rs.filter(r=>['planned','held'].includes(r.status)).forEach(r=>{r.status=p.p_reason==null?'planned':'held';});
        return unchanged?{ok:true,unchanged,message:'already sending or sent; hold does nothing for those'}:{ok:true,unchanged:0};
      }
      case 'claim':{
        const r=this.rows.find(r=>r.id===String(p.p_id));if(!r||r.status!=='planned'||r.kind==='rollover-note'||BigInt(r.amount)<=0n)return err('not claimable');
        if(r.kind!=='refund'&&this.now<Date.parse(this.weeks.find(w=>w.week===r.week&&w.mode===r.mode).pay_at))return err('not due');
        if(r.kind.startsWith('prize')&&this.holds.some(h=>h.week===r.week&&h.wallet===r.wallet))return err('held');
        let nonce=BigInt(p.p_pending);for(const x of this.rows)if(x.nonce!=null&&BigInt(x.nonce)>=nonce)nonce=BigInt(x.nonce)+1n;
        Object.assign(r,{status:'sending',nonce:String(nonce),scan_block:p.p_block});
        if(this.crashClaim)throw Error('simulated crash after claim');return {ok:true,row:copy(r)};
      }
      case 'mark':{
        const r=this.rows.find(r=>r.id===String(p.p_id));if(!r)return err('missing payout');
        if(r.tx_hash&&p.p_hash!==r.tx_hash)return err('immutable hash');
        if(r.raw_tx&&p.p_raw&&r.raw_tx!==p.p_raw)return err('immutable transaction');
        if(!((p.p_status==='sending'&&r.status==='sending'&&p.p_hash&&p.p_raw)||(p.p_status==='sent'&&['sending','sent'].includes(r.status)&&p.p_hash)||(p.p_status==='confirmed'&&r.status==='sent'&&p.p_hash===r.tx_hash)||(p.p_status==='failed'&&['sending','sent'].includes(r.status)&&p.p_error)))return err('invalid transition');
        Object.assign(r,{status:p.p_status,tx_hash:r.tx_hash??p.p_hash??null,raw_tx:r.raw_tx??p.p_raw??null,error:p.p_error??null});
        if(this.crashPrepared&&p.p_status==='sending')throw Error('simulated crash after prepared');
        if(this.crashSent&&p.p_status==='sent')throw Error('simulated crash after sent');
        return {ok:true};
      }
      default:throw Error('unexpected RPC '+fn);
    }
  }
}
export class FakeChain {
  constructor(){this.chainId='0xa4b1';this.dmt=decimal('10000');this.eth=decimal('1');this.transactions=[];this.broadcasts=[];this.receipts=new Map();this.block=1000n;this.pending=0n;this.timeout=false;this.fail=false;this.unmined=false;this.reverted=false;this.missingLog=false;this.calls=[];}
  async request(method,params=[]) {
    this.calls.push(method);
    switch(method){
      case 'eth_chainId':return this.chainId;
      case 'eth_call':return quantity(this.dmt);
      case 'eth_getBalance':return quantity(this.eth);
      case 'eth_feeHistory':return {baseFeePerGas:['0x989680','0x989680'],reward:[['0x0']]};
      case 'eth_gasPrice':return '0x989680';
      case 'eth_estimateGas':return '0x186a0';
      case 'eth_getTransactionCount':return quantity(this.pending);
      case 'eth_blockNumber':return quantity(this.block);
      case 'eth_getTransactionReceipt':return this.receipts.get(params[0])??null;
      case 'eth_getTransactionByHash':return this.transactions.find(t=>t.hash===params[0])??null;
      case 'eth_getBlockByNumber':return {number:quantity(this.block),hash:'0x'+'c'.repeat(64),transactions:this.transactions};
      case 'eth_sendRawTransaction':{
        if(this.fail)throw Error('broadcast rejected');
        const tx=decode1559(params[0]);
        const old=this.transactions.find(t=>t.hash===tx.hash);if(old){if(this.timeout)throw Error('timed out again');return old.hash;}
        if(this.transactions.some(t=>BigInt(t.nonce)===tx.nonce))throw Error('nonce already used');
        this.broadcasts.push(tx);this.transactions.push({...tx,value:quantity(tx.value),nonce:quantity(tx.nonce),input:tx.data,blockNumber:quantity(this.block-30n)});this.pending=tx.nonce+1n;
        if(!this.unmined){
          this.receipts.set(tx.hash,{transactionHash:tx.hash,status:this.reverted?'0x0':'0x1',blockNumber:quantity(this.block-30n),blockHash:'0x'+'c'.repeat(64),logs:this.missingLog?[]:[{address:DMT,topics:[TRANSFER,'0x'+tx.from.slice(2).padStart(64,'0'),'0x'+tx.data.slice(10,74)],data:'0x'+tx.data.slice(74)}]});
          this.dmt-=BigInt('0x'+tx.data.slice(74));
        }
        if(this.timeout)throw Error('accepted but timed out');return tx.hash;
      }
      default:throw Error('unexpected chain method '+method);
    }
  }
  fetch=async(url,opts)=>{const {method,params}=JSON.parse(opts.body);try{return {ok:true,json:async()=>({result:await this.request(method,params)})};}catch{return {ok:true,json:async()=>({error:{message:'simulated RPC failure'}})};}};
}
export function fixture(count=3) {
  const db=new FakePayoutDB(),chain=new FakeChain(),messages=[],logs=[];
  db.reports.set(0,{week:0,paid:decimal('10').toString(),top:Array.from({length:count},(_,i)=>({id:String(i+1),wallet:wallet(i+1),name:'Player '+(i+1),t:900-i})),refunds:[]});
  db.refunds.push({id:'100',week:0,wallet:wallet(9),paid:decimal('0.5').toString()});
  const config={live:true,wallet:addressOf(key),weekCap:decimal('1000'),transferCap:decimal('500'),ethCap:decimal('0.005'),maxFee:2000000000n,payoutKey:'payout-key',reportsKey:'reports-key'};
  // every refund the fake ledger makes repays a real payment the fake chain holds
  db.onRefund=(row)=>{const to=(w)=>({address:DMT,topics:[TRANSFER,'0x'+row.wallet.slice(2).toLowerCase().padStart(64,'0'),'0x'+w.slice(2).toLowerCase().padStart(64,'0')],data:'0x'+BigInt(row.amount).toString(16).padStart(64,'0')});
    chain.receipts.set(row.source_tx,{transactionHash:row.source_tx,status:'0x1',blockNumber:quantity(chain.block-30n),blockHash:'0x'+'c'.repeat(64),logs:[...new Set([config.wallet.toLowerCase(),COLLECT.toLowerCase()])].map(to)});}; // to the fixture's wallet, and to the live one the Vercel loader uses
  const ports={rpc:db.rpc.bind(db),chain:new Arbitrum(chain.fetch),notify:async text=>messages.push(text),log:text=>logs.push(text),key:async()=>key,now:()=>db.now,pause:async()=>{}};
  return {config,ports,db,chain,messages,logs};
}
