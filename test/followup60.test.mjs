import test from 'node:test';import assert from 'node:assert/strict';
import {createSim} from '../src/sim.js';import {captureRunBuild} from '../src/run-build.js';import {itemInspection} from '../src/item-inspection.js';import {translateText} from '../src/i18n.js';import {CHANGELOG} from '../src/changelog.js';
// small display gaps found by the read-only survey of 16 Nov
test('an Earth Shard shows its knockback in the build stats',()=>{
 const s=createSim({pace:2}),p=s.players[0];assert(!JSON.stringify(captureRunBuild(s,p,{name:'P'})).includes('Knockback multiplier'));
 p.passives={earth:1};const b=JSON.stringify(captureRunBuild(s,p,{name:'P'}));assert(b.includes('Knockback multiplier'),'the row appears once the shard is held');
});
test('hold-to-inspect lists Bounces, Arc and Orbit speed like the level-up card, in every language',()=>{
 const s=createSim({pace:2}),p=s.players[0];p.weapons={baseball:1,katana:1,shield:1};
 const lines=id=>itemInspection(p,'weapon',id).details;
 assert(lines('baseball').some(x=>x.startsWith('Bounces: ')));assert(lines('katana').some(x=>x.startsWith('Arc: ')));assert(lines('shield').some(x=>x.startsWith('Orbit speed: ')));
 for(const lang of ['es','tr','fil'])for(const x of [...lines('baseball'),...lines('katana'),...lines('shield')].filter(x=>/^(Bounces|Arc|Orbit speed): /.test(x)))assert.notEqual(translateText(x,lang),x,lang+' '+x);
});
test('common words that stayed English are translated, and the new update notes too',()=>{
 const notes=CHANGELOG.find(e=>e.version==='0.45.60').items.slice(-2);assert(notes[0].includes('sounds')&&notes[1].includes("game's own site"));
 for(const lang of ['es','tr','fil'])for(const x of ['Victory','Retry','Close','Gold','Damage','Tin of Beer','Pumpkin','Cooked Crawdad','Cooked Brown Trout','Cooked Catfish','Upgrade: +damage, +range','Evolves with Feather or Power Amulet.','Heals you to full.',...notes])assert.notEqual(translateText(x,lang),x,lang+' '+x);
});
