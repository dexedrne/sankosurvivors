export const NATIVE_PETS = Object.freeze({
  chicken: Object.freeze({ name: 'Chicken', model: 'models/mobs/chicken.glb', height: .55, walk: 'Walk', idle: 'Idle' }),
  fox: Object.freeze({ name: 'Fox', model: 'models/mobs/fox.glb', height: .65, walk: 'Run', idle: 'Idle' }),
});
export const petChoice = value => typeof value === 'string' && Object.hasOwn(NATIVE_PETS, value) ? value : null;

export function createPetTrail() {
  let points = [], pose = null;
  const reset = () => { points = []; pose = null; };
  return { reset, step(player, dt, active) {
    if (!player?.al || !Number.isFinite(player.x) || !Number.isFinite(player.z)) return null;
    if (!pose) { points.push({ x: player.x, z: player.z }); pose = { x: player.x, z: player.z, f: Number.isFinite(player.f) ? player.f : 0, moving: false }; }
    if (!active || !Number.isFinite(dt) || dt <= 0) return { ...pose, moving: false };
    const last = points[points.length - 1], moved = Math.hypot(player.x - last.x, player.z - last.z);
    if (moved > 8) { reset(); return this.step(player, dt, active); }
    if (moved > .02) points.push({ x: player.x, z: player.z });
    if (points.length > 128) points.splice(0, points.length - 128);
    let gap = 1.1, target = points[0];
    for (let i = points.length - 1; i > 0; i--) {
      const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.z - a.z);
      if (gap <= length) {
        const k = gap / length; target = { x: b.x + (a.x - b.x) * k, z: b.z + (a.z - b.z) * k };
        if (i > 1) points.splice(0, i - 1); break;
      }
      gap -= length;
    }
    const dx = target.x - pose.x, dz = target.z - pose.z, moving = Math.hypot(dx, dz) > .001;
    pose = { x: target.x, z: target.z, f: moving ? Math.atan2(dx, dz) : pose.f, moving }; return { ...pose };
  } };
}
