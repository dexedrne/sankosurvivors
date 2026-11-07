export function openProfile(load, blocked) {
  try {
    if (!navigator.locks?.request) { blocked('unsupported'); return; }
    return navigator.locks.request('sqs-profile-owner', { ifAvailable: true }, async lock => {
      if (!lock) return blocked('busy');
      try { await load(); } catch { blocked('failed'); }
      // Recovery can still write after failed startup; retain ownership until the document closes.
      await new Promise(() => {});
    }).catch(() => blocked('unavailable'));
  } catch { blocked('unavailable'); }
}
