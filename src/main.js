import { RunRecorder, RANKED, kpm, kpmMicro, kpmWeek, prizePlaces as racePlaces, placeable } from './ranked.js';
import { rankedStep, rankedChoice, resumeRankedAsync } from './ranked-play.js';
import { rankedApi, payEntry, recoverPayment, clearUnsentPayment, readRanked, writeRanked } from './ranked-client.js';
import { createRenderer } from './render.js';
import { asset, pickAssetHost } from './assets.js';
import { createSim, step, snapshot, choose, spawnEnemy, findWalkable, reroll, skipLevel, playerStats, openCasket, autoChoice, BELT_SIZE, TICK, SHRINES } from './sim.js';
import { createAudio } from './audio.js';
import { CHANGELOG, LATEST } from './changelog.js';
import { dmtText, poolReadout, prizeEstimate, prizeNotes } from './prize-display.js';
import { initI18n, translateText } from './i18n.js';
import { CREATOR, TIP_ETH, NO_PRIZE } from './config.js';
const noPrize = (w) => NO_PRIZE.includes(String(w || '').toLowerCase());
// prize place of each board row: the developer's wallet and (from week 1) runs under 3:00 take none, the places pass down
const prizePlaces = (rows, week) => racePlaces(rows, week, noPrize);
import { wallets, watchWallets, takeWalletHandoff, savedPass, forget, prove, short, walletAppLinks, isPhone, walletModalOpen, walletConnectState, watchWalletConnect, cancelWalletConnect, dismissWalletConnect, why, DMT_COIN_BONUS } from './dmt.js';
import { createCloud, betterRun, SAVE_KEYS as CLOUD_KEYS } from './cloud.js';
import { TRANSFER_KEYS as XFER_KEYS, IMPORT_BACKUP_KEY, importProgress, recoverProgressImport } from './progress-import.js';
import { quoteDmt, buyDmt } from './swap.js';
import { walletConnectLinks } from './wallet-connect.js';
import { connect as requestWallet, disconnect as walletDisconnect, restore as walletRestore, current as walletNow, walletRevision, onWallet, balances, fmtDmt, fmtEth, GET_DMT, BRIDGE, arbiscanTx, arbiscanAddress, ETH_FOR_GAS } from './wallet.js';
import {
  MAPS, MAP_BY_ID, ADVENTURERS, ADVENTURER_BY_ID, ENEMIES, WEAPONS, PASSIVES, EVOLUTIONS, SKILLS, SKILL_IDS, clampSkills, skillCost,
  weaponItem, weaponTitle, weaponDisplay, passiveItem, passiveTitle, itemIconFile,
  GEAR, GEAR_SLOTS, GEAR_SLOT_NAMES, GEAR_SETS, GEAR_MAX_LV, gearUpgradeCost, smithNext, smithPrev, gearBonus, bonusText, QUESTS, deltaText, gearRarity, alchValue, ARMOR_TIERS,
  gearGroups, isWeaponItem, WEAPON_ITEMS, weaponItemText, weaponItemLabel, weaponStep, CARD_RARITIES, CARD_RARITY_NAMES, CARD_HEAL,
} from './content.js';

const $ = (id) => document.getElementById(id);
const walletHandoff = takeWalletHandoff();
if (walletHandoff?.language) { try { localStorage.setItem('sq-language', walletHandoff.language); } catch { /* private mode */ } }
initI18n();
if (walletHandoff?.language && document.documentElement.lang !== walletHandoff.language) {
  const control = document.querySelector('[data-language]');
  if (control) { control.value = walletHandoff.language; control.dispatchEvent(new Event('change')); }
}
const BASE = import.meta.env.BASE_URL || './';
const params = new URLSearchParams(location.search);
const compactMenu = matchMedia('(max-width:760px), (max-width:1180px) and (max-height:500px)');
for (const id of ['adventurerpick', 'mappick']) $(id).open = !compactMenu.matches;
const PLAYER = 'p1';

let sim = null, renderer = null, mode = 'title', acc = 0, last = 0, frame = 0, selCard = 0;
const keys = new Set();
const audio = createAudio();
const p2 = (n) => String(Math.floor(n)).padStart(2, '0');
const fmtT = (t) => (t >= 3600 ? `${Math.floor(t / 3600)}:${p2((t % 3600) / 60)}:${p2(t % 60)}` : `${Math.floor(t / 60)}:${p2(t % 60)}`); // 2:00:00 past an hour
// A boss's own name (screen only; the sim and ranked replays never see it): SankoQuest's ogre is Fudna the Hoard Keeper.
const BOSS_TITLES = { '*': { ogre: 'Fudna the Hoard Keeper', sankson: 'Survival Sankson' } }; // '*': every map
const titled = (map, type) => BOSS_TITLES[map && map.id]?.[type] || BOSS_TITLES['*'][type];
const bossName = (map, type) => titled(map, type) || ENEMIES[type].name;
const slayName = (map, type) => titled(map, type) || `the ${ENEMIES[type].name}`;

// A previous import must be restored before any startup code can change or upload progress.
let pendingImport = false;
try { pendingImport = localStorage.getItem(IMPORT_BACKUP_KEY) !== null; } catch { /* storage blocked */ }
if (pendingImport) { showProgressRecovery(); throw Error('Progress recovery is required before playing.'); }

// ---- saved progress ------------------------------------------------------------------------------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
// one time: clear the worn loadout that casket gear used to carry over by itself (the collection and levels are kept)
try { if (!localStorage.getItem('sq-gear-reset1')) { localStorage.setItem('sq-gear', '{}'); localStorage.setItem('sq-gear-reset1', '1'); } } catch { /* storage blocked */ }
let onSaved = null; // the cloud save hears about every progress change (set up with the wallet below)
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } if (onSaved) onSaved(k); };
const clearedMaps = () => new Set(load('sq-cleared', []));
const getCoins = () => Number(load('sq-coins', 0)) || 0;
const clampLv = (o, max) => { const out = {}; if (o && typeof o === 'object' && !Array.isArray(o)) for (const k of Object.keys(o)) out[k] = Math.max(0, Math.min(max, Math.floor(Number(o[k])) || 0)); return out; }; // saved levels can be edited or arrive in a #carry= link: never trust them as numbers
const getSkills = () => clampSkills(load('sq-skills', {}));
let selMap = load('sq-map', 'greentown'); if (!MAP_BY_ID[selMap]) selMap = 'greentown';
let selAdv = load('sq-adv', 'adventurer'); if (!ADVENTURER_BY_ID[selAdv]) selAdv = 'adventurer';
let loadedMapId = 'greentown', mapLoading = false, hardOn = false, endlessOn = false;
// gear you own (from caskets and quests) and what you wear; lifetime stats that quests read
const getBank = () => { const b = load('sq-bank', []); return Array.isArray(b) ? b.filter((n) => typeof n === 'string' && Object.hasOwn(GEAR, n)) : []; }; // old saves: unknown names are ignored
const getGear = () => { const raw = load('sq-gear', {}), g = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}, bank = new Set(getBank()); for (const k of Object.keys(g)) if (!GEAR_SLOTS.includes(k) || !bank.has(g[k]) || !Object.hasOwn(GEAR, g[k]) || GEAR[g[k]].slot !== k) delete g[k]; return g; };
const getStats = () => load('sq-stats', {});
const getGearLv = () => clampLv(load('sq-gearlv', {}), GEAR_MAX_LV);
const questsDone = () => new Set(load('sq-quests', []));
const statVal = (st, key) => st[key] || 0;
// a new item goes to the bank; a duplicate is sold for coins (unless it was already high alched in the run: sell = false)
function bankItem(name, sell = true) { if (!Object.hasOwn(GEAR, name)) return false; const raw = load('sq-bank', []), b = Array.isArray(raw) ? raw : []; if (b.includes(name)) { if (sell) save('sq-coins', getCoins() + 25); return false; } b.push(name); save('sq-bank', b); return true; }
const autoAlchOn = () => load('sq-autoalch', true) !== false; // Settings: auto high alch caskets that are not better (on by default: duplicates kept popping a card)
// special maps (Tutorial Island) are open from the start and sit outside the campaign chain
const unlockedMap = (i) => params.has('unlock') || i === 0 || !!MAPS[i].special || clearedMaps().has(MAPS[i].after || MAPS[i - 1].id);
const unlockedAdv = (a) => params.has('unlock') || a.unlock <= clearedMaps().size;
// some maps fix who you play (Tutorial Island: Alex)
const runAdv = () => ADVENTURER_BY_ID[(MAP_BY_ID[selMap] && MAP_BY_ID[selMap].forceAdv) || selAdv];

// ---- icons: real SankoQuest item icons -----------------------------------------------------------------
const EMOJI = { curse: '🎃', baseball: '⚾', lighter: '🔥', area: '🧥', amount: '🪶', crit: '🍄', thorns: '🦂', greed: '🗝️', greatsword: '⚔️', shortsword: '🗡️', katana: '🗡️', axe: '🪓', pickaxe: '⛏️', shield: '🛡️', bow: '🏹', staff: '🪄', might: '💪', haste: '💨', vigor: '❤️', boots: '👢', magnet: '🧲', armor: '🛡️', growth: '📖', fish: '🐟' };
// upgrade icons are fetched a step ahead, so level-up cards never show up blank
const iconsAsked = new Set();
function preloadIcons(names) { for (const n of names) { if (!n || iconsAsked.has(n)) continue; iconsAsked.add(n); const im = new Image(); im.src = `${asset('')}ui/items/${itemIconFile(n)}`; } }
const preloadNextIcons = (p) => { if (!p) return; const out = []; for (const [w, l] of Object.entries(p.weapons || {})) out.push(weaponItem(w, l + 1), weaponItem(w, l + 2)); for (const [k, l] of Object.entries(p.passives || {})) out.push(passiveItem(k, l + 1)); preloadIcons(out); };
// a weapon's metal in this run (pace 2; null on pace 1, where weapons look like their level)
const stepOf = (id, p = sim && sim.players[0]) => (sim && sim.pace >= 2 && p ? weaponStep(id, p.wm || {}) : null);
const imgTag = (name, fallback = '✦') => `<img src="${asset('')}ui/items/${itemIconFile(name)}" alt="${name}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji',textContent:'${fallback}'}))">`;
// step: the weapon's metal on pace 2 (weaponStep), null on pace 1 (the level's look)
function iconHTML(kind, id, level, evo, step = null) {
  if (kind === 'weapon') return imgTag(weaponDisplay(id, level || 1, evo, step).item, EMOJI[id]);
  if (kind === 'passive') return imgTag(passiveItem(id, level || 1), EMOJI[id]);
  return imgTag(id);
}

// ---- title screen --------------------------------------------------------------------------------------------
// best runs kept per map and mode (hard, endless): the title screen shows the one for what you have picked
const bestKey = (s) => `${s.map.id}:${s.hard ? 'h' : 'n'}:${s.endless ? 'e' : 'r'}`;
const getBests = () => { const b = load('sq-bests', {}); return b && typeof b === 'object' && !Array.isArray(b) ? b : {}; };
function showBest() {
  const map = MAP_BY_ID[selMap], mb = map && getBests()[bestKey({ map, hard: hardOn, endless: endlessOn })], b = mb || load('sq-best', null);
  const what = mb ? `Best on ${map.name}${hardOn ? ' (hard)' : ''}${endlessOn ? ' (endless)' : ''}` : 'Best run';
  $('best').textContent = b ? `${what}: ${fmtT(b.t)} · level ${b.level} · ${b.kills} slain${b.won ? ' · victory' : ''}` : '';
  $('coins').textContent = getCoins(); $('coins2').textContent = getCoins();
}
// a label whose longest word is wider than its button shrinks until it fits ("Adventurer", "Swordsman")
function fitLabels(root) {
  const run = () => { for (const el of root.querySelectorAll('.nm')) { el.style.fontSize = ''; let px = parseFloat(getComputedStyle(el).fontSize) || 16; while (el.scrollWidth > el.clientWidth + 0.5 && px > 9) { px -= 1; el.style.fontSize = px + 'px'; } } };
  run(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
}
addEventListener('resize', () => { const ap = document.getElementById('apick'); if (ap) fitLabels(ap); });
function buildAdventurers() {
  $('apick').innerHTML = ADVENTURERS.filter((a) => !a.special).map((a) => {
    const open = unlockedAdv(a);
    return `<div class="aopt${a.id === selAdv ? ' sel' : ''}${open ? '' : ' locked'}" data-id="${a.id}">${imgTag(weaponItem(a.weapon, 1), EMOJI[a.weapon]).replace('<img ', '<img fetchpriority="high" ')}<span class="nm">${a.name.replace('The ', '')}</span>${open ? '' : '<span class="lock">🔒</span>'}</div>`;
  }).join('');
  fitLabels($('apick'));
  for (const el of $('apick').children) el.onclick = () => {
    const a = ADVENTURER_BY_ID[el.dataset.id];
    if (!unlockedAdv(a)) { $('ainfo').innerHTML = `<b>${a.name}</b> unlocks after you clear ${a.unlock} map${a.unlock > 1 ? 's' : ''} (survive to the end, or beat the final boss). Any map counts: Tutorial Island is the gentlest.`; return; }
    selAdv = a.id; save('sq-adv', a.id); buildAdventurers(); window.__idleSim = null;
  };
  const a = ADVENTURER_BY_ID[selAdv];
  $('adventurerlabel').textContent = a.name;
  const bonus = Object.entries(a.bonus).map(([k, v]) => ({ speed: `+${Math.round(v * 100)}% speed`, armor: `+${v} armor`, magnet: `+${Math.round(v * 100)}% pickup range`, growth: `+${Math.round(v * 100)}% experience`, hp: `+${v} HP`, dmg: `+${Math.round(v * 100)}% damage`, haste: `-${Math.round(v * 100)}% cooldowns` }[k])).join(', ');
  $('ainfo').innerHTML = `<b>${a.name}</b> · starts with ${weaponTitle(a.weapon, 1)}<br>${a.blurb} <span style="opacity:.75">(${bonus})</span>`;
}
function buildMaps() {
  const cl = clearedMaps();
  $('mpick').innerHTML = MAPS.map((m, i) => {
    const open = unlockedMap(i), px = 1.2;
    const bg = m.world ? `background-image:url(${asset('')}world/world-map-full.webp);background-size:cover;background-position:center` : `background-image:url(${asset('')}world/world-map-full.webp);background-size:${512 * px}px;background-position:${-(m.cx * px - 45)}px ${-(m.cz * px - 26)}px`;
    return `<div class="mopt${m.id === selMap ? ' sel' : ''}${open ? '' : ' locked'}" data-id="${m.id}"><div class="thumb" style="${bg}">${open ? '' : '🔒'}${cl.has(m.id) ? '<i>✔</i>' : ''}</div>${m.name}</div>`;
  }).join('');
  for (const el of $('mpick').children) el.onclick = () => {
    if (el.classList.contains('locked')) { const m = MAP_BY_ID[el.dataset.id]; $('mapinfo').textContent = m.after ? `Clear ${MAP_BY_ID[m.after].name} to unlock this one.` : 'Clear the map before it to unlock this one.'; return; }
    pickMap(el.dataset.id);
  };
  const m = MAP_BY_ID[selMap];
  $('maplabel').textContent = m.name;
  $('adventurerlabel').textContent = ADVENTURER_BY_ID[m.forceAdv || selAdv].name;
  $('mapinfo').innerHTML = `<b>${m.name}</b> · ${m.blurb}<br>Final boss: ${bossName(m, m.finalBoss)}`;
  $('apick').classList.toggle('forced', !!m.forceAdv);
  if (m.forceAdv) { const fa = ADVENTURER_BY_ID[m.forceAdv]; $('adventurerlabel').textContent = fa.name; $('ainfo').innerHTML = `On ${m.name} you play as <b>${fa.name}</b>: ${weaponTitle(fa.weapon, 1)}, bronze armour, winged boots and extra health.`; }
  const cleared = cl.has(m.id) || params.has('unlock');
  // always shown (owner 3 Nov: "where is hard mode"): greyed out with how to unlock until the map is cleared
  for (const [w, id] of [['hardwrap', 'hard'], ['endlesswrap', 'endless']]) { $(w).classList.remove('hidden'); $(w).classList.toggle('locked', !cleared); $(id).disabled = !cleared; $(w).title = cleared ? '' : `Clear ${m.name} to unlock`; }
  if (!cleared && (hardOn || endlessOn)) { hardOn = false; $('hard').checked = false; endlessOn = false; $('endless').checked = false; showBest(); }
}
async function pickMap(id) {
  if (mapLoading) return; selMap = id; save('sq-map', id); window.__idleSim = null;
  const map = MAP_BY_ID[id];
  if (loadedMapId !== id) {
    mapLoading = true; $('start').disabled = true; $('loadtext').textContent = `Loading ${map.name}…`;
    try { await renderer.loadMap(map); loadedMapId = id; renderer.reset(); } finally { mapLoading = false; $('start').disabled = false; $('loadtext').textContent = ''; }
  }
  buildMaps(); showBest(); $('tagline').textContent = `${map.name}: ${map.blurb}`; window.__idleSim = null;
}
$('hard').onchange = (e) => { hardOn = e.target.checked; showBest(); };
$('endless').onchange = (e) => { endlessOn = e.target.checked; showBest(); };

// ---- ranked: paid tickets, recovery and the holder-style panel ----
const SIM_ID = import.meta.env.VITE_SIM;
let rankedWeek = null, rankedRun = null, rankedRec = null, rankedBusy = false;
// the race shown in the Ranked panel and the leaderboard: 'normal' or 'hard' (from week 1)
let rankedMode = load('sq-ranked-mode', 'normal') === 'hard' ? 'hard' : 'normal';
const RACE = RANKED.races;
const raceList = (d) => (d && d.races ? ['normal', 'hard'].filter((m) => d.races[m]) : ['normal']);
// one race's numbers from /api/ranked-week (an older server only sends the Normal race, at the top level)
const raceOf = (d, m) => (d && d.races && d.races[m]) || (m === 'normal' && d ? { ...d, mode: 'normal', name: 'Normal', rows: d.rows || [] } : null);
const kpmRules = (d) => !!d && d.rules === 'kpm';
const fmtKpm = (r) => kpm(r.kills, r.t).toFixed(2);
const setRace = (m) => { rankedMode = m === 'hard' ? 'hard' : 'normal'; save('sq-ranked-mode', rankedMode); };
// the week and race a saved run belongs to, from the run ticket itself if an older save lacks them (display data only:
// the server checks the signed ticket)
function liveRace(live) {
  let tk = {};
  try { tk = JSON.parse(atob(String(live.run).split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))) || {}; } catch { /* keep {} */ }
  return { week: Number.isInteger(live.week) ? live.week : tk.w, mode: (live.mode || tk.m) === 'hard' ? 'hard' : 'normal' };
}
const raceBadge = (m) => (m === 'hard' ? ' (Hard)' : '');
let walletBal = null; // the connected wallet's DMT and ETH on Arbitrum, last read
const rankedLive = () => readRanked('sq-ranked-live');
const rankedPlaying = () => !!rankedRun && !!sim && !sim.over;
const rankedMessage = (text) => { $('rankedmsg').textContent = text; };
function persistRanked() {
  if (!rankedRun || !rankedRec) return;
  try { writeRanked('sq-ranked-live', { ...rankedRun, log: rankedRec.log() }); }
  catch { banner('Run could not be saved. Keep this page open.', 5000); }
}
setInterval(() => { if (rankedPlaying()) persistRanked(); }, 3000);
addEventListener('pagehide', persistRanked);
document.addEventListener('visibilitychange', () => { if (rankedPlaying()) persistRanked(); });
$('rankedname').value = load('sq-name', '');
$('rankedadv').innerHTML = ADVENTURERS.filter((a) => !a.special).map((a) => `<option value="${a.id}">${a.name}</option>`).join('');
for (const id of ['rankedname', 'rankedadv']) $(id).addEventListener('keydown', (e) => e.stopPropagation());
$('rankedname').oninput = () => save('sq-name', $('rankedname').value.trim().slice(0, 16));
function renderRanked() {
  const live = rankedLive(), pending = readRanked('sq-ranked-submit');
  $('rankedenter').disabled = rankedBusy || !rankedWeek?.open || !!live || !!readRanked('sq-ranked-payment');
  const ready = $('rankedready'); ready.replaceChildren();
  const button = (text, fn) => { const b = document.createElement('button'); b.textContent = text; b.disabled = rankedBusy; b.onclick = fn; ready.appendChild(b); };
  if (pending || live?.ended) button('Retry ranked submission', () => submitRanked());
  else if (live) button(live.sim === SIM_ID ? 'Resume your ranked run' : 'Game updated: restart your run', () => recoverRankedRun());
  const payment = readRanked('sq-ranked-payment');
  if (payment?.tx) button('Check payment', () => rankedAction(() => recoverPayment(BASE, rankedMessage)));
  else if (payment) {
    const help = document.createElement('p'); help.textContent = 'Check your wallet activity. If the payment was sent, paste its Arbitrum transaction hash to recover it. Do not pay again.';
    const hash = document.createElement('input'); hash.placeholder = 'Arbitrum transaction hash'; hash.setAttribute('aria-label', 'Arbitrum transaction hash'); hash.maxLength = 66; hash.spellcheck = false; hash.autocomplete = 'off';
    ready.append(help, hash);
    button('Recover this payment', () => rankedAction(() => recoverPayment(BASE, rankedMessage, hash.value.trim())));
    button('My wallet shows no payment', () => {
      if (confirm(translateText('Only clear this check if your wallet shows that no payment was sent. A sent payment must be recovered instead.', document.documentElement.lang))) rankedAction(clearUnsentPayment);
    });
  }
  if (!live && rankedWeek) for (const e of readRanked('sq-ranked-entries', []).filter((e) => e.week === rankedWeek.week)) button(`Entry ${e.id}${raceBadge(e.mode)} ready · Start`, () => startRankedEntry(e));
  if (rankedWeek) {
    const races = raceList(rankedWeek); if (!races.includes(rankedMode)) rankedMode = 'normal';
    const race = raceOf(rankedWeek, rankedMode), kp = kpmRules(rankedWeek), two = races.length > 1;
    // the race switch: each race's own price, pot and standings
    $('rankedraces').innerHTML = two ? races.map((m) => `<button role="tab" data-race="${m}" aria-selected="${m === rankedMode}" class="${m === rankedMode ? 'on' : 'ghost'}">${RACE[m].name} <span>${esc(raceOf(rankedWeek, m).entryDmt)} DMT</span></button>`).join('') : '';
    for (const b of $('rankedraces').querySelectorAll('[data-race]')) b.onclick = () => { setRace(b.dataset.race); renderRanked(); };
    $('rankedweek').textContent = `This week: ${MAP_BY_ID[rankedWeek.map]?.name || rankedWeek.map}${two ? ` · ${race.name} race${rankedMode === 'hard' ? ' (hard rules)' : ''}` : ''}`;
    const pool = $('rankedpool'), summary = document.createElement('span');
    const place = prizePlaces(race.rows, rankedWeek.week), estimate = prizeEstimate(race, place, rankedWeek.payouts);
    summary.textContent = poolReadout(race);
    pool.replaceChildren(summary, ' ');
    estimate?.prizes.forEach((amount,i) => {
      const prize = document.createElement('span');
      prize.textContent = `${['1st','2nd','3rd','4th','5th'][i] || `${i+1}th`}: ${dmtText(amount)} DMT`;
      pool.append(i ? ' · ' : '', prize);
    });
    for (const text of prizeNotes(race, estimate)) { const note = document.createElement('small'); note.textContent = text; pool.append(note); }
    const list = document.createElement('ol');
    race.rows.forEach((r, i) => {
      const li = document.createElement('li'), short3 = kp && !placeable(rankedWeek.week, r);
      const name = document.createElement('span'); name.translate = false; name.textContent = r.name || 'Adventurer';
      li.append(name, kp ? ` · ${short(r.wallet)} · ${fmtKpm(r)} kills/min · ${fmtT(r.t)} · ${r.kills} kills${short3 ? ' · too short' : ''}${noPrize(r.wallet) ? ' · dev, no prize' : ''}`
        : ` · ${short(r.wallet)} · ${fmtT(r.t)} · ${r.kills} kills${r.won ? ' · ★ Winner' : ''}${noPrize(r.wallet) ? ' · dev, no prize' : ''}`);
      if (place[i] < 0) li.classList.add('noprize');
      list.appendChild(li);
    });
    $('rankedstandings').replaceChildren(list);
    if (!list.children.length) $('rankedstandings').textContent = `No ${two ? race.name + ' ' : ''}runs yet this week.`;
    $('rankedrules').textContent = kp
      ? `${rankedMode === 'hard' ? 'Hard rules: tougher, faster monsters and harder bosses. ' : ''}Runs are endless: your score is kills per minute (kills × 60 ÷ seconds survived), and the hunt is over at ${fmtT(rankedWeek.timeLimit || RANKED.timeLimit)}. A run under ${fmtT(rankedWeek.minSeconds || RANKED.minSeconds)} is listed as too short and cannot win. Ties go to more kills, then the earlier finish. Entry is ${race.entryDmt} DMT on Arbitrum: 10% house fee, 90% to the ${race.name} prize pool, split 40/25/15/12/8 between its top five wallets; unclaimed places roll over to next week's ${race.name} pool. Monday to Monday UTC, one map, as many entries as you like in each race, one wallet per player per connection each week. Any regular adventurer, no skills, gear or DMT perks. The server checks every input. Runs must be played live by a person: bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held (resuming after a reload is fine).`
      : rankedWeek.rules === 'time' ? `Runs are endless: your score is how long you survive, then kills, and the hunt is over at ${fmtT(rankedWeek.timeLimit || RANKED.timeLimit)}. Ties go to more kills, then the earlier finish. Entry is ${race.entryDmt} DMT on Arbitrum: 10% house fee, 90% to the ${race.name} prize pool, split 40/25/15/12/8 between its top five wallets; unclaimed places roll over to next week's ${race.name} pool. Monday to Monday UTC, one map, as many entries as you like in each race, one wallet per player per connection each week. Any regular adventurer, no skills, gear or DMT perks. The server checks every input. Runs must be played live by a person: bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held (resuming after a reload is fine).`
      : 'Entry is 0.5 DMT on Arbitrum: 10% house fee, 90% prize pool split 40/25/15/12/8 between the top five wallets. Monday to Monday UTC, one map, as many entries as you like, one wallet per player per connection each week. Any regular adventurer, no skills, gear or DMT perks. The server checks every input. Runs must be played live by a person: bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held (resuming after a reload is fine).';
    rankedTime();
  }
  renderRankedFrom();
}
function rankedTime() {
  if (!rankedWeek) return;
  const h = Math.max(0, Math.floor((rankedWeek.endsAt - Date.now()) / 3600000));
  const m = Math.max(0, Math.floor((rankedWeek.endsAt - Date.now()) / 60000)) % 60;
  $('rankedtime').textContent = `${Math.floor(h / 24)}d ${h % 24}h ${m}m left · Monday reset, UTC`;
}
setInterval(rankedTime, 30000);
async function refreshRanked() {
  try { rankedWeek = await rankedApi(BASE, 'week'); $('rankedbtn').classList.toggle('hidden', !rankedWeek.open); renderRanked(); }
  catch {
    rankedWeek = null; $('rankedbtn').classList.add('hidden');
    $('rankedpool').textContent = 'Could not refresh ranked standings. Try again shortly.';
    $('rankedstandings').replaceChildren(); renderRanked();
  }
}
async function openRanked() {
  $('ranked').classList.remove('hidden'); renderRanked(); $('rankedclose').focus(); refreshBalances(true); await refreshRanked();
}
$('rankedbtn').onclick = openRanked;
$('rankedupdate').onclick = () => $('updatebtn').click();
$('rankedclose').onclick = () => { $('ranked').classList.add('hidden'); $('rankedbtn').focus(); };
$('ranked').addEventListener('click', (e) => { if (e.target.id === 'ranked') $('rankedclose').click(); });
for (const id of ['ranked', 'wallet', 'cloudpick', 'walletlink']) $(id).addEventListener('keydown', (e) => {
  if (id !== 'walletlink' && walletModalOpen()) return;
  if (e.key !== 'Tab') return;
  const nodes = [...$(id).querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')].filter((n) => n.offsetParent !== null);
  if (!nodes.length) return;
  if (e.shiftKey && document.activeElement === nodes[0]) { nodes.at(-1).focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { nodes[0].focus(); e.preventDefault(); }
});
async function rankedAction(fn) {
  if (rankedBusy || mode === 'recovery') return;
  cancelPendingLoads();
  rankedBusy = true; renderRanked();
  for (const b of $('rankedwallets').querySelectorAll('button')) b.disabled = true;
  try { await fn(); }
  catch (e) { rankedMessage(e.refund || e.plain ? e.message : why(e)); if (e.status === 409) { $('updatebtn').classList.remove('hidden'); $('rankedupdate').classList.remove('hidden'); } }
  finally { rankedBusy = false; $('rankedwallets').replaceChildren(); renderRanked(); }
}
// the wallet the entry is paid from, its balances, and what is missing before you can pay
// the selected race's entry price, in DMT
const racePrice = () => Number((raceOf(rankedWeek, rankedMode) || RACE.normal).entryDmt) || 0.5;
function renderRankedFrom() {
  const c = walletNow(), el = $('rankedfrom'), enter = $('rankedenter'), price = racePrice(), two = raceList(rankedWeek).length > 1;
  if (!c) { el.innerHTML = '<p class="dim">Connect a wallet to enter. Prizes are paid to the wallet that entered.</p>'; enter.textContent = 'Connect wallet'; return; }
  const b = walletBal && walletBal.address.toLowerCase() === c.address.toLowerCase() ? walletBal : null;
  el.innerHTML = `<div class="rkfrom">${walletIcon(c.w)}<span>Paying from <b>${esc(short(c.address))}</b></span>${b ? `<span>${esc(fmtDmt(b.dmt))} DMT · ${esc(fmtEth(b.eth))} ETH</span>` : '<span class="dim">checking balance…</span>'}<button id="rkchange" class="linkbtn">Change</button></div>`
    + (b && b.dmt < price ? `<p class="rkwarn">You need ${price} DMT on Arbitrum. <button id="rkbuy" class="linkbtn">Buy DMT here</button> or <a href="${GET_DMT}" target="_blank" rel="noopener">see the market</a></p>` : '')
    + (b && b.eth < ETH_FOR_GAS ? `<p class="rkwarn">You need a little ETH on Arbitrum for the network fee (well under a cent). <a href="${BRIDGE}" target="_blank" rel="noopener">Bridge ETH</a></p>` : '');
  $('rkchange').onclick = () => openWallet();
  if ($('rkbuy')) $('rkbuy').onclick = () => { buyWant = Math.max(0.5, Math.ceil((price - (b ? b.dmt : 0)) * 10) / 10); openWallet(); };
  enter.textContent = two ? `Enter ${RACE[rankedMode].name} for ${price} DMT` : `Enter for ${price} DMT`;
}
const plain = (text) => Object.assign(new Error(text), { plain: true });
function showRankedWalletChoices() {
  const wrap = $('rankedwallets');
  const ch = walletChoices((w) => rankedAction(async () => { await walletConnect(w); await refreshBalances(true); rankedMessage('Connected. Check your balance, then enter.'); }), 'ranked');
  wrap.innerHTML = ch.html; ch.bind(wrap); rankedMessage(wallets().length ? 'Pick your wallet.' : '');
}
$('rankedenter').onclick = () => {
  const c = walletNow(), wrap = $('rankedwallets'); wrap.replaceChildren();
  if (!c) {
    showRankedWalletChoices();
    return;
  }
  const mode = raceList(rankedWeek).includes(rankedMode) ? rankedMode : 'normal', price = Number(RACE[mode].entryDmt);
  rankedAction(async () => {
    rankedMessage('Checking your balance on Arbitrum…');
    const b = await refreshBalances(true); // unreadable balances never block: the wallet itself has the last word
    if (b && b.dmt < price) throw plain(`You need ${price} DMT on Arbitrum to enter${mode === 'hard' ? ' the Hard race' : ''}.`);
    if (b && b.eth < ETH_FOR_GAS) throw plain('You need a little ETH on Arbitrum for the network fee.');
    $('rankedtx').replaceChildren();
    await payEntry(c.w, BASE, rankedMessage, (tx) => { $('rankedtx').innerHTML = `<a href="${arbiscanTx(tx)}" target="_blank" rel="noopener">See your payment on Arbiscan</a>`; }, mode);
    refreshBalances(true);
  });
};
async function startRankedEntry(entry) {
  await rankedAction(async () => {
    if (rankedLive()) throw new Error('Resume your saved ranked run first.');
    if (!SIM_ID) throw new Error('This build has no ranked simulation version.');
    writeRanked('sq-ranked-entries', readRanked('sq-ranked-entries', []));
    const adv = $('rankedadv').value;
    rankedMessage('Loading this week’s map…');
    if (mapLoading) throw new Error('The map is still loading. Try again in a moment.');
    await pickMap(rankedWeek.map);
    rankedMessage('Starting your ranked run…');
    const d = await rankedApi(BASE, 'start', { entry: entry.entry, adv, sim: SIM_ID });
    const live = { run: d.run, adv, seed: d.seed, map: d.map, week: d.week, mode: d.mode === 'hard' ? 'hard' : 'normal', sim: SIM_ID, name: $('rankedname').value.trim().slice(0, 16) || 'Adventurer', log: new RunRecorder().log() };
    writeRanked('sq-ranked-live', live);
    writeRanked('sq-ranked-entries', readRanked('sq-ranked-entries', []).filter((e) => e.id !== entry.id));
    await startRun(live);
  });
}
async function recoverRankedRun() {
  let submit = false;
  await rankedAction(async () => {
    const live = rankedLive(); if (!live) return;
    if (live.sim !== SIM_ID) {
      rankedMessage('The game changed during your run. Preparing your entry to start again…');
      let d;
      try { d = await rankedApi(BASE, 'void', { run: live.run, log: live.log }); }
      catch (e) { if (/send it instead/.test(String(e.message))) { rankedMessage('Your run had already ended: sending it…'); submit = true; return; } throw e; }
      const race = liveRace(live);
      if (!d || d.restart !== true || !Number.isSafeInteger(d.id) || d.id < 1 || typeof d.entry !== 'string' || !d.entry.trim()
        || !Number.isInteger(d.week) || d.week < 0 || d.week !== race.week || !['normal', 'hard'].includes(d.mode) || d.mode !== race.mode)
        throw plain('The ranked server did not return a valid restart entry. Your run is saved. Try again.');
      const entries = readRanked('sq-ranked-entries', []).filter((x) => x.id !== d.id);
      entries.push({ entry: d.entry, id: d.id, week: d.week, mode: d.mode });
      writeRanked('sq-ranked-entries', entries); localStorage.removeItem('sq-ranked-live');
      rankedMessage('The game changed during your run, so it could not finish. Your entry is ready to start again.'); renderRanked();
    } else {
      // a long endless run is replayed from its start in this browser: say so, and let the message paint first
      const ticks = (live.log?.runs || []).reduce((n, r) => n + (Number(r[0]) || 0), 0);
      if (ticks > 10 * 60 * 30) { rankedMessage(`Restoring your ranked run at ${fmtT(ticks / 30)}. Long runs take a little while…`); await new Promise((r) => setTimeout(r, 60)); }
      await startRun(live);
    }
  });
  if (submit) await submitRanked();
}
async function submitRanked() {
  if (rankedBusy) return;
  const saved = readRanked('sq-ranked-submit') || rankedLive(); if (!saved) return;
  const body = { run: saved.run, name: saved.name, log: saved.log };
  writeRanked('sq-ranked-submit', body);
  rankedBusy = true; renderRanked(); $('rankedretry').classList.add('hidden');
  const checking = `Checking your ranked run…${(saved.log?.runs || []).reduce((n, r) => n + (r[0] || 0), 0) > 30 * 60 * 30 ? ' Long runs take a few minutes: keep this page open.' : ''}`;
  $('rankedresult').textContent = checking; rankedMessage(checking);
  try {
    const d = await rankedApi(BASE, 'submit', body);
    const race = d.mode === 'hard' ? ' in the Hard race' : '';
    const message = d.rank ? `Ranked run accepted. Place when checked: #${d.rank}${race}.` : 'Ranked run accepted.';
    if (lastRun && lastRun.ranked && d.rank) lastRun.rank = d.rank; // for Share on X
    $('rankedresult').textContent = message; rankedMessage(message);
    localStorage.removeItem('sq-ranked-submit'); localStorage.removeItem('sq-ranked-live');
    rankedRun = null; rankedRec = null;
  } catch (e) {
    if (e.status === 400 && !e.retry) { localStorage.removeItem('sq-ranked-submit'); localStorage.removeItem('sq-ranked-live'); rankedRun = null; rankedRec = null; }
    else $('rankedretry').classList.remove('hidden');
    const text = e.status ? e.message : 'Could not reach ranked. Your run is saved: retry when your connection returns.';
    $('rankedresult').textContent = text; rankedMessage(text);
  } finally { rankedBusy = false; renderRanked(); }
}
$('rankedretry').onclick = submitRanked;

// ---- skills shop ----------------------------------------------------------------------------------------------------
function progressionText(meta, gear) {
  const { vet } = createSim({ meta, players: [{ id: PLAYER, gear: runAdv().id !== selAdv ? {} : gear }] });
  const strength = Math.round((vet - 1) * 100000) / 1000;
  const spawns = Math.round(strength * 0.55 * 1000) / 1000;
  return `Casual scaling: enemy HP/contact damage +${strength}%; base spawn pressure +${spawns}%.`;
}
function buildSkills() {
  const lv = getSkills(), coins = getCoins();
  $('coins2').textContent = coins;
  $('skillpressure').textContent = progressionText(lv, getGear());
  $('skillgrid').innerHTML = SKILL_IDS.map((id) => {
    const s = SKILLS[id], l = lv[id] || 0, max = l >= s.max, cost = skillCost(id, l);
    return `<div class="skill"><img src="${asset('')}${s.icon}" alt=""><h4>${s.name}</h4><div class="pips">${'■'.repeat(l)}${'□'.repeat(s.max - l)}</div><p style="grid-column:1/-1">${s.blurb}</p><button data-id="${id}" ${max || coins < cost ? 'disabled' : ''}>${max ? 'Maxed' : `Train · ${cost} coins`}</button></div>`;
  }).join('');
  for (const b of $('skillgrid').querySelectorAll('button')) b.onclick = () => {
    const id = b.dataset.id, l = getSkills()[id] || 0, cost = skillCost(id, l);
    if (l >= SKILLS[id].max || getCoins() < cost) return;
    const sk = getSkills(); sk[id] = l + 1; save('sq-skills', sk); save('sq-coins', getCoins() - cost); showBest(); buildSkills();
  };
  // refunds (owner 3 Nov): right-click a skill (or hold it on a phone) to undo its last rank, full price back
  const undo = (id) => { const sk = getSkills(), l = sk[id] || 0; if (!l) return; sk[id] = l - 1; save('sq-skills', sk); save('sq-coins', getCoins() + skillCost(id, l - 1)); showBest(); buildSkills(); };
  $('skillgrid').querySelectorAll('.skill').forEach((el, i) => {
    const id = SKILL_IDS[i]; let hold = 0;
    el.title = (lv[id] || 0) ? 'Right-click to undo a rank (full refund)' : '';
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); undo(id); });
    el.addEventListener('touchstart', () => { clearTimeout(hold); hold = setTimeout(() => undo(id), 600); }, { passive: true });
    for (const ev of ['touchend', 'touchmove', 'touchcancel']) el.addEventListener(ev, () => clearTimeout(hold), { passive: true });
  });
  const spent = SKILL_IDS.reduce((a, id) => { let c = 0; for (let k = 0; k < (lv[id] || 0); k++) c += skillCost(id, k); return a + c; }, 0);
  const all = $('skillrefund'); all.disabled = !spent; all.dataset.sure = ''; all.textContent = spent ? `Refund all · ${spent.toLocaleString()} coins back` : 'Refund all';
  all.onclick = () => {
    if (!spent) return;
    if (all.dataset.sure !== '1') { all.dataset.sure = '1'; all.textContent = `Click again to refund every skill (${spent.toLocaleString()} coins)`; return; }
    save('sq-skills', {}); save('sq-coins', getCoins() + spent); showBest(); buildSkills();
  };
}
$('skillsbtn').onclick = () => { buildSkills(); $('skills').classList.remove('hidden'); };
// tapping outside a menu panel closes it
for (const id of ['skills', 'gear', 'quests']) $(id).addEventListener('click', (e) => { if (e.target.id === id) $(id).classList.add('hidden'); });
$('skillsclose').onclick = () => $('skills').classList.add('hidden');

// ---- loading ------------------------------------------------------------------------------------------------------------
const labels = { map: 'Drawing the map…', props: 'Raising Greentown…', monsters: 'Waking the monsters…', ready: 'Ready' };
async function boot() {
  if (params.has('qa')) document.body.classList.add('qa');
  try {
    await pickAssetHost(); // jsDelivr, or the game's own host if it does not answer
    renderer = await createRenderer($('c'), (stage, v) => { $('loadfill').style.width = Math.round(v * 100) + '%'; $('loadtext').textContent = labels[stage] || ''; });
    $('loadtext').textContent = ''; $('loadbar').classList.add('hidden');
    await renderer.preloadGear(Object.values(getGear()));
    { const st = load('sq-settings', {}); if ((st.v || 1) < 2) { st.roofs = 'off'; st.quality = 'auto'; st.v = 2; save('sq-settings', st); } renderer.applySettings(st); }
    $('start').disabled = false; buildAdventurers(); buildMaps(); showBest(); renderer.setZoom(0.45); renderer.setShift(2.4);
    if (selMap !== 'greentown') pickMap(selMap);
    if (params.has('clean')) $('title').classList.add('hidden');
    if (params.has('autostart') && !rankedLive()) {
      for (const ch of (params.get('hold') || '')) keys.add(ch);
      if (params.get('map') && MAP_BY_ID[params.get('map')]) selMap = params.get('map');
      if (params.get('adv') && ADVENTURER_BY_ID[params.get('adv')]) selAdv = params.get('adv');
      if (params.has('hardmode')) hardOn = true;
      await startRun();
      const warp = Number(params.get('warp') || 0); // test hook: fast-forward the sim before the first frame
      for (let i = 0; i < warp / TICK; i++) {
        step(sim, { [PLAYER]: { mx: (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0), mz: (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0) } }, TICK);
        for (const id of Object.keys(sim.pending)) choose(sim, id, 0);
        if (sim.over) break;
      }
      if (params.has('zoom')) renderer.setZoom(Number(params.get('zoom')));
      if (params.has('looky')) renderer.setLookY(Number(params.get('looky')));
      if (params.has('yaw')) renderer.setYaw(Number(params.get('yaw')) * Math.PI / 180);
    } else if (params.has('zoom')) renderer.setZoom(Number(params.get('zoom')));
    requestAnimationFrame(loop);
  } catch (e) {
    console.error(e); $('loadtext').textContent = 'Could not load the world: ' + (e && e.message ? e.message : e);
  }
}

// ---- gear ------------------------------------------------------------------------------------------------------------
let gearSlotSel = 'head';
const gearSlotName = slot => slot === 'back' ? 'Cape' : GEAR_SLOT_NAMES[slot];
function buildGear() {
  const gear = getGear(), bank = getBank(), lvs = getGearLv(), coins = getCoins();
  $('gearpressure').textContent = progressionText(getSkills(), gear);
  const owned = new Set(bank);
  // the slots as labelled tabs (owner 3 Nov: "organize everything in gear by slot type"): what you wear there, its name,
  // and how many of the slot's pieces you have found
  $('gearslots').innerHTML = GEAR_SLOTS.map((sl) => {
    const all = Object.keys(GEAR).filter((n) => GEAR[n].slot === sl), have = all.filter((n) => owned.has(n)).length;
    return `<div class="gslot${sl === gearSlotSel ? ' sel' : ''}" data-slot="${sl}" role="tab" aria-selected="${sl === gearSlotSel}" title="${gearSlotName(sl)}${gear[sl] ? `: ${gear[sl]}` : ''}">${gear[sl] ? imgTag(gear[sl]) : '<span class="empty"></span>'}<small>${gearSlotName(sl)}</small><i>${have}/${all.length}</i></div>`;
  }).join('');
  for (const el of $('gearslots').children) el.onclick = () => { gearSlotSel = el.dataset.slot; buildGear(); };
  // inside the slot, every piece in its group: the metal ladder in order, then the sets, then the specials. Yours to
  // wear, reinforce or smith into the next metal; the rest dim, with where it comes from
  const GROUP_NOTE = { Metal: 'Bronze to Runite. Smith a piece into the next metal with coins; trimmed (t) pieces are a little better.', Shields: 'From the Wooden Shield up. Light: a little speed.', Kiteshields: 'Heavy: more armor and a little health.', Sets: 'Wear every piece of a set for its bonus.', Amulets: 'From reward caskets, now and then.', Rings: 'From reward caskets, now and then.' };
  const itemHTML = (n) => {
    if (!owned.has(n)) {
      const prev = smithPrev(n), how = prev && owned.has(prev) ? `Smith it from your ${prev}` : prev ? `Smith it from a ${prev}, or find it in a reward casket` : GEAR[n].rarity === 'unique' ? 'A unique drop from reward caskets' : GEAR[n].pace ? 'Found in reward caskets' : 'Found in reward caskets and quests';
      return `<div class="gitem locked" title="${n}">${imgTag(n)}<div><b>${n}</b><span>${bonusText(GEAR[n].bonus)}</span><span class="dim">${how}</span></div></div>`;
    }
    const lv = lvs[n] || 0, cost = gearUpgradeCost(n, lv), m = 1 + 0.25 * lv, b = Object.fromEntries(Object.entries(GEAR[n].bonus).map(([k, v]) => [k, v * m]));
    const up = smithNext(n), smith = up && !owned.has(up.name) ? `<button class="gsmith" data-n="${n}" ${coins < up.cost ? 'disabled' : ''}>Smith into ${up.name} · ${up.cost.toLocaleString()} coins</button>` : '';
    return `<div class="gitem${gear[gearSlotSel] === n ? ' on' : ''}" data-n="${n}" title="${n}">${imgTag(n)}<div><b>${n}${lv ? ` +${lv}` : ''}</b><span>${bonusText(b)}${GEAR[n].set && GEAR_SETS[GEAR[n].set] && !ARMOR_TIERS.includes(GEAR[n].set) ? ` · ${GEAR[n].set} set` : ''}</span>
        ${smith}<button class="gup ghost" data-n="${n}" ${lv >= GEAR_MAX_LV || coins < cost ? 'disabled' : ''}>${lv >= GEAR_MAX_LV ? 'Fully reinforced' : `Reinforce +${lv + 1} · ${cost} coins`}</button></div></div>`;
  };
  $('gearbank').innerHTML = gearGroups(gearSlotSel).map((g) => {
    const have = g.items.filter((n) => owned.has(n)).length;
    return `<h4 class="ghead">${g.title} <span>${have}/${g.items.length}</span>${GROUP_NOTE[g.title] ? `<small>${GROUP_NOTE[g.title]}</small>` : ''}</h4>${g.items.map(itemHTML).join('')}`;
  }).join('') || '<p class="gempty">Nothing for this slot.</p>';
  for (const b of $('gearbank').querySelectorAll('.gup')) b.onclick = (e) => {
    e.stopPropagation(); const n = b.dataset.n, l = getGearLv(), lv = l[n] || 0, cost = gearUpgradeCost(n, lv);
    if (lv >= GEAR_MAX_LV || getCoins() < cost) return;
    l[n] = lv + 1; save('sq-gearlv', l); save('sq-coins', getCoins() - cost); showBest(); buildGear();
  };
  // smithing: the next metal's piece joins your gear (the old one stays in your collection); worn, it is worn instead,
  // and its reinforcement carries over
  for (const b of $('gearbank').querySelectorAll('.gsmith')) b.onclick = (e) => {
    e.stopPropagation(); const n = b.dataset.n, up = smithNext(n); if (!up || getBank().includes(up.name) || getCoins() < up.cost) return;
    save('sq-coins', getCoins() - up.cost); bankItem(up.name, false);
    const l = getGearLv(); if (l[n]) { l[up.name] = Math.max(l[up.name] || 0, l[n]); save('sq-gearlv', l); }
    const g = getGear(); if (g[gearSlotSel] === n) { g[gearSlotSel] = up.name; save('sq-gear', g); refreshIdle(); }
    audio.play('smith', { minGap: 0 }); showBest(); buildGear();
  };
  for (const el of $('gearbank').querySelectorAll('.gitem:not(.locked)')) el.onclick = () => {
    const g = getGear(); if (g[gearSlotSel] === el.dataset.n) delete g[gearSlotSel]; else g[gearSlotSel] = el.dataset.n;
    save('sq-gear', g); buildGear(); refreshIdle();
  };
  const b = gearBonus(gear, lvs), { sets, ...rest } = b;
  $('gearinfo').innerHTML = `<b>Worn:</b> ${Object.keys(rest).length ? bonusText(rest) : 'nothing yet'}${sets.length ? `<br><b>Set bonus:</b> ${sets.map((x) => `${x} (${GEAR_SETS[x].text})`).join(', ')}` : ''}<br><span class="dim">${bank.length} of ${Object.keys(GEAR).length} pieces found · ${coins} coins for the Armoury</span>`;
}
async function refreshIdle() { window.__idleSim = null; if (renderer) await renderer.preloadGear(Object.values(getGear())); }
$('gearbtn').onclick = () => { buildGear(); $('gear').classList.remove('hidden'); };
$('gearclose').onclick = () => $('gear').classList.add('hidden');

// ---- settings ---------------------------------------------------------------------------------------------------------
const SETTINGS = [
  { head: 'Display' },
  { id: 'quality', name: 'Quality', opts: [['auto', 'Auto'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']] },
  { id: 'res', name: 'Resolution', opts: [['auto', 'Auto'], ['0.5', '50%'], ['0.75', '75%'], ['1', '100%'], ['2', 'Sharp']] },
  { id: 'fps', name: 'Frame rate cap', opts: [['30', '30'], ['60', '60'], ['max', 'Max']] },
  { id: 'aa', name: 'Anti-aliasing', opts: [[true, 'On'], [false, 'Off']] },
  { head: 'Lighting' },
  { id: 'shadows', name: 'Shadows', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'shadowq', name: 'Shadow detail', opts: [['auto', 'Auto'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']] },
  { id: 'bloom', name: 'Bloom (glow)', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'ao', name: 'Ambient occlusion', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'grade', name: 'Colour grading', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'dof', name: 'Depth of field', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'time', name: 'Time of day', opts: [['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']] },
  { head: 'World' },
  { id: 'view', name: 'Draw distance', opts: [['near', 'Near'], ['normal', 'Normal'], ['far', 'Far'], ['max', 'Max']] },
  { id: 'water', name: 'Water reflections', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'foliage', name: 'Grass and flowers', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'rain', name: 'Rain', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'roofs', name: 'Roofs', opts: [['off', 'Off'], ['auto', 'On, lift when inside']] },
  { head: 'Sound' },
  { id: 'sound', name: 'Sound and music', opts: [[true, 'On'], [false, 'Off']] },
  { vol: 's', name: 'Sound effects' },
  { vol: 'm', name: 'Music' },
  { head: 'Game' },
  { id: 'fx', name: 'Effects', opts: [['full', 'Full'], ['reduced', 'Reduced']] },
  { id: 'numbers', name: 'Damage numbers', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'shake', name: 'Screen shake', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'autoalch', name: 'Auto high alch caskets that are not better', opts: [[true, 'On'], [false, 'Off']] },
];function buildSettings() {
  const cur = { ...renderer.getSettings(), sound: !audio.muted, autoalch: autoAlchOn() };
  $('setlist').innerHTML = SETTINGS.map((o) => o.head ? `<h3 class="sethead">${o.head}</h3>` : o.vol ? `<div class="setrow"><span>${o.name}</span><div class="volrow"><input type="range" min="0" max="100" step="5" value="${audio.volume(o.vol)}" data-vol="${o.vol}" aria-label="${o.name} volume"><b>${audio.volume(o.vol)}%</b></div></div>` : `<div class="setrow"><span>${o.name}</span><div class="seg">${o.opts.map(([v, label]) => `<button class="${cur[o.id] === v ? 'on' : 'ghost'}" data-id="${o.id}" data-v='${JSON.stringify(v)}'>${label}</button>`).join('')}</div></div>`).join('');
  let blip = 0;
  for (const r of $('setlist').querySelectorAll('input[data-vol]')) {
    r.addEventListener('keydown', (e) => e.stopPropagation()); // arrow keys move the slider, not the menu
    r.oninput = () => {
      audio.setVolume(r.dataset.vol, r.value); r.nextElementSibling.textContent = `${audio.volume(r.dataset.vol)}%`;
      if (r.dataset.vol === 's' && performance.now() - blip > 150) { blip = performance.now(); audio.init(); audio.play('pickup', { minGap: 0 }); } // hear it
    };
  }
  for (const b of $('setlist').querySelectorAll('button')) b.onclick = () => {
    const id = b.dataset.id, v = JSON.parse(b.dataset.v);
    if (id === 'sound') audio.setMuted(!v); else if (id === 'autoalch') save('sq-autoalch', v === true); else renderer.applySettings({ [id]: v });
    const keep = { ...renderer.getSettings(), v: 2 }; save('sq-settings', keep); buildSettings();
  };
}
const openSettings = () => { buildSettings(); $('settings').classList.remove('hidden'); };
$('setbtn').onclick = openSettings; $('setbtn2').onclick = openSettings;
$('setclose').onclick = () => $('settings').classList.add('hidden');
$('settings').addEventListener('click', (e) => { if (e.target.id === 'settings') $('settings').classList.add('hidden'); });

// ---- updates log -------------------------------------------------------------------------------------------------------
$('updnew').classList.toggle('hidden', load('sq-seen', '') === LATEST);
$('morenew').classList.toggle('hidden', load('sq-seen', '') === LATEST);
// More: the extras (settings, what's new, DMT, bug report, install) in one small panel
$('morebtn').onclick = () => $('more').classList.remove('hidden');
$('moreclose').onclick = () => $('more').classList.add('hidden');
$('more').addEventListener('click', (e) => { if (e.target.id === 'more') $('more').classList.add('hidden'); });
// ---- move progress to another device: a code with the save (progress and settings only, never ranked tickets, a DMT
// pass or a wallet), checked key by key on the way in like the old-address hand-off in index.html
const b64 = (s) => btoa(unescape(encodeURIComponent(s))), unb64 = (s) => decodeURIComponent(escape(atob(s)));
const xferSum = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h.toString(36); };
function xferCode() {
  const d = {}; for (const k of XFER_KEYS) { try { const v = localStorage.getItem(k); if (v !== null) d[k] = v; } catch { /* storage blocked */ } }
  const body = b64(JSON.stringify(d)); return `SQS1.${body}.${xferSum(body)}`;
}
function xferRead(code) {
  const m = /^SQS1\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/.exec(String(code).replace(/\s+/g, ''));
  if (!m) return { error: 'That is not a progress code. It starts with SQS1.' };
  if (xferSum(m[1]) !== m[2]) return { error: 'The code is cut short or changed. Copy it again.' };
  let d; try { d = JSON.parse(unb64(m[1])); } catch { return { error: 'The code could not be read. Copy it again.' }; }
  const out = {};
  for (const k of XFER_KEYS) {
    const v = d[k]; if (typeof v !== 'string' || v.length > 20000) continue;
    if (k === 'sq-roofs') { if (v === 'off' || v === 'on' || v === 'auto') out[k] = v; continue; }
    try { JSON.parse(v); out[k] = v; } catch { /* not a value the game saves */ }
  }
  if (!Object.keys(out).length) return { error: 'The code has no progress in it.' };
  const j = (k, f) => { try { return out[k] ? JSON.parse(out[k]) : f; } catch { return f; } };
  const skills = j('sq-skills', {}), ranks = Object.values(skills).reduce((a, b) => a + (Number(b) || 0), 0);
  return { data: out, coins: Number(j('sq-coins', 0)) || 0, maps: (j('sq-cleared', []) || []).length, ranks, gear: (j('sq-bank', []) || []).length };
}
$('xferbtn').onclick = () => { $('more').classList.add('hidden'); $('xfermsg').textContent = ''; $('xferpeek').textContent = ''; $('xferin').value = ''; $('xferload').disabled = true; $('xfer').classList.remove('hidden'); };
$('xferclose').onclick = () => $('xfer').classList.add('hidden');
$('xfer').addEventListener('click', (e) => { if (e.target.id === 'xfer') $('xfer').classList.add('hidden'); });
$('xferin').addEventListener('keydown', (e) => e.stopPropagation());
$('xfercopy').onclick = async () => {
  const code = xferCode();
  try { await navigator.clipboard.writeText(code); $('xfermsg').textContent = 'Copied. Paste it in the game on your other device (More, Move progress).'; }
  catch { $('xferin').value = code; $('xferin').select(); $('xfermsg').textContent = 'Copy the code from the box above.'; }
};
$('xferin').oninput = () => {
  if (importAttempt) cancelPendingLoads();
  $('xferload').dataset.sure = ''; $('xferload').textContent = 'Load this progress';
  const r = xferRead($('xferin').value); $('xferload').disabled = !!r.error;
  $('xferpeek').textContent = r.error || `${r.coins.toLocaleString()} coins · ${r.maps} map${r.maps === 1 ? '' : 's'} cleared · ${r.ranks} skill rank${r.ranks === 1 ? '' : 's'} · ${r.gear} gear found`;
};
function withImportLock(fn) {
  return navigator.locks?.request ? navigator.locks.request('sqs-progress-import', fn) : fn();
}
function showProgressRecovery() {
  mode = 'recovery';
  const screen = $('progressrecovery'), retry = $('progressretry');
  screen.classList.remove('hidden'); retry.focus();
  screen.onkeydown = e => { if (e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); retry.focus(); } e.stopPropagation(); };
  retry.onclick = async () => {
    if (retry.disabled) return;
    retry.disabled = true; $('progressrecoverystatus').textContent = '';
    try { await withImportLock(() => recoverProgressImport(localStorage)); location.reload(); }
    catch { $('progressrecoverystatus').textContent = 'This browser still cannot restore progress. Free some storage and try again. Keep this app installed.'; retry.disabled = false; retry.focus(); }
  };
}
$('xferload').onclick = async () => {
  if (importAttempt) return;
  if (!canManuallyReload()) { $('xfermsg').textContent = 'Finish your run or wallet action before loading progress.'; return; }
  const r = xferRead($('xferin').value); if (r.error) { $('xfermsg').textContent = r.error; return; }
  if ($('xferload').dataset.sure !== '1') { $('xferload').dataset.sure = '1'; $('xferload').textContent = 'Replace this device\'s progress?'; $('xfermsg').textContent = `This device has ${getCoins().toLocaleString()} coins now. Click again to load the code.`; return; }
  cancelPendingLoads();
  const attempt = importAttempt = {}; $('xferload').disabled = true;
  try {
    await withImportLock(() => {
      if (importAttempt !== attempt || !canManuallyReload()) return;
      importProgress(localStorage, r.data);
      $('xfermsg').textContent = 'Loaded. Restarting…'; queuePageReload('Loaded. Restarting…', 600);
    });
  } catch (e) {
    if (e.recovery) { cancelPendingLoads(); showProgressRecovery(); }
    else $('xfermsg').textContent = 'This browser will not save (private mode?).';
  } finally {
    if (importAttempt === attempt) { importAttempt = null; $('xferload').disabled = false; }
  }
};
for (const b of document.querySelectorAll('#more .morelist button')) b.addEventListener('click', () => $('more').classList.add('hidden'), true);
$('updbtn').onclick = () => {
  $('updlist').innerHTML = CHANGELOG.map((u) => `<div class="upd"><div class="updhead"><b>${u.title}</b><span>${u.date} · v${u.version}</span></div><ul>${u.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('');
  $('updates').classList.remove('hidden'); save('sq-seen', LATEST); $('updnew').classList.add('hidden'); $('morenew').classList.add('hidden');
};
$('updclose').onclick = () => $('updates').classList.add('hidden');
$('updates').addEventListener('click', (e) => { if (e.target.id === 'updates') $('updates').classList.add('hidden'); });

// ---- version, leaderboard and bug reports ------------------------------------------------------------------------------
$('version').textContent = 'v' + LATEST;
$('version').title = "What's new";
$('version').onclick = () => $('updbtn').click(); // the version in the corner opens what's new
const recentErrors = [];
addEventListener('error', (e) => { recentErrors.push(String(e.message || e).slice(0, 300)); if (recentErrors.length > 8) recentErrors.shift(); });
addEventListener('unhandledrejection', (e) => { recentErrors.push(String(e.reason && e.reason.message || e.reason).slice(0, 300)); if (recentErrors.length > 8) recentErrors.shift(); });
const ADV_NAME = (id) => (ADVENTURER_BY_ID[id] || {}).name || id;
let lbMap = null, lbMode = 'casual', lbEndless = false;
const rankedIsOpen = () => !$('rankedbtn').classList.contains('hidden');
// the leaderboard: Ranked (this week's standings and pot) or Casual (one map at a time, picked from a list)
async function showBoard(mapId, mode) {
  if (mode) lbMode = mode; if (mapId && mapId !== 'ranked') lbMap = mapId; lbMap = lbMap || selMap;
  if (mapId === 'ranked') lbMode = 'ranked';
  if (lbMode === 'ranked' && !rankedIsOpen()) lbMode = 'casual';
  $('lbtabs').innerHTML = (rankedIsOpen() ? `<div class="lbmode"><button class="${lbMode === 'ranked' ? 'on' : 'ghost'} rankedtab" data-mode="ranked">Ranked</button><button class="${lbMode === 'casual' ? 'on' : 'ghost'}" data-mode="casual">Casual</button></div>` : '')
    + (lbMode === 'casual' ? `<label class="lbpick">Map <select id="lbmapsel">${MAPS.map((m) => `<option value="${m.id}"${m.id === lbMap ? ' selected' : ''}>${m.name}</option>`).join('')}</select></label>`
      + `<div class="lbmode lbsub"><button class="${!lbEndless ? 'on' : 'ghost'}" data-endless="0">15:00 runs</button><button class="${lbEndless ? 'on' : 'ghost'}" data-endless="1">Endless</button></div>` : '');
  for (const b of $('lbtabs').querySelectorAll('[data-mode]')) b.onclick = () => showBoard(null, b.dataset.mode);
  if ($('lbmapsel')) $('lbmapsel').onchange = (e) => showBoard(e.target.value, 'casual');
  for (const b of $('lbtabs').querySelectorAll('[data-endless]')) b.onclick = () => { lbEndless = b.dataset.endless === '1'; showBoard(null, 'casual'); };
  $('lblist').innerHTML = '<p class="dim">Loading…</p>';
  if (lbMode === 'ranked') return showRankedBoard();
  try {
    const r = await fetch(`${BASE}api/scores?map=${encodeURIComponent(lbMap)}${lbEndless ? '&endless=1' : ''}`);
    if (r.status === 503) { $('lblist').innerHTML = '<p class="dim">The shared leaderboard opens soon. Your best run: ' + localBest() + '</p>'; return; }
    const d = await r.json(); const rows = d.rows || []; const myName = load('sq-name', ''); // your own runs stand out
    $('lblist').innerHTML = rows.length ? `<table class="lbtable"><tr><th>#</th><th>Name</th><th class="opt">Adventurer</th><th>Time</th><th class="opt">Level</th><th>Slain</th></tr>${rows.map((x, i) => `<tr class="${x.won ? 'won' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td><span translate="no">${esc(x.name)}</span>${x.holder ? ' <span class="dmtb">DMT</span>' : ''}${x.hard ? ' <em>hard</em>' : ''}</td><td class="opt">${esc(ADV_NAME(x.adv))}</td><td>${fmtT(x.t)}${x.won ? ' ✔' : ''}</td><td class="opt">${x.level}</td><td>${x.kills}</td></tr>`).join('')}</table>` : (lbEndless ? '<p class="dim">No endless runs on this map yet. Clear the map, then tick Endless on the title screen and see how long you last.</p>' : '<p class="dim">No runs on this map yet. Be the first.</p>');
  } catch (e) { $('lblist').innerHTML = '<p class="dim">Could not reach the leaderboard.</p>'; }
}
// this week's ranked standings: each wallet's best run, and what the top places would win if the week ended now
async function showRankedBoard() {
  try {
    const r = await fetch(`${BASE}api/ranked-week`); if (!r.ok) throw Error('ranked unavailable'); const d = await r.json();
    const races = raceList(d); if (!races.includes(rankedMode)) rankedMode = 'normal';
    const race = raceOf(d, rankedMode), kp = kpmRules(d), two = races.length > 1;
    const rows = race.rows || [], pays = d.payouts || [], myName = load('sq-name', '');
    const place = prizePlaces(rows, d.week), estimate = prizeEstimate(race, place, pays);
    const left = Math.max(0, (d.endsAt || 0) - Date.now()), dd = Math.floor(left / 86400000), hh = Math.floor((left % 86400000) / 3600000);
    const tabs = two ? `<div class="lbmode lbrace" role="tablist" aria-label="Ranked race">${races.map((m) => `<button role="tab" data-race="${m}" aria-selected="${m === rankedMode}" class="${m === rankedMode ? 'on' : 'ghost'}">${RACE[m].name} <span>${esc(raceOf(d, m).entryDmt)} DMT</span></button>`).join('')}</div>` : '';
    const head = `${tabs}<p class="lbweek">${esc((MAP_BY_ID[d.map] || {}).name || d.map)}${two ? ` · ${race.name}` : ''} · <b>${esc(poolReadout(race))}</b> · resets in ${dd}d ${hh}h</p>`
      + prizeNotes(race, estimate).map(text => `<p class="lbweek dim">${esc(text)}</p>`).join('')
      + (kp ? `<p class="lbweek dim">Score: kills per minute. Runs under ${fmtT(d.minSeconds || RANKED.minSeconds)} cannot win.</p>` : '');
    const prize = (i) => (place[i] < 0 ? `<span class="dim">${noPrize(rows[i].wallet) ? 'no prize (dev)' : 'too short'}</span>` : estimate?.prizes[place[i]] !== undefined ? `${dmtText(estimate.prizes[place[i]])} DMT` : '—');
    const wal = (x) => esc(String(x.wallet || '').slice(0, 6) + '…' + String(x.wallet || '').slice(-4));
    $('lblist').innerHTML = head + (rows.length ? (kp
      ? `<table class="lbtable"><tr><th>#</th><th>Name</th><th class="opt">Wallet</th><th class="opt">Adventurer</th><th>KPM</th><th>Time</th><th>Slain</th><th>Estimated prize</th></tr>${rows.map((x, i) => `<tr class="${place[i] < 0 ? 'short' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td><span translate="no">${esc(x.name)}</span></td><td class="opt">${wal(x)}</td><td class="opt">${esc(ADV_NAME(x.adv))}</td><td>${fmtKpm(x)}</td><td>${fmtT(x.t)}</td><td>${x.kills}</td><td class="prizeamt">${prize(i)}</td></tr>`).join('')}</table>`
      : `<table class="lbtable"><tr><th>#</th><th>Name</th><th class="opt">Wallet</th><th class="opt">Adventurer</th><th>Time</th><th>Slain</th><th>Estimated prize</th></tr>${rows.map((x, i) => `<tr class="${x.won ? 'won' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td><span translate="no">${esc(x.name)}</span></td><td class="opt">${wal(x)}</td><td class="opt">${esc(ADV_NAME(x.adv))}</td><td>${fmtT(x.t)}${x.won ? ' ✔' : ''}</td><td>${x.kills}</td><td class="prizeamt">${prize(i)}</td></tr>`).join('')}</table>`)
      : `<p class="dim">No ${two ? race.name + ' ' : ''}ranked runs yet this week. Enter from the Ranked button on the title screen.</p>`);
    for (const b of $('lblist').querySelectorAll('[data-race]')) b.onclick = () => { setRace(b.dataset.race); showRankedBoard(); };
  } catch (e) { $('lblist').innerHTML = '<p class="dim">Could not reach ranked.</p>'; }
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// ---- something to chase every run (owner: "we also want the game to be really addicting"): your best per map and mode,
// and in ranked your place on this week's board as you play
let runBest = null, passedBest = false, chase = null; // chase: { rows (others' bests), week, kp }
function chaseText(t, kills) {
  if (!chase || !chase.rows.length) return '';
  const min = RANKED.minSeconds, mine = kpm(kills, t);
  if (chase.kp && t < min) return ` · places from ${fmtT(min)}`;
  // the board's order (one best run per wallet, top 25): time then kills, or in kills-per-minute weeks only runs of 3:00 place
  const ahead = chase.rows.filter((r) => (chase.kp
    ? r.t >= min && (kpm(r.kills, r.t) > mine || (kpm(r.kills, r.t) === mine && r.kills >= kills))
    : r.t > t || (r.t === t && r.kills >= kills)));
  if (!ahead.length) return ' · #1 vs starting board';
  const full = chase.rows.length >= 25, place = ahead.length + 1, next = ahead[ahead.length - 1];
  const where = place > 25 || (full && place > chase.rows.length) ? 'outside starting top 25' : `#${place} vs starting board`, to = place > 25 ? 'the top 25' : `#${place - 1}`;
  if (chase.kp) {
    const micro = BigInt(kpmMicro(next.kills, next.t)), seconds = BigInt(t), scale = 60000000n;
    const ceilKills = q => Number((q * seconds + scale - 1n) / scale);
    // Equal integer KPM wins only with more total kills; a full tie belongs to the earlier finisher.
    const target = Math.min(Math.max(ceilKills(micro), next.kills + 1), ceilKills(micro + 1n));
    const n = Math.max(1, target - kills);
    return ` · ${where} · ${n} kill${n === 1 ? '' : 's'} to ${to}`;
  }
  return ` · ${where} · ${fmtT(Math.max(1, next.t - t))} to ${to}`;
}
const localBest = () => { const b = load('sq-best', null); return b ? `${fmtT(Number(b.t) || 0)}, level ${Number(b.level) || 0}, ${Number(b.kills) || 0} slain` : 'none yet'; };
$('lbbtn').onclick = () => { $('board').classList.remove('hidden'); showBoard(selMap, rankedIsOpen() ? 'ranked' : 'casual'); };
$('lbclose').onclick = () => $('board').classList.add('hidden');
$('board').addEventListener('click', (e) => { if (e.target.id === 'board') $('board').classList.add('hidden'); });
let lastRun = null;
$('lbname').value = load('sq-name', '');
async function submitScore() {
  const name = $('lbname').value.trim().slice(0, 16);
  if (!name) { $('lbmsg').textContent = 'Type a name first.'; return; }
  if (!lastRun || lastRun.sent) return;
  save('sq-name', name); $('lbsubmit').disabled = true; $('lbmsg').textContent = 'Sending…';
  try {
    const r = await fetch(`${BASE}api/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lastRun, name, pass: (savedPass() || {}).pass }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { lastRun.sent = true; $('lbmsg').textContent = d.rank ? `You are #${d.rank} on ${MAP_BY_ID[lastRun.map].name}!` : 'Sent!'; }
    else { $('lbmsg').textContent = r.status === 503 ? 'The shared leaderboard opens soon.' : r.status === 429 ? 'Wait a moment and try again.' : 'Could not send.'; $('lbsubmit').disabled = false; }
  } catch (e) { $('lbmsg').textContent = 'Could not send.'; $('lbsubmit').disabled = false; }
}
$('lbsubmit').onclick = submitScore;
// the shared leaderboard only shows once it is switched on (until then, nothing on screen points at it)
fetch(`${BASE}api/scores?map=greentown`, { method: 'GET' }).then((r) => { if (r.status === 503 || r.status === 404) { $('lbbtn').classList.add('hidden'); $('endlb').classList.add('hidden'); } }).catch(() => {});
// Share on X: your run, the link, and who made it
$('sharex').onclick = () => {
  if (!lastRun) return;
  const m = MAP_BY_ID[lastRun.map].name;
  const stats = `${fmtT(lastRun.t)}, level ${lastRun.level}, ${lastRun.kills} monsters slain`;
  const race = lastRun.race === 'hard' ? 'Hard ' : '';
  const text = lastRun.ranked && lastRun.rank && lastRun.kpm != null ? `I'm #${lastRun.rank} in this week's SankoQuest Survivors ${race}ranked race on ${m}: ${lastRun.kpm.toFixed(2)} kills per minute (${lastRun.kills} slain in ${fmtT(lastRun.t)}). Top 5 split the ${race}$DMT pot. Can you knock me off?`
    : lastRun.ranked && lastRun.rank ? `I'm #${lastRun.rank} in this week's SankoQuest Survivors ranked on ${m} (${stats}). Top 5 split the $DMT pot. Can you knock me off?`
    : lastRun.won ? `I cleared ${m} in SankoQuest Survivors in ${fmtT(lastRun.t)} (level ${lastRun.level}, ${lastRun.kills} monsters slain). Can you beat it?`
    : `I survived ${fmtT(lastRun.t)} in ${m} in SankoQuest Survivors (level ${lastRun.level}, ${lastRun.kills} monsters slain). Can you last longer?`;
  const url = location.origin + '/';
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
};
// ---- DMT holder perks ----
const DMT_PERKS = '<ul class="dmtperks"><li>A gold-and-teal DMT aura around your adventurer</li><li>+25% coins after every run</li><li>A DMT badge next to your name on the leaderboard</li></ul>';
function applyDmt() { const p = savedPass(); if (renderer) renderer.setAura(!!p); $('dmtchip').classList.toggle('hidden', !p || !!walletNow()); renderWalletChip(); }
function renderDmt() {
  const pass = savedPass(), body = $('dmtbody');
  if (pass) {
    body.innerHTML = `<p class="dmtok">Verified holder: ${esc(pass.balance)} DMT in ${esc(short(pass.address))}</p>${DMT_PERKS}<p class="dim">Perks are on until ${new Date(pass.exp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Check again any time.</p><div class="lurow"><button id="dmtagain">Check again</button><button id="dmtforget" class="ghost">Forget this wallet</button></div>`;
    $('dmtagain').onclick = () => connectDmt(); $('dmtforget').onclick = () => { holderChecking = null; forget(); applyDmt(); $('dmtmsg').textContent = 'Forgotten. Perks are off.'; renderDmt(); };
    return;
  }
  const c = walletNow(), ws = c ? [{ ...c.w, name: `${c.w.name} (${short(c.address)})` }] : wallets();
  body.innerHTML = `<p>Hold DMT on Arbitrum? Connect your wallet and sign a free message: no transaction, no gas, nothing leaves your wallet.</p>${DMT_PERKS}`
    + (ws.length ? `<div class="dmtwallets">${ws.map((w, i) => `<button data-w="${i}">${w.icon ? `<img src="${esc(w.icon)}" alt="">` : ''}Connect <span translate="no">${esc(w.name)}</span></button>`).join('')}</div>`
      : walletChoices(() => {}, 'holder').html)
    + '<p class="dim">The game only reads your public DMT balance (Arbitrum token 0x8B0E…04e8). A check lasts a day.</p>';
  for (const b of body.querySelectorAll('[data-w]')) b.onclick = () => connectDmt(ws[Number(b.dataset.w)]);
}
async function connectDmt(w) {
  w = w || (walletNow() && walletNow().w) || wallets()[0]; if (!w) { $('dmtmsg').textContent = 'No wallet found in this browser.'; return; }
  for (const b of $('dmtbody').querySelectorAll('button')) b.disabled = true;
  try {
    const r = await checkDmt(w, (t) => { $('dmtmsg').textContent = t; });
    $('dmtmsg').textContent = r.pass ? 'You hold DMT. Your perks are on!' : `${short(r.address)} holds no DMT on Arbitrum.`;
  } catch (e) { $('dmtmsg').textContent = why(e); }
  applyDmt(); renderDmt();
}
$('dmtbtn').onclick = () => { $('dmtmsg').textContent = ''; renderDmt(); $('dmt').classList.remove('hidden'); };
$('dmtclose').onclick = () => $('dmt').classList.add('hidden');
$('dmt').addEventListener('click', (e) => { if (e.target.id === 'dmt') $('dmt').classList.add('hidden'); });
// ---- the wallet: one button in the corner (Rabby, MetaMask…), used by DMT perks and ranked ----
const walletIcon = (w) => (w && w.icon ? `<img src="${esc(w.icon)}" alt="">` : '');
let walletConnecting = null;
async function walletConnect(w, owner = null) {
  cancelPendingLoads(); holderChecking = null;
  if (walletConnecting !== owner) { walletConnecting = owner; $('walletmsg').textContent = ''; }
  return requestWallet(w);
}
// a button for each wallet in this browser, or how to get one
function walletChoices(onPick, intent = 'connect') {
  const ws = wallets();
  if (ws.length) return { html: `<p class="dim">Choose your wallet. After approving in the wallet app, switch back to this game.</p><div class="dmtwallets">${ws.map((w, i) => `<button data-w="${i}">${walletIcon(w)}Connect <span translate="no">${esc(w.name)}</span></button>`).join('')}</div>`, bind: (root) => { for (const b of root.querySelectorAll('[data-w]')) b.onclick = () => onPick(ws[Number(b.dataset.w)]); } };
  const html = isPhone()
    ? '<p class="dim">Mobile wallet connections are being configured. Please try again soon.</p>'
    : '<p class="dim">No wallet found in this browser. Install <a href="https://rabby.io" target="_blank" rel="noopener">Rabby</a> or <a href="https://metamask.io/download/" target="_blank" rel="noopener">MetaMask</a>, then reload this page.</p>';
  return { html, bind: () => {} };
}
async function pickWallet(w, msg) {
  if (walletConnecting) return;
  const attempt = walletConnecting = { w };
  try { msg('Approve the connection in your wallet…'); await walletConnect(w, attempt); if (walletConnecting === attempt) msg(''); }
  catch (e) { if (walletConnecting === attempt) msg(why(e)); }
  finally { if (walletConnecting === attempt) walletConnecting = null; }
}
async function refreshBalances(force = false) {
  const c = walletNow(); if (!c) { walletBal = null; return null; }
  try { walletBal = await balances(c.address, force); } catch { walletBal = null; }
  renderWalletChip();
  if (!$('wallet').classList.contains('hidden')) renderWallet();
  if (!$('ranked').classList.contains('hidden')) renderRankedFrom();
  return walletBal;
}
function renderWalletChip() {
  const c = walletNow(), chip = $('walletchip'), pass = savedPass();
  const b = c && walletBal && walletBal.address.toLowerCase() === c.address.toLowerCase() ? walletBal : null;
  chip.classList.toggle('on', !!c);
  chip.classList.toggle('holder', !!(c && pass && pass.address.toLowerCase() === c.address.toLowerCase()));
  chip.innerHTML = c ? `${walletIcon(c.w)}<span>${esc(short(c.address))}</span>${b ? `<b>${esc(fmtDmt(b.dmt))} DMT</b>` : ''}` : 'Connect wallet';
  chip.title = c ? `${c.w.name}: ${c.address}` : 'Connect Rabby, MetaMask or another wallet';
}
function renderWallet() {
  const c = walletNow(), body = $('walletbody'), msg = (t) => { $('walletmsg').textContent = t; };
  if (!c) {
    const ch = walletChoices((w) => pickWallet(w, msg));
    body.innerHTML = buyNoticeHTML() + `<p>Connect once and the game remembers it. Connecting only shares your address: nothing is signed or sent.</p>${ch.html}`;
    ch.bind(body); return;
  }
  const pass = savedPass(), mine = pass && pass.address.toLowerCase() === c.address.toLowerCase();
  const b = walletBal && walletBal.address.toLowerCase() === c.address.toLowerCase() ? walletBal : null;
  body.innerHTML = `<div class="wlhead">${walletIcon(c.w)}<div><b translate="no">${esc(c.w.name)}</b><br><a href="${arbiscanAddress(c.address)}" target="_blank" rel="noopener">${esc(short(c.address))}</a> <button id="wlcopy" class="linkbtn">Copy</button></div></div>`
    + `<div class="wlbal">${b ? `<span><b>${esc(fmtDmt(b.dmt))}</b> DMT</span><span><b>${esc(fmtEth(b.eth))}</b> ETH</span><span class="dim">on Arbitrum</span>` : '<span class="dim">Reading your balances on Arbitrum…</span>'}</div>`
    + (mine ? `<p class="dmtok">DMT perks are on until ${new Date(pass.exp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.</p>`
      : b && b.dmt > 0 ? '<div class="dmtwallets"><button id="wlperks">Turn on DMT perks (free signature)</button></div>'
        : '<p class="dim">Hold DMT on Arbitrum for holder perks. You can buy some below.</p>')
    + buyHTML(b)
    + cloudHTML(c)
    + `<div class="lurow">${rankedWeek && rankedWeek.open ? '<button id="wlranked">Ranked runs</button>' : ''}<button id="wlswitch" class="ghost">Switch wallet</button><button id="wldisc" class="ghost">Disconnect</button></div>`;
  bindCloud(c, msg); bindBuy(c, b, msg);
  $('wlcopy').onclick = async () => { try { await navigator.clipboard.writeText(c.address); msg('Address copied.'); } catch { msg(c.address); } };
  if ($('wlperks')) $('wlperks').onclick = async () => { $('wlperks').disabled = true; try { const r = await checkDmt(c.w, msg); msg(r.pass ? 'You hold DMT. Your perks are on!' : `${short(r.address)} holds no DMT on Arbitrum.`); } catch (e) { msg(why(e)); } applyDmt(); renderWallet(); };
  if ($('wlranked')) $('wlranked').onclick = () => { $('wallet').classList.add('hidden'); openRanked(); };
  $('wlswitch').onclick = () => { const ch = walletChoices((w) => pickWallet(w, msg)); body.innerHTML = `<p>Pick a wallet. For another account in the same wallet, switch accounts inside the wallet.</p>${ch.html}`; ch.bind(body); };
  $('wldisc').onclick = () => { walletDisconnect(); msg('Disconnected.'); };
}
// ---- cloud save on the wallet (src/cloud.js): the same progress on every device ---------------------------------------
let cloudConnecting = null, cloudChoice = null, reloadTimer = 0, runStarting = false, updateAttempt = null, importAttempt = null, holderChecking = null;
const cloudCanLoad = () => mode === 'title' && !runStarting && !rankedBusy && !rankedLive();
const canReloadGame = () => cloudCanLoad() && !buyBusy && !walletConnecting && !holderChecking && !walletModalOpen();
const canManuallyReload = () => canReloadGame() && !cloudConnecting;
function cancelPendingLoads() {
  cloud.cancelPending(); cloudConnecting = null; cloudChoice?.();
  clearTimeout(reloadTimer); reloadTimer = 0;
  if (updateAttempt) { updateAttempt = null; $('updatebtn').textContent = 'Update'; $('updatebtn').disabled = false; }
  if (importAttempt) { importAttempt = null; $('xferload').disabled = false; }
}
async function checkDmt(w, onStep) {
  cancelPendingLoads();
  const attempt = { w, revision: walletRevision(), connecting: false };
  try {
    if (!walletNow() || walletNow().w.p !== w.p) {
      const connecting = walletConnect(w);
      attempt.connecting = true; holderChecking = attempt;
      await connecting;
      if (holderChecking !== attempt) throw Error('Wallet check cancelled.');
    } else holderChecking = attempt;
    attempt.connecting = false; attempt.revision = walletRevision();
    const current = () => {
      if (holderChecking !== attempt || walletNow()?.w.p !== w.p || walletRevision() !== attempt.revision) throw Error('Wallet check cancelled.');
    };
    const result = await prove(w, BASE, text => { current(); onStep(text); }, current);
    current(); return result;
  } finally { if (holderChecking === attempt) holderChecking = null; }
}
function queuePageReload(text, delay) {
  if (!canReloadGame()) return;
  clearTimeout(reloadTimer); banner(text, 3000);
  reloadTimer = setTimeout(() => { reloadTimer = 0; if (canReloadGame()) location.reload(); }, delay);
}
const cloud = createCloud(BASE, {
  canLoad: cloudCanLoad,
  canSave: () => mode !== 'recovery',
  choose: (wal, dev) => new Promise((done) => {
    const revision = walletRevision();
    let settled = false;
    const line = (s) => `${s.coins.toLocaleString()} coins · ${s.maps} map${s.maps === 1 ? '' : 's'} cleared · ${s.ranks} skill rank${s.ranks === 1 ? '' : 's'} · ${s.gear} gear`;
    $('cloudwal').textContent = line(wal); $('clouddev').textContent = line(dev); $('cloudpick').classList.remove('hidden');
    const pick = (v) => { if (settled) return; settled = true; cloudChoice = null; stop(); $('cloudpick').classList.add('hidden'); done(v); };
    cloudChoice = () => pick(null);
    const stop = onWallet(() => { if (walletRevision() !== revision) pick(null); });
    $('cloudusewal').onclick = () => pick('cloud'); $('cloudusedev').onclick = () => pick('device');
    $('cloudusewal').focus();
  }),
  note: (t) => banner(t, 4000),
  reload: () => queuePageReload('Loading your progress from your wallet…', 500),
});
onSaved = (k) => { if (CLOUD_KEYS.includes(k)) cloud.changed(); };
const cloudFor = (c) => { const s = cloud.state(); return s && c && s.a.toLowerCase() === c.address.toLowerCase() ? s : null; };
function cloudHTML(c) {
  const s = cloud.state(), on = cloudFor(c);
  if (on) return `<div class="wlcloud"><p class="dmtok">Cloud save is on: your progress follows this wallet to any device.</p><div class="lurow"><button id="wlcloudnow" class="ghost">Save now</button><button id="wlcloudoff" class="ghost">Turn off here</button></div></div>`;
  return `<div class="wlcloud"><p>${s ? `This device saves to ${esc(short(s.a))}. ` : ''}Keep your progress on this wallet and play the same save on your laptop, desktop and phone.</p><button id="wlcloud">Turn on cloud save (free signature)</button></div>`;
}
function bindCloud(c, msg) {
  const revision = walletRevision(), sessionKey = cloudFor(c)?.key;
  const live = () => { const now = walletNow(); return walletRevision() === revision && now && now.w.p === c.w.p && now.address.toLowerCase() === c.address.toLowerCase(); };
  const signing = () => cloudConnecting && cloudConnecting.revision === revision && cloudConnecting.p === c.w.p && cloudConnecting.address === c.address.toLowerCase();
  const button = $('wlcloud');
  if (button) {
    button.disabled = !!signing();
    button.onclick = async () => {
      if ($('wlcloud') !== button || !live() || signing()) return;
      cancelPendingLoads();
      const attempt = cloudConnecting = { p: c.w.p, address: c.address.toLowerCase(), revision };
      button.disabled = true;
      const note = text => { if (cloudConnecting === attempt && live()) msg(text); };
      try { const r = await cloud.signIn(c, note); if (cloudConnecting === attempt && live()) { note(r === 'loaded' ? 'Loading the progress saved on this wallet…' : r === 'pending' ? 'Progress is saved on this device. Upload is not confirmed yet; temporary failures retry automatically.' : 'Cloud save is on.'); renderWallet(); } }
      catch (e) { note(why(e)); if (cloudConnecting === attempt && live() && !cloud.state() && $('wlcloudnow')) renderWallet(); }
      finally { if (cloudConnecting === attempt) { cloudConnecting = null; if ($('wlcloud')) $('wlcloud').disabled = false; } }
    };
  }
  const save = $('wlcloudnow'), off = $('wlcloudoff');
  const sameSession = () => live() && sessionKey && cloud.state()?.key === sessionKey;
  if (save) save.onclick = async () => { if ($('wlcloudnow') !== save || !sameSession()) return; msg('Saving…'); const saved = await cloud.push(true); if (live() && (cloud.state()?.key === sessionKey || !cloud.state() && $('wlcloudnow') === save)) msg(saved ? 'Saved to your wallet.' : cloud.state() ? 'Progress is saved on this device. Upload is not confirmed yet; temporary failures retry automatically.' : 'Cloud save is signed out. Sign in again to upload your progress.'); };
  if (off) off.onclick = () => { if ($('wlcloudoff') !== off || !sameSession()) return; cloudConnecting = null; cloud.signOut(); msg('Cloud save is off on this device. Your saved progress stays on the wallet.'); renderWallet(); };
}
// open the game or come back to it: a newer save from another device loads (only between runs)
const cloudPull = async () => { if (!cloud.state() || !cloudCanLoad()) return; if (await cloud.pull()) queuePageReload('Loading your progress from your other device…', 600); else cloud.changed(); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudPull(); else if (cloud.state()) cloud.push(true); });
setTimeout(cloudPull, 1500);
// ---- buy DMT with ETH without leaving the game (src/swap.js: KyberSwap, checked before the wallet sees it) -------------
let buyWant = 0, buyQuote = null, buyBusy = null, buyPriceRequest = 0, buyNotice = null; // requested DMT, visible quote and this page's swap state
const BUY_AMOUNTS = [[0.5, '1 entry'], [2.5, '5 entries'], [5, '10 entries'], [1.5, '1 Hard entry']];
function buyHTML(b) {
  const amts = buyWant && !BUY_AMOUNTS.some(([d]) => d === buyWant) ? [[buyWant, 'what you need'], ...BUY_AMOUNTS] : BUY_AMOUNTS;
  return `<div class="wlbuy"><p><b>Buy DMT</b> <span class="dim">with ETH on Arbitrum, in one step</span></p><div class="lurow">${amts.map(([d, l]) => `<button class="ghost wlbuyamt${d === buyWant ? ' on' : ''}" data-dmt="${d}">${d} DMT <small>${l}</small></button>`).join('')}</div><div id="wlbuyq" class="dim">${buyNoticeHTML() || (b && b.eth < ETH_FOR_GAS ? `You need ETH on Arbitrum to buy with. <a href="${BRIDGE}" target="_blank" rel="noopener">Bridge ETH</a>` : 'Swaps through KyberSwap at the best DMT price. The game takes no fee.')}</div></div>`;
}
function bindBuy(c, b, msg) {
  const box = $('wlbuyq'); if (!box) return;
  if (buyQuote && (buyQuote.p !== c.w.p || buyQuote.address !== c.address.toLowerCase() || buyQuote.revision !== walletRevision() || buyQuote.request !== buyPriceRequest)) buyQuote = null;
  const live = (revision) => $('wlbuyq') === box && walletNow() === c && walletRevision() === revision;
  const report = (text, tx) => {
    const hash = typeof tx === 'string' && /^0x[\da-f]{64}$/i.test(tx) ? tx : null;
    buyNotice = { address: c.address, text, tx: hash };
    msg(`Swap for ${short(c.address)}: ${text}${hash ? ' · ' + arbiscanTx(hash) : ''}`);
    const target = $('wlbuyq'); if (target) target.innerHTML = buyNoticeHTML();
  };
  const show = (q, revision = walletRevision()) => {
    if (!live(revision)) return;
    if (buyBusy) { box.textContent = `Swap for ${short(buyBusy.address)}: A swap is already pending. Check your wallet activity.`; return; }
    const short2 = b && b.eth < q.ethIn + ETH_FOR_GAS;
    box.className = ''; box.innerHTML = buyNoticeHTML() + `<p>About <b>${q.dmtOut} DMT</b> for ${q.ethIn.toFixed(5)} ETH${q.usdIn ? ` (about $${q.usdIn.toFixed(2)})` : ''}${q.loss != null ? ` · ${(q.loss * 100).toFixed(1)}% to the pool and fees` : ''}. You get at least ${q.minOut} DMT, or the swap does not happen.</p>`
      + (short2 ? `<p class="rkwarn">Not enough ETH on Arbitrum for that. <a href="${BRIDGE}" target="_blank" rel="noopener">Bridge ETH</a></p>` : `<button id="wlbuygo">Buy ${q.dmtOut} DMT</button>`);
    const go = $('wlbuygo');
    if (go) go.onclick = async () => {
      if (buyBusy) return;
      if ($('wlbuygo') !== go || buyQuote?.q !== q || buyQuote.request !== buyPriceRequest) return;
      if (!live(revision)) { msg('Wallet changed. Get a new quote before buying.'); return; }
      cancelPendingLoads(); buyBusy = c;
      go.disabled = true;
      let submitted = false;
      try {
        const r = await buyDmt(c.w, c.address, q, (text) => { if (live(revision)) msg(text); });
        submitted = true; buyQuote = null; buyWant = 0;
        report('Confirmed. Check that wallet.', r.tx); refreshBalances(true);
      } catch (e) {
        const tx = typeof e.tx === 'string' && /^0x[\da-f]{64}$/i.test(e.tx) ? e.tx : null;
        submitted = !!tx || e.uncertain === true;
        if (submitted) { buyQuote = null; buyWant = 0; report(e.message, tx); }
        else if (live(revision)) { msg(why(e)); if ($('wlbuygo') === go) go.disabled = false; }
      } finally { buyBusy = null; if (!live(revision) && !submitted) renderWallet(); }
    };
  };
  for (const btn of document.querySelectorAll('.wlbuyamt')) btn.onclick = async () => {
    if (buyBusy) { msg(`Swap for ${short(buyBusy.address)}: A swap is already pending. Check your wallet activity.`); return; }
    if (walletNow() !== c || $('wlbuyq') !== box) return;
    const request = ++buyPriceRequest, revision = walletRevision();
    buyQuote = null; buyWant = Number(btn.dataset.dmt);
    for (const o of document.querySelectorAll('.wlbuyamt')) o.classList.toggle('on', o === btn);
    box.className = 'dim'; box.textContent = 'Getting a price…';
    try { const quote = await quoteDmt(Number(btn.dataset.dmt)); if (request === buyPriceRequest && live(revision)) { buyQuote = { q: quote, p: c.w.p, address: c.address.toLowerCase(), revision, request }; show(quote, revision); } }
    catch (e) { if (request === buyPriceRequest && live(revision)) box.textContent = e.message; }
  };
  if (buyWant) { const pre = document.querySelector(`.wlbuyamt[data-dmt="${buyWant}"]`); if (pre && !buyQuote) pre.click(); else if (buyQuote) show(buyQuote.q, buyQuote.revision); }
}
function buyNoticeHTML() {
  if (!buyNotice) return '';
  return `<p>Swap for ${esc(short(buyNotice.address))}: ${esc(buyNotice.text)}${buyNotice.tx ? ` <a href="${arbiscanTx(buyNotice.tx)}" target="_blank" rel="noopener">See it on Arbiscan</a>` : ''}</p>`;
}
function openWallet() { $('walletmsg').textContent = ''; renderWallet(); $('wallet').classList.remove('hidden'); $('walletclose').focus(); refreshBalances(true); }
function refreshWalletChoices() {
  if (!$('wallet').classList.contains('hidden') && !walletConnecting) renderWallet();
  if (!$('dmt').classList.contains('hidden') && !$('dmtbody').querySelector('button:disabled')) renderDmt();
  if (!$('ranked').classList.contains('hidden') && !walletNow() && !rankedBusy && $('rankedwallets').hasChildNodes()) showRankedWalletChoices();
}
function resumeWalletHandoff(handoff) {
  if (!handoff) return;
  // Opening a panel is safe after an app switch. Connecting/signing still needs a fresh, explicit button tap.
  if (handoff.intent === 'connect') openWallet();
  else if (handoff.intent === 'holder') { $('dmtmsg').textContent = ''; renderDmt(); $('dmt').classList.remove('hidden'); }
  else if (handoff.intent === 'ranked') { openRanked(); if (!walletNow()) showRankedWalletChoices(); }
}
$('walletchip').onclick = openWallet;
$('walletclose').onclick = () => { $('wallet').classList.add('hidden'); (!$('ranked').classList.contains('hidden') ? $('rankedclose') : $('walletchip')).focus(); };
$('wallet').addEventListener('click', (e) => { if (e.target.id === 'wallet') $('walletclose').click(); });
onWallet((c) => {
  if (holderChecking && (!c || c.w.p !== holderChecking.w.p || !holderChecking.connecting && walletRevision() !== holderChecking.revision)) holderChecking = null;
  if (walletConnecting && (!c || c.w.p !== walletConnecting.w.p)) { walletConnecting = null; $('walletmsg').textContent = ''; }
  walletBal = null; applyDmt();
  if (!$('wallet').classList.contains('hidden')) renderWallet();
  if (!$('ranked').classList.contains('hidden')) renderRanked();
  refreshBalances();
});
function renderWalletConnect(state) {
  const screen = $('walletlink'), qr = $('walletlinkqr'), canvas = $('walletlinkcanvas');
  screen.classList.toggle('hidden', !state); qr.classList.toggle('hidden', state?.phase !== 'pair');
  canvas.width = canvas.height = 0;
  if (!state) { if (screen.contains(document.activeElement)) navScreen()?.querySelector('button, a[href]')?.focus(); return; }
  $('walletlinktext').textContent = state.phase === 'pair' ? 'Open your wallet to approve this connection, then switch back to this app. Your game stays here.' : 'Approve the request in your connected wallet, then switch back to this app. Your game stays here.';
  $('walletlinkapps').innerHTML = walletConnectLinks(state.phase === 'pair' ? state.uri : null).map(([name, url]) => `<a class="btnlink" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open ${name}</a>`).join('');
  $('walletlinkback').textContent = state.phase === 'pair' ? 'Cancel connection' : 'Back to game';
  $('walletlinkapps').querySelector('a')?.focus();
  if (state.phase === 'pair') {
    $('walletlinkqrtext').textContent = 'Scan with any WalletConnect wallet';
    import('qrcode').then(({default: encoder}) => {
      if (walletConnectState() === state) return encoder.toCanvas(canvas, state.uri, { width: 256, margin: 4 });
    }).catch(() => { if (walletConnectState() === state) $('walletlinkqrtext').textContent = 'QR code unavailable. Use a wallet button above.'; });
  }
}

watchWalletConnect(renderWalletConnect);
$('walletlinkback').onclick = () => { if (walletConnectState()?.phase === 'pair') cancelWalletConnect(); else dismissWalletConnect(); };
renderWalletChip(); walletRestore();
watchWallets(refreshWalletChoices);
resumeWalletHandoff(walletHandoff);
// Tip in ETH (only when an address is set in src/config.js)
const tipOk = /^0x[0-9a-fA-F]{40}$/.test(TIP_ETH) || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i.test(TIP_ETH);
if (tipOk) { $('tipwrap').classList.remove('hidden'); $('tipaddr').textContent = TIP_ETH; }
$('tipbtn').onclick = () => { $('tipmsg').textContent = ''; $('tip').classList.remove('hidden'); };
$('tipclose').onclick = () => $('tip').classList.add('hidden');
$('tip').addEventListener('click', (e) => { if (e.target.id === 'tip') $('tip').classList.add('hidden'); });
$('tipcopy').onclick = async () => {
  try { await navigator.clipboard.writeText(TIP_ETH); $('tipmsg').textContent = 'Copied. Thank you!'; }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('tipaddr')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); $('tipmsg').textContent = 'Selected: copy it with your keyboard or long-press.'; }
};
$('tipwallet').onclick = () => { location.href = 'ethereum:' + TIP_ETH; };
$('lbname').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submitScore(); });
// bug reports
const openBug = () => { $('bugmsg').textContent = ''; $('bug').classList.remove('hidden'); setTimeout(() => $('bugtext').focus(), 50); };
$('bugbtn').onclick = openBug; $('bugbtn2').onclick = openBug;
$('bugclose').onclick = () => $('bug').classList.add('hidden');
$('bugtext').addEventListener('keydown', (e) => e.stopPropagation());
$('bugsend').onclick = async () => {
  const text = $('bugtext').value.trim(); if (text.length < 3) { $('bugmsg').textContent = 'Write a few words first.'; return; }
  $('bugsend').disabled = true; $('bugmsg').textContent = 'Sending…';
  try {
    const r = await fetch(`${BASE}api/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, map: sim ? sim.map.id : selMap, adv: sim ? sim.players[0].adv : selAdv, v: LATEST, settings: renderer.getSettings(), errors: recentErrors }) });
    if (r.ok) { $('bugmsg').textContent = 'Thanks, it was sent.'; $('bugtext').value = ''; }
    else $('bugmsg').innerHTML = r.status === 503 ? `Reports open soon. Until then, message <a href="${CREATOR.x}" target="_blank" rel="noopener">@${CREATOR.handle}</a> on X.` : r.status === 429 ? 'One report a minute, please.' : 'Could not send.';
  } catch (e) { $('bugmsg').textContent = 'Could not send.'; }
  $('bugsend').disabled = false;
};

// ---- quests ------------------------------------------------------------------------------------------------------------
function buildQuests() {
  const st = getStats(), done = questsDone();
  $('questlist').innerHTML = QUESTS.map((q) => {
    const v = Math.min(q.goal, statVal(st, q.stat)), ok = done.has(q.id);
    return `<div class="quest${ok ? ' done' : ''}"><div class="qhead"><b>${q.name}</b><span>${ok ? 'Complete' : `${v.toLocaleString()} / ${q.goal.toLocaleString()}`}</span></div><p>${q.text}</p><div class="qbar"><i style="width:${(v / q.goal) * 100}%"></i></div><div class="qreward">${imgTag('Gold')} ${q.coins} coins${q.item ? ` · ${imgTag(q.item)} ${q.item}` : ''}</div></div>`;
  }).join('');
}
$('questbtn').onclick = () => { buildQuests(); $('quests').classList.remove('hidden'); };
$('questclose').onclick = () => $('quests').classList.add('hidden');

// small notes that slide in during a run (casket loot)
function toast(html) { const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = html; $('toasts').appendChild(el); setTimeout(() => el.remove(), 4200); }

// ---- run lifecycle ----------------------------------------------------------------------------------------------------
let runTicket = null;
function runGround() {
  const T = renderer.terrain;
  return T ? { n: T.cell ? T.cells : T.n, blocked: T.blocked, cell: !!T.cell, water: T.water || null, walls: T.walls || null, fences: T.fences || null } : null;
}
async function startRun(live = null) {
  if (runStarting || mode === 'recovery') return;
  if (!live?.run && (rankedLive() || rankedPlaying())) { openRanked(); return; }
  const isRanked = !!live?.run;
  if (isRanked && live.sim !== SIM_ID) return;
  cancelPendingLoads(); runStarting = true;
  try {
    if (isRanked && loadedMapId !== live.map) await pickMap(live.map);
    rankedRun = isRanked ? live : null; rankedRec = null;
    runTicket = null; if (!isRanked) fetch(`${BASE}api/run`).then((r) => (r.ok ? r.json() : null)).then((d) => { runTicket = d && d.ticket; }).catch(() => {});
    preloadIcons([...Object.keys(WEAPONS).map((w) => weaponItem(w, 1)), ...Object.keys(PASSIVES).map((k) => passiveItem(k, 1))]);
    if (mapLoading) return;
    const map = MAP_BY_ID[isRanked ? live.map : selMap];
    if (loadedMapId !== map.id) await pickMap(map.id);
    audio.init().then(() => audio.music(map.music)).catch(() => {});
    const seed = Number(params.get('seed')) || (Math.random() * 1e9) | 0;
    const adv = runAdv(), forced = adv.id !== selAdv;
    const gear = isRanked || forced ? {} : getGear();
    await renderer.preloadGear(Object.values(gear));
    if (isRanked) {
      const restored = await resumeRankedAsync(live.log, { seed: live.seed, mapId: live.map, adv: live.adv, ground: runGround(), ...liveRace(live) },
        (done, all) => rankedMessage(`Restoring your ranked run: ${fmtT(done / 30)} of ${fmtT(all / 30)}…`));
      sim = restored.sim; rankedRec = restored.rec; persistRanked();
      $('updatebtn').classList.add('hidden'); $('rankedupdate').classList.add('hidden'); renderer.setAura(false);
    } else sim = createSim({ seed, map, hard: hardOn, endless: endlessOn, meta: getSkills(), ground: runGround(), players: [{ id: PLAYER, name: 'You', adv: adv.id, weapon: params.get('weapon') || adv.weapon, gear, gearLv: forced ? {} : getGearLv() }] });
    renderer.reset(); renderer.setZoom(1); renderer.setShift(0); renderer.setYaw(0); acc = 0; selCard = 0; slotCache.b = null;
    for (const id of ['title', 'end', 'pause', 'levelup', 'casket', 'skills', 'gear', 'quests', 'settings', 'updates', 'board', 'bug', 'tip', 'dmt', 'ranked']) $(id).classList.add('hidden');
    $('hud').classList.remove('hidden'); mode = 'play'; shownPending = false;
    waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden'); clearTouch();
    $('quit').disabled = isRanked; $('quit').textContent = isRanked ? 'Ranked runs can be paused' : 'Quit run'; pendingUse = null; slowmo = 0; if (isRanked) keys.clear();
    if (isRanked && sim.pending[PLAYER]) showLevelUp();
    runBest = isRanked ? null : (getBests()[bestKey(sim)] || null); passedBest = false; chase = null;
    if (isRanked && rankedWeek) { // the board as it stood when you entered, without your own wallet's run
      const race = raceOf(rankedWeek, liveRace(live).mode), me = (walletNow() && walletNow().address || '').toLowerCase();
      chase = { rows: ((race && race.rows) || []).filter((r) => String(r.wallet || '').toLowerCase() !== me).map((r) => ({ t: Number(r.t) || 0, kills: Number(r.kills) || 0 })), kp: kpmWeek(liveRace(live).week) };
    }
    const goalText = isRanked && sim.endless ? `: endless, scored by ${kpmWeek(liveRace(live).week) ? 'kills per minute' : 'time survived'}. The hunt is over at ${fmtT(sim.endAt)}` : !isRanked && endlessOn ? '' : `: last ${Math.floor(map.length / 60)}:00 or slay ${slayName(map, map.finalBoss)}`;
    banner(`${isRanked ? `Ranked ·${sim.hard ? ' Hard ·' : ''}` : endlessOn ? 'Endless' : 'Survive'} ${map.name}${!isRanked && hardOn ? ' (hard)' : ''}${goalText}`, 4500);
  } finally { runStarting = false; }
}
let bannerT = 0;
function banner(text, ms = 2500) { const b = $('banner'); b.textContent = text; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), ms); }

// the coins (GP) a run has earned so far; the HUD shows it live and the end screen adds the 120 for holding the map
function runCoins(s, won = false) {
  const p = s.players[0], endlessBonus = s.endless ? Math.floor(Math.max(0, s.t - s.map.length) / 10) : 0, dmtOn = !!savedPass();
  return Math.round((Math.floor(s.kills / 6) + p.coins * 3 + (won ? 120 : 0) + endlessBonus) * playerStats(p).coinBonus * (s.hard ? 1.25 : 1) * (dmtOn ? 1 + DMT_COIN_BONUS : 1)) + Math.max(0, Math.floor(p.alch || 0));
}
function endRun() {
  mode = 'end';
  waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden');
  const wasRanked = !!rankedRun;
  const won = sim.over === 'win';
  const p = sim.players[0];
  const prev = load('sq-best', null);
  const runRecord = { t: Math.floor(sim.t), level: sim.level, kills: sim.kills, won };
  if (betterRun(prev, runRecord) === runRecord) save('sq-best', runRecord);
  let unlockNote = '';
  if (won) {
    const cl = clearedMaps(), before = cl.size; cl.add(sim.map.id); save('sq-cleared', [...cl]);
    const idx = MAPS.findIndex((m) => m.id === sim.map.id), next = sim.map.special ? null : MAPS.slice(idx + 1).find((m) => !m.special);
    if (cl.size > before && next) unlockNote = ` · ${next.name} unlocked`;
    for (const a of ADVENTURERS) if (a.unlock === cl.size && cl.size > before) unlockNote += ` · ${a.name} unlocked`;
  }
  lastRun = { map: sim.map.id, t: Math.floor(sim.t), kills: sim.kills, level: sim.level, adv: sim.players[0].adv, won, hard: !!sim.hard, endless: !!sim.endless, v: LATEST, sent: false, ticket: runTicket };
  $('lbsubmit').disabled = wasRanked; $('lbmsg').textContent = '';
  $('endlb').classList.toggle('hidden', wasRanked || $('lbbtn').classList.contains('hidden'));
  $('rankedresult').textContent = ''; $('rankedretry').classList.add('hidden');
  if (wasRanked) { lastRun.sent = true; lastRun.ranked = true; lastRun.race = sim.hard ? 'hard' : 'normal'; if (sim.endless && kpmWeek(liveRace(rankedRun).week)) lastRun.kpm = kpm(sim.kills, Math.floor(sim.t)); } // week 0 ranks by time
  $('again').textContent = wasRanked ? 'Next ranked run' : 'Run it back'; // after ranked, play again goes back to Ranked (a free casual run was mistaken for ranked)
  if (!wasRanked && load('sq-name', '') && sim.t >= 30) setTimeout(submitScore, 300); // named players send runs of 30 s or more automatically
  const dmtOn = !!savedPass(); // DMT holders: +25% coins
  // high alch coins are added as the casket card promised them, after the multipliers
  const alchCoins = Math.max(0, Math.floor(p.alch || 0));
  const earned = runCoins(sim, won);
  save('sq-coins', getCoins() + earned);
  // caskets opened this run go to the bank (the collection), worn or high alched; a duplicate you kept is sold, one you
  // high alched already paid its coins
  const worn = sim.players[0].gear || {}, alched = [...(sim.alched || [])];
  const lootNotes = sim.loot.map((n) => {
    const ai = alched.indexOf(n), wasAlched = ai >= 0; if (wasAlched) alched.splice(ai, 1);
    // weapon metals and arrows are for the run they dropped in: never banked, never sold
    if (isWeaponItem(n)) return `${imgTag(n)} ${n} <em>${wasAlched ? `high alched, +${alchValue(n)}` : 'this run only'}</em>`;
    const fresh = bankItem(n, !wasAlched), on = Object.values(worn).includes(n);
    return `${imgTag(n)} ${n} <em>${wasAlched ? `high alched, +${alchValue(n)}${fresh ? ', new' : ''}` : on ? (fresh ? 'worn this run, new' : 'worn this run') : fresh ? 'new' : 'sold, +25 coins'}</em>`;
  });
  // casket gear stays in your collection (the Gear panel) but is not worn next run: every run starts with only what you
  // chose in the Gear panel (owner 3 Nov: "my casket gear from the last run is still on my character should be reset every run")
  // lifetime stats, then quests
  const st = getStats(), add = (k, v) => { st[k] = (st[k] || 0) + v; };
  add('kills', sim.kills); add('bosses', sim.bossKills); add('evolves', sim.evolves); add('caskets', sim.loot.length);
  for (const [ty, n] of Object.entries(sim.killsByType)) add('kills.' + ty, n);
  add('kills.spiders', (sim.killsByType.spider || 0) + (sim.killsByType.jspider || 0) + (sim.killsByType.pspider || 0));
  add('dragons', sim.killsByType.dragon || 0);
  st.bestTime = Math.max(st.bestTime || 0, Math.floor(sim.t)); st.cleared = clearedMaps().size;
  save('sq-stats', st);
  const done = questsDone(), questNotes = [];
  for (const q of QUESTS) {
    if (done.has(q.id) || statVal(st, q.stat) < q.goal) continue;
    done.add(q.id); save('sq-coins', getCoins() + q.coins);
    if (q.item) bankItem(q.item);
    questNotes.push(`Quest complete: <b>${q.name}</b> · +${q.coins} coins${q.item ? ` · ${imgTag(q.item)} ${q.item}` : ''}`);
  }
  save('sq-quests', [...done]);
  // damage by weapon, Run Escape style
  const dmgRows = Object.entries(sim.dmgBy || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6), top = dmgRows.length ? dmgRows[0][1] : 1;
  const wname = (id) => (WEAPONS[id] ? weaponDisplay(id, p.weapons[id] || 1, p.evo[id], stepOf(id, p)).name : id === 'pumpkin' ? 'Pumpkin bombs' : 'Other');
  const wicon = (id) => (WEAPONS[id] ? iconHTML('weapon', id, p.weapons[id] || 1, p.evo[id], stepOf(id, p)) : imgTag(id === 'pumpkin' ? 'Pumpkin' : 'Gold'));
  $('enddmg').innerHTML = dmgRows.map(([id, v]) => `<div class="drow">${wicon(id)}<span>${wname(id)}</span><div class="dbar"><i style="width:${(v / top) * 100}%"></i></div><b>${Math.round(v).toLocaleString()}</b></div>`).join('');
  $('endloot').innerHTML = (lootNotes.length ? `<div class="lootline"><b>Caskets</b> ${lootNotes.join(' · ')}</div>` : '') + questNotes.map((x) => `<div class="questline">${x}</div>`).join('');
  buildMaps(); buildAdventurers(); showBest();
  $('endtitle').textContent = won ? `${sim.map.name} holds!` : sim.over === 'time' ? `The hunt is over at ${fmtT(sim.endAt)}` : sim.endless && sim.t >= sim.map.length ? `Endless: ${fmtT(sim.t)}` : `You fell in ${sim.map.name}`;
  const kpmNote = wasRanked && lastRun.kpm != null ? ` · ${lastRun.kpm.toFixed(2)} kills per minute${lastRun.t < RANKED.minSeconds ? ` (too short to place: runs need ${fmtT(RANKED.minSeconds)})` : ''}` : '';
  let bestNote = '';
  if (!wasRanked) {
    const all = getBests(), k = bestKey(sim), b = all[k];
    if (betterRun(b, runRecord) === runRecord) { all[k] = runRecord; save('sq-bests', all); bestNote = b ? ` · new best (was ${fmtT(b.t)})!` : ''; }
    else bestNote = sim.t < b.t ? ` · ${fmtT(b.t - sim.t)} short of your best (${fmtT(b.t)})` : ` · best ${fmtT(b.t)}`;
  }
  $('endtext').textContent = `Survived ${fmtT(sim.t)} · level ${sim.level} · ${sim.kills} monsters slain${kpmNote}${bestNote}${unlockNote}`;
  $('endcoins').innerHTML = `${imgTag('Gold')} +${earned} coins${alchCoins ? ` <em class="alchnote">incl. ${alchCoins} from high alch</em>` : ''}${dmtOn ? ' <em class="dmtnote">DMT +25%</em>' : ''}`;
  $('end').classList.remove('hidden');
  if (wasRanked) { rankedRun.ended = true; persistRanked(); submitRanked(); }
}
function toMenu() {
  if (rankedPlaying()) return;
  rankedRun = null; rankedRec = null; applyDmt();
  sim = null; mode = 'title'; window.__idleSim = null;
  waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden');
  for (const id of ['end', 'pause', 'levelup', 'casket', 'hud']) $(id).classList.add('hidden');
  $('hud').classList.add('hidden'); $('title').classList.remove('hidden'); renderer.reset(); renderer.setZoom(0.45); renderer.setShift(2.4);
  buildAdventurers(); buildMaps(); showBest();
}

// ---- input ------------------------------------------------------------------------------------------------------------------
const MENU_SCREENS = ['cloudpick', 'wallet', 'ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests'];
addEventListener('keydown', (e) => {
  if (mode === 'recovery' || walletModalOpen()) return;
  if (e.target?.matches?.('input, textarea, select, summary, [contenteditable="true"]')) return;
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if ((k === 'enter' || k === ' ') && e.target?.matches?.('button, a[href]')) return;
  keys.add(k);
  if (mode === 'casket') {
    if (k === '1' || k === '2') pickCasket(Number(k) - 1);
    else if (k === 'arrowleft' || k === 'a' || k === 'arrowup' || k === 'w') { selCard = 0; markCasket(); }
    else if (k === 'arrowright' || k === 'd' || k === 'arrowdown' || k === 's') { selCard = 1; markCasket(); }
    else if (k === 'enter' || k === ' ') pickCasket(selCard);
    return;
  }
  if (mode === 'levelup') {
    if (k === '1' || k === '2' || k === '3') pick(Number(k) - 1);
    else if (k === 'arrowleft' || k === 'a') { selCard = (selCard + 2) % 3; markCard(); }
    else if (k === 'arrowright' || k === 'd') { selCard = (selCard + 1) % 3; markCard(); }
    else if (k === 'enter' || k === ' ') pick(selCard);
    else if (k === 'r') doReroll();
    else if (k === 'x') doSkip();
    return;
  }
  if (k === 'm') { audio.setMuted(!audio.muted); banner(audio.muted ? 'Sound off' : 'Sound on', 900); }
  if (mode === 'play' && k >= '1' && k <= '4') pendingUse = Number(k) - 1;
  if (mode === 'play' && k === ' ') { hop(); e.preventDefault(); } // a hop, just for the look (owner 3 Nov: "jump is a vanity thing")
  if (k === 'escape' && !navBack() && mode === 'play') pause(true);
  if ((k === 'enter' || k === ' ') && (mode === 'title' && !$('start').disabled || mode === 'end') && MENU_SCREENS.every((id) => $(id).classList.contains('hidden'))) startRun();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); clearTouch(); if (mode === 'play') pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { keys.clear(); clearTouch(); if (mode === 'play') pause(true); } });
function pause(on) { clearTouch(); audio.duck(on); mode = on ? 'pause' : 'play'; $('pause').classList.toggle('hidden', !on); }
$('start').onclick = startRun; $('again').onclick = () => { if (lastRun && lastRun.ranked) { toMenu(); openRanked(); } else startRun(); }; $('resume').onclick = () => pause(false); $('tomenu').onclick = toMenu;
$('quit').onclick = () => { if (rankedPlaying()) return; pause(false); sim.over = 'dead'; };

// touch: drag anywhere on the field to move (a stick appears under your thumb); the II button pauses
const touch = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
let waitingForMove = false;
const isTouchUI = matchMedia('(pointer: coarse)').matches;
if (isTouchUI) document.body.classList.add('touch');
// ---- installable app (PWA) ----
const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
if (standalone) document.body.classList.add('standalone');
if ('serviceWorker' in navigator && import.meta.env.PROD && !location.search.includes('qa')) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
let installEvt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('installbtn').classList.remove('hidden'); });
addEventListener('appinstalled', () => { installEvt = null; $('installbtn').classList.add('hidden'); });
const iOSBrowser = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (iOSBrowser && !standalone) $('installbtn').classList.remove('hidden');
$('installbtn').onclick = async () => {
  if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); if (r && r.outcome === 'accepted') $('installbtn').classList.add('hidden'); installEvt = null; return; }
  $('installbtn').textContent = 'Tap Share, then Add to Home Screen';
};
// a newer version on the site: offer to load it (the page itself is never cached for long, but an open tab or the
// installed app can sit on an old build for hours)
const BUILD = import.meta.env.VITE_BUILD || 'dev';
async function checkForUpdate() {
  if (BUILD === 'dev' || !canManuallyReload()) return;
  try {
    const r = await fetch('/version.json', { cache: 'no-store' }); if (!r.ok) return;
    const d = await r.json(); if (canManuallyReload() && d && d.build && d.build !== BUILD) $('updatebtn').classList.remove('hidden');
  } catch { /* offline */ }
}
$('updatebtn').onclick = async () => {
  if (updateAttempt) return;
  if (!canManuallyReload()) { banner('Finish your run or wallet action before updating.', 3000); return; }
  cancelPendingLoads();
  const attempt = updateAttempt = {}, current = () => updateAttempt === attempt && canManuallyReload();
  $('updatebtn').textContent = 'Updating…'; $('updatebtn').disabled = true;
  try {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
      if (!current()) return;
      await Promise.all(regs.map((g) => g.update().catch(() => {})));
    } catch { /* no service worker */ }
    if (!current()) return;
    try {
      const keys = await caches.keys();
      if (!current()) return;
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch { /* no cache storage */ }
    if (current()) location.reload();
  } finally {
    if (updateAttempt === attempt) { updateAttempt = null; $('updatebtn').textContent = 'Update'; $('updatebtn').disabled = false; }
  }
};
checkForUpdate(); setInterval(() => { if (mode === 'title') checkForUpdate(); }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'title') checkForUpdate(); });
// folding or rotating the phone: keep the run going, just re-fit the view
addEventListener('orientationchange', () => setTimeout(() => dispatchEvent(new Event('resize')), 250));
const stickEl = $('stick'), knob = stickEl.firstElementChild, STICK_R = 56;
function clearTouch() { touch.id = null; touch.x = touch.y = 0; stickEl.classList.add('hidden'); }
addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || mode !== 'play' || touch.id !== null) return;
  if (e.target.closest('button, .panel, #menu, #belt')) return;
  touch.id = e.pointerId; touch.ox = e.clientX; touch.oy = e.clientY; touch.x = 0; touch.y = 0;
  stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; knob.style.transform = 'translate(-50%,-50%)'; stickEl.classList.remove('hidden');
});
addEventListener('pointermove', (e) => {
  if (e.pointerId !== touch.id) return;
  let dx = e.clientX - touch.ox, dy = e.clientY - touch.oy; const d = Math.hypot(dx, dy);
  if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
  touch.x = dx / STICK_R; touch.y = dy / STICK_R;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
});
const endTouch = (e) => { if (e.pointerId === touch.id) clearTouch(); };
addEventListener('pointerup', endTouch); addEventListener('pointercancel', endTouch);
$('pausebtn').onclick = () => { if (mode === 'play') pause(true); };
const hop = () => { if (!renderer || !renderer.hop) return; renderer.hop(); audio.play('choose', { minGap: 0.3, vol: 0.3, rate: 1.6 }); }; // Space or A, just for the look


let padPrev = [], pendingUse = null, slowmo = 0, stickDir = null, stickNext = 0; // belt slot to use on the next tick (1-4, a tap, or LB/RB/X/Y)
function readInput() {
  let mx = 0, mz = 0;
  if (keys.has('w') || keys.has('arrowup')) mz -= 1;
  if (keys.has('s') || keys.has('arrowdown')) mz += 1;
  if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
  if (keys.has('d') || keys.has('arrowright')) mx += 1;
  if (touch.id !== null && Math.hypot(touch.x, touch.y) > 0.18) { mx += touch.x; mz += touch.y; }
  const pad = (navigator.getGamepads && [...navigator.getGamepads()].find(Boolean)) || null;
  if (pad) {
    const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    if (Math.hypot(ax, ay) > 0.2) { mx += ax; mz += ay; }
    if (pad.buttons[12] && pad.buttons[12].pressed) mz -= 1; if (pad.buttons[13] && pad.buttons[13].pressed) mz += 1;
    if (pad.buttons[14] && pad.buttons[14].pressed) mx -= 1; if (pad.buttons[15] && pad.buttons[15].pressed) mx += 1;
  }
  // movement is relative to where the camera looks
  const y = renderer ? renderer.getYaw() : 0, c = Math.cos(y), sn = Math.sin(y);
  return { mx: mx * c + mz * sn, mz: -mx * sn + mz * c, pad };
}
function padEdges(pad) {
  const now = pad ? pad.buttons.map((b) => b.pressed) : [];
  const edge = (i) => now[i] && !padPrev[i];
  const out = { a: edge(0), b: edge(1), x: edge(2), y: edge(3), lb: edge(4), rb: edge(5), up: edge(12), down: edge(13), left: edge(14), right: edge(15), start: edge(9) };
  // the left stick also steps through menus (with a repeat delay)
  if (pad) {
    const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, now2 = performance.now();
    const dir = Math.abs(ax) > 0.6 ? (ax > 0 ? 'right' : 'left') : Math.abs(ay) > 0.6 ? (ay > 0 ? 'down' : 'up') : null;
    if (dir && (dir !== stickDir || now2 > stickNext)) { out[dir] = true; stickNext = now2 + (dir === stickDir ? 140 : 320); }
    stickDir = dir;
  }
  padPrev = now; return out;
}

// ---- level up UI ------------------------------------------------------------------------------------------------------------
let shownPending = false, rewardWasShown = false;
function resumeAfterReward() {
  if (sim.pending[PLAYER] || !rewardWasShown) return;
  rewardWasShown = false;
  const input = readInput();
  waitingForMove = isTouchUI && Math.hypot(input.mx, input.mz) <= 0.01;
  $('movehint').classList.toggle('hidden', !waitingForMove);
  if (touch.id !== null) stickEl.classList.remove('hidden');
  acc = 0; audio.duck(waitingForMove);
}
function showLevelUp() {
  if (sim) preloadNextIcons(sim.players.find((q) => q.id === PLAYER));
  const pend = sim.pending[PLAYER]; if (!pend) return;
  if (pend.casket) { showCasket(); return; }
  shownPending = rewardWasShown = true; mode = 'levelup'; selCard = 0; audio.duck(true);
  waitingForMove = false; $('movehint').classList.add('hidden'); stickEl.classList.add('hidden');
  const wrap = $('cards'); wrap.innerHTML = '';
  $('lutitle').textContent = pend.choices.some((c) => c.kind === 'evolve') ? 'Evolution!' : 'Level up!';
  pend.choices.forEach((c, i) => {
    // rarity (pace 2): Common grey, Rare blue, Epic purple, Legendary gold; a rarer card gives more levels at once
    const ri = c.rarity ? Math.max(0, CARD_RARITIES.indexOf(c.rarity)) : -1;
    const el = document.createElement('div'); el.className = 'card' + (c.kind === 'evolve' ? ' evo' : '') + (ri >= 0 ? ` rar r-${CARD_RARITIES[ri]}` : ''); el.dataset.i = i;
    const from = typeof c.from === 'number' && c.rarity ? c.from : c.level - 1; // the level you have now
    const lvTag = () => (from === 0 ? (c.level > 1 ? `NEW · Lv ${c.level}` : 'NEW') : c.level - from > 1 ? `Lv ${from} → ${c.level}` : `Lv ${c.level}`);
    let name, tag, text, icon;
    if (c.kind === 'evolve') {
      const e = EVOLUTIONS[c.id]; name = e.name; tag = `EVOLVES ${weaponTitle(c.id, 6, stepOf(c.id)).toUpperCase()}`; text = e.blurb; icon = imgTag(e.item, EMOJI[c.id]);
    } else if (c.kind === 'weapon') {
      const w = WEAPONS[c.id], ups = []; for (let l = Math.max(1, from); l < c.level; l++) ups.push(w.next(l));
      name = weaponTitle(c.id, c.level, stepOf(c.id)); tag = lvTag(); text = from === 0 ? w.blurb + (ups.length ? ` Starts with ${ups.join(', ')}.` : '') : 'Upgrade: ' + ups.join(', '); icon = iconHTML('weapon', c.id, c.level, false, stepOf(c.id));
      const need = Object.entries(EVOLUTIONS).find(([id]) => id === c.id);
      if (need && c.level === 6) text += ` Evolves with ${PASSIVES[need[1].passive].name}.`;
    } else if (c.kind === 'passive') {
      const p = PASSIVES[c.id]; name = passiveTitle(c.id, c.level); tag = lvTag(); text = p.blurb; icon = iconHTML('passive', c.id, c.level);
      const ev = Object.entries(EVOLUTIONS).find(([, e]) => e.passive === c.id);
      if (ev) text += ` Evolves ${weaponTitle(ev[0], 6, stepOf(ev[0]))}.`;
    } else { const hp = CARD_HEAL[Math.max(0, ri)]; name = 'Cooked Bubba Bass'; tag = 'Heal'; text = hp >= 9999 ? 'Restore all your health.' : `Restore ${hp} health.`; icon = iconHTML('item', 'Cooked Bubba Bass'); }
    if (ri === 3 && c.kind !== 'heal') text += ' Heals you to full.';
    const rar = ri >= 0 ? `<div class="rarity">${CARD_RARITY_NAMES[ri]}</div>` : '';
    el.innerHTML = `${rar}${icon}<h3>${name}</h3><div class="tier">${tag}</div><p>${text}</p><div class="key">[${i + 1}]</div>`;
    el.onclick = () => pick(i); wrap.appendChild(el);
  });
  const me = sim.players.find((q) => q.id === PLAYER);
  $('reroll').innerHTML = `Reroll<span class="key"> (R)</span> · ${me ? me.rerolls : 0} left`; $('reroll').disabled = !me || me.rerolls <= 0;
  markCard(); $('levelup').classList.remove('hidden');
}
function doReroll() { if (sim && (rankedRec ? rankedChoice(sim, rankedRec, 'r') : reroll(sim, PLAYER))) { shownPending = false; showLevelUp(); if (rankedRec) persistRanked(); } }
function doSkip() { if (sim && (rankedRec ? rankedChoice(sim, rankedRec, 's') : skipLevel(sim, PLAYER))) { audio.duck(false); shownPending = false; mode = 'play'; $('levelup').classList.add('hidden'); resumeAfterReward(); if (rankedRec) persistRanked(); } }
$('reroll').onclick = doReroll; $('skiplv').onclick = doSkip;
function markCard() { [...$('cards').children].forEach((el, i) => el.classList.toggle('sel', i === selCard)); }
function pick(i) {
  if (!sim.pending[PLAYER] || sim.pending[PLAYER].casket) return;
  if (rankedRec) { if (!rankedChoice(sim, rankedRec, i)) return; persistRanked(); } else choose(sim, PLAYER, i); audio.duck(false); shownPending = false; mode = 'play'; $('levelup').classList.add('hidden'); resumeAfterReward();
}

// ---- reward casket card: the item, what it replaces, every stat change, and Wear or High alch ----------------------------
const RARITY_NAME = { common: '', rare: 'Rare', unique: 'Unique' };
const tierLabel = (n) => { const g = GEAR[n]; const metal = ARMOR_TIERS.includes(g.set) || / (Kite)?[Ss]hield$/.test(n) && g.rarity !== 'unique'; return [gearSlotName(g.slot), metal ? '' : RARITY_NAME[gearRarity(n)]].filter(Boolean).join(' · '); };
function casketItemHTML(n, cls, label) {
  // a weapon metal or arrows: what it is for, and what it does to that weapon
  if (isWeaponItem(n)) return `<div class="ckitem ${cls}"><div class="cklabel">${label}</div>${imgTag(n)}<div class="cktext"><b>${n}</b><small>${weaponItemLabel(n)}</small><span>${weaponItemText(n)}</span></div></div>`;
  const g = GEAR[n];
  return `<div class="ckitem ${cls}"><div class="cklabel">${label}</div>${imgTag(n)}<div class="cktext"><b>${n}</b><small>${tierLabel(n)}</small><span>${bonusText(g.bonus)}</span></div></div>`;
}
function showCasket() {
  const pend = sim.pending[PLAYER]; if (!pend || !pend.casket) return;
  const c = pend.casket;
  // Settings: a piece that improves nothing is high alched without stopping the run (still a recorded choice in ranked)
  if (autoAlchOn() && !c.anyUp) { toast(`${imgTag(c.item)} <span>Auto high alch<br><b>${c.item}</b> +${c.alch} coins</span>`); pickCasket(1, true); return; }
  shownPending = rewardWasShown = true; mode = 'casket'; selCard = pend.rec; audio.duck(true);
  waitingForMove = false; $('movehint').classList.add('hidden'); stickEl.classList.add('hidden');
  const rows = Object.entries(c.delta).map(([k, v]) => `<li class="${v > 0 ? 'up' : 'down'}">${deltaText(k, v)}</li>`);
  for (const sname of c.setsGained) rows.push(`<li class="up">${sname} set complete: ${GEAR_SETS[sname].text}</li>`);
  for (const sname of c.setsLost) rows.push(`<li class="down">Breaks the ${sname} set (${GEAR_SETS[sname].text})</li>`);
  if (!rows.length) rows.push('<li class="same">No change</li>');
  const setLine = c.set ? `<div class="ckset${c.set.have >= c.set.need ? ' done' : ''}">${c.set.name} set ${Math.min(c.set.have, c.set.need)}/${c.set.need} · ${GEAR_SETS[c.set.name].text}</div>` : '';
  $('cktitle').textContent = 'Reward casket';
  const wpn = isWeaponItem(c.item), onBow = wpn && WEAPON_ITEMS[c.item].kind === 'arrow';
  $('ckitems').innerHTML = casketItemHTML(c.item, 'new', 'New') + `<div class="ckvs">replaces</div>` + casketItemHTML(c.old, 'old', onBow ? 'On the Bow' : wpn ? 'In hand' : 'Worn');
  $('ckset').innerHTML = setLine;
  $('ckdelta').innerHTML = `<ul>${rows.join('')}</ul>`;
  $('ckwear').innerHTML = `<span class="kb">1</span><span class="kb">A</span>Wear`;
  $('ckalch').innerHTML = `<span class="kb">2</span><span class="kb">B</span>High alch for ${c.alch} coins`;
  // the recommended choice is the game's green accept button, the other one grey
  $('ckwear').classList.toggle('ghost', pend.rec !== 0); $('ckalch').classList.toggle('ghost', pend.rec !== 1);
  $('ckrec').textContent = pend.rec === 0 ? 'Recommended: wear it' : c.anyUp ? 'Recommended: high alch (not better overall)' : 'Recommended: high alch (not better)';
  $('ckmore').textContent = pend.more ? `${pend.more} more casket${pend.more > 1 ? 's' : ''} after this` : '';
  markCasket(); $('casket').classList.remove('hidden');
}
function markCasket() { $('ckwear').classList.toggle('sel', selCard === 0); $('ckalch').classList.toggle('sel', selCard === 1); }
// after a casket choice (or the timer): the next casket card, a level-up card, or back to the run
function afterCasket() {
  shownPending = false; $('casket').classList.add('hidden');
  if (sim && sim.pending[PLAYER]) { showLevelUp(); return; }
  audio.duck(false); mode = 'play';
  resumeAfterReward();
}
function pickCasket(i, auto = false) {
  const pend = sim && sim.pending[PLAYER]; if (!pend || !pend.casket || (!auto && mode !== 'casket')) return;
  if (rankedRec) { if (!rankedChoice(sim, rankedRec, i)) return; persistRanked(); } else choose(sim, PLAYER, i);
  afterCasket();
}
$('ckwear').onclick = () => pickCasket(0); $('ckalch').onclick = () => pickCasket(1);

// ---- HUD -----------------------------------------------------------------------------------------------------------------------------
let hudT = 0; const slotCache = { w: '', p: '', b: '' };
function updateHud(view) {
  const me = view.players[0];
  $('hpfill').style.width = Math.min(100, Math.max(0, (me.hp / me.mhp) * 100)) + '%';
  $('hptext').textContent = `${me.hp} / ${me.mhp}`;
  $('xpfill').style.width = Math.min(100, (view.xp / view.xpNeed) * 100) + '%';
  $('lvl').textContent = 'Lv ' + view.level;
  const t = Math.floor(view.t); $('clock').textContent = fmtT(t);
  const goal = sim && sim.endAt ? sim.endAt : sim && !sim.endless && sim.map.length ? sim.map.length : 0;
  if (runBest && !passedBest && betterRun(runBest, { t, kills:view.kills, won:sim.over === 'win' }) !== runBest) { passedBest = true; banner(`New best on ${sim.map.name}!`, 2200); audio.play('level', { vol: 0.8 }); }
  $('clockgoal').textContent = (goal ? `of ${fmtT(goal)}` : '') + (runBest ? (passedBest ? ' · new best!' : ` · best ${fmtT(runBest.t)}`) : '') + chaseText(t, view.kills);
  $('kills').textContent = view.kills;
  if (sim && sim.players[0] && (frame % 10 === 0 || !$('gp').textContent)) $('gp').textContent = runCoins(sim).toLocaleString();
  const boss = view.enemies.find((e) => ENEMIES[e[1]].boss);
  $('bossbar').classList.toggle('hidden', !boss);
  if (boss) { $('bossname').textContent = bossName(sim && sim.map, boss[1]); $('bossfill').style.width = boss[5] + '%'; }
  const bk = JSON.stringify(me.belt || []);
  if (bk !== slotCache.b) {
    slotCache.b = bk; const BELT_ICON = { beer: 'Tin of Beer', pumpkin: 'Pumpkin', warp: 'Warp Shard' };
    $('belt').innerHTML = Array.from({ length: BELT_SIZE }, (_, i) => { const k = (me.belt || [])[i]; return `<div class="bslot${k ? '' : ' empty'}" data-i="${i}">${k ? imgTag(BELT_ICON[k]) : ''}<small>${i + 1}</small></div>`; }).join('');
    for (const el of $('belt').children) el.onclick = () => { pendingUse = Number(el.dataset.i); };
  }
  const wk = JSON.stringify([me.w, me.evo, me.wm]), pk = JSON.stringify(me.ps);
  if (wk !== slotCache.w) { slotCache.w = wk; $('wrow').innerHTML = Object.entries(me.w).map(([id, l]) => `<div class="slot${me.evo[id] ? ' evo' : ''}" title="${weaponDisplay(id, l, me.evo[id], weaponStep(id, me.wm)).name}">${iconHTML('weapon', id, l, me.evo[id], weaponStep(id, me.wm))}<small>${me.evo[id] ? '★' : l}</small></div>`).join(''); }
  if (pk !== slotCache.p) { slotCache.p = pk; $('prow').innerHTML = Object.entries(me.ps).map(([id, l]) => `<div class="slot" title="${passiveTitle(id, l)}">${iconHTML('passive', id, l)}<small>${l}</small></div>`).join(''); }
  for (const f of view.fx) {
    if (f.k === 'boss') banner(sim && !sim.endless && f.type === sim.map.finalBoss && sim.bossIndex >= sim.map.bosses.length ? `${bossName(sim.map, f.type)} approaches! Slay it to win the run.` : `${bossName(sim && sim.map, f.type)} approaches!`, 3500);
    else if (f.k === 'down') banner('You have fallen…', 3000);
    else if (f.k === 'evolve') banner(`${EVOLUTIONS[f.id].name}!`, 3000);
    else if (f.k === 'use' && f.kind === 'beer') banner('Tin of Beer: speed up!', 1400);
    else if (f.k === 'use' && f.kind === 'pumpkin') banner('Pumpkin bomb!', 1200);
    else if (f.k === 'use' && f.kind === 'warp') banner('Warp Shard: everything comes to you', 1600);
    else if (f.k === 'revive') banner('Revived!', 1600);
    else if (f.k === 'get' && f.kind === 'chest') banner('Chest!', 1000);
    else if (f.k === 'event') banner(f.kind === 'treasure' ? 'A treasure goblin! Catch it before it gets away' : f.kind === 'swarm' ? 'Swarm!' : f.kind === 'warband' ? `A goblin warband charges from the ${f.dir}!` : f.kind === 'rising' ? 'The dead rise around you!' : f.kind === 'blizzard' ? 'Blizzard! The snow slows you down' : f.kind === 'duel' ? 'A champion of the Fighting Forum challenges you!' : f.kind === 'stampede' ? `Chicken stampede from the ${f.dir}!` : f.kind === 'sandstorm' ? 'Sandstorm! Scorpions in the dust' : f.kind === 'ambush' ? 'Ambush! Things are crawling out of the water' : 'Meteor shower! Watch the ground', 2600);
    else if (f.k === 'treasure') banner('Treasure goblin caught!', 1800);
    else if (f.k === 'shrine' && SHRINES[f.kind]) banner(`A ${SHRINES[f.kind].name} rose nearby: stand in its circle to charge it`, 3200);
    else if (f.k === 'shrine-done' && SHRINES[f.kind] && f.id === PLAYER) banner(`${SHRINES[f.kind].name}: ${SHRINES[f.kind].text}`, 3200);
    else if (f.k === 'region' && sim.t > 1) banner(MAP_BY_ID[f.id].name, 1800);
    else if (f.k === 'escape') banner('The treasure goblin got away', 1600);
    else if (f.k === 'casket' && f.worn && f.weapon) { toast(`${imgTag(f.item)} <span>${WEAPON_ITEMS[f.item] && WEAPON_ITEMS[f.item].kind === 'arrow' ? 'The Bow now shoots' : `${WEAPONS[f.weapon].name}, now`}<br><b>${f.item}</b></span>`); }
    else if (f.k === 'casket' && f.worn) { toast(`${imgTag(f.item)} <span>${f.old ? 'Now wearing' : 'Reward casket, now worn'}<br><b>${f.item}</b></span>`); }
    else if (f.k === 'alch' && !autoAlchOn()) { toast(`${imgTag('Gold')} <span>High alch<br><b>${f.item}</b> +${f.coins} coins</span>`); }
  }
}

// ---- menus with a controller or the arrow keys: spatial focus, A/Enter picks, B/Esc goes back -----------------------
const NAV_SCREENS = [...MENU_SCREENS, 'pause', 'end', 'title'];
const NAV_ITEMS = 'summary, .aopt:not(.locked), .mopt:not(.locked), button:not([disabled]), .gslot, .gitem:not(.locked), #hardwrap:not(.hidden):not(.locked), #endlesswrap:not(.hidden):not(.locked), input[data-vol]';
let navEl = null;
function navScreen() { if (mode === 'recovery') return $('progressrecovery'); if (walletModalOpen()) return null; return NAV_SCREENS.map((id) => $(id)).find((el) => el && !el.classList.contains('hidden')); }
function navItems(scr) { return [...scr.querySelectorAll(NAV_ITEMS)].filter((el) => el.offsetParent !== null && !el.closest('.hidden')); }
function navFocus(el) { if (navEl) navEl.classList.remove('navfocus'); navEl = el; if (el) { el.classList.add('navfocus'); if (el.tabIndex < 0) el.tabIndex = -1; el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
function navMove(dir) {
  const scr = navScreen(); if (!scr) return;
  const items = navItems(scr); if (!items.length) return;
  if (!navEl || !scr.contains(navEl) || !items.includes(navEl)) { navFocus(items.find((el) => el.classList.contains('sel')) || (scr.id === 'title' ? $('start') : items[0])); return; }
  // a volume slider: left and right move it
  if (navEl.matches('input[type=range]') && (dir === 'left' || dir === 'right')) { navEl.value = Number(navEl.value) + (dir === 'left' ? -5 : 5); navEl.dispatchEvent(new Event('input')); return; }
  const r = navEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let best = null, bs = 1e9;
  for (const el of items) {
    if (el === navEl) continue;
    const q = el.getBoundingClientRect(), x = q.left + q.width / 2 - cx, y = q.top + q.height / 2 - cy;
    const main = dir === 'left' ? -x : dir === 'right' ? x : dir === 'up' ? -y : y, side = dir === 'left' || dir === 'right' ? Math.abs(y) : Math.abs(x);
    if (main <= 4) continue;
    const sc = main + side * 2.2; if (sc < bs) { bs = sc; best = el; }
  }
  if (best) navFocus(best);
}
function navPress() {
  const scr = navScreen(); if (!scr) return false;
  if (!navEl || !scr.contains(navEl) || navEl.offsetParent === null) return false;
  if (navEl.id === 'hardwrap' || navEl.id === 'endlesswrap') { const cb = navEl.querySelector('input'); cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); return true; }
  navEl.click(); return true;
}
function navBack() {
  if (mode === 'recovery') return true;
  if (walletModalOpen()) return true;
  if (!$('cloudpick').classList.contains('hidden')) return true; // Keep both saves until an explicit choice resolves the prompt.
  for (const id of MENU_SCREENS) if (!$(id).classList.contains('hidden')) {
    if (id === 'wallet') $('walletclose').click(); else $(id).classList.add('hidden');
    navFocus(null); return true;
  }
  if (mode === 'pause') { pause(false); return true; }
  return false;
}
addEventListener('keydown', (e) => {
  if (mode === 'recovery' || walletModalOpen()) return;
  const k = e.key, dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[k];
  if (k === 'Tab' && navEl) navFocus(null);
  const spatialControl = e.target === navEl && e.target?.matches?.('summary, input[data-vol]');
  if (e.target?.matches?.('input, textarea, select, summary, [contenteditable="true"]') && !(spatialControl && (dir || k === 'Escape'))) return;
  if (mode === 'play' || mode === 'levelup' || mode === 'casket') return;
  const scr = navScreen();
  if ((k === 'Enter' || k === ' ') && scr && MENU_SCREENS.includes(scr.id) && !scr.contains(e.target)) { e.preventDefault(); return; }
  if (k === 'Escape' && spatialControl && navBack()) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target?.matches?.('button, a[href]')) return;
  if (dir) { navMove(dir); e.preventDefault(); e.stopImmediatePropagation(); }
  else if (k === 'Enter' && navEl && navScreen() && navScreen().contains(navEl)) { if (navPress()) { e.stopImmediatePropagation(); e.preventDefault(); } }
}, true);

// ---- minimap: the game's own map art around you, turned with the camera ---------------------------------------------
const mmImg = new Image(); mmImg.src = asset('world/world-map-full.webp');
const mm = $('minimap'), mmx = mm.getContext('2d');
function drawMinimap(view) {
  if (!mmImg.complete || !view.players.length) return;
  const me = view.players[0], W = mm.width, R = W / 2, PX = 2.4; // canvas px per world unit
  const yaw = renderer.getYaw();
  mmx.save(); mmx.clearRect(0, 0, W, W);
  mmx.beginPath(); mmx.arc(R, R, R - 2, 0, Math.PI * 2); mmx.clip();
  mmx.fillStyle = '#244f78'; mmx.fillRect(0, 0, W, W);
  mmx.translate(R, R); mmx.rotate(yaw); mmx.imageSmoothingEnabled = false;
  const span = (R / PX) * 1.5; // world units drawn around you (the corners show when turned)
  mmx.drawImage(mmImg, (me.x - span) * 4, (me.z - span) * 4, span * 8, span * 8, -span * PX, -span * PX, span * 2 * PX, span * 2 * PX);
  const dot = (x, z, r, c) => { mmx.fillStyle = c; mmx.beginPath(); mmx.arc((x - me.x) * PX, (z - me.z) * PX, r, 0, Math.PI * 2); mmx.fill(); };
  // the edge of this map's arena
  if (sim.map.r < 500) { mmx.strokeStyle = 'rgba(255,240,192,0.5)'; mmx.lineWidth = 1.5; mmx.beginPath(); mmx.arc((sim.map.cx - me.x) * PX, (sim.map.cz - me.z) * PX, sim.map.r * PX, 0, Math.PI * 2); mmx.stroke(); }
  for (const k of view.pickups) if (k[1] === 'casket' || k[1] === 'chest') dot(k[2], k[3], 3.5, '#ffd34d');
  for (const e of view.enemies) { const def = ENEMIES[e[1]]; dot(e[2], e[3], def.boss ? 5 : e[7] ? 3.5 : 1.8, def.boss ? '#ff3b2f' : e[7] ? '#ffd34d' : '#ff7b6b'); }
  mmx.restore();
  // you: an arrow pointing where you face (relative to the camera)
  mmx.save(); mmx.translate(R, R); mmx.rotate(-(me.f - Math.PI) + yaw);
  mmx.fillStyle = '#ffffff'; mmx.strokeStyle = '#000'; mmx.lineWidth = 1.5;
  mmx.beginPath(); mmx.moveTo(0, -7); mmx.lineTo(5, 6); mmx.lineTo(0, 3); mmx.lineTo(-5, 6); mmx.closePath(); mmx.fill(); mmx.stroke();
  mmx.restore();
}

// ---- main loop ------------------------------------------------------------------------------------------------------------------------
let lastDrawn = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const cap = renderer && Number(renderer.getSettings().fps); // Frame rate cap setting (saves battery)
  if (cap && ts - lastDrawn < 1000 / cap - 2) return;
  lastDrawn = ts;
  const dt = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts; frame++;
  const inp = readInput(); const edges = padEdges(inp.pad);
  if (mode !== 'play' && mode !== 'levelup' && mode !== 'casket') {
    for (const d of ['up', 'down', 'left', 'right']) if (edges[d]) navMove(d);
    if (edges.b) navBack();
    if (edges.a && navPress()) edges.a = false;
    if (edges.start && mode === 'title' && !$('start').disabled && navScreen()?.id === 'title') edges.a = true;
  }
  if (mode === 'title' || mode === 'end') {
    if (edges.a && mode === 'title' && !$('start').disabled && navScreen()?.id === 'title') startRun(); else if (edges.a && mode === 'end' && navScreen()?.id === 'end') startRun();
    if (!sim) { // title backdrop: the chosen adventurer standing in the chosen map
      if (frame % 2 === 0) {
        if (!window.__idleSim) {
          const T = renderer.terrain;
          window.__idleSim = createSim({ seed: 1, map: MAP_BY_ID[selMap], ground: T ? { n: T.cell ? T.cells : T.n, blocked: T.blocked, cell: !!T.cell, water: T.water || null, walls: T.walls || null } : null, players: [{ id: PLAYER, name: 'You', adv: runAdv().id, gear: runAdv().id !== selAdv ? {} : getGear() }] });
          if (selMap === 'greentown' || selMap === 'world') { const p = window.__idleSim.players[0]; [p.x, p.z] = findWalkable(window.__idleSim, 390, 310); } // title-only clearing, away from the spawn tree
        }
        const v = snapshot(window.__idleSim); v.players[0].f = Math.sin(performance.now() / 3000) * 0.5;
        if (compactMenu.matches) renderer.setYaw(0);
        else if (!params.has('qa')) renderer.setYaw(renderer.getYaw() + 0.0045); // the desktop title camera drifts slowly
        renderer.update(v, 0.033, PLAYER);
      }
      return;
    }
  }
  if (!sim) return;
  if (mode === 'play') {
    if (edges.start) pause(true);
    if (waitingForMove && Math.hypot(inp.mx, inp.mz) > 0.01) { waitingForMove = false; $('movehint').classList.add('hidden'); audio.duck(false); }
    if (waitingForMove) acc = 0;
    else { acc += dt * (slowmo > 0 ? 0.3 : 1); slowmo -= dt; } // a moment of slow motion when a boss falls
    let n = 0;
    if (edges.lb) pendingUse = 0; if (edges.rb) pendingUse = 1; if (edges.x) pendingUse = 2; if (edges.y) pendingUse = 3; if (edges.a) hop(); // A hops (a look only)
    while (acc >= TICK && n++ < 4) {
      if (rankedRec) {
        if (sim.pending[PLAYER] || sim.over) { acc = 0; break; }
        rankedStep(sim, rankedRec, inp.mx, inp.mz, pendingUse);
      } else step(sim, { [PLAYER]: { mx: inp.mx, mz: inp.mz, use: pendingUse } }, TICK);
      pendingUse = null; acc -= TICK;
    }
    if (acc > TICK * 4) acc = 0;
    if (sim.pending[PLAYER] && !shownPending) showLevelUp();
    if (sim.over) endRun();
  } else if (mode === 'levelup') {
    if (edges.left) { selCard = (selCard + 2) % 3; markCard(); } if (edges.right) { selCard = (selCard + 1) % 3; markCard(); } if (edges.a) pick(selCard);
    const before = sim.pending[PLAYER];
    if (mode === 'levelup' && !rankedRec && sim.pending[PLAYER]) step(sim, {}, dt); // ranked choices wait for the player
    if (shownPending && (!sim.pending[PLAYER] || sim.pending[PLAYER].casket)) { shownPending = false; audio.duck(false); mode = 'play'; $('levelup').classList.add('hidden'); resumeAfterReward(); } // (a casket card shows next)
    else if (shownPending && sim.pending[PLAYER] !== before) showLevelUp();
  } else if (mode === 'casket') {
    // controller: A wears, B high alches; the stick or d-pad moves the highlight
    if (edges.left || edges.up) { selCard = 0; markCasket(); } if (edges.right || edges.down) { selCard = 1; markCasket(); }
    if (edges.a) pickCasket(0); else if (edges.b) pickCasket(1);
    if (mode === 'casket' && !rankedRec && sim.pending[PLAYER]) { const before = sim.pending[PLAYER]; step(sim, {}, dt); if (sim.pending[PLAYER] !== before) afterCasket(); } // the timer picks the recommended choice
  } else if (mode === 'pause') {
    if (edges.start) pause(false);
    if (frame % 4 !== 0) return;
  }
  const view = snapshot(sim, { maxEnemies: 420 });
  view.alpha = Math.min(1, Math.max(0, acc / TICK)); // where between sim ticks this frame is (the renderer slides spells by it)
  if (view.fx.some((f) => f.k === 'die' && f.boss)) slowmo = 0.9;
  audio.onFx(view.fx, mode === 'play' ? view : null, sim.map.world && view.region ? MAP_BY_ID[view.region].music : sim.map.music);
  const flash = renderer.update(view, mode === 'play' || mode === 'levelup' ? dt : 0.001, PLAYER);
  $('hurt').classList.toggle('on', flash > 0.05);
  hudT += dt; if (hudT > 0.08 || view.fx.length) { hudT = 0; updateHud(view); drawMinimap(view); }
}

boot().then(async () => {
  applyDmt(); window.__sqReady = true; await refreshRanked();
  if (!walletHandoff && (rankedLive() || readRanked('sq-ranked-submit') || readRanked('sq-ranked-payment'))) {
    await openRanked();
    if (rankedLive()?.sim !== SIM_ID && rankedLive() && !readRanked('sq-ranked-submit')) recoverRankedRun();
  }
});
// QA hooks (?qa or ?debug): drive the game from a test browser
// test controls (god mode, skipping time, items) exist only on a local test copy, never on the live site
const qaHooks = {
  get sim() { return rankedRun ? null : sim; }, get mode() { return mode; }, step: (...args) => { if (!rankedRun) step(...args); }, snapshot, keys, renderer: () => rankedRun ? null : renderer,
  startRun: () => { if (!rankedRun) return startRun(); }, toMenu, pick, pause,
  setAdv(id) { selAdv = id; buildAdventurers(); window.__idleSim = null; },
  setMap: (id) => pickMap(id),
  spawn(type, n = 1, d = 4) { if (rankedRun) return; const p = sim.players[0]; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; spawnEnemy(sim, type, p.x + Math.cos(a) * d, p.z + Math.sin(a) * d); } },
  // run the sim forward (no rendering), auto-picking level-ups; keeps the player still unless dir is given
  warp(sec, dir = [0, 0]) { if (rankedRun) return; for (let i = 0; i < sec / TICK; i++) { step(sim, { [PLAYER]: { mx: dir[0], mz: dir[1] } }, TICK); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); if (sim.over) break; } },
  god() { if (rankedRun) return; const p = sim.players[0]; p.hp = p.maxHp = 1e6; p.godMode = true; },
  give(name) { return bankItem(name); }, wear(slot, name) { const g = getGear(); g[slot] = name; save('sq-gear', g); }, buildGear, buildQuests, refreshIdle,
  drop(kind) { if (rankedRun) return; const p = sim.players[0]; sim.pickups.push({ id: sim.nextId++, x: p.x + 1.5, z: p.z, kind }); },
  // reward caskets: drop n at your feet (rolled by the sim), or queue given items as if a casket held them
  caskets(n = 1) { if (rankedRun) return; const p = sim.players[0]; for (let i = 0; i < n; i++) sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'casket' }); },
  casketOf(...names) { if (rankedRun) return; const p = sim.players[0]; for (const n of names) if (isWeaponItem(n) || GEAR[n]) { if (!isWeaponItem(n) && !p.gear[GEAR[n].slot]) continue; sim.loot.push(n); p.casketQ.push(n); } openCasket(sim, p); }, // as if caskets held them
  wearNow(gear) { if (rankedRun) return; const p = sim.players[0]; p.gear = { ...p.gear, ...gear }; p.gb = gearBonus(p.gear, p.gearLv || {}, sim.pace); },
};

if ((params.has('debug') || params.has('qa')) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) Object.defineProperty(window, '__sq', { get: () => rankedRun || rankedLive() ? undefined : qaHooks });
