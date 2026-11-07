import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('a failed GLTF load can retry while successful and concurrent loads retain their cache', async () => {
  const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
  const code=source.slice(source.indexOf('  const cache = new Map();'),source.indexOf('  // ---- helpers'));
  const pending=[];const load=Function('gltfLoader',code+';return loadGLB;')({load:(url,ok,progress,no)=>pending.push({url,ok,no})});
  const good=load('good.glb'), bad=load('pet.glb');assert.equal(load('good.glb'),good);assert.equal(load('pet.glb'),bad);
  const model={scene:'native'};pending[0].ok(model);pending[1].no(Error('offline'));await assert.rejects(bad,/offline/);assert.equal(await good,model);
  const retry=load('pet.glb');assert.notEqual(retry,bad,'a rejected asset is not a permanent cached failure');pending[2].ok(model);
  assert.equal(await retry,model);assert.equal(load('pet.glb'),retry);assert.equal(load('good.glb'),good);
});
