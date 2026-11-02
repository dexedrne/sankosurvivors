import { RunRecorder } from './ranked.js';
import { rankedStep, rankedChoice, resumeRanked } from './ranked-play.js';
import { rankedApi, payEntry, recoverPayment, readRanked, writeRanked } from './ranked-client.js';
import { createRenderer } from './render.js';
import { createSim, step, snapshot, choose, spawnEnemy, reroll, skipLevel, BELT_SIZE, TICK } from './sim.js';
import { createAudio } from './audio.js';
import { CHANGELOG, LATEST } from './changelog.js';
import { CREATOR, TIP_ETH } from './config.js';
import { wallets, savedPass, forget, prove, short, walletAppLinks, why, DMT_COIN_BONUS } from './dmt.js';
import {
  MAPS, MAP_BY_ID, ADVENTURERS, ADVENTURER_BY_ID, ENEMIES, WEAPONS, PASSIVES, EVOLUTIONS, SKILLS, SKILL_IDS, SKILL_MAX, skillCost,
  weaponItem, weaponTitle, weaponDisplay, passiveItem, passiveTitle, itemIconFile,
  GEAR, GEAR_SLOTS, GEAR_SLOT_NAMES, GEAR_SETS, GEAR_MAX_LV, gearUpgradeCost, gearBonus, bonusText, QUESTS,
} from './content.js';

const $ = (id) => document.getElementById(id);
const BASE = import.meta.env.BASE_URL || './';
const params = new URLSearchParams(location.search);
const PLAYER = 'p1';

let sim = null, renderer = null, mode = 'title', acc = 0, last = 0, frame = 0, selCard = 0;
const keys = new Set();
const audio = createAudio();
const fmtT = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

// ---- saved progress ------------------------------------------------------------------------------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const clearedMaps = () => new Set(load('sq-cleared', []));
const getCoins = () => Number(load('sq-coins', 0)) || 0;
const clampLv = (o, max) => { const out = {}; if (o && typeof o === 'object' && !Array.isArray(o)) for (const k of Object.keys(o)) out[k] = Math.max(0, Math.min(max, Math.floor(Number(o[k])) || 0)); return out; }; // saved levels can be edited or arrive in a #carry= link: never trust them as numbers
const getSkills = () => clampLv(load('sq-skills', {}), SKILL_MAX);
let selMap = load('sq-map', 'greentown'); if (!MAP_BY_ID[selMap]) selMap = 'greentown';
let selAdv = load('sq-adv', 'adventurer'); if (!ADVENTURER_BY_ID[selAdv]) selAdv = 'adventurer';
let loadedMapId = 'greentown', mapLoading = false, hardOn = false, endlessOn = false;
// gear you own (from caskets and quests) and what you wear; lifetime stats that quests read
const getBank = () => load('sq-bank', []);
const getGear = () => { const g = load('sq-gear', {}), bank = new Set(getBank()); for (const k of Object.keys(g)) if (!bank.has(g[k]) || !GEAR[g[k]]) delete g[k]; return g; };
const getStats = () => load('sq-stats', {});
const getGearLv = () => clampLv(load('sq-gearlv', {}), GEAR_MAX_LV);
const questsDone = () => new Set(load('sq-quests', []));
const statVal = (st, key) => st[key] || 0;
// a new item goes to the bank; a duplicate is sold for coins
function bankItem(name) { const b = getBank(); if (b.includes(name)) { save('sq-coins', getCoins() + 25); return false; } b.push(name); save('sq-bank', b); return true; }
// special maps (Tutorial Island) are open from the start and sit outside the campaign chain
const unlockedMap = (i) => params.has('unlock') || i === 0 || !!MAPS[i].special || clearedMaps().has(MAPS[i - 1].id);
const unlockedAdv = (a) => params.has('unlock') || a.unlock <= clearedMaps().size;
// some maps fix who you play (Tutorial Island: Alex)
const runAdv = () => ADVENTURER_BY_ID[(MAP_BY_ID[selMap] && MAP_BY_ID[selMap].forceAdv) || selAdv];

// ---- icons: real SankoQuest item icons -----------------------------------------------------------------
const EMOJI = { baseball: '⚾', lighter: '🔥', area: '🧥', amount: '🪶', crit: '🍄', thorns: '🦂', greed: '🗝️', greatsword: '⚔️', shortsword: '🗡️', katana: '🗡️', axe: '🪓', pickaxe: '⛏️', shield: '🛡️', bow: '🏹', staff: '🪄', might: '💪', haste: '💨', vigor: '❤️', boots: '👢', magnet: '🧲', armor: '🛡️', growth: '📖', fish: '🐟' };
// upgrade icons are fetched a step ahead, so level-up cards never show up blank
const iconsAsked = new Set();
function preloadIcons(names) { for (const n of names) { if (!n || iconsAsked.has(n)) continue; iconsAsked.add(n); const im = new Image(); im.src = `${BASE}assets/ui/items/${itemIconFile(n)}`; } }
const preloadNextIcons = (p) => { if (!p) return; const out = []; for (const [w, l] of Object.entries(p.weapons || {})) out.push(weaponItem(w, l + 1), weaponItem(w, l + 2)); for (const [k, l] of Object.entries(p.passives || {})) out.push(passiveItem(k, l + 1)); preloadIcons(out); };
const imgTag = (name, fallback = '✦') => `<img src="${BASE}assets/ui/items/${itemIconFile(name)}" alt="${name}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji',textContent:'${fallback}'}))">`;
function iconHTML(kind, id, level, evo) {
  if (kind === 'weapon') return imgTag(weaponDisplay(id, level || 1, evo).item, EMOJI[id]);
  if (kind === 'passive') return imgTag(passiveItem(id, level || 1), EMOJI[id]);
  return imgTag(id);
}

// ---- title screen --------------------------------------------------------------------------------------------
function showBest() {
  const b = load('sq-best', null);
  $('best').textContent = b ? `Best run: ${fmtT(b.t)} · level ${b.level} · ${b.kills} slain${b.won ? ' · victory' : ''}` : '';
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
  const bonus = Object.entries(a.bonus).map(([k, v]) => ({ speed: `+${Math.round(v * 100)}% speed`, armor: `+${v} armor`, magnet: `+${Math.round(v * 100)}% pickup range`, growth: `+${Math.round(v * 100)}% experience`, hp: `+${v} HP`, dmg: `+${Math.round(v * 100)}% damage`, haste: `-${Math.round(v * 100)}% cooldowns` }[k])).join(', ');
  $('ainfo').innerHTML = `<b>${a.name}</b> · starts with ${weaponTitle(a.weapon, 1)}<br>${a.blurb} <span style="opacity:.75">(${bonus})</span>`;
}
function buildMaps() {
  const cl = clearedMaps();
  $('mpick').innerHTML = MAPS.map((m, i) => {
    const open = unlockedMap(i), px = 1.2;
    const bg = m.world ? `background-image:url(${BASE}assets/world/world-map-full.webp);background-size:cover;background-position:center` : `background-image:url(${BASE}assets/world/world-map-full.webp);background-size:${512 * px}px;background-position:${-(m.cx * px - 45)}px ${-(m.cz * px - 26)}px`;
    return `<div class="mopt${m.id === selMap ? ' sel' : ''}${open ? '' : ' locked'}" data-id="${m.id}"><div class="thumb" style="${bg}">${open ? '' : '🔒'}${cl.has(m.id) ? '<i>✔</i>' : ''}</div>${m.name}</div>`;
  }).join('');
  for (const el of $('mpick').children) el.onclick = () => {
    if (el.classList.contains('locked')) { $('mapinfo').textContent = 'Clear the map before it to unlock this one.'; return; }
    pickMap(el.dataset.id);
  };
  const m = MAP_BY_ID[selMap];
  $('mapinfo').innerHTML = `<b>${m.name}</b> · ${m.blurb}<br>Final boss: ${ENEMIES[m.finalBoss].name}`;
  $('apick').classList.toggle('forced', !!m.forceAdv);
  if (m.forceAdv) { const fa = ADVENTURER_BY_ID[m.forceAdv]; $('ainfo').innerHTML = `On ${m.name} you play as <b>${fa.name}</b>: ${weaponTitle(fa.weapon, 1)}, bronze armour, winged boots and extra health.`; }
  const cleared = cl.has(m.id) || params.has('unlock');
  $('hardwrap').classList.toggle('hidden', !cleared); $('endlesswrap').classList.toggle('hidden', !cleared);
  if (!cleared) { hardOn = false; $('hard').checked = false; endlessOn = false; $('endless').checked = false; }
}
async function pickMap(id) {
  if (mapLoading) return; selMap = id; save('sq-map', id); window.__idleSim = null;
  const map = MAP_BY_ID[id];
  if (loadedMapId !== id) {
    mapLoading = true; $('start').disabled = true; $('loadtext').textContent = `Loading ${map.name}…`;
    try { await renderer.loadMap(map); loadedMapId = id; renderer.reset(); } finally { mapLoading = false; $('start').disabled = false; $('loadtext').textContent = ''; }
  }
  buildMaps(); $('tagline').textContent = `${map.name}: ${map.blurb}`; window.__idleSim = null;
}
$('hard').onchange = (e) => { hardOn = e.target.checked; };
$('endless').onchange = (e) => { endlessOn = e.target.checked; };

// ---- ranked: paid tickets, recovery and the holder-style panel ----
const SIM_ID = import.meta.env.VITE_SIM;
let rankedWeek = null, rankedRun = null, rankedRec = null, rankedBusy = false;
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
  else if (live) button(live.sim === SIM_ID ? 'Resume your ranked run' : 'Game updated: request your refund', () => recoverRankedRun());
  if (readRanked('sq-ranked-payment')) button('Check payment', () => rankedAction(() => recoverPayment(BASE, rankedMessage)));
  if (!live && rankedWeek) for (const e of readRanked('sq-ranked-entries', []).filter((e) => e.week === rankedWeek.week)) button(`Entry ${e.id} ready · Start`, () => startRankedEntry(e));
  if (rankedWeek) {
    $('rankedweek').textContent = `This week: ${MAP_BY_ID[rankedWeek.map]?.name || rankedWeek.map}`;
    $('rankedpool').textContent = `${rankedWeek.entries} entries · ${rankedWeek.poolDmt} DMT pool. ` + rankedWeek.payouts.map((p, i) => `${['1st', '2nd', '3rd', '4th', '5th'][i] || `${i + 1}th`}: ${Number((rankedWeek.poolDmt * p).toFixed(3))} DMT`).join(' · ');
    const list = document.createElement('ol');
    for (const r of rankedWeek.rows) {
      const li = document.createElement('li');
      li.textContent = `${r.name || 'Adventurer'} · ${short(r.wallet)} · ${fmtT(r.t)} · ${r.kills} kills${r.won ? ' · ★ Winner' : ''}`;
      list.appendChild(li);
    }
    $('rankedstandings').replaceChildren(list);
    if (!list.children.length) $('rankedstandings').textContent = 'No runs yet this week.';
    rankedTime();
  }
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
  catch { $('rankedbtn').classList.add('hidden'); }
}
async function openRanked() {
  $('ranked').classList.remove('hidden'); renderRanked(); $('rankedclose').focus(); await refreshRanked();
}
$('rankedbtn').onclick = openRanked;
$('rankedupdate').onclick = () => $('updatebtn').click();
$('rankedclose').onclick = () => { $('ranked').classList.add('hidden'); $('rankedbtn').focus(); };
$('ranked').addEventListener('click', (e) => { if (e.target.id === 'ranked') $('rankedclose').click(); });
$('ranked').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const nodes = [...$('ranked').querySelectorAll('button:not(:disabled), input, select, a')].filter((n) => n.offsetParent !== null);
  if (e.shiftKey && document.activeElement === nodes[0]) { nodes.at(-1).focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { nodes[0].focus(); e.preventDefault(); }
});
async function rankedAction(fn) {
  if (rankedBusy) return;
  rankedBusy = true; renderRanked();
  for (const b of $('rankedwallets').querySelectorAll('button')) b.disabled = true;
  try { await fn(); }
  catch (e) { rankedMessage(e.refund ? e.message : why(e)); if (e.status === 409) { $('updatebtn').classList.remove('hidden'); $('rankedupdate').classList.remove('hidden'); } }
  finally { rankedBusy = false; $('rankedwallets').replaceChildren(); renderRanked(); }
}
$('rankedenter').onclick = () => {
  const ws = wallets(), wrap = $('rankedwallets'); wrap.replaceChildren();
  if (!ws.length) {
    rankedMessage('Open the game in your wallet app’s browser.');
    for (const [name, href] of walletAppLinks()) { const a = document.createElement('a'); a.className = 'btnlink'; a.textContent = name; a.href = href; a.rel = 'noopener'; wrap.appendChild(a); }
    return;
  }
  rankedMessage('Pick a wallet for this week.');
  for (const w of ws) { const b = document.createElement('button'); b.textContent = w.name; b.onclick = () => rankedAction(() => payEntry(w, BASE, rankedMessage)); wrap.appendChild(b); }
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
    const live = { run: d.run, adv, seed: d.seed, map: d.map, sim: SIM_ID, name: $('rankedname').value.trim().slice(0, 16) || 'Adventurer', log: new RunRecorder().log() };
    writeRanked('sq-ranked-live', live);
    writeRanked('sq-ranked-entries', readRanked('sq-ranked-entries', []).filter((e) => e.id !== entry.id));
    await startRun(live);
  });
}
async function recoverRankedRun() {
  await rankedAction(async () => {
    const live = rankedLive(); if (!live) return;
    if (live.sim !== SIM_ID) {
      rankedMessage('The game changed during your run. Requesting your refund…');
      try {
        await rankedApi(BASE, 'void', { run: live.run });
        localStorage.removeItem('sq-ranked-live');
        rankedMessage('Your 0.5 DMT will be sent back.');
      } catch (e) {
        if (e.status) localStorage.removeItem('sq-ranked-live');
        throw e;
      }
    } else await startRun(live);
  });
}
async function submitRanked() {
  if (rankedBusy) return;
  const saved = readRanked('sq-ranked-submit') || rankedLive(); if (!saved) return;
  const body = { run: saved.run, name: saved.name, log: saved.log };
  writeRanked('sq-ranked-submit', body);
  rankedBusy = true; renderRanked(); $('rankedretry').classList.add('hidden');
  $('rankedresult').textContent = 'Checking your ranked run…'; rankedMessage('Checking your ranked run…');
  try {
    const d = await rankedApi(BASE, 'submit', body);
    const message = d.rank ? `Ranked run accepted. You are #${d.rank} this week.` : 'Ranked run accepted.';
    if (lastRun && lastRun.ranked && d.rank) lastRun.rank = d.rank; // for Share on X
    $('rankedresult').textContent = message; rankedMessage(message);
    localStorage.removeItem('sq-ranked-submit'); localStorage.removeItem('sq-ranked-live');
    rankedRun = null; rankedRec = null;
  } catch (e) {
    if (e.status) { localStorage.removeItem('sq-ranked-submit'); localStorage.removeItem('sq-ranked-live'); rankedRun = null; rankedRec = null; }
    else $('rankedretry').classList.remove('hidden');
    const text = e.status ? e.message : 'Could not reach ranked. Your run is saved: retry within half an hour of finishing.';
    $('rankedresult').textContent = text; rankedMessage(text);
  } finally { rankedBusy = false; renderRanked(); }
}
$('rankedretry').onclick = submitRanked;

// ---- skills shop ----------------------------------------------------------------------------------------------------
function buildSkills() {
  const lv = getSkills(), coins = getCoins();
  $('coins2').textContent = coins;
  $('skillgrid').innerHTML = SKILL_IDS.map((id) => {
    const s = SKILLS[id], l = lv[id] || 0, max = l >= SKILL_MAX, cost = skillCost(l);
    return `<div class="skill"><img src="${BASE}assets/ui/skills/${s.icon}.png" alt=""><h4>${s.name}</h4><div class="pips">${'■'.repeat(l)}${'□'.repeat(SKILL_MAX - l)}</div><p style="grid-column:1/-1">${s.blurb}</p><button data-id="${id}" ${max || coins < cost ? 'disabled' : ''}>${max ? 'Maxed' : `Train · ${cost} coins`}</button></div>`;
  }).join('');
  for (const b of $('skillgrid').querySelectorAll('button')) b.onclick = () => {
    const id = b.dataset.id, l = getSkills()[id] || 0, cost = skillCost(l);
    if (l >= SKILL_MAX || getCoins() < cost) return;
    const sk = getSkills(); sk[id] = l + 1; save('sq-skills', sk); save('sq-coins', getCoins() - cost); showBest(); buildSkills();
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
function buildGear() {
  const gear = getGear(), bank = getBank(), lvs = getGearLv(), coins = getCoins();
  $('gearslots').innerHTML = GEAR_SLOTS.map((sl) => `<div class="gslot${sl === gearSlotSel ? ' sel' : ''}" data-slot="${sl}">${gear[sl] ? imgTag(gear[sl]) : '<span class="empty"></span>'}<small>${GEAR_SLOT_NAMES[sl]}</small></div>`).join('');
  for (const el of $('gearslots').children) el.onclick = () => { gearSlotSel = el.dataset.slot; buildGear(); };
  const mine = bank.filter((n) => GEAR[n] && GEAR[n].slot === gearSlotSel).sort((a, b) => GEAR[a].tier - GEAR[b].tier);
  $('gearbank').innerHTML = mine.length
    ? mine.map((n) => { const lv = lvs[n] || 0, cost = gearUpgradeCost(n, lv), m = 1 + 0.25 * lv, b = Object.fromEntries(Object.entries(GEAR[n].bonus).map(([k, v]) => [k, v * m]));
      return `<div class="gitem${gear[gearSlotSel] === n ? ' on' : ''}" data-n="${n}" title="${n}">${imgTag(n)}<div><b>${n}${lv ? ` +${lv}` : ''}</b><span>${bonusText(b)}${GEAR[n].set && GEAR_SETS[GEAR[n].set] ? ` · ${GEAR[n].set} set` : ''}</span>
        <button class="gup ghost" data-n="${n}" ${lv >= GEAR_MAX_LV || coins < cost ? 'disabled' : ''}>${lv >= GEAR_MAX_LV ? 'Fully reinforced' : `Reinforce +${lv + 1} · ${cost} coins`}</button></div></div>`; }).join('')
    : `<p class="gempty">Nothing for this slot yet. Reward caskets drop from bosses, and now and then from anything you slay. Quests pay out gear too.</p>`;
  for (const b of $('gearbank').querySelectorAll('.gup')) b.onclick = (e) => {
    e.stopPropagation(); const n = b.dataset.n, l = getGearLv(), lv = l[n] || 0, cost = gearUpgradeCost(n, lv);
    if (lv >= GEAR_MAX_LV || getCoins() < cost) return;
    l[n] = lv + 1; save('sq-gearlv', l); save('sq-coins', getCoins() - cost); showBest(); buildGear();
  };
  for (const el of $('gearbank').querySelectorAll('.gitem')) el.onclick = () => {
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
  { id: 'view', name: 'Draw distance', opts: [['near', 'Near'], ['normal', 'Normal'], ['far', 'Far']] },
  { id: 'water', name: 'Water reflections', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'foliage', name: 'Grass and flowers', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'rain', name: 'Rain', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'roofs', name: 'Roofs', opts: [['off', 'Off'], ['auto', 'On, lift when inside']] },
  { head: 'Game' },
  { id: 'fx', name: 'Effects', opts: [['full', 'Full'], ['reduced', 'Reduced']] },
  { id: 'numbers', name: 'Damage numbers', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'shake', name: 'Screen shake', opts: [[true, 'On'], [false, 'Off']] },
  { id: 'sound', name: 'Sound and music', opts: [[true, 'On'], [false, 'Off']] },
];function buildSettings() {
  const cur = { ...renderer.getSettings(), sound: !audio.muted };
  $('setlist').innerHTML = SETTINGS.map((o) => o.head ? `<h3 class="sethead">${o.head}</h3>` : `<div class="setrow"><span>${o.name}</span><div class="seg">${o.opts.map(([v, label]) => `<button class="${cur[o.id] === v ? 'on' : 'ghost'}" data-id="${o.id}" data-v='${JSON.stringify(v)}'>${label}</button>`).join('')}</div></div>`).join('');
  for (const b of $('setlist').querySelectorAll('button')) b.onclick = () => {
    const id = b.dataset.id, v = JSON.parse(b.dataset.v);
    if (id === 'sound') audio.setMuted(!v); else renderer.applySettings({ [id]: v });
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
for (const b of document.querySelectorAll('#more .morelist button')) b.addEventListener('click', () => $('more').classList.add('hidden'), true);
$('updbtn').onclick = () => {
  $('updlist').innerHTML = CHANGELOG.map((u) => `<div class="upd"><div class="updhead"><b>${u.title}</b><span>${u.date} · v${u.version}</span></div><ul>${u.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('');
  $('updates').classList.remove('hidden'); save('sq-seen', LATEST); $('updnew').classList.add('hidden'); $('morenew').classList.add('hidden');
};
$('updclose').onclick = () => $('updates').classList.add('hidden');
$('updates').addEventListener('click', (e) => { if (e.target.id === 'updates') $('updates').classList.add('hidden'); });

// ---- version, leaderboard and bug reports ------------------------------------------------------------------------------
$('version').textContent = 'v' + LATEST;
const recentErrors = [];
addEventListener('error', (e) => { recentErrors.push(String(e.message || e).slice(0, 300)); if (recentErrors.length > 8) recentErrors.shift(); });
addEventListener('unhandledrejection', (e) => { recentErrors.push(String(e.reason && e.reason.message || e.reason).slice(0, 300)); if (recentErrors.length > 8) recentErrors.shift(); });
const ADV_NAME = (id) => (ADVENTURER_BY_ID[id] || {}).name || id;
let lbMap = null;
async function showBoard(mapId) {
  lbMap = mapId || lbMap || selMap;
  $('lbtabs').innerHTML = MAPS.map((m) => `<button class="${m.id === lbMap ? 'on' : 'ghost'}" data-id="${m.id}">${m.name}</button>`).join('');
  for (const b of $('lbtabs').children) b.onclick = () => showBoard(b.dataset.id);
  $('lblist').innerHTML = '<p class="dim">Loading…</p>';
  try {
    const r = await fetch(`${BASE}api/scores?map=${encodeURIComponent(lbMap)}`);
    if (r.status === 503) { $('lblist').innerHTML = '<p class="dim">The shared leaderboard opens soon. Your best run: ' + localBest() + '</p>'; return; }
    const d = await r.json(); const rows = d.rows || []; const myName = load('sq-name', ''); // your own runs stand out
    $('lblist').innerHTML = rows.length ? `<table><tr><th>#</th><th>Name</th><th>Adventurer</th><th>Time</th><th>Level</th><th>Slain</th></tr>${rows.map((x, i) => `<tr class="${x.won ? 'won' : ''}${myName && x.name === myName ? ' me' : ''}"><td>${i + 1}</td><td>${esc(x.name)}${x.holder ? ' <span class="dmtb">DMT</span>' : ''}${x.hard ? ' <em>hard</em>' : ''}</td><td>${esc(ADV_NAME(x.adv))}</td><td>${fmtT(x.t)}${x.won ? ' ✔' : ''}</td><td>${x.level}</td><td>${x.kills}</td></tr>`).join('')}</table>` : '<p class="dim">No runs yet. Be the first.</p>';
  } catch (e) { $('lblist').innerHTML = '<p class="dim">Could not reach the leaderboard.</p>'; }
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const localBest = () => { const b = load('sq-best', null); return b ? `${fmtT(Number(b.t) || 0)}, level ${Number(b.level) || 0}, ${Number(b.kills) || 0} slain` : 'none yet'; };
$('lbbtn').onclick = () => { $('board').classList.remove('hidden'); showBoard(selMap); };
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
  const text = lastRun.ranked && lastRun.rank ? `I'm #${lastRun.rank} in this week's SankoQuest Survivors ranked on ${m} (${stats}). Top 3 split the $DMT pot. Can you knock me off?`
    : lastRun.won ? `I cleared ${m} in SankoQuest Survivors in ${fmtT(lastRun.t)} (level ${lastRun.level}, ${lastRun.kills} monsters slain). Can you beat it?`
    : `I survived ${fmtT(lastRun.t)} in ${m} in SankoQuest Survivors (level ${lastRun.level}, ${lastRun.kills} monsters slain). Can you last longer?`;
  const url = location.origin + '/';
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
};
// ---- DMT holder perks ----
const DMT_PERKS = '<ul class="dmtperks"><li>A gold-and-teal DMT aura around your adventurer</li><li>+25% coins after every run</li><li>A DMT badge next to your name on the leaderboard</li></ul>';
function applyDmt() { const p = savedPass(); if (renderer) renderer.setAura(!!p); $('dmtchip').classList.toggle('hidden', !p); }
function renderDmt() {
  const pass = savedPass(), body = $('dmtbody');
  if (pass) {
    body.innerHTML = `<p class="dmtok">Verified holder: ${esc(pass.balance)} DMT in ${esc(short(pass.address))}</p>${DMT_PERKS}<p class="dim">Perks are on until ${new Date(pass.exp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Check again any time.</p><div class="lurow"><button id="dmtagain">Check again</button><button id="dmtforget" class="ghost">Forget this wallet</button></div>`;
    $('dmtagain').onclick = () => connectDmt(); $('dmtforget').onclick = () => { forget(); applyDmt(); $('dmtmsg').textContent = 'Forgotten. Perks are off.'; renderDmt(); };
    return;
  }
  const ws = wallets();
  body.innerHTML = `<p>Hold DMT on Arbitrum? Connect your wallet and sign a free message: no transaction, no gas, nothing leaves your wallet.</p>${DMT_PERKS}`
    + (ws.length ? `<div class="dmtwallets">${ws.map((w, i) => `<button data-w="${i}">${w.icon ? `<img src="${esc(w.icon)}" alt="">` : ''}Connect ${esc(w.name)}</button>`).join('')}</div>`
      : `<p class="dim">No wallet in this browser. Open the game in your wallet app's browser:</p><div class="dmtwallets">${walletAppLinks().map(([n, u]) => `<a class="btnlink" href="${u}" rel="noopener">${n}</a>`).join('')}</div><p class="dim">On a computer, install a wallet such as MetaMask or Rabby, then come back.</p>`)
    + '<p class="dim">The game only reads your public DMT balance (Arbitrum token 0x8B0E…04e8). A check lasts a day.</p>';
  for (const b of body.querySelectorAll('[data-w]')) b.onclick = () => connectDmt(ws[Number(b.dataset.w)]);
}
async function connectDmt(w) {
  w = w || wallets()[0]; if (!w) { $('dmtmsg').textContent = 'No wallet found in this browser.'; return; }
  for (const b of $('dmtbody').querySelectorAll('button')) b.disabled = true;
  try {
    const r = await prove(w, BASE, (t) => { $('dmtmsg').textContent = t; });
    $('dmtmsg').textContent = r.pass ? 'You hold DMT. Your perks are on!' : `${short(r.address)} holds no DMT on Arbitrum.`;
  } catch (e) { $('dmtmsg').textContent = why(e); }
  applyDmt(); renderDmt();
}
$('dmtbtn').onclick = () => { $('dmtmsg').textContent = ''; renderDmt(); $('dmt').classList.remove('hidden'); };
$('dmtclose').onclick = () => $('dmt').classList.add('hidden');
$('dmt').addEventListener('click', (e) => { if (e.target.id === 'dmt') $('dmt').classList.add('hidden'); });
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
  return T ? { n: T.cell ? T.cells : T.n, blocked: T.blocked, cell: !!T.cell, water: T.water || null, walls: T.walls || null } : null;
}
async function startRun(live = null) {
  if (!live?.run && (rankedLive() || rankedPlaying())) { openRanked(); return; }
  const isRanked = !!live?.run;
  if (isRanked && live.sim !== SIM_ID) return;
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
    const restored = resumeRanked(live.log, { seed: live.seed, mapId: live.map, adv: live.adv, ground: runGround() });
    sim = restored.sim; rankedRec = restored.rec; persistRanked();
    $('updatebtn').classList.add('hidden'); $('rankedupdate').classList.add('hidden'); renderer.setAura(false);
  } else sim = createSim({ seed, map, hard: hardOn, endless: endlessOn, meta: getSkills(), ground: runGround(), players: [{ id: PLAYER, name: 'You', adv: adv.id, weapon: params.get('weapon') || adv.weapon, gear, gearLv: forced ? {} : getGearLv() }] });
  renderer.reset(); renderer.setZoom(1); renderer.setShift(0); renderer.setYaw(0); acc = 0; selCard = 0; slotCache.b = null;
  for (const id of ['title', 'end', 'pause', 'levelup', 'skills', 'gear', 'quests', 'settings', 'updates', 'board', 'bug', 'tip', 'dmt', 'ranked']) $(id).classList.add('hidden');
  $('hud').classList.remove('hidden'); mode = 'play'; shownPending = false;
  $('quit').disabled = isRanked; $('quit').textContent = isRanked ? 'Ranked runs can be paused' : 'Quit run'; pendingUse = null; slowmo = 0; if (isRanked) keys.clear();
  if (isRanked && sim.pending[PLAYER]) showLevelUp();
  const goalText = !isRanked && endlessOn ? '' : `: last ${Math.floor(map.length / 60)}:00 or slay the ${ENEMIES[map.finalBoss].name}`;
  banner(`${isRanked ? 'Ranked ·' : endlessOn ? 'Endless' : 'Survive'} ${map.name}${!isRanked && hardOn ? ' (hard)' : ''}${goalText}`, 4500);
}
let bannerT = 0;
function banner(text, ms = 2500) { const b = $('banner'); b.textContent = text; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), ms); }

function endRun() {
  mode = 'end';
  const wasRanked = !!rankedRun;
  const won = sim.over === 'win';
  const p = sim.players[0];
  const prev = load('sq-best', null);
  if (!prev || sim.t > prev.t || (won && !prev.won)) save('sq-best', { t: Math.round(sim.t), level: sim.level, kills: sim.kills, won });
  let unlockNote = '';
  if (won) {
    const cl = clearedMaps(), before = cl.size; cl.add(sim.map.id); save('sq-cleared', [...cl]);
    const idx = MAPS.findIndex((m) => m.id === sim.map.id), next = sim.map.special ? null : MAPS.slice(idx + 1).find((m) => !m.special);
    if (cl.size > before && next) unlockNote = ` · ${next.name} unlocked`;
    for (const a of ADVENTURERS) if (a.unlock === cl.size && cl.size > before) unlockNote += ` · ${a.name} unlocked`;
  }
  lastRun = { map: sim.map.id, t: Math.floor(sim.t), kills: sim.kills, level: sim.level, adv: sim.players[0].adv, won, hard: !!sim.hard, v: LATEST, sent: false, ticket: runTicket };
  $('lbsubmit').disabled = wasRanked; $('lbmsg').textContent = '';
  $('endlb').classList.toggle('hidden', wasRanked || $('lbbtn').classList.contains('hidden'));
  $('rankedresult').textContent = ''; $('rankedretry').classList.add('hidden');
  if (wasRanked) { lastRun.sent = true; lastRun.ranked = true; }
  if (!wasRanked && load('sq-name', '') && sim.t >= 30) setTimeout(submitScore, 300); // named players send runs of 30 s or more automatically
  const endlessBonus = sim.endless ? Math.floor(Math.max(0, sim.t - sim.map.length) / 10) : 0;
  const dmtOn = !!savedPass(); // DMT holders: +25% coins
  const earned = Math.round((Math.floor(sim.kills / 6) + p.coins * 3 + (won ? 120 : 0) + endlessBonus) * (sim.hard ? 1.25 : 1) * (dmtOn ? 1 + DMT_COIN_BONUS : 1));
  save('sq-coins', getCoins() + earned);
  // caskets opened this run go to the bank
  const worn = sim.players[0].gear || {};
  const lootNotes = sim.loot.map((n) => { const fresh = bankItem(n), on = Object.values(worn).includes(n); return `${imgTag(n)} ${n} <em>${on ? 'now worn' : fresh ? 'new' : 'sold, +25 coins'}</em>`; });
  if (sim.map.forceAdv !== sim.players[0].adv) { const g = getGear(); for (const [slot, n] of Object.entries(worn)) if (getBank().includes(n)) g[slot] = n; save('sq-gear', g); }
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
  const wname = (id) => (WEAPONS[id] ? weaponDisplay(id, p.weapons[id] || 1, p.evo[id]).name : id === 'pumpkin' ? 'Pumpkin bombs' : 'Other');
  const wicon = (id) => (WEAPONS[id] ? iconHTML('weapon', id, p.weapons[id] || 1, p.evo[id]) : imgTag(id === 'pumpkin' ? 'Pumpkin' : 'Gold'));
  $('enddmg').innerHTML = dmgRows.map(([id, v]) => `<div class="drow">${wicon(id)}<span>${wname(id)}</span><div class="dbar"><i style="width:${(v / top) * 100}%"></i></div><b>${Math.round(v).toLocaleString()}</b></div>`).join('');
  $('endloot').innerHTML = (lootNotes.length ? `<div class="lootline"><b>Caskets</b> ${lootNotes.join(' · ')}</div>` : '') + questNotes.map((x) => `<div class="questline">${x}</div>`).join('');
  buildMaps(); buildAdventurers(); showBest();
  $('endtitle').textContent = won ? `${sim.map.name} holds!` : sim.endless && sim.t >= sim.map.length ? `Endless: ${fmtT(sim.t)}` : `You fell in ${sim.map.name}`;
  $('endtext').textContent = `Survived ${fmtT(sim.t)} · level ${sim.level} · ${sim.kills} monsters slain${unlockNote}`;
  $('endcoins').innerHTML = `${imgTag('Gold')} +${earned} coins${dmtOn ? ' <em class="dmtnote">DMT +25%</em>' : ''}`;
  $('end').classList.remove('hidden');
  if (wasRanked) { rankedRun.ended = true; persistRanked(); submitRanked(); }
}
function toMenu() {
  if (rankedPlaying()) return;
  rankedRun = null; rankedRec = null; applyDmt();
  sim = null; mode = 'title'; window.__idleSim = null;
  for (const id of ['end', 'pause', 'levelup', 'hud']) $(id).classList.add('hidden');
  $('hud').classList.add('hidden'); $('title').classList.remove('hidden'); renderer.reset(); renderer.setZoom(0.45); renderer.setShift(2.4);
  buildAdventurers(); buildMaps(); showBest();
}

// ---- input ------------------------------------------------------------------------------------------------------------------
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase(); keys.add(k);
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
  if (k === 'escape') { if (mode === 'play') pause(true); else if (mode === 'pause') pause(false); else for (const id of ['skills', 'gear', 'quests', 'settings', 'updates', 'board', 'bug', 'tip', 'dmt', 'ranked']) $(id).classList.add('hidden'); }
  if ((k === 'enter' || k === ' ') && mode === 'title' && !$('start').disabled && ['skills', 'gear', 'quests', 'settings', 'updates', 'board', 'bug', 'tip', 'dmt', 'ranked'].every((id) => $(id).classList.contains('hidden'))) startRun();
  if ((k === 'enter' || k === ' ') && mode === 'end') startRun();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); if (mode === 'play') pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') pause(true); });
function pause(on) { touch.id = null; touch.x = touch.y = 0; stickEl.classList.add('hidden'); audio.duck(on); mode = on ? 'pause' : 'play'; $('pause').classList.toggle('hidden', !on); }
$('start').onclick = startRun; $('again').onclick = startRun; $('resume').onclick = () => pause(false); $('tomenu').onclick = toMenu;
$('quit').onclick = () => { if (rankedPlaying()) return; pause(false); sim.over = 'dead'; };

// touch: drag anywhere on the field to move (a stick appears under your thumb); the II button pauses
const touch = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
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
  if (BUILD === 'dev' || rankedLive()) return;
  try {
    const r = await fetch('/version.json', { cache: 'no-store' }); if (!r.ok) return;
    const d = await r.json(); if (!rankedLive() && d && d.build && d.build !== BUILD) $('updatebtn').classList.remove('hidden');
  } catch { /* offline */ }
}
$('updatebtn').onclick = async () => {
  if (rankedLive()) return;
  $('updatebtn').textContent = 'Updating…'; $('updatebtn').disabled = true;
  try { const regs = await navigator.serviceWorker?.getRegistrations?.() || []; await Promise.all(regs.map((g) => g.update().catch(() => {}))); } catch { /* no service worker */ }
  try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch { /* no cache storage */ }
  location.reload();
};
checkForUpdate(); setInterval(() => { if (mode === 'title') checkForUpdate(); }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'title') checkForUpdate(); });
// folding or rotating the phone: keep the run going, just re-fit the view
addEventListener('orientationchange', () => setTimeout(() => dispatchEvent(new Event('resize')), 250));
const stickEl = $('stick'), knob = stickEl.firstElementChild, STICK_R = 56;
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
const endTouch = (e) => { if (e.pointerId !== touch.id) return; touch.id = null; touch.x = touch.y = 0; stickEl.classList.add('hidden'); };
addEventListener('pointerup', endTouch); addEventListener('pointercancel', endTouch);
$('pausebtn').onclick = () => { if (mode === 'play') pause(true); };

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
let shownPending = false;
function showLevelUp() {
  if (sim) preloadNextIcons(sim.players.find((q) => q.id === PLAYER));
  const pend = sim.pending[PLAYER]; if (!pend) return;
  shownPending = true; mode = 'levelup'; selCard = 0; audio.duck(true);
  touch.id = null; touch.x = touch.y = 0; stickEl.classList.add('hidden');
  const wrap = $('cards'); wrap.innerHTML = '';
  $('lutitle').textContent = pend.choices.some((c) => c.kind === 'evolve') ? 'Evolution!' : 'Level up!';
  pend.choices.forEach((c, i) => {
    const el = document.createElement('div'); el.className = 'card' + (c.kind === 'evolve' ? ' evo' : ''); el.dataset.i = i;
    let name, tag, text, icon;
    if (c.kind === 'evolve') {
      const e = EVOLUTIONS[c.id]; name = e.name; tag = `EVOLVES ${weaponTitle(c.id, 6).toUpperCase()}`; text = e.blurb; icon = imgTag(e.item, EMOJI[c.id]);
    } else if (c.kind === 'weapon') {
      const w = WEAPONS[c.id]; name = weaponTitle(c.id, c.level); tag = c.level === 1 ? 'NEW' : `Lv ${c.level}`; text = c.level === 1 ? w.blurb : 'Upgrade: ' + w.next(c.level - 1); icon = iconHTML('weapon', c.id, c.level);
      const need = Object.entries(EVOLUTIONS).find(([id]) => id === c.id);
      if (need && c.level === 6) text += ` Evolves with ${PASSIVES[need[1].passive].name}.`;
    } else if (c.kind === 'passive') {
      const p = PASSIVES[c.id]; name = passiveTitle(c.id, c.level); tag = c.level === 1 ? 'NEW' : `Lv ${c.level}`; text = p.blurb; icon = iconHTML('passive', c.id, c.level);
      const ev = Object.entries(EVOLUTIONS).find(([, e]) => e.passive === c.id);
      if (ev) text += ` Evolves ${weaponTitle(ev[0], 6)}.`;
    } else { name = 'Cooked Bubba Bass'; tag = 'Heal'; text = 'Restore 40 health.'; icon = iconHTML('item', 'Cooked Bubba Bass'); }
    el.innerHTML = `${icon}<h3>${name}</h3><div class="tier">${tag}</div><p>${text}</p><div class="key">[${i + 1}]</div>`;
    el.onclick = () => pick(i); wrap.appendChild(el);
  });
  const me = sim.players.find((q) => q.id === PLAYER);
  $('reroll').innerHTML = `Reroll<span class="key"> (R)</span> · ${me ? me.rerolls : 0} left`; $('reroll').disabled = !me || me.rerolls <= 0;
  markCard(); $('levelup').classList.remove('hidden');
}
function doReroll() { if (sim && (rankedRec ? rankedChoice(sim, rankedRec, 'r') : reroll(sim, PLAYER))) { shownPending = false; showLevelUp(); if (rankedRec) persistRanked(); } }
function doSkip() { if (sim && (rankedRec ? rankedChoice(sim, rankedRec, 's') : skipLevel(sim, PLAYER))) { audio.duck(false); shownPending = false; mode = 'play'; $('levelup').classList.add('hidden'); if (rankedRec) persistRanked(); } }
$('reroll').onclick = doReroll; $('skiplv').onclick = doSkip;
function markCard() { [...$('cards').children].forEach((el, i) => el.classList.toggle('sel', i === selCard)); }
function pick(i) {
  if (!sim.pending[PLAYER]) return;
  if (rankedRec) { if (!rankedChoice(sim, rankedRec, i)) return; persistRanked(); } else choose(sim, PLAYER, i); audio.duck(false); shownPending = false; mode = 'play'; $('levelup').classList.add('hidden');
}

// ---- HUD -----------------------------------------------------------------------------------------------------------------------------
let hudT = 0; const slotCache = { w: '', p: '', b: '' };
function updateHud(view) {
  const me = view.players[0];
  $('hpfill').style.width = Math.min(100, Math.max(0, (me.hp / me.mhp) * 100)) + '%';
  $('hptext').textContent = `${me.hp} / ${me.mhp}`;
  $('xpfill').style.width = Math.min(100, (view.xp / view.xpNeed) * 100) + '%';
  $('lvl').textContent = 'Lv ' + view.level;
  const t = Math.floor(view.t); $('clock').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  const goal = sim && !sim.endless && sim.map.length ? sim.map.length : 0; $('clockgoal').textContent = goal ? `of ${Math.floor(goal / 60)}:${String(goal % 60).padStart(2, '0')}` : '';
  $('kills').textContent = view.kills;
  const boss = view.enemies.find((e) => ENEMIES[e[1]].boss);
  $('bossbar').classList.toggle('hidden', !boss);
  if (boss) { $('bossname').textContent = ENEMIES[boss[1]].name; $('bossfill').style.width = boss[5] + '%'; }
  const bk = JSON.stringify(me.belt || []);
  if (bk !== slotCache.b) {
    slotCache.b = bk; const BELT_ICON = { beer: 'Tin of Beer', pumpkin: 'Pumpkin', warp: 'Warp Shard' };
    $('belt').innerHTML = Array.from({ length: BELT_SIZE }, (_, i) => { const k = (me.belt || [])[i]; return `<div class="bslot${k ? '' : ' empty'}" data-i="${i}">${k ? imgTag(BELT_ICON[k]) : ''}<small>${i + 1}</small></div>`; }).join('');
    for (const el of $('belt').children) el.onclick = () => { pendingUse = Number(el.dataset.i); };
  }
  const wk = JSON.stringify([me.w, me.evo]), pk = JSON.stringify(me.ps);
  if (wk !== slotCache.w) { slotCache.w = wk; $('wrow').innerHTML = Object.entries(me.w).map(([id, l]) => `<div class="slot${me.evo[id] ? ' evo' : ''}" title="${weaponDisplay(id, l, me.evo[id]).name}">${iconHTML('weapon', id, l, me.evo[id])}<small>${me.evo[id] ? '★' : l}</small></div>`).join(''); }
  if (pk !== slotCache.p) { slotCache.p = pk; $('prow').innerHTML = Object.entries(me.ps).map(([id, l]) => `<div class="slot" title="${passiveTitle(id, l)}">${iconHTML('passive', id, l)}<small>${l}</small></div>`).join(''); }
  for (const f of view.fx) {
    if (f.k === 'boss') banner(sim && !sim.endless && f.type === sim.map.finalBoss && sim.bossIndex >= sim.map.bosses.length ? `${ENEMIES[f.type].name} approaches! Slay it to win the run.` : `${ENEMIES[f.type].name} approaches!`, 3500);
    else if (f.k === 'down') banner('You have fallen…', 3000);
    else if (f.k === 'evolve') banner(`${EVOLUTIONS[f.id].name}!`, 3000);
    else if (f.k === 'use' && f.kind === 'beer') banner('Tin of Beer: speed up!', 1400);
    else if (f.k === 'use' && f.kind === 'pumpkin') banner('Pumpkin bomb!', 1200);
    else if (f.k === 'use' && f.kind === 'warp') banner('Warp Shard: everything comes to you', 1600);
    else if (f.k === 'get' && f.kind === 'chest') banner('Chest!', 1000);
    else if (f.k === 'event') banner(f.kind === 'treasure' ? 'A treasure goblin! Catch it before it gets away' : f.kind === 'swarm' ? 'Swarm!' : f.kind === 'warband' ? `A goblin warband charges from the ${f.dir}!` : f.kind === 'rising' ? 'The dead rise around you!' : f.kind === 'blizzard' ? 'Blizzard! The snow slows you down' : f.kind === 'duel' ? 'A champion of the Fighting Forum challenges you!' : f.kind === 'stampede' ? `Chicken stampede from the ${f.dir}!` : f.kind === 'sandstorm' ? 'Sandstorm! Scorpions in the dust' : f.kind === 'ambush' ? 'Ambush! Things are crawling out of the water' : 'Meteor shower! Watch the ground', 2600);
    else if (f.k === 'treasure') banner('Treasure goblin caught!', 1800);
    else if (f.k === 'region' && sim.t > 1) banner(MAP_BY_ID[f.id].name, 1800);
    else if (f.k === 'escape') banner('The treasure goblin got away', 1600);
    else if (f.k === 'casket') { toast(`${imgTag(f.item)} <span>Reward casket${f.worn ? ', now worn' : ''}<br><b>${f.item}</b></span>`); }
  }
}

// ---- menus with a controller or the arrow keys: spatial focus, A/Enter picks, B/Esc goes back -----------------------
const NAV_SCREENS = ['ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests', 'pause', 'end', 'title'];
const NAV_ITEMS = '.aopt:not(.locked), .mopt:not(.locked), button:not([disabled]), .gslot, .gitem, #hardwrap:not(.hidden), #endlesswrap:not(.hidden)';
let navEl = null;
function navScreen() { return NAV_SCREENS.map((id) => $(id)).find((el) => el && !el.classList.contains('hidden')); }
function navItems(scr) { return [...scr.querySelectorAll(NAV_ITEMS)].filter((el) => el.offsetParent !== null && !el.closest('.hidden')); }
function navFocus(el) { if (navEl) navEl.classList.remove('navfocus'); navEl = el; if (el) { el.classList.add('navfocus'); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
function navMove(dir) {
  const scr = navScreen(); if (!scr) return;
  const items = navItems(scr); if (!items.length) return;
  if (!navEl || !scr.contains(navEl) || !items.includes(navEl)) { navFocus(items.find((el) => el.classList.contains('sel')) || (scr.id === 'title' ? $('start') : items[0])); return; }
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
  for (const id of ['ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests']) if (!$(id).classList.contains('hidden')) { $(id).classList.add('hidden'); navFocus(null); return true; }
  if (mode === 'pause') { pause(false); return true; }
  return false;
}
addEventListener('keydown', (e) => {
  if (mode === 'play' || mode === 'levelup') return;
  const k = e.key; const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[k];
  if (dir) { navMove(dir); e.preventDefault(); }
  else if (k === 'Enter' && navEl && navScreen() && navScreen().contains(navEl)) { if (navPress()) { e.stopImmediatePropagation(); e.preventDefault(); } }
}, true);

// ---- minimap: the game's own map art around you, turned with the camera ---------------------------------------------
const mmImg = new Image(); mmImg.src = BASE + 'assets/world/world-map-full.webp';
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
  if (mode !== 'play' && mode !== 'levelup') {
    for (const d of ['up', 'down', 'left', 'right']) if (edges[d]) navMove(d);
    if (edges.b) navBack();
    if (edges.a && navPress()) edges.a = false;
    if (edges.start && mode === 'title' && !$('start').disabled && !navScreen().id.match(/settings|updates|skills|gear|quests|board|bug|tip|dmt|ranked/)) edges.a = true;
  }
  if (mode === 'title' || mode === 'end') {
    if (edges.a && mode === 'title' && !$('start').disabled) startRun(); else if (edges.a && mode === 'end') startRun();
    if (!sim) { // title backdrop: the chosen adventurer standing in the chosen map
      if (frame % 2 === 0) {
        if (!window.__idleSim) { const T = renderer.terrain; window.__idleSim = createSim({ seed: 1, map: MAP_BY_ID[selMap], ground: T ? { n: T.cell ? T.cells : T.n, blocked: T.blocked, cell: !!T.cell, water: T.water || null, walls: T.walls || null } : null, players: [{ id: PLAYER, name: 'You', adv: runAdv().id, gear: runAdv().id !== selAdv ? {} : getGear() }] }); }
        const v = snapshot(window.__idleSim); v.players[0].f = Math.sin(performance.now() / 3000) * 0.5;
        if (!params.has('qa')) renderer.setYaw(renderer.getYaw() + 0.0045); // the camera drifts slowly round the title scene
        renderer.update(v, 0.033, PLAYER);
      }
      return;
    }
  }
  if (!sim) return;
  if (mode === 'play') {
    if (edges.start) pause(true);
    acc += dt * (slowmo > 0 ? 0.3 : 1); slowmo -= dt; // a moment of slow motion when a boss falls
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
    if (edges.left) { selCard = (selCard + 2) % 3; markCard(); } if (edges.right) { selCard = (selCard + 1) % 3; markCard(); } if (edges.a) pick(selCard);
    if (!rankedRec) step(sim, {}, dt); // ranked choices wait for the player
    if (!sim.pending[PLAYER] && shownPending) { shownPending = false; audio.duck(false); mode = 'play'; $('levelup').classList.add('hidden'); }
  } else if (mode === 'pause') {
    if (edges.start) pause(false);
    if (frame % 4 !== 0) return;
  }
  const view = snapshot(sim, { maxEnemies: 420 });
  if (view.fx.some((f) => f.k === 'die' && f.boss)) slowmo = 0.9;
  audio.onFx(view.fx, mode === 'play' ? view : null, sim.map.world && view.region ? MAP_BY_ID[view.region].music : sim.map.music);
  const flash = renderer.update(view, mode === 'play' || mode === 'levelup' ? dt : 0.001, PLAYER);
  $('hurt').classList.toggle('on', flash > 0.05);
  hudT += dt; if (hudT > 0.08 || view.fx.length) { hudT = 0; updateHud(view); drawMinimap(view); }
}

boot().then(async () => {
  applyDmt(); window.__sqReady = true; await refreshRanked();
  if (rankedLive() || readRanked('sq-ranked-submit') || readRanked('sq-ranked-payment')) {
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
};

if ((params.has('debug') || params.has('qa')) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) Object.defineProperty(window, '__sq', { get: () => rankedRun || rankedLive() ? undefined : qaHooks });
