import test from 'node:test';
import assert from 'node:assert/strict';
import { GEAR, ARMOR_TIERS, SMITH_COST, smithNext, smithPrev } from '../src/content.js';

test('the Smithy: every metal piece smiths into the next metal, up to Runite; named pieces do not', () => {
  for (const piece of ['Helmet', 'Chestplate', 'Gauntlets', 'Leggings', 'Boots', 'Kiteshield', 'Shield']) {
    ARMOR_TIERS.forEach((t, i) => {
      const n = `${t} ${piece}`; assert.ok(GEAR[n], n);
      const up = smithNext(n);
      if (i === ARMOR_TIERS.length - 1) assert.equal(up, null, 'Runite is the top');
      else { assert.deepEqual(up, { name: `${ARMOR_TIERS[i + 1]} ${piece}`, cost: SMITH_COST[i + 1] }); assert.equal(GEAR[up.name].slot, GEAR[n].slot); assert.equal(smithPrev(up.name), n); }
    });
  }
  for (const n of ['Beret', 'Uggs Boots', 'Ogre Shield', 'Ranger Helmet', 'Shape Robe']) { assert.equal(smithNext(n), null, n); assert.equal(smithPrev(n), null, n); }
  assert.ok(SMITH_COST.slice(1).every((c, i, a) => c > 0 && (i === 0 || c > a[i - 1])), 'each metal costs more than the last');
});
