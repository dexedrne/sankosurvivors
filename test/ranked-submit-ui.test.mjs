import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const source = main.slice(main.indexOf('async function submitRanked()'),main.indexOf("$('rankedretry').onclick"));
function browser(error) {
  const storage = new Map(), elements = new Map();
  const saved = {run:'signed-fixture',log:{runs:[[30,0,0]],picks:[],uses:[]},name:'Tester'};
  storage.set('sq-ranked-live',JSON.stringify(saved));
  const store = {getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  const $ = id => { if(!elements.has(id)) elements.set(id,{textContent:'',classList:{hidden:true,add(){this.hidden=true;},remove(){this.hidden=false;}}}); return elements.get(id); };
  const app = Function('localStorage','$','rankedApi',`
    const BASE='./'; let rankedBusy=false,rankedRun={},rankedRec={},lastRun=null;
    const renderRanked=()=>{},rankedMessage=()=>{},readRanked=k=>JSON.parse(localStorage.getItem(k)),rankedLive=()=>readRanked('sq-ranked-live'),writeRanked=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
    ${source}
    return {submitRanked};
  `)(store,$,async()=>{throw error;});
  return {app,store,$,saved};
}
for(const error of [Object.assign(new Error('checking'),{status:409,retry:true}),Object.assign(new Error('outage'),{status:500}),Object.assign(new Error('outage'),{status:503,retry:true}),Object.assign(new Error('slow down'),{status:429}),new TypeError('offline')]) {
  test(`ranked UI keeps the paid run and retry button after ${error.status??'network failure'}`,async()=>{
    const b=browser(error); await b.app.submitRanked();
    assert.deepEqual(JSON.parse(b.store.getItem('sq-ranked-submit')),b.saved);
    assert.ok(b.store.getItem('sq-ranked-live'));
    assert.equal(b.$('rankedretry').classList.hidden,false);
  });
}
test('ranked UI clears a definitive rejected run',async()=>{
  const b=browser(Object.assign(new Error('this run did not check out'),{status:400})); await b.app.submitRanked();
  assert.equal(b.store.getItem('sq-ranked-submit'),null);
  assert.equal(b.store.getItem('sq-ranked-live'),null);
});
