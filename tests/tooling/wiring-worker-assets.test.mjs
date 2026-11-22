import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('routing transport eagerly imports a bundled inline worker', () => {
  const source = readFileSync('src/ui/schematic/wiring/logic/wiring-worker-transport.ts', 'utf8');
  assert.match(source, /import\s+\w+\s+from\s+['"]\.\/wiring-worker\?worker&inline['"]/u);
  assert.doesNotMatch(source, /import\s*\(|importScripts|fetch\s*\(/u);
});

test('production CSP permits Blob workers without widening scripts or network access', () => {
  const source = readFileSync('infra/nginx.conf', 'utf8');
  assert.match(source, /worker-src blob:;/u);
  assert.match(source, /script-src 'self';/u);
  assert.match(source, /connect-src 'none';/u);
  assert.doesNotMatch(source, /worker-src[^;]*(?:data:|https?:|\*)/u);
});

test('worker dispatch uses typed proposal operations without external runtime loading', () => {
  const source = readFileSync('src/ui/schematic/wiring/logic/wiring-worker.ts', 'utf8');
  assert.doesNotMatch(source, /import\s*\(|importScripts|fetch\s*\(|JSON\.parse|@joint/u);
  assert.match(source, /calculateWiringProposal/u);
});
