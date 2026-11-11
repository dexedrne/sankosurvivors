// Each row is one order at current pool prices. Later orders need fresh quotes.
import {quoteEth,ethWei} from './swap.js';

function decimalEth(wei) {
  const whole=wei/10n**18n,fraction=(wei%10n**18n).toString().padStart(18,'0').replace(/0+$/,'');
  return String(whole)+(fraction?'.'+fraction:'');
}
function gasCost(summary) {
  if(!/^\d+$/.test(summary.gas)||!/^\d+$/.test(summary.gasPrice)||BigInt(summary.gas)<=0n||BigInt(summary.gasPrice)<=0n)return null;
  return BigInt(summary.gas)*BigInt(summary.gasPrice);
}
export async function compareEthBuys(amount,f=fetch) {
  const budget=ethWei(amount),parts=[1,2,4,10];
  const results=await Promise.allSettled(parts.map(n=>quoteEth(decimalEth(budget/BigInt(n)),f)));
  const orders=results.map((result,index)=>{
    if(result.status==='rejected')return {parts:parts[index],error:result.reason?.message||'This quote is unavailable.'};
    const quote=result.value,gasWei=gasCost(quote.summary);
    const cost=BigInt(quote.amountIn)+(gasWei??0n);
    return {parts:parts[index],quote,gasWei,netRate:gasWei===null?null:Number(BigInt(quote.summary.amountOut)*1000000n/cost)/1000000};
  });
  let bestIndex=null;
  if(orders.every(order=>order.quote&&order.gasWei!==null)){
    bestIndex=0;
    for(let i=1;i<orders.length;i++){
      const a=orders[i],b=orders[bestIndex],aCost=BigInt(a.quote.amountIn)+a.gasWei,bCost=BigInt(b.quote.amountIn)+b.gasWei;
      if(BigInt(a.quote.summary.amountOut)*bCost>BigInt(b.quote.summary.amountOut)*aCost)bestIndex=i;
    }
  }
  return {budgetWei:budget.toString(),orders,bestIndex,quotedAt:Date.now()};
}
