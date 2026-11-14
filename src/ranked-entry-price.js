import {raceForWeek} from './ranked.js';

// Wager size changes contribution weight, never the race, physics or scoring.
export function entryForWeek(week,mode='normal',tier='standard') {
 if(!Number.isSafeInteger(week)||week<0||!['standard','high'].includes(tier))return null;
 const race=raceForWeek(week,mode);
 if(!race||tier==='high'&&(week<1||mode!=='normal'))return null;
 return {...race,tier,...(tier==='high'?{entryDmt:'10',entryWei:'10000000000000000000'}:{})};
}
export const entryOptions=(week,mode='normal')=>['standard','high'].map(tier=>entryForWeek(week,mode,tier)).filter(Boolean);

export function entryMessage(nonce,week,mode='normal',deadline,tier='standard') {
 const price=entryForWeek(week,mode,tier)||(tier==='standard'&&Number.isSafeInteger(week)&&week<0?raceForWeek(week,mode):null);
 if(!price||typeof nonce!=='string'||!nonce||nonce.length>2048)return null;
 const message=mode==='hard'
  ? `SankoQuest Survivors ranked\n\nSign to enter this week's Hard ranked race (week ${week}). Signing is free. Your wallet asks separately before sending the ${price.entryDmt} DMT entry.\n\nNonce: ${nonce}`
  : `SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week ${week}). Signing is free. Your wallet asks separately before sending the ${price.entryDmt} DMT entry.\n\nNonce: ${nonce}`;
 if(!Number.isSafeInteger(deadline))return message;
 if(!Number.isFinite(new Date(deadline).getTime()))return null;
 return message+`\n\nI acknowledge this run stops at ${new Date(deadline).toISOString()} and keeps the score earned by then.`;
}
