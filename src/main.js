import { skillQuote, prepareSkills } from './skill-purchases.js';
import { armouryQuote, prepareArmoury } from './armoury.js';
import { createCoopClient } from './coop-client.js';
import { predictedView } from './coop-view.js';
import { groundHash } from './ground-pack.js';
import { VARIANTS, TRIAL_BOSSES, BOSS_KIT, RAID_DURATION, WISE_OLD_MAN } from './game-modes.js';
import { RunRecorder, RANKED, pauseRemaining, rankedPoints, kpm, kpmMicro, kpmWeek, prizePlaces as racePlaces, placeable, raceForWeek, entryRacesOf } from './ranked.js';
import { rankedStep, rankedChoice, resumeRankedAsync } from './ranked-play.js';
import { clockPolicy } from './ranked-clock.js';
import { RankedClock } from './ranked-clock-client.js';
import { itemInspection } from './item-inspection.js';
import { rankedApi, requireRankedBuild, payEntry, recoverPayment, clearUnsentPayment, readRanked, writeRanked } from './ranked-client.js';
import { createRenderer } from './render.js';
import { QUESTS, ACHIEVEMENTS, DUPLICATE_GEAR_COINS } from './profile-milestones.js';
import { drawStormMinimap } from './storm-effects.js';
import { cleanSettings } from './settings.js';
import { createScreenLayout } from './screen-layout.js';
import { setupFullscreen } from './fullscreen.js';
import { profileValue, profileBest, validProfileValue, finiteNumber } from './progress-values.js';
import { asset, pickAssetHost } from './assets.js';
import { createSim, step, snapshot, choose, spawnEnemy, findWalkable, reroll, skipLevel, canBanish, banish, playerStats, previewChoice, openCasket, autoChoice, merchantNear, buyMerchant, FOOD, BELT_SIZE, TICK, SHRINE, SHRINES } from './sim.js';
import { createAudio } from './audio.js';
import { DamageMeter } from './damage-meter.js';
import { bindBeltItem } from './belt-input.js';
import { bindItemInspection } from './item-inspection-input.js';
import { NATIVE_PETS, petChoice } from './pets.js';
import { createBunCompanions, bunChoice } from './bun-companions.js';
import { canAutoEquip } from './auto-equip.js';
import { CHANGELOG, LATEST } from './changelog.js';
import { dmtText, poolReadout, prizeEstimate, prizeNotes, walletPrize } from './prize-display.js';
import { initI18n, translateText } from './i18n.js';
import { CREATOR, TIP_ETH, NO_PRIZE, COOP_RELAY } from './config.js';
const noPrize = (w) => NO_PRIZE.includes(String(w || '').toLowerCase());
// prize place of each board row: the developer's wallet and (from week 1) runs under 3:00 take none, the places pass down
const prizePlaces = (rows, week) => racePlaces(rows, week, noPrize);
import { wallets, watchWallets, takeWalletHandoff, savedPass, forget, prove, short, walletAppLinks, isPhone, walletModalOpen, walletConnectState, watchWalletConnect, cancelWalletConnect, dismissWalletConnect, why, DMT_COIN_BONUS } from './dmt.js';
import { createCloud, betterRun, SAVE_KEYS as CLOUD_KEYS } from './cloud.js';
import { TRANSFER_KEYS as XFER_KEYS, IMPORT_BACKUP_KEY, RUN_SAVE_KEY, importProgress, recoverProgressImport, saveRunProgress, recoverRunProgress } from './progress-import.js';
import { prepareRunRewards } from './run-rewards.js';
import { canContinueCasual, captureRewardBaseline, continueCasual, phaseCoins, phaseAlch, submitCasualResult } from './casual-continuation.js';
import { quoteDmt, buyDmt, MIN_BUY_DMT, MAX_BUY_DMT } from './swap.js';
import { walletConnectLinks } from './wallet-connect.js';
import { connect as requestWallet, disconnect as walletDisconnect, restore as walletRestore, current as walletNow, walletRevision, onWallet, balances, fmtDmt, fmtEth, GET_DMT, BRIDGE, arbiscanTx, arbiscanAddress, ETH_FOR_GAS } from './wallet.js';
import {
  MAPS, MAP_BY_ID, ADVENTURERS, ADVENTURER_BY_ID, ENEMIES, WEAPONS, PASSIVES, EVOLUTIONS, evolutionPassives, SKILLS, SKILL_IDS, clampSkills, skillCost,
  weaponItem, weaponTitle, weaponDisplay, passiveItem, passiveTitle, itemIconFile,
  GEAR, GEAR_SLOTS, GEAR_SLOT_NAMES, GEAR_SETS, GEAR_MAX_LV, gearUpgradeCost, smithNext, smithPrev, gearBonus, gearPieceBonus, bonusText, deltaText, compareGear, gearRarity, alchValue, ARMOR_TIERS,
  gearGroups, isWeaponItem, WEAPON_ITEMS, weaponItemText, weaponItemLabel, weaponStep, CARD_RARITIES, CARD_RARITY_NAMES, CARD_HEAL, weaponStats, passiveStrength, cardLuck,
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
const compactMenu = matchMedia('(max-width:760px), (max-width:1180px) and (max-height:500px), (pointer:coarse) and (max-width:1366px) and (orientation:landscape)');
const phoneMenu = matchMedia('(max-width:760px), (max-width:1180px) and (max-height:500px)');
for (const id of ['adventurerpick', 'mappick']) $(id).open = !phoneMenu.matches;
phoneMenu.addEventListener('change', event => { for (const id of ['adventurerpick', 'mappick']) $(id).open = !event.matches; });
let PLAYER = 'p1';
let coop = null, coopResult = null, coopDecision = -1, coopHomeMap = null, coopLoading = false;

let sim = null, renderer = null, rendererDefaults = null, mode = 'title', acc = 0, last = 0, frame = 0, selCard = 0, banishMode = false;
const keys = new Set();
const audio = createAudio();
const p2 = (n) => String(Math.floor(n)).padStart(2, '0');
const fmtT = (t) => (t >= 3600 ? `${Math.floor(t / 3600)}:${p2((t % 3600) / 60)}:${p2(t % 60)}` : `${Math.floor(t / 60)}:${p2(t % 60)}`); // 2:00:00 past an hour
// A boss's own name (screen only; the sim and ranked replays never see it): SankoQuest's ogre is Fudna the Hoard Keeper.
const BOSS_TITLES = { '*': { ogre: 'Fudna the Hoard Keeper', sankson: 'Survival Sankson' } }; // '*': every map
const titled = (map, type) => BOSS_TITLES[map && map.id]?.[type] || BOSS_TITLES['*'][type];
const bossName = (map, type) => titled(map, type) || ENEMIES[type].name;
const slayName = (map, type) => titled(map, type) || `the ${ENEMIES[type].name}`;

// A previous import or completed run must settle before startup can change or upload progress.
let pendingRunSave = false;
try { pendingRunSave = localStorage.getItem(RUN_SAVE_KEY) !== null; } catch { pendingRunSave = true; } // Unreadable journals cannot authorize play.
if (pendingRunSave) {
  try { recoverRunProgress(localStorage); }
  catch { showProgressRecovery(() => true, false, { retry: () => recoverRunProgress(localStorage), reload: true }); throw Error('Run rewards must finish saving before playing.'); }
}
let pendingImport = false;
try { pendingImport = localStorage.getItem(IMPORT_BACKUP_KEY) !== null; } catch { pendingImport = true; }
if (pendingImport) { showProgressRecovery(); throw Error('Progress recovery is required before playing.'); }

// ---- saved progress ------------------------------------------------------------------------------
const load = (k, d) => { try { return profileValue(k, JSON.parse(localStorage.getItem(k) || 'null') ?? d, d); } catch { return d; } };
let onSaved = null; // the cloud save hears about every progress change (set up with the wallet below)
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } if (onSaved) onSaved(k); };
const clearedMaps = () => new Set(load('sq-cleared', []));
const getCoins = () => Number(load('sq-coins', 0)) || 0;
const clampLv = (o, max) => { const out = {}; if (o && typeof o === 'object' && !Array.isArray(o)) for (const k of Object.keys(o)) out[k] = Math.max(0, Math.min(max, Math.floor(Number(o[k])) || 0)); return out; }; // saved levels can be edited or arrive in a #carry= link: never trust them as numbers
const getSkills = () => clampSkills(load('sq-skills', {}));
function savedChoice(key, known, fallback) {
  const id = load(key, fallback);
  return typeof id === 'string' && Object.hasOwn(known, id) ? id : fallback;
}
let selMap = savedChoice('sq-map', MAP_BY_ID, 'greentown');
let selAdv = savedChoice('sq-adv', ADVENTURER_BY_ID, 'adventurer');
let selVariant = 'normal', trialBoss = 'giant', fieldMap = selMap;
let loadedMapId = 'greentown', mapLoading = false, hardOn = false, endlessOn = false;
// gear you own (from caskets and quests) and what you wear; lifetime stats that quests read
const getBank = () => { const b = load('sq-bank', []); return Array.isArray(b) ? b.filter((n) => typeof n === 'string' && Object.hasOwn(GEAR, n)) : []; }; // old saves: unknown names are ignored
const getGear = () => { const raw = load('sq-gear', {}), g = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}, bank = new Set(getBank()); for (const k of Object.keys(g)) if (!GEAR_SLOTS.includes(k) || !bank.has(g[k]) || !Object.hasOwn(GEAR, g[k]) || GEAR[g[k]].slot !== k) delete g[k]; return g; };
const getStats = () => load('sq-stats', {});
const getGearLv = () => clampLv(load('sq-gearlv', {}), GEAR_MAX_LV);
const questsDone = () => new Set(load('sq-quests', []));
const statVal = (st, key) => finiteNumber(st[key]);
// a new item goes to the bank; a duplicate is sold for coins (unless it was already high alched in the run: sell = false)
function bankItem(name, sell = true) { if (!Object.hasOwn(GEAR, name)) return false; const raw = load('sq-bank', []), b = Array.isArray(raw) ? raw : []; if (b.includes(name)) { if (sell) save('sq-coins', getCoins() + DUPLICATE_GEAR_COINS); return false; } b.push(name); save('sq-bank', b); return true; }
const autoAlchOn = () => load('sq-autoalch', true) !== false; // Settings: auto high alch caskets that are not better (on by default: duplicates kept popping a card)
const keepPlayingUnfocused = () => load('sq-keep-playing-unfocused', false) === true;
const autoEquipOn = () => load('sq-autoequip', false) === true; // Device preference: mobile and desktop can differ.
// special maps (Tutorial Island) are open from the start and sit outside the campaign chain
const unlockedMap = (i) => params.has('unlock') || i === 0 || !!MAPS[i].special || clearedMaps().has(MAPS[i].after || MAPS[i - 1].id);
const unlockedAdv = (a) => params.has('unlock') || a.unlock <= clearedMaps().size;
// some maps fix who you play (Tutorial Island: Alex)
const runAdv = () => selVariant === 'wizard' ? WISE_OLD_MAN : ADVENTURER_BY_ID[selVariant === 'boss' ? BOSS_KIT.adv : (MAP_BY_ID[selMap] && MAP_BY_ID[selMap].forceAdv) || selAdv];

// ---- icons: real SankoQuest item icons -----------------------------------------------------------------
const EMOJI = { curse: '🎃', baseball: '⚾', lighter: '🔥', area: '🧥', amount: '🪶', crit: '🍄', thorns: '🦂', greed: '🗝️', greatsword: '⚔️', shortsword: '🗡️', katana: '🗡️', axe: '🪓', pickaxe: '⛏️', shield: '🛡️', bow: '🏹', staff: '🪄', might: '💪', haste: '💨', vigor: '❤️', boots: '👢', magnet: '🧲', armor: '🛡️', growth: '📖', fish: '🐟' };
// upgrade icons are fetched a step ahead, so level-up cards never show up blank
const iconsAsked = new Set();
function preloadIcons(names) { for (const n of names) { if (!n || iconsAsked.has(n)) continue; iconsAsked.add(n); const im = new Image(); im.src = `${asset('')}ui/items/${itemIconFile(n)}`; } }
const preloadNextIcons = (p) => { if (!p) return; const out = []; for (const [w, l] of Object.entries(p.weapons || {})) out.push(weaponItem(w, l + 1), weaponItem(w, l + 2)); for (const [k, l] of Object.entries(p.passives || {})) out.push(passiveItem(k, l + 1)); preloadIcons(out); };
// a weapon's metal in this run (pace 2; null on pace 1, where weapons look like their level)
const stepOf = (id, p = sim && (sim.coop ? sim.players.find(p => p.id === PLAYER) : sim.players[0])) => (sim && sim.pace >= 2 && p ? weaponStep(id, p.wm || {}) : null);
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
  const map = MAP_BY_ID[selMap], mb = map && profileBest(getBests()[bestKey({ map, hard: hardOn, endless: endlessOn })]), b = mb || load('sq-best', null);
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
async function pickMap(id, remember = true) {
  if (mapLoading || coopLoading && remember) return; selMap = id; if (remember) save('sq-map', id); window.__idleSim = null;
  const map = MAP_BY_ID[id];
  playTitleMusic();
  if (loadedMapId !== id) {
    mapLoading = true; $('start').disabled = true; $('loadtext').textContent = `Loading ${map.name}…`;
    try { await renderer.loadMap(map); loadedMapId = id; renderer.reset(); } finally { mapLoading = false; $('start').disabled = false; $('loadtext').textContent = ''; }
  }
  buildMaps(); showBest(); updateModePicker(); $('tagline').textContent = `${map.name}: ${map.blurb}`; window.__idleSim = null;
  return refreshPendingTitleProgress();
}
const MODE_INFO = {
  normal: 'Campaign maps, gear and permanent progress.',
  boss: 'Fixed Ranger kit. Defeat one boss and retry. Practice only: no GP, gear or campaign progress.',
  raid: 'Survive 25 minutes. Boss waves grow to three living bosses. Earn GP and gear; campaign progress and normal leaderboards stay separate.',
  wizard: 'Solo only. Play as the Wise Old Man with Spells against enemy wizards in Greentown. Dodge their projectiles. Endless survival earns GP and gear; campaign progress and normal leaderboards stay separate.',
  castle: 'Solo only. Defend the west gate with your selected adventurer. Castle destruction or defender death ends the run. Earn GP and gear; campaign progress and normal leaderboards stay separate.',
  fun: 'Slimer invasion in the underground factory. Endless survival with native Slimers and Mutant Slimers. Earn GP and gear; campaign progress and normal leaderboards stay separate.',
};
const MODE_GROUPS = {
  normal: { name:'Adventure', blurb:'Choose a map and make your build.' },
  challenge: { name:'Boss & Raid', blurb:'Learn a boss, or survive its reinforcements.' },
  fun: { name:'Fun', blurb:'Silly ideas. Different ways to survive.' },
};
function showModeCategory(category) {
  if (!Object.hasOwn(MODE_GROUPS, category)) return;
  $('modemenutitle').textContent = MODE_GROUPS[category].name;
  $('modemenublurb').textContent = MODE_GROUPS[category].blurb;
  for (const button of $('modecategories').children) { const on = button.dataset.category === category; button.setAttribute('aria-pressed', String(on)); button.classList.toggle('on', on); }
  for (const button of $('runvariant').children) button.classList.toggle('hidden', button.dataset.category !== category);
  $('racersplay')?.classList.toggle('hidden', category !== 'fun');
}
function openModeMenu(category) {
  if (mode !== 'title' || !canManuallyReload() || !progressCanLoad() || coop) return;
  showModeCategory(category || (selVariant === 'normal' ? 'normal' : ['fun', 'wizard', 'castle'].includes(selVariant) ? 'fun' : 'challenge'));
  updateModePicker(); $('modemenustatus').textContent = '';
  $('modemenu').classList.remove('hidden');
  navFocus([...$('runvariant').children].find(b => !b.classList.contains('hidden') && b.dataset.variant === selVariant) || $('modecategories').querySelector('[aria-pressed="true"]'));
}
function closeModeMenu() {
  $('modemenu').classList.add('hidden'); navFocus($('modebtn'));
}
async function chooseRunMode(value) {
  if (mode !== 'title' || mapLoading || runStarting || coop || !Object.hasOwn(VARIANTS, value)) return;
  $('modemenustatus').textContent = 'Preparing your mode…';
  await selectVariant(value);
  if (loadedMapId === selMap && selVariant === value) closeModeMenu();
  else $('modemenustatus').textContent = 'Could not load the world. Try the mode again.';
}
function enterRacers(event) {
  event.preventDefault();
  if (mode !== 'title' || !canManuallyReload() || !progressCanLoad() || coop) { banner('Finish the current action before opening another game.', 3500); return; }
  cancelPendingLoads(); location.assign('./fun/racers/?mode=hub');
}
function updateModePicker() {
  const special = selVariant !== 'normal', fixed = ['boss', 'fun', 'wizard', 'castle'].includes(selVariant);
  for (const button of $('runvariant').children) { const on = button.dataset.variant === selVariant; button.setAttribute('aria-pressed', String(on)); button.classList.toggle('on', on); button.disabled = mapLoading || runStarting || !!coop; }
  $('trialpick').classList.toggle('hidden', selVariant !== 'boss');
  $('trialboss').disabled = mapLoading || runStarting || !!coop;
  $('mpick').classList.toggle('hidden', fixed);
  $('mappick').classList.toggle('hidden', fixed);
  $('mapinfo').classList.toggle('hidden', special);
  $('modes').classList.toggle('hidden', special); $('best').classList.toggle('hidden', special);
  $('apick').classList.toggle('hidden', selVariant === 'boss' || selVariant === 'wizard');
  $('variantinfo').textContent = special ? MODE_INFO[selVariant] : '';
  const names = { normal:'Adventure', boss:'Boss Trials', raid:'Survival Raid', fun:'Slimer Invasion', wizard:'Wizard Invasion', castle:'Castle Defence' };
  $('modename').textContent = names[selVariant];
  $('modecaption').textContent = special ? ['fun', 'wizard', 'castle'].includes(selVariant) ? 'Fun' : 'Boss & Raid' : 'Game mode';
  $('modebtn').disabled = mapLoading || runStarting || !!coop;
  $('funfeature').classList.toggle('hidden', selVariant !== 'fun');
  $('start').textContent = { normal:'Enter the field', boss:'Challenge the boss', raid:'Enter the raid', fun:'Start the invasion', wizard:'Start the invasion', castle:'Defend the castle' }[selVariant];
  if (selVariant === 'wizard') { $('adventurerlabel').textContent = WISE_OLD_MAN.name; $('ainfo').textContent = 'Wise Old Man · Spells · Solo only'; }
  if (selVariant === 'boss') { $('adventurerlabel').textContent = ADVENTURER_BY_ID[BOSS_KIT.adv].name; $('ainfo').textContent = BOSS_KIT.label; }
}
async function selectVariant(value) {
  if (mode !== 'title' || !Object.hasOwn(VARIANTS, value) || mapLoading || runStarting || coop) return;
  if (selVariant === 'normal' || selVariant === 'raid') fieldMap = selMap;
  selVariant = value; hardOn = endlessOn = false; $('hard').checked = $('endless').checked = false;
  const map = value === 'fun' ? 'oasis' : ['boss', 'wizard', 'castle'].includes(value) ? 'greentown' : fieldMap;
  $('start').disabled = true;
  try { await pickMap(map, false); }
  catch { banner('Could not load the world. Try the mode again.', 3500); }
  finally { $('start').disabled = loadedMapId !== selMap; buildAdventurers(); updateModePicker(); window.__idleSim = null; }
}
for (const button of $('runvariant').children) button.onclick = () => chooseRunMode(button.dataset.variant);
$('modebtn').onclick = () => openModeMenu();
for (const button of $('modecategories').children) button.onclick = () => showModeCategory(button.dataset.category);
$('modemenuclose').onclick = closeModeMenu;
$('modemenu').addEventListener('click', event => { if (event.target.id === 'modemenu') closeModeMenu(); });
$('racersplay').onclick = enterRacers;
$('racersbtn').onclick = enterRacers;
$('trialboss').innerHTML = TRIAL_BOSSES.map(id => `<option value="${id}">${ENEMIES[id].name}</option>`).join('');
$('trialboss').onchange = e => { if (TRIAL_BOSSES.includes(e.target.value)) trialBoss = e.target.value; };
$('hard').onchange = (e) => { hardOn = e.target.checked; showBest(); };
$('endless').onchange = (e) => { endlessOn = e.target.checked; showBest(); };

// ---- ranked: paid tickets, recovery and the holder-style panel ----
const SIM_ID = import.meta.env.VITE_SIM;
let rankedWeek = null, rankedRun = null, rankedRec = null, rankedBusy = false;
let rankedClock = null, rankedAckDeadline = null, rankedWeekOffset = 0, rankedRefreshing = false;
// Standard is the only entry option; saved historical tickets keep their own race.
let rankedMode = 'normal';
const RACE = RANKED.races;
const raceList = (d) => entryRacesOf(d?.week).filter((m) => !d?.races || d.races[m]);
// one race's numbers from /api/ranked-week (an older server only sends the Normal race, at the top level)
const raceOf = (d, m) => (d && d.races && d.races[m]) || (m === 'normal' && d ? { ...d, mode: 'normal', name: 'Normal', rows: d.rows || [] } : null);
const kpmRules = (d) => !!d && ['kpm','combined'].includes(d.rules);
const fmtKpm = (r) => kpm(r.kills, r.t).toFixed(2);
const completedRunText = (r) => Number.isSafeInteger(r.runs) && r.runs > 0 ? `${r.runs.toLocaleString()} completed ${r.runs === 1 ? 'run' : 'runs'} this week` : 'Run count unavailable';
const setRace = () => { rankedMode = 'normal'; save('sq-ranked-mode', rankedMode); };
// the week and race a saved run belongs to, from the run ticket itself if an older save lacks them (display data only:
// the server checks the signed ticket)
function liveRace(live) {
  let tk = {};
  try { tk = JSON.parse(atob(String(live.run).split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))) || {}; } catch { /* keep {} */ }
  return { week: Number.isInteger(live.week) ? live.week : tk.w, mode: (live.mode || tk.m) === 'hard' ? 'hard' : 'normal', started: Number.isFinite(live.started) ? live.started : tk.s };
}
const raceBadge = (m) => (m === 'hard' ? ' (Hard)' : '');
let walletBal = null; // the connected wallet's DMT and ETH on Arbitrum, last read
const rankedLive = () => readRanked('sq-ranked-live');
const rankedPlaying = () => !!rankedRun && !!sim && !sim.over;
const rankedMessage = (text) => { $('rankedmsg').textContent = text; };
function persistRanked() {
  if (!rankedRun || !rankedRec) return false;
  try { writeRanked('sq-ranked-live', { ...rankedRun, log: rankedRec.log() }); return true; }
  catch { banner('Run could not be saved. Keep this page open.', 5000); return false; }
}
setInterval(() => { if (rankedPlaying()) persistRanked(); }, 3000);
function updateRankedPause() {
  const active = rankedPlaying(), started = active ? liveRace(rankedRun).started : null;
  const now = Date.now() + (Number.isFinite(rankedRun?.clockOffset) ? rankedRun.clockOffset : 0);
  const left = active ? pauseRemaining(started, sim.t, now, rankedClock?.creditMs(rankedRec?.ticks ?? 0) ?? 0) : null;
  for (const el of document.querySelectorAll('.rankedpause')) {
    el.classList.toggle('hidden', !active);
    el.classList.toggle('pauseexpired', left !== null && left < 0);
    el.textContent = left === null ? 'Ranked has a 30-minute total pause allowance. The server checks elapsed time.'
      : left < 0 ? 'Pause allowance exceeded. This run cannot qualify.'
      : `Estimated pause allowance left: ${fmtT(Math.floor(left))} / ${fmtT(RANKED.pauseSeconds)}`;
  }
}
setInterval(updateRankedPause, 1000);
function syncRankedClock() {
  if (!rankedPlaying() || !rankedClock || runStarting) return;
  const paused = mode !== 'play' || waitingForMove || !!sim.pending[PLAYER] || document.hidden;
  rankedClock.sync(paused, rankedRec?.ticks ?? 0);
}
function enforceRankedDeadline() {
  if (!rankedPlaying() || runStarting || rankedRun.clockVersion !== 1 || !Number.isSafeInteger(rankedRun.deadline)) return false;
  if (Date.now() + (Number.isFinite(rankedRun.clockOffset) ? rankedRun.clockOffset : 0) < rankedRun.deadline) return false;
  rankedRun.cutoff = true; sim.over = 'time';
  for (const id of ['levelup', 'casket', 'pause', 'settings', 'bug']) $(id).classList.add('hidden');
  endRun();
  return true;
}
setInterval(() => { enforceRankedDeadline(); syncRankedClock(); }, 1000);
function rankedConsent() {
  if (!rankedWeek || !rankedWeek.open) throw plain('Refresh ranked details before paying.');
  const policy = clockPolicy(rankedWeek.week, Date.now() + rankedWeekOffset);
  if (!policy.admissionOpen) throw plain('Ranked starts are closed until the weekly reset. Your saved payments are kept.');
  if (!$('rankedack').checked || rankedAckDeadline !== policy.deadline) throw plain('Read and acknowledge the weekly cutoff before paying or starting.');
  return policy.deadline;
}
addEventListener('pagehide', persistRanked);
document.addEventListener('visibilitychange', () => { if (rankedPlaying()) { enforceRankedDeadline(); syncRankedClock(); persistRanked(); } });
$('rankedname').value = load('sq-name', '');
$('rankedadv').innerHTML = ADVENTURERS.filter((a) => !a.special).map((a) => `<option value="${a.id}">${a.name}</option>`).join('');
for (const id of ['rankedname', 'rankedadv']) $(id).addEventListener('keydown', (e) => e.stopPropagation());
$('rankedname').oninput = () => save('sq-name', $('rankedname').value.trim().slice(0, 16));
function renderRanked() {
  const live = rankedLive(), pending = readRanked('sq-ranked-submit');
  const admission = rankedWeek && clockPolicy(rankedWeek.week, Date.now() + rankedWeekOffset);
  $('rankedenter').disabled = rankedBusy || !rankedWeek?.open || !!live || !!readRanked('sq-ranked-payment') || !admission?.admissionOpen || !!walletNow() && (!$('rankedack').checked || rankedAckDeadline !== admission.deadline);
  const ready = $('rankedready'); ready.replaceChildren();
  const button = (text, fn, start = false) => { const b = document.createElement('button'); b.textContent = text; b.disabled = rankedBusy || start && (!admission?.admissionOpen || !$('rankedack').checked || rankedAckDeadline !== admission.deadline); if (start) b.setAttribute('data-ranked-start', ''); b.onclick = fn; ready.appendChild(b); };
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
  if (!live && rankedWeek) for (const e of readRanked('sq-ranked-entries', []).filter((e) => e.week === rankedWeek.week)) button(`Receipt #${e.id}${raceBadge(e.mode)} ready · Start`, () => startRankedEntry(e), true);
  if (rankedWeek) {
    const races = raceList(rankedWeek); if (!races.includes(rankedMode)) rankedMode = 'normal';
    const race = raceOf(rankedWeek, rankedMode), kp = kpmRules(rankedWeek), combined = rankedWeek.rules === 'combined', two = races.length > 1;
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
      prize.textContent = `${['1st','2nd','3rd','4th','5th'][i] || `${i+1}th`}: ${dmtText(amount)} DMT${race.week >= 1 ? ' + participation' : ''}`;
      pool.append(i ? ' · ' : '', prize);
    });
    for (const text of prizeNotes(race, estimate)) { const note = document.createElement('small'); note.textContent = text; pool.append(note); }
    if (rankedWeek.week >= 1) { const note = document.createElement('small'); note.textContent = 'Prize pool: 80% placing, 10% qualifying runs, 10% active playtime. No run or time caps; verified runs must last at least 3:00. Pauses earn no participation. The developer earns no prizes.'; pool.append(note); }
    const list = document.createElement('ol');
    race.rows.forEach((r, i) => {
      const li = document.createElement('li'), short3 = kp && !placeable(rankedWeek.week, r);
      const name = document.createElement('span'); name.translate = false; name.textContent = r.name || 'Adventurer';
      li.append(name, kp ? ` · ${short(r.wallet)} · ${combined ? `${rankedPoints(r.kills, r.t).toLocaleString()} points · ` : ''}${fmtKpm(r)} kills/min · ${fmtT(r.t)} · ${r.kills} kills${short3 ? ' · too short' : ''}${noPrize(r.wallet) ? ' · dev, no prize' : ''}`
        : ` · ${short(r.wallet)} · ${fmtT(r.t)} · ${r.kills} kills${r.won ? ' · ★ Winner' : ''}${noPrize(r.wallet) ? ' · dev, no prize' : ''}`);
      if (place[i] < 0) li.classList.add('noprize');
      const count = document.createElement('small'); count.className = 'rankedruns'; count.textContent = completedRunText(r); li.appendChild(count);
      list.appendChild(li);
    });
    $('rankedstandings').replaceChildren(list);
    if (!list.children.length) $('rankedstandings').textContent = `No ${two ? race.name + ' ' : ''}runs yet this week.`;
    $('rankedrules').textContent = kp
      ? `${rankedMode === 'hard' ? 'Hard rules: tougher, faster monsters and harder bosses. ' : ''}Runs are endless: ${combined ? 'your score is total kills + seconds survived (one point for each)' : 'your score is kills per minute (kills × 60 ÷ seconds survived)'}, and the hunt is over at ${fmtT(rankedWeek.timeLimit || RANKED.timeLimit)}. A run under ${fmtT(rankedWeek.minSeconds || RANKED.minSeconds)} is listed as too short and cannot win. ${combined ? 'Equal points use kills per minute, then total kills, then the earlier finish.' : 'Ties go to more kills, then the earlier finish.'} Entry is ${race.entryDmt} DMT on Arbitrum: 10% house fee, 90% to the ${race.name} prize pool: 80% split 40/25/15/12/8 between its top five wallets, 10% by qualifying runs and 10% by active playtime; unfilled rewards roll over to next week's ${race.name} pool. Monday to Monday UTC, one map, as many entries as you like in each race, one wallet per player per connection each week. Any regular adventurer, no skills, gear or DMT perks. The server checks every input. Runs must be played live by a person: bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held (resuming after a reload is fine).`
      : rankedWeek.rules === 'time' ? `Runs are endless: your score is how long you survive, then kills, and the hunt is over at ${fmtT(rankedWeek.timeLimit || RANKED.timeLimit)}. Ties go to more kills, then the earlier finish. Entry is ${race.entryDmt} DMT on Arbitrum: 10% house fee, 90% to the ${race.name} prize pool, split 40/25/15/12/8 between its top five wallets; unclaimed places roll over to next week's ${race.name} pool. Monday to Monday UTC, one map, as many entries as you like in each race, one wallet per player per connection each week. Any regular adventurer, no skills, gear or DMT perks. The server checks every input. Runs must be played live by a person: bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held (resuming after a reload is fine).`
      : 'Entry is 0.5 DMT on Arbitrum: 10% house fee, 90% prize pool split 40/25/15/12/8 between the top five wallets. Monday to Monday UTC, one map, as many entries as you like, one wallet per player per connection each week. Any regular adventurer, no skills, gear or DMT perks. The server checks every input. Runs must be played live by a person: bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held (resuming after a reload is fine).';
    rankedTime();
  }
  renderRankedFrom();
}
function rankedTime() {
  if (!rankedWeek) return;
  const now = Date.now() + rankedWeekOffset, policy = clockPolicy(rankedWeek.week, now);
  const left = Math.max(0, Math.ceil(policy.remainingMs / 1000));
  $('rankedtime').textContent = policy.admissionOpen
    ? `New starts close in ${fmtT(Math.max(0, Math.ceil((policy.closesAt - now) / 1000)))} · Monday reset, UTC`
    : `New ranked starts are closed. Next board in ${fmtT(left)}.`;
  $('rankedcutoff').textContent = `Time until the weekly cutoff: ${fmtT(left)}. Your run ends at 00:00 UTC on Monday, even if you are still alive. Your earned score will be submitted. Connection and verification delays can affect submission.`;
  if (!policy.admissionOpen) $('rankedenter').disabled = true;
  for (const button of $('rankedready').querySelectorAll('[data-ranked-start]')) button.disabled = rankedBusy || !policy.admissionOpen || !$('rankedack').checked || rankedAckDeadline !== policy.deadline;
  if (!left && !rankedRefreshing && !rankedPlaying() && !rankedBusy && !buyBusy && !walletConnecting && !walletRequests && !walletModalOpen()) refreshRanked();
}
setInterval(rankedTime, 1000);
async function refreshRanked() {
  if (rankedRefreshing) return;
  rankedRefreshing = true;
  try {
    const next = await rankedApi(BASE, 'week');
    if (next.endsAt !== rankedWeek?.endsAt) { rankedAckDeadline = null; $('rankedack').checked = false; }
    rankedWeek = next; rankedWeekOffset = Number.isFinite(next.serverNow) ? next.serverNow - Date.now() : 0;
    $('rankedbtn').classList.toggle('hidden', !rankedWeek.open); renderRanked();
  } catch {
    rankedWeek = null; $('rankedbtn').classList.add('hidden');
    $('rankedpool').textContent = 'Could not refresh ranked standings. Try again shortly.';
    $('rankedstandings').replaceChildren(); renderRanked();
  } finally { rankedRefreshing = false; }
}
$('rankedack').onchange = () => { rankedAckDeadline = $('rankedack').checked && rankedWeek ? clockPolicy(rankedWeek.week).deadline : null; renderRanked(); };
async function openRanked() {
  if (coop || mode === 'coop') return;
  $('ranked').classList.remove('hidden'); renderRanked(); $('rankedclose').focus(); refreshBalances(true); await refreshRanked();
}
$('rankedbtn').onclick = openRanked;
$('rankedupdate').onclick = () => $('updatebtn').click();
$('rankedclose').onclick = () => { $('ranked').classList.add('hidden'); $('rankedbtn').focus(); };
$('ranked').addEventListener('click', (e) => { if (e.target.id === 'ranked') $('rankedclose').click(); });
for (const id of ['ranked', 'wallet', 'cloudpick', 'walletlink']) $(id).addEventListener('keydown', (e) => {
  if (id !== 'walletlink' && walletModalOpen()) return;
  containMenuTab(e);
});
async function rankedAction(fn) {
  if (coop || mode === 'coop' || rankedBusy || mode === 'recovery') return;
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
  if ($('rkbuy')) $('rkbuy').onclick = () => { buyWant = Math.max(MIN_BUY_DMT, Math.min(MAX_BUY_DMT, Math.ceil((price - (b ? b.dmt : 0)) * 10) / 10)); openWallet(); };
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
  const mode = raceList(rankedWeek).includes(rankedMode) ? rankedMode : 'normal', week = rankedWeek?.week;
  const expectedPrice = raceForWeek(week, mode).entryDmt, displayedPrice = raceOf(rankedWeek, mode)?.entryDmt, price = Number(expectedPrice);
  rankedAction(async () => {
    if (!Number.isSafeInteger(week) || week < 0 || displayedPrice !== expectedPrice) throw plain('Refresh ranked details before paying.');
    const deadline = rankedConsent();
    rankedMessage('Checking your balance on Arbitrum…');
    const b = await refreshBalances(true); // unreadable balances never block: the wallet itself has the last word
    if (b && b.dmt < price) throw plain(`You need ${price} DMT on Arbitrum to enter${mode === 'hard' ? ' the Hard race' : ''}.`);
    if (b && b.eth < ETH_FOR_GAS) throw plain('You need a little ETH on Arbitrum for the network fee.');
    $('rankedtx').replaceChildren();
    await payEntry(c.w, BASE, rankedMessage, (tx) => { $('rankedtx').innerHTML = `<a href="${arbiscanTx(tx)}" target="_blank" rel="noopener">See your payment on Arbiscan</a>`; }, mode, week, {build:BUILD, sim:SIM_ID, deadline});
    refreshBalances(true);
  });
};
async function startRankedEntry(entry) {
  await rankedAction(async () => {
    if (rankedLive()) throw new Error('Resume your saved ranked run first.');
    const deadline = rankedConsent();
    if (!SIM_ID) throw new Error('This build has no ranked simulation version.');
    await requireRankedBuild(BASE, {build:BUILD, sim:SIM_ID});
    writeRanked('sq-ranked-entries', readRanked('sq-ranked-entries', []));
    const adv = $('rankedadv').value;
    rankedMessage('Loading this week’s map…');
    if (mapLoading) throw new Error('The map is still loading. Try again in a moment.');
    selVariant = 'normal';
    await pickMap(rankedWeek.map);
    rankedMessage('Starting your ranked run…');
    const d = await rankedApi(BASE, 'start', { entry: entry.entry, adv, sim: SIM_ID, build:BUILD, deadline });
    const live = { run: d.run, started: d.started, deadline: d.deadline, clockVersion: d.clockVersion, clockOffset: Number.isFinite(d.serverNow) ? d.serverNow - Date.now() : 0, adv, seed: d.seed, map: d.map, week: d.week, mode: d.mode === 'hard' ? 'hard' : 'normal', sim: SIM_ID, name: $('rankedname').value.trim().slice(0, 16) || 'Adventurer', log: new RunRecorder().log() };
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
  try { writeRanked('sq-ranked-submit', body); }
  catch {
    const text = 'Ranked submission could not be queued on this device. Keep this page open, free some storage and retry.';
    $('rankedresult').textContent = text; rankedMessage(text); $('rankedretry').classList.remove('hidden'); return;
  }
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
    let archiveFailed = false;
    if (e.status === 400 && !e.retry) {
      try {
        let r = {};
        try { const payload = JSON.parse(atob(String(body.run).split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))); if (payload && typeof payload === 'object') r = payload; } catch { /* malformed tickets still retain gameplay evidence */ }
        // Keep one diagnostic replay, without its signed ticket, wallet or player name.
        writeRanked('sq-ranked-rejected', { params: { id:r.id, week:r.w, seed:r.seed, adv:r.adv, sim:r.v, started:r.s, mode:r.m === 'hard' ? 'hard' : 'normal' }, log:body.log, reason:String(e.message).slice(0,500) });
        localStorage.removeItem('sq-ranked-submit'); localStorage.removeItem('sq-ranked-live'); rankedRun = null; rankedRec = null;
      } catch { archiveFailed = true; $('rankedretry').classList.remove('hidden'); }
    } else $('rankedretry').classList.remove('hidden');
    const text = (e.status ? e.message : 'Could not reach ranked. Your run is saved: retry when your connection returns.')
      + (archiveFailed ? ' The diagnostic replay could not be saved. Keep this page open, free some storage and retry.' : '');
    $('rankedresult').textContent = text; rankedMessage(text);
  } finally { rankedBusy = false; renderRanked(); }
}
$('rankedretry').onclick = submitRanked;

// ---- skills shop ----------------------------------------------------------------------------------------------------
function progressionText(meta, gear) {
  const { vet } = createSim({ meta, players: [{ id: PLAYER, gear: selVariant !== 'wizard' && runAdv().id !== selAdv ? {} : gear }] });
  const strength = Math.round((vet - 1) * 100000) / 1000;
  const spawns = Math.round(strength * 0.55 * 1000) / 1000;
  return `Casual scaling: enemy HP/contact damage +${strength}%; base spawn pressure +${spawns}%.`;
}
function changeSkills(action) {
  if (!canManuallyReload() || !progressCanLoad() || $('skills').classList.contains('hidden')) return false;
  try {
    const next = prepareSkills(localStorage, action);
    importProgress(localStorage, next.data);
  } catch (error) {
    if (error.recovery) { cancelPendingLoads(); showProgressRecovery(() => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen() && !rankedBusy, false, error.runRecovery ? { retry: () => recoverRunProgress(localStorage), reload: true } : null); }
    else { try { buildSkills(); navFocus($('skillsclose')); } catch { /* keep the previous progress if its display also fails */ } }
    $('skillstatus').textContent = 'The skill change was not confirmed saved. Your previous progress is kept.';
    return false;
  }
  try {
    if (onSaved) onSaved('sq-skills');
    showBest(); buildSkills();
    navFocus(action.id && $('skillgrid').querySelector('button[data-id="' + action.id + '"]:not(:disabled)') || $('skillsclose'));
  } catch { $('skillstatus').textContent = 'Skills were saved on this device. Reopen Skills to refresh the display.'; navFocus($('skillsclose')); }
  return true;
}
function buildSkills() {
  const lv = getSkills(), coins = getCoins(), status = $('skillstatus'); let quote;
  try { quote = skillQuote(localStorage); status.textContent = ''; }
  catch { status.textContent = 'Skill progress could not be read. Keep this device’s progress.'; }
  $('coins2').textContent = coins;
  $('skillpressure').textContent = progressionText(lv, getGear());
  $('skillgrid').innerHTML = SKILL_IDS.map((id) => {
    const s = SKILLS[id], l = lv[id] || 0, max = l >= s.max, cost = skillCost(id, l);
    return `<div class="skill"><img src="${asset('')}${s.icon}" alt=""><h4>${s.name}</h4><div class="pips">${'■'.repeat(l)}${'□'.repeat(s.max - l)}</div><p style="grid-column:1/-1">${s.blurb}</p><button data-id="${id}" ${!quote || max || coins < cost ? 'disabled' : ''}>${max ? 'Maxed' : `Train · ${cost} coins`}</button></div>`;
  }).join('');
  const current = () => {
    if (!canManuallyReload() || !progressCanLoad() || $('skills').classList.contains('hidden')) return false;
    let latest; try { latest = skillQuote(localStorage); }
    catch { status.textContent = 'Skill progress could not be read. Keep this device’s progress.'; return false; }
    if (latest.identity !== quote?.identity) {
      buildSkills(); status.textContent = 'Your skills changed. Review the current ranks and try again.'; navFocus($('skillsclose')); return false;
    }
    return true;
  };
  for (const b of $('skillgrid').querySelectorAll('button')) b.onclick = () => {
    if ($('skillgrid').contains(b) && current()) changeSkills({kind:'train',id:b.dataset.id});
  };
  // A detached card or a closed menu cannot complete a delayed hold.
  $('skillgrid').querySelectorAll('.skill').forEach((el, i) => {
    const id = SKILL_IDS[i]; let hold = 0, held = false;
    const undo = () => { if ((lv[id] || 0) > 0 && $('skillgrid').contains(el) && current()) changeSkills({kind:'undo',id}); };
    el.title = (lv[id] || 0) ? 'Right-click to undo a rank (full refund)' : '';
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); clearTimeout(hold); held = true; undo(); });
    el.addEventListener('touchstart', () => { clearTimeout(hold); held = false; hold = setTimeout(() => { held = true; undo(); }, 600); }, { passive: true });
    // A completed hold must not click the newly rendered Train button when the finger lifts.
    el.addEventListener('touchend', (e) => { clearTimeout(hold); if ((held || !$('skillgrid').contains(el) || $('skills').classList.contains('hidden')) && e.cancelable) e.preventDefault(); }, { passive: false });
    for (const ev of ['touchmove', 'touchcancel']) el.addEventListener(ev, () => clearTimeout(hold), { passive: true });
  });
  const all = $('skillrefund'); all.disabled = !quote?.amount; all.dataset.sure = '';
  all.textContent = quote?.amount ? `Refund all · ${quote.amount.toLocaleString()} coins back` : 'Refund all';
  all.onclick = () => {
    if (!canManuallyReload() || !progressCanLoad() || $('skills').classList.contains('hidden')) return;
    let latest; try { latest = skillQuote(localStorage); }
    catch { status.textContent = 'Skill progress could not be read. Keep this device’s progress.'; return; }
    if (!latest.amount) return;
    if (all.dataset.sure !== latest.identity) { all.dataset.sure = latest.identity; all.textContent = `Click again to refund every skill (${latest.amount.toLocaleString()} coins)`; return; }
    changeSkills({kind:'refund'});
  };
}
$('upgradesbtn').onclick = () => { $('upgrades').classList.remove('hidden'); navFocus($('gearbtn')); };
$('upgradesclose').onclick = () => { $('upgrades').classList.add('hidden'); navFocus($('upgradesbtn')); };
$('upgrades').addEventListener('click', e => { if (e.target.id === 'upgrades') $('upgradesclose').click(); });
$('skillsbtn').onclick = () => { buildSkills(); $('skills').classList.remove('hidden'); navFocus($('skillgrid').querySelector('button:not(:disabled)') || ($('skillrefund').disabled ? $('skillsclose') : $('skillrefund'))); };
// tapping outside a menu panel closes it
for (const id of ['skills', 'gear', 'quests']) $(id).addEventListener('click', (e) => { if (e.target.id === id) { if (id === 'skills' || id === 'gear') $(id + 'close').click(); else $(id).classList.add('hidden'); } });
$('skillsclose').onclick = () => { $('skillrefund').dataset.sure = ''; $('skills').classList.add('hidden'); navFocus($('skillsbtn')); };

// ---- loading ------------------------------------------------------------------------------------------------------------
const labels = { map: 'Drawing the map…', props: 'Raising Greentown…', monsters: 'Waking the monsters…', ready: 'Ready' };
function applySavedGraphics(rawSettings = load('sq-settings', {})) {
  const st = cleanSettings(rawSettings);
  if (!Number.isFinite(rawSettings?.v) || rawSettings.v < 2) { st.roofs = 'off'; st.quality = 'auto'; st.v = 2; save('sq-settings', st); }
  renderer.applySettings({ ...rendererDefaults, ...st });
}
function applyImportedPreferences(data) {
  const graphics = Object.hasOwn(data, 'sq-settings') || Object.hasOwn(data, 'sq-roofs');
  const sound = Object.hasOwn(data, 'sq-muted') || Object.hasOwn(data, 'sq-vol');
  if (sound) audio.applyPreferences(data);
  if (graphics) applySavedGraphics(Object.hasOwn(data, 'sq-settings') ? JSON.parse(data['sq-settings']) : undefined);
  if ((graphics || sound || Object.hasOwn(data, 'sq-autoalch')) && !$('settings').classList.contains('hidden')) buildSettings();
}
async function boot() {
  if (params.has('qa')) document.body.classList.add('qa');
  try {
    await pickAssetHost(); // jsDelivr, or the game's own host if it does not answer
    renderer = await createRenderer($('c'), (stage, v) => { $('loadfill').style.width = Math.round(v * 100) + '%'; $('loadtext').textContent = labels[stage] || ''; });
    rendererDefaults = renderer.getSettings();
    $('loadtext').textContent = ''; $('loadbar').classList.add('hidden');
    await renderer.preloadGear(Object.values(getGear()));
    applySavedGraphics();
    applyPetChoice();
    $('start').disabled = false; buildAdventurers(); buildMaps(); showBest(); updateModePicker(); renderer.setZoom(0.45); renderer.setShift(2.4);
    if (selMap !== 'greentown') await pickMap(selMap);
    playTitleMusic();
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
function changeArmoury(action) {
  if (!canManuallyReload() || !progressCanLoad()) return false;
  try {
    const next = prepareArmoury(localStorage, action);
    importProgress(localStorage, next.data);
  } catch (error) {
    $('gearstatus').textContent = 'The gear change was not confirmed saved. Your previous progress is kept.';
    if (error.recovery) { cancelPendingLoads(); showProgressRecovery(() => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen() && !rankedBusy, false, error.runRecovery ? { retry: () => recoverRunProgress(localStorage), reload: true } : null); }
    return false;
  }
  const displayFailed = () => { $('gearstatus').textContent = 'Gear was saved on this device. Reopen Gear to refresh its display.'; };
  try {
    if (onSaved) onSaved('sq-gearlv');
    showBest(); buildGear(); Promise.resolve(refreshIdle()).catch(displayFailed);
  } catch { displayFailed(); }
  return true;
}
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
      return `<div class="gitem locked" title="${n}">${imgTag(n)}<div><b>${n}</b><span>${bonusText(gearPieceBonus(n))}</span><span class="dim">${how}</span></div></div>`;
    }
    const lv = lvs[n] || 0, cost = gearUpgradeCost(n, lv), m = 1 + 0.25 * lv, b = Object.fromEntries(Object.entries(gearPieceBonus(n)).map(([k, v]) => [k, v * m]));
    const up = smithNext(n), smith = up && !owned.has(up.name) ? `<button class="gsmith" data-n="${n}" ${coins < up.cost ? 'disabled' : ''}>Smith into ${up.name} · ${up.cost.toLocaleString()} coins</button>` : '';
    return `<div class="gitem${gear[gearSlotSel] === n ? ' on' : ''}" data-n="${n}" title="${n}">${imgTag(n)}<div><b>${n}${lv ? ` +${lv}` : ''}</b><span>${bonusText(b)}${GEAR[n].set && GEAR_SETS[GEAR[n].set] && !ARMOR_TIERS.includes(GEAR[n].set) ? ` · ${GEAR[n].set} set` : ''}</span>
        ${smith}<button class="gup ghost" data-n="${n}" ${lv >= GEAR_MAX_LV || coins < cost ? 'disabled' : ''}>${lv >= GEAR_MAX_LV ? 'Fully reinforced' : `Reinforce +${lv + 1} · ${cost} coins`}</button></div></div>`;
  };
  $('gearbank').innerHTML = gearGroups(gearSlotSel).map((g) => {
    const have = g.items.filter((n) => owned.has(n)).length;
    return `<h4 class="ghead">${g.title} <span>${have}/${g.items.length}</span>${GROUP_NOTE[g.title] ? `<small>${GROUP_NOTE[g.title]}</small>` : ''}</h4>${g.items.map(itemHTML).join('')}`;
  }).join('') || '<p class="gempty">Nothing for this slot.</p>';
  for (const b of $('gearbank').querySelectorAll('.gup')) b.onclick = e => { e.stopPropagation(); changeArmoury({kind:'reinforce',name:b.dataset.n}); };
  for (const b of $('gearbank').querySelectorAll('.gsmith')) b.onclick = e => { e.stopPropagation(); if (changeArmoury({kind:'smith',name:b.dataset.n})) audio.play('smith', {minGap:0}); };
  for (const el of $('gearbank').querySelectorAll('.gitem:not(.locked)')) el.onclick = () => {
    const g = getGear(); if (g[gearSlotSel] === el.dataset.n) delete g[gearSlotSel]; else g[gearSlotSel] = el.dataset.n;
    save('sq-gear', g); buildGear(); refreshIdle();
  };
  const b = gearBonus(gear, lvs), { sets, ...rest } = b;
  $('gearinfo').innerHTML = `<b>Worn:</b> ${Object.keys(rest).length ? bonusText(rest) : 'nothing yet'}${sets.length ? `<br><b>Set bonus:</b> ${sets.map((x) => `${x} (${GEAR_SETS[x].text})`).join(', ')}` : ''}<br><span class="dim">${bank.length} of ${Object.keys(GEAR).length} pieces found · ${coins} coins for the Armoury</span>`;
  const refund = $('gearrefund'), status = $('gearstatus'); let quote;
  try { quote = armouryQuote(localStorage); }
  catch { status.textContent = 'Gear payment history could not be read. Keep this device’s progress.'; for (const b of $('gearbank').querySelectorAll('.gup,.gsmith')) b.disabled = true; }
  refund.disabled = !quote?.amount; refund.dataset.sure = '';
  refund.textContent = quote?.amount ? `Refund all · ${quote.amount.toLocaleString()} coins back` : 'Refund all';
  if (quote) status.textContent = quote.legacy ? 'Older reinforcements use a conservative refund. New purchases refund their recorded price. Collected gear and Smithing unlocks stay yours.' : 'Refunds reset reinforcements only. Collected gear and Smithing unlocks stay yours.';
  refund.onclick = () => {
    if (!canManuallyReload() || !progressCanLoad()) return;
    let latest; try { latest = armouryQuote(localStorage); } catch { status.textContent = 'Gear payment history could not be read. Keep this device’s progress.'; return; }
    if (!latest.amount) return;
    if (refund.dataset.sure !== latest.identity) {
      refund.dataset.sure = latest.identity; refund.textContent = 'Confirm refund';
      status.textContent = `Refund ${latest.amount.toLocaleString()} coins and reset all reinforcements? Collected gear and Smithing unlocks stay yours.`;
      if (latest.legacy) status.textContent += ' Older metal ranks use one Bronze refund value per Smithing family.';
      return;
    }
    changeArmoury({kind:'refund'});
  };

}
async function refreshIdle() { window.__idleSim = null; if (renderer) await renderer.preloadGear(Object.values(getGear())); }
$('gearbtn').onclick = () => { buildGear(); $('gear').classList.remove('hidden'); navFocus($('gearclose')); };

// ---- cosmetic companions (device preference, outside progress/cloud/transfer) ----
const petPreference = value => petChoice(value) || bunChoice(value);
let selectedPet = petPreference(load('sq-pet', null)), petRemembered = true, petRequest = 0;
let petViewer = null, petViewDrag = null, petPreviewFailed = false;
// BUN authority stays in memory; a stored token ID is only a preference.
const bunCompanions = createBunCompanions({ walletNow, walletRevision, onChange: applyPetChoice });
document.addEventListener('visibilitychange', () => { if (document.hidden) bunCompanions.clear(); else bunCompanions.refresh(); });
function currentPetChoice() { return petChoice(selectedPet) || bunCompanions.resolve(selectedPet); }
function buildPets() {
  const focused = document.activeElement?.dataset?.pet, hadFocus = $('pets').contains(document.activeElement);
  const choices = [[null, 'No companion'], ...Object.entries(NATIVE_PETS).map(([id, pet]) => [id, pet.name])];
  // BUN picker: only a current verified catalogue entry becomes a button.
  const ownership = bunCompanions.state();
  for (const pet of ownership.pets) if (pet.eligible) choices.push(['bun:' + pet.tokenId, `${pet.variety} · BUN #${pet.tokenId}`]);
  $('petbunstatus').textContent = !walletNow() ? 'Connect a wallet from the main menu to check your BUN companions.' : ownership.status === 'loading' ? 'Checking BUN ownership…' : ownership.status !== 'ready' ? 'Could not verify BUN ownership. Ordinary companions are still available.' : ownership.pets.some(pet => pet.eligible) ? 'BUN ownership verified. Companions are cosmetic.' : 'No usable BUN companions found. Eggs must be hatched; unsupported appearances cannot be equipped.';
  $('petbunrefresh').disabled = !walletNow() || ownership.status === 'loading';
  // End BUN picker.
  $('petlist').innerHTML = choices.map(([id, name]) => `<button class="ghost" data-pet="${id || ''}" aria-pressed="${selectedPet === id}"><span class="pet-choice-name">${name}</span><small>${selectedPet === id ? 'Selected' : 'Choose'}</small></button>`).join('');
  for (const button of $('petlist').querySelectorAll('button')) button.onclick = () => {
    selectedPet = petPreference(button.dataset.pet);
    try { localStorage.setItem('sq-pet', JSON.stringify(selectedPet)); petRemembered = true; } catch { petRemembered = false; }
    if (bunChoice(selectedPet)) bunCompanions.refresh(); else applyPetChoice();
  };
  const state = renderer?.petState() || 'idle';
  $('petloadtext').textContent = state === 'loading' ? 'Loading companion…' : state === 'unavailable' ? 'Could not load this companion. You can still play.' : selectedPet ? 'Your companion is ready.' : 'No companion selected.';
  if (bunChoice(selectedPet) && !currentPetChoice()) $('petloadtext').textContent = 'BUN ownership must be verified before this companion can appear.';
  $('petpreviewname').textContent = choices.find(([id]) => id === selectedPet)?.[1] || 'Choose a companion';
  const previewState = petViewer?.state() || (petPreviewFailed ? 'unavailable' : 'idle');
  $('petpreviewempty').classList.toggle('hidden', previewState === 'ready');
  $('petpreviewempty').textContent = previewState === 'loading' ? 'Loading preview…' : previewState === 'unavailable' ? 'Preview unavailable' : 'Choose a companion';
  $('petpreviewhint').textContent = previewState === 'unavailable' ? '3D preview unavailable. You can still choose a companion.' : 'Drag the model to rotate';
  for (const id of ['petrotateleft','petrotateright','petresetview']) $(id).disabled = previewState !== 'ready';
  $('petvisit').classList.toggle('hidden', petRemembered);
  $('petretry').classList.toggle('hidden', state !== 'unavailable');
  if (focused !== undefined || hadFocus && (!$('pets').contains(document.activeElement) || document.activeElement?.disabled)) navFocus($('petlist').querySelector(`[data-pet="${focused}"]`) || $('petlist').querySelector('[aria-pressed="true"]') || $('petlist').querySelector('button'));
}
function syncPetPreview() {
  if (!petViewer) return Promise.resolve();
  const viewer = petViewer, choice = currentPetChoice(), request = petRequest;
  return viewer.set(choice, () => viewer === petViewer && request === petRequest && choice === currentPetChoice() && !$('pets').classList.contains('hidden'));
}
function openPetPreview() {
  petViewer?.dispose(); petViewer = null; petViewDrag = null; petPreviewFailed = false;
  try {
    const old = $('petpreview'), canvas = old.cloneNode(false);
    old.replaceWith(canvas); // a closed WebGL context cannot be reused on the same canvas
    petViewer = renderer.createPetPreview(canvas);
    canvas.onpointerdown = event => {
      if (event.button !== 0 || petViewDrag || petViewer?.state() !== 'ready') return;
      petViewDrag = { id:event.pointerId, x:event.clientX }; canvas.setPointerCapture(event.pointerId); event.preventDefault();
    };
    canvas.onpointermove = event => {
      if (petViewDrag?.id !== event.pointerId) return;
      petViewer?.rotate((event.clientX - petViewDrag.x) * .012); petViewDrag.x = event.clientX; event.preventDefault();
    };
    canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = event => { if (petViewDrag?.id === event.pointerId) petViewDrag = null; };
    const viewer = petViewer;
    syncPetPreview().then(() => { if (viewer === petViewer && !$('pets').classList.contains('hidden')) buildPets(); });
  } catch { petViewer?.dispose(); petViewer = null; petPreviewFailed = true; }
  buildPets();
}
async function applyPetChoice() {
  if (!renderer) return;
  const request = ++petRequest, choice = currentPetChoice();
  const pending = renderer.setPet(choice, () => request === petRequest && choice === currentPetChoice());
  if (!$('pets').classList.contains('hidden')) buildPets();
  await Promise.all([pending, syncPetPreview()]);
  if (request === petRequest && !$('pets').classList.contains('hidden')) buildPets();
}
$('petsbtn').onclick = () => { buildPets(); $('pets').classList.remove('hidden'); openPetPreview(); navFocus($('petlist').querySelector('[aria-pressed="true"]') || $('petlist').querySelector('button')); };
$('petbunrefresh').onclick = () => bunCompanions.refresh();
$('petretry').onclick = applyPetChoice;
$('petsclose').onclick = () => { petViewer?.dispose(); petViewer = null; petViewDrag = null; $('pets').classList.add('hidden'); navFocus($('petsbtn')); };
$('petrotateleft').onclick = () => petViewer?.rotate(-Math.PI / 4);
$('petrotateright').onclick = () => petViewer?.rotate(Math.PI / 4);
$('petresetview').onclick = () => petViewer?.resetRotation();
addEventListener('blur', () => { petViewDrag = null; });
$('pets').addEventListener('click', e => { if (e.target.id === 'pets') $('petsclose').click(); });
$('gearclose').onclick = () => { $('gear').classList.add('hidden'); navFocus($('gearbtn')); };

// ---- settings ---------------------------------------------------------------------------------------------------------
const SETTINGS = [
  { head: 'Display' },
  { id: 'layout', name: 'Screen layout', opts: [['auto', 'Auto'], ['standard', 'Standard'], ['ds', 'Flex mode']] },
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
  { id: 'sound', name: 'All audio', opts: [[true, 'On'], [false, 'Off']] },
  { vol: 's', name: 'Sound effects' },
  { vol: 'm', name: 'Music' },
  { head: 'Game' },
  { id: 'keepplaying', name: 'Keep playing when unfocused (this device)', opts: [[false, 'Off'], [true, 'On']] },
  { note: 'Visible game windows can keep running while you use another window. Hidden tabs still pause.' },
  { id: 'fx', name: 'Effects', opts: [['full', 'Full'], ['reduced', 'Reduced']] },
  { id: 'numbers', name: 'Damage numbers', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'shake', name: 'Screen shake', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'autoequip', name: 'Auto equip safe armour upgrades (this device)', opts: [[true, 'On'], [false, 'Off']] },
  { note: 'Keeps every stat and any set you have started. Weapons stay manual.' },
  { id: 'autoalch', name: 'Auto high alch caskets that are not better', opts: [[true, 'On'], [false, 'Off']] },
];function buildSettings() {
  const cur = { ...renderer.getSettings(), sound: !audio.muted, autoalch: autoAlchOn(), autoequip: autoEquipOn(), keepplaying: keepPlayingUnfocused(), layout: screenLayout.mode };
  const groups = [...$('setlist').querySelectorAll('details[data-section]')], expanded = new Set(groups.filter(el => el.open).map(el => el.dataset.section));
  let section = 0;
  $('setlist').innerHTML = SETTINGS.filter(o => o.id !== 'layout' || screenLayout.available).map((o) => o.head ? `${section++ ? '</details>' : ''}<details class="setgroup" data-section="${o.head}"${expanded.has(o.head) || !groups.length && o.head === 'Display' ? ' open' : ''}><summary class="sethead">${o.head}</summary>` : o.note ? `<p class="dim setnote">${o.note}</p>` : o.vol ? `<div class="setrow volsetting"><label for="volume-${o.vol}">${o.name}</label><div class="volrow"><input id="volume-${o.vol}" type="range" min="0" max="100" step="5" value="${audio.volume(o.vol)}" data-vol="${o.vol}" aria-label="${o.name} volume"><b>${audio.volume(o.vol)}%</b></div></div>` : `<div class="setrow"><span>${o.name}</span><div class="seg">${o.opts.map(([v, label]) => `<button class="${cur[o.id] === v ? 'on' : 'ghost'}" data-id="${o.id}" data-v='${JSON.stringify(v)}'>${label}</button>`).join('')}</div></div>`).join('') + '</details>';
  let blip = 0, soundPreview = 0;
  for (const r of $('setlist').querySelectorAll('input[data-vol]')) {
    r.addEventListener('keydown', (e) => e.stopPropagation()); // arrow keys move the slider, not the menu
    r.oninput = () => {
      const revision = ++soundPreview;
      audio.setVolume(r.dataset.vol, r.value); r.nextElementSibling.textContent = `${audio.volume(r.dataset.vol)}%`;
      const ready = audio.init();
      if (r.dataset.vol === 's') ready.then(() => {
        if (revision !== soundPreview || !r.isConnected || $('settings').classList.contains('hidden') || performance.now() - blip <= 150) return;
        blip = performance.now(); audio.play('pickup', { minGap: 0 });
      }).catch(() => {});
      else ready.catch(() => {});
    };
  }
  for (const b of $('setlist').querySelectorAll('button')) b.onclick = () => {
    const id = b.dataset.id, v = JSON.parse(b.dataset.v), focused = document.activeElement === b;
    if (id === 'layout') screenLayout.setMode(v);
    else {
      if (id === 'sound') audio.setMuted(!v); else if (id === 'autoalch') save('sq-autoalch', v === true); else if (id === 'autoequip') save('sq-autoequip', v === true); else if (id === 'keepplaying') save('sq-keep-playing-unfocused', v === true); else renderer.applySettings({ [id]: v });
      save('sq-settings', { ...renderer.getSettings(), v: 2 });
    }
    buildSettings();
    if (focused) navFocus($('setlist').querySelector(`button[data-id="${id}"][data-v='${JSON.stringify(v)}']`));
  };
}
const openSettings = () => { buildSettings(); $('settings').classList.remove('hidden'); navFocus($('settings').querySelector('summary') || $('setclose')); };
$('setbtn').onclick = openSettings; $('setbtn2').onclick = openSettings;
$('setclose').onclick = () => { $('settings').classList.add('hidden'); navFocus($(mode === 'title' ? ($('setbtn').closest('#actions') ? 'setbtn' : 'morebtn') : 'setbtn2')); };
$('settings').addEventListener('click', (e) => { if (e.target.id === 'settings') $('setclose').click(); });

function guideRecipes(pace) {
  return Object.entries(EVOLUTIONS).map(([id, evolution]) => `<div class="guiderecipe"><span>${esc(WEAPONS[id].name)}</span> → <b>${esc(evolution.name)}</b><small>${evolutionPassives(id, pace).map(passive => `<span>${esc(PASSIVES[passive].name)}</span>`).join(' / ')}</small></div>`).join('');
}
$('guidebtn').onclick = () => {
  $('guidecurrentrecipes').innerHTML = guideRecipes(2);
  const original = $('guideoldrecipes'); if (original) original.innerHTML = guideRecipes(1);
  $('guide').classList.remove('hidden'); navFocus($('guide').querySelector('summary'));
};
$('guideclose').onclick = () => { $('guide').classList.add('hidden'); navFocus($('morebtn')); };
$('guide').addEventListener('click', e => { if (e.target.id === 'guide') $('guideclose').click(); });
function containMenuTab(e) {
  if (e.key !== 'Tab') return;
  const nodes = [...e.currentTarget.querySelectorAll('summary, [data-milestone][tabindex="0"], button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')].filter(n => n.offsetParent !== null);
  if (!nodes.length) return;
  if (e.shiftKey && document.activeElement === nodes[0]) { nodes.at(-1).focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { nodes[0].focus(); e.preventDefault(); }
}
for (const id of ['modemenu', 'guide', 'pets', 'more', 'quests', 'gear', 'skills', 'upgrades', 'settings']) $(id).addEventListener('keydown', containMenuTab);

// ---- updates log -------------------------------------------------------------------------------------------------------
$('updnew').classList.toggle('hidden', load('sq-seen', '') === LATEST);
$('morenew').classList.toggle('hidden', load('sq-seen', '') === LATEST);
// More: the extras (settings, updates, DMT, bug report, install) in one small panel
$('morebtn').onclick = () => { $('more').classList.remove('hidden'); navFocus($('guidebtn')); };
$('moreclose').onclick = () => { $('more').classList.add('hidden'); navFocus($('morebtn')); };
$('more').addEventListener('click', (e) => { if (e.target.id === 'more') $('more').classList.add('hidden'); });
// ---- move progress to another device: a code with the save (progress and settings only, never ranked tickets, a DMT
// pass or a wallet), checked key by key on the way in like the old-address hand-off in index.html
const b64 = (s) => btoa(unescape(encodeURIComponent(s))), unb64 = (s) => decodeURIComponent(escape(atob(s)));
const xferSum = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h.toString(36); };
function xferCode() {
  const d = {};
  for (const k of XFER_KEYS) {
    let raw; try { raw = localStorage.getItem(k); } catch { throw Error('Could not read saved progress. Keep this app installed.'); }
    if (raw === null) continue;
    if (raw.length > 20000) throw Error('This save is too large for a progress code. Keep this device’s save.');
    if (k === 'sq-roofs') { if (['off', 'on', 'auto'].includes(raw)) d[k] = raw; continue; }
    let value; try { value = JSON.parse(raw); } catch { value = undefined; }
    if (value !== undefined && validProfileValue(k, value)) d[k] = raw;
    else {
      if (k === 'sq-armoury') throw Error('Could not export Armoury payment history. Keep this device’s progress.');
      const safe = profileValue(k, value);
      if (safe !== undefined) d[k] = JSON.stringify(safe);
    }
    if (d[k]?.length > 20000) throw Error('This save is too large for a progress code. Keep this device’s save.');
  }
  const body = b64(JSON.stringify(d)); return `SQS1.${body}.${xferSum(body)}`;
}
function xferRead(code) {
  // 19 values of 20k UTF16 units can expand through JSON escaping and base64 to over 3MB.
  if (String(code).length > 4000000) return { error: 'This progress code is too large to load.' };
  const m = /^SQS1\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/.exec(String(code).replace(/\s+/g, ''));
  if (!m) return { error: 'That is not a progress code. It starts with SQS1.' };
  if (xferSum(m[1]) !== m[2]) return { error: 'The code is cut short or changed. Copy it again.' };
  let d; try { d = JSON.parse(unb64(m[1])); } catch { return { error: 'The code could not be read. Copy it again.' }; }
  const invalid = { error: 'Progress code contains invalid save data. Your current progress has not changed.' };
  if (!d || typeof d !== 'object' || Array.isArray(d)) return invalid;
  const out = {};
  for (const k of XFER_KEYS) {
    if (!Object.hasOwn(d, k)) continue;
    const v = d[k]; if (typeof v !== 'string' || v.length > 20000) return invalid;
    if (k === 'sq-roofs') { if (!['off', 'on', 'auto'].includes(v)) return invalid; out[k] = v; continue; }
    try { if (!validProfileValue(k, JSON.parse(v))) return invalid; out[k] = v; } catch { return invalid; }
  }
  if (!Object.keys(out).length) return { error: 'The code has no progress in it.' };
  if (!Object.hasOwn(out, 'sq-armoury') && ['sq-coins','sq-gearlv','sq-bank'].some(k => Object.hasOwn(out,k))) out['sq-armoury'] = 'null';
  const j = (k, f) => profileValue(k, Object.hasOwn(out, k) ? JSON.parse(out[k]) : f, f);
  const skills = j('sq-skills', {}), ranks = Object.values(skills).reduce((a, b) => a + finiteNumber(b), 0);
  return { data: out, coins: j('sq-coins', 0), maps: j('sq-cleared', []).length, ranks, gear: j('sq-bank', []).length };
}
$('xferbtn').onclick = () => { $('more').classList.add('hidden'); $('xfermsg').textContent = ''; $('xferpeek').textContent = ''; $('xferin').value = ''; $('xferload').disabled = true; $('xfer').classList.remove('hidden'); };
$('xferclose').onclick = () => $('xfer').classList.add('hidden');
$('xfer').addEventListener('click', (e) => { if (e.target.id === 'xfer') $('xfer').classList.add('hidden'); });
$('xferin').addEventListener('keydown', (e) => e.stopPropagation());
$('xfercopy').onclick = async () => {
  let code; try { code = xferCode(); } catch (error) { $('xfermsg').textContent = error.message; return; }
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
function showProgressRecovery(canRestart = () => true, settingsOnly = false, runRecovery = null) {
  mode = 'recovery';
  const screen = $('progressrecovery'), retry = $('progressretry');
  $('progressrecoverytitle').textContent = runRecovery ? 'Save your finished run' : settingsOnly ? 'Finish applying settings' : 'Restore progress before playing';
  $('progressrecoverytext').textContent = runRecovery ? 'This run has not been confirmed saved. Keep this page open, free some browser storage, then retry before playing or saving to your wallet.' : settingsOnly ? 'Your imported progress is saved. Reload the game to finish applying display and sound settings before playing.' : 'A progress save could not finish. Your previous progress is backed up on this device. Restore it before playing or saving to your wallet.';
  retry.textContent = runRecovery ? 'Retry saving run' : settingsOnly ? 'Reload game' : 'Restore previous progress';
  screen.classList.remove('hidden'); screen.inert = walletModalOpen();
  if (!screen.inert) retry.focus();
  screen.onkeydown = e => { if (e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); retry.focus(); } e.stopPropagation(); };
  retry.onclick = async () => {
    if (retry.disabled) return;
    const waiting = () => { $('progressrecoverystatus').textContent = runRecovery ? 'Finish your wallet action before saving this run.' : 'Finish your wallet action before restarting the game.'; retry.disabled = false; if (!walletModalOpen()) retry.focus(); };
    if (!canRestart()) { waiting(); return; }
    retry.disabled = true; $('progressrecoverystatus').textContent = '';
    try {
      let applied = false;
      await withImportLock(() => {
        if (!canRestart()) return;
        if (runRecovery) runRecovery.retry(); else if (!settingsOnly) recoverProgressImport(localStorage);
        applied = true;
      });
      if (!applied) { waiting(); return; }
      if (runRecovery && !runRecovery.reload) { screen.classList.add('hidden'); retry.disabled = false; return; }
      if (!canRestart()) { waiting(); return; }
      location.reload();
    }
    catch { $('progressrecoverystatus').textContent = runRecovery ? 'This browser still cannot save the run. Keep this page open, free some storage and try again.' : settingsOnly ? 'The game could not restart. Try again.' : 'This browser still cannot restore progress. Free some storage and try again. Keep this app installed.'; retry.disabled = false; if (!walletModalOpen()) retry.focus(); }
  };
}
$('xferload').onclick = async () => {
  if (importAttempt) return;
  if (!canManuallyReload()) { $('xfermsg').textContent = 'Finish your run or wallet action before loading progress.'; return; }
  if (!progressCanLoad()) { $('xfermsg').textContent = 'The game is not ready to load progress yet.'; return; }
  const r = xferRead($('xferin').value); if (r.error) { $('xfermsg').textContent = r.error; return; }
  if ($('xferload').dataset.sure !== '1') { $('xferload').dataset.sure = '1'; $('xferload').textContent = 'Replace this device\'s progress?'; $('xfermsg').textContent = `This device has ${getCoins().toLocaleString()} coins now. Click again to load the code.`; return; }
  cancelPendingLoads();
  const attempt = importAttempt = {}; $('xferload').disabled = true;
  try {
    await withImportLock(() => {
      if (importAttempt !== attempt || !canManuallyReload() || !progressCanLoad()) return;
      importProgress(localStorage, r.data);
      try { applyImportedPreferences(r.data); }
      catch { cancelPendingLoads(); showProgressRecovery(() => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen() && !rankedBusy, true); return; }
      $('xfermsg').textContent = 'Loaded. Restarting…'; queuePageReload('Loaded. Restarting…', 600);
    });
  } catch (e) {
    if (e.recovery) { cancelPendingLoads(); showProgressRecovery(() => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen() && !rankedBusy, false, e.runRecovery ? { retry: () => recoverRunProgress(localStorage), reload: true } : null); }
    else $('xfermsg').textContent = 'This browser will not save (private mode?).';
  } finally {
    if (importAttempt === attempt) { importAttempt = null; $('xferload').disabled = false; }
  }
};
for (const b of document.querySelectorAll('#more .morelist button')) b.addEventListener('click', () => $('more').classList.add('hidden'), true);
async function copyUpdate(button) {
  const block = button.closest('.upd');
  const text = `${block.querySelector('.updhead b').textContent}\n${block.querySelector('.updhead span').textContent}\n\n${[...block.querySelectorAll('li')].map(el => '- ' + el.textContent).join('\n')}`;
  button.disabled = true;
  try { await navigator.clipboard.writeText(text); button.textContent = 'Copied'; }
  catch {
    let box = block.querySelector('.updcopytext');
    if (!box) { box = block.ownerDocument.createElement('textarea'); box.className = 'updcopytext'; box.readOnly = true; box.ariaLabel = 'Update text'; block.append(box); }
    box.value = text; box.focus(); box.select(); button.textContent = 'Select and copy';
  } finally { button.disabled = false; }
}
$('updbtn').onclick = () => {
  $('updlist').innerHTML = CHANGELOG.map((u) => `<div class="upd"><div class="updhead"><b>${u.title}</b><span>${u.date} · v${u.version}</span><button class="ghost updcopy" data-copy-update>Copy</button></div><ul>${u.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('');
  for (const b of $('updlist').querySelectorAll('[data-copy-update]')) b.onclick = () => copyUpdate(b);
  $('updates').classList.remove('hidden'); navFocus($('updclose')); save('sq-seen', LATEST); $('updnew').classList.add('hidden'); $('morenew').classList.add('hidden');
};
$('updclose').onclick = () => { $('updates').classList.add('hidden'); navFocus($($('updbtn').closest('#actions') ? 'updbtn' : 'morebtn')); };
$('updates').addEventListener('click', (e) => { if (e.target.id === 'updates') $('updates').classList.add('hidden'); });

function playTitleMusic() {
  if (mode !== 'title') return;
  audio.duck(false); audio.music(MAP_BY_ID[selMap].music);
}
function unlockAudio(event) {
  if (event ? !event.isTrusted : !globalThis.navigator?.userActivation?.hasBeenActive) return;
  playTitleMusic();
  audio.init(event?.isTrusted === true).catch(() => {});
}
for (const type of ['click', 'touchend', 'keydown']) addEventListener(type, unlockAudio, true);
// The first gesture may have happened in the owned preboot save chooser.
unlockAudio();

// ---- version, leaderboard and bug reports ------------------------------------------------------------------------------
$('version').textContent = 'v' + LATEST;
$('version').title = 'Updates';
$('version').onclick = () => $('updbtn').click(); // the version in the corner opens Updates
// Reuse the same controls and unread badge; compact touch menus keep them in More.
const roomyTitle = matchMedia('(min-width: 1100px) and (min-height: 650px)');
const extraHome = new Map(['setbtn', 'updbtn'].map(id => { const node = $(id), marker = document.createComment(id); node.before(marker); return [node, marker]; }));
function arrangeTitleExtras() {
  const focused = document.activeElement;
  for (const [node, marker] of extraHome) roomyTitle.matches ? $('desktop-extras').append(node) : marker.after(node);
  if (extraHome.has(focused)) navFocus(focused);
}
roomyTitle.addEventListener('change', arrangeTitleExtras); arrangeTitleExtras();

const recentErrors = [];
addEventListener('error', (e) => { recentErrors.push(String(e.message || e).slice(0, 300)); if (recentErrors.length > 8) recentErrors.shift(); });
addEventListener('unhandledrejection', (e) => { recentErrors.push(String(e.reason && e.reason.message || e.reason).slice(0, 300)); if (recentErrors.length > 8) recentErrors.shift(); });
const ADV_NAME = (id) => (ADVENTURER_BY_ID[id] || {}).name || id;
let lbMap = null, lbMode = 'casual', lbEndless = false, lbRequest = 0;
const rankedIsOpen = () => !$('rankedbtn').classList.contains('hidden');
// the leaderboard: Ranked standings or Casual, for one map or the top five on every map
async function showBoard(mapId, mode) {
  const request = ++lbRequest;
  if (mode) lbMode = mode; if (mapId && mapId !== 'ranked') lbMap = mapId; lbMap = lbMap || selMap;
  if (mapId === 'ranked') lbMode = 'ranked';
  if (lbMode === 'ranked' && !rankedIsOpen()) lbMode = 'casual';
  $('lbtabs').innerHTML = (rankedIsOpen() ? `<div class="lbmode"><button class="${lbMode === 'ranked' ? 'on' : 'ghost'} rankedtab" data-mode="ranked">Ranked</button><button class="${lbMode === 'casual' ? 'on' : 'ghost'}" data-mode="casual">Casual</button></div>` : '')
    + (lbMode === 'casual' ? `<label class="lbpick">Map <select id="lbmapsel"><option value="all"${lbMap === 'all' ? ' selected' : ''}>All maps</option>${MAPS.map((m) => `<option value="${m.id}"${m.id === lbMap ? ' selected' : ''}>${m.name}</option>`).join('')}</select></label>`
      + `<div class="lbmode lbsub"><button class="${!lbEndless ? 'on' : 'ghost'}" data-endless="0">15:00 runs</button><button class="${lbEndless ? 'on' : 'ghost'}" data-endless="1">Endless</button></div>` : '');
  for (const b of $('lbtabs').querySelectorAll('[data-mode]')) b.onclick = () => showBoard(null, b.dataset.mode);
  if ($('lbmapsel')) $('lbmapsel').onchange = (e) => showBoard(e.target.value, 'casual');
  for (const b of $('lbtabs').querySelectorAll('[data-endless]')) b.onclick = () => { lbEndless = b.dataset.endless === '1'; showBoard(null, 'casual'); };
  $('lblist').innerHTML = '<p class="dim">Loading…</p>';
  if (lbMode === 'ranked') return showRankedBoard(request);
  const endless = lbEndless, all = lbMap === 'all';
  const maps = all ? MAPS : [{ id: lbMap }];
  const boards = await Promise.all(maps.map(async (map) => {
    let body;
    try {
      const r = await fetch(`${BASE}api/scores?map=${encodeURIComponent(map.id)}${endless ? '&endless=1' : ''}`);
      if (r.status === 503) body = '<p class="dim">The shared leaderboard opens soon. Your best run: ' + localBest() + '</p>';
      else {
        if (!r.ok) throw Error('leaderboard unavailable');
        const d = await r.json(), rows = d.rows || [];
        body = casualBoardRows(all ? rows.slice(0, 5) : rows, endless);
      }
    } catch (e) { body = '<p class="dim">Could not reach the leaderboard.</p>'; }
    return all ? `<section class="lbmapgroup"><h3>${esc(map.name)}</h3>${body}</section>` : body;
  }));
  if (request === lbRequest) $('lblist').innerHTML = boards.join('');
}
function casualBoardRows(rows, endless) {
  const myName = load('sq-name', ''); // your own runs stand out
  return rows.length ? `<table class="lbtable"><tr><th>#</th><th>Name</th><th class="opt">Adventurer</th><th>Time</th><th class="opt">Level</th><th>Slain</th></tr>${rows.map((x, i) => `<tr class="${x.won ? 'won' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td><span translate="no">${esc(x.name)}</span>${x.holder ? ' <span class="dmtb">DMT</span>' : ''}${x.hard ? ' <em>hard</em>' : ''}</td><td class="opt">${esc(ADV_NAME(x.adv))}</td><td>${fmtT(x.t)}${x.won ? ' ✔' : ''}</td><td class="opt">${x.level}</td><td>${x.kills}</td></tr>`).join('')}</table>` : (endless ? '<p class="dim">No endless runs on this map yet. Clear the map, then tick Endless on the title screen and see how long you last.</p>' : '<p class="dim">No runs on this map yet. Be the first.</p>');
}
// Immutable week-0 receipts, independently checked against the finalized DMT transfers.
function rewardTransactions() {
  const paid = [
    ['ArkRide', '20.7', '0xe88ddc1b2197b812337e5c088e83db7566fc33e016e983a0a6b36b4e4565b28d'],
    ['michaelsankson', '12.9375', '0x96a43beee6771909d6b4b0dd62582284d302dbc6639e98678e71cb5710c02bfc'],
    ['c3nt3no', '7.7625', '0x6b81995683682e9aa82c06d5e56210d88ca3bab21e0e7fec6c2d94d3566cfba0'],
    ['The Merchant', '6.21', '0xb9c0494c3a34277e8ba985af63bce9903aa405f451647085c6b11418909eb1b1'],
    ['FUZZY', '4.14', '0xaf14bf819f32a711451db8085e56e8802a3631b78fe425af7427bd6be71dd319'],
    ['House', '5.75', '0x2d9e8600183ed29d0b6eea736649d658a061c1002d743ae15c054cd6c816759c'],
  ];
  return `<details class="rewardreceipts"><summary>Week 0 · confirmed reward transactions</summary><ul>${paid.map(([name, amount, tx]) => `<li><span translate="no">${name}</span> · ${amount} DMT · <a href="https://arbiscan.io/tx/${tx}" target="_blank" rel="noopener">View transaction</a></li>`).join('')}</ul></details>`;
}
// this week's ranked standings: each wallet's best run, and what the top places would win if the week ended now
async function showRankedBoard(request = ++lbRequest) {
  try {
    const r = await fetch(`${BASE}api/ranked-week`); if (!r.ok) throw Error('ranked unavailable'); const d = await r.json();
    if (request !== lbRequest) return;
    const races = raceList(d); if (!races.includes(rankedMode)) rankedMode = 'normal';
    const race = raceOf(d, rankedMode), kp = kpmRules(d), combined = d.rules === 'combined', two = races.length > 1;
    const rows = race.rows || [], pays = d.payouts || [], myName = load('sq-name', '');
    const place = prizePlaces(rows, d.week), estimate = prizeEstimate(race, place, pays);
    const left = Math.max(0, (d.endsAt || 0) - Date.now()), dd = Math.floor(left / 86400000), hh = Math.floor((left % 86400000) / 3600000);
    const tabs = two ? `<div class="lbmode lbrace" role="tablist" aria-label="Ranked race">${races.map((m) => `<button role="tab" data-race="${m}" aria-selected="${m === rankedMode}" class="${m === rankedMode ? 'on' : 'ghost'}">${RACE[m].name} <span>${esc(raceOf(d, m).entryDmt)} DMT</span></button>`).join('')}</div>` : '';
    const head = `${tabs}<p class="lbweek">${esc((MAP_BY_ID[d.map] || {}).name || d.map)}${two ? ` · ${race.name}` : ''} · <b>${esc(poolReadout(race))}</b> · resets in ${dd}d ${hh}h</p>`
      + prizeNotes(race, estimate).map(text => `<p class="lbweek dim">${esc(text)}</p>`).join('')
      + (kp ? `<p class="lbweek dim">Score: ${combined ? 'total kills + seconds survived. Equal points use KPM' : 'kills per minute'}. Runs under ${fmtT(d.minSeconds || RANKED.minSeconds)} cannot win.</p>` : '');
    const prize = (i) => {
      const total = walletPrize(estimate, rows[i].wallet, place[i]);
      return noPrize(rows[i].wallet) ? '<span class="dim">no prize (dev)</span>' : total === null ? '—' : total !== '0' || place[i] >= 0 ? `${dmtText(total)} DMT` : '<span class="dim">too short</span>';
    };
    const wal = (x) => esc(String(x.wallet || '').slice(0, 6) + '…' + String(x.wallet || '').slice(-4));
    $('lblist').innerHTML = head + (rows.length ? (kp
      ? `<table class="lbtable"><tr><th>#</th><th>Name</th><th class="opt">Wallet</th><th class="opt">Adventurer</th><th>${combined ? 'Points' : 'KPM'}</th><th>Time</th><th>Slain</th>${combined ? '<th class="opt">KPM</th>' : ''}<th>Estimated prize</th></tr>${rows.map((x, i) => `<tr class="${place[i] < 0 ? 'short' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td><span translate="no">${esc(x.name)}</span><small class="rankedruns">${esc(completedRunText(x))}</small></td><td class="opt">${wal(x)}</td><td class="opt">${esc(ADV_NAME(x.adv))}</td><td>${combined ? rankedPoints(x.kills, x.t).toLocaleString() : fmtKpm(x)}</td><td>${fmtT(x.t)}</td><td>${x.kills}</td>${combined ? `<td class="opt">${fmtKpm(x)}</td>` : ''}<td class="prizeamt">${prize(i)}</td></tr>`).join('')}</table>`
      : `<table class="lbtable"><tr><th>#</th><th>Name</th><th class="opt">Wallet</th><th class="opt">Adventurer</th><th>Time</th><th>Slain</th><th>Estimated prize</th></tr>${rows.map((x, i) => `<tr class="${x.won ? 'won' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td><span translate="no">${esc(x.name)}</span><small class="rankedruns">${esc(completedRunText(x))}</small></td><td class="opt">${wal(x)}</td><td class="opt">${esc(ADV_NAME(x.adv))}</td><td>${fmtT(x.t)}${x.won ? ' ✔' : ''}</td><td>${x.kills}</td><td class="prizeamt">${prize(i)}</td></tr>`).join('')}</table>`)
      : `<p class="dim">No ${two ? race.name + ' ' : ''}ranked runs yet this week. Enter from the Ranked button on the title screen.</p>`)
      + (d.week >= 1 ? `<p class="lbweek dim">Prize pool: 80% placing, 10% qualifying runs, 10% active playtime. No run or time caps; verified runs must last at least 3:00. Pauses earn no participation. The developer earns no prizes.</p>` : '')
      + (estimate?.participation?.length ? `<details><summary>Participation rewards</summary><ul>${estimate.participation.map(p => { const row = rows.find(r => r.wallet === p.wallet); return `<li><span translate="no">${esc(row?.name || p.wallet)}</span> · ${dmtText(p.amount)} DMT</li>`; }).join('')}</ul></details>` : '')
      + rewardTransactions();
    for (const b of $('lblist').querySelectorAll('[data-race]')) b.onclick = () => { setRace(b.dataset.race); showRankedBoard(); };
  } catch (e) { if (request === lbRequest) $('lblist').innerHTML = '<p class="dim">Could not reach ranked.</p>'; }
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// ---- something to chase every run (owner: "we also want the game to be really addicting"): your best per map and mode,
// and in ranked your place on this week's board as you play
let runBest = null, passedBest = false, chase = null; // chase: { rows (others' bests), week, kp }
function chaseText(t, kills) {
  if (!chase || !chase.rows.length) return '';
  const min = RANKED.minSeconds, mine = kpm(kills, t);
  if (chase.combined) {
    if (t < min) return ` · places from ${fmtT(min)}`;
    const wins = (n, row) => rankedPoints(n, t) > rankedPoints(row.kills, row.t) || rankedPoints(n, t) === rankedPoints(row.kills, row.t) && (kpmMicro(n, t) > kpmMicro(row.kills, row.t) || kpmMicro(n, t) === kpmMicro(row.kills, row.t) && n > row.kills);
    const ahead = chase.rows.filter(row => row.t >= min && !wins(kills, row));
    if (!ahead.length) return ' · #1 vs starting board';
    const place = ahead.length + 1, next = ahead[ahead.length - 1], to = place > 25 ? 'the top 25' : `#${place - 1}`;
    let target = Math.max(kills + 1, rankedPoints(next.kills, next.t) - Math.floor(t));
    if (!wins(target, next)) target++;
    const n = target - kills, where = place > 25 ? 'outside starting top 25' : `#${place} vs starting board`;
    return ` · ${where} · ${n} kill${n === 1 ? '' : 's'} to ${to}`;
  }
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
async function submitScore(target = lastRun) {
  // DOM click events are not result objects; every request owns its captured result.
  if (!target || target.type === 'click') target = lastRun;
  if (!target || target.coop || target.variant) return { ok: false };
  if (target.sent) return { ok: true };
  const name = target.name || $('lbname').value.trim().slice(0, 16);
  if (!name) { $('lbmsg').textContent = 'Type a name first.'; return { ok: false }; }
  const session = casualRun?.sim === sim ? casualRun : null;
  if (session?.tickets) await session.tickets;
  if (session && session !== casualRun) return { ok: false };
  if (session && (target === session.normalResult || target === session.result)) target.ticket = target.endless && session.normalResult ? session.endlessTicket : session.ticket;
  if (!target.ticket) { if (target === lastRun) $('lbmsg').textContent = 'Could not send.'; return { ok: false }; }
  target.name = name;
  if (target === lastRun) { $('lbname').value = name; $('lbname').disabled = true; }
  save('sq-name', name);
  if (target === lastRun) { $('lbsubmit').disabled = true; $('lbmsg').textContent = 'Sending…'; }
  let out;
  try {
    out = await submitCasualResult(target, { ...target, name, pass: (savedPass() || {}).pass }, async payload => {
      const r = await fetch(`${BASE}api/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({})); return { ...d, ok: r.ok, status: r.status };
    });
  } catch { out = { ok: false }; }
  if (target === lastRun && (!session || session === casualRun)) {
    $('lbmsg').textContent = out.ok ? out.rank ? `You are #${out.rank} on ${MAP_BY_ID[target.map].name}!` : 'Sent!' : out.status === 503 ? 'The shared leaderboard opens soon.' : out.status === 429 ? 'Wait a moment and try again.' : 'Could not send.';
    $('lbsubmit').disabled = !!out.ok;
  }
  return out;
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
  const text = lastRun.ranked && lastRun.rank && lastRun.points != null ? `I'm #${lastRun.rank} in this week's SankoSurvivors ${race}ranked race on ${m}: ${lastRun.points.toLocaleString()} points (${lastRun.kills} slain + ${Math.floor(lastRun.t)} seconds survived). Top 5 split the ${race}$DMT pot. Can you knock me off?`
    : lastRun.ranked && lastRun.rank && lastRun.kpm != null ? `I'm #${lastRun.rank} in this week's SankoQuest Survivors ${race}ranked race on ${m}: ${lastRun.kpm.toFixed(2)} kills per minute (${lastRun.kills} slain in ${fmtT(lastRun.t)}). Top 5 split the ${race}$DMT pot. Can you knock me off?`
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
let walletConnecting = null, walletRequests = 0;
async function walletConnect(w, owner = null) {
  cancelPendingLoads(); holderChecking = null;
  if (walletConnecting !== owner) { walletConnecting = owner; $('walletmsg').textContent = ''; }
  walletRequests++;
  try { return await requestWallet(w); } finally { walletRequests--; }
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
let cloudConnecting = null, cloudChoice = null, reloadTimer = 0, runStarting = false, updateAttempt = null, importAttempt = null, holderChecking = null, titleProgressPending = false;
const cloudCanLoad = () => mode === 'title' && !runStarting && !coopLoading && !rankedBusy && !rankedLive();
const progressCanLoad = () => cloudCanLoad() && !!renderer && !mapLoading && !$('start').disabled;
const canReloadGame = () => cloudCanLoad() && !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen();
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
    const result = await prove(w, BASE, text => { current(); onStep(text); }, current, active => { walletRequests += active ? 1 : -1; });
    current(); return result;
  } finally { if (holderChecking === attempt) holderChecking = null; }
}
let titleName = $('rankedname').value;
function syncTitleNames(force = false) {
  const value = load('sq-name', ''), name = typeof value === 'string' ? value : '';
  for (const id of ['rankedname', 'lbname']) {
    const input = $(id);
    if ((force || input !== document.activeElement && input.value === titleName) && input.value !== name) input.value = name;
  }
  titleName = name;
}
function titleNameEditing() {
  return ['rankedname', 'lbname'].some(id => { const input = $(id); return input === document.activeElement || input.value !== titleName; });
}
function syncTitleProgress() {
  titleProgressPending = false;
  fieldMap = savedChoice('sq-map', MAP_BY_ID, 'greentown');
  selMap = selVariant === 'fun' ? 'oasis' : ['boss', 'wizard', 'castle'].includes(selVariant) ? 'greentown' : fieldMap;
  selAdv = savedChoice('sq-adv', ADVENTURER_BY_ID, 'adventurer');
  syncTitleNames();
  buildAdventurers(); buildMaps(); showBest(); window.__idleSim = null;
}
function refreshTitleProgress() {
  syncTitleProgress();
  return pickMap(selMap, false).catch(e => banner('Could not load the world: ' + (e?.message || e), 4000));
}
function refreshPendingTitleProgress() {
  if (titleProgressPending && progressCanLoad()) return refreshTitleProgress();
}
function queuePageReload(text, delay, forceNames = true) {
  if (!cloudCanLoad()) return;
  if (forceNames) syncTitleNames(true);
  refreshTitleProgress();
  if (!canReloadGame() || !forceNames && titleNameEditing()) return;
  clearTimeout(reloadTimer); banner(text, 3000);
  reloadTimer = setTimeout(() => { reloadTimer = 0; if (canReloadGame() && (forceNames || !titleNameEditing())) location.reload(); }, delay);
}
const cloud = createCloud(BASE, {
  signing: active => { walletRequests += active ? 1 : -1; },
  canLoad: progressCanLoad,
  canSave: () => mode !== 'recovery',
  merged: () => {
    syncTitleNames();
    titleProgressPending = true;
    refreshPendingTitleProgress();
  },
  recover: error => { cancelPendingLoads(); showProgressRecovery(() => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen() && !rankedBusy, false, error?.runRecovery ? { retry: () => recoverRunProgress(localStorage), reload: true } : null); },
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
const cloudPull = async () => { if (!cloud.state() || !progressCanLoad()) return; if (await cloud.pull()) queuePageReload('Loading your progress from your other device…', 600, false); else cloud.changed(); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudPull(); else if (cloud.state()) cloud.push(true); });
setTimeout(cloudPull, 1500);
// ---- buy DMT with ETH without leaving the game (src/swap.js: KyberSwap, checked before the wallet sees it) -------------
let buyWant = 0, buyQuote = null, buyBusy = null, buyPriceRequest = 0, buyNotice = null; // requested DMT, visible quote and this page's swap state
const BUY_AMOUNTS = [1, 2, 5, 10];
function buyHTML(b) {
  const amts = buyWant && !BUY_AMOUNTS.includes(buyWant) && buyWant >= MIN_BUY_DMT && buyWant <= MAX_BUY_DMT ? [buyWant, ...BUY_AMOUNTS] : BUY_AMOUNTS;
  return `<div class="wlbuy"><p><b>Buy DMT</b> <span class="dim">with ETH on Arbitrum, in one step</span></p><p class="dim">Choose 1–10 DMT. The quote shows the approximate output and guaranteed minimum.</p><div class="lurow">${amts.map(d => `<button class="ghost wlbuyamt${d === buyWant ? ' on' : ''}" data-dmt="${d}">${d} DMT</button>`).join('')}</div><div id="wlbuyq" class="dim">${buyNoticeHTML() || (b && b.eth < ETH_FOR_GAS ? `You need ETH on Arbitrum to buy with. <a href="${BRIDGE}" target="_blank" rel="noopener">Bridge ETH</a>` : 'Swaps through KyberSwap at the best DMT price. The game takes no fee.')}</div></div>`;
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
function openWallet() { if (coop || mode === 'coop') return; $('walletmsg').textContent = ''; renderWallet(); $('wallet').classList.remove('hidden'); $('walletclose').focus(); refreshBalances(true); }
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
  bunCompanions.refresh();
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
  $('progressrecovery').inert = !!state;
  canvas.width = canvas.height = 0;
  if (!state) { if (screen.contains(document.activeElement)) navScreen()?.querySelector('button, a[href]')?.focus(); return; }
  $('walletlinktext').textContent = state.phase === 'loading' ? 'Preparing wallet connection…' : state.phase === 'pair' ? 'Open your wallet to approve this connection, then switch back to this app. Your game stays here.' : 'Approve the request in your connected wallet, then switch back to this app. Your game stays here.';
  $('walletlinkapps').innerHTML = (state.phase === 'loading' ? [] : walletConnectLinks(state.phase === 'pair' ? state.uri : null)).map(([name, url]) => `<a class="btnlink" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open ${name}</a>`).join('');
  $('walletlinkback').textContent = state.phase === 'request' ? 'Back to game' : 'Cancel connection';
  if (state.phase === 'loading') $('walletlinkback').focus(); else $('walletlinkapps').querySelector('a')?.focus();
  if (state.phase === 'pair') {
    $('walletlinkqrtext').textContent = 'Scan with any WalletConnect wallet';
    import('qrcode').then(({default: encoder}) => {
      if (walletConnectState() === state) return encoder.toCanvas(canvas, state.uri, { width: 256, margin: 4 });
    }).catch(() => { if (walletConnectState() === state) $('walletlinkqrtext').textContent = 'QR code unavailable. Use a wallet button above.'; });
  }
}

watchWalletConnect(renderWalletConnect);
$('walletlinkback').onclick = () => { if (walletConnectState()?.phase === 'request') dismissWalletConnect(); else cancelWalletConnect(); };
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
    const r = await fetch(`${BASE}api/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, map: sim ? sim.map.id : selMap, adv: sim ? (sim.coop ? sim.players.find(p => p.id === PLAYER) : sim.players[0]).adv : selAdv, v: LATEST, settings: renderer.getSettings(), errors: recentErrors }) });
    if (r.ok) { $('bugmsg').textContent = 'Thanks, it was sent.'; $('bugtext').value = ''; }
    else $('bugmsg').innerHTML = r.status === 503 ? `Reports open soon. Until then, message <a href="${CREATOR.x}" target="_blank" rel="noopener">@${CREATOR.handle}</a> on X.` : r.status === 429 ? 'One report a minute, please.' : 'Could not send.';
  } catch (e) { $('bugmsg').textContent = 'Could not send.'; }
  $('bugsend').disabled = false;
};

// ---- quests ------------------------------------------------------------------------------------------------------------
function buildQuests() {
  const st = getStats(), done = questsDone();
  const card = q => {
    const ok = done.has(q.id), v = ok ? q.goal : Math.max(0, Math.min(q.goal, statVal(st, q.stat))), ready = !ok && v >= q.goal;
    return `<div class="quest${ok ? ' done' : ''}" tabindex="0" data-milestone="${q.id}"><div class="qhead"><b>${q.name}</b><span>${ok ? 'Complete' : ready ? 'Ready' : `${v.toLocaleString()} / ${q.goal.toLocaleString()}`}</span></div><p>${q.text}</p><div class="qbar" role="progressbar" aria-label="${q.name}" aria-valuemin="0" aria-valuemax="${q.goal}" aria-valuenow="${v}"><i style="width:${(v / q.goal) * 100}%"></i></div>${ready ? '<p class="qready">Finish a run to record this milestone.</p>' : ''}<div class="qreward">${q.achievement ? '<span aria-hidden="true">★</span> <span>Achievement</span>' : `${imgTag('Gold')} ${q.coins} coins${q.item ? ` · ${imgTag(q.item)} ${q.item}` : ''}`}</div></div>`;
  };
  $('questlist').innerHTML = [['quests','Quests',QUESTS],['achievements','Achievements',ACHIEVEMENTS]].map(([id,title,list]) => `<details class="questgroup" data-milestone-group="${id}"${id === 'quests' ? ' open' : ''}><summary><span>${title}</span><span class="qcount" translate="no">${list.filter(q => done.has(q.id)).length} / ${list.length}</span></summary><div class="questcards">${list.map(card).join('')}</div></details>`).join('');
}
$('questbtn').onclick = () => { buildQuests(); $('quests').classList.remove('hidden'); navFocus($('questclose')); };
$('questclose').onclick = () => { $('quests').classList.add('hidden'); navFocus($('morebtn')); };

// small notes that slide in during a run (casket loot)
function toast(html) { const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = html; $('toasts').appendChild(el); setTimeout(() => el.remove(), 4200); }

// ---- run lifecycle ----------------------------------------------------------------------------------------------------
let runTicket = null;
let casualRun = null;
function loadCasualTickets(session) {
  if (session.sim.variant) return;
  const s = session.sim, query = new URLSearchParams({ map: s.map.id, adv: s.players[0].adv, hard: s.hard ? '1' : '0', endless: s.endless ? '1' : '0' });
  session.tickets = fetch(`${BASE}api/run?${query}`).then(r => r.ok ? r.json() : null).then(d => {
    if (casualRun !== session || sim !== s) return;
    session.ticket = d?.ticket || null; session.endlessTicket = d?.endlessTicket || null;
    runTicket = session.phase === 'endless' ? session.endlessTicket : session.ticket;
  }).catch(() => {});
}

function runGround() {
  const T = renderer.terrain;
  return T ? { n: T.cell ? T.cells : T.n, blocked: T.blocked, cell: !!T.cell, water: T.water || null, walls: T.walls || null, fences: T.fences || null } : null;
}
// ---- co-op lobby: casual invite rooms, never paid ranked -------------------------------------------------------------
const coopRelay = import.meta.env.VITE_COOP_RELAY || COOP_RELAY;
const COOP_STATUS = {
  connecting:'Connecting to co-op…', lobby:'Share the invite code, then both players choose Ready.', starting:'Starting together…', loading:'Loading the shared world…', playing:'Connected', waiting:'Waiting for your teammate to reconnect…', reconnecting:'Reconnecting… The shared run is paused.', catchingUp:'Catching up with your teammate…',
  roomMissing:'Room not found. Check the invite code.', roomFull:'That room already has two players.', serverFull:'Co-op is busy. Try again shortly.', versionMismatch:'Both players need the same game update.', notReady:'Both players must be ready.', invalidStart:'Both players must unlock the selected map and mode.',
  hostLeft:'The host left. This co-op run has ended.', playerLeft:'Your teammate left. This co-op run has ended.', left:'You left the co-op run.', reconnectExpired:'The connection could not recover in time.', loadFailed:'The shared world could not load. Return to the menu and try again.', loadTimeout:'A player could not finish loading in time.',
  connectionLost:'Connection lost. This co-op run has ended.', connectionFailed:'Could not connect to co-op.', connectionSlow:'The connection is too slow.', hostStalled:'The host stopped sending the shared run.', desync:'The shared run no longer agrees. It has ended safely.', serverClosed:'The co-op server restarted. This run has ended.', ended:'This co-op run has ended.',
};
function coopText(code) { return COOP_STATUS[code] || 'This co-op run could not be verified.'; }
function showCoopRoom(room) {
  $('coopform').classList.add('hidden'); $('cooproom').classList.remove('hidden');
  $('coopcode').textContent = room.code;
  const map = MAP_BY_ID[room.settings.map];
  $('coopmap').textContent = `${map.name}${room.settings.variant ? ' · ' + VARIANTS[room.settings.variant].name : ''}${room.settings.hard ? ' · Hard' : ''}${room.settings.endless ? ' · Endless' : ''}`;
  $('coopmembers').innerHTML = room.members.map(m => `<p><b translate="no">${esc(m.loadout.name)}</b> · ${ADVENTURER_BY_ID[room.settings.variant==='boss'?BOSS_KIT.adv:map.forceAdv || m.loadout.adv].name} · <span>${!m.connected ? 'Disconnected' : m.ready ? 'Ready' : 'Not ready'}</span></p>`).join('');
  const me = room.members.find(m => m.id === room.you);
  $('coopready').textContent = me.ready ? 'Not ready' : 'Ready'; $('coopready').setAttribute('aria-pressed', String(me.ready));
  $('coopgo').classList.toggle('hidden', room.you !== 'p1'); $('coopgo').disabled = room.members.length !== 2 || !room.members.every(m => m.ready && m.connected);
}
function coopLoadout() {
  const gear = getGear(), levels = getGearLv();
  return { name:$('coopname').value.trim().slice(0,16) || 'Adventurer', adv:selAdv, meta:getSkills(), gear, gearLv:Object.fromEntries(Object.values(gear).filter(n => levels[n]).map(n => [n,levels[n]])), cleared:[...clearedMaps()].filter(id => Object.hasOwn(MAP_BY_ID,id)) };
}
function openCoop() {
  if (selVariant === 'castle') { banner('Castle Defence is solo only. Choose another mode for co-op.', 3500); return; }
  if (selVariant === 'wizard') { banner('Wizard Invasion is solo only. Choose another mode for co-op.', 3500); return; }
  if (mode !== 'title' || !canManuallyReload() || !progressCanLoad() || readRanked('sq-ranked-payment') || readRanked('sq-ranked-submit')) { banner('Finish the current action before joining co-op.', 3500); return; }
  cancelPendingLoads(); mode = 'coop'; coopHomeMap = selMap; coopResult = null; lastRun = null;
  $('more').classList.add('hidden'); $('coop').classList.remove('hidden'); $('coopform').classList.remove('hidden'); $('cooproom').classList.add('hidden');
  $('coopname').value = load('sq-name','').slice(0,16); $('coopinvite').value = '';
  for (const id of ['coopcreate','coopjoin']) $(id).disabled = !coopRelay;
  $('coopstatus').textContent = coopRelay ? 'Create a room with your selected map and adventurer, or enter an invite code.' : 'Online co-op is not available in this build yet.';
  $('coopclose').focus();
  if (!coopRelay) return;
  const homeMap = coopHomeMap;
  let c; try { c = createCoopClient({url:coopRelay,identity:{protocol:1,build:BUILD,sim:SIM_ID},
    load:async game => {
      if (coop !== c) throw Error('Co-op cancelled');
      coopLoading = true;
      try {
        if (loadedMapId !== game.map) await pickMap(game.map,false);
        if (coop !== c || c.closed) throw Error('Co-op cancelled');
        await renderer.preloadGear(game.players.flatMap(p => Object.values(p.loadout.gear)));
        if (coop !== c || c.closed) throw Error('Co-op cancelled');
        return runGround();
      } finally {
        // Cancelled renderer work owns admission until its home-map restoration settles.
        try { if (coop !== c || c.closed) await pickMap(homeMap,false); }
        catch { $('start').disabled = true; banner('Could not restore the selected map.',3000); }
        finally { coopLoading = false; }
      }
    },
    onRoom:room => { if (coop === c) showCoopRoom(room); },
    onStatus:code => {
      if (coop !== c) return; $('coopstatus').textContent = coopText(code);
      if (['waiting','reconnecting','catchingUp'].includes(code)) { keys.clear(); clearTouch(); pendingUse = null; $('coopwait').textContent = coopText(code); }
      if (code === 'playing') coopDecision = -1;
      if (['connecting','starting','loading'].includes(code)) for (const id of ['coopcreate','coopjoin','coopready','coopgo']) $(id).disabled = true;
      else { $('coopcreate').disabled = $('coopjoin').disabled = false; $('coopready').disabled = false; if (c.room) showCoopRoom(c.room); }
    },
    onRun:(run,game,localId) => {
      if (coop !== c) return; PLAYER = localId; sim = run.sim; coopDecision = -1; rankedRun = rankedRec = null; runTicket = null;
      renderer.reset(); renderer.setZoom(1); renderer.setShift(0); renderer.setYaw(0); acc = 0; selCard = 0; slotCache.b = null;
      for (const id of ['title','end','pause','levelup','casket',...MENU_SCREENS]) $(id).classList.add('hidden');
      $('hud').classList.remove('hidden'); $('cooppause').classList.remove('hidden'); $('coopwait').classList.remove('hidden');
      mode = 'play'; shownPending = rewardWasShown = waitingForMove = false; $('movehint').classList.add('hidden'); keys.clear(); clearTouch(); pendingUse = null; slowmo = 0;
      $('quit').disabled = false; $('quit').textContent = 'Leave co-op'; runBest = null; passedBest = false; chase = null;
      audio.music(sim.map.music); audio.init().catch(() => {}); banner('Co-op · shared world, your own upgrades',3500);
    },
    onEnd:reason => {
      if (coop !== c) return; keys.clear(); clearTouch(); pendingUse = null; $('coopwait').classList.add('hidden');
      for (const id of ['pause','settings','levelup','casket']) $(id).classList.add('hidden');
      if (reason === 'complete' && sim?.coop) { coopResult = reason; endRun(); }
      else { sim = null; mode = 'coop'; $('hud').classList.add('hidden'); $('coop').classList.remove('hidden'); $('coopform').classList.add('hidden'); $('cooproom').classList.add('hidden'); $('coopstatus').innerHTML = `<span>${coopText(reason)}</span> <span>Unfinished co-op rewards were not saved.</span>`; $('coopclose').focus(); }
    },
  }); } catch { $('coopstatus').textContent = coopText('connectionFailed'); $('coopcreate').disabled = $('coopjoin').disabled = true; return; }
  coop = c;
}
$('coopbtn').onclick = openCoop;
$('coopcreate').onclick = () => { if (!coop?.create({map:selMap,hard:hardOn,endless:selVariant==='fun'||endlessOn,...(selVariant!=='normal'?{variant:selVariant,...(selVariant==='boss'?{trialBoss}: {})}:{})},coopLoadout())) $('coopstatus').textContent = 'Check your name, map and adventurer selection.'; };
$('coopjoin').onclick = () => { if (!coop?.join($('coopinvite').value,coopLoadout())) $('coopstatus').textContent = 'Enter the six-character invite code.'; };
$('coopready').onclick = () => { const room = coop?.room, me = room?.members.find(m => m.id === room.you); if (me) coop.ready(!me.ready); };
$('coopgo').onclick = () => { if (!coop?.start({ground:runGround() ? groundHash(runGround()) : '0',seed:crypto.getRandomValues(new Uint32Array(1))[0]})) $('coopstatus').textContent = coopText('invalidStart'); };
$('coopclose').onclick = () => { toMenu(); if (!mapLoading && !coopLoading && loadedMapId !== selMap) pickMap(selMap,false).catch(() => banner('Could not restore the selected map.',3000)); navFocus($('coopbtn')); };
$('coop').addEventListener('keydown', containMenuTab);
// ---- co-op UI controls: the socket client owns all simulation ticks -------------------------------------------------
function syncCoopRun(inp, edges) {
  const run = coop?.run; if (!run || run.closed || !['play','levelup','casket','pause'].includes(mode)) return;
  if (edges.start && mode === 'play') pause(true); else if (edges.start && mode === 'pause') pause(false);
  if (mode === 'play' && !run.held) {
    run.input(inp.mx,inp.mz); if (edges.a) pendingUse = 4;
    if (edges.lb) pendingUse = 0; if (edges.rb) pendingUse = 1; if (edges.x) pendingUse = 2; if (edges.y) pendingUse = 3;
    if (pendingUse !== null) { run.action({kind:'use',index:pendingUse}); pendingUse = null; }
  } else run.input(0,0);
  if (mode === 'levelup') { if (edges.left) moveCard(-1); if (edges.right) moveCard(1); if (edges.b) toggleBanish(); else if (edges.a) pick(selCard); }
  else if (mode === 'casket') { if (edges.left || edges.up) { selCard = 0; markCasket(); } if (edges.right || edges.down) { selCard = 1; markCasket(); } if (edges.a) pickCasket(0); else if (edges.b) pickCasket(1); }
  const pending = sim.pending[PLAYER], revision = run.decision(PLAYER);
  if (mode !== 'pause') {
    if (pending && revision !== coopDecision) { coopDecision = revision; shownPending = false; $('levelup').classList.add('hidden'); $('casket').classList.add('hidden'); showLevelUp(); }
    else if (!pending && ['levelup','casket'].includes(mode)) { shownPending = rewardWasShown = false; mode = 'play'; $('levelup').classList.add('hidden'); $('casket').classList.add('hidden'); audio.duck(false); }
  }
  const other = sim.players.find(p => p.id !== PLAYER), waiting = other && sim.pending[other.id];
  for (const id of ['coopleveltimer', 'coopcaskettimer']) { const timer = $(id); timer.hidden = run.held || !pending; if (pending) timer.textContent = `Automatic choice in ${Math.max(0, Math.ceil(pending.left))}s`; }
  if (!run.held) {
    if (waiting) $('coopwait').innerHTML = `<b translate="no">${esc(other.name)}</b>: <span>Choosing an upgrade…</span> <b translate="no">${Math.max(0, Math.ceil(waiting.left))}s</b>`;
    else $('coopwait').textContent = !sim.players.find(p => p.id === PLAYER).alive ? 'You fell. Your teammate can still finish the run.' : mode === 'pause' ? 'Your controls are paused. The shared run continues.' : '';
  }
  $('coopwait').classList.toggle('hidden', !run.held && !waiting && mode !== 'pause' && sim.players.find(p => p.id === PLAYER).alive);
}
// ---- solo and ranked startup ---------------------------------------------------------------------------------------
async function startRun(live = null) {
  if (coop || mode === 'coop' || runStarting || coopLoading || mode === 'recovery') return;
  if (!live?.run && (rankedLive() || rankedPlaying())) { openRanked(); return; }
  const isRanked = !!live?.run;
  if (isRanked && live.sim !== SIM_ID) return;
  if (isRanked) selVariant = 'normal';
  if (!isRanked && titleProgressPending) syncTitleProgress();
  cancelPendingLoads(); runStarting = true;
  try {
    if (isRanked && loadedMapId !== live.map) await pickMap(live.map);
    if (mode === 'recovery') return;
    rankedRun = isRanked ? live : null; rankedRec = null;
    runTicket = null; casualRun = null;
    preloadIcons([...Object.keys(WEAPONS).map((w) => weaponItem(w, 1)), ...Object.keys(PASSIVES).map((k) => passiveItem(k, 1))]);
    if (mapLoading) return;
    const map = MAP_BY_ID[isRanked ? live.map : selMap];
    if (loadedMapId !== map.id) await pickMap(map.id);
    if (mode === 'recovery') return;
    audio.music(map.music); audio.init().catch(() => {});
    const seed = Number(params.get('seed')) || (Math.random() * 1e9) | 0;
    const adv = runAdv(), forced = selVariant !== 'wizard' && adv.id !== selAdv;
    const gear = isRanked || forced ? {} : getGear();
    await renderer.preloadGear(Object.values(gear));
    if (mode === 'recovery') return;
    if (isRanked) {
      const restored = await resumeRankedAsync(live.log, { seed: live.seed, mapId: live.map, adv: live.adv, ground: runGround(), ...liveRace(live) },
        (done, all) => rankedMessage(`Restoring your ranked run: ${fmtT(done / 30)} of ${fmtT(all / 30)}…`));
      if (mode === 'recovery') return;
      sim = restored.sim; rankedRec = restored.rec;
      rankedClock = live.clockVersion === 1 ? new RankedClock({run:live.run,request:body=>rankedApi(BASE,'clock',body)}) : null;
      persistRanked();
      $('updatebtn').classList.add('hidden'); $('rankedupdate').classList.add('hidden'); renderer.setAura(false);
    } else sim = createSim({ seed, map, variant: selVariant, trialBoss, hard: hardOn, endless: endlessOn, meta: getSkills(), ground: runGround(), players: [{ id: PLAYER, name: 'You', adv: adv.id, weapon: params.get('weapon') || adv.weapon, gear, gearLv: forced ? {} : getGearLv() }] });
    if (!isRanked) { casualRun = { sim, baseline: null, normalCommitted: false, phase: 'playing' }; loadCasualTickets(casualRun); }
    renderer.reset(); renderer.setZoom(1); renderer.setShift(0); renderer.setYaw(0); acc = 0; selCard = 0; slotCache.b = null;
    for (const id of ['title', 'end', 'pause', 'levelup', 'casket', 'skills', 'gear', 'quests', 'settings', 'updates', 'board', 'bug', 'tip', 'dmt', 'ranked', 'guide', 'pets', 'more', 'upgrades', 'modemenu']) $(id).classList.add('hidden');
    $('cooppause').classList.add('hidden'); $('coopwait').classList.add('hidden');
    $('hud').classList.remove('hidden'); mode = 'play'; shownPending = false;
    waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden'); clearTouch();
    $('quit').disabled = isRanked; $('quit').textContent = isRanked ? 'Ranked runs can be paused' : 'Quit run'; pendingUse = null; slowmo = 0; if (isRanked) keys.clear();
    if (isRanked && enforceRankedDeadline()) return;
    if (isRanked) syncRankedClock();
    if (isRanked && sim.pending[PLAYER]) showLevelUp();
    runBest = isRanked || sim.variant ? null : profileBest(getBests()[bestKey(sim)]); passedBest = false; chase = null;
    if (isRanked && rankedWeek) { // the board as it stood when you entered, without your own wallet's run
      const race = raceOf(rankedWeek, liveRace(live).mode), me = (walletNow() && walletNow().address || '').toLowerCase();
      chase = { combined: kpmWeek(liveRace(live).week), rows: ((race && race.rows) || []).filter((r) => String(r.wallet || '').toLowerCase() !== me).map((r) => ({ t: Number(r.t) || 0, kills: Number(r.kills) || 0 })), kp: kpmWeek(liveRace(live).week) };
    }
    const goalText = isRanked && sim.endless ? `: endless, scored by ${kpmWeek(liveRace(live).week) ? 'kills + seconds survived' : 'time survived'}. The hunt is over at ${fmtT(sim.endAt)}` : !isRanked && endlessOn ? '' : `: last ${Math.floor(map.length / 60)}:00 or slay ${slayName(map, map.finalBoss)}`;
    banner(sim.variant ? VARIANTS[sim.variant].name : `${isRanked ? `Ranked ·${sim.hard ? ' Hard ·' : ''}` : endlessOn ? 'Endless' : 'Survive'} ${map.name}${!isRanked && hardOn ? ' (hard)' : ''}${goalText}`, 4500);
  } finally { runStarting = false; }
}
let bannerT = 0;
function banner(text, ms = 2500) { const b = $('banner'); b.textContent = text; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), ms); }

// the coins (GP) a run has earned so far; the HUD shows it live and the end screen adds the 120 for holding the map
function runCoinOptions(s) {
  const p = s.coop ? s.players.find(p => p.id === PLAYER) : s.players[0];
  return { player: p, multiplier: playerStats(p).coinBonus * (s.hard ? 1.25 : 1) * (savedPass() ? 1 + DMT_COIN_BONUS : 1), baseline: s.endless && casualRun?.sim === s ? casualRun.baseline || null : null };
}
function runCoins(s, won = false) { return phaseCoins(s, { ...runCoinOptions(s), won }); }

function endRun() {
  if (sim.coop && coopResult !== 'complete') return;
  mode = 'end';
  waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden');
  const wasRanked = !!rankedRun;
  const cutoff = !!rankedRun?.cutoff;
  const won = sim.over === 'win';
  const p = sim.coop ? sim.players.find(p => p.id === PLAYER) : sim.players[0];
  lastRun = { map: sim.map.id, t: Math.floor(sim.t), kills: sim.kills, level: sim.level, adv: p.adv, won, hard: !!sim.hard, endless: !!sim.endless, v: LATEST, sent: !!sim.coop, ticket: sim.coop ? null : runTicket, coop: !!sim.coop };
  if (sim.variant) { lastRun.variant = sim.variant; lastRun.sent = true; lastRun.ticket = null; }
  const result = lastRun, session = casualRun?.sim === sim ? casualRun : null;
  if (session) session.result = result;
  if (session && canContinueCasual(sim)) { session.normalResult = result; session.phase = 'normal-end'; }
  $('continueendless').classList.add('hidden'); $('continueunconfirmed').classList.add('hidden'); $('continuemsg').textContent = '';
  $('lbsubmit').disabled = wasRanked || !!sim.coop; $('lbmsg').textContent = '';
  $('lbname').disabled = false;
  $('endlb').classList.toggle('hidden', wasRanked || !!sim.coop || $('lbbtn').classList.contains('hidden'));
  $('rankedresult').textContent = ''; $('rankedretry').classList.add('hidden');
  if (wasRanked) { lastRun.sent = true; lastRun.ranked = true; lastRun.race = sim.hard ? 'hard' : 'normal'; if (sim.endless && kpmWeek(liveRace(rankedRun).week)) { lastRun.kpm = kpm(sim.kills, Math.floor(sim.t)); lastRun.points = rankedPoints(sim.kills, sim.t); } } // week 0 ranks by time
  $('again').textContent = sim.coop ? 'Co-op lobby' : wasRanked ? 'Next ranked run' : 'Run it back'; // after ranked, play again goes back to Ranked (a free casual run was mistaken for ranked)
  if (!wasRanked && !sim.coop && load('sq-name', '') && sim.t >= 30) setTimeout(() => { if (lastRun === result && mode === 'end') submitScore(result); }, 300); // named players send runs of 30 s or more automatically
  const dmtOn = !!savedPass(), alchCoins = phaseAlch(sim, sim.endless ? session?.baseline : null, p), earned = runCoins(sim, won);
  let receipt = null, rankedSaved = !wasRanked, submitted = false;
  const finish = () => {
    if (!rankedSaved) {
      rankedRun.ended = true; rankedSaved = persistRanked();
      if (!rankedSaved) throw Error('Run could not be saved. Keep this page open.');
    }
    if (wasRanked && !submitted) { submitted = true; submitRanked(); }
    receipt ||= prepareRunRewards(localStorage, sim, { earned, ranked: wasRanked, coop: !!sim.coop, playerId: PLAYER, result: coopResult, baseline: sim.endless ? session?.baseline : null });
    if (Object.keys(receipt.data).length) saveRunProgress(localStorage, receipt.data);
    if (session && canContinueCasual(sim)) {
      session.baseline ||= captureRewardBaseline(sim, receipt); session.normalCommitted = true;
      $('continueendless').disabled = false; $('continueendless').classList.remove('hidden');
      $('continuemsg').textContent = 'Normal rewards are saved. Continue in this tab with the same health and build. Reloading ends the live run.';
    }
    mode = 'end';
    let unlockNote = '';
    if (won && receipt.cleared.length > receipt.clearedBefore) {
      const idx = MAPS.findIndex(m => m.id === sim.map.id), next = sim.map.special ? null : MAPS.slice(idx + 1).find(m => !m.special);
      if (next) unlockNote = ` · ${next.name} unlocked`;
      for (const a of ADVENTURERS) if (a.unlock === receipt.cleared.length) unlockNote += ` · ${a.name} unlocked`;
    }
    const lootNotes = receipt.loot.map(({ name: n, wasAlched, fresh, on }) => {
      if (isWeaponItem(n)) return `${imgTag(n)} ${n} <em>${wasAlched ? `high alched, +${alchValue(n)}` : 'this run only'}</em>`;
      return `${imgTag(n)} ${n} <em>${wasAlched ? `high alched, +${alchValue(n)}${fresh ? ', new' : ''}` : on ? (fresh ? 'worn this run, new' : 'worn this run') : fresh ? 'new' : 'sold, +25 coins'}</em>`;
    });
    const questNotes = receipt.quests.map(q => q.achievement ? `Achievement unlocked: <b>${q.name}</b>` : `Quest complete: <b>${q.name}</b> · +${q.coins} coins${q.item ? ` · ${imgTag(q.item)} ${q.item}` : ''}`);
    // damage by weapon, Run Escape style
    const dmgRows = Object.entries((sim.coop ? p.dmgBy : sim.dmgBy) || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6), top = dmgRows.length ? dmgRows[0][1] : 1;
    const wname = (id) => (WEAPONS[id] ? weaponDisplay(id, p.weapons[id] || 1, p.evo[id], stepOf(id, p)).name : id === 'pumpkin' ? 'Pumpkin bombs' : 'Other');
    const wicon = (id) => (WEAPONS[id] ? iconHTML('weapon', id, p.weapons[id] || 1, p.evo[id], stepOf(id, p)) : imgTag(id === 'pumpkin' ? 'Pumpkin' : 'Gold'));
    $('enddmg').innerHTML = dmgRows.map(([id, v]) => `<div class="drow">${wicon(id)}<span>${wname(id)}</span><div class="dbar"><i style="width:${(v / top) * 100}%"></i></div><b>${Math.round(v).toLocaleString()}</b></div>`).join('');
    $('endloot').innerHTML = (lootNotes.length ? `<details class="lootline" open><summary><b>Caskets</b> (${lootNotes.length})</summary><div>${lootNotes.join(' · ')}</div></details>` : '') + questNotes.map((x) => `<div class="questline">${x}</div>`).join('');
    buildMaps(); buildAdventurers(); showBest();
    $('endtitle').textContent = cutoff ? 'The ranked week has ended. Your earned score is being checked.' : won ? `${sim.map.name} holds!` : sim.over === 'time' ? `The hunt is over at ${fmtT(sim.endAt)}` : sim.endless && sim.t >= sim.map.length ? `Endless: ${fmtT(sim.t)}` : `You fell in ${sim.map.name}`;
    const kpmNote = wasRanked && lastRun.kpm != null ? ` · ${lastRun.points.toLocaleString()} points · ${lastRun.kpm.toFixed(2)} kills per minute${lastRun.t < RANKED.minSeconds ? ` (too short to place: runs need ${fmtT(RANKED.minSeconds)})` : ''}` : '';
    let bestNote = '';
    if (!wasRanked && !sim.coop && !sim.variant) {
      const b = receipt.personalBest;
      if (receipt.newPersonalBest) bestNote = b ? ` · new best (was ${fmtT(b.t)})!` : '';
      else bestNote = sim.t < b.t ? ` · ${fmtT(b.t - sim.t)} short of your best (${fmtT(b.t)})` : ` · best ${fmtT(b.t)}`;
    }
    if (sim.variant) {
      $('endtitle').innerHTML = `<span>${VARIANTS[sim.variant].name}</span> · <span>${won ? 'Victory' : 'Defeat'}</span>`;
      if (sim.variant === 'castle') $('endtitle').innerHTML += ` · <span>${sim.castle.hp <= 0 ? 'Castle destroyed' : 'Defender fallen'}</span>`;
      const board = $('endlb'); if (board) board.classList.add('hidden');
      if ($('lbsubmit')) $('lbsubmit').disabled = true;
      $('again').textContent = sim.coop ? 'Co-op lobby' : 'Retry mode';
      buildAdventurers(); updateModePicker();
    }
    $('endtext').textContent = `Survived ${fmtT(sim.t)} · level ${sim.level} · ${sim.kills} monsters slain${kpmNote}${bestNote}${unlockNote}`;
    $('endcoins').innerHTML = `${imgTag('Gold')} +${earned} coins${alchCoins ? ` <em class="alchnote">incl. ${alchCoins} from high alch</em>` : ''}${dmtOn ? ' <em class="dmtnote">DMT +25%</em>' : ''}`;
    if (sim.variant === 'boss') $('endcoins').textContent = 'Practice run: no GP or gear saved.';
    $('end').classList.remove('hidden');
    cloud.push(true);
  };
  try { finish(); }
  catch { cancelPendingLoads(); showProgressRecovery(() => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen(), false, { retry: finish, reload: false }); }
}
async function continueAfterScore(unconfirmed = false) {
  const session = casualRun, current = sim;
  if (!session || session.sim !== current || !session.normalCommitted || session.busy || !canContinueCasual(current) || mode !== 'end' || unconfirmed && !session.unconfirmed) return;
  session.busy = true; $('continueendless').disabled = true; $('continueunconfirmed').disabled = true;
  try {
    // Website submission; the wallet-free edition continues its local record directly.
    if (!unconfirmed) {
      const out = await submitScore(session.normalResult);
      if (casualRun !== session || sim !== current || mode !== 'end') return;
      if (!out.ok) {
        session.unconfirmed = true;
        $('continuemsg').textContent = 'Normal score could not be confirmed. Retry, or continue without a confirmed leaderboard score.';
        $('continueunconfirmed').classList.remove('hidden'); return;
      }
    }
    // End website submission.
    if (casualRun !== session || sim !== current || !canContinueCasual(current)) return;
    continueCasual(current, session.baseline); session.phase = 'endless';
    runTicket = session.endlessTicket || null;
    keys.clear(); clearTouch(); pendingUse = null; slowmo = 0; acc = 0;
    shownPending = false; rewardWasShown = true; waitingForMove = false;
    for (const id of ['end', 'pause', 'levelup', 'casket']) $(id).classList.add('hidden');
    runBest = profileBest(getBests()[bestKey(sim)]); passedBest = false;
    audio.duck(false); mode = 'play';
    if (sim.pending[PLAYER]) showLevelUp(); else resumeAfterReward();
  } finally {
    session.busy = false;
    if (casualRun === session) { $('continueendless').disabled = false; $('continueunconfirmed').disabled = false; }
  }
}
$('continueendless').onclick = () => continueAfterScore();
$('continueunconfirmed').onclick = () => continueAfterScore(true);
function toMenu() {
  if (rankedPlaying()) return;
  if (coop) { const c = coop; coop = null; c.close(); selMap = coopHomeMap || selMap; coopResult = null; }
  merchantVisit = null; $('merchant').classList.add('hidden');
  PLAYER = 'p1'; $('coop').classList.add('hidden'); $('coopwait').classList.add('hidden');
  rankedRun = null; rankedRec = null; applyDmt();
  rankedClock = null;
  casualRun = null;
  sim = null; mode = 'title'; window.__idleSim = null;
  playTitleMusic();
  waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden');
  for (const id of ['end', 'pause', 'levelup', 'casket', 'hud']) $(id).classList.add('hidden');
  $('hud').classList.add('hidden'); $('title').classList.remove('hidden'); renderer.reset(); renderer.setZoom(0.45); renderer.setShift(2.4);
  buildAdventurers(); buildMaps(); showBest(); refreshPendingTitleProgress(); updateModePicker();
}

// ---- input ------------------------------------------------------------------------------------------------------------------
const MENU_SCREENS = ['modemenu', 'coop', 'cloudpick', 'wallet', 'ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests', 'guide', 'pets', 'more', 'upgrades', 'merchant'];
addEventListener('keydown', (e) => {
  if (mode === 'recovery' || walletModalOpen()) return;
  if (mode === 'play' && (e.target?.closest?.('#equipmenthud') || e.target?.closest?.('[data-inspect]')) && ['Tab', 'Enter', ' '].includes(e.key)) return;
  if (e.target?.matches?.('input, textarea, select, [contenteditable="true"]') || e.target?.matches?.('summary') && !e.target?.closest?.('#equipmenthud')) return;
  const k = e.key.toLowerCase();
  if (mode === 'play' && MENU_SCREENS.every(id => $(id).classList.contains('hidden')) && k === 'tab' && !e.shiftKey && !e.target?.matches?.('button, a[href]')) {
    if (setMapPeek(true)) { e.preventDefault(); return; }
  }
  if (e.repeat) return;
  if (mode === 'play' && k === 'f' && openMerchant()) { e.preventDefault(); return; }
  if (mode === 'play' && k === 'escape' && !$('damagepanel').classList.contains('hidden')) { setDamagePanel(false); e.preventDefault(); return; }
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
    else if (k === 'arrowleft' || k === 'a') { moveCard(-1); }
    else if (k === 'arrowright' || k === 'd') { moveCard(1); }
    else if (k === 'enter' || k === ' ') pick(selCard);
    else if (k === 'r') doReroll();
    else if (k === 'x') doSkip();
    else if (k === 'b') toggleBanish();
    return;
  }
  if (k === 'm') { audio.setMuted(!audio.muted); banner(audio.muted ? 'Sound off' : 'Sound on', 900); }
  if (mode === 'play' && k >= '1' && k <= '4') pendingUse = Number(k) - 1;
  if (mode === 'play' && k === ' ') { hop(); e.preventDefault(); }
  if (k === 'escape' && !navBack() && mode === 'play') pause(true);
  if ((k === 'enter' || k === ' ') && (mode === 'title' && !$('start').disabled || mode === 'end') && MENU_SCREENS.every((id) => $(id).classList.contains('hidden'))) startRun();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); clearTouch(); pendingUse = null; padId = null; if (mode === 'play' && (document.hidden || !keepPlayingUnfocused())) pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { keys.clear(); clearTouch(); pendingUse = null; padId = null; if (mode === 'play') pause(true); } });
function pause(on) { clearTouch(); if (on) coop?.run?.resetInput(); pendingUse = null; audio.duck(on); if (!on) audio.init().catch(() => {}); mode = on ? 'pause' : 'play'; $('pause').classList.toggle('hidden', !on); if (rankedRun) updateRankedPause(); }
$('start').onclick = startRun; $('again').onclick = () => { if (lastRun?.coop) { toMenu(); openCoop(); } else if (lastRun && lastRun.ranked) { toMenu(); openRanked(); } else startRun(); }; $('resume').onclick = () => pause(false); $('tomenu').onclick = toMenu;
$('quit').onclick = () => { if (rankedPlaying()) return; if (coop) { coop.close(); return; } pause(false); sim.over = 'dead'; };

// touch: drag anywhere on the field to move (a stick appears under your thumb); the II button pauses
const touch = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
let waitingForMove = false;
const isTouchUI = matchMedia('(pointer: coarse)').matches;
if (isTouchUI) document.body.classList.add('touch');
setupFullscreen($('fullscreenbtn'), () => { $('fullscreenstatus').textContent = 'Fullscreen was blocked by your browser.'; });
document.addEventListener('fullscreenchange', () => { $('fullscreenstatus').textContent = ''; });
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
const screenLayout = createScreenLayout(() => { clearTouch(); if (mode === 'play') pause(true); renderer?.resize(); });
function clearTouch() { touch.id = null; touch.x = touch.y = 0; stickEl.classList.add('hidden'); }
addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || mode !== 'play' || touch.id !== null) return;
  if (screenLayout.active && e.clientY < $('dscontrols').getBoundingClientRect().top) return;
  if (e.target.closest('button, .panel, #menu, #belt, [data-inspect]')) return;
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
const hop = () => {
  if (mode !== 'play' || !sim) return;
  if (sim.pace >= 2) {
    const p = sim.players.find(p => p.id === PLAYER);
    if (p?.alive && !sim.pending[PLAYER] && !sim.over && !(p.rollCd > 0)) pendingUse = 4;
  } else if (renderer?.hop) { renderer.hop(); audio.play('choose', { minGap: 0.3, vol: 0.3, rate: 1.6 }); }
};
$('tumblebtn').onclick = hop;


let padPrev = [], padId = null, pendingUse = null, slowmo = 0, stickDir = null, stickNext = 0; // belt slot to use on the next tick (1-4, a tap, or LB/RB/X/Y)
function readInput() {
  let mx = 0, mz = 0;
  if (keys.has('w') || keys.has('arrowup')) mz -= 1;
  if (keys.has('s') || keys.has('arrowdown')) mz += 1;
  if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
  if (keys.has('d') || keys.has('arrowright')) mx += 1;
  if (touch.id !== null && Math.hypot(touch.x, touch.y) > 0.18) { mx += touch.x; mz += touch.y; }
  let pad = null;
  try {
    if (!document.hidden && document.hasFocus?.() !== false) pad = [...(navigator.getGamepads?.() || [])].find(p => p && p.connected !== false && p.mapping === 'standard') || null;
  } catch { /* Browser policy can deny gamepads; keyboard and touch still work. */ }
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
  const id = pad ? `${pad.index}:${pad.id}` : null;
  // A held connect/refocus button must release before it can activate a menu or run.
  if (id !== padId) { padPrev = now; padId = id; stickDir = null; stickNext = 0; }
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
  if (sim?.coop) { waitingForMove = rewardWasShown = false; $('movehint').classList.add('hidden'); return; }
  if (sim.pending[PLAYER] || !rewardWasShown) return;
  rewardWasShown = false;
  const input = readInput();
  waitingForMove = isTouchUI && Math.hypot(input.mx, input.mz) <= 0.01;
  $('movehint').classList.toggle('hidden', !waitingForMove);
  if (touch.id !== null) stickEl.classList.remove('hidden');
  acc = 0; audio.duck(waitingForMove);
}
function showLevelUp() {
  $('coopleveltimer').hidden = !sim?.coop;
  banishMode = false; $('banishlv').setAttribute('aria-pressed', 'false'); $('banishhint').classList.add('hidden'); $('cards').classList.remove('banishing');
  if (sim) preloadNextIcons(sim.players.find((q) => q.id === PLAYER));
  let pend = sim.pending[PLAYER];
  while (pend && !pend.casket && pend.choices.filter(c => !c.banished).length === 1 && pend.choices[autoChoice(pend)].kind === 'heal') {
    const before = pend; pick(autoChoice(pend)); if (sim.coop) return; pend = sim.pending[PLAYER];
    if (pend === before) break; // a refused choice must not spin the UI
  }
  if (!pend) return;
  if (pend.casket) { showCasket(); return; }
  shownPending = rewardWasShown = true; mode = 'levelup'; selCard = 0; audio.duck(true);
  waitingForMove = false; $('movehint').classList.add('hidden'); stickEl.classList.add('hidden');
  const wrap = $('cards'); wrap.innerHTML = '';
  $('lutitle').textContent = pend.choices.some((c) => c.kind === 'evolve') ? 'Evolution!' : 'Level up!';
  const me = sim.players.find((q) => q.id === PLAYER);
  function statLines(c) {
    if (!(sim.pace >= 2) || !me || c.id === 'curse' || !['weapon', 'passive'].includes(c.kind)) return '';
    const after = previewChoice(sim, me, c), fresh = !(c.kind === 'weapon' ? me.weapons[c.id] : me.passives[c.id]);
    let before, next, rows;
    if (c.kind === 'weapon') {
      before = weaponStats(me, c.id); next = weaponStats(after, c.id);
      rows = [['dmg', 'Base damage'], ['cd', 'Cooldown', ' s'], ['count', 'Projectiles'], ['pierce', 'Pierce'], ['bounces', 'Bounces'], ['range', 'Range'], ['radius', 'Radius'], ['r', 'Size'], ['arc', 'Arc'], ['spin', 'Orbit speed'], ['burst', 'Burst radius']];
    } else {
      const stats = p => ({ ...playerStats(p), cardLuck: cardLuck(p.meta, { greed: passiveStrength(p, 'greed') }) });
      before = stats(me); next = stats(after);
      rows = { might: [['might', 'Damage multiplier', '×']], haste: [['haste', 'Cooldown multiplier', '×']], boots: [['speed', 'Movement speed']], magnet: [['magnet', 'Pickup range']], armor: [['armor', 'Armor']], growth: [['growth', 'XP multiplier', '×']], vigor: [['maxHp', 'Maximum health'], ['regen', 'Health per second']], greed: [['coin', 'Coin multiplier', '×'], ['casket', 'Casket multiplier', '×'], ['cardLuck', 'Card luck', '%']], area: [['area', 'Area multiplier', '×']], amount: [['amount', 'Extra projectiles'], ['reach', 'Reach multiplier', '×']], crit: [['critC', 'Critical chance', '%'], ['critM', 'Critical multiplier', '×']], thorns: [['thorns', 'Thorns damage']] }[c.id];
    }
    const number = (n, unit) => (unit === '×' ? '×' : '') + Number((unit === '%' ? n * 100 : n).toFixed(4)) + (unit && unit !== '×' ? unit : '');
    return '<div class="upstats">' + (c.kind === 'weapon' ? '<div>Base weapon stats</div>' : '') + rows.filter(([key]) => typeof next[key] === 'number').map(([key, label, unit]) => `<div><span>${label}</span><b>${fresh ? '' : number(before[key], unit) + ' → '}${number(next[key], unit)}</b></div>`).join('') + '</div>';
  }
  pend.choices.forEach((c, i) => {
    // Rarity strengthens one accepted level; discrete unlocks use the integer level.
    const ri = c.rarity ? Math.max(0, CARD_RARITIES.indexOf(c.rarity)) : -1;
    const el = document.createElement('div'); el.className = 'card' + (c.banished ? ' banished' : '') + (c.kind === 'evolve' ? ' evo' : '') + (ri >= 0 ? ` rar r-${CARD_RARITIES[ri]}` : ''); el.dataset.i = i; el.setAttribute('role', 'button'); el.setAttribute('aria-disabled', String(!!c.banished)); el.tabIndex = c.banished ? -1 : 0;
    const from = typeof c.from === 'number' && c.rarity ? c.from : c.level - 1; // the level you have now
    const lvTag = () => (from === 0 ? (c.level > 1 ? `NEW · Lv ${c.level}` : 'NEW') : c.level - from > 1 ? `Lv ${from} → ${c.level}` : `Lv ${c.level}`);
    let name, tag, text, icon;
    if (c.kind === 'evolve') {
      const e = EVOLUTIONS[c.id]; name = e.name; tag = `EVOLVES ${weaponTitle(c.id, 6, stepOf(c.id)).toUpperCase()}`; text = e.blurb; icon = imgTag(e.item, EMOJI[c.id]);
    } else if (c.kind === 'weapon') {
      const w = WEAPONS[c.id], ups = []; for (let l = Math.max(1, from); l < c.level; l++) ups.push(w.next(l));
      name = weaponTitle(c.id, c.level, stepOf(c.id)); tag = lvTag(); text = from === 0 ? w.blurb + (ups.length ? ` Starts with ${ups.join(', ')}.` : '') : 'Upgrade: ' + ups.join(', '); icon = iconHTML('weapon', c.id, c.level, false, stepOf(c.id));
      if (c.level === 6) {
        const needs = evolutionPassives(c.id, sim.pace).map(id => PASSIVES[id].name);
        if (needs.length) text += needs.length === 2 ? ` Evolves with ${needs[0]} or ${needs[1]}.` : ` Evolves with ${needs[0]}.`;
      }
    } else if (c.kind === 'passive') {
      const p = PASSIVES[c.id]; name = passiveTitle(c.id, c.level); tag = lvTag(); text = sim.pace >= 2 && c.id !== 'curse' ? `<span>Common rank:</span> ${p.blurb}` : p.blurb; icon = iconHTML('passive', c.id, c.level);
      const ev = Object.keys(EVOLUTIONS).filter(id => evolutionPassives(id, sim.pace).includes(c.id));
      if (ev.length) text += ` Evolves ${ev.map(id => weaponTitle(id, 6, stepOf(id))).join(', ')}.`;
    } else { const hp = CARD_HEAL[Math.max(0, ri)]; name = 'Cooked Bubba Bass'; tag = 'Heal'; text = hp >= 9999 ? 'Restore all your health.' : `Restore ${hp} health.`; icon = iconHTML('item', 'Cooked Bubba Bass'); }
    if (ri === 3 && c.kind !== 'heal') text += ' Heals you to full.';
    const rar = ri >= 0 ? `<div class="rarity">${CARD_RARITY_NAMES[ri]}</div>` : '';
    el.innerHTML = `${c.banished ? '<div class="banished-label">Banished</div>' : ''}${rar}${icon}<h3>${name}</h3><div class="tier">${tag}</div><p>${text}</p>${statLines(c)}<div class="key">[${i + 1}]</div>`;
    el.onfocus = () => { selCard = i; markCard(); }; el.onclick = () => pick(i); wrap.appendChild(el);
  });
  $('reroll').innerHTML = `Reroll<span class="key"> (R)</span> · ${me ? me.rerolls : 0} left`; $('reroll').disabled = !me || me.rerolls <= 0;
  $('banishlv').classList.toggle('hidden', !(sim.pace >= 2)); $('banishlv').classList.remove('on');
  $('banishlv').innerHTML = `<span>Banish</span> <span translate="no">(${me?.banished ? 3 - me.banished.length : 0})</span><span class="key"> (B)</span>`;
  $('banishlv').disabled = !pend.choices.some((_, i) => canBanish(sim, PLAYER, i));
  selCard = autoChoice(pend); $('levelup').classList.remove('hidden'); markCard();
  if ($('equipmenthud').contains(document.activeElement)) wrap.querySelector('.card.sel')?.focus({ preventScroll: true });
}
function doReroll() { if (sim?.coop) { coop.run.action({kind:'reroll'},coopDecision); return; } if (sim && (rankedRec ? rankedChoice(sim, rankedRec, 'r') : reroll(sim, PLAYER))) { shownPending = false; showLevelUp(); if (rankedRec) persistRanked(); } }
function doSkip() { if (sim?.coop) { coop.run.action({kind:'skip'},coopDecision); return; } if (sim && (rankedRec ? rankedChoice(sim, rankedRec, 's') : skipLevel(sim, PLAYER))) { audio.duck(false); shownPending = false; mode = 'play'; $('levelup').classList.add('hidden'); resumeAfterReward(); if (rankedRec) persistRanked(); } }
$('reroll').onclick = doReroll; $('skiplv').onclick = doSkip;
function toggleBanish() {
  if (mode !== 'levelup' || !sim?.pending[PLAYER] || !sim.pending[PLAYER].choices.some((_, i) => canBanish(sim, PLAYER, i))) return;
  banishMode = !banishMode; $('banishlv').setAttribute('aria-pressed', String(banishMode)); $('banishlv').classList.toggle('on', banishMode); $('banishhint').classList.toggle('hidden', !banishMode); $('cards').classList.toggle('banishing', banishMode);
}
function doBanish(i) {
  if (sim?.coop) { coop.run.action({kind:'banish',index:i},coopDecision); return; }
  if (mode !== 'levelup' || !sim || !(rankedRec ? rankedChoice(sim, rankedRec, 'b' + i) : banish(sim, PLAYER, i))) return;
  shownPending = false; showLevelUp(); if (rankedRec) persistRanked();
}
$('banishlv').onclick = toggleBanish;
function moveCard(delta) {
  const choices = sim?.pending[PLAYER]?.choices; if (!choices?.length) return;
  for (let i = 0; i < choices.length; i++) { selCard = (selCard + delta + choices.length) % choices.length; if (!choices[selCard].banished) break; }
  markCard();
}
function markCard() { [...$('cards').children].forEach((el, i) => { el.classList.toggle('sel', i === selCard); if (i === selCard) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }); }
function pick(i) {
  if (banishMode) { doBanish(i); return; }
  if (!sim.pending[PLAYER] || sim.pending[PLAYER].casket) return;
  if (sim.coop) { coop.run.action({kind:'choose',index:i},coopDecision); return; }
  if (rankedRec) { if (!rankedChoice(sim, rankedRec, i)) return; persistRanked(); } else if (!choose(sim, PLAYER, i)) return; audio.duck(false); shownPending = false; mode = 'play'; $('levelup').classList.add('hidden'); resumeAfterReward();
}

// ---- reward casket card: the item, what it replaces, every stat change, and Wear or High alch ----------------------------
const RARITY_NAME = { common: '', rare: 'Rare', unique: 'Unique' };
const tierLabel = (n) => { const g = GEAR[n]; const metal = ARMOR_TIERS.includes(g.set) || / (Kite)?[Ss]hield$/.test(n) && g.rarity !== 'unique'; return [gearSlotName(g.slot), metal ? '' : RARITY_NAME[gearRarity(n)]].filter(Boolean).join(' · '); };
function casketItemHTML(n, cls, label) {
  // a weapon metal or arrows: what it is for, and what it does to that weapon
  if (isWeaponItem(n)) return `<div class="ckitem ${cls}"><div class="cklabel">${label}</div>${imgTag(n)}<div class="cktext"><b>${n}</b><small>${weaponItemLabel(n)}</small><span>${weaponItemText(n)}</span></div></div>`;
  const g = GEAR[n];
  return `<div class="ckitem ${cls}"><div class="cklabel">${label}</div>${imgTag(n)}<div class="cktext"><b>${n}</b><small>${tierLabel(n)}</small><span>${bonusText(gearPieceBonus(n, sim?.pace || 2))}</span></div></div>`;
}
function showCasket() {
  const pend = sim.pending[PLAYER]; if (!pend || !pend.casket) return;
  const c = pend.casket;
  // Settings: a piece that improves nothing is high alched without stopping the run (still a recorded choice in ranked)
  if (!pend.merchantPurchase && autoAlchOn() && !c.anyUp) { toast(`${imgTag(c.item)} <span>Auto high alch<br><b>${c.item}</b> +${c.alch} coins</span>`); pickCasket(1, true); return; }
  if (!pend.merchantPurchase && autoEquipOn() && canAutoEquip(sim.coop ? sim.players.find(p => p.id === PLAYER) : sim.players[0], c.item, sim.pace)) { pickCasket(0, true); return; }
  $('coopcaskettimer').hidden = !sim.coop;
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
  $('ckscope').textContent = wpn ? `This upgrades your existing ${WEAPONS[onBow ? 'bow' : WEAPON_ITEMS[c.item].weapon].name} for this run. It does not add a weapon or use another slot.` : '';
  $('ckset').innerHTML = setLine;
  $('ckdelta').innerHTML = `<ul>${rows.join('')}</ul>`;
  $('ckwear').innerHTML = `<span class="kb">1</span><span class="kb">A</span>${wpn ? 'Upgrade weapon' : 'Wear'}`;
  $('ckalch').innerHTML = `<span class="kb">2</span><span class="kb">B</span>High alch for ${c.alch} coins`;
  // the recommended choice is the game's green accept button, the other one grey
  $('ckwear').classList.toggle('ghost', pend.rec !== 0); $('ckalch').classList.toggle('ghost', pend.rec !== 1);
  $('ckrec').textContent = pend.rec === 0 ? wpn ? 'Recommended: upgrade weapon' : 'Recommended: wear it' : c.anyUp ? 'Recommended: high alch (not better overall)' : 'Recommended: high alch (not better)';
  $('ckmore').textContent = pend.more ? `${pend.more} more casket${pend.more > 1 ? 's' : ''} after this` : '';
  markCasket(); $('casket').classList.remove('hidden');
  if ($('equipmenthud').contains(document.activeElement)) $(pend.rec === 0 ? 'ckwear' : 'ckalch').focus({ preventScroll: true });
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
  if (sim.coop) { coop.run.action({kind:'choose',index:i},coopDecision); return; }
  if (rankedRec) { if (!rankedChoice(sim, rankedRec, i)) return; persistRanked(); } else choose(sim, PLAYER, i);
  afterCasket();
}
$('ckwear').onclick = () => pickCasket(0); $('ckalch').onclick = () => pickCasket(1);

// ---- wandering merchant: an optional paused shop using only this run's GP --------------------
let merchantVisit = null;
function renderMerchant() {
  const m = sim?.merchant;
  if (!merchantVisit || merchantVisit.sim !== sim || m?.id !== merchantVisit.id) { $('merchantstatus').textContent = 'This merchant is no longer available.'; return; }
  const p = sim.players.find(p => p.id === PLAYER), budget = runCoins(sim);
  $('merchantgp').textContent = budget.toLocaleString();
  $('merchantoffers').innerHTML = m.offers.map((offer, i) => {
    if (!Object.hasOwn(GEAR, offer.item)) return '';
    const c = compareGear(p.gear, p.gearLv || {}, offer.item, sim.pace), valid = Number.isSafeInteger(offer.price) && offer.price > 0;
    const delta = Object.entries(c.delta).map(([k, v]) => `<li class="${v > 0 ? 'up' : 'down'}">${esc(deltaText(k, v))}</li>`).join('');
    return `<article class="merchantoffer">${casketItemHTML(offer.item, 'new', 'For sale')}<ul class="merchantdelta">${delta || '<li>No stat change</li>'}</ul><button type="button" data-merchant-offer="${i}"${offer.sold || !valid || budget < offer.price ? ' disabled' : ''}>${offer.sold ? 'Sold out' : valid ? `<span>Buy</span> · <span translate="no">${offer.price.toLocaleString()} GP</span>` : 'Unavailable'}</button></article>`;
  }).join('');
  for (const button of $('merchantoffers').querySelectorAll('[data-merchant-offer]')) button.onclick = () => buyMerchantOffer(Number(button.dataset.merchantOffer));
}
function openMerchant() {
  if (mode !== 'play' || !sim || sim.pending[PLAYER] || !merchantNear(sim, PLAYER)) return false;
  merchantVisit = { sim, id: sim.merchant.id };
  clearTouch(); keys.clear(); pendingUse = null; setMapPeek(false); audio.duck(true);
  rewardWasShown = true;
  mode = 'merchant'; $('tradebtn').classList.add('hidden'); $('merchantstatus').textContent = '';
  renderMerchant(); $('merchant').classList.remove('hidden');
  ($('merchantoffers').querySelectorAll('button:not([disabled])')[0] || $('merchantclose')).focus({ preventScroll: true });
  return true;
}
function closeMerchant() {
  $('merchant').classList.add('hidden'); merchantVisit = null;
  if (mode !== 'merchant') return;
  clearTouch(); keys.clear(); pendingUse = null; mode = 'play';
  if (sim?.pending[PLAYER]) showLevelUp(); else { audio.duck(false); resumeAfterReward(); }
}
function buyMerchantOffer(index) {
  if (mode !== 'merchant' || !merchantVisit || merchantVisit.sim !== sim || merchantVisit.id !== sim?.merchant?.id) return false;
  if (!buyMerchant(sim, PLAYER, merchantVisit.id, index, runCoinOptions(sim))) {
    $('merchantstatus').textContent = 'Offer unavailable. Check your run GP and try another item.'; renderMerchant(); return false;
  }
  closeMerchant(); return true;
}
$('tradebtn').onclick = openMerchant;
$('merchantclose').onclick = closeMerchant;
$('merchant').addEventListener('keydown', containMenuTab);

// ---- HUD -----------------------------------------------------------------------------------------------------------------------------
let hudT = 0; const slotCache = { w: '', p: '', b: '' };
const damageMeter = new DamageMeter(); let damageRun = null, damageReading = null, beltDisposers = [];
function setDamagePanel(open) {
  $('damagepanel').classList.toggle('hidden', !open); $('damagebtn').setAttribute('aria-expanded', String(open));
  if (open) { damageReading = null; updateDamageHud(); $('damageclose').focus({ preventScroll: true }); }
  else if ($('damagepanel').contains(document.activeElement)) $('damagebtn').focus({ preventScroll: true });
}
$('damagebtn').onclick = () => setDamagePanel($('damagepanel').classList.contains('hidden'));
$('damageclose').onclick = () => { setDamagePanel(false); $('damagebtn').focus(); };
function updateDamageHud() {
  if (damageRun !== sim) { damageRun = sim; damageReading = null; damageMeter.reset(); }
  if (!sim) return;
  if (mode === 'play') damageMeter.sample(sim.tick, (sim.coop ? sim.players.find(p => p.id === PLAYER).dmgBy : sim.dmgBy) || {});
  const reading = damageMeter.read(), rate = Object.values(reading.perSecond).reduce((a, b) => a + b, 0);
  $('dpsvalue').textContent = Math.round(rate).toLocaleString() + ' DPS';
  if ($('damagepanel').classList.contains('hidden') || damageReading === reading) return;
  damageReading = reading;
  const rows = Object.entries(reading.totals).filter(([, total]) => total > 0).sort((a, b) => (reading.perSecond[b[0]] || 0) - (reading.perSecond[a[0]] || 0));
  $('damagerows').innerHTML = rows.length ? rows.map(([id, total]) => {
    const p = sim.coop ? sim.players.find(p => p.id === PLAYER) : sim.players[0], name = Object.hasOwn(WEAPONS, id) ? weaponDisplay(id, p.weapons[id] || 1, p.evo[id], stepOf(id, p)).name : id === 'pumpkin' ? 'Pumpkin bombs' : 'Other';
    const dps = reading.perSecond[id] || 0, share = rate > 0 ? Math.round(dps / rate * 100) : 0;
    return `<div class="damagerow"><b>${esc(name)}</b><span>${dps.toFixed(1)} DPS</span><small>${share}% · <span translate="no">${Math.round(total).toLocaleString()}</span> <span>Total damage</span></small><i style="width:${share}%"></i></div>`;
  }).join('') : '<p class="dim">No damage yet.</p>';
}
function updateShrineHud(view) {
  const me = view.players.find(p => p.id === PLAYER && p.al);
  let nearest = null, distance = SHRINE.r + 1;
  if (me) for (const s of view.shrines || []) {
    const d = Math.hypot(s[2] - me.x, s[3] - me.z);
    if (SHRINES[s[1]] && d < distance) { nearest = s; distance = d; }
  }
  $('shrinecharge').classList.toggle('hidden', !nearest);
  if (!nearest) return;
  const percent = Math.round(Math.max(0, Math.min(1, nearest[4])) * 100);
  $('shrinename').textContent = SHRINES[nearest[1]].name;
  $('shrinestate').textContent = distance < SHRINE.r ? 'Charging' : 'Step into circle';
  $('shrineprogress').value = percent; $('shrinepct').textContent = percent + '%';
}
function updateTumbleHud(me) {
  $('tumblebtn').classList.toggle('hidden', sim.pace < 2);
  $('tumblebtn').disabled = me.rollCd > 0;
  $('tumblecd').textContent = me.rollCd > 0 ? String(Math.ceil(me.rollCd)) : '';
}
function updateBeerHud() {
  const p = sim.players.find(p => p.id === PLAYER), left = p?.alive ? Math.ceil(p.buffs.speed || 0) : 0;
  $('beerboost').hidden = left <= 0;
  if (left <= 0) return;
  if (!$('beericon').innerHTML) $('beericon').innerHTML = imgTag('Tin of Beer');
  const label = left + 's';
  if ($('beerleft').textContent !== label) $('beerleft').textContent = label;
}
function updateReviveHud() {
  const p = sim.players.find(p => p.id === PLAYER), left = p?.alive && Number.isSafeInteger(p.revives) ? p.revives : 0;
  $('revivehud').hidden = left <= 0;
  if (left <= 0) return;
  if (!$('reviveicon').innerHTML) $('reviveicon').innerHTML = imgTag('Power Amulet');
  if ($('reviveleft').textContent !== String(left)) $('reviveleft').textContent = String(left);
}
function updateEquipmentHud(me) {
  const gear = me.gear || {}, key = JSON.stringify(gear);
  if (slotCache.g === key) return;
  slotCache.g = key;
  const items = GEAR_SLOTS.flatMap(slot => {
    const name = gear[slot];
    if (typeof name !== 'string' || !Object.hasOwn(GEAR, name) || GEAR[name].slot !== slot) return [];
    const label = esc(`${gearSlotName(slot)} · ${name}`);
    return `<span class="slot" data-inspect="gear" data-inspect-id="${slot}" data-slot="${slot}" tabindex="0" role="img" aria-label="${label}">${imgTag(name)}</span>`;
  });
  $('equipmentitems').innerHTML = items.join('') || '<small>No gear equipped.</small>';
}
function updateHud(view) {
  const me = sim.coop ? view.players.find(p => p.id === PLAYER) : view.players[0];
  updateEquipmentHud(me);
  updateShrineHud(view);
  updateTumbleHud(me);
  updateBeerHud();
  updateReviveHud();
  $('modeprogress').classList.toggle('hidden', !sim.variant);
  if (sim.variant) $('modeprogress').innerHTML = `<span>${VARIANTS[sim.variant].name}</span>` + (sim.variant === 'wizard' ? '' : sim.wave != null ? ` · <span>Wave</span> ${sim.wave}${sim.nextWave ? ` · <span>Next wave</span> ${fmtT(Math.max(0, sim.nextWave - sim.t))}` : ''}` : ` · <span>${ENEMIES[sim.trialBoss].name}</span>`);
  updateDamageHud();
  $('hpfill').style.width = Math.min(100, Math.max(0, (me.hp / me.mhp) * 100)) + '%';
  $('hptext').textContent = `${me.hp} / ${me.mhp}`;
  $('xpfill').style.width = Math.min(100, (view.xp / view.xpNeed) * 100) + '%';
  $('lvl').textContent = 'Lv ' + view.level;
  const t = Math.floor(view.t); $('clock').textContent = fmtT(t);
  if (sim.variant === 'castle') $('modeprogress').innerHTML = `<span>Castle health</span> ${Math.ceil(sim.castle.hp)}/${sim.castle.maxHp} · ` + $('modeprogress').innerHTML;
  const goal = sim.variant === 'raid' ? RAID_DURATION : sim.variant === 'boss' ? 0 : sim && sim.endAt ? sim.endAt : sim && !sim.endless && sim.map.length ? sim.map.length : 0;
  if (runBest && !passedBest && betterRun(runBest, { t, kills:view.kills, won:sim.over === 'win' }) !== runBest) { passedBest = true; banner(`New best on ${sim.map.name}!`, 2200); audio.play('level', { vol: 0.8 }); }
  $('clockgoal').textContent = (goal ? `of ${fmtT(goal)}` : '') + (runBest ? (passedBest ? ' · new best!' : ` · best ${fmtT(runBest.t)}`) : '') + chaseText(t, view.kills);
  $('kills').textContent = view.kills;
  $('tradebtn').classList.toggle('hidden', mode !== 'play' || !sim || !merchantNear(sim, PLAYER));
  if (sim && sim.players[0] && (frame % 10 === 0 || !$('gp').textContent)) $('gp').textContent = runCoins(sim).toLocaleString();
  const boss = view.enemies.find((e) => ENEMIES[e[1]].boss);
  $('bossbar').classList.toggle('hidden', !boss);
  if (boss) { $('bossname').textContent = bossName(sim && sim.map, boss[1]); $('bossfill').style.width = boss[5] + '%'; }
  const bk = JSON.stringify(me.belt || []);
  if (bk !== slotCache.b) {
    for (const dispose of beltDisposers) dispose(); beltDisposers = [];
    slotCache.b = bk; const BELT_ICON = { beer: 'Tin of Beer', pumpkin: 'Pumpkin', warp: 'Warp Shard', ...Object.fromEntries(Object.entries(FOOD).map(([kind, food]) => [kind, food.item])) };
    const BELT_TIP = { beer: sim.pace >= 2 ? 'Restores 20 health, boosted by healing bonuses. Adds 8 seconds of faster running, up to 60 seconds remaining; the speed bonus stays +35%.' : 'Restores 20 health, boosted by healing bonuses. Run faster for 8 seconds.', pumpkin: 'Blasts nearby enemies. Damage grows with run time.', warp: 'Pulls all dropped bones and coins to you.' };
    $('belt').innerHTML = Array.from({ length: BELT_SIZE }, (_, i) => { const k = (me.belt || [])[i], count = me.beltCounts?.[i] || 1; return `<button type="button" class="bslot${k ? '' : ' empty'}" data-i="${i}" data-kind="${k || ''}" data-count="${count}" ${k ? `aria-label="${BELT_ICON[k]}${count > 1 ? ` ×${count}` : ''}" aria-describedby="belttip${i}"` : 'disabled aria-label="Empty item slot"'}>${k ? imgTag(BELT_ICON[k]) : ''}<small>${i + 1}</small>${k ? `<b class="beltcount" translate="no"${count <= 1 ? ' hidden' : ''}>${count > 1 ? `×${count}` : ''}</b>` : ''}${k ? `<span id="belttip${i}" class="belttip" role="tooltip" hidden><b>${BELT_ICON[k]}</b><span>${FOOD[k] ? `Restores ${FOOD[k].heal} health, boosted by healing bonuses.` : BELT_TIP[k]}</span><em>Tap to use. Hold to inspect.</em></span>` : ''}</button>`; }).join('');
    for (const el of $('belt').children) if (el.dataset.kind) {
      const i = Number(el.dataset.i), kind = el.dataset.kind;
      beltDisposers.push(bindBeltItem(el, { use: () => { pendingUse = i; }, canUse: () => mode === 'play' && !waitingForMove && !sim.pending[PLAYER] && !sim.over && (sim.coop ? sim.players.find(p => p.id === PLAYER) : sim.players[0]).belt[i] === kind }));
    }
  }
  for (const el of $('belt').children) {
    const kind = el.dataset.kind; if (!FOOD[kind]) continue;
    const count = me.beltCounts?.[Number(el.dataset.i)] || 1;
    if (el.dataset.count === String(count)) continue;
    el.dataset.count = String(count);
    const badge = el.querySelector('.beltcount'); badge.hidden = count <= 1; badge.textContent = count > 1 ? `×${count}` : '';
    el.setAttribute('aria-label', `${FOOD[kind].item}${count > 1 ? ` ×${count}` : ''}`);
  }
  const wk = JSON.stringify([me.w, me.evo, me.wm]), pk = JSON.stringify(me.ps);
  if (wk !== slotCache.w) { slotCache.w = wk; $('wrow').innerHTML = Object.entries(me.w).map(([id, l]) => `<div class="slot${me.evo[id] ? ' evo' : ''}" data-inspect="weapon" data-inspect-id="${id}" tabindex="0" role="img" aria-label="${esc(weaponDisplay(id, l, me.evo[id], weaponStep(id, me.wm)).name)}">${iconHTML('weapon', id, l, me.evo[id], weaponStep(id, me.wm))}<small>${me.evo[id] ? '★' : l}</small></div>`).join(''); }
  if (pk !== slotCache.p) { slotCache.p = pk; $('prow').innerHTML = Object.entries(me.ps).map(([id, l]) => `<div class="slot" data-inspect="passive" data-inspect-id="${id}" tabindex="0" role="img" aria-label="${esc(passiveTitle(id, l))}">${iconHTML('passive', id, l)}<small>${l}</small></div>`).join(''); }
  for (const f of view.fx) {
    if (sim.coop && (f.player && f.player !== PLAYER || ['down','revive'].includes(f.k) && f.id !== PLAYER)) continue;
    if (f.k === 'boss') banner(sim && !sim.endless && f.type === sim.map.finalBoss && sim.bossIndex >= sim.map.bosses.length ? `${bossName(sim.map, f.type)} approaches! Slay it to win the run.` : `${bossName(sim && sim.map, f.type)} approaches!`, 3500);
    else if (f.k === 'down') banner('You have fallen…', 3000);
    else if (f.k === 'evolve') banner(`${EVOLUTIONS[f.id].name}!`, 3000);
    else if (f.k === 'use' && f.kind === 'beer') banner('Tin of Beer: speed up!', 1400);
    else if (f.k === 'use' && f.kind === 'pumpkin') banner('Pumpkin bomb!', 1200);
    else if (f.k === 'use' && f.kind === 'warp') banner('Warp Shard: everything comes to you', 1600);
    else if (f.k === 'revive') banner('Revived!', 1600);
    else if (f.k === 'get' && f.kind === 'chest') banner('Gold Bar!', 1000);
    else if (f.k === 'event') banner(f.kind === 'treasure' ? 'A treasure goblin! Catch it before it gets away' : f.kind === 'swarm' ? 'Swarm!' : f.kind === 'warband' ? `A goblin warband charges from the ${f.dir}!` : f.kind === 'rising' ? 'The dead rise around you!' : f.kind === 'rainstorm' ? 'Rainstorm! Distant views and the minimap are clouded' : f.kind === 'snowstorm' ? 'Snowstorm! Distant views and the minimap are clouded' : f.kind === 'blizzard' ? 'Blizzard! The snow slows you down' : f.kind === 'duel' ? 'A champion of the Fighting Forum challenges you!' : f.kind === 'stampede' ? `Chicken stampede from the ${f.dir}!` : f.kind === 'sandstorm' ? 'Sandstorm! Scorpions in the dust' : f.kind === 'ambush' ? 'Ambush! Things are crawling out of the water' : 'Meteor shower! Watch the ground', 2600);
    else if (f.k === 'treasure') banner('Treasure goblin caught!', 1800);
    else if (f.k === 'shrine' && SHRINES[f.kind]) banner(`A ${SHRINES[f.kind].name} rose nearby: stand in its circle to charge it`, 3200);
    else if (f.k === 'shrine-done' && SHRINES[f.kind] && f.id === PLAYER) banner(`${SHRINES[f.kind].name}: ${SHRINES[f.kind].text}`, 3200);
    else if (f.k === 'region' && sim.t > 1) banner(MAP_BY_ID[f.id].name, 1800);
    else if (f.k === 'escape') banner('The treasure goblin got away', 1600);
    else if (f.k === 'endless-growth') {
      const text = { might: 'Damage bonus +1%', maxHp: 'Maximum health bonus +1%', area: 'Area bonus +1%' }[f.stat];
      if (typeof text === 'string') toast(`<span>Endless growth<br><b>${text}</b></span>`);
    }
    else if (f.k === 'casket' && f.worn && f.weapon) { toast(`${imgTag(f.item)} <span>${WEAPON_ITEMS[f.item] && WEAPON_ITEMS[f.item].kind === 'arrow' ? 'The Bow now shoots' : `${WEAPONS[f.weapon].name}, now`}<br><b>${f.item}</b></span>`); }
    else if (f.k === 'casket' && f.worn) { toast(`${imgTag(f.item)} <span>${f.old ? 'Now wearing' : 'Reward casket, now worn'}<br><b>${f.item}</b></span>`); }
    else if (f.k === 'alch' && !autoAlchOn()) { toast(`${imgTag('Gold')} <span>High alch<br><b>${f.item}</b> +${f.coins} coins</span>`); }
  }
}

// ---- menus with a controller or the arrow keys: spatial focus, A/Enter picks, B/Esc goes back -----------------------
const NAV_SCREENS = [...MENU_SCREENS, 'pause', 'end', 'title'];
const NAV_ITEMS = '#trialboss, #coop input, #racersplay, summary, [data-milestone][tabindex="0"], .aopt:not(.locked), .mopt:not(.locked), button:not([disabled]), .gslot, .gitem:not(.locked), #hardwrap:not(.hidden):not(.locked), #endlesswrap:not(.hidden):not(.locked), input[data-vol]';
let navEl = null;
function navScreen() { if (walletModalOpen()) return null; if (mode === 'recovery') return $('progressrecovery'); return NAV_SCREENS.map((id) => $(id)).find((el) => el && !el.classList.contains('hidden')); }
function navItems(scr) { return [...scr.querySelectorAll(NAV_ITEMS)].filter((el) => el.offsetParent !== null && !el.closest('.hidden') && !el.closest('details:not([open]) > :not(summary)')); }
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
  if (navEl.id === 'trialboss') { navEl.selectedIndex = (navEl.selectedIndex + 1) % navEl.options.length; navEl.dispatchEvent(new Event('change')); return true; }
  navEl.click(); return true;
}
function navBack() {
  if (mode === 'recovery') return true;
  if (walletModalOpen()) return true;
  if (!$('cloudpick').classList.contains('hidden')) return true; // Keep both saves until an explicit choice resolves the prompt.
  for (const id of MENU_SCREENS) if (!$(id).classList.contains('hidden')) {
    if (id === 'merchant') { closeMerchant(); return true; }
    if (id === 'skills' || id === 'gear') { $(id + 'close').click(); return true; }
    if (id === 'settings') { $('setclose').click(); return true; }
    if (id === 'quests') { $('questclose').click(); return true; }
    if (id === 'modemenu' || id === 'guide' || id === 'pets' || id === 'more' || id === 'coop' || id === 'upgrades') { $(id + 'close').click(); return true; }
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
  const summaryEscape = k === 'Escape' && e.target?.matches?.('summary') && navScreen()?.contains(e.target);
  if (e.target?.matches?.('input, textarea, select, summary, [contenteditable="true"]') && !(spatialControl && (dir || k === 'Escape') || summaryEscape)) return;
  if (mode === 'play' || mode === 'levelup' || mode === 'casket') return;
  const scr = navScreen();
  if ((k === 'Enter' || k === ' ') && scr && MENU_SCREENS.includes(scr.id) && !scr.contains(e.target)) { e.preventDefault(); return; }
  if (k === 'Escape' && (spatialControl || summaryEscape) && navBack()) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target?.matches?.('button, a[href]')) return;
  if (dir) { navMove(dir); e.preventDefault(); e.stopImmediatePropagation(); }
  else if (k === 'Enter' && navEl && navScreen() && navScreen().contains(navEl)) { if (navPress()) { e.stopImmediatePropagation(); e.preventDefault(); } }
}, true);

// ---- minimap: the game's own map art around you, turned with the camera ---------------------------------------------
const mmImg = new Image();
const mm = $('minimap'), mmx = mm.getContext('2d');
function setMapPeek(on) {
  const open = !!on && !isTouchUI && matchMedia('(hover:hover) and (pointer:fine)').matches && mode === 'play' && !!sim;
  $('mmwrap').classList.toggle('mappeek', open);
  const size = open ? 512 : 168;
  if (mm.width !== size) { mm.width = mm.height = size; if (sim) drawMinimap(snapshot(sim, {maxEnemies:420})); }
  return open;
}
addEventListener('keyup', e => { if (e.key === 'Tab') setMapPeek(false); });
addEventListener('blur', () => setMapPeek(false));
let inspectedElement = null;
function hideItemInspection() {
  inspectedElement?.removeAttribute('aria-describedby'); inspectedElement = null; $('itemtip').hidden = true;
}
function showItemInspection(event) {
  if (event.type === 'pointerover' && event.pointerType !== 'mouse') return;
  const element = event.target.closest('[data-inspect]');
  if (!element || !sim || !['play','pause','levelup','casket'].includes(mode)) return;
  const player = sim.players.find(p => p.id === PLAYER), card = itemInspection(player, element.dataset.inspect, element.dataset.inspectId, sim.pace);
  if (!card) { hideItemInspection(); return; }
  hideItemInspection(); inspectedElement = element;
  const tip = $('itemtip'); tip.replaceChildren();
  const name = document.createElement('b'); name.textContent = card.title; tip.appendChild(name);
  for (const line of card.details) { const text = document.createElement('span'); text.textContent = line; tip.appendChild(text); }
  element.setAttribute('aria-describedby', 'itemtip'); tip.hidden = false;
  tip.style.maxHeight = Math.max(0, innerHeight - 16) + 'px'; tip.style.width = '';
  if (tip.scrollHeight > tip.clientHeight) tip.style.width = Math.min(380, innerWidth - 16) + 'px';
  const rect = element.getBoundingClientRect(), box = tip.getBoundingClientRect(), pane = screenLayout.active ? $('dscontrols').getBoundingClientRect().top + 8 : 8;
  const lower = box.height <= innerHeight - pane - 8 ? pane : 8; // Long Flex descriptions may need both panes.
  tip.style.left = Math.max(8, Math.min(rect.right + 8, innerWidth - box.width - 8)) + 'px';
  tip.style.top = Math.max(lower, Math.min(rect.top, innerHeight - box.height - 8)) + 'px';
}
bindItemInspection($('loadout'), { show: showItemInspection, hide: hideItemInspection, canInspect: () => !!sim && ['play','pause','levelup','casket'].includes(mode) });
for (const event of ['pointerover','focusin']) $('loadout').addEventListener(event, showItemInspection);
for (const event of ['pointerout','focusout']) $('loadout').addEventListener(event, e => { if (inspectedElement && !inspectedElement.contains(e.relatedTarget)) hideItemInspection(); });
addEventListener('blur', hideItemInspection);
function drawMinimap(view) {
  if (!view.players.length) return;
  if (!mmImg.src) mmImg.src = asset('world/world-map-full.webp');
  const me = sim.coop ? view.players.find(p => p.id === PLAYER) : view.players[0], W = mm.width, R = W / 2, PX = 2.4; // canvas px per world unit
  const yaw = renderer.getYaw();
  mmx.save(); mmx.clearRect(0, 0, W, W);
  mmx.beginPath(); mmx.arc(R, R, R - 2, 0, Math.PI * 2); mmx.clip();
  mmx.fillStyle = '#244f78'; mmx.fillRect(0, 0, W, W);
  mmx.translate(R, R); mmx.rotate(yaw); mmx.imageSmoothingEnabled = false;
  const span = (R / PX) * 1.5; // world units drawn around you (the corners show when turned)
  if (mmImg.complete && mmImg.naturalWidth > 0) mmx.drawImage(mmImg, (me.x - span) * 4, (me.z - span) * 4, span * 8, span * 8, -span * PX, -span * PX, span * 2 * PX, span * 2 * PX);
  const dot = (x, z, r, c) => { mmx.fillStyle = c; mmx.beginPath(); mmx.arc((x - me.x) * PX, (z - me.z) * PX, r, 0, Math.PI * 2); mmx.fill(); };
  // the edge of this map's arena
  if (sim.map.r < 500) { mmx.strokeStyle = 'rgba(255,240,192,0.5)'; mmx.lineWidth = 1.5; mmx.beginPath(); mmx.arc((sim.map.cx - me.x) * PX, (sim.map.cz - me.z) * PX, sim.map.r * PX, 0, Math.PI * 2); mmx.stroke(); }
  for (const p of view.players) if (p.id !== PLAYER && p.al) dot(p.x, p.z, 3, '#69c8ff');
  if (view.castle) {
    const dx = view.castle.x - me.x, dz = view.castle.z - me.z, d = Math.hypot(dx, dz), limit = (R - 9) / PX, k = d > limit ? limit / d : 1;
    dot(me.x + dx * k, me.z + dz * k, 6, '#171309'); dot(me.x + dx * k, me.z + dz * k, 4, '#83edbd');
  }
  if (view.merchant) { dot(view.merchant.x, view.merchant.z, 6, '#1a1309'); dot(view.merchant.x, view.merchant.z, 4, '#ffe77b'); }
  for (const k of view.pickups) if (k[1] === 'casket' || k[1] === 'chest') dot(k[2], k[3], 3.5, '#ffd34d');
  for (const e of view.enemies) { const def = ENEMIES[e[1]]; dot(e[2], e[3], def.boss ? 5 : e[7] ? 3.5 : 1.8, def.boss ? '#ff3b2f' : e[7] ? '#ffd34d' : '#ff7b6b'); }
  mmx.restore();
  drawStormMinimap(mmx, W, PX, view.storm, view.t);
  // you: an arrow pointing where you face (relative to the camera)
  mmx.save(); mmx.translate(R, R); mmx.rotate(-(me.f - Math.PI) + yaw);
  mmx.fillStyle = '#ffffff'; mmx.strokeStyle = '#000'; mmx.lineWidth = 1.5;
  mmx.beginPath(); mmx.moveTo(0, -7); mmx.lineTo(5, 6); mmx.lineTo(0, 3); mmx.lineTo(-5, 6); mmx.closePath(); mmx.fill(); mmx.stroke();
  mmx.restore();
}

// ---- main loop ------------------------------------------------------------------------------------------------------------------------
let lastDrawn = 0, lastMenuDrawn = -Infinity;
function loop(ts) {
  requestAnimationFrame(loop);
  enforceRankedDeadline();
  syncRankedClock();
  if (mode !== 'play' || document.hidden) setMapPeek(false);
  if (document.hidden || !['play','pause','levelup','casket'].includes(mode) || inspectedElement && !inspectedElement.isConnected) hideItemInspection();
  if (!document.hidden) bunCompanions.sync(!!bunChoice(selectedPet));
  if (petViewer && $('pets').classList.contains('hidden')) { petViewer.dispose(); petViewer = null; petViewDrag = null; }
  const cap = renderer && Number(renderer.getSettings().fps); // Frame rate cap setting (saves battery)
  if (cap && ts - lastDrawn < 1000 / cap - 2) return;
  lastDrawn = ts;
  if (mode === 'play') lastMenuDrawn = -Infinity;
  const dt = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts; frame++;
  const inp = readInput(); const edges = padEdges(inp.pad);
  if (mode !== 'play' && mode !== 'levelup' && mode !== 'casket') {
    for (const d of ['up', 'down', 'left', 'right']) if (edges[d]) navMove(d);
    if (edges.b) navBack();
    if (edges.a && navPress()) edges.a = false;
    if (edges.start && mode === 'title' && !$('start').disabled && navScreen()?.id === 'title') edges.a = true;
  }
  if (petViewer && !$('pets').classList.contains('hidden')) {
    if (document.hidden || ts - lastMenuDrawn < 1000 / 30 - .1) return;
    const elapsed = (ts - lastMenuDrawn) / 1000; lastMenuDrawn = ts; petViewer.draw(elapsed); return;
  }
  if (mode === 'title' || mode === 'end') {
    if (edges.a && mode === 'title' && !$('start').disabled && navScreen()?.id === 'title') startRun(); else if (edges.a && mode === 'end' && navScreen()?.id === 'end') startRun();
    if (!sim) { // title backdrop: the chosen adventurer standing in the chosen map
      if (ts - lastMenuDrawn >= 1000 / 30 - 0.1) {
        lastMenuDrawn = ts;
        if (!window.__idleSim) {
          const T = renderer.terrain;
          window.__idleSim = createSim({ seed: 1, ...(selVariant === 'wizard' ? { variant: 'wizard' } : {}), map: MAP_BY_ID[selMap], ground: T ? { n: T.cell ? T.cells : T.n, blocked: T.blocked, cell: !!T.cell, water: T.water || null, walls: T.walls || null } : null, players: [{ id: PLAYER, name: 'You', adv: runAdv().id, gear: selVariant !== 'wizard' && runAdv().id !== selAdv ? {} : getGear() }] });
          const previewSpots = { greentown: [378.5, 270.5], apache: [202.5, 85.5], world: [378.5, 270.5] };
          if (Object.hasOwn(previewSpots, selMap)) { const p = window.__idleSim.players[0]; [p.x, p.z] = findWalkable(window.__idleSim, ...previewSpots[selMap]); } // title only; Whole World is south of Greentown's bank
        }
        const v = snapshot(window.__idleSim); v.players[0].f = Math.sin(performance.now() / 3000) * 0.5;
        const previewPlayer = v.players[0];
        if (Number.isFinite(previewPlayer.x) && Number.isFinite(previewPlayer.z)) {
          const [x, z] = findWalkable(window.__idleSim, previewPlayer.x + 1.4, previewPlayer.z + .4);
          v.petPreview = { x, z, f: previewPlayer.f };
        }
        const canvasBox = $('c').getBoundingClientRect(), centreX = canvasBox.x + canvasBox.width / 2;
        const headerBottom = Math.max(24, ...['brand', 'topright'].map(id => { const r = $(id).getBoundingClientRect(); return r.left < centreX && r.right > centreX ? r.bottom + 12 : 0; }));
        const menuTop = Math.max(headerBottom, Math.min(canvasBox.bottom - 24, $('menu').getBoundingClientRect().top - 16));
        renderer.setShift(0, Math.max(0.1, Math.min(0.9, ((headerBottom + menuTop) / 2 - canvasBox.top) / (canvasBox.height || 1))));
        if (compactMenu.matches) renderer.setYaw(0);
        else if (!params.has('qa')) renderer.setYaw(renderer.getYaw() + 0.0045); // the desktop title camera drifts slowly
        renderer.update(v, 0.033, PLAYER);
      }
      return;
    }
  }
  if (!sim) return;
  if (sim.coop) syncCoopRun(inp, edges);
  else if (mode === 'play') {
    if (edges.start) { pause(true); return; }
    if (edges.b && openMerchant()) return;
    if (edges.a) hop();
    if (waitingForMove && (Math.hypot(inp.mx, inp.mz) > 0.01 || pendingUse === 4)) { waitingForMove = false; $('movehint').classList.add('hidden'); audio.duck(false); }
    if (waitingForMove) acc = 0;
    else { acc += dt * (slowmo > 0 ? 0.3 : 1); slowmo -= dt; } // a moment of slow motion when a boss falls
    let n = 0;
    if (edges.lb) pendingUse = 0; if (edges.rb) pendingUse = 1; if (edges.x) pendingUse = 2; if (edges.y) pendingUse = 3;
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
    if (edges.left) { moveCard(-1); } if (edges.right) { moveCard(1); } if (edges.b) toggleBanish(); else if (edges.a) pick(selCard);
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
    if (mode === 'pause' && ts - lastMenuDrawn < 1000 / 30 - 0.1) return;
  }
  if (['pause', 'merchant', 'end', 'recovery'].includes(mode)) {
    if (ts - lastMenuDrawn < 1000 / 30 - 0.1) return;
    lastMenuDrawn = ts;
  }
  const view = snapshot(sim, { maxEnemies: 420 });
  view.spellCasters = Object.fromEntries(sim.proj.filter(p => p.art === 'bolt').map(p => [p.id, p.owner]));
  view.petActive = mode === 'play' && !waitingForMove && !Object.keys(view.pending || {}).length && !view.over && (!sim.coop || !!coop?.run && !coop.run.held && !coop.run.closed);
  view.alpha = Math.min(1, Math.max(0, acc / TICK)); // where between sim ticks this frame is (the renderer slides spells by it)
  if (view.fx.some((f) => f.k === 'die' && f.boss)) slowmo = 0.9;
  audio.onFx(view.fx, mode === 'play' ? view : null, sim.map.world && view.region ? MAP_BY_ID[view.region].music : sim.map.music);
  const renderView = coop?.run && mode === 'play' ? predictedView(view, coop.run.pose(), PLAYER) : view;
  const flash = renderer.update(renderView, mode === 'play' || mode === 'levelup' ? dt : 0.001, PLAYER);
  $('hurt').classList.toggle('on', flash > 0.05);
  hudT += dt; if (hudT > 0.08 || view.fx.length) updateHud(view);
  if (hudT > 0.08) { hudT = 0; drawMinimap(view); }
}

boot().then(async () => {
  applyDmt(); await refreshPendingTitleProgress(); window.__sqReady = true; cloudPull(); await refreshRanked();
  if (!walletHandoff && (rankedLive() || readRanked('sq-ranked-submit') || readRanked('sq-ranked-payment'))) {
    await openRanked();
    if (rankedLive()?.sim !== SIM_ID && rankedLive() && !readRanked('sq-ranked-submit')) recoverRankedRun();
  } else if (params.get('menu') === 'fun' && !walletHandoff) openModeMenu('fun');
});
// QA hooks (?qa or ?debug): drive the game from a test browser
// test controls (god mode, skipping time, items) exist only on a local test copy, never on the live site
const qaHooks = {
  get sim() { return rankedRun || coop ? null : sim; }, get mode() { return mode; }, step: (...args) => { if (!rankedRun && !coop) step(...args); }, snapshot, keys, renderer: () => rankedRun || coop ? null : renderer,
  startRun: () => { if (!rankedRun && !coop) return startRun(); }, toMenu, pick, pause,
  setAdv(id) { if (coop) return; selAdv = id; buildAdventurers(); window.__idleSim = null; },
  setMap: (id) => { if (!coop) return pickMap(id); },
  spawn(type, n = 1, d = 4) { if (rankedRun || coop) return; const p = sim.players[0]; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; spawnEnemy(sim, type, p.x + Math.cos(a) * d, p.z + Math.sin(a) * d); } },
  // run the sim forward (no rendering), auto-picking level-ups; keeps the player still unless dir is given
  warp(sec, dir = [0, 0]) { if (rankedRun || coop) return; for (let i = 0; i < sec / TICK; i++) { step(sim, { [PLAYER]: { mx: dir[0], mz: dir[1] } }, TICK); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); if (sim.over) break; } },
  god() { if (rankedRun || coop) return; const p = sim.players[0]; p.hp = p.maxHp = 1e6; p.godMode = true; },
  give(name) { if (coop) return; return bankItem(name); }, wear(slot, name) { if (coop) return; const g = getGear(); g[slot] = name; save('sq-gear', g); }, buildGear, buildQuests, refreshIdle,
  drop(kind) { if (rankedRun || coop) return; const p = sim.players[0]; sim.pickups.push({ id: sim.nextId++, x: p.x + 1.5, z: p.z, kind }); },
  // reward caskets: drop n at your feet (rolled by the sim), or queue given items as if a casket held them
  caskets(n = 1) { if (rankedRun || coop) return; const p = sim.players[0]; for (let i = 0; i < n; i++) sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'casket' }); },
  casketOf(...names) { if (rankedRun || coop) return; const p = sim.players[0]; for (const n of names) if (isWeaponItem(n) || GEAR[n]) { if (!isWeaponItem(n) && !p.gear[GEAR[n].slot]) continue; sim.loot.push(n); if (p.casketLootIndices) p.casketLootIndices.push(sim.loot.length - 1); p.casketQ.push(n); } openCasket(sim, p); }, // as if caskets held them
  wearNow(gear) { if (rankedRun || coop) return; const p = sim.players[0]; p.gear = { ...p.gear, ...gear }; p.gb = gearBonus(p.gear, p.gearLv || {}, sim.pace); },
};

if ((params.has('debug') || params.has('qa')) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) Object.defineProperty(window, '__sq', { get: () => coop || rankedRun || rankedLive() ? undefined : qaHooks });
