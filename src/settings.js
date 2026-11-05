const CHOICES = {
  quality: ['auto', 'low', 'medium', 'high'], res: ['auto', '0.5', '0.75', '1', '2'], fps: ['30', '60', 'max'],
  shadowq: ['auto', 'low', 'medium', 'high'], view: ['near', 'normal', 'far', 'max'], time: ['day', 'dusk', 'night'],
  roofs: ['off', 'auto'], fx: ['full', 'reduced'],
};
const FLAGS = ['shadows', 'bloom', 'dof', 'ao', 'grade', 'rain', 'foliage', 'shake', 'aa', 'water', 'numbers'];

export function cleanSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    if (Object.hasOwn(CHOICES, key) && CHOICES[key].includes(v) || FLAGS.includes(key) && typeof v === 'boolean') out[key] = v;
  }
  return out;
}
