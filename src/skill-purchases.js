// shortcut: refunds use current rank prices; record past costs before promising historical-payment refunds.
import {SKILLS,SKILL_IDS,clampSkills,skillCost} from './content.js';
import {validProfileValue,finiteNumber} from './progress-values.js';
const problem=()=>Error('Skill progress could not be read. Keep this device’s progress.');
const read=(storage,key,fallback)=>{const raw=storage.getItem(key);return raw===null?fallback:JSON.parse(raw)};
function state(storage){
 const value=read(storage,'sq-coins',0),raw=read(storage,'sq-skills',{});
 if(!validProfileValue('sq-coins',value)||!validProfileValue('sq-skills',raw))throw problem();
 const coins=finiteNumber(value);if(!Number.isSafeInteger(coins)||coins<0)throw problem();
 const levels=clampSkills(raw);let amount=0;
 for(const id of SKILL_IDS)for(let rank=0;rank<(levels[id]||0);rank++)amount+=skillCost(id,rank);
 return{coins,raw,levels,amount,identity:JSON.stringify(raw)};
}
export function skillQuote(storage){const{amount,identity}=state(storage);return{amount,identity}}
export function prepareSkills(storage,action){
 const s=state(storage),raw={...s.raw};let amount=0;
 if(action?.kind==='refund'){
  if(!s.amount)throw Error('There are no skills to refund.');
  amount=s.amount;for(const id of SKILL_IDS)delete raw[id];
 }else if(action?.kind==='train'||action?.kind==='undo'){
  const id=action.id;if(!Object.hasOwn(SKILLS,id))throw Error('Unknown skill.');
  const rank=s.levels[id]||0;
  if(action.kind==='train'){
   if(rank>=SKILLS[id].max)throw Error('That skill is fully trained.');
   amount=-skillCost(id,rank);if(s.coins+amount<0)throw Error('Not enough coins.');
   raw[id]=rank+1;
  }else{
   if(!rank)throw Error('There is no skill rank to undo.');
   amount=skillCost(id,rank-1);raw[id]=rank-1;
  }
 }else throw Error('Unknown skill action.');
 const coins=s.coins+amount;if(!Number.isSafeInteger(coins)||coins<0)throw problem();
 return{data:{'sq-coins':JSON.stringify(coins),'sq-skills':JSON.stringify(raw)},amount};
}
