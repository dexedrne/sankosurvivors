import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeAnimationFixture, kneeBends, boneState } from './helpers/native-animation.mjs';
import { disposeActor } from '../src/character.js';

const fixture = await nativeAnimationFixture();
for (const name of ['idle', 'walk', 'run']) test(`native Sankson ${name}: both knees flex forward`, () => {
  const before = boneState(fixture.gltf.scene), master = boneState(fixture.master.scene);
  const sourceTracks = fixture.clips.get(name).tracks.map(t => Array.from(t.values));
  const actor = fixture.kit.animate(fixture.gltf, 3, name);
  try {
    const bends = kneeBends(actor);
    for (const [side, samples] of Object.entries(bends)) {
      assert.ok(samples.every(Number.isFinite));
      assert.ok(Math.min(...samples) >= -6, `${side} knee bent backward ${Math.min(...samples).toFixed(1)} degrees`);
      if (name !== 'idle') assert.ok(Math.max(...samples) - Math.min(...samples) > 10, `${side} knee must actually animate`);
    }
    assert.deepEqual(boneState(fixture.gltf.scene), before, 'cached target rig stays unchanged');
    assert.deepEqual(boneState(fixture.master.scene), master, 'reference rig stays unchanged');
    assert.deepEqual(fixture.clips.get(name).tracks.map(t => Array.from(t.values)), sourceTracks, 'shared source clip stays unchanged');
  } finally { disposeActor(actor.root, actor.mixer); }
});
test('hips-only fitting keeps every non-hips animation track unchanged', () => {
  const actor = fixture.kit.animate(fixture.gltf, 3, 'walk', { fromRest: 'hips' });
  try {
    for (const track of actor.mixer._actions[0].getClip().tracks) {
      if (/Hips\./.test(track.name)) continue;
      const original = fixture.clips.get('walk').tracks.find(t => t.name === track.name);
      assert.deepEqual(track.values, original.values, track.name);
    }
  } finally { disposeActor(actor.root, actor.mixer); }
});
