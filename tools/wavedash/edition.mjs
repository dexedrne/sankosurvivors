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
const excluded = ['cloudpick', 'wallet', 'ranked', 'dmt', 'tip', 'bug'];

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
  for (const file of ['ranked', 'ranked-play', 'ranked-client', 'prize-display', 'config', 'dmt', 'cloud', 'swap', 'wallet-connect', 'wallet']) {
    const re = new RegExp(`^import .+ from './${file}\\.js';\\n`, 'm');
    assert.ok(re.test(s), `Expected import ${file}`); s = s.replace(re, '');
  }
  s = between(s, 'const noPrize =', 'import { TRANSFER_KEYS');
  s = between(s, 'const walletHandoff =', 'const BASE =', "initI18n();\nconst wavedashLoader = createWavedashLoader();\n");
  s = "import { createWavedashLoader } from './wavedash.js';\nimport { betterRun } from './personal-record.js';\n" + s;
  s = between(s, '// ---- ranked: paid tickets', '// ---- skills');
  s = between(s, '// ---- version, leaderboard', '// ---- DMT holder perks', records);
  s = between(s, '// ---- DMT holder perks', '// ---- cloud save');
  s = between(s, '// ---- cloud save', 'function syncTitleProgress()', progress);
  s = between(s, 'function queuePageReload(', '// ---- quests', reload);
  s = once(s, '  syncTitleNames();\n');
  s = once(s, 'async function startRun(live = null)', 'async function startRun()');
  s = between(s, '  if (!live?.run', '    preloadIcons(', `  if (titleProgressPending) syncTitleProgress();
  cancelPendingLoads(); runStarting = true;
  try {
    if (mode === 'recovery') return;
`);
  s = once(s, 'let runTicket = null;\n');
  s = once(s, 'MAP_BY_ID[isRanked ? live.map : selMap]', 'MAP_BY_ID[selMap]');
  s = once(s, 'isRanked || forced ? {} : getGear()', 'forced ? {} : getGear()');
  s = between(s, '    if (isRanked) {\n      const restored', '    } else sim = createSim');
  s = once(s, '    } else sim = createSim', '    sim = createSim');
  s = between(s, "    $('quit').disabled = isRanked;", '    const goalText', `    $('quit').disabled = false; $('quit').textContent = 'Quit run'; pendingUse = null; slowmo = 0;
    runBest = profileBest(getBests()[bestKey(sim)]); passedBest = false;
`);
  s = once(s, "isRanked && sim.endless ? `: endless, scored by ${kpmWeek(liveRace(live).week) ? 'kills per minute' : 'time survived'}. The hunt is over at ${fmtT(sim.endAt)}` : !isRanked && endlessOn ? ''", "endlessOn ? ''");
  s = once(s, "${isRanked ? `Ranked ·${sim.hard ? ' Hard ·' : ''}` : endlessOn ? 'Endless' : 'Survive'}", "${endlessOn ? 'Endless' : 'Survive'}");
  s = once(s, '${!isRanked && hardOn', '${hardOn');
  s = once(s, ', dmtOn = !!savedPass();', ';');
  s = once(s, ' * (dmtOn ? 1 + DMT_COIN_BONUS : 1)');
  s = once(s, '  const wasRanked = !!rankedRun;\n');
  s = once(s, ', sent: false, ticket: runTicket', '');
  s = between(s, "  $('lbsubmit').disabled = wasRanked;", '  const dmtOn =', "  $('again').textContent = 'Run it back';\n");
  s = once(s, '  const dmtOn = !!savedPass(), alchCoins', '  const alchCoins');
  s = once(s, 'let receipt = null, rankedSaved = !wasRanked, submitted = false;', 'let receipt = null;');
  s = between(s, '    if (!rankedSaved) {', '    receipt ||=');
  s = once(s, '{ earned, ranked: wasRanked }', '{ earned }');
  s = between(s, '    const kpmNote =', "    let bestNote = '';");
  s = once(s, '    if (!wasRanked) {', '    {');
  s = once(s, '${kpmNote}', '');
  s = once(s, "${dmtOn ? ' <em class=\"dmtnote\">DMT +25%</em>' : ''}", '');
  s = once(s, '    cloud.push(true);\n');
  s = once(s, '  rankedRun = null; rankedRec = null; applyDmt();\n');
  s = once(s, "const MENU_SCREENS = ['cloudpick', 'wallet', 'ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests'];", "const MENU_SCREENS = ['board', 'settings', 'updates', 'skills', 'gear', 'quests'];");
  s = once(s, "$('again').onclick = () => { if (lastRun && lastRun.ranked) { toMenu(); openRanked(); } else startRun(); };", "$('again').onclick = startRun;");
  s = between(s, "addEventListener('blur',", "$('start').onclick", `let resumeMode = 'play', focusLostWhileStarting = false;
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
  // Every removed panel must also leave the list of panels hidden when a run starts.
  for (const id of excluded) s = s.replaceAll(`'${id}', `, '').replaceAll(`, '${id}']`, ']');
  assert.doesNotMatch(s, /fetch\(|serviceWorker|caches\.|savedPass|walletNow|createCloud|api\/|TIP_ETH|rankedApi|openRanked|submitScore/, 'Forbidden network/service in casual entry');
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
  let s = between(source, '<script>', '<meta name="viewport"');
  s = s.replace(/^.*(?:rel="manifest"|apple-touch-icon|og:|twitter:|rel="canonical").*\n/gm, '');
  s = s.replaceAll('href="/assets/', 'href="./assets/');
  for (const id of ['walletchip', 'dmtchip', 'rankedbtn', 'tipwrap', 'updatebtn', 'bugbtn2', 'dmtbtn', 'bugbtn', 'installbtn', 'endlb', 'rankedresult', 'rankedretry', 'sharex', ...excluded.filter(id => id !== 'cloudpick'), 'walletlink', 'cloudpick']) s = removeElement(s, id);
  s = s.replaceAll('Leaderboard', 'Best run').replaceAll('before playing or saving to your wallet.', 'before playing.').replaceAll(' Ranked ignores both.', '');
  s = once(s, '<h2>More</h2>', '<h2>More</h2><p>Progress saves on this device. Use Move progress to keep a backup or play on another device.</p>');
  return s;
}

export function assertCasualBundle(text, files) {
  assert.doesNotMatch(text, /walletconnect|reown|kyberswap|api\/(?:ranked|run|score|player|report|dmt)|ethereum:|d22a7b277a3923fe996af92b3a13386c|serviceWorker\.register|caches\.delete/i, 'Forbidden integration in casual build');
  for (const file of files) assert.ok((file === 'index.html' || file === 'licenses/run-escape.txt' || /^(assets|draco)\//.test(file)) && !file.split('/').some(part => part.startsWith('.')) && !file.includes('\\'), `Forbidden casual file: ${file}`);
}

const cryptoCopy = /wallet|\bDMT\b|\bETH\b|ranked|Arbitrum|Ethereum|signature|crypto|blockchain|prize|Kyber|Reown|sankosurvivors\.quest/i;
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
      if (id.endsWith('/src/main.js')) return { code: transformMain(code), map: null };
      if (id.endsWith('/src/assets.js')) return { code: "export const asset = p => (import.meta.env.BASE_URL || './') + 'assets/' + p; export const assetHost = () => 'local'; export const pickAssetHost = async () => 'local';", map: null };
      if (id.endsWith('/src/changelog.js')) return { code: `export const LATEST='0.44.38-casual.8'; export const CHANGELOG=[{version:LATEST,date:'6 Nov 2026',title:'Know your build',items:["See each weapon's recent damage from the minimap or Tab. Hold a belt item to read what it does without using it.", "Menus now render at up to 30 frames per second while controls stay responsive."]},{version:'0.44.37-casual.7',date:'6 Nov 2026',title:'Keep clear of wall edges',items:['Turning out of doorways now keeps adventurers and enemies clear of wall edges. Open doors and reachable low-fence tumbles still work.','Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.36-casual.6',date:'6 Nov 2026',title:'Faster starts, solid walls',items:["Enemies move 5% faster during the first four minutes.",'Movement now respects blocked house corners. Enemies take open routes instead of slipping through walls. Fast knockback cannot skip solid ground.',"Walls now block enemy contact damage. Nearby enemies find open doors.",'Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.35-casual.5',date:'6 Nov 2026',title:'Quality in every upgrade',items:['Every upgrade gives one level. Common, Uncommon, Rare and Epic rolls retain different stat gains for this run. Maxed items cannot roll again. Cards show the resulting stats.','Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.34-casual.4',date:'5 Nov 2026',title:'Update notes in your language',items:['Update notes now follow your language choice when a translation is available. Older notes without a translation stay in English.','Progress saves on this device. Use Move progress to keep a backup or play on another device.']},{version:'0.44.32-casual.3',date:'5 Nov 2026',title:'Pasture fence tumble',items:['Tumble now clears the low pasture fences west of Greentown. Normal walking still stops at the railings. Existing wall and landing checks remain.']}];`, map: null };
      const locale = /\/src\/locales\/(tr|es|fil)\.js$/.exec(id);
      if (locale) return { code: localeSource(locale[1]), map: null };
    },
    generateBundle(_, bundle) {
      for (const id of this.getModuleIds()) assert.doesNotMatch(id, /\/(?:wallet(?:-connect)?|dmt|ranked(?:-client|-play)?|cloud|swap|prize-display|config)\.js$|node_modules\/(?:@walletconnect|qrcode|@reown)/, `Forbidden module in casual build: ${id}`);
      for (const entry of Object.values(bundle)) if (entry.type === 'chunk') assertCasualBundle(entry.code, [entry.fileName]);
    },
  };
}
