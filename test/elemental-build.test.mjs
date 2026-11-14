import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as C from '../src/content.js';import * as S from '../src/sim.js';import{captureRunBuild}from'../src/run-build.js';import{itemInspection}from'../src/item-inspection.js';
const names={air:'Air Blast',water:'Water Blast',earth:'Earth Blast',fire:'Fire Blast'},colours={air:0x9fe8ff,water:0x3b82f6,earth:0x6db33f,fire:0xff5a1f};
function scene(element){const sim=S.createSim({seed:18,pace:2,startWeapon:'staff'}),p=sim.players[0];sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;p.weapons.staff=6;p.passives={[element]:1};sim.pending[p.id]={left:20,choices:[{kind:'evolve',id:'staff',level:1}]};assert(S.choose(sim,p.id,0));return{sim,p};}
for(const element of Object.keys(names))test(`${element} reaches spell projectile, snapshot, impact, inspection and detached build identity`,()=>{
 const{sim,p}=scene(element);p.cd.staff=0;S.spawnEnemy(sim,'goblin',p.x+5,p.z);const e=sim.enemies[0];e.hp=e.maxHp=100000;e.rise=0;e.speed=0;sim.fx.length=0;S.step(sim,{},S.TICK);const bolt=sim.proj.find(pr=>pr.art==='bolt');assert(bolt);assert.equal(bolt.element,element);
 const snap=S.snapshot(sim);assert.equal(snap.players[0].spellElement,element);assert.equal(snap.proj.find(row=>row[0]===bolt.id)[9],element);assert.equal(C.weaponDisplay('staff',6,true,null,p.spellElement).name,names[element]);
 assert.equal(itemInspection(p,'weapon','staff',2).title,names[element]);const card=captureRunBuild(sim,p).sections.find(s=>s.title==='Weapons').rows[0];assert.equal(card.name,names[element]);assert(card.icon.endsWith('item_'+element[0].toUpperCase()+element.slice(1)+'_Shard.png'));
 let hit;for(let tick=0;tick<60&&!hit;tick++){S.step(sim,{},S.TICK);hit=sim.fx.find(f=>f.k==='spell-hit');}assert(hit);assert.equal(hit.element,element);assert.equal(sim.fx.find(f=>f.k==='burst').element,element);
});
test('actual native spell palette helper uses selected Blast colours and preserves its original fallback',()=>{
 const source=fs.readFileSync(new URL('../src/render.js',import.meta.url),'utf8'),a=source.indexOf('  const SPELL_ELEMENT ='),b=source.indexOf('  const SPELL_TIER =',a);assert(a>=0&&b>a);const context={};vm.runInNewContext(source.slice(a,b)+'globalThis.spell=staffSpell;',context);
 for(const element of Object.keys(names)){const value=context.spell(6,true,0,element);assert.equal(value.col,colours[element]);assert.equal(value.tier,'blast');}
 assert.equal(context.spell(6,true,0,'constructor').col,colours.fire);assert.equal(context.spell(6,true,0).col,colours.fire);assert.equal(context.spell(1,false,0,'fire').col,colours.air);
});
test('selector metadata reaches snapshots and old Void choices keep their previous missing-field fallback',()=>{
 const{sim,p}=scene('void');assert.equal(p.spellElement,undefined);assert.equal(S.snapshot(sim).players[0].spellElement,undefined);assert.equal(itemInspection(p,'weapon','staff',2).title,'Void Spells');
 const other=S.createSim({pace:2,startWeapon:'staff'}),hero=other.players[0];hero.weapons.staff=6;hero.passives={air:1,water:1};other.pending[hero.id]={left:7,choices:[{kind:'evolve',id:'staff',level:1}]};S.choose(other,hero.id,0);const pend=S.snapshot(other).pending[hero.id];assert.equal(pend.spell,true);assert.equal(pend.page,0);
});
