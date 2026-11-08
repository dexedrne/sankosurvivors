import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IMPORT_BACKUP_KEY,RUN_SAVE_KEY,recoverRunProgress,recoverProgressImport,importProgress} from '../src/progress-import.js';
import {prepareSkills} from '../src/skill-purchases.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const boot=main.slice(main.indexOf('// A previous import'),main.indexOf('// ---- saved progress'));
function startup(values,denied=()=>false){const data=values instanceof Map?values:new Map(Object.entries(values)),calls=[],ui=[];const storage={getItem:k=>{calls.push(['read',k]);if(denied(k))throw Error('read denied');return data.get(k)??null;},setItem(k,v){calls.push(['write',k]);data.set(k,v);},removeItem(k){calls.push(['remove',k]);data.delete(k);}};let error=null,admitted=false;try{admitted=Function('localStorage','IMPORT_BACKUP_KEY','RUN_SAVE_KEY','recoverRunProgress','showProgressRecovery',boot+'\nreturn true;')(storage,IMPORT_BACKUP_KEY,RUN_SAVE_KEY,recoverRunProgress,(...args)=>ui.push(args));}catch(e){error=e;}return{data,calls,ui,error,admitted,storage};}
test('startup finishes journaled run rewards before profile initialization and clears only its own journal',()=>{
 const f=startup({[RUN_SAVE_KEY]:JSON.stringify({v:1,data:{'sq-coins':'609','sq-quests':'["goblins"]'}}),'sq-coins':'234','sq-cloud':'keep-session','sq-ranked-live':'keep-ticket'});assert.equal(f.data.get('sq-coins'),'609');assert.equal(f.data.get('sq-quests'),'["goblins"]');assert.equal(f.data.has(RUN_SAVE_KEY),false);assert.equal(f.data.get('sq-cloud'),'keep-session');assert.equal(f.data.get('sq-ranked-live'),'keep-ticket');assert.equal(f.error,null);assert.equal(f.ui.length,0);
});
test('invalid run journal blocks startup in run-specific recovery without deleting progress',()=>{
 const f=startup({[RUN_SAVE_KEY]:'broken','sq-coins':'234'});assert.ok(f.error);assert.equal(f.ui.length,1);assert.ok(f.ui[0][2]?.retry,'actual run recovery handler');assert.equal(f.data.get('sq-coins'),'234');assert.equal(f.data.get(RUN_SAVE_KEY),'broken');
});
test('startup never silently reorders simultaneous import and run journals',()=>{
 const f=startup({[RUN_SAVE_KEY]:JSON.stringify({v:1,data:{'sq-coins':'609'}}),[IMPORT_BACKUP_KEY]:JSON.stringify({v:1,before:{'sq-coins':'100'}}),'sq-coins':'234'});assert.ok(f.error);assert.equal(f.data.get('sq-coins'),'234');assert.ok(f.data.has(RUN_SAVE_KEY));assert.ok(f.data.has(IMPORT_BACKUP_KEY));
});
for(const key of[RUN_SAVE_KEY,IMPORT_BACKUP_KEY])for(const present of[false,true])test('unreadable startup marker blocks play until storage recovers: '+key+'/'+present,()=>{
 let denied=true;const values={'sq-coins':'234','sq-skills':'{"combat":1}'};
 if(present)values[key]=JSON.stringify(key===RUN_SAVE_KEY?{v:1,data:{'sq-coins':'609'}}:{v:1,before:{'sq-coins':'1000','sq-skills':'{"combat":2}'}});
 const f=startup(values,k=>denied&&k===key);assert.equal(f.admitted,false);assert.ok(f.error);assert.equal(f.ui.length,1);assert.deepEqual([...f.data].sort(),Object.entries(values).sort());
 denied=false;if(f.ui[0][2]?.retry)f.ui[0][2].retry();else recoverProgressImport(f.storage);
 const resumed=startup(f.data);assert.equal(resumed.admitted,true);assert.equal(resumed.error,null);assert.equal(resumed.data.has(key),false);assert.equal(resumed.data.get('sq-coins'),present?(key===RUN_SAVE_KEY?'609':'1000'):'234');
});
test('a failed Skills commit and rollback stay blocked through denied journal read, then restore the original profile',()=>{
 const f=startup({'sq-coins':'1000','sq-skills':'{"combat":1}','sq-bank':'["Bronze Helmet"]'}),before=[...f.data].sort(),put=f.storage.setItem;
 const next=prepareSkills(f.storage,{kind:'train',id:'combat'});f.storage.setItem=(k,v)=>{if(k==='sq-skills')throw Error('quota');put(k,v)};assert.throws(()=>importProgress(f.storage,next.data),e=>e.recovery===true);assert.ok(f.data.has(IMPORT_BACKUP_KEY));
 const reloaded=startup(f.data,k=>k===IMPORT_BACKUP_KEY);assert.equal(reloaded.admitted,false);assert.equal(reloaded.ui.length,1);
 recoverProgressImport(startup(f.data).storage);assert.deepEqual([...f.data].sort(),before);assert.equal(startup(f.data).admitted,true);
});
