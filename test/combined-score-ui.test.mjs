import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{RANKED,kpm,kpmMicro,rankedPoints}from'../src/ranked.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function chase(rows,t,kills){const code=main.slice(main.indexOf('function chaseText('),main.indexOf('const localBest ='));return Function('RANKED','kpm','kpmMicro','rankedPoints','fmtT','chase',code+';return chaseText('+t+','+kills+');')(RANKED,kpm,kpmMicro,rankedPoints,t=>Math.floor(t/60)+':'+String(t%60).padStart(2,'0'),{rows,kp:true,combined:true});}
test('combined chase rewards a stronger full run despite lower KPM',()=>assert.equal(chase([{t:1200,kills:12000}],1800,11500),' · #1 vs starting board'));
test('equal points use KPM then the old finish; one more kill changes place',()=>{
 assert.match(chase([{t:1200,kills:12000}],1800,11400),/1 kill to #1$/);
 assert.match(chase([{t:1200,kills:12000}],1200,12000),/1 kill to #1$/);
 assert.equal(chase([{t:1800,kills:11400}],1200,12000),' · #1 vs starting board');
});
test('combined chase reports the first winning kill total exactly',()=>{
 for(const[t,k,rt,rk]of[[180,100,200,100],[300,1,181,200],[1800,11398,1200,12000],[400,400,500,500]]){
  const text=chase([{t:rt,kills:rk}],t,k),n=Number(text.match(/(\d+) kills? to #1$/)?.[1]);
  let expected=1;while(k+expected+t<rk+rt||(k+expected+t===rk+rt&&BigInt(k+expected)*BigInt(rt)<=BigInt(rk)*BigInt(t)))expected++;
  assert.equal(n,expected,text);
 }
});
test('qualification stays at three minutes',()=>assert.match(chase([{t:200,kills:1}],179,20000),/places from 3:00/));
