import test from 'node:test';
import assert from 'node:assert/strict';
import { preferredLanguage, translateText } from '../src/i18n.js';
import { text, patterns } from '../src/locales/tr.js';
import * as tr from '../src/locales/tr.js';
import * as es from '../src/locales/es.js';
import * as fil from '../src/locales/fil.js';

test('language selection accepts English/Turkish, restores an explicit choice and falls back safely',()=>{
  assert.equal(preferredLanguage('en','tr-TR'),'en');
  assert.equal(preferredLanguage('tr','en-US'),'tr');
  assert.equal(preferredLanguage(null,'tr-TR'),'tr');
  assert.equal(preferredLanguage('unknown','zh-CN'),'en');
  assert.equal(preferredLanguage(null,'en-TR'),'en');
  assert.equal(preferredLanguage(null,'es-MX'),'es');
  assert.equal(preferredLanguage(null,'fil-PH'),'fil');
  assert.equal(preferredLanguage(null,'tl-PH'),'fil');
  assert.equal(preferredLanguage('en','es-ES'),'en');
  assert.equal(preferredLanguage('__proto__','zh-CN'),'en');
});
test('Turkish translates interface labels and preserves surrounding whitespace',()=>{
  assert.equal(translateText('Settings','tr'),'Ayarlar');
  assert.equal(translateText('Back','tr'),'Geri');
  assert.equal(translateText('  Settings\n','tr'),'  Ayarlar\n');
  assert.equal(translateText('Settings','en'),'Settings');
});
test('dynamic translations keep names, numbers and currency amounts intact',()=>{
  const sentence=translateText('You fell in Greentown','tr');
  assert.ok(sentence.includes('Greentown')); assert.notEqual(sentence,'You fell in Greentown');
  const entry=translateText('Enter for 0.5 DMT','tr');
  assert.ok(entry.includes('0.5 DMT')); assert.notEqual(entry,'Enter for 0.5 DMT');
});
test('untranslated source, wallet addresses, names and persistence identifiers are unchanged',()=>{
  for(const value of ['0x1234567890abcdef','Gok4n','SQS1.abc.hash','sq-ranked-submit','unlisted fixture text']) assert.equal(translateText(value,'tr'),value);
});
test('all catalogue templates preserve their variables and resolve to the intended Turkish sentence',()=>{
  for(const [source,target] of patterns){
    const fill=s=>s.replace(/\{(\d+)\}/g,(_,n)=>'fixture'+n);
    assert.equal(translateText(fill(source),'tr'),fill(target),source);
    const from=new Set(source.match(/\{\d+\}/g)||[]);
    for(const slot of target.match(/\{\d+\}/g)||[]) assert.ok(from.has(slot),`${source}: unknown ${slot}`);
  }
});
test('translations of paid-ranked rules preserve fees, shares, limits and dynamic amounts',()=>{
  for(const [source,target] of [...Object.entries(text),...patterns].filter(([s])=>/Entry is .*DMT on Arbitrum|Runs are endless: your score|Hard rules: tougher/.test(s))){
    const digits=s=>(s.replace(/\{\d+\}/g,'').match(/\d+(?:\.\d+)?/g)||[]).sort();
    assert.deepEqual(digits(target),digits(source),source);
    for(const slot of new Set(source.match(/\{\d+\}/g)||[])) assert.ok(target.includes(slot),`${source}: missing amount/limit ${slot}`);
  }
});
test('list fragments cannot be swallowed by a numeric template capture',()=>{
  assert.equal(translateText('1st: 5.58 DMT · 2nd: 3.487 DMT','tr'),'1.: 5.58 DMT · 2.: 3.487 DMT');
  assert.equal(translateText('31 entries · 13.95 DMT pool.','tr'),'31 katılım · 13.95 DMT havuzu.');
  assert.equal(translateText('123 kills','tr'),'123 öldürme');
});
for(const [language,catalogue] of Object.entries({tr,es,fil})) {
  test(`${language}: menus, catalogue coverage, variables and financial copy remain complete`,()=>{
    assert.deepEqual(Object.keys(catalogue.text).sort(),Object.keys(text).sort());
    assert.deepEqual(catalogue.patterns.map(([s])=>s).sort(),patterns.map(([s])=>s).sort());
    for(const label of ['Language','Settings','Back','Map']) {
      assert.equal(translateText(label,language),catalogue.text[label]);
      assert.notEqual(translateText(label,language),label);
    }
    for(const [source,target] of catalogue.patterns){
      const fill=s=>s.replace(/\{(\d+)\}/g,(_,n)=>'fixture'+n);
      assert.equal(translateText(fill(source),language),fill(target),source);
      const slots=new Set(source.match(/\{\d+\}/g)||[]);
      for(const slot of target.match(/\{\d+\}/g)||[]) assert.ok(slots.has(slot));
    }
    for(const [source,target] of [...Object.entries(catalogue.text),...catalogue.patterns].filter(([s])=>/Entry is .*DMT on Arbitrum|Runs are endless: your score|Hard rules: tougher/.test(s))){
      const digits=s=>(s.replace(/\{\d+\}/g,'').match(/\d+(?:\.\d+)?/g)||[]).sort();
      assert.deepEqual(digits(target),digits(source),source);
      for(const slot of new Set(source.match(/\{\d+\}/g)||[])) assert.ok(target.includes(slot));
    }
    for(const raw of ['Settings_player','0x1234567890abcdef','Gok4n','SQS1.abc.hash']) assert.equal(translateText(raw,language),raw);
  });
}
test('unknown locales use the English source without prototype lookups',()=>{
  for(const language of ['zh','__proto__','constructor',null]) assert.equal(translateText('Settings',language),'Settings');
});
