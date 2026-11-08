// Game simulation. No DOM, no three.js: runs in node (tests) and in the host's browser.
import { dsin, dcos, datan2, dhypot } from './dmath.js'; // the same answer in every browser and on the server (ranked replays)
import {
  ENEMIES, MAPS, WEAPONS, WEAPON_IDS, PASSIVES, PASSIVE_IDS, passiveIdsAt, CURSE,
  ADVENTURER_BY_ID, EVOLUTIONS, evolutionPassives, evolveStats, clampSkills, PLAYER_BASE, MAX_WEAPON_LEVEL, MAX_PASSIVE_LEVEL, MAX_WEAPONS, MAX_PASSIVES, xpForLevel, gearBonus, rollCasket, casketRank, compareGear, REROLLS_PER_RUN, GEAR,
  WEAPON_ITEMS, isWeaponItem, compareWeaponItem, weaponMetal, weaponLook, MAGIC_WEAPONS, CARD_GAIN, CARD_QUALITY, CARD_HEAL, CARD_RARITIES, cardLuck, rarityFromRoll, weaponStats, passiveStrength,
  weaponSlotItem, TUMBLE, PASTURE_NAV, SNOW_WAVE_AT, isSnowEnemy,
} from './content.js';
import { groundHash } from './ground-pack.js';
import { extraStorms, stormView } from './weather.js';

export const TICK = 1 / 30;
export const WORLD = { cx: 365, cz: 300, radius: 70 }; // default (Greentown); each map in content.js has its own centre/radius

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hyp = dhypot;
const pastureGroundCache = new WeakMap();
function pastureGround(ground) {
  if (!ground || !ground.cell || ground.n !== 512 || !ground.fences) return ground;
  if (pastureGroundCache.has(ground)) return pastureGroundCache.get(ground);
  let corrected = ground;
  if (groundHash(ground) === PASTURE_NAV.hash) {
    const blocked = ground.blocked.slice();
    for (const k of PASTURE_NAV.cells) blocked[k] = 0;
    corrected = { ...ground, blocked };
  }
  pastureGroundCache.set(ground, corrected);
  return corrected;
}

export function createSim({ seed = 1, players = [{ id: 'p1', name: 'Adventurer' }], startWeapon = 'katana', map = MAPS[0], hard = false, meta = {}, ground = null, endless = false, endAt = 0, pace = 2, ranked = false, coop = false } = {}) {
  if (coop && (ranked || pace !== 2 || players.length !== 2)) throw Error('Co-op requires two casual pace2 players.');
  if (pace >= 2) ground = pastureGround(ground);
  meta = clampSkills(meta);
  const rng = mulberry32(seed);
  const sim = {
    seed, rng, map, hard, meta, endless, endAt, pace, ranked: !!ranked, t: 0, tick: 0, nextId: 1,
    // veterans (owner 3 Nov: "regular mode feels too easy"): each permanent skill rank makes casual monsters 1.5% tougher
    // and harder-hitting, to +60% at 40 ranks, with a few more of them. A new player is untouched; ranked has no skills.
    vet: 1, // set below once the players (and the gear they wear) are in // pace: 2 the denser crowd of 3 Nov, 1 the 2 Nov one (ranked week 0)
    mapIndex: Math.max(0, MAPS.findIndex((m) => m.id === map.id)), casketRank: casketRank(map),
    killsByType: {}, bossKills: 0, evolves: 0, loot: [], alched: [], endlessBossT: 0, endlessCycle: 0,
    players: [], enemies: [], proj: [], gems: [], pickups: [], fx: [],
    hazards: [],          // telegraphed boss attacks on the ground: { x, z, r, t, max, dmg }
    shrines: [],          // shrines to charge (pace 2): { id, x, z, kind, charge, life }
    eproj: [],            // monster projectiles: { id, x, z, vx, vz, r, dmg, life, art }
    level: 1, xp: 0, xpNeed: xpForLevel(1),
    pending: {},          // playerId -> { choices: [...], left: seconds }; a reward casket card also has { casket: compareGear(...) }
    over: null,           // null | 'win' | 'dead' | 'time' (an endless ranked run reached its time limit, endAt seconds)
    kills: 0, bossIndex: 0, spawnAcc: 0, spawnCount: players.length, region: null,
    eventT: 210, event: null, dmgBy: {}, hurtBy: {}, src: null, // random events: treasure goblin, swarm, meteor shower
    ground,               // optional { n, blocked: Uint8Array, walls?: Uint8Array } one cell per world unit: ridges, mountains, water; thin walls
    flow: null, flowT: 0, // distance-to-player field so monsters find their way around cliffs
  };
  if (coop) sim.coop = true;
  players.forEach((p, i) => {
    const a = (i / Math.max(players.length, 1)) * Math.PI * 2;
    sim.players.push({
      id: p.id, name: p.name || 'Adventurer', slot: i,
      x: map.cx + dcos(a) * 1.5, z: map.cz + dsin(a) * 1.5,
      face: 0, moving: false, hp: PLAYER_BASE.hp, maxHp: PLAYER_BASE.hp, alive: true, inv: 0,
      meta: coop ? clampSkills(p.meta) : meta, adv: p.adv || 'adventurer', weapons: { [p.weapon || (ADVENTURER_BY_ID[p.adv] ? ADVENTURER_BY_ID[p.adv].weapon : startWeapon)]: 1 }, passives: { ...((ADVENTURER_BY_ID[p.adv] || {}).startPassives || {}) }, evo: {}, buffs: {}, cd: {}, orbit: 0, kills: 0, coins: 0, regen: 0, hurt: 0,
      gear: p.gear || {}, gearLv: p.gearLv || {}, gb: gearBonus(p.gear || {}, p.gearLv || {}, pace), rerolls: REROLLS_PER_RUN, belt: [],
      casketQ: [], alch: 0, // reward caskets waiting for Wear or High alch; coins from high alching this run
      wm: {}, // weapon metals from caskets (pace 2): { katana: 0..5, bow: 0..3, arrow: 0..4, ... } (missing = Bronze / plain Bow)
      ...(pace >= 2 ? { pace, quality: { weapons: {}, passives: {} }, banished: [] } : {}),
      ...(coop ? { killsByType: {}, bossKills: 0, evolves: 0, loot: [], alched: [], dmgBy: {} } : {}),
    });
  });
  // veterans: skill ranks plus two for every piece of gear worn, 1.5% each, to +75% at 50 (pace 2 only; ranked has neither)
  { const ranks = Object.values(meta).reduce((a, v) => a + (Number(v) || 0), 0) + 2 * Math.max(0, ...sim.players.map((p) => Object.keys(p.gear || {}).length)); sim.vet = 1 + 0.015 * Math.min(50, ranks); }
  if (coop) sim.vet = 1 + 0.015 * Math.min(50, Math.max(...sim.players.map(p => Object.values(p.meta).reduce((a, n) => a + n, 0) + 2 * Object.keys(p.gear).length)));
  for (const p of sim.players) { const st = playerStats(p); p.maxHp = st.maxHp; p.hp = st.maxHp; p.rerolls = st.rerolls; p.revives = st.revives; const w = findWalkable(sim, p.x, p.z); p.x = w[0]; p.z = w[1]; }
  return sim;
}

// ---- ground: where you can stand ------------------------------------------------
// ground grids come as vertices (round to nearest) or as cells (floor), see terrain.js
const gIdx = (g, v) => (g.cell ? Math.floor(v) : Math.round(v));
export function walkable(sim, x, z) {
  const g = sim.ground; if (!g) return true;
  const i = gIdx(g, x), j = gIdx(g, z);
  if (i < 0 || j < 0 || i >= g.n || j >= g.n) return false;
  return !g.blocked[j * g.n + i];
}
// the nearest spot to (x, z) a monster can stand on AND walk to the players from: event and boss spawns used to land in
// closed rooms and wall pockets (a war band's chief stuck in a building). Falls back to any open ground if none is near.
export function findWalkable(sim, x, z) {
  const reach = (a, b) => walkable(sim, a, b) && flowAt(sim, a, b) !== -2;
  if (reach(x, z)) return [x, z];
  for (let r = 1; r < 30; r++) for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.2832, nx = x + dcos(a) * r, nz = z + dsin(a) * r; if (reach(nx, nz)) return [nx, nz]; }
  if (walkable(sim, x, z)) return [x, z];
  for (let r = 1; r < 30; r++) for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.2832, nx = x + dcos(a) * r, nz = z + dsin(a) * r; if (walkable(sim, nx, nz)) return [nx, nz]; }
  return [x, z];
}
// thin walls on cell edges (buildings): bits 1 2 4 8 = a wall on the north (z-1), east (x+1), south (z+1), west (x-1) side
const wallX = (W, n, i, j, di) => (di > 0 ? (W[j * n + i] & 2) || (W[j * n + i + 1] & 8) : (W[j * n + i] & 8) || (W[j * n + i - 1] & 2));
const wallZ = (W, n, i, j, dj) => (dj > 0 ? (W[j * n + i] & 4) || (W[(j + 1) * n + i] & 1) : (W[j * n + i] & 1) || (W[(j - 1) * n + i] & 4));
// can you get from cell (i0,j0) to the cell next to it (one step each way at most) without going through a wall?
function stepOK(W, n, i0, j0, i1, j1) {
  const di = i1 - i0, dj = j1 - j0;
  if (i1 < 0 || j1 < 0 || i1 >= n || j1 >= n) return false;
  if (!dj) return !wallX(W, n, i0, j0, di);
  if (!di) return !wallZ(W, n, i0, j0, dj);
  return (!wallX(W, n, i0, j0, di) && !wallZ(W, n, i0 + di, j0, dj)) || (!wallZ(W, n, i0, j0, dj) && !wallX(W, n, i0, j0 + dj, di));
}
const WALL_GAP = 0.35; // bodies keep this far off a wall
// the cells from (x0,z0) to (x1,z1), one step at a time (a fast shove can cross more than one): no wall in between?
function crossOK(W, n, x0, z0, x1, z1) {
  let i = Math.floor(x0), j = Math.floor(z0); const i1 = Math.floor(x1), j1 = Math.floor(z1);
  if (i < 0 || j < 0 || i >= n || j >= n) return true;
  for (let k = 0; k < 8 && (i !== i1 || j !== j1); k++) {
    const ni = i + Math.sign(i1 - i), nj = j + Math.sign(j1 - j);
    if (!stepOK(W, n, i, j, ni, nj)) return false;
    i = ni; j = nj;
  }
  return true;
}
// the thin walls a run walks on: the buildings', plus the fences on pace 2 (owner 3 Nov: "fences on map dont register
// as walls"; ranked week 0, pace 1, keeps walking through them so its runs replay as they were played)
const fenceWallCache = new WeakMap();
function wallsOf(sim) {
  const g = sim.ground; if (!g || !g.walls) return null;
  if (sim._wg !== g) {
    sim._wg = g; sim._W = g.walls;
    if (sim.pace >= 2 && g.fences) { let c = fenceWallCache.get(g); if (!c) { c = new Uint8Array(g.walls.length); for (let k = 0; k < c.length; k++) c[k] = g.walls[k] | g.fences[k]; fenceWallCache.set(g, c); } sim._W = c; }
  }
  return sim._W;
}
const tumbleWallCache = new WeakMap();
function tumbleWalls(sim) {
  const g = sim.ground;
  if (!g?.walls || sim.pace < 2 || !g.fences) return g?.walls;
  let walls = tumbleWallCache.get(g);
  if (!walls) {
    walls = new Uint8Array(g.walls.length);
    for (let k = 0; k < walls.length; k++) walls[k] = g.walls[k] | (g.fences[k] >>> 4);
    tumbleWallCache.set(g, walls);
  }
  return walls;
}
function marginClear(sim, W, x, z, ox, oz) {
  const nx = x + ox, nz = z + oz, n = sim.ground.n;
  // A footprint needs both axis routes clear at a corner, not an L-shaped detour.
  return walkable(sim, nx, nz) && crossOK(W, n, x, z, nx, z) && crossOK(W, n, x, z, x, nz)
    && crossOK(W, n, nx, z, nx, nz) && crossOK(W, n, x, nz, nx, nz);
}
function noWall(sim, x0, z0, x1, z1, tumble = false) {
  const g = sim.ground, W = tumble ? tumbleWalls(sim) : wallsOf(sim); if (!g || !W || !g.cell) return true;
  const n = g.n;
  // the move itself must not go through a wall...
  if (!crossOK(W, n, x0, z0, x1, z1)) return false;
  // ...and the body keeps a gap to the wall ahead, checked along each axis on its own (a diagonal look-ahead could slip
  // round the end of a wall while the move itself went straight through it)
  const sx = Math.sign(x1 - x0), sz = Math.sign(z1 - z0);
  if (sx && !crossOK(W, n, x1, z1, x1 + sx * WALL_GAP, z1)) return false;
  if (sz && !crossOK(W, n, x1, z1, x1, z1 + sz * WALL_GAP)) return false;
  // Turning beside a wall must keep body clearance; an existing overlap can still escape.
  if (sim.pace >= 2) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!(dx || dz)) continue;
    const ox = dx * WALL_GAP, oz = dz * WALL_GAP;
    if (!marginClear(sim, W, x1, z1, ox, oz) && marginClear(sim, W, x0, z0, ox, oz)) return false;
  }
  return true;
}
function walkableStep(sim, x, z, nx, nz) {
  if (!walkable(sim, nx, nz)) return false;
  const g = sim.ground;
  if (!(sim.pace >= 2) || !g || gIdx(g, x) === gIdx(g, nx) || gIdx(g, z) === gIdx(g, nz)) return true;
  // An open diagonal destination must not shortcut the solid cells on either side.
  return walkable(sim, nx, z) && walkable(sim, x, nz);
}
function clearPath(sim, x, z, nx, nz, body = false) {
  const g = sim.ground; if (!g) return true;
  const W = wallsOf(sim), parts = Math.max(1, Math.ceil(Math.max(Math.abs(nx - x), Math.abs(nz - z)) / 0.5));
  const dx = (nx - x) / parts, dz = (nz - z) / parts;
  for (let i = 0; i < parts; i++) {
    const tx = x + dx, tz = z + dz;
    // Contact checks stop at the target, without the body's look-ahead beyond it.
    if (!walkableStep(sim, x, z, tx, tz) || (body ? !noWall(sim, x, z, tx, tz) : W && g.cell && !crossOK(W, g.n, x, z, tx, tz))) return false;
    x = tx; z = tz;
  }
  return true;
}
// move, sliding along cliffs, shores and walls instead of stopping dead
function moveStep(sim, o, nx, nz, tumble) {
  if (walkableStep(sim, o.x, o.z, nx, nz) && (!tumble || !sim.ground || flowAt(sim, nx, nz) >= 0) && noWall(sim, o.x, o.z, nx, nz, tumble)) { o.x = nx; o.z = nz; return; }
  if (walkableStep(sim, o.x, o.z, nx, o.z) && (!tumble || !sim.ground || flowAt(sim, nx, o.z) >= 0) && noWall(sim, o.x, o.z, nx, o.z, tumble)) { o.x = nx; return; }
  if (walkableStep(sim, o.x, o.z, o.x, nz) && (!tumble || !sim.ground || flowAt(sim, o.x, nz) >= 0) && noWall(sim, o.x, o.z, o.x, nz, tumble)) o.z = nz;
}
function moveTo(sim, o, nx, nz, tumble = false) {
  if (!(sim.pace >= 2) || !sim.ground) return moveStep(sim, o, nx, nz, tumble);
  const parts = Math.max(1, Math.ceil(Math.max(Math.abs(nx - o.x), Math.abs(nz - o.z)) / 0.5));
  const dx = (nx - o.x) / parts, dz = (nz - o.z) / parts;
  for (let i = 0; i < parts; i++) {
    const x = o.x, z = o.z;
    moveStep(sim, o, x + dx, z + dz, tumble);
    if (o.x === x && o.z === z) break;
  }
}
const FLOW_R = 60, FLOW_W = FLOW_R * 2 + 1, FLOW_NONE = 65535;
function updateFlow(sim, anchor = null) {
  const g = sim.ground; if (!g) { sim.flow = null; return; }
  const alive = sim.players.filter((p) => p.alive); if (!alive.length) return;
  const W = wallsOf(sim);
  const origin = anchor || alive[0];
  const x0 = gIdx(g, origin.x) - FLOW_R, z0 = gIdx(g, origin.z) - FLOW_R;
  const f = sim.flow && sim.flow.dist ? sim.flow : { dist: new Uint16Array(FLOW_W * FLOW_W), queue: new Int32Array(FLOW_W * FLOW_W) };
  f.x0 = x0; f.z0 = z0; f.dist.fill(FLOW_NONE);
  let qh = 0, qt = 0;
  for (const p of alive) { const i = gIdx(g, p.x) - x0, j = gIdx(g, p.z) - z0; if (i >= 0 && j >= 0 && i < FLOW_W && j < FLOW_W) { f.dist[j * FLOW_W + i] = 0; f.queue[qt++] = j * FLOW_W + i; } }
  while (qh < qt) {
    const k = f.queue[qh++], i = k % FLOW_W, j = (k - i) / FLOW_W, d = f.dist[k] + 1;
    for (let q = 0; q < 4; q++) {
      const ni = i + (q === 0 ? 1 : q === 1 ? -1 : 0), nj = j + (q === 2 ? 1 : q === 3 ? -1 : 0);
      if (ni < 0 || nj < 0 || ni >= FLOW_W || nj >= FLOW_W) continue;
      const nk = nj * FLOW_W + ni; if (f.dist[nk] !== FLOW_NONE) continue;
      const wi = ni + x0, wj = nj + z0;
      if (wi < 0 || wj < 0 || wi >= g.n || wj >= g.n || g.blocked[wj * g.n + wi]) continue;
      if (W && g.cell && !stepOK(W, g.n, i + x0, j + z0, wi, wj)) continue; // monsters go round walls (and fences), through doors
      f.dist[nk] = d; f.queue[qt++] = nk;
    }
  }
  sim.flow = f;
}
function flowAt(sim, x, z) {
  const f = sim.flow; if (!f) return -1;
  const i = gIdx(sim.ground, x) - f.x0, j = gIdx(sim.ground, z) - f.z0;
  if (i < 0 || j < 0 || i >= FLOW_W || j >= FLOW_W) return -1;
  const d = f.dist[j * FLOW_W + i]; return d === FLOW_NONE ? -2 : d;
}
// the way downhill on the distance field (toward the nearest player, around obstacles); null when out of range
function flowDir(sim, x, z) {
  const f = sim.flow; if (!f) return null;
  const i = gIdx(sim.ground, x) - f.x0, j = gIdx(sim.ground, z) - f.z0;
  if (i < 1 || j < 1 || i >= FLOW_W - 1 || j >= FLOW_W - 1) return null;
  let best = f.dist[j * FLOW_W + i], bx = 0, bz = 0;
  for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
    if (!a && !b) continue;
    const nx = sim.pace >= 2 ? i + a + f.x0 + (sim.ground.cell ? 0.5 : 0) : x + a;
    const nz = sim.pace >= 2 ? j + b + f.z0 + (sim.ground.cell ? 0.5 : 0) : z + b;
    if (sim.pace >= 2 && !clearPath(sim, x, z, nx, nz, true)) continue;
    const d = f.dist[(j + b) * FLOW_W + i + a] + (a && b ? 0.4 : 0);
    if (d < best) { best = d; bx = sim.pace >= 2 ? nx - x : a; bz = sim.pace >= 2 ? nz - z : b; }
  }
  if (!bx && !bz && sim.pace >= 2 && best > 0 && best < FLOW_NONE) {
    // Align inside the current cell before taking a turn that needs body clearance.
    const nx = i + f.x0 + (sim.ground.cell ? 0.5 : 0), nz = j + f.z0 + (sim.ground.cell ? 0.5 : 0);
    if (dhypot(nx - x, nz - z) > 0.05 && clearPath(sim, x, z, nx, nz, true)) { bx = nx - x; bz = nz - z; }
  }
  if (!bx && !bz) return null;
  const l = dhypot(bx, bz); return [bx / l, bz / l];
}

// ---- helpers ------------------------------------------------------------
export function passiveLevel(p, id) { return p.passives[id] || 0; }
export function playerStats(p, meta = p.meta || {}) {
  const m = (id) => meta[id] || 0;
  const B = (ADVENTURER_BY_ID[p.adv] || {}).bonus || {};
  const G = p.gb || {}; // worn gear
  const bf = p.buffs || {}; // timed boons: beer, a blizzard's chill, the shrines' Strength, Agility and Magic
  const might = (1 + 0.12 * passiveStrength(p, 'might') + 0.04 * m('combat') + (B.dmg || 0) + (G.dmg || 0)) * (bf.strength > 0 ? 1.3 : 1);
  const haste = Math.max(0.3, 1 - 0.07 * passiveStrength(p, 'haste') - 0.03 * m('fletching') - (B.haste || 0) - (G.haste || 0));
  const stats = {
    might, haste,
    speed: PLAYER_BASE.speed * (1 + 0.08 * passiveStrength(p, 'boots') + 0.03 * m('woodcutting') + (B.speed || 0) + (G.speed || 0)) * ((p.buffs && p.buffs.speed > 0) ? 1.35 : 1) * ((p.buffs && p.buffs.chill > 0) ? 0.9 : 1) * (bf.agility > 0 ? 1.25 : 1), // beer speeds you up, a blizzard slows you
    magnet: (p.pace >= 2 ? 2.5 : PLAYER_BASE.magnet) * (1 + 0.3 * passiveStrength(p, 'magnet') + 0.1 * m('magic') + (B.magnet || 0) + (G.magnet || 0)),
    armor: passiveStrength(p, 'armor') + (B.armor || 0) + (G.armor || 0) + (m('mining') >= 2 ? 1 : 0) + (m('mining') >= 4 ? 1 : 0),
    growth: (1 + 0.1 * passiveStrength(p, 'growth') + 0.05 * m('herblore') + (B.growth || 0) + (G.growth || 0)) * (bf.wisdom > 0 ? 1.4 : 1),
    maxHp: Math.round(PLAYER_BASE.hp + 20 * passiveStrength(p, 'vigor') + 8 * m('smithing') + (B.hp || 0) + (G.hp || 0)),
    regen: 0.15 * passiveStrength(p, 'vigor') + 0.1 * m('cooking') + (G.regen || 0),
    coin: 1 + (G.coin || 0) + 0.15 * passiveStrength(p, 'greed'),
    luck: 1 + 0.15 * m('luck'),
    casket: (1 + 0.25 * passiveStrength(p, 'greed')) * (1 + 0.15 * m('luck')),
    coinBonus: 1 + 0.1 * m('coins'),
    weaponSlots: MAX_WEAPONS + m('strength'), passiveSlots: MAX_PASSIVES + m('prayer'),
    projectileSpeed: 1 + 0.1 * m('projectileSpeed'),
    rerolls: REROLLS_PER_RUN + m('rerolls'), revives: m('revive'),
    area: 1 + 0.1 * passiveStrength(p, 'area') + 0.05 * m('area'),
    amount: m('amount') + (passiveLevel(p, 'amount') >= 1 ? 1 : 0) + (passiveLevel(p, 'amount') >= 4 ? 1 : 0),
    reach: 1 + 0.06 * passiveStrength(p, 'amount'), // Feather: projectiles fly a little farther every level
    critC: 0.08 + 0.05 * passiveStrength(p, 'crit'), critM: 1.8 + 0.1 * passiveStrength(p, 'crit'),
    thorns: 8 * passiveStrength(p, 'thorns'),
    heal: 1 + 0.12 * m('fishing'),
    magic: 1 + (G.magic || 0), // the Minion set: magic weapons (Shard Staff, Lighter) hit harder
  };
  if (p.pace >= 2 && p.endlessGrowth) {
    for (const key of ['might', 'maxHp', 'area']) stats[key] *= 1 + 0.01 * p.endlessGrowth[key];
    stats.maxHp = Math.round(stats.maxHp);
  }
  return stats;
}

function nearestEnemy(sim, x, z, maxD = 1e9, skip, bodyRange = false) {
  let best = null, bd = bodyRange ? Infinity : maxD * maxD;
  for (const e of sim.enemies) {
    if (skip && skip.has(e.id)) continue;
    const dx = e.x - x, dz = e.z - z, d = dx * dx + dz * dz;
    if (d < bd && (!bodyRange || d <= (maxD + ENEMIES[e.type].r) ** 2)) { bd = d; best = e; }
  }
  return best;
}
function nearestPlayer(sim, x, z) {
  let best = null, bd = 1e18;
  for (const p of sim.players) {
    if (!p.alive) continue;
    const dx = p.x - x, dz = p.z - z, d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

export function damageEnemy(sim, e, amount, owner, kb = 0, fromX = 0, fromZ = 0) {
  if (e.dead) return;
  const cr = (sim.crit && sim.crit[owner]) || [0.08, 1.8]; // the owner's Amanita: chance and multiplier
  const crit = sim.rng() < cr[0];
  const dmg = Math.max(1, Math.round(amount * (crit ? cr[1] : 1)));
  e.hp -= dmg; e.hit = 0.12;
  const src = sim.src || 'other'; sim.dmgBy[src] = (sim.dmgBy[src] || 0) + dmg; // damage dealt per weapon, for the end screen
  if (sim.coop) { const p = sim.players.find(p => p.id === owner); if (p) p.dmgBy[src] = (p.dmgBy[src] || 0) + dmg; }
  sim.fx.push({ k: 'dmg', x: e.x, z: e.z, v: dmg, c: crit ? 1 : 0 });
  if (kb && !ENEMIES[e.type].boss) {
    const dx = e.x - fromX, dz = e.z - fromZ, d = hyp(dx, dz) || 1;
    e.kx += (dx / d) * kb; e.kz += (dz / d) * kb;
  }
  if (e.hp <= 0) killEnemy(sim, e, owner);
}

function killEnemy(sim, e, owner) {
  e.dead = true; sim.kills++;
  sim.killsByType[e.type] = (sim.killsByType[e.type] || 0) + 1;
  const def = ENEMIES[e.type];
  const p = sim.players.find((q) => q.id === owner);
  if (p) p.kills++;
  if (sim.coop && p) { p.killsByType[e.type] = (p.killsByType[e.type] || 0) + 1; if (def.boss) p.bossKills++; }
  sim.gems.push({ id: sim.nextId++, x: e.x, z: e.z, v: def.xp, vx: 0, vz: 0 });
  sim.fx.push({ k: 'die', x: e.x, z: e.z, boss: def.boss ? 1 : 0, elite: e.elite ? 1 : 0, ...(sim.pace >= 2 ? { type: e.type } : {}) });
  if (!def.boss) {
    const r = sim.rng(), drop = (kind) => sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z, kind });
    if (r < 0.010) drop('beer'); else if (r < 0.016) drop('pumpkin'); else if (r < 0.022) drop('warp'); else if (r < 0.034) drop(foodDrop(sim.t, (r - 0.022) / 0.012, e.elite, sim.pace));
    if (sim.rng() < 0.05 * (p ? playerStats(p).coin : 1)) drop('coin');
    // reward caskets (owner 3 Nov: "caskets drop too often tbh"): every elite dropped one, ~60 in a full run. Pace 2: a
    // rare one from anything and an elite's now and then, ~10 a run with the bosses'. Pace 1 (ranked week 0) unchanged.
    const cs = (p ? playerStats(p).casket : 1) / (sim.coop ? Math.max(1, sim.players.filter(p => p.alive).length) : 1);
    if (sim.pace >= 2 ? (sim.rng() < 0.0006 * cs || (e.elite && sim.rng() < 0.08 * cs)) : (sim.rng() < 0.0015 * cs || e.elite)) drop('casket');
    if (e.elite) { for (let i = 0; i < 3; i++) sim.pickups.push({ id: sim.nextId++, x: e.x + (i - 1) * 0.8, z: e.z + 0.8, kind: 'coin' }); }
    if (e.champion) { for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; sim.pickups.push({ id: sim.nextId++, x: e.x + dcos(a) * 1.4, z: e.z + dsin(a) * 1.4, kind: 'coin' }); } sim.fx.push({ k: 'treasure', x: e.x, z: e.z }); }
    if (e.treasure) { for (let i = 0; i < 2; i++) drop('casket'); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; sim.pickups.push({ id: sim.nextId++, x: e.x + dcos(a) * 1.6, z: e.z + dsin(a) * 1.6, kind: 'coin' }); } sim.fx.push({ k: 'treasure', x: e.x, z: e.z }); }
  }
  if (def.boss) {
    if (sim.pace >= 2) sim.hazards = sim.hazards.filter((h) => h.by !== e.id);
    for (let i = 0; i < 8; i++) {
      const a = sim.rng() * 6.283;
      sim.gems.push({ id: sim.nextId++, x: e.x + dcos(a) * 1.5, z: e.z + dsin(a) * 1.5, v: Math.ceil(def.xp / 8), vx: 0, vz: 0 });
    }
    sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z, kind: 'bass' }, { id: sim.nextId++, x: e.x + 1.2, z: e.z, kind: 'chest' }, { id: sim.nextId++, x: e.x - 1.2, z: e.z, kind: 'casket' });
    const luck = p ? playerStats(p).luck - 1 : 0;
    if (luck > 0 && sim.rng() < luck) sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z + 1.2, kind: 'chest' });
    sim.bossKills++;
    if (e.final && e.type === sim.map.finalBoss && !sim.endless) sim.over = 'win';
  }
}

// ---- spawning -----------------------------------------------------------
export function spawnEnemy(sim, type, x, z, scaleHp = 1) {
  const def = ENEMIES[type];
  if (sim.pace >= 2 && isSnowEnemy(type)) sim.snowWave = true;
  const t = sim.t;
  const hp = def.hp * (1 + t / (sim.pace >= 2 ? 240 : 300)) * (sim.pace >= 2 ? sim.vet * (1 + CURSE.hp * (sim.curse || 0)) : 1) * (1 + 0.55 * (sim.spawnCount - 1)) * scaleHp * (sim.hard ? 1.7 : 1);
  // now and then a golden elite: much tougher, a little slower, and it always carries a reward casket
  const elite = !def.boss && scaleHp === 1 && t > 60 && sim.rng() < 0.012;
  sim.enemies.push({
    id: sim.nextId++, type, x, z, hp: hp * (elite ? 7 : 1), maxHp: hp * (elite ? 7 : 1), face: 0, hit: 0, kx: 0, kz: 0, cdHit: {},
    // monsters speed up as the run goes on, but only by a fifth (reached at 5:00): the fastest (fox, dog, wolf) stay just
    // under your own base speed, so you can always outrun a chase (it was +45%, and from 4:30 foxes outran you)
    speed: def.speed * 0.95 * (1 + Math.min(0.2, t / 1500)) * (elite ? 0.9 : 1), elite,
    atkCd: def.boss ? 3 + sim.rng() * 2 : 0, charge: null,
  });
}

const spawnReady = (sim, entry) => sim.t >= entry.t && (sim.pace < 2 || sim.t >= SNOW_WAVE_AT || !isSnowEnemy(entry.type));
function spawnTick(sim, dt) {
  const t = sim.t;
  // bosses
  const M = sim.map;
  while (sim.bossIndex < M.bosses.length && t >= M.bosses[sim.bossIndex].t) {
    const b = M.bosses[sim.bossIndex++];
    const p = nearestPlayer(sim, M.cx, M.cz) || sim.players[0];
    const a = sim.rng() * 6.283;
    const w = findWalkable(sim, p.x + dcos(a) * 20, p.z + dsin(a) * 20);
    spawnEnemy(sim, b.type, w[0], w[1]);
    if (sim.bossIndex === M.bosses.length) sim.enemies[sim.enemies.length - 1].final = true; // the last one on the schedule ends the run (Goblin War has two Ogres: only the later one counts)
    sim.fx.push({ k: 'boss', type: b.type });
  }
  // endless: past the usual run length the map's bosses keep coming back, tougher each time
  if (sim.endless && t >= M.length) {
    const casual = sim.pace >= 2 && !sim.ranked;
    sim.endlessBossT = casual ? Math.max(0, sim.endlessBossT - dt) : sim.endlessBossT - dt;
    if (sim.endlessBossT <= 0 && M.bosses.length && (!casual || sim.enemies.filter(e => !e.dead && e.hp > 0 && ENEMIES[e.type].boss).length < 6)) {
      sim.endlessBossT = casual ? Math.max(45, 90 - 5 * Math.floor((t - M.length) / 120)) : 90;
      const b = M.bosses[sim.endlessCycle % M.bosses.length]; sim.endlessCycle++;
      const p = nearestPlayer(sim, M.cx, M.cz) || sim.players[0], a = sim.rng() * 6.283;
      const w = findWalkable(sim, p.x + dcos(a) * 20, p.z + dsin(a) * 20);
      spawnEnemy(sim, b.type, w[0], w[1], 1 + 0.5 * sim.endlessCycle);
      sim.fx.push({ k: 'boss', type: b.type });
    }
  }
  const alive = sim.enemies.length;
  const progress = Math.min(1, t / M.length);
  // owner 3 Nov: "feel like it got kinda nerfed hard its less enemies now and 8 minutes in i barely took damage": the
  // 2 Nov crowd (pace 1) thinned a run to two thirds of before (balance bot, 72 runs: average crowd 102 -> 68, damage
  // taken by 5:00 44 -> 19). Pace 2: the cap is back to the old 190 by 8:00, spawns ~4.8/s there (old 6.1, pace 1 3.7),
  // health and contact damage grow faster; the first two minutes stay gentle
  // the Pumpkin Head's curse (pace 2): the most cursed player sets it for everyone
  const curse = sim.pace >= 2 && !sim.ranked ? sim.players.reduce((a, p) => (p.alive ? Math.max(a, passiveLevel(p, 'curse')) : a), 0) : 0; sim.curse = curse;
  const base = sim.pace >= 2 ? 125 + 70 * (sim.spawnCount - 1) + 150 * progress : 75 + 70 * (sim.spawnCount - 1) + 155 * progress * progress;
  // cursed, the crowd fills up sooner but never past the late-game crowd (every monster is its own draw: phones)
  const cap = curse ? Math.min(base * (1 + CURSE.cap * curse), 125 + 70 * (sim.spawnCount - 1) + 150) : base;
  const rate = (1 + CURSE.rate * curse) * ((sim.pace >= 2 ? (1.15 + 6.0 * progress + 3.0 * progress * progress) * (1 + 0.55 * (sim.vet - 1)) : 1.05 + 1.6 * progress + 6.4 * progress * progress) + Math.max(0, t - M.length) / 92)
    * (0.7 + 0.45 * sim.spawnCount) * (sim.hard ? 1.35 : 1); // enemies per second
  sim.spawnAcc += rate * dt;
  if (sim.event && sim.event.kind === 'duel') sim.spawnAcc = Math.min(sim.spawnAcc, 0.5); // the crowd holds back while you duel
  // on the whole-world map, the monsters come from the region you are standing in
  const R = M.world ? regionOf(sim, sim.players.find((p) => p.alive) || sim.players[0]) : M;
  if (M.world && R.id !== sim.region) { sim.region = R.id; sim.fx.push({ k: 'region', id: R.id }); }
  const pool = R.pool.filter((s) => spawnReady(sim, s) && !(R.retire && R.retire[s.type] && t >= R.retire[s.type]));
  const total = pool.reduce((a, s) => a + s.w, 0);
  while (sim.spawnAcc >= 1 && sim.enemies.length < cap) {
    sim.spawnAcc -= 1;
    let r = sim.rng() * total, pick = pool[0];
    for (const s of pool) { if ((r -= s.w) <= 0) { pick = s; break; } }
    const alivePlayers = sim.players.filter((p) => p.alive);
    if (!alivePlayers.length) break;
    const anchor = alivePlayers[Math.floor(sim.rng() * alivePlayers.length)];
    const at = spawnSpot(sim, anchor);
    if (!at) continue;
    spawnEnemy(sim, pick.type, at[0], at[1]);
  }
  if (alive >= cap) sim.spawnAcc = Math.min(sim.spawnAcc, 2);
}
// where a monster comes in: just out of sight, mostly ahead of a moving player (so running in circles does not work
// forever), on ground it can stand on and from where it can reach the players (not across the sea or a mountain)
function spawnSpot(sim, anchor) {
  const M = sim.map;
  for (let tries = 0; tries < 8; tries++) {
    const ahead = anchor.moving && sim.rng() < 0.65; // sim angles are atan2(x, z)
    const a = ahead ? (sim.pace >= 2 ? anchor.moveFace : anchor.face) + (sim.rng() - 0.5) * 1.6 : sim.rng() * 6.283, d = 26 + sim.rng() * 8;
    let x = anchor.x + (ahead ? dsin(a) : dcos(a)) * d, z = anchor.z + (ahead ? dcos(a) : dsin(a)) * d;
    const off = hyp(x - M.cx, z - M.cz);
    if (off > M.r) { x = M.cx + (x - M.cx) * (M.r / off); z = M.cz + (z - M.cz) * (M.r / off); }
    if (walkable(sim, x, z) && flowAt(sim, x, z) !== -2) return [x, z];
  }
  return null;
}
// a monster left far behind (or wedged on a cliff out of reach) comes back in near the players instead of holding a
// place in the crowd for the rest of the run
const STRAY_D = 45, STRAY_T = 5;
function recycleStrays(sim, dt) {
  const alive = sim.players.filter((p) => p.alive); if (!alive.length) return;
  for (const e of sim.enemies) {
    if (e.dead || e.rise > 0 || e.treasure || e.champion || e.final || ENEMIES[e.type].boss) continue;
    let near = Infinity; for (const p of alive) near = Math.min(near, hyp(p.x - e.x, p.z - e.z));
    if (near < STRAY_D) { e.far = 0; continue; }
    e.far = (e.far || 0) + dt;
    if (e.far < STRAY_T) continue;
    const at = spawnSpot(sim, alive[Math.floor(sim.rng() * alive.length)]);
    if (at) { e.x = at[0]; e.z = at[1]; e.kx = 0; e.kz = 0; }
    e.far = 0;
  }
}

// ---- level ups ----------------------------------------------------------
export function rollChoices(sim, p) {
  const opts = [], st = playerStats(p);
  for (const id of Object.keys(EVOLUTIONS)) {
    if ((p.weapons[id] || 0) >= MAX_WEAPON_LEVEL && !p.evo[id] && evolutionPassives(id, sim.pace).some(key => (p.passives[key] || 0) >= 1)) opts.push({ kind: 'evolve', id, level: 1, w: 1000 });
  }
  for (const id of WEAPON_IDS) {
    if (sim.pace >= 2 && p.banished.includes('weapon:' + id)) continue;
    const lvl = p.weapons[id] || 0;
    if (lvl >= MAX_WEAPON_LEVEL) continue;
    if (!lvl && Object.keys(p.weapons).length >= st.weaponSlots) continue;
    opts.push({ kind: 'weapon', id, level: lvl + 1, w: lvl ? 3 : 2 });
  }
  for (const id of passiveIdsAt(sim.pace, sim.ranked)) {
    if (sim.pace >= 2 && p.banished.includes('passive:' + id)) continue;
    const lvl = p.passives[id] || 0;
    if (lvl >= MAX_PASSIVE_LEVEL) continue;
    if (!lvl && Object.keys(p.passives).length >= st.passiveSlots) continue;
    opts.push({ kind: 'passive', id, level: lvl + 1, w: lvl ? 2.5 : 2 });
  }
  const out = [];
  opts.sort((a, b) => b.w - a.w);
  while (out.length < 3 && opts.length && opts[0].w >= 1000) out.push(opts.shift()); // evolutions are always offered first
  while (out.length < 3 && opts.length) {
    const total = opts.reduce((a, o) => a + o.w, 0);
    let r = sim.rng() * total, i = 0;
    for (; i < opts.length; i++) { if ((r -= opts[i].w) <= 0) break; }
    out.push(opts.splice(Math.min(i, opts.length - 1), 1)[0]);
  }
  // the curse is a drawback you take on purpose: never the first card (the one the level-up timer and the controller's
  // cursor start on), and when it is all that is left, a fish comes first (no rng: pace 1 never has it, so is unchanged)
  if (out.length && out.every((c) => c.id === 'curse')) out.unshift({ kind: 'heal', id: 'fish', level: 1 });
  else if (out.length > 1 && out.some((c) => c.id === 'curse')) out.sort((a, b) => (a.id === 'curse') - (b.id === 'curse'));
  if (!out.length) out.push({ kind: 'heal', id: 'fish', level: 1 });
  // pace 1 (ranked week 0): no rarity, one level a card, and no extra rolls, exactly as before
  if (!(sim.pace >= 2)) return out.map(({ kind, id, level }) => ({ kind, id, level }));
  // each card rolls its rarity (evolutions are their own reward and do not roll)
  const luck = cardLuck(p.meta || {}, { greed: passiveStrength(p, 'greed') });
  return out.map(({ kind, id, level }) => {
    if (kind === 'evolve') return { kind, id, level };
    if (id === 'curse') return { kind, id, level, from: level - 1 };
    const r = rarityFromRoll(sim.rng(), luck);
    if (kind === 'heal') return { kind, id, level, rarity: CARD_RARITIES[r] };
    const from = level - 1, max = kind === 'weapon' ? MAX_WEAPON_LEVEL : MAX_PASSIVE_LEVEL;
    return { kind, id, level: Math.min(max, from + CARD_GAIN[r]), from, rarity: CARD_RARITIES[r] };
  });
}
// levels a card gives: a rarity card says how many (from -> level); a card without rarity (pace 1) gives one
const cardGain = (sim, c) => sim.pace >= 2 ? 1 : (c.rarity && typeof c.from === 'number' && c.level > c.from ? c.level - c.from : 1);

function openLevel(sim, p) {
  if (!(sim.pace >= 2) || !p.alive || sim.pending[p.id] || !p.levelQ || sim.over) return false;
  p.levelQ--;
  sim.pending[p.id] = { choices: rollChoices(sim, p), left: 20 };
  if (sim.endless && !sim.ranked && sim.pending[p.id].choices.every(c => c.kind === 'heal' || c.kind === 'passive' && c.id === 'curse')) {
    const stat = ['might', 'maxHp', 'area'][Math.floor(sim.rng() * 3)];
    p.endlessGrowth ||= { might: 0, maxHp: 0, area: 0 };
    p.endlessGrowth[stat]++;
    if (stat === 'maxHp' && !p.godMode) {
      const maxHp = playerStats(p).maxHp;
      p.hp = Math.min(maxHp, p.hp + Math.max(0, maxHp - p.maxHp)); p.maxHp = maxHp;
    }
    sim.fx.push({ k: 'endless-growth', player: p.id, stat });
  }
  return true;
}

export function applyChoice(sim, p, choice) {
  if (choice.kind === 'evolve') { p.evo[choice.id] = true; sim.evolves++; if (sim.coop) p.evolves++; sim.fx.push({ k: 'evolve', id: choice.id, ...(sim.coop ? { player: p.id } : {}) }); return; }
  if (sim.pace >= 2 && (choice.kind === 'weapon' || choice.kind === 'passive')) {
    const key = choice.kind === 'weapon' ? 'weapons' : 'passives', max = choice.kind === 'weapon' ? MAX_WEAPON_LEVEL : MAX_PASSIVE_LEVEL;
    if ((p[key][choice.id] || 0) >= max) return;
    const bonus = CARD_QUALITY[Math.max(0, CARD_RARITIES.indexOf(choice.rarity))] - 100;
    if (bonus && choice.id !== 'curse') {
      p.quality ||= { weapons: {}, passives: {} };
      p.quality[key][choice.id] = (p.quality[key][choice.id] || 0) + bonus;
    }
  }
  if (choice.kind === 'weapon') p.weapons[choice.id] = Math.min(MAX_WEAPON_LEVEL, (p.weapons[choice.id] || 0) + cardGain(sim, choice));
  else if (choice.kind === 'passive') {
    p.passives[choice.id] = Math.min(MAX_PASSIVE_LEVEL, (p.passives[choice.id] || 0) + cardGain(sim, choice));
    const st = playerStats(p);
    if (!p.godMode) { const gain = st.maxHp - p.maxHp; p.maxHp = st.maxHp; p.hp = Math.min(p.maxHp, p.hp + Math.max(0, gain)); }
  } else { const r = Math.max(0, CARD_RARITIES.indexOf(choice.rarity)); p.hp = Math.min(p.maxHp, p.hp + CARD_HEAL[r] * playerStats(p).heal); return; }
  if (sim.pace >= 2 && choice.rarity === 'epic' && choice.id !== 'curse' && !p.godMode) p.hp = p.maxHp;
}

export function previewChoice(sim, p, choice) {
  const after = { ...p, weapons: { ...p.weapons }, passives: { ...p.passives }, evo: { ...p.evo },
    ...(p.quality ? { quality: { weapons: { ...p.quality.weapons }, passives: { ...p.quality.passives } } } : {}) };
  applyChoice({ ...sim, fx: [] }, after, choice);
  return after;
}

export function choose(sim, playerId, index) {
  const pend = sim.pending[playerId];
  const p = sim.players.find((q) => q.id === playerId);
  if (!pend || !p) return false;
  const c = pend.choices[index] || pend.choices[0];
  if (sim.pace >= 2 && c.banished) return false;
  if (pend.casket) applyCasket(sim, p, c); else applyChoice(sim, p, c);
  delete sim.pending[playerId];
  sim.fx.push({ k: 'pick', id: playerId });
  if (!openLevel(sim, p)) openCasket(sim, p); // earned levels before the next casket
  return true;
}
// the card the sim picks by itself when the timer runs out: the first level-up card, or a casket's recommended choice
export function autoChoice(pend) { return pend && pend.casket ? pend.rec : pend?.choices.findIndex(c => !c.banished) ?? 0; }

export function canBanish(sim, playerId, index) {
  const p = sim.players.find(p => p.id === playerId), pend = sim.pending[playerId];
  if (!(sim.pace >= 2) || sim.over || !p?.alive || !pend || pend.casket || !Number.isInteger(index) || index < 0 || p.banished.length >= 3) return false;
  const c = pend.choices[index];
  return !!c && !c.banished && (c.kind === 'weapon' && !p.weapons[c.id] || c.kind === 'passive' && !p.passives[c.id]) && pend.choices.some((other, i) => i !== index && !other.banished);
}
export function banish(sim, playerId, index) {
  if (!canBanish(sim, playerId, index)) return false;
  const p = sim.players.find(p => p.id === playerId), c = sim.pending[playerId].choices[index];
  p.banished.push(c.kind + ':' + c.id); c.banished = true;
  return true;
}

// ---- reward caskets: an item for an empty slot goes straight on; otherwise the run pauses on a card: Wear or High alch --
// put a piece on: a change in max HP adds to (or caps) your health, like the Cooked Meat passive
function wearItem(sim, p, item) {
  const before = p.maxHp;
  p.gear = { ...p.gear, [GEAR[item].slot]: item }; p.gb = gearBonus(p.gear, p.gearLv || {}, sim.pace);
  if (!p.godMode) { const m = playerStats(p).maxHp; p.maxHp = m; p.hp = Math.min(m, p.hp + Math.max(0, m - before)); }
}
function gotCasket(sim, p, item) {
  sim.loot.push(item);
  const owner = sim.coop ? { player: p.id } : {};
  if (sim.coop) p.loot.push(item);
  if (isWeaponItem(item)) { p.casketQ.push(item); sim.fx.push({ k: 'casket', item, worn: 0, queued: 1, ...owner }); return; } // a weapon always holds a metal: always a card
  if (!p.gear[GEAR[item].slot]) { wearItem(sim, p, item); sim.fx.push({ k: 'casket', item, worn: 1, ...owner }); return; }
  p.casketQ.push(item); sim.fx.push({ k: 'casket', item, worn: 0, queued: 1, ...owner });
}
export function openCasket(sim, p) {
  if (!p || !p.alive || sim.pending[p.id] || !p.casketQ.length || sim.over) return false;
  const item = p.casketQ.shift();
  const card = isWeaponItem(item) ? compareWeaponItem(p.wm, item) : compareGear(p.gear, p.gearLv || {}, item, sim.pace);
  const rec = card.better ? 0 : 1;
  sim.pending[p.id] = { casket: card, choices: [{ kind: 'wear', id: item, level: 1 }, { kind: 'alch', id: item, level: card.alch }], rec, more: p.casketQ.length, left: 30 };
  return true;
}
function applyCasket(sim, p, c) {
  const owner = sim.coop ? { player: p.id } : {};
  if (c.kind === 'wear' && isWeaponItem(c.id)) {
    const w = WEAPON_ITEMS[c.id], old = weaponSlotItem(w.slot, p.wm[w.slot]);
    p.wm = { ...p.wm, [w.slot]: w.step };
    sim.fx.push({ k: 'casket', item: c.id, worn: 1, old, weapon: w.weapon, ...owner });
  } else if (c.kind === 'wear') {
    const old = p.gear[GEAR[c.id].slot] || null;
    wearItem(sim, p, c.id);
    sim.fx.push({ k: 'casket', item: c.id, worn: 1, old, ...owner });
  } else {
    p.alch += c.level; sim.alched.push(c.id);
    if (sim.coop) p.alched.push(c.id);
    sim.fx.push({ k: 'alch', item: c.id, coins: c.level, ...owner });
  }
}

// a fresh set of three cards (limited per run)
export function reroll(sim, playerId) {
  const pend = sim.pending[playerId], p = sim.players.find((q) => q.id === playerId);
  if (!pend || pend.casket || !p || p.rerolls <= 0) return false;
  p.rerolls--; pend.choices = rollChoices(sim, p); return true;
}
// pass on this level's cards for a coin
export function skipLevel(sim, playerId) {
  const p = sim.players.find((q) => q.id === playerId);
  if (!sim.pending[playerId] || sim.pending[playerId].casket || !p) return false;
  delete sim.pending[playerId]; p.coins++; sim.fx.push({ k: 'pick', id: playerId });
  if (sim.pace >= 2 && !openLevel(sim, p)) openCasket(sim, p);
  return true;
}

function gainXp(sim, amount) {
  sim.xp += amount;
  while (sim.xp >= sim.xpNeed) {
    sim.xp -= sim.xpNeed; sim.level++; sim.xpNeed = xpForLevel(sim.level);
    for (const p of sim.players) if (p.alive) {
      if (sim.pace >= 2) { p.levelQ = (p.levelQ || 0) + 1; openLevel(sim, p); }
      else if (!sim.pending[p.id]) sim.pending[p.id] = { choices: rollChoices(sim, p), left: 20 };
    }
    sim.fx.push({ k: 'level', level: sim.level });
  }
}

// ---- weapons ------------------------------------------------------------
// Cape (area) widens what a weapon covers; Feather (amount) adds projectiles to everything that throws or fires
function withPassives(id, s, st) {
  // Spirit Shard (haste): weapons without a cooldown hit more often instead (shields re-hit sooner, the fire burns faster)
  if (st.haste < 1 && (s.hitcd || s.tick)) { s = { ...s }; if (s.hitcd) s.hitcd *= st.haste; if (s.tick) s.tick *= st.haste; }
  if (s.speed && st.projectileSpeed !== 1) s = { ...s, speed: s.speed * st.projectileSpeed };
  if (st.area === 1 && !st.amount) return s;
  s = { ...s }; const A = st.area;
  if (s.range) s.range *= A;
  if (s.radius) s.radius *= id === 'shield' ? 1 + (A - 1) * 0.5 : A;
  if (s.burst) s.burst *= A;
  if (s.r && (id === 'axe' || id === 'baseball')) s.r *= A;
  if (id === 'bow' || id === 'shortsword') s.hit = 0.45 * A; // arrows and thrown swords hit wider with the Cape
  if (s.life && st.reach > 1 && ['bow', 'axe', 'staff', 'shortsword', 'baseball'].includes(id)) s.life *= st.reach;
  if (st.amount && ['bow', 'axe', 'staff', 'shortsword', 'baseball', 'shield'].includes(id) && !s.ring) s.count = (s.count || 1) + st.amount;
  return s;
}
const NO_METAL = { dmg: 1, pierce: 0 };
function fireWeapons(sim, p, dt, st) {
  p.orbit += dt;
  for (const id of Object.keys(p.weapons)) {
    const lvl = p.weapons[id];
    let s = weaponStats(p, id);
    if (p.evo[id]) s = evolveStats(id, s);
    s = withPassives(id, s, st);
    if (id === 'shield' || id === 'lighter') continue; // handled continuously
    // weapon metals (pace 2): more damage, the Bow's arrows pierce more; mt is the look of the thrown axe or sword
    const metal = sim.pace >= 2 ? weaponMetal(id, p.wm) : NO_METAL, mt = sim.pace >= 2 ? weaponLook(id, p.wm, p.evo[id]) : undefined;
    const dmg = (s.dmg || 0) * st.might * metal.dmg * (MAGIC_WEAPONS.includes(id) ? st.magic : 1);
    if (metal.pierce) s = { ...s, pierce: (s.pierce || 0) + metal.pierce };
    p.cd[id] = (p.cd[id] ?? 0.2) - dt;
    if (p.cd[id] > 0) continue;
    const reach = id === 'pickaxe' ? 7 : id === 'katana' || id === 'greatsword' ? s.range + 1.5 : id === 'shortsword' ? 20 : id === 'baseball' ? 14 : 18;
    const melee = sim.pace >= 2 && (id === 'katana' || id === 'greatsword');
    const target = nearestEnemy(sim, p.x, p.z, melee ? s.range : reach, undefined, melee);
    if (!target && id !== 'pickaxe') { p.cd[id] = 0; continue; }
    sim.src = id;
    p.cd[id] = s.cd * st.haste;
    if (id === 'katana') {
      const a = datan2(target.x - p.x, target.z - p.z);
      p.face = a;
      const dirs = s.both ? [a, a + Math.PI] : [a];
      for (const dir of dirs) {
        sim.fx.push({ k: 'slash', x: p.x, z: p.z, a: dir, range: s.range, arc: s.arc, lvl, mt, ...(sim.coop ? { player: p.id } : {}) });
        const half = (s.arc * Math.PI / 180) / 2;
        for (const e of sim.enemies) {
          const dx = e.x - p.x, dz = e.z - p.z, d = hyp(dx, dz);
          if (d > s.range + ENEMIES[e.type].r) continue;
          let da = Math.abs(((datan2(dx, dz) - dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (da > half || d < 0.001) { if (d > 0.9) continue; }
          damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
          if (s.lifesteal) p.hp = Math.min(p.maxHp, p.hp + s.lifesteal);
        }
      }
    } else if (id === 'bow') {
      const used = new Set();
      for (let i = 0; i < s.count; i++) {
        const tg = nearestEnemy(sim, p.x, p.z, 22, used) || target;
        used.add(tg.id);
        const a = datan2(tg.x - p.x, tg.z - p.z) + (i % 2 ? 1 : -1) * Math.floor((i + 1) / 2) * 0.06;
        sim.proj.push({ id: sim.nextId++, art: 'arrow', evo: !!p.evo.bow, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.pierce, life: s.life, r: s.hit || 0.45, hit: [], lvl, mt: sim.pace >= 2 ? weaponLook('arrow', p.wm) : undefined });
      }
    } else if (id === 'axe') {
      for (let i = 0; i < s.count; i++) {
        const a = target ? datan2(target.x - p.x, target.z - p.z) + (sim.rng() - 0.5) * 0.9 + (i - (s.count - 1) / 2) * 0.35 : sim.rng() * 6.283;
        sim.proj.push({ id: sim.nextId++, art: 'axe', evo: !!p.evo.axe, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: 99, life: s.life, r: s.r, hit: [], hitAt: {}, lvl, mt });
      }
    } else if (id === 'staff') {
      const used = new Set();
      for (let i = 0; i < s.count; i++) {
        const tg = nearestEnemy(sim, p.x, p.z, 20, used) || target;
        used.add(tg.id);
        const a = datan2(tg.x - p.x, tg.z - p.z) + (i - (s.count - 1) / 2) * 0.5;
        sim.proj.push({ id: sim.nextId++, art: 'bolt', evo: !!p.evo.staff, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: 0, life: s.life, r: 0.5, hit: [], homing: tg.id, speed: s.speed, burst: s.burst, lvl });
      }
    } else if (id === 'greatsword') {
      sim.fx.push({ k: 'spin', x: p.x, z: p.z, range: s.range, lvl, evo: p.evo.greatsword ? 1 : 0, ...(sim.coop ? { player: p.id } : {}) });
      for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) <= s.range + ENEMIES[e.type].r) damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
      if (s.heal) p.hp = Math.min(p.maxHp, p.hp + s.heal);
    } else if (id === 'shortsword') {
      const n = s.count;
      for (let i = 0; i < n; i++) {
        // aimed at the nearest monster (the face direction only if there is none); evolved, a ring all round
        const aim = target ? datan2(target.x - p.x, target.z - p.z) : p.face;
        const a = s.ring ? aim + (i / n) * Math.PI * 2 : aim + (i - (n - 1) / 2) * 0.13;
        sim.proj.push({ id: sim.nextId++, art: 'sword', evo: !!p.evo.shortsword, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.pierce, life: s.life, r: s.hit || 0.45, hit: [], lvl, mt });
      }
    } else if (id === 'baseball') {
      const used = new Set();
      for (let i = 0; i < s.count; i++) {
        const tg = nearestEnemy(sim, p.x, p.z, 14, used) || target; used.add(tg.id);
        const a = datan2(tg.x - p.x, tg.z - p.z);
        sim.proj.push({ id: sim.nextId++, art: 'ball', evo: !!p.evo.baseball, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.bounces, life: s.life, r: s.r, hit: [], speed: s.speed, kb: s.kb, lvl });
      }
    } else if (id === 'pickaxe') {
      if (!sim.enemies.some((e) => sim.pace >= 2 ? hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r : hyp(e.x - p.x, e.z - p.z) < s.radius + 2)) { p.cd[id] = 0.3; continue; }
      sim.fx.push({ k: 'quake', x: p.x, z: p.z, r: s.radius, lvl, ...(sim.coop ? { player: p.id } : {}) });
      for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r) damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
    }
  }
  // the lighter: a ring of fire that burns everything inside it every half second
  if (p.weapons.lighter) {
    let s = weaponStats(p, 'lighter');
    if (p.evo.lighter) s = evolveStats('lighter', s);
    s = withPassives('lighter', s, st);
    p.fire = s.radius;
    p.cd.lighter = (p.cd.lighter ?? 0) - dt;
    if (p.cd.lighter <= 0) {
      p.cd.lighter = s.tick; sim.src = 'lighter';
      for (const e of sim.enemies) if (!e.dead && hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r * 0.5) damageEnemy(sim, e, s.dmg * st.might * st.magic, p.id, 0.3, p.x, p.z);
    }
  } else p.fire = 0;
  // kiteshields: positions are derived from time, so hosts and clients agree
  if (p.weapons.shield) {
    let s = weaponStats(p, 'shield');
    if (p.evo.shield) s = evolveStats('shield', s);
    s = withPassives('shield', s, st);
    p.shields = s;
    const dmg = s.dmg * st.might; sim.src = 'shield';
    for (let i = 0; i < s.count; i++) {
      const a = p.orbit * s.spin + (i / s.count) * Math.PI * 2;
      const sx = p.x + dsin(a) * s.radius, sz = p.z + dcos(a) * s.radius;
      for (const e of sim.enemies) {
        if (hyp(e.x - sx, e.z - sz) > s.r + ENEMIES[e.type].r) continue;
        const key = `s${p.id}${i}`;
        if ((e.cdHit[key] || 0) > sim.t) continue;
        e.cdHit[key] = sim.t + s.hitcd;
        damageEnemy(sim, e, dmg, p.id, 1.5, p.x, p.z);
      }
    }
  }
}

function stepProjectiles(sim, dt) {
  const ART_SRC = { arrow: 'bow', axe: 'axe', bolt: 'staff', sword: 'shortsword', ball: 'baseball' };
  for (const pr of sim.proj) {
    pr.life -= dt; sim.src = ART_SRC[pr.art] || pr.art;
    if (pr.art === 'bolt') {
      const tg = sim.enemies.find((e) => e.id === pr.homing) || nearestEnemy(sim, pr.x, pr.z, 18);
      if (tg) {
        pr.homing = tg.id;
        const want = datan2(tg.x - pr.x, tg.z - pr.z), cur = datan2(pr.vx, pr.vz);
        let d = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const turn = Math.max(-5 * dt, Math.min(5 * dt, d)), na = cur + turn;
        pr.vx = dsin(na) * pr.speed; pr.vz = dcos(na) * pr.speed;
      }
    }
    pr.x += pr.vx * dt; pr.z += pr.vz * dt;
    if (pr.art === 'axe') { pr.spin = (pr.spin || 0) + dt * 14; }
    for (const e of sim.enemies) {
      if (e.dead) continue;
      if (hyp(e.x - pr.x, e.z - pr.z) > pr.r + ENEMIES[e.type].r) continue;
      if (pr.art === 'axe') {
        if ((pr.hitAt[e.id] || 0) > sim.t) continue;
        pr.hitAt[e.id] = sim.t + 0.35;
      } else if (pr.hit.includes(e.id)) continue;
      pr.hit.push(e.id);
      damageEnemy(sim, e, pr.dmg, pr.owner, pr.kb || 0.8, pr.x - pr.vx, pr.z - pr.vz);
      if (pr.art === 'bolt') {
        if (pr.burst) {
          sim.fx.push({ k: 'burst', x: pr.x, z: pr.z, r: pr.burst, evo: pr.evo ? 1 : 0 });
          for (const o of sim.enemies) if (o !== e && !o.dead && hyp(o.x - pr.x, o.z - pr.z) < pr.burst) damageEnemy(sim, o, pr.dmg * 0.6, pr.owner, 1, pr.x, pr.z);
        }
        pr.life = 0; break;
      }
      if (pr.art === 'arrow' || pr.art === 'sword') { if (pr.pierce-- <= 0) { pr.life = 0; break; } }
      if (pr.art === 'ball') { // ricochet to the nearest monster it has not hit yet
        if (pr.pierce-- <= 0) { pr.life = 0; break; }
        const next = nearestEnemy(sim, pr.x, pr.z, 9, new Set(pr.hit));
        if (!next) { pr.life = 0; break; }
        const a = datan2(next.x - pr.x, next.z - pr.z); pr.vx = dsin(a) * pr.speed; pr.vz = dcos(a) * pr.speed; pr.life = Math.max(pr.life, 0.8);
        sim.fx.push({ k: 'bounce', x: pr.x, z: pr.z, evo: pr.evo ? 1 : 0 });
        break;
      }
    }
  }
  sim.proj = sim.proj.filter((p) => p.life > 0);
}

// ---- main step ----------------------------------------------------------
// ---- regions of the whole-world map: the nearest map centre decides which monsters roam -------------------------
// the whole-world map's regions: the surface maps (the Hidden Oasis is underground: its centre made the mainland's south
// tip go dark), nearest centre on your own side of the strait (the desert's Payasan centre claimed mainland across the
// water). Audit 3 Nov; The Whole World only, so ranked is untouched.
const REGIONS = MAPS.filter((m) => !m.special && !m.under);
const DESERT = new Set(['apache', 'duel', 'paya']), onDesert = (x, z) => x < 258 && z < 204;
export function regionOf(sim, p) {
  const side = onDesert(p.x, p.z); let best = null, bd = 1e18;
  for (const m of REGIONS) { if (DESERT.has(m.id) !== side) continue; const dx = m.cx - p.x, dz = m.cz - p.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = m; } }
  return best || REGIONS[0];
}

// ---- the belt: beer, pumpkins and warp shards can be saved and used when it counts ------------------------------
export const BELT_SIZE = 4;
const BELT_KINDS = ['beer', 'pumpkin', 'warp'];
// food in SankoQuest's own tiers (owner 3 Nov: "different tiers of food drops, crawdads lowest"): eaten on pickup.
// Pace 2 splits the lowest drops between Cheese and crawdads; elites still drop one tier up and bosses a bass.
export const FOOD = { cheese: { heal: 15, item: 'Cheese' }, crawdad: { heal: 15, item: 'Cooked Crawdad' }, trout: { heal: 25, item: 'Cooked Brown Trout' }, catfish: { heal: 35, item: 'Cooked Catfish' }, bass: { heal: 50, item: 'Cooked Bubba Bass' } };
const FOOD_TIERS = ['crawdad', 'trout', 'catfish', 'bass'];
// u: a roll in [0, 1) (the drop roll itself, so the run's random sequence is unchanged)
export function foodDrop(t, u, elite = false, pace = 1) {
  let i = t < 180 ? (u < 0.7 ? 0 : 1) : t < 480 ? (u < 0.35 ? 0 : u < 0.75 ? 1 : 2) : (u < 0.3 ? 1 : u < 0.78 ? 2 : 3);
  if (elite) i = Math.min(3, i + 1);
  if (pace >= 2 && i === 0 && u < (t < 180 ? 0.35 : 0.175)) return 'cheese';
  return FOOD_TIERS[i];
}
function useItem(sim, p, kind) {
  const st = playerStats(p);
  if (FOOD[kind]) p.hp = Math.min(p.maxHp, p.hp + FOOD[kind].heal * st.heal);
  else if (kind === 'beer') { p.hp = Math.min(p.maxHp, p.hp + 20 * st.heal); p.buffs.speed = 8; }
  else if (kind === 'pumpkin') { sim.src = 'pumpkin'; sim.fx.push({ k: 'nuke', x: p.x, z: p.z, r: 20 }); for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) < 20) damageEnemy(sim, e, 45 + sim.t * 0.25, p.id, 4, p.x, p.z); }
  else if (kind === 'warp') { for (const g of sim.gems) g.pulled = true; for (const o of sim.pickups) if (o.kind === 'coin') o.pulled = true; }
  sim.fx.push({ k: 'use', kind, x: p.x, z: p.z, ...(sim.coop ? { player: p.id } : {}) });
}
export function useBelt(sim, playerId, slot) {
  const p = sim.players.find((q) => q.id === playerId);
  if (!p || !p.alive || slot < 0 || slot >= p.belt.length) return false;
  const kind = p.belt.splice(slot, 1)[0]; useItem(sim, p, kind); return true;
}

// ---- shrines (owner 3 Nov: "we should have shrines"): one of SankoQuest's altars rises nearby every two minutes or so;
// stand in its circle for a few seconds to charge it (stepping out drains it slowly). It fades if left alone. Pace 2 only.
export const SHRINES = {
  strength: { name: 'Shrine of Strength', text: '+30% damage for 40 seconds', color: 0xff5a3c },
  prayer: { name: 'Shrine of Prayer', text: 'full health and 3 seconds of protection', color: 0xbfe8ff },
  magic: { name: 'Shrine of Magic', text: 'every bone flies to you, and +40% experience for 40 seconds', color: 0xb06aff },
  agility: { name: 'Shrine of Agility', text: '+25% speed for 40 seconds', color: 0x7be06a },
  fortune: { name: 'Shrine of Fortune', text: 'a treasure chest', color: 0xffd34d },
  wealth: { name: 'Shrine of Wealth', text: 'a ring of coins', color: 0xffb03a },
};
export const SHRINE = { first: 75, every: 110, charge: 3.5, r: 2.6, life: 75 };
const SHRINE_KINDS = Object.keys(SHRINES);
function shrineTick(sim, dt) {
  if (sim.pace < 2) return;
  const alive = sim.players.filter((q) => q.alive); if (!alive.length) return;
  sim.shrineT = (sim.shrineT ?? SHRINE.first) - dt;
  if (sim.shrineT <= 0) {
    sim.shrineT = sim.shrines.length >= 2 ? 20 : SHRINE.every; // two waiting already: look again soon
    if (sim.shrines.length < 2) {
      const p = alive[Math.floor(sim.rng() * alive.length)], M = sim.map;
      for (let tries = 0; tries < 10; tries++) {
        const a = sim.rng() * 6.283, d = 16 + sim.rng() * 10, x = p.x + dcos(a) * d, z = p.z + dsin(a) * d;
        if (hyp(x - M.cx, z - M.cz) > M.r || !walkable(sim, x, z) || flowAt(sim, x, z) === -2) continue;
        const kind = SHRINE_KINDS[Math.floor(sim.rng() * SHRINE_KINDS.length)];
        sim.shrines.push({ id: sim.nextId++, x, z, kind, charge: 0, life: SHRINE.life }); sim.fx.push({ k: 'shrine', kind, x, z });
        break;
      }
    }
  }
  for (const s of sim.shrines) {
    s.life -= dt;
    const p = alive.find((q) => hyp(q.x - s.x, q.z - s.z) < SHRINE.r);
    s.charge = p ? s.charge + dt : Math.max(0, s.charge - dt * 0.5);
    if (p && s.charge >= SHRINE.charge) { shrineReward(sim, p, s); s.done = true; sim.fx.push({ k: 'shrine-done', kind: s.kind, x: s.x, z: s.z, id: p.id }); }
    else if (s.life <= 0) { s.done = true; sim.fx.push({ k: 'shrine-gone', kind: s.kind, x: s.x, z: s.z }); }
  }
  if (sim.shrines.some((s) => s.done)) sim.shrines = sim.shrines.filter((s) => !s.done);
}
function shrineReward(sim, p, s) {
  const k = s.kind;
  if (k === 'strength') p.buffs.strength = 40;
  else if (k === 'prayer') { p.hp = p.maxHp; p.inv = Math.max(p.inv, 3); }
  else if (k === 'magic') { for (const g of sim.gems) g.pulled = true; p.buffs.wisdom = 40; }
  else if (k === 'agility') p.buffs.agility = 40;
  else if (k === 'fortune') sim.pickups.push({ id: sim.nextId++, x: s.x, z: s.z, kind: 'chest' });
  else for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; sim.pickups.push({ id: sim.nextId++, x: s.x + dcos(a) * 1.8, z: s.z + dsin(a) * 1.8, kind: 'coin' }); }
}

// ---- random events: every few minutes something happens ---------------------------------------------------------
function eventTick(sim, dt) {
  const ev = sim.event;
  if (ev) {
    ev.t -= dt;
    if (ev.kind === 'meteors') { ev.next -= dt; if (ev.next <= 0) { ev.next = 0.45; const p = sim.players.find((q) => q.alive); if (p) { const a = sim.rng() * 6.283, d = sim.rng() * 11; sim.hazards.push({ x: p.x + dcos(a) * d, z: p.z + dsin(a) * d, r: 2.6 * (sim.pace >= 2 ? 0.95 : 1), t: 1.1, max: 1.1, dmg: Math.round(12 * (1 + sim.t / 600)), meteor: true }); } } }
    if (ev.kind === 'treasure' || ev.kind === 'duel') { const g = sim.enemies.find((e) => e.id === ev.id); if (!g) { sim.event = null; return; } if (ev.t <= 0) { g.dead = true; sim.fx.push({ k: 'escape', x: g.x, z: g.z }); } }
    if (ev.t <= 0 || ((ev.kind === 'treasure' || ev.kind === 'duel') && !sim.enemies.some((e) => e.id === ev.id && !e.dead))) sim.event = null;
    return;
  }
  sim.eventT -= dt;
  if (sim.eventT > 0) return;
  sim.eventT = 140 + sim.rng() * 50;
  const p = sim.players.find((q) => q.alive); if (!p) return;
  const here = sim.map.world ? regionOf(sim, p) : sim.map; // on the whole-world map, the region you stand in picks the event
  const grow = Math.max(0.5, Math.min(1, sim.t / 420)); // events start gentler and reach full strength by 7:00
  const N = (n) => Math.max(3, Math.round(n * grow));
  const storms = sim.pace >= 2 ? extraStorms(here, sim.t >= SNOW_WAVE_AT) : [];
  const kinds = (here.events || sim.map.events || ['treasure', 'swarm', 'meteors']).filter(kind => (kind !== 'blizzard' || sim.pace < 2 || sim.t >= SNOW_WAVE_AT) && (sim.pace < 2 || !['rainstorm', 'snowstorm'].includes(kind) || storms.includes(kind)));
  for (const kind of storms) if (!kinds.includes(kind)) kinds.push(kind);
  const kind = kinds.length ? kinds[Math.floor(sim.rng() * kinds.length)] : 'swarm';
  let dir = null;
  if (kind === 'treasure') {
    const a = sim.rng() * 6.283, w = findWalkable(sim, p.x + dcos(a) * 12, p.z + dsin(a) * 12);
    spawnEnemy(sim, 'goblin', w[0], w[1], 12); const g = sim.enemies[sim.enemies.length - 1];
    g.treasure = true; g.elite = true; g.speed = PLAYER_BASE.speed * 0.82 * 0.95;
    sim.event = { kind, t: 25, id: g.id };
  } else if (kind === 'swarm') {
    const pool = here.pool.filter((s) => spawnReady(sim, s)), type = (pool[pool.length - 1] || pool[0]).type; // the region's own monsters on The Whole World
    for (let i = 0, n = N(20); i < n; i++) { const a = (i / n) * 6.283, w = findWalkable(sim, p.x + dcos(a) * 16, p.z + dsin(a) * 16); spawnEnemy(sim, type, w[0], w[1], 0.5); }
    sim.event = { kind, t: 1 };
  } else if (sim.pace >= 2 && (kind === 'rainstorm' || kind === 'snowstorm')) {
    sim.event = { kind, t: 20 };
  } else if (kind === 'blizzard') {
    // a blizzard rolls in: the snow closes in, you wade a little slower, and snowmen come with it
    for (const q of sim.players) if (q.alive) q.buffs.chill = 14;
    for (let i = 0, n = N(10); i < n; i++) { const a = (i / n) * 6.283 + sim.rng() * 0.4, w = findWalkable(sim, p.x + dcos(a) * 15, p.z + dsin(a) * 15); spawnEnemy(sim, 'snowman', w[0], w[1], 0.8); }
    sim.event = { kind, t: 14 };
  } else if (kind === 'stampede') {
    // Greentown's chickens have had enough: a flock charges in from one side (with a few cows along for the ride)
    const a = sim.rng() * 6.283, cx = dcos(a), cz = dsin(a), n = 36;
    dir = Math.abs(cz) > Math.abs(cx) ? (cz < 0 ? 'north' : 'south') : (cx > 0 ? 'east' : 'west');
    for (let i = 0; i < n; i++) {
      const k = (i % 12) - 6, d = 17 + Math.floor(i / 12) * 1.4 + sim.rng();
      const w = findWalkable(sim, p.x + cx * d - cz * k * 1.1, p.z + cz * d + cx * k * 1.1);
      spawnEnemy(sim, i % 12 === 5 ? 'cow' : 'chicken', w[0], w[1], 0.999); sim.enemies[sim.enemies.length - 1].speed *= 1.7; // (not 1: no surprise elites in the flock)
    }
    sim.event = { kind, t: 1 };
  } else if (kind === 'duel') {
    // a champion of the Fighting Forum steps up: one tough fighter, the crowd holds back until one of you falls
    const a = sim.rng() * 6.283, w = findWalkable(sim, p.x + dcos(a) * 10, p.z + dsin(a) * 10);
    spawnEnemy(sim, 'bandit', w[0], w[1], 16); const c = sim.enemies[sim.enemies.length - 1];
    c.elite = true; c.champion = true; c.speed *= 1.25;
    sim.event = { kind, t: 30, id: c.id };
  } else if (kind === 'sandstorm') {
    // a sandstorm sweeps over: the dust closes in, you push through slower, and scorpions come with it
    for (const q of sim.players) if (q.alive) q.buffs.chill = 12;
    for (let i = 0, n = N(9); i < n; i++) { const a = (i / n) * 6.283 + sim.rng() * 0.4, w = findWalkable(sim, p.x + dcos(a) * 14, p.z + dsin(a) * 14); spawnEnemy(sim, 'scorpion', w[0], w[1], 0.9); }
    sim.event = { kind, t: 12 };
  } else if (kind === 'ambush') {
    // the swamp's ambush: alligators and slimers crawl out of the nearest water (or the mud, if there is none)
    const G = sim.ground, spots = [];
    if (G && G.water && G.cell) {
      // blocked is one value per cell (n x n); water is one per vertex ((n+1) x (n+1)), so it has its own row width
      const n = G.n, W = n + 1, px = Math.floor(p.x), pz = Math.floor(p.z);
      for (let dz = -14; dz <= 14; dz++) for (let dx = -14; dx <= 14; dx++) {
        const d2 = dx * dx + dz * dz; if (d2 < 25 || d2 > 196) continue;
        const x = px + dx, z = pz + dz; if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
        if (G.blocked[z * n + x]) continue;
        const k = z * W + x;
        if (G.water[k - 1] || G.water[k + 1] || G.water[k - W] || G.water[k + W]) spots.push([x + 0.5, z + 0.5]);
      }
    }
    const want = N(12);
    for (let i = 0; i < want; i++) {
      let w;
      if (spots.length >= 4) w = spots[Math.floor(sim.rng() * spots.length)];
      else { const a = (i / want) * 6.283, f = findWalkable(sim, p.x + dcos(a) * 10, p.z + dsin(a) * 10); w = [f[0], f[1]]; }
      spawnEnemy(sim, i % 2 ? 'slimer' : 'alligator', w[0], w[1], 0.8); const e = sim.enemies[sim.enemies.length - 1]; e.rise = 0.8 + sim.rng() * 0.5;
      sim.fx.push({ k: 'surface', x: w[0], z: w[1] });
    }
    sim.event = { kind, t: 1 };
  } else if (kind === 'rising') {
    // the dead climb out of the ground in a ring close around you: a moment to get clear before they move
    const n = N(Math.min(14, 8 + Math.floor(sim.t / 90)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + sim.rng() * 0.3, d = 4.5 + sim.rng() * 2.5, w = findWalkable(sim, p.x + dcos(a) * d, p.z + dsin(a) * d);
      spawnEnemy(sim, 'skeleton', w[0], w[1], 0.9); const sk = sim.enemies[sim.enemies.length - 1]; sk.rise = 1.1 + sim.rng() * 0.4;
      sim.fx.push({ k: 'rise', x: w[0], z: w[1] });
    }
    sim.event = { kind, t: 1 };
  } else if (kind === 'warband') {
    // a goblin warband charges in two ranks from one side, led by a tough warchief
    const a = sim.rng() * 6.283, cx = dcos(a), cz = dsin(a), n = N(Math.min(32, 16 + Math.floor(sim.t / 40)));
    dir = Math.abs(cz) > Math.abs(cx) ? (cz < 0 ? 'north' : 'south') : (cx > 0 ? 'east' : 'west');
    for (let i = 0; i < n; i++) {
      const rank = i % 2, k = Math.floor(i / 2) - n / 4, d = 18 + rank * 1.6;
      const w = findWalkable(sim, p.x + cx * d - cz * k * 1.3, p.z + cz * d + cx * k * 1.3);
      spawnEnemy(sim, sim.t > 90 && i % 9 === 4 ? 'bandit' : 'goblin', w[0], w[1], 0.8);
      const g = sim.enemies[sim.enemies.length - 1]; g.speed *= 1.2;
    }
    const w = findWalkable(sim, p.x + cx * 20, p.z + cz * 20); spawnEnemy(sim, 'goblin', w[0], w[1], 9);
    const chief = sim.enemies[sim.enemies.length - 1]; chief.elite = true;
    sim.event = { kind, t: 1 };
  } else sim.event = { kind, t: 10, next: 0 };
  sim.fx.push({ k: 'event', kind, dir });
}

// ---- boss attacks: every one is telegraphed, so it can be dodged -------------------------------------------------
function hurtPlayer(sim, tp, dmg, src = 'contact') {
  sim.hurtBy[src] = (sim.hurtBy[src] || 0) + dmg; // damage taken by source, for balancing
  tp.hp -= dmg; tp.inv = 0.75; tp.hurt = 0.25; // a beat to break free after each hit
  sim.fx.push({ k: 'hurt', id: tp.id, v: dmg, x: tp.x, z: tp.z });
  if (tp.hp <= 0 && tp.revives > 0) {
    tp.revives--; tp.hp = tp.maxHp * 0.5; tp.inv = 2;
    sim.fx.push({ k: 'revive', id: tp.id, x: tp.x, z: tp.z });
  } else if (tp.hp <= 0) { tp.hp = 0; tp.alive = false; sim.fx.push({ k: 'down', id: tp.id }); }
}
const bossDmg = (sim, def, mul) => Math.round(def.dmg * mul * (1 + sim.t / 900) * (sim.hard ? 1.35 : 1));
// returns a movement override (charging, or holding still while winding up), or null
function bossAct(sim, e, def, tp, d, dx, dz, dt) {
  if (sim.pace >= 2 && e.dead) return null;
  const c = e.charge;
  if (c) {
    if (c.wind > 0) { c.wind -= dt; return [0, 0]; }
    if (c.dash > 0) { c.dash -= dt; return [c.dx * e.speed * 3.4, c.dz * e.speed * 3.4]; }
    e.charge = null;
  }
  e.atkCd -= dt;
  if (e.atkCd > 0 || d > 24) return null;
  const list = def.attacks || ['slam'], kind = list[Math.floor(sim.rng() * list.length)];
  e.atkCd = (4 + sim.rng() * 2.5) * (sim.hard ? 0.8 : 1);
  if (kind === 'slam') {
    const baseR = 3.5 + def.r * 1.2, r = baseR * (sim.pace >= 2 ? 0.95 : 1), t = 1.1 + baseR * 0.07; // keep the original warning time
    sim.hazards.push({ x: tp.x, z: tp.z, r, t, max: t, dmg: bossDmg(sim, def, 1.6), ...(sim.pace >= 2 ? { by: e.id } : {}) });
  } else if (kind === 'charge') {
    const ux = dx / (d || 1), uz = dz / (d || 1);
    e.charge = { wind: 0.8, dash: 0.9, dx: ux, dz: uz };
    sim.fx.push({ k: 'aim', id: e.id, x: e.x, z: e.z, a: datan2(ux, uz), len: e.speed * 3.4 * 0.9 + 2, t: 0.8 });
  } else if (kind === 'volley') {
    const base = datan2(dx, dz), n = 5;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.22, sp = 8.5;
      sim.eproj.push({ id: sim.nextId++, x: e.x, z: e.z, vx: dsin(a) * sp, vz: dcos(a) * sp, r: 0.55, dmg: bossDmg(sim, def, 0.75), life: 3.2, art: def.shot || 'fire' });
    }
    sim.fx.push({ k: 'volley', x: e.x, z: e.z, art: def.shot || 'fire' });
  }
  return null;
}
function stepBossAttacks(sim, dt) {
  for (const h of sim.hazards) {
    h.t -= dt;
    if (h.t <= 0) {
      h.done = true; sim.fx.push({ k: 'slam', x: h.x, z: h.z, r: h.r, meteor: h.meteor ? 1 : 0 });
      for (const p of sim.players) if (p.alive && p.inv <= 0 && hyp(p.x - h.x, p.z - h.z) < h.r) hurtPlayer(sim, p, Math.max(1, h.dmg - playerStats(p).armor), h.meteor ? 'meteor' : 'slam');
    }
  }
  sim.hazards = sim.hazards.filter((h) => !h.done);
  for (const b of sim.eproj) {
    b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
    if (b.life <= 0 || !walkable(sim, b.x, b.z) && sim.ground && hyp(b.vx, b.vz) > 0) { b.dead = true; continue; }
    for (const p of sim.players) if (p.alive && p.inv <= 0 && hyp(p.x - b.x, p.z - b.z) < b.r + PLAYER_BASE.radius) { hurtPlayer(sim, p, Math.max(1, b.dmg - playerStats(p).armor), 'volley'); b.dead = true; break; }
  }
  sim.eproj = sim.eproj.filter((b) => !b.dead);
}

export function step(sim, inputs = {}, dt = TICK) {
  if (sim.over) return;
  // pending level-ups pause the world; timeouts auto-pick
  const pendIds = Object.keys(sim.pending);
  if (pendIds.length) {
    for (const id of pendIds) {
      const pend = sim.pending[id];
      pend.left -= dt;
      if (pend.left <= 0) choose(sim, id, autoChoice(pend));
    }
    return;
  }
  sim.t += dt; sim.tick++;

  for (const p of sim.players) {
    if (!p.alive) continue;
    const st = playerStats(p);
    const inp = inputs[p.id] || { mx: 0, mz: 0 };
    const len = hyp(inp.mx, inp.mz);
    if (sim.pace >= 2) {
      p.rollCd = Math.max(0, (p.rollCd || 0) - dt);
      if (p.rollCd < 1e-9) p.rollCd = 0;
      if (inp.use === 4 && p.rollCd === 0) {
        p.rollCd = TUMBLE.cooldown; p.rollT = TUMBLE.duration;
        p.rollFace = len > 0.01 ? datan2(inp.mx, inp.mz) : p.moveFace ?? p.face;
        // Spend cooldown even against a closed pen, bounding navigation work from repeated input.
        sim.fx.push({ k: 'land-hop', x: p.x, z: p.z });
      }
    }
    if (inp.use != null && !(sim.pace >= 2 && inp.use === 4)) useBelt(sim, p.id, inp.use);
    p.moving = len > 0.01 || (sim.pace >= 2 && p.rollT > 1e-9);
    if (sim.pace >= 2 && p.rollT > 1e-9) {
      // Co-op's shared field may have moved to another player since this roll's last tick.
      if (p.rollT === TUMBLE.duration || sim.players.length > 1) updateFlow(sim, p);
      const distance = TUMBLE.speed * Math.min(dt, p.rollT), parts = Math.ceil(distance / 0.5);
      const dx = dsin(p.rollFace) * distance / parts, dz = dcos(p.rollFace) * distance / parts;
      // Small substeps keep blocked terrain solid even when a caller supplies a long frame.
      for (let i = 0; i < parts; i++) moveTo(sim, p, p.x + dx, p.z + dz, true);
      p.face = p.moveFace = p.rollFace; p.rollT = Math.max(0, p.rollT - dt);
      if (p.rollT < 1e-9) p.rollT = 0;
    } else if (p.moving) {
      const mx = inp.mx / Math.max(1, len), mz = inp.mz / Math.max(1, len);
      moveTo(sim, p, p.x + mx * st.speed * dt, p.z + mz * st.speed * dt);
      p.face = datan2(mx, mz);
      if (sim.pace >= 2) p.moveFace = p.face;
    }
    const off = hyp(p.x - sim.map.cx, p.z - sim.map.cz);
    if (off > sim.map.r) { p.x = sim.map.cx + (p.x - sim.map.cx) * sim.map.r / off; p.z = sim.map.cz + (p.z - sim.map.cz) * sim.map.r / off; }
    p.inv = Math.max(0, p.inv - dt); p.hurt = Math.max(0, p.hurt - dt);
    for (const b of Object.keys(p.buffs)) p.buffs[b] = Math.max(0, p.buffs[b] - dt);
    if (!p.godMode) p.maxHp = st.maxHp; // godMode: QA only
    p.regen += st.regen * dt; if (p.regen >= 1) { p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.regen)); p.regen %= 1; }
    (sim.crit || (sim.crit = {}))[p.id] = [st.critC, st.critM];
    fireWeapons(sim, p, dt, st);
  }

  sim.flowT -= dt; if (sim.flowT <= 0) { sim.flowT = 0.3; updateFlow(sim); }
  spawnTick(sim, dt);
  eventTick(sim, dt);
  shrineTick(sim, dt);

  // enemies: chase, separate, hurt
  const cell = 1.6, grid = new Map();
  const key = (x, z) => ((Math.floor(x / cell) + 4096) << 13) | (Math.floor(z / cell) + 4096);
  for (const e of sim.enemies) { if (sim.pace >= 2 && e.dead) continue; const k = key(e.x, e.z); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  for (const e of sim.enemies) {
    if (sim.pace >= 2 && e.dead) continue;
    const def = ENEMIES[e.type];
    const tp = nearestPlayer(sim, e.x, e.z);
    e.hit = Math.max(0, e.hit - dt);
    if (e.rise > 0) { e.rise -= dt; if (tp) e.face = datan2(tp.x - e.x, tp.z - e.z); continue; } // still climbing out of the ground
    if (tp) {
      const dx = tp.x - e.x, dz = tp.z - e.z, rawD = hyp(dx, dz), d = rawD || 1;
      const blockedApproach = sim.pace >= 2 && d <= Math.max(2.5, def.r + PLAYER_BASE.radius) && !clearPath(sim, e.x, e.z, tp.x, tp.z);
      const blockedSteering = blockedApproach || (sim.pace >= 2 && d <= 2.5 && !clearPath(sim, e.x, e.z, tp.x, tp.z, true));
      let mx = (dx / d) * e.speed, mz = (dz / d) * e.speed;
      if (d > 2.5 || blockedSteering) { const fd = flowDir(sim, e.x, e.z); if (fd) { mx = fd[0] * e.speed; mz = fd[1] * e.speed; } }
      let bossMove = false;
      if (def.boss) { const m = bossAct(sim, e, def, tp, d, dx, dz, dt); if (m) { mx = m[0]; mz = m[1]; bossMove = true; } }
      if (e.treasure) { mx = -(dx / d) * e.speed; mz = -(dz / d) * e.speed; } // it runs from you
      if (sim.pace >= 2 && sim.tick <= 7200) { mx *= 1.05; mz *= 1.05; } // first four minutes at 30 Hz; no permanent spawn-speed change
      // soft separation
      const cx = Math.floor(e.x / cell), cz = Math.floor(e.z / cell);
      for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) {
        const list = grid.get(((cx + ix + 4096) << 13) | (cz + iz + 4096));
        if (!list) continue;
        for (const o of list) {
          if (o === e || (sim.pace >= 2 && o.dead)) continue;
          const ox = e.x - o.x, oz = e.z - o.z, od = hyp(ox, oz);
          const min = (def.r + ENEMIES[o.type].r) * 0.85;
          if (od < min && od > 0.001) { const push = (min - od) / min; mx += (ox / od) * push * 4; mz += (oz / od) * push * 4; }
        }
      }
      const oldX = e.x, oldZ = e.z;
      let keepDistance = 0, escape = 0;
      const stop = (def.r + PLAYER_BASE.radius) * 0.95;
      if (sim.pace >= 2 && !bossMove && !e.treasure && !blockedApproach && (!blockedSteering || rawD < stop)) {
        // Escape already-overlapping bodies even when target look-ahead faces a wall.
        if (rawD < stop + (Math.abs(mx + e.kx) + Math.abs(mz + e.kz)) * dt) {
          const angle = (e.id % 16) * Math.PI / 8, ux = rawD ? dx / rawD : dsin(angle), uz = rawD ? dz / rawD : dcos(angle);
          const limit = rawD < stop ? -Math.min(e.speed, (stop - rawD) / dt) : (rawD - stop) / dt;
          const inward = (mx + e.kx) * ux + (mz + e.kz) * uz;
          if (inward > limit) { mx -= ux * (inward - limit); mz -= uz * (inward - limit); }
          keepDistance = Math.min(stop, rawD);
          escape = Math.max(0, Math.min(e.speed * dt, stop - rawD));
        }
      }
      moveTo(sim, e, oldX + (mx + e.kx) * dt, oldZ + (mz + e.kz) * dt);
      // A wall can turn a valid diagonal into an inward axis slide. Restore the legal old point, then try Z alone.
      if (keepDistance && hyp(e.x - tp.x, e.z - tp.z) < keepDistance - 1e-9) {
        e.x = oldX; e.z = oldZ; moveTo(sim, e, oldX, oldZ + (mz + e.kz) * dt);
        if (hyp(e.x - tp.x, e.z - tp.z) < keepDistance - 1e-9) { e.x = oldX; e.z = oldZ; }
      }
      // A pinned overlap can escape sideways; every candidate still uses the wall-constrained mover.
      if (escape && hyp(e.x - tp.x, e.z - tp.z) <= rawD + 1e-9) {
        let bestX = e.x, bestZ = e.z, bestD = hyp(e.x - tp.x, e.z - tp.z);
        for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          e.x = oldX; e.z = oldZ; moveTo(sim, e, oldX + sx * escape, oldZ + sz * escape);
          const candidate = hyp(e.x - tp.x, e.z - tp.z);
          if (candidate > bestD + 1e-9) { bestD = candidate; bestX = e.x; bestZ = e.z; }
        }
        e.x = bestX; e.z = bestZ;
      }
      e.kx *= 0.86; e.kz *= 0.86;
      e.face = datan2(dx, dz);
      if ((sim.pace >= 2 ? rawD : d) < def.r + PLAYER_BASE.radius && tp.inv <= 0 && !e.treasure && !blockedApproach) {
        const st = playerStats(tp);
        const dmg = Math.max(1, Math.round(def.dmg * 0.85 * (sim.t < 120 ? (sim.pace >= 2 ? 0.8 : 0.7) : 1) * (1 + sim.t / (sim.pace >= 2 ? 750 : 1200)) * (sim.pace >= 2 ? sim.vet * (1 + CURSE.dmg * (sim.curse || 0)) : 1) * (sim.hard ? 1.35 : 1) * (def.boss ? 0.8 : 1) * (e.charge && e.charge.dash > 0 ? 1.5 : 1) * (e.elite ? 1.4 : 1) - st.armor));
        hurtPlayer(sim, tp, dmg, def.boss ? 'boss-contact' : 'contact');
        if (st.thorns > 0) { sim.src = 'thorns'; damageEnemy(sim, e, st.thorns * (1 + sim.t / 600), tp.id, 2.2, tp.x, tp.z); } // Scorpion Carapace
      }
    }
  }

  stepProjectiles(sim, dt);
  stepBossAttacks(sim, dt);
  sim.enemies = sim.enemies.filter((e) => !e.dead);
  recycleStrays(sim, dt);

  // gems and pickups
  for (const g of sim.gems) {
    const p = nearestPlayer(sim, g.x, g.z);
    if (!p) continue;
    const st = playerStats(p), d = hyp(p.x - g.x, p.z - g.z);
    if (d < st.magnet || g.pulled) {
      g.pulled = true;
      const sp = 11 + (sim.pace >= 2 ? Math.abs(st.magnet - d) : st.magnet - d) * 0.5;
      g.x += ((p.x - g.x) / (d || 1)) * sp * dt; g.z += ((p.z - g.z) / (d || 1)) * sp * dt;
    }
    if (d < 0.8) { g.taken = true; gainXp(sim, g.v * st.growth); }
  }
  sim.gems = sim.gems.filter((g) => !g.taken);
  for (const k of sim.pickups) {
    const p = nearestPlayer(sim, k.x, k.z);
    if (p && k.kind === 'coin' && !k.pulled && hyp(p.x - k.x, p.z - k.z) < playerStats(p).magnet) k.pulled = true; // coins answer pickup range, like gems
    if (k.pulled && p) { const d = hyp(p.x - k.x, p.z - k.z) || 1; k.x += ((p.x - k.x) / d) * 12 * dt; k.z += ((p.z - k.z) / d) * 12 * dt; }
    if (p && hyp(p.x - k.x, p.z - k.z) < 1.1) {
      if (k.kind === 'chest' && sim.pending[p.id]) continue;
      k.taken = true;
      const st = playerStats(p), beforeHp = p.hp;
      if (BELT_KINDS.includes(k.kind) && p.belt.length < BELT_SIZE) p.belt.push(k.kind); // kept for later (1-4)
      else if (BELT_KINDS.includes(k.kind) || FOOD[k.kind]) useItem(sim, p, k.kind);
      else if (k.kind === 'chest') { for (const member of sim.coop ? sim.players.filter(p => p.alive) : [p]) if (!sim.pending[member.id]) sim.pending[member.id] = { choices: rollChoices(sim, member), left: 25 }; }
      else if (k.kind === 'casket') { for (const member of sim.coop ? sim.players.filter(p => p.alive) : [p]) gotCasket(sim, member, rollCasket(sim.rng, sim.casketRank, sim.hard, sim.t, { pace: sim.pace, weapons: member.weapons })); }
      else p.coins++;
      sim.fx.push({ k: 'get', kind: k.kind, x: k.x, z: k.z, ...(sim.pace >= 2 && FOOD[k.kind] ? { heal: Math.max(0, p.hp - beforeHp) } : {}) });
    }
  }
  sim.pickups = sim.pickups.filter((k) => !k.taken);

  if (sim.players.every((p) => !p.alive)) sim.over = 'dead';
  else if (sim.t >= sim.map.length && !sim.endless) sim.over = 'win';
  else if (sim.endAt && sim.t >= sim.endAt) sim.over = 'time';
  for (const p of sim.players) openCasket(sim, p); // a casket card waits for any level-up card first
}

// ---- snapshots for the network and the renderer ---------------------------
const r1 = (v) => Math.round(v * 10) / 10;
export function snapshot(sim, { maxEnemies = 260 } = {}) {
  const cs = sim.players.filter((p) => p.alive);
  let en = sim.enemies;
  if (en.length > maxEnemies && cs.length) {
    en = en.slice().sort((a, b) => {
      const da = Math.min(...cs.map((p) => (p.x - a.x) ** 2 + (p.z - a.z) ** 2));
      const db = Math.min(...cs.map((p) => (p.x - b.x) ** 2 + (p.z - b.z) ** 2));
      return da - db;
    }).slice(0, maxEnemies);
  }
  const fx = sim.fx; sim.fx = [];
  const storm = sim.pace >= 2 ? stormView(sim.event) : null;
  return {
    ...(sim.pace >= 2 ? { snowWave: !!sim.snowWave, storm } : {}),
    t: Math.round(sim.t * 100) / 100, over: sim.over, region: sim.region, weather: sim.pace >= 2 ? storm?.kind || null : sim.event && (sim.event.kind === 'blizzard' || sim.event.kind === 'sandstorm') ? sim.event.kind : null, level: sim.level, xp: Math.round(sim.xp), xpNeed: sim.xpNeed, kills: sim.kills,
    players: sim.players.map((p) => ({ id: p.id, name: p.name, slot: p.slot, x: r1(p.x), z: r1(p.z), f: Math.round(p.face * 100) / 100, mv: p.moving ? 1 : 0, hp: Math.round(p.hp), mhp: p.maxHp, al: p.alive ? 1 : 0, adv: p.adv, hurt: p.hurt > 0 ? 1 : 0, w: p.weapons, ps: p.passives, evo: p.evo, buf: p.buffs.speed > 0 ? 1 : 0, fire: Math.round((p.fire || 0) * 10) / 10, shields: p.shields, orbit: Math.round(p.orbit * 100) / 100, k: p.kills, gear: p.gear, rr: p.rerolls, coins: p.coins, alch: p.alch, belt: p.belt.slice(), wm: sim.pace >= 2 ? p.wm : null, ...(sim.pace >= 2 ? { rollT: p.rollT || 0, rollCd: p.rollCd || 0, rollFace: p.rollFace ?? p.face } : {}) })),
    enemies: en.map((e) => [e.id, e.type, r1(e.x), r1(e.z), Math.round(e.face * 20) / 20, Math.max(0, Math.round((e.hp / e.maxHp) * 100)), e.hit > 0 ? 1 : 0, e.elite ? 1 : 0, e.charge && e.charge.wind > 0 ? 1 : 0, e.treasure ? 1 : 0, e.rise > 0 ? Math.round(e.rise * 20) / 20 : 0]),
    hazards: sim.hazards.map((h) => [r1(h.x), r1(h.z), h.r, Math.round((1 - h.t / h.max) * 100) / 100, h.meteor ? 1 : 0]),
    eproj: sim.eproj.map((b) => [b.id, r1(b.x), r1(b.z), b.art]),
    proj: sim.proj.map((p) => [p.id, p.art, r1(p.x), r1(p.z), Math.round(datan2(p.vx, p.vz) * 20) / 20, p.lvl, Math.round((p.spin || 0) * 10) / 10, p.evo ? 1 : 0, p.mt ?? -1]),
    gems: sim.gems.map((g) => [g.id, r1(g.x), r1(g.z), g.v]),
    pickups: sim.pickups.map((k) => [k.id, k.kind, r1(k.x), r1(k.z)]),
    shrines: sim.shrines.map((s) => [s.id, s.kind, r1(s.x), r1(s.z), Math.round(Math.min(1, s.charge / SHRINE.charge) * 100) / 100, Math.round(s.life)]),
    pending: Object.fromEntries(Object.entries(sim.pending).map(([id, v]) => [id, v.casket ? { choices: v.choices, left: Math.ceil(v.left), casket: v.casket, rec: v.rec, more: v.more } : { choices: v.choices, left: Math.ceil(v.left) }])),
    fx,
  };
}
