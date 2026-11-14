import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {transformMain,transformHtml} from '../tools/wavedash/edition.mjs';
test('the static solo edition removes the co-op revive controller and panel',()=>{
 const code=transformMain(readFileSync(new URL('../src/main.js',import.meta.url),'utf8'));
 assert.doesNotMatch(code,/coopReviveUi|createCoopReviveUi|coop-revive/);
 const page=transformHtml(readFileSync(new URL('../index.html',import.meta.url),'utf8'));
 assert.doesNotMatch(page,/id="cooprevive/);
 assert.match(code,/function pause\(on\)/);assert.match(code,/function toMenu\(\)/);
});
