import test from 'node:test';
import { readFileSync } from 'node:fs';
import { unpackGround } from '../src/ground-pack.js';
import { translateText } from '../src/i18n.js';
import { WISE_OLD_MAN } from '../src/game-modes.js';
import assert from 'node:assert/strict';
import { createSim, step, spawnEnemy, snapshot, playerStats, TICK } from '../src/sim.js';
import { MAP_BY_ID, ADVENTURER_BY_ID } from '../src/content.js';
import { cleanRoomSettings, cleanStart, prepareStart } from '../src/coop-protocol.js';

const wizard = extra => createSim({ variant: 'wizard', seed: 71, ...extra });
const quiet = s => { s.players[0].weapons = {}; s.players[0].inv = 1e6; return s; };
function run(s, ticks) { for (let i = 0; i < ticks; i++) { s.pending = {}; step(s); } }

test('Wizard Invasion forces the native elder and Spells without changing the selected profile', () => {
  const player = { id: 'p1', name: 'Keeper', adv: 'knight', weapon: 'bow', gear: { head: 'Iron Helmet' }, gearLv: { 'Iron Helmet': 2 } };
  const s = wizard({ players: [player], meta: { combat: 2 } }), p = s.players[0];
  assert.equal(s.map.id, 'greentown'); assert.equal(s.endless, true); assert.equal(s.variant, 'wizard');
  assert.equal(p.adv, 'wise-old-man'); assert.deepEqual(p.weapons, { staff: 1 }); assert.deepEqual(p.passives, {});
  assert.deepEqual(p.gear, { head: 'Iron Helmet' }); assert.deepEqual(p.gearLv, { 'Iron Helmet': 2 }); assert.equal(p.meta.combat, 2);
  assert.ok(Math.abs(playerStats(p).armor - 0.45) < 1e-9, 'reinforced Iron Helmet retains its combat bonus'); assert.equal(playerStats(p).might, 1.08);
  assert.equal(player.adv, 'knight'); assert.deepEqual(player.gear, { head: 'Iron Helmet' });
  assert.equal(ADVENTURER_BY_ID['wise-old-man'], undefined, 'the forced role must not enter ordinary/ranked selectors');
  assert.equal(snapshot(s).players[0].adv, 'wise-old-man');
});

test('wizard rejects co-op, ranked, other maps and altered pacing at simulation and wire boundaries', () => {
  for (const extra of [{ coop: true, players: [{ id: 'p1' }, { id: 'p2' }] }, { players: [{ id: 'p1' }, { id: 'p2' }] }, { ranked: true }, { pace: 1 }, { hard: true }, { endAt: 60 }, { map: MAP_BY_ID.oasis }]) assert.throws(() => wizard(extra));
  const room = { protocol: 1, build: 'fixture', sim: '02fb72a72387', map: 'greentown', hard: false, endless: true, variant: 'wizard' };
  assert.equal(cleanRoomSettings(room), null);
  const start = { ...room, epoch: '00112233445566778899aabbccddeeff', ground: '0', seed: 1, players: [] };
  assert.equal(cleanStart(start), null); assert.equal(prepareStart(start), null);
});

test('seeded wizard hordes stay bounded, native and endless past normal victory time', () => {
  const a = quiet(wizard()), b = quiet(wizard());
  for (const s of [a, b]) { run(s, 300); s.t = 1800; run(s, 150); }
  assert.deepEqual(snapshot(a), snapshot(b)); assert.equal(a.over, null); assert.equal(a.event, null);
  assert.ok(a.enemies.length > 0 && a.enemies.length <= 28);
  assert.ok(a.enemies.every(e => ['shapewiz', 'starwiz'].includes(e.type)));
  assert.equal(a.hazards.length, 0); assert.equal(a.nextWave, null, 'no ordinary boss wave leaks into this invasion');
  assert.ok(a.enemies.every(e => Math.hypot(e.x - a.players[0].x, e.z - a.players[0].z) > 2));
  assert.ok(a.eproj.length <= 40);
});

test('a wizard telegraphs before firing finite native projectiles which can hit and expire', () => {
  const s = wizard(), p = s.players[0]; p.weapons = {};
  spawnEnemy(s, 'shapewiz', p.x + 10, p.z); s.enemies[0].atkCd = 0;
  step(s); assert.equal(s.eproj.length, 0); assert.equal(snapshot(s).enemies[0][8], 1);
  run(s, 23); assert.ok(s.eproj.length > 0);
  const shot = s.eproj[0];
  for (const key of ['x', 'z', 'vx', 'vz', 'r', 'dmg', 'life']) assert.ok(Number.isFinite(shot[key]), key);
  assert.ok(shot.life > 0 && shot.life <= 4); assert.ok(Math.hypot(shot.vx, shot.vz) <= 8);
  s.enemies = []; s.spawnAcc = -1000;
  const hp = p.hp; run(s, 70); assert.ok(p.hp < hp, 'standing in the aimed shot takes damage');
  run(s, 150); assert.equal(s.eproj.length, 0);
});

test('wizard shots stop at thin walls and blocked cells even with a long simulation frame', () => {
  for (const solid of ['wall', 'blocked']) {
    const n = 512, ground = { n, cell: true, blocked: new Uint8Array(n*n), walls: new Uint8Array(n*n) };
    const s = quiet(wizard({ ground })), p = s.players[0], x = Math.floor(p.x), z = Math.floor(p.z);
    if (solid === 'wall') ground.walls[z*n+x] = 2;
    else ground.blocked[z*n+x+1] = 1;
    s.eproj.push({ id: 999, x: x+.5, z: z+.5, vx: 7, vz: 0, r: .35, dmg: 8, life: 4, art: 'fire' });
    step(s, {}, .5); assert.equal(s.eproj.length, 0, solid);
  }
});

test('wizard cast pressure never exceeds the projectile budget and dead casters do not fire', () => {
  const s = quiet(wizard()), p = s.players[0];
  for (let i=0; i<28; i++) { spawnEnemy(s, 'starwiz', p.x + 12, p.z + i*.01); s.enemies.at(-1).atkCd = 0; }
  run(s, 28); assert.ok(s.eproj.length > 0 && s.eproj.length <= 40);
  s.enemies.forEach(e => { e.dead = true; e.hp = 0; }); s.spawnAcc = -1000; s.eproj = [];
  run(s, 60); assert.equal(s.eproj.length, 0);
});

// Run the real menu functions with inert controls; map loading is the only external boundary.
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const block = name => { const start = main.indexOf(`function ${name}(`), end = main.indexOf('\n}', start); assert.ok(start >= 0 && end > start); return main.slice(start, end + 2); };
test('wizard selection uses Greentown and switching back restores the saved ordinary map and controls', async () => {
  const state = await Function(`return (async()=>{
    const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{checked:false,disabled:false,textContent:'',children:[],classList:{toggle(){}},setAttribute(){}});return nodes.get(id);};
    let mode='title',selVariant='normal',selMap='swamp',fieldMap='swamp',hardOn=true,endlessOn=true,mapLoading=false,runStarting=false,coop=null,window={},loadedMapId='swamp';
    const VARIANTS={normal:{},wizard:{}},MODE_INFO={wizard:'Solo only'},WISE_OLD_MAN={name:'Wise Old Man'},BOSS_KIT={},ADVENTURER_BY_ID={};
    const pickMap=async id=>{selMap=loadedMapId=id;},buildAdventurers=()=>{},banner=()=>{};
    ${block('updateModePicker')}
    async ${block('selectVariant')}
    await selectVariant('wizard');const selected={variant:selVariant,map:selMap,fieldMap,hardOn,endlessOn,name:$('modename').textContent,hero:$('adventurerlabel').textContent};
    await selectVariant('normal');return{selected,map:selMap,variant:selVariant};
  })();`)();
  assert.deepEqual(state.selected,{variant:'wizard',map:'greentown',fieldMap:'swamp',hardOn:false,endlessOn:false,name:'Wizard Invasion',hero:'Wise Old Man'});
  assert.equal(state.map,'swamp'); assert.equal(state.variant,'normal');
});

test('opening co-op from wizard mode explains solo-only before any lobby or network side effect', () => {
  let message='';
  const fn=Function('banner',`const selVariant='wizard',mode='title',canManuallyReload=()=>false; return ${block('openCoop')};`)(text=>{message=text;});
  fn(); assert.equal(message,'Wizard Invasion is solo only. Choose another mode for co-op.');
});

test('wizard HUD names the endless invasion without displaying a nonexistent wave', () => {
  const line = main.split('\n').find(line => line.includes("$('modeprogress').innerHTML ="));
  const output = Function(`const sim={variant:'wizard',wave:0,nextWave:null},VARIANTS={wizard:{name:'Wizard Invasion'}},node={},$=()=>node; ${line}; return node.innerHTML;`)();
  assert.equal(output,'<span>Wizard Invasion</span>');
});

test('native Greentown sustains bounded ranged pressure with finite projectiles', () => {
  // Use the shipped nav grid, not a convenient empty plane.
  const bytes = readFileSync(new URL('../tools/vercel-api/ground.bin', import.meta.url));
  const s = quiet(wizard({ ground: unpackGround(bytes) })); s.t = 1700;
  let peak = 0, shots = 0;
  for (let i=0; i<1800; i++) {
    s.pending = {}; step(s); s.fx = [];
    peak = Math.max(peak,s.enemies.length); shots = Math.max(shots,s.eproj.length);
    assert.ok(s.enemies.length <= 28); assert.ok(s.eproj.length <= 40);
    for (const b of s.eproj) for (const key of ['x','z','vx','vz','r','dmg','life']) assert.ok(Number.isFinite(b[key]),key);
    assert.ok(s.enemies.every(e=>['shapewiz','starwiz'].includes(e.type)));
  }
  assert.ok(peak >= 20); assert.ok(shots > 0); assert.equal(s.over,null);
});

for (const language of ['tr','es','fil']) test(`${language} explains the wizard role, solo limit and rewards`,()=>{
  for (const message of [
    'Wizard Invasion', 'Wise Old Man · Spells · Solo only',
    'Play as the Wise Old Man. Dodge wizard projectiles in an endless Greentown invasion.',
    'Choose Wizard Invasion ›',
    'Solo only. Play as the Wise Old Man with Spells against enemy wizards in Greentown. Dodge their projectiles. Endless survival earns GP and gear; campaign progress and normal leaderboards stay separate.',
    'Wizard Invasion is solo only. Choose another mode for co-op.',
  ]) { assert.notEqual(translateText(message,language),message);assert.equal(translateText(message,'en'),message); }
});

test('wizard renderer keeps native plain clothes despite worn and passive armor bonuses',()=>{
  const render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
  const look=render.match(/const look = (.*?); const k = kit.build/)[1],armor=render.match(/const want = (.*?), gsig =/)[1];
  const appearance=Function('view','p','a','WISE_OLD_MAN','ADVENTURER_BY_ID',`const lvl=4,armorSet=()=>({head:'Runite Helmet'}),worn={chest:'Iron Chestplate'};return{look:${look},armor:${armor}};`);
  const elder=appearance({variant:'wizard'},{adv:'wise-old-man'},{baseArmor:{}},WISE_OLD_MAN,ADVENTURER_BY_ID);
  assert.deepEqual(elder.look,{hair:'Long',hairColor:0xe6e6e6,skin:0xd9b48f,shirt:0x6b5a45,pants:0x4a4033,armor:{}});assert.deepEqual(elder.armor,{});
  const normal=appearance({},{adv:'knight'},{baseArmor:{}},WISE_OLD_MAN,ADVENTURER_BY_ID);
  assert.equal(normal.look,ADVENTURER_BY_ID.knight.look);assert.deepEqual(normal.armor,{head:'Runite Helmet',chest:'Iron Chestplate'});
});

test('wizard veteran skills and starting gear retain the disclosed casual spawn-pressure factor',()=>{
  const base=quiet(wizard()),veteran=quiet(wizard({meta:{coins:5},players:[{id:'p1',gear:{head:'Bronze Helmet',feet:'Bronze Boots'}}]}));
  step(base);step(veteran);
  assert.ok(Math.abs(veteran.spawnAcc/base.spawnAcc-1.07425)<1e-9);
});
