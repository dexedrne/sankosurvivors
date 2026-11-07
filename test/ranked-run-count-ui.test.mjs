import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translateText} from '../src/i18n.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function label(row){const source=main.match(/const completedRunText = ([^\n]+);/);assert(source,'one shared count formatter for both ranked displays');return Function('return '+source[1])()(row);}
test('ranked run counts display accepted weekly totals and never invent a count from missing/invalid data',()=>{
 assert.equal(label({runs:1}),'1 completed run this week');assert.equal(label({runs:23}),'23 completed runs this week');
 for(const runs of[undefined,null,0,-1,1.5,'23','<script>',Infinity,Number.MAX_SAFE_INTEGER+1])assert.equal(label({runs}),'Run count unavailable');
});
for(const language of['tr','es','fil'])test(language+': ranked run counts and audio labels translate',()=>{
 for(const text of['1 completed run this week','23 completed runs this week','Run count unavailable','All audio'])assert.notEqual(translateText(text,language),text);
});
