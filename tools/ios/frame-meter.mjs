// Local diagnostics only: no storage, identifiers or network.
export function createFrameMeter(onReport, now = () => performance.now()) {
  let since = null, phase = null, callbacks = 0, draws = 0, work = 0;
  return {
    frame(ts, mode, visible = true) {
      if (!visible || mode !== phase || since === null) {
        since = visible ? ts : null; phase = mode; callbacks = draws = work = 0; return;
      }
      callbacks++;
      const elapsed = ts - since;
      if (elapsed < 1000) return;
      onReport({ mode, callbacks: Math.round(callbacks * 1000 / elapsed), draws: Math.round(draws * 1000 / elapsed), renderMs: draws ? Math.round(work / draws * 10) / 10 : 0 });
      since = ts; callbacks = draws = work = 0;
    },
    draw(action) {
      const start = now();
      try { return action(); }
      finally { draws++; work += Math.max(0, now() - start); }
    }
  };
}
