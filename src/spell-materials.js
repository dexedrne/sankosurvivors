import { AdditiveBlending } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { color, mix, normalLocal, uniform, uv } from 'three/tsl';

// SankoQuest module374567, public chunk dc560396 (3-Nov capture): original TSL graphs.
export function createSpellMaterials() {
  const clock = uniform(0), head = new MeshBasicNodeMaterial({ toneMapped: false }), glows = new Map();
  head.colorNode = normalLocal.y.mul(.18).add(.82);
  function glow(col, tier) {
    const key = `${col}:${tier}`;
    if (!glows.has(key)) {
      const m = new MeshBasicNodeMaterial({ color: col, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
      const r = uv().sub(.5).abs().mul(2);
      m.colorNode = color(col);
      m.opacityNode = r.x.add(r.y).oneMinus().max(0).pow(2).mul(.45);
      if (tier === 'blast') {
        const t = uv().sub(.5).mul(2).length(), a = t.oneMinus().max(0).pow(2);
        const pulse = clock.mul(6).sin().mul(.035).add(.58);
        const ring = t.sub(pulse).abs().mul(16).oneMinus().max(0);
        m.colorNode = mix(color(col), color(0xfff4dc), a.pow(3).mul(.55));
        m.opacityNode = a.mul(.6).add(ring.mul(.3));
      }
      glows.set(key, m);
    }
    return glows.get(key);
  }
  return { head, glow, clock, glows };
}
