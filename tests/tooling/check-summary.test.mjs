import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('worker reports bounded failures, timing and complete logs without a Node stack', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'check-summary-'));
  try {
    for (const name of ['bin', 'node_modules/vitest'])
      mkdirSync(path.join(directory, name), { recursive: true });
    writeFileSync(
      path.join(directory, '.changed-files.json'),
      JSON.stringify({ files: ['docs/testing.md'], revision: 'probe-tree', mode: 'static' }),
    );
    writeFileSync(
      path.join(directory, 'bin/npm'),
      `#!/usr/bin/env node
console.log('\\u001b[31merror TS1005: required field\\u001b[0m');
for(let i=1;i<=100;i++) console.log(i);
process.exit(7);
`,
      { mode: 0o755 },
    );
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../../scripts/run-changed-checks.mjs', import.meta.url))],
      {
        cwd: directory,
        env: { ...process.env, PATH: `${path.join(directory, 'bin')}:${process.env.PATH}` },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 1);
    const summary = JSON.parse(
      readFileSync(path.join(directory, '.check-logs/summary.json'), 'utf8'),
    );
    assert.equal(summary.mode, 'static');
    assert.equal(summary.status, 'failed');
    assert.equal(summary.revision, 'probe-tree');
    assert.equal(summary.checks.length, 1);
    assert.ok(summary.checks[0].durationMs >= 0);
    assert.equal(summary.checks[0].excerpt[0], 'error TS1005: required field');
    assert.ok(summary.checks[0].excerpt.length <= 12);
    assert.ok(readFileSync(path.join(directory, summary.checks[0].log), 'utf8').includes('100'));
    assert.ok(result.stderr.length < 2000);
    assert.doesNotMatch(result.stderr, /at ModuleJob/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
