import * as tr from './locales/tr.js';
import * as es from './locales/es.js';
import * as fil from './locales/fil.js';

export const LANGUAGES = { en:'English', tr:'Türkçe', es:'Español', fil:'Filipino' };
const catalogues = { tr, es, fil };

const LANG_KEY = 'sq-language';
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const compiled = Object.fromEntries(Object.entries(catalogues).map(([language,catalogue]) => {
  const rules=[...catalogue.patterns].sort(([a],[b]) => b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(([source,target]) => {
    const slots = new Map();
    const regex = source.split(/(\{\d+\})/).map(part => {
      if (!/^\{\d+\}$/.test(part)) return escape(part);
      if (slots.has(part)) return '\\' + slots.get(part);
      slots.set(part,slots.size+1); return '([^·]*?)'; // one value must not swallow another list entry
    }).join('');
    return { regex:new RegExp('^'+regex+'$','u'), target, slots };
  });
  return [language,{text:catalogue.text,rules}];
}));
export function preferredLanguage(saved,browser='') {
  if(Object.hasOwn(LANGUAGES,saved)) return saved;
  const primary=String(browser).toLowerCase().split('-')[0], language=primary==='tl'?'fil':primary;
  return Object.hasOwn(LANGUAGES,language)?language:'en';
}

export function translateText(source,language='tr',depth=0) {
  if (!Object.hasOwn(compiled,language) || depth > 6 || !source?.trim()) return source;
  const {text,rules}=compiled[language];
  const [,lead,core,tail] = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!/[A-Za-z]/.test(core)) return source;
  if (Object.hasOwn(text,core)) return lead+text[core]+tail;
  for (const {regex,target,slots} of rules) {
    const match=regex.exec(core); if (!match) continue;
    return lead+target.replace(/\{\d+\}/g,slot => translateText(match[slots.get(slot)] ?? slot,language,depth+1))+tail;
  }
  // Composed bonus/readout lists are separate display phrases, not persisted item IDs.
  for (const separator of [' · ', ', ']) if (core.includes(separator)) {
    const parts=core.split(separator), translated=parts.map(p=>translateText(p,language,depth+1));
    if (translated.some((p,i)=>p!==parts[i])) return lead+translated.join(separator)+tail;
  }
  if (core.endsWith(':')) {
    const label=translateText(core.slice(0,-1),language,depth+1);
    if (label!==core.slice(0,-1)) return lead+label+':'+tail;
  }
  return source;
}

// Translate display nodes only. Values, dataset keys, links, saves, sim content and player names stay untouched.
export function initI18n() {
  let saved; try { saved=localStorage.getItem(LANG_KEY); } catch {}
  let language=preferredLanguage(saved,navigator.language);
  const originals=new WeakMap(), attributes=new WeakMap();
  const ignored='[translate="no"],[data-no-i18n],script,style,code';
  const skip = element => !element || !!element.closest(ignored);
  function renderText(node) {
    if (skip(node.parentElement) || node.parentElement.closest('textarea')) return;
    const prev=originals.get(node), source=prev && node.nodeValue===prev.rendered ? prev.source : node.nodeValue;
    const rendered=translateText(source,language);
    originals.set(node,{source,rendered});
    if (node.nodeValue!==rendered) node.nodeValue=rendered;
  }
  function renderAttributes(element) {
    if (skip(element)) return;
    let stored=attributes.get(element); if(!stored){stored={};attributes.set(element,stored);}
    for (const key of ['title','placeholder','aria-label','alt']) if(element.hasAttribute(key)) {
      const current=element.getAttribute(key),prev=stored[key],source=prev&&current===prev.rendered?prev.source:current;
      const rendered=translateText(source,language); stored[key]={source,rendered};
      if(current!==rendered) element.setAttribute(key,rendered);
    }
  }
  function render(root) {
    if(root.nodeType===3){renderText(root);return;}
    if(root.nodeType!==1 || skip(root)) return;
    renderAttributes(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const node=walker.currentNode;
      if(node.nodeType===3) renderText(node); else renderAttributes(node);
    }
  }
  function select(value) {
    language=Object.hasOwn(LANGUAGES,value)?value:'en';
    try {localStorage.setItem(LANG_KEY,language);} catch {}
    document.documentElement.lang=language;
    for(const control of document.querySelectorAll('[data-language]')) control.value=language;
    render(document.body);
  }
  for(const control of document.querySelectorAll('[data-language]')) control.addEventListener('change',()=>select(control.value));
  document.documentElement.lang=language;
  for(const control of document.querySelectorAll('[data-language]')) control.value=language;
  render(document.body);
  const observer=new MutationObserver(changes=>{
    if(language==='en') return;
    for(const change of changes) {
      if(change.type==='childList') for(const node of change.addedNodes) render(node);
      else if(change.type==='characterData') renderText(change.target);
      else renderAttributes(change.target);
    }
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});
}
