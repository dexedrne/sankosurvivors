import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {translateText} from '../src/i18n.js';import {FOOD} from '../src/sim.js';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const rules='Food stacks hold up to 5 portions per type. Stored food is automatically eaten before a fatal hit if enough food can save you. Extra pickups are eaten immediately.';
const tip='Ranked food: up to 5 per type. Automatically eaten before a fatal hit when enough food can save you.';
const saved='Stored food saved you.';
test('ranked disclosure appears only from week2',()=>{
 const start=main.indexOf('    if (rankedWeek.week >= 2) {'),end=main.indexOf('    rankedTime();',start);assert(start>=0&&end>start);const code=main.slice(start,end);
 for(const week of[0,1,2,3]){const nodes=[],document={createElement:tag=>({tag,textContent:''})};Function('rankedWeek','document','$',code)({week},document,()=>({append:(...items)=>nodes.push(...items)}));assert.equal(nodes.length,week>=2?2:0);if(week>=2)assert.equal(nodes[1].textContent,rules);}
});
test('actual belt markup shows the food safety explanation only when the simulation rule is active',()=>{
 const a=main.indexOf('  const bk = JSON.stringify('),b=main.indexOf('  const wk = JSON.stringify(',a);assert(a>=0&&b>a);
 const render=Function('FOOD','enabled',`const belt={children:[],innerHTML:''},$=()=>belt,me={belt:['cheese'],beltCounts:[5]},sim={pace:2,rankedFood:enabled},slotCache={},BELT_SIZE=4,imgTag=()=>'';let beltDisposers=[];${main.slice(a,b)}return belt.innerHTML;`);
 assert(!render(FOOD,false).includes(tip));assert(render(FOOD,true).includes(tip));assert.match(main,/f\.k === 'auto-food'/);assert(main.includes(saved));
});
test('new food disclosure, tooltip and feedback translate in all ordinary languages',()=>{for(const lang of['tr','es','fil'])for(const message of[rules,tip,saved])assert.notEqual(translateText(message,lang),message,lang+': '+message);});
