import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {SKILLS,CARD_HEAL}from '../src/content.js';import {createSim,playerStats}from '../src/sim.js';
const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const declarations=source.indexOf('    let name, tag, text, icon;',source.indexOf('  pend.choices.forEach'));const start=source.indexOf('\n',declarations)+1;
const end=source.indexOf('    if (ri === 3',start);assert(start>0&&end>start);
const actual=Function('c','sim','me','SKILLS','imgTag','playerStats','CARD_HEAL','iconHTML','asset',`const ri=-1;let name,tag,text,icon;${source.slice(start,end)}return{name,tag,text,icon};`);
for(const [id,label,skill]of [['weapon','weapon','strength'],['passive','passive','prayer']])test(`native ${id} capacity card explains one-run cost and uses the original skill icon`,()=>{
 const sim=createSim({meta:{strength:2,prayer:2}}),me=sim.players[0],result=actual({kind:'slot',id,level:1},sim,me,SKILLS,name=>'<img src="/assets/ui/items/item_'+name+'.png">',playerStats,CARD_HEAL,()=>'<item>',name=>'/assets/'+name);assert.equal(result.name,'Extra '+label+' slot');assert.equal(result.tag,'This run only');assert(result.text.includes('6 → 7'));assert(result.text.includes('Only one extra slot can be earned per run.'));assert(result.text.includes('Find a new item in a later upgrade.'));assert(result.icon.includes('src="/assets/'+SKILLS[skill].icon+'"'),'skill icons must bypass the item-name resolver');assert(!result.text.includes('Restore'));
});
test('capacity card highlights use the original yellow slot frame',()=>{assert(source.includes("c.kind === 'slot' ? ' slot-upgrade'"));assert.match(css,/\.card\.slot-upgrade\s*\{[^}]*yellow_slot\.png/);});
const fxStart=source.indexOf('  for (const f of view.fx) {'),fxEnd=source.indexOf('\n  }\n}',fxStart);assert(fxStart>0&&fxEnd>fxStart);
const actualFx=Function('view','sim','PLAYER','toast','banner',source.slice(fxStart,fxEnd+4));
test('unlock feedback is personal in co-op and malformed slot types never enter displayed text',()=>{
 const messages=[];actualFx({fx:[{k:'slot-upgrade',player:'p1',slot:'weapon'},{k:'slot-upgrade',player:'p2',slot:'passive'},{k:'slot-upgrade',player:'p1',slot:'<script>'}]},{coop:true},'p1',()=>{},text=>messages.push(text));assert.deepEqual(messages,['Extra weapon slot unlocked.']);
});
