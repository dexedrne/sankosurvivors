import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// a merge once left a block unclosed and the site would not build (3 Nov): every brace in the stylesheet is closed
test('style.css has balanced braces and no merge markers', () => {
  const s = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  let d = 0, line = 1, worst = 0;
  for (const ch of s) { if (ch === '\n') line++; else if (ch === '{') d++; else if (ch === '}') { d--; if (d < 0) worst = line; } }
  assert.equal(d, 0, 'every { has its }'); assert.equal(worst, 0, 'no } without its {');
  assert.ok(!/^(<<<<<<<|=======|>>>>>>>)/m.test(s), 'no merge markers');
});
