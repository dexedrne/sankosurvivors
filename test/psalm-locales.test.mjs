import test from 'node:test';
import assert from 'node:assert/strict';
import {translateText} from '../src/i18n.js';
import {SHRINE_PSALMS,SHRINE_PSALM_SECONDS} from '../src/sim.js';

const names = {
 es:['Endurecer','Potencia superior','Saber místico'],
 fil:['Tibay','Higit na Lakas','Kaalamang Mistiko'],
 tr:['Sertleşme','Üstün Kudret','Mistik Bilgi']
};
for (const [lang,localized] of Object.entries(names)) {
 test(`Psalm HUD, shrine prompt, and completion message translate in ${lang}`,()=>{
  for (const [index,psalm] of Object.values(SHRINE_PSALMS).entries()) {
   const tr=source=>translateText(source,lang);
   assert.equal(tr(psalm.name),localized[index]);
   assert.notEqual(tr(psalm.text),psalm.text);
   assert.equal(tr(`Charging · ${psalm.text}`),tr('Charging')+' · '+tr(psalm.text));
   assert.equal(tr(`Step into circle · ${psalm.text}`),tr('Step into circle')+' · '+tr(psalm.text));
   const completed=tr(`${psalm.name} · ${psalm.text} for ${SHRINE_PSALM_SECONDS} seconds. Health restored.`);
   assert(completed.includes(localized[index]));
   assert(completed.includes(tr(psalm.text)));
   assert(completed.includes(String(SHRINE_PSALM_SECONDS)));
   assert(!completed.includes('Health restored.'));
  }
 });
}
