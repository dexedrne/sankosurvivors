// The platform injects this before the game starts; a standalone review has no SDK.
export function createWavedashLoader(sdk = globalThis.Wavedash) {
  let progress = 0, ready = false;
  return {
    progress(value) {
      if (ready || !Number.isFinite(value)) return;
      progress = Math.max(progress, Math.min(1, Math.max(0, value)));
      sdk?.updateLoadProgressZeroToOne(progress);
    },
    ready() {
      if (ready) return;
      sdk?.updateLoadProgressZeroToOne(1);
      sdk?.init();
      ready = true;
    },
  };
}
