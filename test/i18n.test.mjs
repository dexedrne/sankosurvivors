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

test('retained quality labels and release notes translate in every supported catalogue',()=>{
 const labels=['Base weapon stats','Common rank:','Uncommon','Base damage','Cooldown','Projectiles','Pierce','Bounces','Range','Radius','Size','Arc','Orbit speed','Burst radius','Damage multiplier','Cooldown multiplier','Movement speed','Pickup range','Armor','XP multiplier','Maximum health','Health per second','Coin multiplier','Casket multiplier','Card luck','Area multiplier','Extra projectiles','Reach multiplier','Critical chance','Critical multiplier','Thorns damage','Quality in every upgrade','Every upgrade gives one level. Common, Uncommon, Rare and Epic rolls retain different stat gains for this run. Maxed items cannot roll again. Cards show the resulting stats.'];
 for(const lang of ['tr','es','fil'])for(const label of labels)assert.notEqual(translateText(label,lang),label,lang+': '+label);
});
for(const lang of['tr','es','fil'])test(lang+': legacy migration choices, recovery and release guidance translate without losing totals',()=>{
 const labels=['This save has unreadable data. Keep a backup before replacing it.','Finish moving progress','Could not move progress','Saved progress must recover before moving saves.','The old save is stored on this device. Try again to finish opening it.','That old save could not be read. This device’s progress has not changed.','This browser could not finish moving progress. Keep this app installed and try again.','Choose one whole save. Choosing the old save replaces this device’s progress and settings. Cloud save will need sign-in again. The old address keeps its copy.','Keep this device’s save','Use the old save','This device’s progress changed. Review both saves and choose again.','Release the button to continue.','Safer moves between game addresses','Old-address saves are checked as a whole before moving. If this address already has progress, choose which complete save to keep.','Gear refund history moves with your profile. Interrupted moves recover before the game opens.','Choosing an old save pauses cloud save until you sign in again. Your original copy stays at the old address.'];
 for(const label of labels)assert.notEqual(translateText(label,lang),label,lang+': '+label);
 const sample='42 coins · 3 maps cleared · 2 skill ranks · 1 collected pieces',translated=translateText(sample,lang);assert.notEqual(translated,sample);for(const value of['42','3','2','1'])assert(translated.includes(value),value);
});
for(const lang of['tr','es','fil'])test(lang+': spell trail and continuous-impact updates translate',()=>{for(const label of['Spell trails in motion','Spell trails now follow where each bolt travelled over time, including turns and stops.','Player and boss spells pause with the run. Impacts keep the same spinning shards from flight to finish.'])assert.notEqual(translateText(label,lang),label)});

for(const lang of['tr','es','fil'])test(lang+': native spell tints and base-output guidance translate',()=>{for(const label of['Native spell colours','Spell shards use SankoQuest’s original elemental tints.','Spell glow now uses the same base colour output at every graphics setting. Optional screen effects still apply.'])assert.notEqual(translateText(label,lang),label)});
