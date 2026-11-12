import * as THREE from 'three';
import { disposeActor, ownActorResource } from './character.js';

// Only the WebGL boundary is replaceable; lifecycle checks use real scenes and actors in Node tests.
export function createPetPreview({ canvas, choice, load, spawn, renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' }) }) {
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1e1710);
  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x5d6f4a, 1.55));
  const sun = new THREE.DirectionalLight(0xffe9c4, 2.6); sun.position.set(-3, 6, 4); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(38, 1, .01, 100), pivot = new THREE.Group(); scene.add(pivot);
  const pedestal = new THREE.Mesh(ownActorResource(new THREE.CylinderGeometry(1, 1, .08, 48)), ownActorResource(new THREE.MeshStandardMaterial({ color: 0x53605b, roughness: .9 })));
  pedestal.position.y = -.04; scene.add(pedestal);
  let actor = null, generation = 0, selected = null, allowed = () => true, status = 'idle', yaw = 0;
  const textureCopies = new Map();
  let width = 0, height = 0, radius = .5, targetY = .35;
  function authorized() { try { return allowed() === true; } catch { return false; } }
  function remove() {
    if (actor) disposeActor(actor.root, actor.mixer); actor = null;
    for (const texture of textureCopies.values()) texture.dispose(); textureCopies.clear(); renderer.clear();
  }
  function isolateResources(root) {
    // Each renderer adds disposal listeners; preview-owned copies keep closed contexts out of the shared cache.
    const geometries = new Map(), materials = new Map();
    root.traverse(object => {
      if (!object.isMesh) return;
      if (!geometries.has(object.geometry)) geometries.set(object.geometry, ownActorResource(object.geometry.clone()));
      object.geometry = geometries.get(object.geometry);
      const copies = [].concat(object.material).map(material => {
        if (!materials.has(material)) {
          const copy = ownActorResource(material.clone()); materials.set(material, copy);
          for (const key of Object.keys(copy)) if (copy[key]?.isTexture) {
            const texture = copy[key];
            if (!textureCopies.has(texture)) textureCopies.set(texture, texture.clone());
            copy[key] = textureCopies.get(texture);
          }
        }
        return materials.get(material);
      });
      object.material = Array.isArray(object.material) ? copies : copies[0];
    });
    // Release factory-owned material copies; disposeActor leaves cached BUN materials untouched.
    const retired = new THREE.Group(); retired.material = [...materials.keys()]; disposeActor(retired);
  }
  function revoke() { generation++; selected = null; status = 'idle'; remove(); }
  function fit() {
    const vertical = THREE.MathUtils.degToRad(camera.fov) / 2, horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const distance = radius / Math.sin(Math.min(vertical, horizontal)) * 1.2;
    camera.position.set(0, targetY + distance * .16, distance * Math.sqrt(1 - .16 ** 2));
    camera.near = Math.max(.001, distance - radius * 2); camera.far = distance + radius * 3;
    camera.lookAt(0, targetY, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }
  return {
    state: () => status,
    async set(id, isCurrent = () => true) {
      if (status === 'disposed') return false;
      const attempt = ++generation; selected = choice(id); allowed = isCurrent; remove(); yaw = 0;
      if (!selected) { status = 'idle'; return true; }
      if (!authorized()) { revoke(); return false; }
      status = 'loading';
      try {
        const proto = await load(selected);
        if (generation !== attempt) return false;
        if (!authorized()) { revoke(); return false; }
        actor = spawn(proto, selected); isolateResources(actor.root);
        actor.root.updateMatrixWorld(true);
        actor.root.traverse(object => { if (object.isSkinnedMesh) object.skeleton.update(); });
        const box = new THREE.Box3().setFromObject(actor.root, true), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
        if (![...box.min, ...box.max].every(Number.isFinite) || size.y <= .00001) throw new Error('Pet geometry bounds are invalid');
        actor.root.position.x -= center.x; actor.root.position.y -= box.min.y; actor.root.position.z -= center.z;
        const horizontal = Math.hypot(size.x, size.z) / 2;
        radius = Math.hypot(horizontal, size.y / 2); targetY = size.y / 2;
        pedestal.scale.set(Math.max(.2, horizontal * 1.2), 1, Math.max(.2, horizontal * 1.2));
        // BUN's native curious idle is a one-shot in gameplay; repeat the same clip while inspecting it.
        actor.mixer?.addEventListener('finished', ({ action }) => action.reset().play());
        pivot.add(actor.root); fit(); status = 'ready'; return true;
      } catch {
        if (generation === attempt) { remove(); status = 'unavailable'; }
        return false;
      }
    },
    draw(dt) {
      if (status === 'disposed') return;
      if (selected && !authorized()) revoke();
      const nextWidth = Math.max(1, canvas.clientWidth || canvas.width || 1), nextHeight = Math.max(1, canvas.clientHeight || canvas.height || 1);
      if (width !== nextWidth || height !== nextHeight) {
        width = nextWidth; height = nextHeight; renderer.setSize(width, height, false); camera.aspect = width / height; fit();
      }
      if (actor) {
        try { if (Number.isFinite(dt) && dt > 0) actor.update(Math.min(dt, .1), false, 'love'); }
        catch { remove(); status = 'unavailable'; }
      }
      pivot.rotation.y = yaw; renderer.render(scene, camera);
    },
    rotate(delta) { if (status !== 'disposed' && Number.isFinite(delta)) yaw = (yaw + delta) % (Math.PI * 2); },
    resetRotation() { yaw = 0; },
    dispose() {
      if (status === 'disposed') return;
      generation++; selected = null; remove(); status = 'disposed';
      disposeActor(pedestal); scene.clear(); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
