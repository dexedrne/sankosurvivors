import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const input = source.slice(source.indexOf('// ---- input -----'), source.indexOf("addEventListener('keyup'"));
const navigation = source.slice(source.indexOf('const NAV_SCREENS'), source.indexOf('// ---- minimap:'));
const walletClose = source.slice(source.indexOf("$('walletclose').onclick ="), source.indexOf("$('wallet').addEventListener"));
const tabTrap = source.slice(source.indexOf("$('ranked').addEventListener('click'"), source.indexOf('async function rankedAction'));
const guideHandlers=source.slice(source.indexOf("$('guidebtn').onclick ="),source.indexOf("$('guide').addEventListener"));
const moreHandlers=['morebtn','moreclose'].map(id=>source.split('\n').find(line=>line.startsWith("$('"+id+"').onclick"))).join('\n');
const moreCapture=source.split('\n').find(line=>line.startsWith("for (const b of document.querySelectorAll('#more"));
const petClose=source.split('\n').find(line=>line.startsWith("$('petsclose').onclick"));
const trapStart=source.indexOf('function containMenuTab('),sharedTrap=trapStart<0?'':source.slice(trapStart,source.indexOf('\nfor (const id',trapStart));
const sliderKey = source.slice(source.indexOf("    r.addEventListener('keydown'"), source.indexOf('\n', source.indexOf("    r.addEventListener('keydown'")));
const choose = source.slice(source.indexOf('choose: (wal, dev)'), source.indexOf('  note: (t) => banner', source.indexOf('choose: (wal, dev)')));
const loop = source.indexOf('function loop(ts)');
const menuStart = source.indexOf("  if (mode !== 'play'", loop);
const titleStart = source.indexOf("  if (mode === 'title' || mode === 'end')", menuStart);
const pad = source.slice(menuStart, source.indexOf('    if (!sim) { // title backdrop:', titleStart)) + '  }';

// Execute the shipped handlers; substitute only DOM operations and the run/wallet boundaries.
function menu(mode = 'title') {
  const elements = new Map(), listeners = [];
  let active = null;
  function element(id, parent = null, tag = 'button') {
    const classes = new Set(['hidden']), handlers = [];
    const el = {
      id, parent, tag, handlers, children: [], disabled: false, textContent: '', onclick: null, value: 50, tabIndex: 0,
      classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c) },
      get offsetParent() { return this.closest('.hidden') ? null : {}; },
      closest(selector) { if (selector === 'details:not([open]) > :not(summary)') return null; assert.equal(selector, '.hidden'); return this.classList.contains('hidden') ? this : this.parent?.closest(selector) || null; },
      contains(other) { return other === this || this.children.some(child => child.contains(other)); },
      querySelectorAll() { return this.children; },
      querySelector(selector) { return this.children.find(child=>child.tag===selector)||null; },
      matches(selector) { return (parent || id === 'walletchip') && selector.split(',').some(s => [tag, ...(id === 'volume' ? ['input[data-vol]', 'input[type=range]'] : [])].includes(s.trim())); },
      addEventListener(event, fn) { handlers.push({ event, fn }); },
      dispatchEvent() {},
      scrollIntoView() {},
      focus() { active = this; },
      click() { for(const h of handlers)if(h.event==='click')h.fn({target:this});this.onclick?.(); },
      getBoundingClientRect() { return { left: 0, top: this.parent?.children.indexOf(this) * 50 || 0, width: 100, height: 30 }; },
    };
    if (parent) { parent.children.push(el); classes.delete('hidden'); }
    elements.set(id, el); return el;
  }
  for (const id of ['cloudpick', 'walletlink', 'wallet', 'ranked', 'dmt', 'tip', 'bug', 'board', 'settings', 'updates', 'skills', 'gear', 'quests', 'guide', 'pets', 'more', 'pause', 'end', 'title']) element(id);
  for (const [id, parent] of [['walletlinkback', 'walletlink'], ['start', 'title'], ['again', 'end'], ['walletconnect', 'wallet'], ['walletclose', 'wallet'], ['rankedpay', 'ranked'], ['rankedclose', 'ranked'], ['cloudusewal', 'cloudpick'], ['cloudusedev', 'cloudpick']]) element(id, elements.get(parent));
  element('advsummary', elements.get('title'), 'summary'); element('mapsummary', elements.get('title'), 'summary');
  element('volume', elements.get('settings'), 'input'); element('settingsclose', elements.get('settings'));
  element('morebtn',elements.get('title'));element('guidebtn',elements.get('more'));element('moreclose',elements.get('more'));
  element('guidesummary',elements.get('guide'),'summary');element('guideclose',elements.get('guide'));
  element('petchoice',elements.get('pets'));element('petsclose',elements.get('pets'));
  element('settingssummary',elements.get('settings'),'summary');element('guidecurrentrecipes');element('guideoldrecipes');
  for (const id of ['walletchip', 'cloudwal', 'clouddev']) element(id);
  const $ = id => { assert.ok(elements.has(id), `unknown DOM id ${id}`); return elements.get(id); };
  $(mode).classList.remove('hidden');
  const app = Function('$', 'addEventListener', 'document', 'initialMode', 'onWallet', 'walletRevision', `
    let mode=initialMode, started=0, connected=0, mobileModal=false;
    const walletModalOpen=()=>mobileModal;
    const keys=new Set(), startRun=()=>{started++;}, pause=on=>{mode=on?'pause':'play';};
    $('start').onclick=startRun; $('again').onclick=startRun;
    $('walletconnect').onclick=()=>{connected++;};
    ${walletClose}
    ${sharedTrap}
    ${tabTrap}
    { const r=$('volume'); ${sliderKey}
    }
    ${input}
    ${navigation}
    const guideRecipes=()=>'';
    ${guideHandlers}
    ${moreHandlers}
    ${moreCapture}
    ${petClose}
    for(const id of ['guide','pets','more'])if(typeof containMenuTab==='function')$(id).addEventListener('keydown',containMenuTab);
    let cloudChoice=null;
    const cloud={${choose}};
    return {back:navBack, move:navMove, screen:()=>navScreen()?.id,
      frame(edges){${pad}},
      modal:on=>mobileModal=on, choose:cloud.choose, focus(id){navFocus($(id));},
      state:()=>({started,connected,mode})};
  `)($, (event, fn, capture = false) => listeners.push({ event, fn, capture }), { get activeElement() { return active; },querySelectorAll:()=>[elements.get('guidebtn')] }, mode, () => () => {}, () => 0);
  return {
    app, $, get active() { return active?.id; },
    open(id) { $(id).classList.remove('hidden'); },
    key(key, { native = false, shiftKey = false } = {}) {
      let stopped = false, prevented = false;
      const e = { key, shiftKey, repeat: false, target: active || { matches: () => false }, preventDefault() { prevented=true; }, stopPropagation() { stopped=true; }, stopImmediatePropagation() { stopped = true; } };
      for (const { fn } of listeners.filter(l => l.event === 'keydown' && l.capture)) { fn(e); if (stopped) break; }
      for (let el = active; el && !stopped; el = el.parent) for (const {event,fn} of el.handlers) if (event === 'keydown') {e.currentTarget=el;fn(e);}
      if (!stopped) for (const { fn } of listeners.filter(l => l.event === 'keydown' && !l.capture)) { fn(e); if (stopped) break; }
      if (native && !prevented) {
        if ((key === 'Enter' || key === ' ') && e.target.matches('button')) e.target.click();
        if (key === 'Tab') {
          const all=[...elements.values()].filter(el=>el.parent && el.offsetParent!==null);
          all[(all.indexOf(active)+(shiftKey?-1:1)+all.length)%all.length]?.focus();
        }
      }
      return {prevented,stopped};
    },
  };
}

for (const panel of ['wallet', 'cloudpick']) {
  for (const key of ['Enter', ' ']) test(`${panel} blocks keyboard ${JSON.stringify(key)} from starting a run`, () => {
    const m = menu(); m.open(panel); m.key(key);
    assert.equal(m.app.state().started, 0);
  });
  for (const button of ['a', 'start']) test(`${panel} blocks unfocused controller ${button} from starting a run`, () => {
    const m = menu(); m.open(panel); m.app.frame({ [button]: true });
    assert.equal(m.app.state().started, 0);
  });
  test(`${panel} takes spatial focus above title and ranked`, () => {
    const m = menu(); m.open('ranked'); m.open('wallet'); m.open(panel);
    assert.equal(m.app.screen(), panel);
    m.app.move('down');
    m.app.frame({ a: true });
    assert.equal(m.app.state().started, 0);
    assert.equal(m.app.state().connected, panel === 'wallet' ? 1 : 0);
  });
  test(`${panel} ignores stale focus on the start button`, () => {
    const m = menu(); m.app.focus('start'); m.open(panel); m.app.frame({ a: true });
    assert.equal(m.app.state().started, 0);
  });
  test(`${panel} transfers native focus to the spatial selection`, () => {
    const m = menu(); m.open(panel); m.$('walletclose').focus(); m.app.move('down');
    assert.equal(m.active, panel === 'wallet' ? 'walletconnect' : 'cloudusewal');
  });
  test(`${panel} also blocks restart shortcuts over results`, () => {
    const m = menu('end'); m.open(panel);
    m.key('Enter'); m.key(' '); m.app.frame({ a: true });
    assert.equal(m.app.state().started, 0);
  });
}
for (const action of ['Escape', 'controller B']) test(`${action} closes only wallet and restores ranked focus`, () => {
  const m = menu(); m.open('ranked'); m.open('wallet');
  if (action === 'Escape') m.key('Escape'); else m.app.frame({ b: true });
  assert.equal(m.$('wallet').classList.contains('hidden'), true);
  assert.equal(m.$('ranked').classList.contains('hidden'), false);
  assert.equal(m.active, 'rankedclose');
});
test('wallet Back restores the title wallet button when ranked is closed', () => {
  const m = menu(); m.open('wallet'); m.app.back();
  assert.equal(m.$('wallet').classList.contains('hidden'), true);
  assert.equal(m.active, 'walletchip');
});
test('cloud conflict keeps both saves pending until the explicit choice', async () => {
  const m = menu(); m.open('wallet');
  const progress = { coins: 25, maps: 1, ranks: 2, gear: 3 };
  let resolved = false;
  const choice = m.app.choose(progress, progress).then(value => { resolved = true; return value; });
  assert.equal(m.active, 'cloudusewal');
  m.key('Escape'); m.app.frame({ b: true });
  await Promise.resolve();
  assert.equal(resolved, false);
  assert.equal(m.$('cloudpick').classList.contains('hidden'), false);
  assert.equal(m.$('wallet').classList.contains('hidden'), false);
  m.$('cloudusedev').click();
  assert.equal(await choice, 'device');
  assert.equal(m.$('cloudpick').classList.contains('hidden'), true);
});
for (const mode of ['title', 'end']) test(`ordinary ${mode} shortcuts still start a run`, () => {
  const m = menu(mode);
  m.key('Enter'); m.key(' '); m.app.frame({ a: true });
  assert.equal(m.app.state().started, 3);
});
test('controller Start still starts from the plain title screen', () => {
  const m = menu(); m.app.frame({ start: true });
  assert.equal(m.app.state().started, 1);
});
test('existing settings panel still blocks start and closes on Back', () => {
  const m = menu(); m.open('settings'); m.key('Enter'); m.app.frame({ start: true });
  assert.equal(m.app.state().started, 0);
  m.app.back(); assert.equal(m.$('settings').classList.contains('hidden'), true);
});
for (const key of ['Enter', ' ']) test(`native wallet button ${JSON.stringify(key)} does not trigger the start shortcut`, () => {
  const m = menu(); m.$('walletchip').focus(); m.key(key);
  assert.equal(m.app.state().started, 0);
});
test('native button activation takes precedence over stale spatial focus', () => {
  const m = menu(); m.app.focus('start'); m.$('walletchip').focus(); m.key('Enter');
  assert.equal(m.app.state().started, 0);
});
for (const panel of ['wallet', 'cloudpick']) {
  test(`${panel} keeps native Tab at its first and last controls`, () => {
    const m=menu(); m.open(panel);
    const first=panel==='wallet'?'walletconnect':'cloudusewal', last=panel==='wallet'?'walletclose':'cloudusedev';
    m.$(last).focus(); m.key('Tab',{native:true}); assert.equal(m.active,first);
    m.key('Tab',{native:true,shiftKey:true}); assert.equal(m.active,last);
  });
  test(`${panel} prevents a native click on a focused background start button`, () => {
    const m=menu(); m.open(panel); m.$('start').focus(); m.key('Enter',{native:true});
    assert.equal(m.app.state().started,0);
  });
}
test('spatial arrow selection can continue through native summaries',()=>{
  const m=menu(); m.app.focus('advsummary'); m.key('ArrowDown');
  assert.equal(m.active,'mapsummary');
});
test('summary reached with ordinary native focus keeps native arrows',()=>{
  const m=menu(); m.$('advsummary').focus(); m.key('ArrowDown');
  assert.equal(m.active,'advsummary');
});
test('spatially selected volume accepts left/right and leaves with down',()=>{
  const m=menu(); m.open('settings'); m.app.focus('volume'); m.key('ArrowRight');
  assert.equal(Number(m.$('volume').value),55);
  m.key('ArrowDown'); assert.equal(m.active,'settingsclose');
});
test('Escape closes settings from a spatially selected volume slider',()=>{
  const m=menu(); m.open('settings'); m.app.focus('volume'); m.key('Escape');
  assert.equal(m.$('settings').classList.contains('hidden'),true);
});
test('ordinary native volume editing bypasses spatial shortcuts',()=>{
  const m=menu(); m.open('settings'); m.$('volume').focus(); m.key('ArrowDown');
  assert.equal(m.active,'volume'); assert.equal(Number(m.$('volume').value),50);
});

test('wallet approval screen keeps native keys and controller input away from the game',()=>{
  const m=menu();m.app.modal(true);const key=m.key('ArrowDown');m.app.frame({a:true,start:true});
  assert.equal(m.app.state().started,0);assert.equal(m.active,undefined);assert.equal(key.prevented,false);
  m.open('wallet');m.app.back();assert.equal(m.$('wallet').classList.contains('hidden'),false);
});

test('the new guide blocks background keyboard/controller starts and closes with Escape',()=>{
 const m=menu();m.open('guide');m.key('Enter');m.key(' ');m.app.frame({a:true,start:true});assert.equal(m.app.state().started,0);assert.equal(m.app.screen(),'guide');m.key('Escape');assert.equal(m.$('guide').classList.contains('hidden'),true);
});

test('controller follows title to More to guide without starting underneath',()=>{
 const m=menu();m.app.focus('morebtn');m.app.frame({a:true});assert.equal(m.app.screen(),'more');
 m.app.frame({start:true});m.key('Enter');assert.equal(m.app.state().started,0);
 m.app.frame({a:true});assert.equal(m.app.screen(),'guide');assert.equal(m.active,'guidesummary');assert.equal(m.app.state().started,0);
 m.key('Escape');assert.equal(m.app.screen(),'title');assert.equal(m.active,'morebtn');
});
test('More blocks stale background controls and has its own controller Back route',()=>{
 const m=menu();m.open('more');m.app.focus('start');m.app.frame({a:true,start:true});m.key('Enter',{native:true});assert.equal(m.app.state().started,0);
 m.app.frame({b:true});assert.equal(m.$('more').classList.contains('hidden'),true);
});
for(const panel of['guide','settings'])test('native Tab focus on '+panel+' summary still allows Escape',()=>{
 const m=menu();m.open(panel);m.$(panel==='guide'?'guidesummary':'settingssummary').focus();m.key('Tab');m.$(panel==='guide'?'guidesummary':'settingssummary').focus();m.key('Escape');assert.equal(m.$(panel).classList.contains('hidden'),true);
});
test('guide opening sets focus and forward/reverse Tab stay inside its modal',()=>{
 const m=menu();m.$('guidebtn').click();assert.equal(m.active,'guidesummary');
 m.$('guideclose').focus();m.key('Tab',{native:true});assert.equal(m.active,'guidesummary');
 m.key('Tab',{native:true,shiftKey:true});assert.equal(m.active,'guideclose');
});
test('Pets blocks stale keyboard/controller starts and its actual Back handler returns focus',()=>{
 const m=menu();m.open('pets');m.app.focus('start');m.key('Enter',{native:true});m.app.frame({a:true,start:true});assert.equal(m.app.state().started,0);assert.equal(m.app.screen(),'pets');
 m.key('Escape');assert.equal(m.$('pets').classList.contains('hidden'),true);assert.equal(m.active,'morebtn');
});
test('Pets keeps forward and reverse native Tab within its controls',()=>{
 const m=menu();m.open('pets');m.$('petsclose').focus();m.key('Tab',{native:true});assert.equal(m.active,'petchoice');m.key('Tab',{native:true,shiftKey:true});assert.equal(m.active,'petsclose');
});
