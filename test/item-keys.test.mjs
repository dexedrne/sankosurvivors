import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanItemKeys,itemKey,itemKeySlot} from '../src/item-keys.js';
test('defaults and valid independent keys survive storage validation',()=>{
 assert.deepEqual(cleanItemKeys(null),['1','2','3','4']);
 assert.deepEqual(cleanItemKeys(['Z','x','C','v']),['z','x','c','v']);
 for(const raw of [false,3,{},[],['z'],['z','z','c','v'],['Z','z','c','v'],['w','x','c','v'],[{},'x','c','v'],['constructor','x','c','v']])assert.deepEqual(cleanItemKeys(raw),['1','2','3','4']);
});
test('movement, camera, interaction and mute shortcuts cannot become item keys',()=>{
 for(const key of ['w','a','s','d','q','e','t','m','f','Tab','Escape',' ','ArrowUp','+','Home'])assert.equal(itemKey(key),null,key);
 for(const key of ['z','x','c','v','r','b','5'])assert.equal(itemKey(key),key);
});
test('only the chosen unmodified key consumes its own item slot',()=>{
 const keys=cleanItemKeys(['z','x','c','v']);
 keys.forEach((key,i)=>assert.equal(itemKeySlot({key},keys),i));
 assert.equal(itemKeySlot({key:'Z'},keys),0);assert.equal(itemKeySlot({key:'1'},keys),-1);
 for(const flag of ['ctrlKey','altKey','metaKey','repeat','isComposing'])assert.equal(itemKeySlot({key:'z',[flag]:true},keys),-1,flag);
});
