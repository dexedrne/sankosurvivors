import { disposeActor } from './character.js';
import { createPetTrail, petChoice } from './pets.js';

export function createPetRenderer({ load, spawn, group, groundAt, choice = petChoice }) {
  const trail = createPetTrail(); let generation = 0, prototype = null, actor = null, owner = null, state = 'idle', selected = null;
  let allowed = () => true;
  function reset() { if (actor) disposeActor(actor.root, actor.mixer); actor = null; owner = null; trail.reset(); }
  function authorized() { try { return allowed() === true; } catch { return false; } }
  function revoke() { generation++; prototype = null; selected = null; state = 'idle'; reset(); }
  return {
    state: () => state,
    reset,
    async set(id, isCurrent = () => true) {
      const attempt = ++generation; selected = choice(id); allowed = isCurrent; prototype = null; reset();
      if (!selected) { state = 'idle'; return true; }
      if (!authorized()) { revoke(); return false; }
      state = 'loading';
      try {
        const ready = await load(selected);
        if (generation !== attempt) return false;
        if (!authorized()) { revoke(); return false; }
        prototype = ready; state = 'ready'; return true;
      } catch { if (generation === attempt) state = 'unavailable'; return false; }
    },
    update(view, dt, localId) {
      if (selected && !authorized()) { revoke(); return; }
      const player = view.players?.find(p => p.id === localId);
      if (!prototype || !player?.al) { reset(); return; }
      if (owner !== null && owner !== localId) reset();
      const active = view.petActive !== false && Number.isFinite(dt) && dt > 0;
      const pose = trail.step(player, dt, active); if (!pose) { reset(); return; }
      try {
        if (!actor) { actor = spawn(prototype, selected); group.add(actor.root); owner = localId; }
        const y = groundAt(pose.x, pose.z); if (!Number.isFinite(y)) throw new Error('Pet ground is unavailable');
        actor.root.position.set(pose.x, y, pose.z); actor.root.rotation.y = pose.f;
        if (active) actor.update(dt, pose.moving);
      } catch { reset(); prototype = null; state = 'unavailable'; }
    },
  };
}
