// Adapted from Run Escape's client DamageMeter (BSD-2-Clause); public/licenses/run-escape.txt.
// Read-only samples of reported hit damage, including overkill. Never advances the simulation.
export class DamageMeter {
  constructor() { this.reset(); }
  reset() { this.samples = []; this.reading = { perSecond: {}, totals: {} }; }
  sample(tick, totals) {
    const last = this.samples.at(-1);
    if (last && tick < last.tick) this.reset();
    else if (last && tick - last.tick < 30) return;
    this.samples.push({ tick, totals: { ...totals } });
    while (this.samples.length > 2 && tick - this.samples[1].tick >= 240) this.samples.shift();
    const first = this.samples[0], latest = this.samples.at(-1), seconds = (latest.tick - first.tick) / 30, perSecond = {};
    if (seconds > 0) for (const [source, total] of Object.entries(latest.totals)) {
      const delta = total - (first.totals[source] || 0);
      if (delta > 0) perSecond[source] = delta / seconds;
    }
    this.reading = { perSecond, totals: latest.totals };
  }
  read() { return this.reading; }
}
