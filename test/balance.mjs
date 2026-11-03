// Balance bot: node test/balance.mjs [seeds] [map]  -> how a simple kiting player fares per starting weapon.
// The bot backs away from nearby monsters, drifts in a slow circle near the map centre, prefers upgrading what it has.
import { createSim, step, choose, TICK } from '../src/sim.js';
import { pathToFileURL } from 'node:url';
import { MAP_BY_ID, ENEMIES } from '../src/content.js';
export function bot(sim, p) {
  let fx = 0, fz = 0;
  const melee = p.weapons.katana || p.weapons.greatsword || p.weapons.pickaxe || p.weapons.shield || p.weapons.lighter;
  const keep = melee ? 2.2 : 5; // melee fighters let monsters come close; ranged ones keep their distance
  for (const e of sim.enemies) { const boss = ENEMIES[e.type].boss, dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz); if (d < (boss ? 14 : 10) && d > 0.01) { const w = boss ? 6 / (d * d) : d < keep ? 1 / (d * d) : 0.15 / (d * d); fx += dx / d * w; fz += dz / d * w; } }
  // step out of boss slam circles and away from fireballs, like a player would
  for (const h of sim.hazards) { const dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz) || 0.01; if (d < h.r + 1.2) { fx += dx / d * 3; fz += dz / d * 3; } }
  for (const b of sim.eproj) { const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz) || 0.01; if (d < 5) { const sx = -b.vz, sz = b.vx, l = Math.hypot(sx, sz) || 1; const side = (dx * sx + dz * sz) >= 0 ? 1 : -1; fx += sx / l * side * 1.5; fz += sz / l * side * 1.5; } }
  const cx = sim.map.cx, cz = sim.map.cz, off = Math.hypot(p.x - cx, p.z - cz);
  fx += -(p.x - cx) / 40 * (off > 25 ? 0.06 : 0.004); fz += -(p.z - cz) / 40 * (off > 25 ? 0.06 : 0.004);
  const a = sim.t * 0.35; fx += Math.cos(a) * 0.006; fz += Math.sin(a) * 0.006;
  // head for the nearest gem or pickup, more strongly when nothing is close
  let best = null, bd = 1e9; for (const g of sim.gems.concat(sim.pickups)) { const d = Math.hypot(g.x - p.x, g.z - p.z); if (d < bd) { bd = d; best = g; } }
  const danger = Math.hypot(fx, fz);
  if (best && bd < 25) { const w = danger > 0.08 ? 0.01 : 0.06; fx += (best.x - p.x) / bd * w; fz += (best.z - p.z) / bd * w; }
  const l = Math.hypot(fx, fz) || 1; return { mx: fx / l, mz: fz / l };
}
export function pick(ch, p) {
  const score = (c) => c.kind === 'evolve' ? 100 : c.kind === 'weapon' && p.weapons[c.id] ? 10 + c.level : c.kind === 'passive' && ['might', 'haste', 'vigor', 'armor'].includes(c.id) ? 8 : c.kind === 'weapon' ? 6 : 4;
  let best = 0; ch.forEach((c, i) => { if (score(c) > score(ch[best])) best = i; }); return best;
}
if (!process.env.NODE_TEST_CONTEXT && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const SEEDS = Number(process.argv[2] || 3), MAP = MAP_BY_ID[process.argv[3] || 'greentown'];
  const WEAPONS = (process.argv[4] || 'katana,bow,axe,shield,staff,pickaxe,greatsword,shortsword').split(',');
  const all = [];
  for (const weapon of WEAPONS) {
    const res = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const sim = createSim({ seed, map: MAP, players: [{ id: 'p1', name: 'bot', weapon }] });
      const marks = {};
      while (!sim.over && sim.t < MAP.length + 1) {
        step(sim, { p1: bot(sim, sim.players[0]) }, TICK);
        for (const id of Object.keys(sim.pending)) choose(sim, id, pick(sim.pending[id].choices, sim.players[0]));
        for (const m of [300, 600]) if (!marks[m] && sim.t >= m) marks[m] = `L${sim.level}/k${sim.kills}/hp${Math.round(sim.players[0].hp)}`;
      }
      res.push({ over: sim.over, t: Math.round(sim.t), lvl: sim.level, kills: sim.kills, marks, hurt: Object.entries(sim.hurtBy).map(([k, v]) => k + ':' + Math.round(v)).join(','), n: sim.enemies.length });
    }
    const avgT = Math.round(res.reduce((a, r) => a + r.t, 0) / res.length), wins = res.filter((r) => r.over === 'win').length;
    console.log(weapon.padEnd(11), `avg ${avgT}s wins ${wins}/${res.length}`, res.map((r) => `${r.over}@${r.t} L${r.lvl} k${r.kills} n${r.n} {${r.hurt}}`).join(' | '));
    all.push(avgT);
  }
}
