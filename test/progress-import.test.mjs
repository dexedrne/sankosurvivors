import test from 'node:test';
import assert from 'node:assert/strict';
import { importProgress, recoverProgressImport, IMPORT_BACKUP_KEY } from '../src/progress-import.js';
const fixture = initial => {
  const values = new Map(Object.entries(initial)), calls = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem(key, value) { calls.push(['set', key]); values.set(key, value); }, removeItem(key) { calls.push(['remove', key]); values.delete(key); } };
  return { values, calls, storage };
};
test('successful import commits only allowed progress and removes its recovery marker', () => {
  const f = fixture({'sq-coins':'500','sq-cloud':'private fixture','sq-ranked-live':'fixture ticket'});
  importProgress(f.storage, {'sq-coins':'100','sq-name':'"Imported"'});
  assert.equal(f.values.get('sq-coins'),'100');assert.equal(f.values.get('sq-cloud'),'private fixture');assert.equal(f.values.get('sq-ranked-live'),'fixture ticket');assert.equal(f.values.has(IMPORT_BACKUP_KEY),false);
  assert.deepEqual(f.calls[0],['set',IMPORT_BACKUP_KEY]);
});
for (const data of [null, [], {}, {'sq-cloud':'fixture'}, {'sq-coins':100}, {'sq-coins':'x'.repeat(20001)}]) test(`invalid import leaves original progress untouched: ${JSON.stringify(data)?.slice(0,50)}`, () => {
  const f = fixture({'sq-coins':'500'});assert.throws(()=>importProgress(f.storage,data));assert.equal(f.values.get('sq-coins'),'500');assert.deepEqual(f.calls,[]);
});
for (const raw of ['{','null',JSON.stringify({v:2,before:{'sq-coins':'500'}}),JSON.stringify({v:1,before:{'sq-cloud':'private fixture'}}),JSON.stringify({v:1,before:{'sq-coins':5}})]) test(`invalid recovery record is kept without touching progress: ${raw}`, () => {
  const f = fixture({[IMPORT_BACKUP_KEY]:raw,'sq-coins':'100'});assert.throws(()=>recoverProgressImport(f.storage),error=>error.recovery===true);assert.equal(f.values.get(IMPORT_BACKUP_KEY),raw);assert.equal(f.values.get('sq-coins'),'100');assert.deepEqual(f.calls,[]);
});
test('recovery restores absent and opaque original values and can retry an interrupted restoration', () => {
  const raw=JSON.stringify({v:1,before:{'sq-coins':'old opaque value','sq-name':null}}),f=fixture({[IMPORT_BACKUP_KEY]:raw,'sq-coins':'100','sq-name':'"Imported"'}),set=f.storage.setItem;
  f.storage.setItem=()=>{throw Error('quota');};assert.throws(()=>recoverProgressImport(f.storage),error=>error.recovery===true);assert.equal(f.values.get(IMPORT_BACKUP_KEY),raw);
  f.storage.setItem=set;assert.equal(recoverProgressImport(f.storage),true);assert.equal(f.values.get('sq-coins'),'old opaque value');assert.equal(f.values.has('sq-name'),false);assert.equal(recoverProgressImport(f.storage),false);
});
test('loss of read access during rollback still requires recovery', () => {
  const f=fixture({'sq-coins':'500','sq-name':'"Before"'}),get=f.storage.getItem,set=f.storage.setItem;let denied=false;
  f.storage.getItem=key=>{if(denied)throw Error('storage denied');return get(key);};f.storage.setItem=(key,value)=>{if(key==='sq-name'){denied=true;throw Error('storage denied');}set(key,value);};
  assert.throws(()=>importProgress(f.storage,{'sq-coins':'100','sq-name':'"Imported"'}),error=>error.recovery===true);assert.ok(f.values.has(IMPORT_BACKUP_KEY));
});
