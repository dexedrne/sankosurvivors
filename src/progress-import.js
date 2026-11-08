// Progress only: wallet credentials and ranked tickets never enter this journal.
import { validProfileValue } from './progress-values.js';
export const TRANSFER_KEYS = ['sq-coins', 'sq-name', 'sq-gear', 'sq-gearlv', 'sq-armoury', 'sq-bank', 'sq-best', 'sq-bests', 'sq-stats', 'sq-settings', 'sq-skills', 'sq-quests', 'sq-cleared', 'sq-map', 'sq-adv', 'sq-autoalch', 'sq-roofs', 'sq-muted', 'sq-vol', 'sq-seen'];
export const IMPORT_BACKUP_KEY = 'sq-import-backup-v1';
export const RUN_SAVE_KEY = 'sq-run-save-v1';
export const RUN_REWARD_KEYS = ['sq-best', 'sq-bests', 'sq-cleared', 'sq-coins', 'sq-bank', 'sq-stats', 'sq-quests'];
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const runError = () => Object.assign(new Error('Run rewards must finish saving before playing.'), { recovery: true, runRecovery: true });
function runData(data) {
  if (!object(data) || !Object.keys(data).length || Object.entries(data).some(([key, value]) => !RUN_REWARD_KEYS.includes(key) || typeof value !== 'string' || !validProfileValue(key, JSON.parse(value)))) throw runError();
  return data;
}
function runRecord(raw) {
  const record = JSON.parse(raw);
  if (!object(record) || record.v !== 1) throw runError();
  return runData(record.data);
}
export function recoverRunProgress(storage) {
  try {
    const raw = storage.getItem(RUN_SAVE_KEY); if (raw === null) return false;
    const data = runRecord(raw);
    if (storage.getItem(IMPORT_BACKUP_KEY) !== null) throw runError();
    for (const [key, value] of Object.entries(data)) storage.setItem(key, value);
    storage.removeItem(RUN_SAVE_KEY);
    return true;
  } catch { throw runError(); }
}
export function saveRunProgress(storage, values) {
  try {
    const data = runData(values);
    if (storage.getItem(IMPORT_BACKUP_KEY) !== null) throw runError();
    const pending = storage.getItem(RUN_SAVE_KEY);
    if (pending !== null) {
      const previous = runRecord(pending);
      if (Object.keys(previous).length !== Object.keys(data).length || Object.keys(data).some(key => previous[key] !== data[key])) throw runError();
      recoverRunProgress(storage); return;
    }
    // Reserve the final absolute values first; retries never add the same reward twice.
    storage.setItem(RUN_SAVE_KEY, JSON.stringify({ v: 1, data }));
    for (const [key, value] of Object.entries(data)) storage.setItem(key, value);
    storage.removeItem(RUN_SAVE_KEY);
  } catch { throw runError(); }
}

export function recoverProgressImport(storage) {
  if (storage.getItem(RUN_SAVE_KEY) !== null) throw runError();
  const raw = storage.getItem(IMPORT_BACKUP_KEY);
  if (raw === null) return false;
  try {
    const record = JSON.parse(raw), before = record?.before;
    if (record?.v !== 1 || !object(before) || !Object.keys(before).length || Object.entries(before).some(([key, value]) => !TRANSFER_KEYS.includes(key) || value !== null && typeof value !== 'string')) throw Error();
    if (record.cloud === true) for (const key of ['sq-cloud', 'sq-cloud-base', 'sq-cloud-upload']) storage.removeItem(key);
    // Free imported space first; keep the journal until every original value is restored.
    for (const key of Object.keys(before)) storage.removeItem(key);
    for (const [key, value] of Object.entries(before)) if (value !== null) storage.setItem(key, value);
    storage.removeItem(IMPORT_BACKUP_KEY);
    return true;
  } catch {
    const error = new Error('Progress recovery is required before playing.');
    error.recovery = true;
    throw error;
  }
}

export function importProgress(storage, data, cloudCommit = null) {
  if (storage.getItem(RUN_SAVE_KEY) !== null) throw runError();
  recoverProgressImport(storage);
  if (!object(data) || !Object.keys(data).length || Object.entries(data).some(([key, value]) => !TRANSFER_KEYS.includes(key) || !(cloudCommit && value === null) && (typeof value !== 'string' || !cloudCommit && value.length > 20000))) throw Error('Invalid progress.');
  const before = Object.fromEntries(Object.keys(data).map(key => [key, storage.getItem(key)]));
  const record = { v: 1, before };
  if (cloudCommit) record.cloud = true;
  storage.setItem(IMPORT_BACKUP_KEY, JSON.stringify(record));
  try {
    // Old v1 recovery is safe too: any interrupted cloud mutation leaves its session off.
    if (cloudCommit) storage.removeItem('sq-cloud');
    for (const [key, value] of Object.entries(data)) { if (value === null) storage.removeItem(key); else storage.setItem(key, value); }
    cloudCommit?.();
    storage.removeItem(IMPORT_BACKUP_KEY);
  } catch (error) {
    try { recoverProgressImport(storage); }
    catch (recovery) { recovery.recovery = true; throw recovery; }
    throw error;
  }
}
