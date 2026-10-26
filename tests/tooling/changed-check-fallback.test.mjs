import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('unknown test impact runs full units when Vitest produces no related-test report', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'changed-fallback-'));
  try {
    for (const name of ['src', 'bin', 'node_modules/vitest'])
      mkdirSync(path.join(directory, name), { recursive: true });
    writeFileSync(path.join(directory, 'src/probe.ts'), 'export const probe = 1;');
    writeFileSync(
      path.join(directory, '.changed-files.json'),
      JSON.stringify({ files: ['src/probe.ts'], revision: 'test-tree' }),
    );
    writeFileSync(
      path.join(directory, 'bin/npm'),
      `#!/usr/bin/env node
if(process.argv[2]==='run' && process.argv[3]==='test') require('node:fs').writeFileSync('full-unit-ran','yes');`,
      { mode: 0o755 },
    );
    writeFileSync(path.join(directory, 'bin/npx'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../../scripts/run-changed-checks.mjs', import.meta.url))],
      {
        cwd: directory,
        env: { ...process.env, PATH: `${path.join(directory, 'bin')}:${process.env.PATH}` },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(path.join(directory, 'full-unit-ran'), 'utf8'), 'yes');
    const summary = JSON.parse(
      readFileSync(path.join(directory, '.check-logs/summary.json'), 'utf8'),
    );
    assert.equal(summary.status, 'passed');
    assert.equal(summary.mode, 'final');
    assert.ok(summary.durationMs >= 0);
    assert.ok(summary.checks.every((check) => check.status === 'passed'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
