import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const start=source.indexOf('  for (const f of view.fx) {');
const end=source.indexOf('\n  }\n}',start);
assert(start>0&&end>start);
const block=source.slice(start,end+4);
function messages(fx,coop=false) {
 const toasts=[];
 Function('view','sim','PLAYER','toast','banner',block)({fx},{coop},'p1',text=>toasts.push(text),()=>{});
 return toasts;
}
for(const [stat,text] of [['might','Damage bonus +1%'],['maxHp','Maximum health bonus +1%'],['area','Area bonus +1%']])test(`actual HUD reports earned ${stat} growth`,()=>{
 const result=messages([{k:'endless-growth',player:'p1',stat}]);
 assert.equal(result.length,1);assert(result[0].includes('Endless growth'));assert(result[0].includes(text));
});
test('co-op HUD only reports its own growth and unknown stat values never enter HTML',()=>{
 assert.deepEqual(messages([{k:'endless-growth',player:'p2',stat:'might'}],true),[]);
 assert.equal(messages([{k:'endless-growth',player:'p1',stat:'area'}],true).length,1);
 assert.deepEqual(messages([{k:'endless-growth',player:'p1',stat:'constructor'},{k:'endless-growth',player:'p1',stat:'<script>'}]),[]);
});
