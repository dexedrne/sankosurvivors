import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IMPORT_BACKUP_KEY,RUN_SAVE_KEY,recoverRunProgress} from '../src/progress-import.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const boot=main.slice(main.indexOf('// A previous import'),main.indexOf('// ---- saved progress'));
function startup(values){const data=new Map(Object.entries(values)),calls=[],ui=[];const storage={getItem:k=>{calls.push(['read',k]);return data.get(k)??null;},setItem(k,v){calls.push(['write',k]);data.set(k,v);},removeItem(k){calls.push(['remove',k]);data.delete(k);}};let error=null;try{Function('localStorage','IMPORT_BACKUP_KEY','RUN_SAVE_KEY','recoverRunProgress','showProgressRecovery',boot)(storage,IMPORT_BACKUP_KEY,RUN_SAVE_KEY,recoverRunProgress,(...args)=>ui.push(args));}catch(e){error=e;}return{data,calls,ui,error};}
test('startup finishes journaled run rewards before profile initialization and clears only its own journal',()=>{
 const f=startup({[RUN_SAVE_KEY]:JSON.stringify({v:1,data:{'sq-coins':'609','sq-quests':'["goblins"]'}}),'sq-coins':'234','sq-cloud':'keep-session','sq-ranked-live':'keep-ticket'});assert.equal(f.data.get('sq-coins'),'609');assert.equal(f.data.get('sq-quests'),'["goblins"]');assert.equal(f.data.has(RUN_SAVE_KEY),false);assert.equal(f.data.get('sq-cloud'),'keep-session');assert.equal(f.data.get('sq-ranked-live'),'keep-ticket');assert.equal(f.error,null);assert.equal(f.ui.length,0);
});
test('invalid run journal blocks startup in run-specific recovery without deleting progress',()=>{
 const f=startup({[RUN_SAVE_KEY]:'broken','sq-coins':'234'});assert.ok(f.error);assert.equal(f.ui.length,1);assert.ok(f.ui[0][2]?.retry,'actual run recovery handler');assert.equal(f.data.get('sq-coins'),'234');assert.equal(f.data.get(RUN_SAVE_KEY),'broken');
});
test('startup never silently reorders simultaneous import and run journals',()=>{
 const f=startup({[RUN_SAVE_KEY]:JSON.stringify({v:1,data:{'sq-coins':'609'}}),[IMPORT_BACKUP_KEY]:JSON.stringify({v:1,before:{'sq-coins':'100'}}),'sq-coins':'234'});assert.ok(f.error);assert.equal(f.data.get('sq-coins'),'234');assert.ok(f.data.has(RUN_SAVE_KEY));assert.ok(f.data.has(IMPORT_BACKUP_KEY));
});
