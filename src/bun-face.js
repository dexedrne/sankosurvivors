import * as THREE from 'three';

function facePart(mesh, material) {
  const part = /^eyes(?:\.|$)/i.test(material.name) ? 'eyes' : /^mouth(?:\.|$)/i.test(material.name) ? 'mouth' : null;
  if (!part || !('map' in material)) return null;
  const uv = mesh.geometry.getAttribute('uv'), count = part === 'eyes' ? 26 : 9;
  if (!uv || uv.count !== count || mesh.geometry.getAttribute('position')?.count !== count) return null;
  const range = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < uv.count; i++) {
    range[0] = Math.min(range[0], uv.getX(i)); range[1] = Math.min(range[1], uv.getY(i));
    range[2] = Math.max(range[2], uv.getX(i)); range[3] = Math.max(range[3], uv.getY(i));
  }
  // Native face-v1 UV guards preserve special heads with baked or custom faces.
  const expected = part === 'eyes' ? [.55386, .05878, .82432, .94057] : [0, 0, .98257, 1];
  return range.every((value, i) => Math.abs(value - expected[i]) < .002) ? part : null;
}

export function createBunFace(root, sources) {
  const textures = {}, entries = [], meshes = [];
  const ready = ['eyesHappy', 'eyesSad', 'mouthHappy', 'mouthSad', 'mouthAngry', 'mouthLove'].every(key => sources?.[key]?.isTexture);
  if (ready) root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const original = mesh.material;
    const copies = [].concat(original).map(material => {
      const part = facePart(mesh, material);
      if (!part) return material;
      const copy = material.clone();
      entries.push({ material: copy, map: copy.map, color: copy.color?.clone(), part });
      return copy;
    });
    if (copies.some((material, i) => material !== [].concat(original)[i])) {
      const installed = Array.isArray(original) ? copies : copies[0];
      meshes.push({ mesh, original, installed }); mesh.material = installed;
    }
  });
  if (entries.length) for (const [key, source] of Object.entries(sources)) {
    const texture = source.clone();
    texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = true;
    texture.offset.set(0, 0); texture.repeat.set(1, 1); texture.center.set(.5, .5);
    texture.rotation = key.startsWith('mouth') ? Math.PI : 0; texture.needsUpdate = true;
    textures[key] = texture;
  }
  let disposed = false;
  return {
    setExpression(expression) {
      if (disposed) return;
      for (const entry of entries) {
        let map = entry.map;
        if (entry.part === 'eyes') {
          if (['happy', 'angry', 'love', 'sleepy'].includes(expression)) map = textures.eyesHappy;
          else if (expression === 'sad' || expression === 'sing') map = textures.eyesSad;
        } else if (expression === 'happy') map = textures.mouthHappy;
        else if (expression === 'sad') map = textures.mouthSad;
        else if (expression === 'angry') map = textures.mouthAngry;
        else if (expression === 'love' || expression === 'sing') map = textures.mouthLove;
        if (entry.material.color && entry.color) {
          if (map === entry.map) entry.material.color.copy(entry.color);
          else entry.material.color.set(0xffffff);
        }
        if (entry.material.map !== map) { entry.material.map = map; entry.material.needsUpdate = true; }
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { mesh, original, installed } of meshes) if (mesh.material === installed) mesh.material = original;
      for (const { material } of entries) material.dispose();
      for (const texture of Object.values(textures)) texture.dispose();
    },
  };
}
