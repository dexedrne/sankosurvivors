const defaults = ['1', '2', '3', '4'];
const reserved = new Set('wasdqetmf');
export function itemKey(key) {
  if (typeof key !== 'string' || !/^[a-z0-9]$/i.test(key)) return null;
  const value = key.toLowerCase();
  return reserved.has(value) ? null : value;
}
export function cleanItemKeys(raw) {
  const keys = Array.isArray(raw) && raw.length === 4 ? raw.map(itemKey) : [];
  return keys.length === 4 && keys.every(Boolean) && new Set(keys).size === 4 ? keys : [...defaults];
}
export function itemKeySlot(event, keys) {
  if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return -1;
  const key = itemKey(event.key);
  return key ? keys.indexOf(key) : -1;
}

export function bindItemKeys(panel, initial, persist, text) {
  let keys = cleanItemKeys(initial), capture = -1;
  const buttons = [...panel.querySelectorAll('[data-item-key]')], status = panel.querySelector('[data-item-key-status]');
  const doc = panel.ownerDocument;
  function refresh(message = '') {
    buttons.forEach((button, i) => {
      button.textContent = capture === i ? text('Press a key…') : keys[i].toUpperCase();
      button.setAttribute('aria-label', `${text('Item slot')} ${i + 1}: ${button.textContent}`);
      button.classList.toggle('on', capture === i);
    });
    status.textContent = text(message);
  }
  function cancel() { capture = -1; refresh(); }
  function store(next) {
    try { persist(next); }
    catch { cancel(); refresh('Could not save item keys. Your previous keys are unchanged.'); return; }
    keys = next; cancel(); refresh('Item keys saved on this device.');
  }
  buttons.forEach((button, i) => {
    button.onclick = () => { button.focus(); capture = i; refresh('Press a key. Esc cancels.'); };
    button.onblur = () => { if (capture === i) cancel(); };
  });
  panel.querySelector('[data-item-key-reset]').onclick = () => store(cleanItemKeys(null));
  doc.defaultView.addEventListener('keydown', event => {
    if (capture < 0) return;
    if (panel.closest('.screen').classList.contains('hidden') || doc.activeElement !== buttons[capture]) { cancel(); return; }
    if (event.key === 'Tab') { cancel(); return; }
    if (event.ctrlKey || event.altKey || event.metaKey) { cancel(); event.stopImmediatePropagation(); return; }
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.key === 'Escape') { cancel(); return; }
    if (event.repeat || event.isComposing) return;
    const key = itemKey(event.key);
    if (!key) { refresh('Choose another letter or number. Movement, camera, sound and interaction keys are reserved.'); return; }
    if (keys.some((value, i) => i !== capture && value === key)) { refresh('That key is already assigned.'); return; }
    const next = [...keys]; next[capture] = key; store(next);
  }, true);
  doc.defaultView.addEventListener('blur', cancel);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) cancel(); });
  panel.addEventListener('toggle', () => { if (!panel.open) cancel(); });
  refresh();
  return { get keys() { return keys; }, slot: event => itemKeySlot(event, keys), refresh };
}
