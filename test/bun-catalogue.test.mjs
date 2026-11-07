import test from 'node:test';
import assert from 'node:assert/strict';
const catalogue = await import('../src/bun-catalogue.js').catch(() => ({}));
test('catalogue maps all native body and portrait pairs without guessed labels',()=>{
  assert.ok(catalogue.BUN_APPEARANCES,'captured native catalogue exists');
  const expected=['Angel','Blue','Bomber','Bricks','Buns','Bunzilian','Chikki','Choi','Cloudy','Confetti','Cowboy','Cream','Crystal','Detec','Dev','Driftwood','Earthy','Fire','Galxy','Geeny','Glass','Goldie','Gorli','Green','Hippy','Joker','Ket','Kev','Lava','Leathy','Lemuh','Lime','Mini','Nebula','Orange','Peppermint','Pipe','Pup','Purple','Purr','RaceCar','Silver','Snake','Spirit','Sproto','Strawbie','SuperBun','Tomat','Turni','Turtly','Tux','Wood','Yeti'];
  assert.deepEqual(Object.keys(catalogue.BUN_APPEARANCES),expected);
  for(const variety of expected){const appearance=catalogue.BUN_APPEARANCES[variety];assert.equal(appearance.model.path,`sanko/buns/${variety}.glb`);assert.equal(appearance.portrait.path,`sanko/pets/portraits/${variety}.png`);assert.match(appearance.model.sha256,/^[a-f0-9]{64}$/);assert.match(appearance.portrait.sha256,/^[a-f0-9]{64}$/);assert.ok(Object.isFrozen(appearance));assert.ok(Object.isFrozen(appearance.model));}
  assert.equal(catalogue.BUN_APPEARANCES.Orange.model.sha256,'906ee17af9ecaac568f04972e8b0f9041b2e22d06a788255e47eca1e57832200');
  assert.equal(catalogue.BUN_APPEARANCES.Detec.model.sha256,'d24c720567f212a4dd84b5b0c4b9defec30cfdf54f87acfad344dfdee345a135');
  assert.ok(!Object.hasOwn(catalogue.BUN_APPEARANCES,'milady'));
});
test('native run and curious clips preserve original scale, duration and provenance',()=>{
  assert.ok(catalogue.BUN_ANIMATIONS,'captured animation catalogue exists');
  assert.equal(catalogue.BUN_ANIMATIONS.positionScaleOnLoad,200);
  assert.equal(catalogue.BUN_ANIMATIONS.run.path,'sanko/buns/anim/bun-run-smooth-v1.glb');
  assert.equal(catalogue.BUN_ANIMATIONS.run.sha256,'bf27637b566d518294822962e6969a303f91cbefed758ceee4fa52a6dd601acd');
  assert.equal(catalogue.BUN_ANIMATIONS.run.duration,0.6);
  assert.equal(catalogue.BUN_ANIMATIONS.curious.path,'sanko/buns/anim/bun-curious-smooth-v1.glb');
  assert.equal(catalogue.BUN_ANIMATIONS.curious.sha256,'7ac3b8ec32cd69546241ac925109dde8bc9dbf40c8df42d73051cdc8e8e71b82');
  assert.equal(catalogue.BUN_ANIMATIONS.curious.duration,2.4);
  assert.equal(catalogue.BUN_PROVENANCE.source,'Sanko-Dream-Machine/sanko-pets@0913a7b9c2f7f1c56e4fc13c3efb06dc8a78a753');
});
