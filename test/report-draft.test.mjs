import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(process.env.REPORT_DRAFT_SOURCE||new URL('../src/main.js',import.meta.url),'utf8');
const start=source.indexOf("$('bugsend').onclick = async () => {");
assert(start>=0);const end=source.indexOf('\n};',start);assert(end>start);
const handler=source.slice(start,end+4);
function setup(draft){
 const nodes={bugtext:{value:draft},bugmsg:{textContent:'',innerHTML:''},bugsend:{disabled:false}};
 let resolve,reject;const response=new Promise((yes,no)=>{resolve=yes;reject=no;}),requests=[];
 vm.runInNewContext(handler,{$:id=>nodes[id],fetch:(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return response;},BASE:'/',sim:null,selMap:'greentown',selAdv:'adventurer',PLAYER:'self',LATEST:'test',renderer:{getSettings:()=>({})},recentErrors:[],CREATOR:{x:'https://x.com/dexedrne',handle:'dexedrne'}});
 return {nodes,requests,resolve,reject,send:()=>nodes.bugsend.onclick()};
}
test('accepted unchanged report clears only its own raw draft and restores Send',async()=>{
 const f=setup('  first report  '),pending=f.send();assert.equal(f.nodes.bugsend.disabled,true);assert.equal(f.requests[0].body.text,'first report');assert.equal(f.requests[0].url,'/api/report');
 f.resolve({ok:true,status:200});await pending;assert.equal(f.nodes.bugtext.value,'');assert.equal(f.nodes.bugsend.disabled,false);assert.equal(f.nodes.bugmsg.textContent,'Thanks, it was sent.');
});
test('an earlier accepted report preserves a newly typed report',async()=>{
 const f=setup('çamur bug 🐸'),pending=f.send();f.nodes.bugtext.value='A second unsent report';f.resolve({ok:true,status:200});await pending;
 assert.equal(f.nodes.bugtext.value,'A second unsent report');assert.equal(f.requests.length,1);assert.equal(f.requests[0].body.text,'çamur bug 🐸');assert.equal(f.nodes.bugsend.disabled,false);
});
test('accepted response preserves formatting edits even when the trimmed text matches',async()=>{
 const f=setup('first report'),pending=f.send();f.nodes.bugtext.value=' first report ';f.resolve({ok:true,status:200});await pending;assert.equal(f.nodes.bugtext.value,' first report ');
});
for(const status of [429,503,500])test(`HTTP${status} preserves a newer draft and restores Send`,async()=>{
 const f=setup('first report'),pending=f.send();f.nodes.bugtext.value='New unsent details';f.resolve({ok:false,status});await pending;assert.equal(f.nodes.bugtext.value,'New unsent details');assert.equal(f.nodes.bugsend.disabled,false);
});
test('network failure preserves the draft and restores Send',async()=>{
 const f=setup('first report'),pending=f.send();f.nodes.bugtext.value='New unsent details';f.reject(Error('offline'));await pending;assert.equal(f.nodes.bugtext.value,'New unsent details');assert.equal(f.nodes.bugsend.disabled,false);assert.equal(f.nodes.bugmsg.textContent,'Could not send.');
});
test('short report refuses without submitting or clearing it',async()=>{
 const f=setup(' x ');await f.send();assert.equal(f.requests.length,0);assert.equal(f.nodes.bugtext.value,' x ');assert.equal(f.nodes.bugmsg.textContent,'Write a few words first.');
});
