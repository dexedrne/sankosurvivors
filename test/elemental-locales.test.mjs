import test from 'node:test';
import assert from 'node:assert/strict';
import { translateText } from '../src/i18n.js';
import { CHANGELOG } from '../src/changelog.js';
import { PASSIVES, SPELL_EVOLUTIONS } from '../src/content.js';
const strings = [...new Set([
  CHANGELOG[0].title,...CHANGELOG[0].items,
  ...['air','water','earth','fire','void'].flatMap(id => [PASSIVES[id].name,PASSIVES[id].blurb]),
  ...Object.values(SPELL_EVOLUTIONS).map(x=>x.name),
  "Choose one Blast evolution from your matching passives.","Evolves with a matching elemental shard, Wizard Hat or Cape.",'EVOLVES SPELLS','Choose a Blast','Back to first page','More elements','Choose a spell','Your reward stays open.','Knockback multiplier',
])];
for (const lang of ['tr','es','fil']) test(`${lang}: elemental names, bonuses and selector copy translate without changing numbers`,()=>{
  for (const source of strings) {
    const result=translateText(source,lang);
    assert.notEqual(result,source,source);
    if(source==='EVOLVES SPELLS')assert(!result.includes('SPELLS'),result);
    assert.deepEqual(result.match(/\d+(?:\.\d+)?/g)||[],source.match(/\d+(?:\.\d+)?/g)||[],source);
  }
});
test('English elemental copy stays unchanged',()=>{
  for (const source of strings) assert.equal(translateText(source,'en'),source);
});
