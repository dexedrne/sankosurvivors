// Touch/pen taps finish on pointerup. A hold only inspects; its synthetic click must never use an item.
export function bindBeltItem(el, { use, canUse }) {
  const kind = el.dataset.kind, tip = el.querySelector('[role="tooltip"]'), doc = el.ownerDocument, listeners = [];
  let press = null, cancelledPointer = null, holdTimer, clickTimer, ignoreClick = false;
  const current = () => el.isConnected !== false && el.dataset.kind === kind && !doc.hidden;
  const hide = () => { if (tip) tip.hidden = true; };
  const show = () => {
    if (!tip || !current()) return;
    tip.hidden = false;
    const rect = el.getBoundingClientRect(), box = tip.getBoundingClientRect(), width = doc.documentElement.clientWidth, height = doc.documentElement.clientHeight;
    const lower = doc.body?.classList.contains('ds-layout') ? (doc.getElementById('dscontrols')?.getBoundingClientRect().top || 0) + 8 : 8;
    tip.style.left = Math.max(8, Math.min(rect.left, width - box.width - 8)) + 'px';
    const above = rect.top - box.height - 8;
    tip.style.top = Math.max(lower, Math.min(above >= lower ? above : rect.bottom + 8, height - box.height - 8)) + 'px';
  };
  const cancel = () => {
    clearTimeout(holdTimer); hide();
    if (press) {
      cancelledPointer = press.id; press = null; clearTimeout(clickTimer);
      ignoreClick = true;
    }
  };
  const on = (target, event, fn) => { target.addEventListener(event, fn); listeners.push(() => target.removeEventListener(event, fn)); };
  on(el, 'pointerdown', e => {
    if (e.pointerType === 'mouse') { ignoreClick = false; cancelledPointer = null; return; }
    if (press || !current() || !canUse()) return;
    ignoreClick = true; clearTimeout(clickTimer); e.preventDefault();
    el.setPointerCapture(e.pointerId);
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, held: false };
    holdTimer = setTimeout(() => { if (press && current()) { press.held = true; show(); } }, 500);
  });
  on(el, 'pointermove', e => { if (press?.id === e.pointerId && !press.held && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancel(); });
  on(el, 'pointerup', e => {
    if (press?.id !== e.pointerId) {
      if (cancelledPointer === e.pointerId) { cancelledPointer = null; clearTimeout(clickTimer); clickTimer = setTimeout(() => { ignoreClick = false; }, 400); }
      return;
    }
    const start = press; cancel(); cancelledPointer = null;
    clickTimer = setTimeout(() => { ignoreClick = false; }, 400);
    if (!start.held && Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 10 && current() && canUse()) use();
  });
  for (const event of ['pointercancel', 'lostpointercapture']) on(el, event, e => { if (press?.id === e.pointerId) cancel(); });
  // A touch click can land on a replacement button after pointerup already used its predecessor.
  on(el, 'click', e => { if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.sourceCapabilities?.firesTouchEvents) return; if (!ignoreClick && current() && canUse()) use(); });
  on(el, 'pointerenter', e => { if (e.pointerType === 'mouse') show(); });
  on(el, 'pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
  on(el, 'focus', show); on(el, 'blur', cancel);
  on(el, 'keydown', e => { if (e.key === 'Escape') cancel(); else if (e.key === 'Enter' || e.key === ' ') ignoreClick = false; });
  on(el, 'contextmenu', e => e.preventDefault());
  on(doc, 'visibilitychange', cancel);
  if (globalThis.addEventListener) on(globalThis, 'blur', cancel);
  return () => { cancel(); clearTimeout(clickTimer); for (const off of listeners) off(); };
}
