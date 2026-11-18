import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {END_INPUT_LOCK_MS,endInputOpen,endKeyOpen} from '../src/end-input.js';

// Player report 18 Nov: dying mid-roll and pressing Space (the roll key) closed the end screen at once and started a new run.
test('the end screen waits before a confirm press can start the next run',()=>{
 assert.ok(END_INPUT_LOCK_MS>=1000,'long enough to notice the run ended');
 assert.equal(endInputOpen(10_000,10_000),false,'the press that ended the run');
 assert.equal(endInputOpen(10_000,10_000+END_INPUT_LOCK_MS-1),false,'a roll pressed just after dying');
 assert.equal(endInputOpen(10_000,10_000+END_INPUT_LOCK_MS),true);
 assert.equal(endInputOpen(-Infinity,1e9),false,'no run has ended');
});
test('a held key never starts the next run, only a fresh press after the wait',()=>{
 const after=10_000+END_INPUT_LOCK_MS+5;
 assert.equal(endKeyOpen(10_000,after,true),false,'Space held through the death keeps repeating');
 assert.equal(endKeyOpen(10_000,after,false),true);
 assert.equal(endKeyOpen(10_000,10_100,false),false);
});
test('keyboard, pad and the Run it back button all go through the wait',()=>{
 const src=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(src,/mode === 'end' && endKeyOpen\(endShownAt, performance\.now\(\), e\.repeat\)/,'Enter/Space on the end screen');
 assert.match(src,/edges\.a && mode === 'end' && !endInputOpen\(endShownAt, performance\.now\(\)\)\) edges\.a = false/,'pad A before the focused button is pressed');
 assert.match(src,/mode = 'end';\n  lockEndInput\(\);/,'the wait starts as the run ends');
 assert.match(src,/again\.disabled = true;/,'the button itself waits too (mouse, focused-button keys)');
});
