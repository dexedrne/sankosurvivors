// Parsed JSON is data: never invoke object coercion while reading a save.
export const numberValue = value => value === null || ['number', 'string', 'boolean'].includes(typeof value) ? Number(value) : NaN;
export const finiteNumber = value => { const n = numberValue(value); return Number.isFinite(n) ? n : 0; };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const numeric = value => Number.isFinite(numberValue(value));
const counter = key => ['kills', 'bosses', 'bestTime', 'evolves', 'caskets', 'cleared', 'dragons'].includes(key) || key.startsWith('kills.');
const validBest = value => record(value) && typeof value.t === 'number' && Number.isFinite(value.t) && value.t >= 0;
export function profileBest(value) {
  if (!validBest(value)) return null;
  // Match betterRun's strict kills/won semantics; level is only a display label.
  return { ...value, level: finiteNumber(value.level), kills: Number.isFinite(value.kills) ? value.kills : 0, won: value.won === true };
}
export function profileValue(key, value, fallback) {
  switch (key) {
    case 'sq-coins': return finiteNumber(value);
    case 'sq-name': return value === null ? '' : ['string', 'boolean', 'number'].includes(typeof value) && (typeof value !== 'number' || Number.isFinite(value)) ? String(value) : '';
    case 'sq-cleared': case 'sq-quests': case 'sq-bank': return Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
    case 'sq-skills': case 'sq-gearlv': return Object.fromEntries(Object.entries(record(value) ? value : {}).map(([k, v]) => [k, finiteNumber(v)]));
    case 'sq-stats': return Object.fromEntries(Object.entries(record(value) ? value : {}).map(([k, v]) => [k, counter(k) ? finiteNumber(v) : v]));
    case 'sq-gear': return record(value) ? value : {};
    case 'sq-bests': return Object.fromEntries(Object.entries(record(value) ? value : {}).map(([k, v]) => [k, record(v) && Object.hasOwn(v, 't') && !validProfileValue('sq-best', v) ? profileBest(v) : v]));
    case 'sq-best': return profileBest(value);
    default: return value ?? fallback;
  }
}
export function validProfileValue(key, value) {
  switch (key) {
    case 'sq-coins': return numeric(value);
    case 'sq-armoury': return value === null || record(value) && value.v === 1 && Number.isSafeInteger(value.rev) && value.rev >= 0 && Object.keys(value).every(k => ['v','rev','paid','legacy','levels'].includes(k)) && Number.isSafeInteger(value.paid) && value.paid >= 0 && Number.isSafeInteger(value.legacy) && value.legacy >= 0 && value.legacy <= value.paid && record(value.levels) && Object.values(value.levels).every(v => Number.isInteger(v) && v >= 1 && v <= 3);
    case 'sq-name': return value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value);
    case 'sq-cleared': case 'sq-quests': case 'sq-bank': return Array.isArray(value) && value.every(v => typeof v === 'string');
    case 'sq-skills': case 'sq-gearlv': return record(value) && Object.values(value).every(numeric);
    case 'sq-stats': return record(value) && Object.entries(value).every(([k, v]) => !counter(k) || numeric(v));
    case 'sq-gear': return record(value);
    case 'sq-best': return value === null || validBest(value) && ['level', 'kills'].every(k => !Object.hasOwn(value, k) || numeric(value[k])) && (!Object.hasOwn(value, 'won') || typeof value.won === 'boolean');
    case 'sq-bests': return record(value) && Object.values(value).every(v => !record(v) || !Object.hasOwn(v, 't') || validProfileValue('sq-best', v));
    default: return true; // Preferences keep their existing consumer-specific fallback policies.
  }
}
