import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createCharacterKit } from '../../src/character.js';

const assets = new URL('../../public/assets/', import.meta.url);
export const boneState = scene => {
  const out = [];
  scene.traverse(o => { if (o.isBone) out.push([o.name, ...o.position.toArray(), ...o.quaternion.toArray(), ...o.scale.toArray()]); });
  return out;
};
// Only the reference rig is needed; its compressed mesh never participates in fitting.
function rigFrom(json) {
  const joints = new Set(json.skins.flatMap(s => s.joints));
  const nodes = json.nodes.map((n, i) => {
    const o = joints.has(i) ? new THREE.Bone() : new THREE.Object3D(); o.name = n.name || '';
    if (n.matrix) new THREE.Matrix4().fromArray(n.matrix).decompose(o.position, o.quaternion, o.scale);
    else {
      if (n.translation) o.position.fromArray(n.translation);
      if (n.rotation) o.quaternion.fromArray(n.rotation);
      if (n.scale) o.scale.fromArray(n.scale);
    }
    return o;
  });
  json.nodes.forEach((n, i) => { for (const child of n.children || []) nodes[i].add(nodes[child]); });
  const scene = new THREE.Group();
  for (const i of json.scenes[json.scene || 0].nodes) scene.add(nodes[i]);
  return { scene };
}
export async function nativeAnimationFixture() {
  const bytes = await readFile(new URL('models/mobs/sankson/sankson.glb', assets));
  const size = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + size));
  // Inspect native geometry without browser-only textures; files stay unchanged.
  delete json.images; delete json.textures; delete json.materials;
  for (const mesh of json.meshes || []) for (const primitive of mesh.primitives) delete primitive.material;
  const encoded = Buffer.from(JSON.stringify(json)), padded = Buffer.alloc((encoded.length + 3) & ~3, 32); encoded.copy(padded);
  const bin = bytes.subarray(20 + size), out = Buffer.alloc(20 + padded.length + bin.length);
  bytes.subarray(0, 12).copy(out); out.writeUInt32LE(out.length, 8); out.writeUInt32LE(padded.length, 12); out.writeUInt32LE(0x4e4f534a, 16); padded.copy(out, 20); bin.copy(out, 20 + padded.length);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(out.buffer, '');
  const masterBytes = await readFile(new URL('models/playerCharacter/Chest/Styles/Shoulders.glb', assets));
  const master = rigFrom(JSON.parse(masterBytes.subarray(20, 20 + masterBytes.readUInt32LE(12))));
  const oldLoad = FBXLoader.prototype.loadAsync, oldWindow = globalThis.window, clips = new Map();
  globalThis.window = { innerWidth: 1, innerHeight: 1 };
  FBXLoader.prototype.loadAsync = async function(url) {
    const b = await readFile(new URL(url, assets)), o = this.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
    clips.set(url.split('/').at(-1).split('.')[0], o.animations[0]); return o;
  };
  try {
    const kit = await createCharacterKit(async url => { if (url.includes('Chest/Styles/Shoulders')) return master; throw Error('unused modular mesh'); }, path => path);
    return { kit, gltf, master, clips };
  } finally {
    FBXLoader.prototype.loadAsync = oldLoad;
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
  }
}

export function kneeBends(actor, frames = 120) {
  const bones = new Map(); actor.root.traverse(o => { if (o.isBone) bones.set(o.name, o); });
  const position = name => bones.get('mixamorig_' + name).getWorldPosition(new THREE.Vector3());
  const forward = new THREE.Vector3(Math.sin(actor.kit.yaw0), 0, Math.cos(actor.kit.yaw0));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward), out = { Left: [], Right: [] };
  const duration = actor.mixer._actions[0].getClip().duration;
  for (let i = 0; i < frames; i++) {
    actor.mixer.setTime(duration * i / frames); actor.root.updateMatrixWorld(true);
    for (const side of ['Left', 'Right']) {
      const hip = position(side + 'UpLeg'), knee = position(side + 'Leg'), foot = position(side + 'Foot');
      const u = knee.sub(hip).normalize(), v = foot.sub(position(side + 'Leg')).normalize();
      out[side].push(Math.atan2(u.clone().cross(v).dot(right), u.dot(v)) * 180 / Math.PI);
    }
  }
  return out;
}
