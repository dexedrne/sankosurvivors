import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHANGELOG } from '../src/changelog.js';
import { translateText } from '../src/i18n.js';
import { transformHtml, wavedashEdition } from '../tools/wavedash/edition.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const [edition,page] of [['website',html],['casual',transformHtml(html)]])test(`${edition} update history participates in display translation`,()=>{
 const history=page.slice(page.indexOf('id="updates"'),page.indexOf('id="updclose"'));
 assert.ok(history.includes('id="updlist"'),'actual update list remains');
 assert.doesNotMatch(history,/translate="no"|data-no-i18n/,'history must not opt out of the existing DOM translator');
});
for(const lang of ['tr','es','fil'])test(`${lang} current/default/casual notes translate while older fallback and amounts remain`,async()=>{
 const catalogue=await import(`../src/locales/${lang}.js`);
 for(const text of [CHANGELOG[0].title,...CHANGELOG[0].items,'Pasture fence tumble']){
  assert.ok(Object.hasOwn(catalogue.text,text),text);assert.equal(translateText(text,lang),catalogue.text[text]);assert.notEqual(translateText(text,lang),text);
 }
 const generated=wavedashEdition().transform('',`/fixture/src/locales/${lang}.js`).code;
 const casual=await import('data:text/javascript,'+encodeURIComponent(generated));
 const changelog=wavedashEdition().transform('',`/fixture/src/changelog.js`).code;
 const {CHANGELOG:casualNotes}=await import('data:text/javascript,'+encodeURIComponent(changelog));
 for(const entry of casualNotes)for(const text of [entry.title,...entry.items])assert.ok(casual.text[text],text);
 const old=CHANGELOG.find(entry=>entry.version==='0.1');assert.equal(translateText(old.title,lang),old.title,'unknown old title stays readable English');
 const amounts=text=>text.match(/\d+(?:\.\d+)?|DMT|ETH/g)||[];
 for(const entry of CHANGELOG)for(const text of [entry.title,...entry.items])assert.deepEqual(amounts(translateText(text,lang)).sort(),amounts(text).sort(),`${entry.version}: ${text}`);
});
