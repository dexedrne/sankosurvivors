// Progress only: wallet credentials and ranked tickets never enter this journal.
export const TRANSFER_KEYS = ['sq-coins', 'sq-name', 'sq-gear', 'sq-gearlv', 'sq-bank', 'sq-best', 'sq-bests', 'sq-stats', 'sq-settings', 'sq-skills', 'sq-quests', 'sq-cleared', 'sq-map', 'sq-adv', 'sq-autoalch', 'sq-roofs', 'sq-muted', 'sq-vol', 'sq-seen'];
export const IMPORT_BACKUP_KEY = 'sq-import-backup-v1';
const object = value => value && typeof value === 'object' && !Array.isArray(value);

export function recoverProgressImport(storage) {
  const raw = storage.getItem(IMPORT_BACKUP_KEY);
  if (raw === null) return false;
  try {
    const record = JSON.parse(raw), before = record?.before;
    if (record?.v !== 1 || !object(before) || !Object.keys(before).length || Object.entries(before).some(([key, value]) => !TRANSFER_KEYS.includes(key) || value !== null && typeof value !== 'string')) throw Error();
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

export function importProgress(storage, data) {
  recoverProgressImport(storage);
  if (!object(data) || !Object.keys(data).length || Object.entries(data).some(([key, value]) => !TRANSFER_KEYS.includes(key) || typeof value !== 'string' || value.length > 20000)) throw Error('Invalid progress.');
  const before = Object.fromEntries(Object.keys(data).map(key => [key, storage.getItem(key)]));
  storage.setItem(IMPORT_BACKUP_KEY, JSON.stringify({ v: 1, before }));
  try {
    for (const [key, value] of Object.entries(data)) storage.setItem(key, value);
    storage.removeItem(IMPORT_BACKUP_KEY);
  } catch (error) {
    try { recoverProgressImport(storage); }
    catch (recovery) { recovery.recovery = true; throw recovery; }
    throw error;
  }
}
