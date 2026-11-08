// Old addresses keep their copy; only a complete progress snapshot crosses to the current address.
import {TRANSFER_KEYS,IMPORT_BACKUP_KEY,RUN_SAVE_KEY,importProgress} from './progress-import.js';
import {validProfileValue,finiteNumber} from './progress-values.js';
const HOME='https://sankosurvivors.quest',OLD=['https://sankosurvivors.vyvanse.beer','https://sankoquest.vyvanse.beer'];
const invalid=()=>Object.assign(Error('That old save could not be read. This device’s progress has not changed.'),{carryInvalid:true});
const snapshot=()=>Object.fromEntries(TRANSFER_KEYS.map(k=>[k,localStorage.getItem(k)]));
const same=(a,b)=>TRANSFER_KEYS.every(k=>a[k]===b[k]);
const clear=()=>history.replaceState(null,'',location.pathname+location.search);
export function requireCarryReady(){
 let run=true;
 try{if(localStorage.getItem(RUN_SAVE_KEY)!==null)throw Error();run=false;if(localStorage.getItem(IMPORT_BACKUP_KEY)!==null)throw Error();}
 catch{throw Object.assign(Error('Saved progress must recover before moving saves.'),{recovery:true,runRecovery:run});}
}
function checked(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw invalid();
 const out={};
 for(const k of TRANSFER_KEYS)if(Object.hasOwn(data,k)){
  const raw=data[k];if(typeof raw!=='string'||raw.length>20000)throw invalid();
  if(k==='sq-roofs'){if(!['off','on','auto'].includes(raw))throw invalid();}
  else try{if(!validProfileValue(k,JSON.parse(raw)))throw invalid();}catch{throw invalid();}
  out[k]=raw;
 }
 if(!Object.keys(out).length)throw invalid();return out;
}
function summary(data){
 const parsed={};
 try{for(const[k,raw]of Object.entries(data))if(raw!==null){if(k==='sq-roofs'){if(!['off','on','auto'].includes(raw))throw Error();}else{parsed[k]=JSON.parse(raw);if(!validProfileValue(k,parsed[k]))throw Error();}}}
 catch{return{unreadable:true};}
 return{coins:finiteNumber(parsed['sq-coins']),maps:(parsed['sq-cleared']||[]).length,ranks:Object.values(parsed['sq-skills']||{}).reduce((n,v)=>n+finiteNumber(v),0),gear:(parsed['sq-bank']||[]).length,unreadable:false};
}
export async function carryProgress(choose){
 const source=OLD.includes(location.origin),match=/^#carry=(.*)$/.exec(location.hash);
 let from='';try{from=new URL(document.referrer).origin;}catch{ /* No authorized referrer. */ }
 if(!source&&(!match||location.origin!==HOME||!OLD.includes(from))){if(match)clear();return true;}
 requireCarryReady();
 if(source){
  const data=Object.fromEntries(Object.entries(snapshot()).filter(([,v])=>v!==null));
  if(Object.keys(data).length)checked(data);
  const body=Object.keys(data).length?encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(data))))):'';
  if(body.length>4000000)throw invalid();
  location.replace(HOME+'/'+location.search+(body?'#carry='+body:''));return false;
 }
 let data;
 try{if(match[1].length>4000000)throw invalid();data=checked(JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(match[1]))))));}
 catch{throw invalid();}
 const incoming=Object.fromEntries(TRANSFER_KEYS.map(k=>[k,Object.hasOwn(data,k)?data[k]:null]));
 let changed=false;
 for(;;){
  requireCarryReady();const mine=snapshot();
  if(same(mine,incoming)){clear();return true;}
  const pick=Object.values(mine).every(v=>v===null)?'old':await choose(summary(incoming),summary(mine),changed);
  if(!['old','device'].includes(pick))throw Error('Choose one save before continuing.');
  requireCarryReady();if(!same(mine,snapshot())){changed=true;continue;}
  if(pick==='device'){clear();return true;}
  // A new profile must not upload against the previous wallet baseline; credentials are never read.
  try{importProgress(localStorage,incoming,()=>{localStorage.removeItem('sq-cloud-base');localStorage.removeItem('sq-cloud-upload');});}
  catch(error){if(!error.recovery)try{requireCarryReady();if(same(mine,snapshot()))error.carryCanKeep=true;}catch{ /* Unconfirmed state stays in Retry/recovery. */ }throw error;}
  try{clear();}catch(error){error.carryCommitted=true;throw error;}
  return true;
 }
}
