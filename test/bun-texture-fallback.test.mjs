import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const render=fs.readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const setup=render.split('\n').find(line=>line.includes('const bunModels = createBunModels('));
function loader(loadAsync){return new Function('createBunModels','loadGLB','A','texLoader','localOf',setup+';return bunModels;')((a,b,load)=>load,null,null,{loadAsync},url=>url.startsWith('https://cdn/')?'./assets/'+url.slice('https://cdn/'.length):'');}
test('actual BUN face loader retries a refused CDN texture once from the game host',async()=>{
 const calls=[],texture={isTexture:true},load=loader(async url=>{calls.push(url);if(url.startsWith('https://cdn/'))throw Error('CDN missing');return texture;});
 assert.equal(await load('https://cdn/sanko/pets/expressions/v1/eye-s-1.png'),texture);
 assert.deepEqual(calls,['https://cdn/sanko/pets/expressions/v1/eye-s-1.png','./assets/sanko/pets/expressions/v1/eye-s-1.png']);
});
test('successful textures stay on the CDN; local and unrelated failures do not loop',async()=>{
 const calls=[],texture={},load=loader(async url=>{calls.push(url);return texture;});assert.equal(await load('https://cdn/face.png'),texture);assert.deepEqual(calls,['https://cdn/face.png']);
 for(const url of ['./assets/face.png','https://other/face.png','https://cdn/face.png']){const attempts=[],error=Error('missing'),fail=loader(async path=>{attempts.push(path);throw error;});await assert.rejects(fail(url),e=>e===error);assert.deepEqual(attempts,url.startsWith('https://cdn/')?[url,'./assets/face.png']:[url]);}
});
