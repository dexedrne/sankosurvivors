import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RANKED,kpm,kpmMicro} from '../src/ranked.js';

const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function chaseText('),source.indexOf('const localBest ='));
const fmtT=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const chase=(rows,t,kills,kp=true)=>Function('RANKED','kpm','kpmMicro','fmtT','chase',`${code};return chaseText(${t},${kills});`)(RANKED,kpm,kpmMicro,fmtT,{rows,kp});

test('chase counts one kill when equal KPM wins on total kills',()=>{
  assert.match(chase([{t:180,kills:180}],360,359),/1 kill to #1$/);
  assert.match(chase([{t:181,kills:4}],362,4),/4 kills to #1$/);
});
test('chase needs an extra kill when the older finished run wins the full tie',()=>{
  assert.match(chase([{t:360,kills:360}],360,359),/2 kills to #1$/);
  assert.match(chase([{t:180,kills:0}],360,0),/1 kill to #1$/);
});
test('chase makes no first-place claim before the three-minute minimum',()=>{
  for(const rows of [[{t:90,kills:180}],[{t:180,kills:1}]]) {
    assert.equal(chase(rows,120,500),' · places from 3:00');
  }
});
test('chase labels the starting snapshot rather than promising a live weekly place',()=>{
  assert.match(chase([{t:180,kills:180}],360,359),/#2 vs starting board/);
  assert.equal(chase([{t:180,kills:180}],360,361),' · #1 vs starting board');
});
test('eligible runs outrank short runs; time-scored weeks still use time then kills',()=>{
  assert.equal(chase([{t:120,kills:900}],180,1),' · #1 vs starting board');
  assert.match(chase([{t:180,kills:20}],120,900,false),/1:00 to #1$/);
  assert.equal(chase([{t:180,kills:20}],180,21,false),' · #1 vs starting board');
  assert.equal(chase([],180,1),'');
});

test('reported kills are the first winning total across integer KPM rounding boundaries',()=>{
  for(const t of [180,181,360,361]) for(const rt of [180,181,360,361]) {
    for(const rk of [0,1,4,180,359]) for(const kills of [0,1,4,100]) {
      const text=chase([{t:rt,kills:rk}],t,kills), match=text.match(/(\d+) kills? to #1$/);
      if(!match) continue;
      const n=Number(match[1]);
      // Independent exhaustive search: compare floored integer rates, then total kills, retaining the old finisher on ties.
      const rate=k=>BigInt(k)*60000000n/BigInt(t), opponent=BigInt(rk)*60000000n/BigInt(rt);
      let expected=1;
      while(rate(kills+expected)<opponent || (rate(kills+expected)===opponent && kills+expected<=rk)) expected++;
      assert.equal(n,expected,JSON.stringify({t,rt,rk,kills}));
    }
  }
});
