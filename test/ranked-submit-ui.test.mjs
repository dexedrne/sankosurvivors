import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const source = main.slice(main.indexOf('async function submitRanked()'),main.indexOf("$('rankedretry').onclick"));
function browser(error,{queueBlocked=false,archiveBlocked=false}={}) {
  const storage = new Map(), elements = new Map();
  const saved = {run:Buffer.from(JSON.stringify({id:77,w:0,seed:12,adv:'adventurer',v:'abcdefabcdef',s:1700000000000})).toString('base64url')+'.fixture-signature',log:{runs:[[30,0,0]],picks:[],uses:[]},name:'Tester'};
  storage.set('sq-ranked-live',JSON.stringify(saved));
  let blocked=queueBlocked,requests=0;
  const store = {getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if((blocked&&k==='sq-ranked-submit')||(archiveBlocked&&k==='sq-ranked-rejected'))throw Error('fixture queue quota');storage.set(k,v);},removeItem:k=>storage.delete(k)};
  const $ = id => { if(!elements.has(id)) elements.set(id,{textContent:'',classList:{hidden:true,add(){this.hidden=true;},remove(){this.hidden=false;}}}); return elements.get(id); };
  const app = Function('localStorage','$','rankedApi',`
    const BASE='./'; let rankedBusy=false,rankedRun={},rankedRec={},lastRun=null;
    const renderRanked=()=>{},rankedMessage=()=>{},readRanked=k=>JSON.parse(localStorage.getItem(k)),rankedLive=()=>readRanked('sq-ranked-live'),writeRanked=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
    ${source}
    return {submitRanked,busy:()=>rankedBusy};
  `)(store,$,async()=>{requests++;throw error;});
  return {app,store,$,saved,allow:()=>blocked=false,requests:()=>requests};
}
test('failed ranked submission-queue write preserves the completed run and presents a working retry',async()=>{
 const b=browser(new TypeError('offline'),{queueBlocked:true});await b.app.submitRanked();assert.equal(b.requests(),0);assert.equal(b.app.busy(),false);assert.deepEqual(JSON.parse(b.store.getItem('sq-ranked-live')),b.saved);assert.equal(b.$('rankedretry').classList.hidden,false);assert.match(b.$('rankedresult').textContent,/Keep this page open/);b.allow();await b.app.submitRanked();assert.equal(b.requests(),1);assert.deepEqual(JSON.parse(b.store.getItem('sq-ranked-submit')),b.saved);assert.equal(b.$('rankedretry').classList.hidden,false);
});
for(const error of [Object.assign(new Error('checking'),{status:409,retry:true}),Object.assign(new Error('outage'),{status:500}),Object.assign(new Error('outage'),{status:503,retry:true}),Object.assign(new Error('slow down'),{status:429}),new TypeError('offline')]) {
  test(`ranked UI keeps the paid run and retry button after ${error.status??'network failure'}`,async()=>{
    const b=browser(error); await b.app.submitRanked();
    assert.deepEqual(JSON.parse(b.store.getItem('sq-ranked-submit')),b.saved);
    assert.ok(b.store.getItem('sq-ranked-live'));
    assert.equal(b.$('rankedretry').classList.hidden,false);
  });
}
test('ranked UI archives rejected gameplay before clearing active journals',async()=>{
  const b=browser(Object.assign(new Error('this run did not check out'),{status:400})); await b.app.submitRanked();
  assert.equal(b.store.getItem('sq-ranked-submit'),null);
  assert.equal(b.store.getItem('sq-ranked-live'),null);
});

test('terminal rejection retains gameplay evidence without the signed ticket or player name',async()=>{
 const b=browser(Object.assign(new Error('20-minute total pause allowance exceeded'),{status:400}));await b.app.submitRanked();
 const raw=b.store.getItem('sq-ranked-rejected');assert.ok(raw);assert.ok(!raw.includes('fixture-signature'));assert.ok(!raw.includes('Tester'));
 const saved=JSON.parse(raw);assert.deepEqual(saved.log,b.saved.log);assert.equal(saved.params.id,77);assert.equal(saved.params.sim,'abcdefabcdef');
});

test('failed rejection-archive write preserves active input evidence and a retry',async()=>{
 const b=browser(Object.assign(new Error('rejected'),{status:400}),{archiveBlocked:true});await b.app.submitRanked();
 assert.ok(b.store.getItem('sq-ranked-live'));assert.ok(b.store.getItem('sq-ranked-submit'));assert.equal(b.$('rankedretry').classList.hidden,false);assert.match(b.$('rankedresult').textContent,/diagnostic replay could not be saved/);
});

test('malformed terminal ticket still archives gameplay and releases an unusable active journal',async()=>{
 const b=browser(Object.assign(new Error('no run'),{status:400}));b.saved.run='malformed';b.store.setItem('sq-ranked-live',JSON.stringify(b.saved));await b.app.submitRanked();
 assert.equal(b.store.getItem('sq-ranked-live'),null);assert.deepEqual(JSON.parse(b.store.getItem('sq-ranked-rejected')).log,b.saved.log);
});
