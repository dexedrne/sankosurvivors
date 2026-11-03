#!/usr/bin/env node
// Prove the laptop keystore unlocks the entry wallet, before the raw key is removed from anywhere else.
// Prints only the address the keystore decrypts to (never the key): node tools/payout/check-keystore.mjs
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { decryptKeystore, addressOf } from './crypto.mjs';
import { COLLECT } from './core.mjs';
const store = JSON.parse(readFileSync(join(homedir(), 'Documents/sankosurvivors/ranked-wallet-keystore.json'), 'utf8'));
const pass = readFileSync(join(homedir(), '.config/sankosurvivors/ranked-wallet.passphrase'), 'utf8').replace(/\r?\n$/, '');
const got = addressOf(decryptKeystore(store, pass));
console.log(got === COLLECT ? `OK: the keystore unlocks the entry wallet ${got}` : `MISMATCH: the keystore unlocks ${got}, not the entry wallet ${COLLECT}`);
