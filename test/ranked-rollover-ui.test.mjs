import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clockPolicy} from '../src/ranked-clock.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function source(name){const value=main.match(new RegExp('function '+name+'\\(\\) \\{[\\s\\S]*?\\n}'))?.[0];assert.ok(value,'actual '+name+' exists');return value;}
function cutoff({legacy=false,screen='play'}={}) {
 let now=999,end=0;const live={deadline:1000,clockVersion:legacy?0:1},sim={over:null,t:1},hidden=[];
 const enforce=Function('rankedRun','sim','Date','rankedPlaying','endRun','$',`let runStarting=false;${source('enforceRankedDeadline')};return enforceRankedDeadline;`)(live,sim,{now:()=>now},()=>!sim.over,()=>end++,id=>({classList:{add:()=>hidden.push(id)}}));
 return {enforce,live,sim,hidden,advance:()=>now=1000,ended:()=>end,screen};
}
for(const screen of ['play','pause','levelup','casket','settings'])test('midnight ends '+screen+' without another input tick',()=>{
 const c=cutoff({screen});assert.equal(c.enforce(),false);c.advance();assert.equal(c.enforce(),true);assert.equal(c.sim.over,'time');assert.equal(c.live.cutoff,true);assert.equal(c.ended(),1);assert.equal(c.enforce(),false);assert.equal(c.ended(),1);
 assert(c.hidden.includes('casket'));assert(c.hidden.includes('levelup'));assert(c.hidden.includes('pause'));
});
test('a legacy already-issued run keeps its original deadline',()=>{const c=cutoff({legacy:true});c.advance();assert.equal(c.enforce(),false);assert.equal(c.sim.over,null);});
test('consent is unchecked and warns that the earned score ends at reset',()=>{
 const tag=html.match(/<input[^>]*id="rankedack"[^>]*>/)?.[0];assert(tag);assert(!/\bchecked\b/.test(tag));assert.match(html,/I understand that my run ends at the weekly reset/);
 assert.match(html,/Every continuous pause starts with 30 free seconds/);
});
test('deadline is enforced before gameplay input and when the app returns',()=>{
 const raf=main.slice(main.indexOf('function loop('));
 assert.ok(raf.indexOf('enforceRankedDeadline()')>=0&&raf.indexOf('enforceRankedDeadline()')<raf.indexOf('rankedStep('));
 assert.match(main,/visibilitychange[^\n]*enforceRankedDeadline/);
});
test('unchecked or stale consent and the closed window cannot start payment',()=>{
 const deadline=clockPolicy(0).deadline;
 for(const[checked,ack,now,okay]of[[false,deadline,deadline-1800001,false],[true,deadline-1,deadline-1800001,false],[true,deadline,deadline-1800000,false],[true,deadline,deadline-1800001,true]]){
  const read=Function('rankedWeek','rankedAckDeadline','rankedWeekOffset','Date','$','plain','clockPolicy',source('rankedConsent')+';return rankedConsent;')({week:0,open:true},ack,0,{now:()=>now},()=>({checked}),s=>Error(s),clockPolicy);
  if(okay)assert.equal(read(),deadline);else assert.throws(read,/acknowledge|closed/);
 }
});
