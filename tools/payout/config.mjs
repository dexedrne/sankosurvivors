import { readFile, stat } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { decimal, COLLECT } from './core.mjs';
import { addressOf, decryptKeystore } from './crypto.mjs';
export const DEFAULT_ENV = join(homedir(),'.config/sankosurvivors/payout.env');
export function parseConfig(env) {
  for (const k of ['SUPABASE_URL','SUPABASE_KEY','REPORTS_KEY','PAYOUT_KEY','TG_BOT_TOKEN','TG_CHAT_ID']) if (!env[k]) throw new Error('missing required configuration');
  const url = new URL(env.SUPABASE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('invalid database URL');
  if (env.PAYOUT_LIVE && !['0','1'].includes(env.PAYOUT_LIVE)) throw new Error('PAYOUT_LIVE must be 0 or 1');
  // security pass 3: the entry wallet's key is read only from the encrypted keystore on the owner's laptop, never raw
  if (env.WALLET_PRIVATE_KEY) throw new Error('the raw wallet key is not accepted: use KEYSTORE_PATH and KEYSTORE_PASSPHRASE_FILE');
  if (!!env.KEYSTORE_PATH !== !!env.KEYSTORE_PASSPHRASE_FILE) throw new Error('incomplete keystore configuration');
  const live = env.PAYOUT_LIVE === '1';
  if (live && !env.KEYSTORE_PATH) throw new Error('live mode requires a key');
  return { url:url.origin, supabaseKey:env.SUPABASE_KEY, reportsKey:env.REPORTS_KEY, payoutKey:env.PAYOUT_KEY,
    telegramToken:env.TG_BOT_TOKEN, telegramChat:env.TG_CHAT_ID, live, wallet:COLLECT,
    weekCap:decimal(env.WEEK_DMT_CAP ?? '1000'), transferCap:decimal(env.TRANSFER_DMT_CAP ?? '500'),
    ethCap:decimal(env.ETH_RUN_CAP ?? '0.005'), maxFee:decimal(env.MAX_FEE_GWEI ?? '2')/10n**9n,
    keystore:env.KEYSTORE_PATH, passphraseFile:env.KEYSTORE_PASSPHRASE_FILE };
}
async function secretFile(path) {
  const info = await stat(path);
  if (!info.isFile() || (info.mode & 0o077)) throw new Error('secret file must have mode 600');
  return readFile(path,'utf8');
}
export async function loadConfig(path = DEFAULT_ENV) { return parseConfig(parseEnv(await secretFile(path))); }
export async function loadWallet(config) {
  const key = decryptKeystore(JSON.parse(await secretFile(config.keystore)), (await secretFile(config.passphraseFile)).replace(/\r?\n$/, ''));
  if (addressOf(key) !== COLLECT) throw new Error('private key does not belong to the entry wallet');
  return key;
}
