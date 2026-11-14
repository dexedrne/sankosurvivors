import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPELL_EVOLUTIONS,EVOLUTIONS,PASSIVES,WEAPONS,evolutionPassives,MAX_WEAPONS,MAX_PASSIVES,MAX_WEAPON_LEVEL,MAX_PASSIVE_LEVEL} from '../src/content.js';
import {translateText} from '../src/i18n.js';
import {transformHtml,transformMain} from '../tools/wavedash/edition.mjs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function recipes(pace){const a=main.indexOf('function guideRecipes('),b=main.indexOf("$('guidebtn').onclick",a);assert(a>=0&&b>a,'guide recipes use live content');return Function('SPELL_EVOLUTIONS','EVOLUTIONS','PASSIVES','WEAPONS','evolutionPassives','esc',main.slice(a,b)+';return guideRecipes;')(SPELL_EVOLUTIONS,EVOLUTIONS,PASSIVES,WEAPONS,evolutionPassives,String)(pace);}
test('guide recipes show every actual evolution and distinguish original ranked combinations from current casual routes',()=>{
 for(const pace of[1,2]){const text=recipes(pace);assert.equal((text.match(/class="guiderecipe"/g)||[]).length,Object.keys(EVOLUTIONS).length+(pace>=2?Object.keys(SPELL_EVOLUTIONS).length-1:0));if(pace>=2)for(const e of Object.values(SPELL_EVOLUTIONS)){assert(text.includes(e.name));for(const id of e.passives)assert(text.includes(PASSIVES[id].name));}for(const id of Object.keys(EVOLUTIONS)){assert(text.includes(WEAPONS[id].name));assert(text.includes(EVOLUTIONS[id].name));for(const passive of evolutionPassives(id,pace))assert(text.includes(PASSIVES[passive].name));}}
 assert.notEqual(recipes(1),recipes(2));
});
test('main-menu guide describes actual slot/level limits and does not turn keyboard navigation into a new run',()=>{
 assert.match(html,/id="guidebtn"/);assert.match(html,/id="guide"[^>]+role="dialog"/);assert.match(main,/const MENU_SCREENS = \[[^\n]*'guide'/);
 for(const text of[`${MAX_WEAPONS} weapons`,`${MAX_PASSIVES} passives`,`level ${MAX_WEAPON_LEVEL}`,`level ${MAX_PASSIVE_LEVEL}`])assert(html.includes(text),text);
 assert.match(html,/Bronze Arrow is the default/);assert.match(html,/Winged Boots can be both/);
});
test('wallet-free guide keeps normal game help but excludes ranked and cloud-wallet instructions',()=>{
 const out=transformHtml(html);assert.match(out,/id="guide"/);assert.match(out,/id="guidebtn"/);assert.doesNotMatch(out,/id="guide-ranked"|id="guide-cloud"/);
 assert.match(transformMain(main),/guideRecipes/);
});

for(const language of['tr','es','fil'])test(language+': every new static guide paragraph and heading translates',()=>{
 const guide=html.slice(html.indexOf('<div id="guide"'),html.indexOf('<div id="settings"'));
 for(const [,text]of guide.matchAll(/<(?:summary|p|h2)[^>]*>([^<>]+)<\/(?:summary|p|h2)>/g))assert.notEqual(translateText(text,language),text,text);
});

function catalogue(kind){const a=main.indexOf('function guideCatalogue('),b=main.indexOf('function guideRecipes(',a);assert(a>=0&&b>a,'guide catalogue uses current content');return Function('WEAPONS','PASSIVES','iconHTML','esc',main.slice(a,b)+';return guideCatalogue;')(WEAPONS,PASSIVES,(kind,id,level,evo,step)=>`<img data-kind="${kind}" data-id="${id}" data-level="${level}" data-evolved="${evo}" data-step="${step}">`,s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])))(kind);}
test('guide catalogue shows every current weapon/passive with its real description and marks casual-only content',()=>{
 for(const[kind,items]of[['weapon',WEAPONS],['passive',PASSIVES]]){const text=catalogue(kind);assert.equal((text.match(/class="guidecatalogue-item"/g)||[]).length,Object.keys(items).length);for(const[id,item]of Object.entries(items)){assert(text.includes(item.name),id);assert(text.includes(item.blurb.replace(/&/g,'&amp;')),item.blurb);assert(text.includes(`data-kind="${kind}" data-id="${id}" data-level="1" data-evolved="false" data-step="0"`),id);}assert.equal((text.match(/Casual only/g)||[]).length,Object.values(items).filter(i=>i.casual).length);}
 for(const id of ['guidecatalogue','guideweapons','guidepassives'])assert(html.includes('id="'+id+'"'));
 const edition=transformHtml(html);assert(edition.includes('id="guidecatalogue"'));assert(transformMain(main).includes('guideCatalogue'));
});
for(const language of['tr','es','fil'])test(language+': catalogue descriptions and scope labels translate',()=>{
 for(const text of ['Weapons and passives','Run-only upgrades. Permanent skills and worn gear are separate.','Casual only',...Object.values(WEAPONS).map(v=>v.blurb),...Object.values(PASSIVES).map(v=>v.blurb)])assert.notEqual(translateText(text,language),text,text);
});
