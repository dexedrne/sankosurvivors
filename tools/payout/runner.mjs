import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { makePlan, units, dmt, DMT, HOUSE, COLLECT, weekOf, weekEnd, GRACE_MS, racesOf, firstWeek } from './core.mjs';
import { kpmWeek, kpm } from '../../src/ranked.js';
import { address, sign1559, decode1559, transferData } from './crypto.mjs';
import { quantity, quantityBigInt } from './ports.mjs';
const TRANSFER='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const short=w=>w.slice(0,6)+'…'+w.slice(-4);
const clean=s=>String(s??'Adventurer').replace(/[\x00-\x1f\x7f]/g,'').slice(0,32);
const sum=rows=>rows.reduce((s,r)=>s+units(r.amount),0n);
// rows and plans written before the Hard race have no mode: they are all Normal
const modeOf=x=>x.mode??'normal';
const planOf=(state,row)=>state.weeks.find(w=>w.week===row.week&&modeOf(w)===modeOf(row));
const RACE={normal:'Normal',hard:'Hard'};

export function validateState(state) {
  if(!Array.isArray(state.rows)||!Array.isArray(state.weeks))throw Error('invalid payout ledger');
  const ids=new Set(),nonces=new Set();
  for(const row of state.rows) {
    if(!/^\d+$/.test(row.id)||ids.has(row.id)||!Number.isInteger(row.week)||row.week< -1)throw Error('invalid payout identity');ids.add(row.id);
    address(row.wallet);units(row.amount);
    if(!['prize1','prize2','prize3','prize4','prize5','house','refund','rollover-note'].includes(row.kind)||!['planned','held','sending','sent','confirmed','failed'].includes(row.status)||!['normal','hard'].includes(modeOf(row)))throw Error('invalid payout row');
    if(row.nonce!=null){units(row.nonce);if(nonces.has(row.nonce))throw Error('duplicate nonce');nonces.add(row.nonce);}
    if(['sending','sent'].includes(row.status)&&row.nonce==null)throw Error('missing nonce');
    if(row.kind==='refund') {if(!/^\d+$/.test(row.source_entry_id))throw Error('invalid refund source');continue;}
    const week=planOf(state,row);if(!week)throw Error('missing weekly plan');
    const expected=makePlan({paid:week.paid,top:week.top},week.incoming,week.week);
    if(expected.pool!==week.pool||expected.rollover!==week.rollover||expected.house!==week.house)throw Error('invalid weekly totals');
    const prize=expected.prizes[Number(row.kind.slice(-1))-1];
    const amount=row.kind==='house'?week.house:row.kind==='rollover-note'?week.rollover:prize?.amount;
    const destination=row.kind==='house'?HOUSE:row.kind==='rollover-note'?COLLECT:prize?.wallet;
    if(row.amount!==amount||row.wallet!==destination)throw Error('row differs from weekly plan');
  }
  const plans=new Set();
  for(const week of state.weeks) {
    if(!['normal','hard'].includes(modeOf(week))||week.week<firstWeek(modeOf(week))||plans.has(week.week+':'+modeOf(week)))throw Error('invalid weekly plan');
    plans.add(week.week+':'+modeOf(week));
    const mine=r=>r.week===week.week&&modeOf(r)===modeOf(week);
    const refund=sum(state.rows.filter(r=>mine(r)&&r.kind==='refund'));
    const budget=units(week.pool)+units(week.house)+refund;
    if(state.rows.some(r=>mine(r)&&units(r.amount)>budget))throw Error('transfer exceeds weekly funds');
    if(!Number.isFinite(Date.parse(week.pay_at)))throw Error('invalid payout time');
  }
}
function savedTransaction(row,config) {
  const tx=decode1559(row.raw_tx);
  if(tx.hash!==row.tx_hash||tx.chainId!==42161n||tx.from!==config.wallet||tx.to!==DMT||tx.value!==0n||tx.nonce!==units(row.nonce)||tx.data!==transferData(row.wallet,row.amount)||tx.maxFee>config.maxFee||tx.maxFee<tx.priority||tx.gas>12000000n)throw Error('saved transaction mismatch or cap');
  return tx;
}
function matches(tx,row,config) {
  return tx?.from?.toLowerCase()===config.wallet&&tx.to?.toLowerCase()===DMT&&quantityBigInt(tx.nonce)===units(row.nonce)&&quantityBigInt(tx.value??'0x0')===0n&&(tx.input??tx.data)?.toLowerCase()===transferData(row.wallet,row.amount);
}
export async function run(config,{rpc,chain,notify,log=console.log,key,now=Date.now,pause=sleep}) {
  const owner=randomUUID();
  const call=async(name,args={})=>{
    const result=await rpc('sqs_payout_'+name,{p_key:config.payoutKey,...args});
    if(result.error)throw Error('payout database rejected '+name);return result;
  };
  const notice=async(name,text)=>{
    if((await call('notice',{p_name:(config.live?'live:':'dry:')+name})).ok) {
      try{await notify(text);}catch{log('Notification delivery uncertain; inspect Telegram and the ledger.');}
    }
  };
  const alert=(code)=>{log('PAUSED: '+code);return notice('alert:'+code,'ALERT: payout paused — '+code+'. Review the ledger before changing anything.');};
  if(!(await call('lease',{p_owner:owner})).ok){log('Another payout run holds the database lease.');return;}
  const renew=async()=>{if(!(await call('lease',{p_owner:owner})).ok)throw Error('payout lease lost');};
  try {
    await call('refunds');
    let state=await call('read');
    // Each race is its own pot: plan it from its own settlement, carrying its own previous week's rollover.
    for(let w=0;w<weekOf(now());w++) {
      if(now()<weekEnd(w)+GRACE_MS)break;
      for(const mode of racesOf(w)) {
        if(state.weeks.some(p=>p.week===w&&modeOf(p)===mode))continue;
        const report=await rpc('sqs_ranked_settle',{p_key:config.reportsKey,p_week:w,p_mode:mode});
        if(report.error)throw Error('settlement unavailable');
        const incoming=w===firstWeek(mode)?'0':state.weeks.find(p=>p.week===w-1&&modeOf(p)===mode)?.rollover;
        if(incoming==null)throw Error('previous plan missing');
        await call('plan',{p_week:w,p_mode:mode,p_plan:makePlan(report,incoming,w)});
        state=await call('read');await renew();
      }
    }
    // The notice claim is durable, so a retry cannot announce the same week twice. (Normal keeps its older notice name.)
    for(const week of state.weeks) {
      const mode=modeOf(week),rows=state.rows.filter(r=>r.week===week.week&&modeOf(r)===mode),refunds=rows.filter(r=>r.kind==='refund');
      const score=p=>kpmWeek(week.week)?`${kpm(p.kills,p.t).toFixed(2)} KPM (${p.kills} kills in ${Math.floor(p.t/60)}m ${p.t%60}s)`:`${Math.floor(p.t/60)}m ${p.t%60}s`;
      const winners=week.top.slice(0,5).map((p,i)=>{
        const amount=rows.find(r=>r.kind==='prize'+(i+1))?.amount??'0';
        return `${i+1}. ${clean(p.name)} ${short(p.wallet)} ${score(p)}: ${dmt(amount)} DMT`;
      }).join('\n')||'No ranked finishers.';
      await notice('week:'+week.week+(mode==='normal'?'':':'+mode),`${config.live?'':'DRY RUN — ' }Week ${week.week} ${RACE[mode]} ranked results\nWinners\n${winners}\nHouse: ${dmt(week.house)} DMT. Rollover: ${dmt(week.rollover)} DMT.\nRefunds: ${refunds.length}, ${dmt(sum(refunds))} DMT; due immediately.\nPrizes/house due ${week.pay_at} (24 hours after week end).${config.live?'':' Sending is disabled.'}\nHold a winner before sending (holds cover both races):\nnode tools/payout/hold.mjs ${week.week} <wallet> "<reason>"\nUse the full wallet from the ledger. A hold after sending does nothing.`);
    }
    try{validateState(state);}catch{await alert('invalid ledger');return;}
    const outstanding=state.rows.filter(r=>r.kind!=='rollover-note'&&r.status!=='confirmed');
    const inFlight=outstanding.filter(r=>['sending','sent'].includes(r.status)).sort((a,b)=>Number(BigInt(a.nonce)-BigInt(b.nonce)));
    const mark=async(row,status,args={})=>{
      await call('mark',{p_id:row.id,p_status:status,...(row.tx_hash?{p_hash:row.tx_hash}:{}),...args});
      row.status=status;if(args.p_hash)row.tx_hash=args.p_hash;if(args.p_raw)row.raw_tx=args.p_raw;
    };
    const receipt=async row=>{
      const r=await chain.rpc('eth_getTransactionReceipt',[row.tx_hash]);if(!r)return false;
      if(r.transactionHash?.toLowerCase()!==row.tx_hash)throw Error('receipt hash mismatch');
      if(r.status!=='0x1'){await mark(row,'failed',{p_error:'transaction reverted'});await alert('reverted row '+row.id);return false;}
      const event=r.logs?.some(e=>e.address?.toLowerCase()===DMT&&e.topics?.length===3&&e.topics[0]===TRANSFER&&e.topics[1]?.toLowerCase()==='0x'+config.wallet.slice(2).padStart(64,'0')&&e.topics[2]?.toLowerCase()==='0x'+row.wallet.slice(2).padStart(64,'0')&&e.data?.toLowerCase()==='0x'+units(row.amount).toString(16).padStart(64,'0'));
      if(!event){await mark(row,'failed',{p_error:'missing exact DMT Transfer event'});await alert('receipt mismatch row '+row.id);return false;}
      const block=quantityBigInt(r.blockNumber),head=quantityBigInt(await chain.rpc('eth_blockNumber'));
      if(head<block+20n)return false;
      const canonical=await chain.rpc('eth_getBlockByNumber',[quantity(block),false]);
      if(canonical?.hash!==r.blockHash)throw Error('receipt is not canonical');
      if(row.status==='sending')await mark(row,'sent',{p_hash:row.tx_hash});
      await mark(row,'confirmed');log(`CONFIRMED row ${row.id} ${dmt(row.amount)} DMT to ${row.wallet} ${row.tx_hash}`);return true;
    };
    const recover=[];
    try {
      for(const row of inFlight) {
        if(!row.tx_hash) {
          const pending=quantityBigInt(await chain.rpc('eth_getTransactionCount',[config.wallet,'pending']));
          const tx=await chain.findNonce(config.wallet,row.nonce,row.scan_block);
          if(!tx&&pending<=units(row.nonce)){recover.push(row);continue;}
          if(!tx||!matches(tx,row,config)){await alert('unresolved nonce row '+row.id);return;}
          if(!config.live){log(`WOULD FOLLOW row ${row.id} ${tx.hash}`);continue;}
          await mark(row,'sent',{p_hash:tx.hash});
        }
        if(await receipt(row))continue;
        if(row.status==='failed')return;
        const tx=await chain.rpc('eth_getTransactionByHash',[row.tx_hash]);
        if(tx){if(!matches(tx,row,config))throw Error('chain transaction mismatch');log(`PENDING row ${row.id} ${row.tx_hash}`);return;}
        if(!row.raw_tx){await alert('missing signed transaction row '+row.id);return;}
        savedTransaction(row,config);recover.push(row);
      }
    }catch{await alert('chain recovery unavailable');return;}
    if(outstanding.some(r=>r.status==='failed')){await alert('failed transfer requires review');return;}
    const due=outstanding.filter(r=>r.status==='planned'&&(r.kind==='refund'||Date.parse(planOf(state,r)?.pay_at)<=now()));
    // A refund repays a real payment: its entry's transaction must hold DMT Transfer logs of exactly that amount from that
    // wallet to the entry wallet, and no payment is refunded twice. A ledger row alone (a database write, a leaked server key)
    // can never move DMT (security pass, 3 Nov).
    const refundTx=new Map();
    for(const row of state.rows.filter(r=>r.kind==='refund')){const tx=String(row.source_tx??'').toLowerCase();if(refundTx.has(tx)&&tx){await alert('refund paid twice row '+row.id);return;}refundTx.set(tx,row.id);}
    for(const row of due.filter(r=>r.kind==='refund')){
      const tx=String(row.source_tx??'').toLowerCase();
      if(!/^0x[0-9a-f]{64}$/.test(tx)){await alert('unverified refund row '+row.id);return;}
      let r;try{r=await chain.rpc('eth_getTransactionReceipt',[tx]);}catch{await alert('chain unavailable');return;}
      let paid=0n;
      for(const l of r?.status==='0x1'?r.logs??[]:[])if(l.address?.toLowerCase()===DMT&&l.topics?.[0]===TRANSFER&&l.topics[1]?.toLowerCase()==='0x'+row.wallet.slice(2).toLowerCase().padStart(64,'0')&&l.topics[2]?.toLowerCase()==='0x'+config.wallet.slice(2).toLowerCase().padStart(64,'0'))paid+=BigInt(l.data);
      if(paid!==units(row.amount)){await alert('unverified refund row '+row.id);return;}
    }
    const work=[...recover,...due];
    if(!work.length){log('No transfers due.');return;}
    let fees,gasById;
    try {
      for(const row of work) {
        const weekRows=state.rows.filter(r=>r.week===row.week&&r.kind!=='rollover-note');
        if(sum(weekRows)>config.weekCap||weekRows.some(r=>units(r.amount)>config.transferCap))throw Error('DMT cap');
      }
      const balances=await chain.balances(config.wallet);
      // Reserve held awards and each race's latest rollover as well as every unsettled week.
      let reserve=0n;
      for(const mode of ['normal','hard']){const latest=state.weeks.filter(w=>modeOf(w)===mode).sort((a,b)=>a.week-b.week).at(-1);if(latest)reserve+=units(latest.rollover);}
      if(balances.dmt<sum(outstanding.filter(r=>r.status!=='confirmed'))+reserve)throw Error('DMT balance');
      fees=await chain.fees(config.maxFee);gasById=new Map();let gasCost=0n;
      for(const row of outstanding.filter(r=>r.status!=='confirmed')) {
        const gas=row.raw_tx?savedTransaction(row,config).gas:await chain.estimate(config.wallet,row,fees);
        gasById.set(row.id,gas);gasCost+=gas*(row.raw_tx?savedTransaction(row,config).maxFee:fees.maxFee);
      }
      if(gasCost>balances.eth)throw Error('ETH balance');
      const runCost=work.reduce((s,r)=>s+gasById.get(r.id)*(r.raw_tx?savedTransaction(r,config).maxFee:fees.maxFee),0n);
      if(runCost>config.ethCap)throw Error('run gas cap');
    }catch(error){
      const reason=['DMT cap','DMT balance','ETH balance','run gas cap','gas price cap'].includes(error.message)?error.message:'chain unavailable';
      await alert('weeks '+[...new Set(work.map(r=>r.week))].join(',')+': '+reason);return;
    }
    if(!config.live){for(const row of work)log(`WOULD SEND row ${row.id} ${row.kind} week ${row.week}: ${dmt(row.amount)} DMT to ${row.wallet}`);return;}
    let privateKey;
    for(let row of work) {
      await renew();
      if(!row.raw_tx) {
        privateKey??=await key();
        const pending=quantityBigInt(await chain.rpc('eth_getTransactionCount',[config.wallet,'pending']));
        const block=quantityBigInt(await chain.rpc('eth_blockNumber'));
        if(row.status==='planned'){
          const claim=await rpc('sqs_payout_claim',{p_key:config.payoutKey,p_id:row.id,p_pending:pending.toString(),p_block:block.toString()});
          if(claim.error)continue;
          row=claim.row;
        }
        const signed=sign1559({chainId:42161,nonce:row.nonce,priority:fees.priority,maxFee:fees.maxFee,gas:gasById.get(row.id),to:DMT,data:transferData(row.wallet,row.amount)},privateKey);
        await mark(row,'sending',{p_hash:signed.hash,p_raw:signed.raw});
      }
      savedTransaction(row,config);await renew();
      // An ambiguous broadcast stays in flight. Never create a replacement transaction.
      try {
        const returned=await chain.rpc('eth_sendRawTransaction',[row.raw_tx]);
        if(returned!==row.tx_hash)throw Error('broadcast hash mismatch');
      }catch{await alert('broadcast uncertain row '+row.id);return;}
      await mark(row,'sent');log(`SENT row ${row.id} ${dmt(row.amount)} DMT to ${row.wallet} ${row.tx_hash}`);
      let confirmed=false;
      try {for(let i=0;i<3;i++){if(await receipt(row)){confirmed=true;break;}if(row.status==='failed')break;if(i<2)await pause(5000);}}
      catch{await alert('receipt follow-up row '+row.id);return;}
      if(!confirmed){log(`FOLLOW UP row ${row.id} ${row.tx_hash} next invocation`);return;}
    }
  }finally {await call('lease',{p_owner:owner,p_release:true});}
}
