import { BUN_APPEARANCES, BUN_ANIMATIONS } from './bun-catalogue.js';
import { prepareBun, createBunActor } from './bun-actor.js';

export function createBunModels(loadGLB, asset) {
  const cache = new Map();
  const choice = id => typeof id === 'string' && id.startsWith('bun:') && Object.hasOwn(BUN_APPEARANCES, id.slice(4)) ? id : null;
  return { choice,
    async load(id) {
      if (!choice(id)) throw new Error('BUN appearance is unavailable');
      if (!cache.has(id)) {
        const pending = Promise.all([BUN_APPEARANCES[id.slice(4)].model.path, BUN_ANIMATIONS.run.path, BUN_ANIMATIONS.curious.path].map(path => loadGLB(asset(path))))
          .then(([model, run, curious]) => prepareBun(model, { run:run.animations?.[0], curious:curious.animations?.[0] }));
        cache.set(id, pending); pending.catch(() => { if (cache.get(id) === pending) cache.delete(id); });
      }
      return cache.get(id);
    },
    spawn(proto) { const actor = createBunActor(proto); actor.root.name = 'companion'; return actor; },
  };
}
