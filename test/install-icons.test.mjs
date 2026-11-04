import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const publicRoot=new URL('../public/',import.meta.url);
test('install metadata resolves to native Air Shard PNGs at their declared sizes',()=>{
  const manifest=JSON.parse(readFileSync(new URL('manifest.webmanifest',publicRoot),'utf8'));
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal(manifest.name,'SankoSurvivors');assert.equal(manifest.short_name,'SankoSurvivors');
  const apple=html.match(/rel="apple-touch-icon"[^>]*href="([^"]+)"/)[1];
  for(const icon of [...manifest.icons,{src:apple,sizes:'180x180'}]) {
    assert.match(icon.src,/air-shard/);
    const png=readFileSync(new URL(icon.src.slice(1),publicRoot));
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,icon.sizes);
  }
  assert.equal(manifest.icons.filter(i=>i.purpose==='maskable').length,1);
  const worker=readFileSync(new URL('sw.js',publicRoot),'utf8');
  for(const file of worker.match(/c\.addAll\(\[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)) {
    if(file[1]!=='/')assert.ok(readFileSync(new URL(file[1].slice(1),publicRoot)).length);
  }
});
