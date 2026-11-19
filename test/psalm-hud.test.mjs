import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHRINE_PSALMS} from '../src/sim.js';

test('HUD shows the current Psalm and clears it when it expires or the player dies',()=>{
 const src=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const match=src.match(/function updatePsalmHud\(\) \{[\s\S]*?\n\}/);
 assert(match,'the real main module supplies the HUD update');
 const elements=new Map();
 const $=id=>{if(!elements.has(id))elements.set(id,{hidden:true,textContent:'',dataset:{}});return elements.get(id);};
 const player={id:'p1',alive:true,buffs:{harden:14.7}};
 const update=Function('sim','PLAYER','$','SHRINE_PSALMS','asset',match[0]+'\nreturn updatePsalmHud;')({players:[player]},'p1',$,SHRINE_PSALMS,x=>x);
 update();
 assert.equal($('psalmboost').hidden,false);
 assert.equal($('psalmlabel').textContent,'Harden');
 assert.equal($('psalmleft').textContent,'15s');
 $('psalmicon').dataset.localTried='1';
 player.buffs={mysticLore:3.1};update();
 assert.equal($('psalmlabel').textContent,'Mystic Lore');
 assert.equal($('psalmicon').src,'ui/psalms/mystic-lore.png');
 assert.equal($('psalmicon').dataset.localTried,undefined);
 assert.equal($('psalmleft').textContent,'4s');
 player.buffs.mysticLore=0;update();
 assert.equal($('psalmboost').hidden,true);
 player.buffs.harden=15;player.alive=false;update();
 assert.equal($('psalmboost').hidden,true);
});
