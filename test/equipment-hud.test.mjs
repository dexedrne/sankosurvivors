import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GEAR,GEAR_SLOTS,GEAR_SLOT_NAMES} from '../src/content.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function fixture(){
 const start=source.indexOf('function updateEquipmentHud(me) {'),end=source.indexOf('\n}',start);
 let html='',writes=0;const el={get innerHTML(){return html},set innerHTML(v){html=v;writes++}},cache={};
 const update=start<0?()=>{throw Error('Equipment HUD missing')}:Function('GEAR','GEAR_SLOTS','gearSlotName','imgTag','esc','$','slotCache',source.slice(start,end+2)+';return updateEquipmentHud;')(
 GEAR,GEAR_SLOTS,s=>s==='back'?'Cape':GEAR_SLOT_NAMES[s],n=>`<img data-icon="${n}">`,s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),id=>{assert.equal(id,'equipmentitems');return el},cache);
 return {update,html:()=>html,writes:()=>writes};
}
test('empty worn gear is explicit and unchanged frames preserve the same inspection DOM',()=>{
 const f=fixture();f.update({gear:{}});assert.match(f.html(),/No gear equipped\./);assert.equal(f.writes(),1);
 f.update({gear:{}});assert.equal(f.writes(),1);
});
test('only worn items appear in canonical slot order with inspectable accessible names',()=>{
 const f=fixture();const p={gear:{neck:"Magician's Amulet",feet:'Iron Boots',head:'Bronze Helmet'}};const before=JSON.stringify(p);f.update(p);
 assert.deepEqual([...f.html().matchAll(/data-slot="([^"]+)"/g)].map(m=>m[1]),['head','feet','neck']);
 assert.match(f.html(),/aria-label="Head · Bronze Helmet"/);assert.match(f.html(),/aria-label="Neck · Magician's Amulet"/);
 assert.equal((f.html().match(/tabindex="0"/g)||[]).length,3);assert.equal(JSON.stringify(p),before);
});
test('actual same-object Wear change refreshes gear while High alch/no change does not rebuild it',()=>{
 const f=fixture(),p={gear:{head:'Bronze Helmet'}};f.update(p);p.gear.head='Iron Helmet';f.update(p);
 assert.equal(f.writes(),2);assert.match(f.html(),/Iron Helmet/);assert.doesNotMatch(f.html(),/Bronze Helmet/);
 f.update(p);assert.equal(f.writes(),2);f.update({gear:{}});assert.equal(f.writes(),3);assert.match(f.html(),/No gear equipped\./);
});
test('missing, mismatched, prototype and unknown items never become markup or extra slots',()=>{
 const f=fixture();f.update({gear:JSON.parse('{"head":"constructor","feet":"Bronze Helmet","neck":"<img src=x onerror=alert(1)>","constructor":"Bronze Helmet","__proto__":"Iron Boots"}')});
 assert.match(f.html(),/No gear equipped\./);assert.doesNotMatch(f.html(),/onerror|constructor|data-slot/);
 f.update({});assert.match(f.html(),/No gear equipped\./);f.update({gear:{head:['Bronze Helmet']}});assert.match(f.html(),/No gear equipped\./);
});
test('connected HUD selects the actual local co-op player gear instead of the host',()=>{
 const start=source.indexOf('function updateHud(view) {'),end=source.indexOf('  updateShrineHud(view);',start),calls=[];
 const run=Function('sim','PLAYER','updateEquipmentHud','view','mode','refreshPauseBuild',source.slice(start,end)+'} return updateHud(view);');
 const players=[{id:'p1',gear:{head:'Bronze Helmet'}},{id:'p2',gear:{feet:'Iron Boots'}}];
 let refreshes=0;for(const mode of ['play','pause'])run({coop:true},'p2',p=>calls.push(p.gear),{players},mode,()=>refreshes++);assert.deepEqual(calls,[{feet:'Iron Boots'},{feet:'Iron Boots'}]);assert.equal(refreshes,1);
});
for(const key of ['Tab',' '])test(`native equipment inspection ${JSON.stringify(key)} does not open DPS or tumble`,()=>{
 const start=source.indexOf("addEventListener('keydown', (e) => {",source.indexOf('const MENU_SCREENS')),end=source.indexOf("\n});",start),body=source.slice(start+"addEventListener('keydown', (e) => {".length,end),calls=[];
 const e={key,repeat:false,target:{matches:()=>false,closest:s=>s==='#equipmenthud'?{}:null},preventDefault:()=>calls.push('prevent')};
 Function('e','mode','walletModalOpen','MENU_SCREENS','$','setDamagePanel','keys','hop',body)(e,'play',()=>false,[],()=>({classList:{contains:()=>true}}),()=>calls.push('DPS'),new Set(),()=>calls.push('tumble'));
 assert.deepEqual(calls,[]);
});
for(const [mode,key,wanted,target] of [['play','Escape','pause','slot'],['play','Escape','pause','summary'],['levelup','1','pick:0','slot'],['casket','1','casket:0','slot']])test(`equipment ${target} focus retains ${mode} ${key} control`,()=>{
 const start=source.indexOf("addEventListener('keydown', (e) => {",source.indexOf('const MENU_SCREENS')),end=source.indexOf('\n});',start),body=source.slice(start+"addEventListener('keydown', (e) => {".length,end),calls=[];
 const e={key,repeat:false,target:{matches:s=>target==='summary'&&s.split(',').map(s=>s.trim()).includes('summary'),closest:()=>({})},preventDefault(){}};
 Function('e','mode','walletModalOpen','MENU_SCREENS','$','setDamagePanel','keys','hop','navBack','pause','pick','pickCasket',body)(e,mode,()=>false,[],()=>({classList:{contains:()=>true}}),()=>{},new Set(),()=>{},()=>false,()=>calls.push('pause'),i=>calls.push('pick:'+i),i=>calls.push('casket:'+i));
 assert.deepEqual(calls,[wanted]);
});
