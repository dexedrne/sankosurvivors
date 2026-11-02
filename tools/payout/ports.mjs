import { DMT } from './core.mjs';
import { transferData, address } from './crypto.mjs';
export const RPCS = ['https://arb1.arbitrum.io/rpc','https://arbitrum-one-rpc.publicnode.com'];
export const quantity = n => '0x'+BigInt(n).toString(16);
export function quantityBigInt(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) throw new Error('invalid chain quantity');
  return BigInt(value);
}
async function post(fetcher,url,body,headers={}) {
  const response = await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'sankosurvivors-payout/1.0',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('remote request failed');
  return response.json();
}
export function database(config,fetcher=fetch) {
  return async (fn,args={})=>{
    const data = await post(fetcher,config.url+'/rest/v1/rpc/'+fn,args,{apikey:config.supabaseKey,Authorization:'Bearer '+config.supabaseKey});
    if (!data || typeof data !== 'object') throw new Error('invalid database response');
    return data;
  };
}
export function telegram(config,fetcher=fetch) {
  return async text=>{
    const data=await post(fetcher,`https://api.telegram.org/bot${config.telegramToken}/sendMessage`,{chat_id:config.telegramChat,text:text.slice(0,4000),disable_web_page_preview:true});
    if (data.ok!==true) throw new Error('notification failed');
  };
}
export class Arbitrum {
  constructor(fetcher=fetch, urls=RPCS) {this.fetcher=fetcher;this.urls=urls;}
  async rpc(method,params=[]) {
    for(const url of this.urls) {
      try {
        const chain=await post(this.fetcher,url,{jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]});
        if (chain.result !== '0xa4b1') continue;
        const data=method==='eth_chainId'?chain:await post(this.fetcher,url,{jsonrpc:'2.0',id:1,method,params});
        if (data.error || !Object.hasOwn(data,'result')) continue;
        return data.result;
      } catch { /* Never log upstream errors: they can echo request bodies. */ }
    }
    throw new Error('Arbitrum unavailable or wrong chain');
  }
  async balances(wallet) {
    const [token,eth]=await Promise.all([
      this.rpc('eth_call',[{to:DMT,data:'0x70a08231'+address(wallet).slice(2).padStart(64,'0')},'pending']),
      this.rpc('eth_getBalance',[wallet,'pending'])]);
    return {dmt:quantityBigInt(token),eth:quantityBigInt(eth)};
  }
  async fees(cap) {
    let maxFee,priority;
    try {
      const h=await this.rpc('eth_feeHistory',['0x5','latest',[50]]);
      const base=quantityBigInt(h.baseFeePerGas.at(-1));
      priority=h.reward?.length?quantityBigInt(h.reward.at(-1)[0]):0n;
      maxFee=base*2n+priority;
    } catch {maxFee=quantityBigInt(await this.rpc('eth_gasPrice'));priority=0n;}
    if (maxFee<=0n || priority<0n || maxFee>cap || priority>maxFee) throw new Error('gas price cap');
    return {maxFee,priority};
  }
  async estimate(wallet,row,fees) {
    const gas=quantityBigInt(await this.rpc('eth_estimateGas',[{from:wallet,to:DMT,value:'0x0',data:transferData(row.wallet,row.amount),maxFeePerGas:quantity(fees.maxFee),maxPriorityFeePerGas:quantity(fees.priority)}]));
    if (gas<21000n || gas>10000000n) throw new Error('invalid gas estimate');
    return gas*120n/100n;
  }
  async findNonce(wallet,nonce,start) {
    const match=tx=>tx && tx.from?.toLowerCase()===wallet && quantityBigInt(tx.nonce)===BigInt(nonce);
    const pending=await this.rpc('eth_getBlockByNumber',['pending',true]);
    const p=pending?.transactions?.find(match); if(p) return p;
    const pendingNonce=quantityBigInt(await this.rpc('eth_getTransactionCount',[wallet,'pending']));
    if(pendingNonce<=BigInt(nonce))return null;
    const end=quantityBigInt(await this.rpc('eth_blockNumber'));
    const mined=quantityBigInt(await this.rpc('eth_getTransactionCount',[wallet,'latest']));
    if(mined<=BigInt(nonce))throw new Error('pending nonce used but transaction unavailable');
    // Locate the first block that consumed this nonce, without scanning thousands of L2 blocks.
    let low=BigInt(start),high=end;
    if(low>high)throw new Error('invalid recovery range');
    while(low<high){
      const mid=(low+high)/2n;
      const count=quantityBigInt(await this.rpc('eth_getTransactionCount',[wallet,quantity(mid)]));
      if(count>BigInt(nonce))high=mid;else low=mid+1n;
    }
    const block=await this.rpc('eth_getBlockByNumber',[quantity(low),true]);
    const tx=block?.transactions?.find(match);
    if(!tx)throw new Error('nonce transaction unavailable');
    return tx;
  }
}
