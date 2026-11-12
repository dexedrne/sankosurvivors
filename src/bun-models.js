import { BUN_APPEARANCES, BUN_ANIMATIONS, BUN_FACES } from './bun-catalogue.js';
import { prepareBun, createBunActor } from './bun-actor.js';

export function createBunModels(loadGLB, asset, loadTexture) {
  const cache = new Map(); let facePromise = null;
  function faces() {
    if (!facePromise) {
      facePromise = Promise.allSettled(Object.entries(BUN_FACES.textures).map(async ([key, record]) => {
        const texture = await loadTexture(asset(record.path));
        if (!texture?.isTexture) throw new Error('Bun face texture is unavailable');
        return [key, texture];
      })).then(results => {
        const loaded = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        if (loaded.length !== results.length) {
          for (const texture of new Set(loaded.map(([, texture]) => texture))) texture.dispose();
          facePromise = null; return null;
        }
        return Object.fromEntries(loaded);
      });
    }
    return facePromise;
  }
  const choice = id => typeof id === 'string' && id.startsWith('bun:') && Object.hasOwn(BUN_APPEARANCES, id.slice(4)) ? id : null;
  return { choice,
    async load(id) {
      if (!choice(id)) throw new Error('BUN appearance is unavailable');
      if (!cache.has(id)) {
        const pending = Promise.all([BUN_APPEARANCES[id.slice(4)].model.path, BUN_ANIMATIONS.run.path, BUN_ANIMATIONS.curious.path].map(path => loadGLB(asset(path))))
          .then(([model, run, curious]) => prepareBun(model, { run:run.animations?.[0], curious:curious.animations?.[0] }));
        cache.set(id, pending); pending.catch(() => { if (cache.get(id) === pending) cache.delete(id); });
      }
      const proto = await cache.get(id);
      if (loadTexture && !proto.faces) proto.faces = await faces();
      return proto;
    },
    spawn(proto) { const actor = createBunActor(proto); actor.root.name = 'companion'; return actor; },
  };
}
