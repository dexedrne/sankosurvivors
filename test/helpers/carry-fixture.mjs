import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {TRANSFER_KEYS,IMPORT_BACKUP_KEY,RUN_SAVE_KEY,importProgress,recoverProgressImport,recoverRunProgress} from '../../src/progress-import.js';
import {validProfileValue,profileValue,finiteNumber} from '../../src/progress-values.js';
export const J=JSON.stringify,encode=data=>encodeURIComponent(Buffer.from(J(data)).toString('base64'));
export function carryFixture(options={}){
 const values=options.values||new Map(Object.entries(options.before||{})),reads=[],writes=[],redirects=[],clears=[],choices=[],enumerations=[];let fault=options.fault||(()=>false),historyFault=()=>false;
 const hit=(op,k,v)=>{if(fault(op,k,v))throw Error('controlled '+op+' denial: '+k)};
 const storage={get length(){enumerations.push('length');hit('enumerate','length');return values.size},key(i){enumerations.push('key');hit('enumerate','key');return [...values.keys()][i]},getItem(k){reads.push(k);hit('read',k);return values.get(k)??null},setItem(k,v){writes.push(['set',k,v]);hit('set',k,v);values.set(k,v)},removeItem(k){writes.push(['remove',k]);hit('remove',k);values.delete(k)}};
 const location=new URL(options.url||'https://sankosurvivors.quest/?fixture');if(options.hash!==undefined)location.hash=options.hash;else if(options.data!==undefined)location.hash='#carry='+encode(options.data);location.replace=url=>{hit('redirect','location',url);redirects.push(url)};
 const choose=(...args)=>{choices.push(JSON.parse(J(args)));return options.choose?options.choose(...args):'device'};
 const context={URL,location,document:{referrer:options.from===undefined?'https://sankoquest.vyvanse.beer/':options.from},history:{replaceState(_state,_title,url){clears.push(url);if(historyFault())throw Error('controlled URL cleanup denial');location.href=new URL(url,location).href}},localStorage:storage,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),escape,unescape,encodeURIComponent,decodeURIComponent,TRANSFER_KEYS,IMPORT_BACKUP_KEY,RUN_SAVE_KEY,importProgress,recoverProgressImport,recoverRunProgress,validProfileValue,profileValue,finiteNumber,__choose:choose};
 const code=readFileSync(new URL('../../src/carry-progress.js',import.meta.url),'utf8').replace(/^import .+;\n/gm,'').replace(/export (?=(?:async )?function)/g,'');vm.createContext(context);vm.runInContext(code,context);
 return{values,storage,reads,writes,redirects,clears,choices,enumerations,location,context,fault:fn=>fault=fn,historyFault:fn=>historyFault=fn,profile:()=>Object.fromEntries(TRANSFER_KEYS.filter(k=>values.has(k)).map(k=>[k,values.get(k)])),async run(){return vm.runInContext('carryProgress(__choose)',context)}};
}
