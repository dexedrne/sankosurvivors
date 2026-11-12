import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformHtml} from '../tools/wavedash/edition.mjs';
import {translateText} from '../src/i18n.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const message='Week-0 ranked uses Jump and the original evolution recipes. Casual and ranked from week 1 use Tumble and the current recipes.';
function screen(source,id){
 const screens=[...source.matchAll(/<div id="([^"]+)" class="screen\b/g)],index=screens.findIndex(m=>m[1]===id);
 assert(index>=0&&index+1<screens.length,'bounded screen '+id);return source.slice(screens[index].index,screens[index+1].index);
}
test('ranked entry and pause explain original Jump versus current Tumble and recipes',()=>{
 for(const id of['ranked','pause']){
  const panel=screen(html,id);
  assert(panel.includes(message),id+' has visible movement rules');
 }
});
test('wallet-free pause retains relevant Tumble help without original-ranked instructions',()=>{
 const panel=screen(transformHtml(html),'pause');
 assert(panel.includes('Tumble with Space, controller A, or the Tumble button. Cross reachable low fences; buildings stay solid.'));
 assert(!panel.includes('Week-0 ranked'));
});
test('movement and recipe explanation translates in every supported non-English language',()=>{
 for(const lang of['tr','es','fil'])assert.notEqual(translateText(message,lang),message,lang);
});
