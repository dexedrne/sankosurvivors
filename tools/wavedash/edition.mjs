// This extracts a separate static edition; the default entry and deployment are untouched.
import assert from 'node:assert/strict';
import * as tr from '../../src/locales/tr.js';
import * as es from '../../src/locales/es.js';
import * as fil from '../../src/locales/fil.js';

function once(source, before, after = '') {
  assert.equal(source.split(before).length, 2, `Expected one edition anchor: ${before.slice(0, 100)}`);
  return source.replace(before, after);
}
function between(source, start, end, replacement = '') {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a && source.indexOf(start, a + 1) < 0, `Missing/duplicate edition anchor: ${start}`);
  return source.slice(0, a) + replacement + source.slice(b);
}
const excluded = ['coop', 'cloudpick', 'wallet', 'ranked', 'dmt', 'tip', 'bug'];

const records = `
$('version').textContent = 'v' + LATEST;
$('version').onclick = () => $('updbtn').click();
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
let runBest = null, passedBest = false, lastRun = null;
function showLocalRecords() {
  $('lbtabs').textContent = '';
  const all = getBests();
  $('lblist').innerHTML = MAPS.flatMap(map => [false, true].flatMap(hard => [false, true].flatMap(endless => {
    const b = profileBest(all[bestKey({ map, hard, endless })]);
    return b ? [\`<p><b>\${esc(map.name)}\${hard ? ' · Hard' : ''}\${endless ? ' · Endless' : ''}</b><br>\${fmtT(b.t)} · level \${b.level} · \${b.kills} slain\${b.won ? ' ✔' : ''}</p>\`] : [];
  }))).join('') || '<p>Best run: none yet</p>';
  $('board').classList.remove('hidden');
}
$('lbbtn').onclick = showLocalRecords;
$('lbclose').onclick = () => $('board').classList.add('hidden');
$('board').addEventListener('click', e => { if (e.target.id === 'board') $('board').classList.add('hidden'); });
`;
const progress = `
let reloadTimer = 0, runStarting = false, importAttempt = null, titleProgressPending = false;
const canManuallyReload = () => mode === 'title' && !runStarting;
const progressCanLoad = () => canManuallyReload() && !!renderer && !mapLoading && !$('start').disabled;
function cancelPendingLoads() {
  clearTimeout(reloadTimer); reloadTimer = 0;
  if (importAttempt) { importAttempt = null; $('xferload').disabled = false; }
}
`;
const reload = `
function queuePageReload(text, delay) {
  if (!progressCanLoad()) return;
  refreshTitleProgress();
  clearTimeout(reloadTimer); banner(text, 3000);
  reloadTimer = setTimeout(() => { reloadTimer = 0; if (progressCanLoad()) location.reload(); }, delay);
}
`;

export function transformMain(source) {
  let s = source;
  for (const file of ['coop-client', 'ranked', 'ranked-play', 'ranked-client', 'ranked-clock', 'ranked-clock-client', 'prize-display', 'config', 'dmt', 'cloud', 'swap', 'wallet-connect', 'wallet', 'bun-companions']) {
    const re = new RegExp(`^import .+ from './${file}\\.js';\\n`, 'm');
    assert.ok(re.test(s), `Expected import ${file}`); s = s.replace(re, '');
  }
  s = between(s, 'const noPrize =', 'import { TRANSFER_KEYS');
  s = between(s, 'const walletHandoff =', 'const BASE =', "initI18n();\nconst wavedashLoader = createWavedashLoader();\n");
  s = "import { createWavedashLoader } from './wavedash.js';\nimport { betterRun } from './personal-record.js';\n" + s;
  s = between(s, '// ---- co-op lobby:', '// ---- solo and ranked startup');
  s = between(s, '// ---- ranked: paid tickets', '// ---- skills');
  s = once(s, "  const original = $('guideoldrecipes'); if (original) original.innerHTML = guideRecipes(1);\n");
  s = between(s, '// ---- version, leaderboard', '// ---- DMT holder perks', records);
  s = between(s, '// ---- DMT holder perks', '// ---- cloud save');
  s = between(s, '// ---- cloud save', 'function syncTitleProgress()', progress);
  s = once(s, 'const petPreference = value => petChoice(value) || bunChoice(value);', 'const petPreference = petChoice;');
  s = between(s, '// BUN authority stays in memory;', 'function buildPets()', 'function currentPetChoice() { return petChoice(selectedPet); }\n');
  s = between(s, '  // BUN picker:', '  // End BUN picker.');
  s = once(s, '    if (bunChoice(selectedPet)) bunCompanions.refresh(); else applyPetChoice();', '    applyPetChoice();');
  s = once(s, "  if (bunChoice(selectedPet) && !currentPetChoice()) $('petloadtext').textContent = 'BUN ownership must be verified before this companion can appear.';\n");
  s = once(s, "$('petbunrefresh').onclick = () => bunCompanions.refresh();\n");
  s = once(s, '  if (!document.hidden) bunCompanions.sync(!!bunChoice(selectedPet));\n');
  s = once(s, ' && (!sim.coop || !!coop?.run && !coop.run.held && !coop.run.closed)');
  s = between(s, 'function queuePageReload(', '// ---- quests', reload);
  s = once(s, '  syncTitleNames();\n');
  s = once(s, 'async function startRun(live = null)', 'async function startRun()');
  s = between(s, '  if (!live?.run', '    preloadIcons(', `  if (titleProgressPending) syncTitleProgress();
  cancelPendingLoads(); runStarting = true;
  try {
    if (mode === 'recovery') return;
`);
  s = once(s, 'let runTicket = null;\n');
  s = between(s, 'function loadCasualTickets(session) {', 'function runGround() {');
  s = once(s, "    if (!isRanked) { casualRun = { sim, baseline: null, normalCommitted: false, phase: 'playing' }; loadCasualTickets(casualRun); }", "    casualRun = { sim, baseline: null, normalCommitted: false, phase: 'playing' };");
  s = between(s, '    // Website submission;', '    // End website submission.');
  s = once(s, '    runTicket = session.endlessTicket || null;\n');
  s = once(s, 'MAP_BY_ID[isRanked ? live.map : selMap]', 'MAP_BY_ID[selMap]');
  s = once(s, 'isRanked || forced ? {} : getGear()', 'forced ? {} : getGear()');
  s = between(s, '    if (isRanked) {\n      const restored', '    } else sim = createSim');
  s = once(s, '    } else sim = createSim', '    sim = createSim');
  s = between(s, "    $('quit').disabled = isRanked;", '    const goalText', `    $('quit').disabled = false; $('quit').textContent = 'Quit run'; pendingUse = null; slowmo = 0;
    runBest = profileBest(getBests()[bestKey(sim)]); passedBest = false;
`);
  s = once(s, "isRanked && sim.endless ? `: endless, scored by ${kpmWeek(liveRace(live).week) ? 'kills + seconds survived' : 'time survived'}. The hunt is over at ${fmtT(sim.endAt)}` : !isRanked && endlessOn ? ''", "endlessOn ? ''");
  s = once(s, "${isRanked ? `Ranked ·${sim.hard ? ' Hard ·' : ''}` : endlessOn ? 'Endless' : 'Survive'}", "${endlessOn ? 'Endless' : 'Survive'}");
  s = once(s, '${!isRanked && hardOn', '${hardOn');
  s = once(s, ', dmtOn = !!savedPass();', ';');
  s = s.replaceAll(' * (dmtOn ? 1 + DMT_COIN_BONUS : 1)', '');
  s = once(s, '  const wasRanked = !!rankedRun;\n');
  s = once(s, '  const cutoff = !!rankedRun?.cutoff;\n');
  s = once(s, "cutoff ? 'The ranked week has ended. Your earned score is being checked.' : ");
  s = once(s, ', sent: !!sim.coop, ticket: sim.coop ? null : runTicket, coop: !!sim.coop', '');
  s = between(s, "  $('lbsubmit').disabled = wasRanked || !!sim.coop;", '  const dmtOn =', "  $('again').textContent = 'Run it back';\n");
  s = once(s, '  const dmtOn = !!savedPass(), alchCoins', '  const alchCoins');
  s = once(s, 'let receipt = null, rankedSaved = !wasRanked, submitted = false;', 'let receipt = null;');
  s = between(s, '    if (!rankedSaved) {', '    receipt ||=');
  s = once(s, '{ earned, ranked: wasRanked, coop: !!sim.coop, playerId: PLAYER, result: coopResult, baseline: sim.endless ? session?.baseline : null }', '{ earned, baseline: sim.endless ? session?.baseline : null }');
  s = between(s, '    const kpmNote =', "    let bestNote = '';");
  s = once(s, '    if (!wasRanked && !sim.coop) {', '    {');
  s = once(s, '${kpmNote}', '');
  s = once(s, "${dmtOn ? ' <em class=\"dmtnote\">DMT +25%</em>' : ''}", '');
  s = once(s, '    cloud.push(true);\n');
  s = once(s, '  rankedRun = null; rankedRec = null; applyDmt();\n');
  s = once(s, '  rankedClock = null;\n');
  s = once(s, '  enforceRankedDeadline();\n');
  s = once(s, '  syncRankedClock();\n');
  s = once(s, "const MENU_SCREENS = ['coop', 'cloudpick', 'wallet', 'ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests', 'guide', 'pets', 'more', 'upgrades'];", "const MENU_SCREENS = ['board', 'settings', 'updates', 'skills', 'gear', 'quests', 'guide', 'pets', 'more', 'upgrades'];");
  s = once(s, "$('again').onclick = () => { if (lastRun?.coop) { toMenu(); openCoop(); } else if (lastRun && lastRun.ranked) { toMenu(); openRanked(); } else startRun(); };", "$('again').onclick = startRun;");
  s = between(s, "addEventListener('blur', () => { keys.clear(); clearTouch();", "$('start').onclick", `let resumeMode = 'play', focusLostWhileStarting = false;
function suspendPage() {
  keys.clear(); clearTouch();
  if (runStarting) focusLostWhileStarting = true;
  if (['play', 'levelup', 'casket'].includes(mode)) pause(true);
}
addEventListener('blur', suspendPage);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspendPage(); });
function pause(on) {
  clearTouch(); keys.clear(); pendingUse = null; acc = 0;
  if (on && mode !== 'pause') resumeMode = mode;
  mode = on ? 'pause' : ['levelup', 'casket'].includes(resumeMode) ? resumeMode : 'play';
  if (resumeMode === 'levelup' || resumeMode === 'casket') $(resumeMode).classList.toggle('hidden', on);
  if (!on) focusLostWhileStarting = false;
  audio.duck(on || mode === 'levelup' || mode === 'casket'); $('pause').classList.toggle('hidden', !on);
}
`);
  s = once(s, 'cancelPendingLoads(); runStarting = true;', 'cancelPendingLoads(); runStarting = true; focusLostWhileStarting = false;');
  s = once(s, '  } finally { runStarting = false; }', '    if (focusLostWhileStarting || document.hidden || !document.hasFocus()) suspendPage();\n  } finally { runStarting = false; }');
  s = once(s, 'function loop(ts) {\n  requestAnimationFrame(loop);', 'function loop(ts) {\n  requestAnimationFrame(loop);\n  if ((document.hidden || !document.hasFocus()) && sim) { suspendPage(); last = ts; acc = 0; return; }');
  s = between(s, '// ---- installable app (PWA)', '// folding or rotating');
  s = once(s, "    $('cooppause').classList.add('hidden'); $('coopwait').classList.add('hidden');\n");
  s = once(s, "  PLAYER = 'p1'; $('coop').classList.add('hidden'); $('coopwait').classList.add('hidden');", "  PLAYER = 'p1';");
  s = once(s, "const NAV_ITEMS = '#coop input, ", "const NAV_ITEMS = '");
  for (const action of ['r', 's']) s = once(s, `rankedRec ? rankedChoice(sim, rankedRec, '${action}') : `);
  s = s.replaceAll('if (rankedRec) persistRanked();', '');
  s = s.replaceAll('if (rankedRec) { if (!rankedChoice(sim, rankedRec, i)) return; persistRanked(); } else ', '');
  s = once(s, ' + chaseText(t, view.kills)', '');
  s = once(s, "  if (!$('cloudpick').classList.contains('hidden')) return true; // Keep both saves until an explicit choice resolves the prompt.\n");
  s = once(s, "if (id === 'wallet') $('walletclose').click(); else ", '');
  s = between(s, '      if (rankedRec) {', '      } else step(sim,');
  s = once(s, '      } else step(sim,', '      step(sim,');
  s = once(s, "boot().then(async () => {", "boot().then(async loaded => {");
  s = between(s, '  applyDmt(); await refreshPendingTitleProgress();', '// QA hooks', `  if (!loaded) return;
  await refreshPendingTitleProgress();
  wavedashLoader.ready(); window.__sqReady = true;
});
`);
  s = once(s, '    requestAnimationFrame(loop);', '    requestAnimationFrame(loop);\n    return true;');
  s = once(s, "$('loadfill').style.width = Math.round(v * 100) + '%';", "wavedashLoader.progress(v * .9); $('loadfill').style.width = Math.round(v * 100) + '%';");
  s = s.replace(/\(\) => !buyBusy && !walletConnecting && !holderChecking && !walletRequests && !walletModalOpen\(\)(?: && !rankedBusy)?/g, '() => true');
  s = s.replaceAll('rankedLive()', 'null').replaceAll('rankedPlaying()', 'false').replaceAll('rankedRec', 'null').replaceAll('rankedRun', 'null').replaceAll('walletModalOpen()', 'false');
  s = s.replaceAll(' or wallet action', '').replaceAll(' or saving to your wallet', '').replaceAll('wallet action', 'run');
  s = s.replace(/\b(?:sim|s)\??\.coop\b/g, 'false'); // This edition stays solo until its own online-platform proof.
  // Every removed panel must also leave the list of panels hidden when a run starts.
  for (const id of excluded) s = s.replaceAll(`'${id}', `, '').replaceAll(`, '${id}']`, ']');
  assert.doesNotMatch(s, /fetch\(|serviceWorker|caches\.|savedPass|walletNow|createCloud|api\/|TIP_ETH|rankedApi|openRanked|submitScore|bunCompanions|bunChoice|bun-companions/, 'Forbidden network/service in casual entry');
  return s;
}

export function transformRender(source) {
  let s = once(source, "import { createBunModels } from './bun-models.js';\n");
  s = once(s, '  const bunModels = createBunModels(loadGLB, A);\n');
  s = once(s, '    choice: id => petChoice(id) || bunModels.choice(id),', '    choice: petChoice,');
  s = once(s, '      if (bunModels.choice(id)) return bunModels.load(id);\n');
  s = once(s, '      if (bunModels.choice(id)) return bunModels.spawn(proto);\n');
  return s;
}

// Static HTML is trusted source; remove a whole balanced element, never leave hidden paid UI.
function removeElement(source, id) {
  const re = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bid="${id}"[^>]*>`, 'i'), match = re.exec(source);
  assert.ok(match, `Expected HTML element ${id}`);
  if (['input', 'img', 'link', 'meta'].includes(match[1])) return source.slice(0, match.index) + source.slice(match.index + match[0].length);
  const tags = new RegExp(`<(/?)${match[1]}\\b[^>]*>`, 'gi'); tags.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tags.exec(source))) {
    depth += token[1] ? -1 : 1;
    if (!depth) return source.slice(0, match.index) + source.slice(tags.lastIndex);
  }
  throw Error(`Unclosed edition element ${id}`);
}
export function transformHtml(source) {
  let s = source;
  s = s.replace(/^.*(?:rel="manifest"|apple-touch-icon|og:|twitter:|rel="canonical").*\n/gm, '');
  s = s.replaceAll('href="/assets/', 'href="./assets/');
  for (const id of ['coopbtn', 'coopwait', 'cooppause', 'walletchip', 'dmtchip', 'rankedbtn', 'tipwrap', 'updatebtn', 'bugbtn2', 'dmtbtn', 'bugbtn', 'installbtn', 'endlb', 'rankedresult', 'rankedretry', 'sharex', ...excluded.filter(id => id !== 'cloudpick'), 'walletlink', 'cloudpick', 'guide-ranked', 'guide-cloud', 'petbuns']) s = removeElement(s, id);
  s = s.replaceAll('<p class="rankedpause dim hidden" role="timer" aria-live="off"></p>', '');
  s = s.replace(/<p class="rankedmovement dim">[^<]*<\/p>/g, '<p class="dim">Tumble with Space, controller A, or the Tumble button. Cross reachable low fences; buildings stay solid.</p>');
  s = s.replaceAll('Submit score &amp; continue as Endless', 'Continue as Endless').replaceAll('Continue without confirmed score', 'Continue as Endless');
  s = s.replaceAll('Leaderboard', 'Best run').replaceAll('before playing or saving to your wallet.', 'before playing.').replaceAll(' Ranked ignores both.', '');
  return s;
}

export function assertCasualBundle(text, files) {
  assert.doesNotMatch(text, /walletconnect|reown|kyberswap|api\/(?:ranked|run|score|player|report|dmt)|ethereum:|d22a7b277a3923fe996af92b3a13386c|serviceWorker\.register|caches\.delete|b85ff44289b768ecff58fead92f815b642e3cbb2|pet-metadata\.sanko|bun-companions|bun-models|BUN ownership|sanko\/(?:buns|pets)\//i, 'Forbidden integration in casual build');
  for (const file of files) assert.ok((file === 'index.html' || file === 'licenses/run-escape.txt' || /^(assets|draco)\//.test(file)) && !file.split('/').some(part => part.startsWith('.')) && !file.includes('\\') && !/^assets\/sanko\/(?:buns|pets)\//i.test(file), `Forbidden casual file: ${file}`);
}

const cryptoCopy = /wallet|\bDMT\b|\bETH\b|\bBUN\b|ranked|Arbitrum|Ethereum|signature|crypto|blockchain|prize|Kyber|Reown|sankosurvivors\.quest/i;
const copies = {
  tr: ['İlerleme bu cihazda kaydedilir. Yedek almak veya başka cihazda oynamak için İlerlemeyi taşı seçeneğini kullan.', 'Bu oyunun kaydedildiği henüz doğrulanmadı. Bu sayfayı açık tut, tarayıcıda biraz alan aç ve oynamadan önce yeniden dene.', 'İlerleme kaydı tamamlanamadı. Önceki ilerlemenin yedeği bu cihazda. Oynamadan önce geri yükle.', 'Her beceri kademesi düşman HP/temas hasarını %1.5 artırır. Başlangıçta giyilen her parça iki kademe sayılır; sınır +%75.'],
  es: ['El progreso se guarda en este dispositivo. Usa Mover progreso para guardar una copia o jugar en otro dispositivo.', 'La partida aún no se ha guardado. Mantén esta página abierta, libera espacio del navegador y reintenta antes de jugar.', 'No se pudo completar el guardado. Tu progreso anterior tiene una copia en este dispositivo. Restáuralo antes de jugar.', 'Cada rango de habilidad añade un 1.5% de vida/daño de contacto a los enemigos. Cada pieza equipada al inicio cuenta como dos rangos, hasta +75%.'],
  fil: ['Dito sa device naka-save ang progreso. Gamitin ang Ilipat ang progreso para gumawa ng backup o maglaro sa ibang device.', 'Hindi pa kumpirmadong naka-save ang larong ito. Panatilihing bukas ang pahina, magbakante ng storage sa browser at subukan ulit bago maglaro.', 'Hindi natapos ang pag-save. May backup ng dati mong progreso sa device na ito. Ibalik muna ito bago maglaro.', 'Bawat antas ng kasanayan ay nagdaragdag ng 1.5% sa HP/pinsala sa pagdikit ng kalaban. Bawat gamit na suot sa simula ay katumbas ng dalawang antas, hanggang +75%.'],
};
function localeSource(language) {
  const original = { tr, es, fil }[language];
  const text = Object.fromEntries(Object.entries(original.text).filter(([key]) => !cryptoCopy.test(key)));
  const keys = ['Progress saves on this device. Use Move progress to keep a backup or play on another device.', 'This run has not been confirmed saved. Keep this page open, free some browser storage, then retry before playing.', 'A progress save could not finish. Your previous progress is backed up on this device. Restore it before playing.', 'Each skill rank adds 1.5% enemy HP/contact damage. Each starting gear piece counts as two ranks, up to +75%.'];
  keys.forEach((key, i) => { text[key] = copies[language][i]; });
  const patterns = original.patterns.filter(([key]) => !cryptoCopy.test(key));
  return `export const text=${JSON.stringify(text)}; export const patterns=${JSON.stringify(patterns)};`;
}

export function wavedashEdition() {
  return {
    name: 'sqs-wavedash-edition', enforce: 'pre',
    transformIndexHtml: { order: 'pre', handler: transformHtml },
    transform(code, id) {
      if (id.endsWith('/src/start.js')) return { code: once(once(code, "import { carryGate } from './carry-gate.js';\n"), '  if (!await carryGate()) return;\n'), map: null };
      if (id.endsWith('/src/main.js')) return { code: transformMain(code), map: null };
      if (id.endsWith('/src/render.js')) return { code: transformRender(code), map: null };
      if (id.endsWith('/src/assets.js')) return { code: "export const asset = p => (import.meta.env.BASE_URL || './') + 'assets/' + p; export const assetHost = () => 'local'; export const pickAssetHost = async () => 'local';", map: null };
      if (id.endsWith('/src/changelog.js')) return { code: `export const LATEST='0.44.61-casual.15'; export const CHANGELOG=[{version:'0.44.61-casual.15',date:'8 Nov 2026',title:'Keep your victory going',items:['After a solo casual victory, continue as Endless with the same health, build and world.','Normal rewards stay saved. Endless adds only new rewards; reloading ends the live run.']},{"version": "0.44.59-casual.14", "date": "8 Nov 2026", "title": "Beer boost and original spell shaders", "items": ["Tin of Beer shows the remaining speed boost time beside your health.", "Spell projectiles now run SankoQuest’s original TSL materials, including Missile and Blast glows.", "Spell shards use SankoQuest\u2019s original elemental tints.", "Spell glow now uses the same base colour output at every graphics setting. Optional screen effects still apply.", "Spell trails now follow where each bolt travelled over time, including turns and stops.", "Player and boss spells pause with the run. Impacts keep the same spinning shards from flight to finish.", "Skill purchases, Undo and Refund all now save ranks and coins together.", "A changed refund quote needs confirmation again.", "Delayed holds cannot change skills after you close the menu or start a run.", "Refund all permanent gear reinforcements from Gear. Collected pieces and Smithing unlocks stay yours.", "New reinforcement purchases record their refund value. Older metal upgrades use a clearly marked conservative refund.", "Gear purchases, Smithing and refunds save together and recover safely if browser storage fails.", "Six new quests reward hunting Scorpions, Bandits, Wolves, Slimers, Snowmen and Dragons.", "Eight achievements track map clears, long runs, bosses, evolutions and treasure.", "Milestones unlock after a finished run and stay with your saved progress.", "Local progress keeps your quest and achievement unlocks through reloads and backups.", "Rainstorms and snowstorms can cloud distant views and the minimap. Nearby ground and your position stay clear.", "Storm time pauses with combat and upgrades. Graphics settings cannot turn off the visibility handicap.", "Snowstorms join eligible outdoor maps from six minutes onward.", "Swords, spinning axes and pickaxe impacts have finer trails, glints and dust.", "Attack effects pause with combat and upgrades. Reduced effects keep the attack shapes visible.", "Desktop runs show your worn gear below weapons and passives. Hover or focus an item to inspect it, or collapse Equipment for more room.", "In casual Endless, once no normal upgrades or evolutions remain, each XP level gives a random 1% damage, maximum health or area bonus. Bonuses add together for this run.", "Your usual heal stays. A lone heal continues automatically; optional Curse choices stay manual.", "Katana, Two-handed Sword and Pickaxe start attacks when a large enemy’s body is within their existing reach.", "In casual Endless, boss returns gradually shorten from 90 to 45 seconds after the normal map duration. Additional returns wait while six bosses are alive.", "Adventurer and Map start expanded on wide tablet-size landscape screens. Narrow phone views keep compact, collapsed pickers.", "Menu companions stand beside your adventurer instead of on the same spot."]},{"version": "0.44.43-casual.13", "date": "7 Nov 2026", "title": "Keep progress safe", "items": ["One game tab owns this browser profile. Close it before playing in another tab; use Move progress to keep a backup."]},{"version": "0.44.42-casual.12", "date": "7 Nov 2026", "title": "Companions on the road", "items": ["Choose Chicken, Fox or no companion from More → Pets. Companions follow your path and are cosmetic.", "Optional companions can be retried if a model cannot load. Your selection saves on this device.", "Phone half-fold layout is now called Flex mode. Existing layout choices are kept."]},{"version": "0.44.41-casual.11", "date": "6 Nov 2026", "title": "Clearer menus, clearer fights", "items": ["Greentown and Apache previews frame your adventurer more clearly. Settings sections collapse to keep menus shorter.", "Sound effects and music have separate labelled sliders. Menu music can start from your first interaction while the world loads.", "How to play explains upgrades, caskets, arrows and evolution recipes. Update notes have Copy buttons; long casket results can collapse.", "Shrines show charging progress. Shape mage gear has stronger magic bonuses. Chapel stained glass stays visible when the roof lifts.", "Snow-zone enemy waves begin from six minutes onward. Their first arrival starts Snowdrift Hollow.", "Base pickup range and hostile slam and meteor circles are slightly smaller under current combat rules."]},{version:'0.44.40-casual.10',date:'6 Nov 2026',title:"Lighter crowds",items:["Crowded fights use less animation memory. Enemy models, animations and combat rules stay the same."]},{version:'0.44.39-casual.9',date:'6 Nov 2026',title:'Choose your build',items:["Optional auto-equip wears only clear armour upgrades and keeps your stats and started sets. Enable it in Settings on this device.", "Up to 3 banishes remove unwanted NEW weapons or passives for the rest of this run. Banishing does not replace the card.", "Title music starts after your first tap or key. Music and sound sliders now use mobile-compatible volume controls.", "Enemies stop at touching distance instead of walking inside a stationary adventurer. Contact still hurts.", "Map previews have clearer character positions. Flex mode is available on phones only.", "The chapel's south doorway stays open for walking. Solid walls and low-fence collision remain in place.", "Thrown axes and Mutant Slimers have smaller visuals. Damage and attack ranges are unchanged.", "The minimap refreshes at a steady rate during busy fights, reducing redraw work without hiding enemies."]},{version:'0.44.38-casual.8',date:'6 Nov 2026',title:'Know your build',items:["See each weapon's recent damage from the minimap or Tab. Hold a belt item to read what it does without using it.", "Menus now render at up to 30 frames per second while controls stay responsive."]},{version:'0.44.37-casual.7',date:'6 Nov 2026',title:'Keep clear of wall edges',items:['Turning out of doorways now keeps adventurers and enemies clear of wall edges. Open doors and reachable low-fence tumbles still work.','Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.36-casual.6',date:'6 Nov 2026',title:'Faster starts, solid walls',items:["Enemies move 5% faster during the first four minutes.",'Movement now respects blocked house corners. Enemies take open routes instead of slipping through walls. Fast knockback cannot skip solid ground.',"Walls now block enemy contact damage. Nearby enemies find open doors.",'Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.35-casual.5',date:'6 Nov 2026',title:'Quality in every upgrade',items:['Every upgrade gives one level. Common, Uncommon, Rare and Epic rolls retain different stat gains for this run. Maxed items cannot roll again. Cards show the resulting stats.','Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.34-casual.4',date:'5 Nov 2026',title:'Update notes in your language',items:['Update notes now follow your language choice when a translation is available. Older notes without a translation stay in English.','Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.32-casual.3',date:'5 Nov 2026',title:'Pasture fence tumble',items:['Tumble now clears the low pasture fences west of Greentown. Normal walking still stops at the railings. Existing wall and landing checks remain.']}];`, map: null };
      const locale = /\/src\/locales\/(tr|es|fil)\.js$/.exec(id);
      if (locale) return { code: localeSource(locale[1]), map: null };
    },
    generateBundle(_, bundle) {
      for (const id of this.getModuleIds()) assert.doesNotMatch(id, /\/(?:wallet(?:-connect)?|dmt|ranked(?:-client|-play)?|cloud|swap|prize-display|config|carry-(?:progress|gate))\.js$|node_modules\/(?:@walletconnect|qrcode|@reown)/, `Forbidden module in casual build: ${id}`);
      for (const entry of Object.values(bundle)) if (entry.type === 'chunk') assertCasualBundle(entry.code, [entry.fileName]);
    },
  };
}
