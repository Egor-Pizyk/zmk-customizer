import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);

test('VC-06 public static, unit and E2E commands stay separate and CI retains coverage/tooling', () => {
  const scripts = JSON.parse(readFileSync(new URL('package.json', root))).scripts;
  assert.ok(scripts['test:unit']);
  assert.ok(scripts['test:unit:changed'].includes('--unit-only'));
  assert.ok(scripts['test:unit:focus']);
  for (const forbidden of ['test:coverage', 'test:unit', 'test:mutations', 'test:e2e &&']) {
    assert.equal(scripts.check.includes(forbidden), false, forbidden);
  }
  assert.match(scripts.check, /check:architecture/u);
  assert.doesNotMatch(scripts['check:architecture'], /--test|test:unit|vitest|playwright/u);
  assert.match(scripts.check, /typecheck/u);
  assert.match(scripts.check, /lint/u);
  assert.match(scripts.check, /format:check/u);
  assert.equal(scripts['test:e2e'], 'playwright test');
  const hook = readFileSync(new URL('.githooks/pre-commit', root), 'utf8');
  assert.doesNotMatch(hook, /playwright|test:unit|test:e2e/u);
  const ci = readFileSync(new URL('.github/workflows/ci.yml', root), 'utf8');
  assert.match(ci, /npm run test:coverage/u);
  assert.match(ci, /npm run test:tooling/u);
});

for (const mode of ['static', 'unit']) {
  test(`VC-02/03 ${mode} worker cannot run the other stage or Playwright`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'verification-stage-'));
    try {
      for (const folder of ['src', 'bin', 'node_modules/vitest'])
        mkdirSync(path.join(directory, folder), { recursive: true });
      writeFileSync(path.join(directory, 'src/probe.ts'), 'export const probe = 1;');
      writeFileSync(
        path.join(directory, '.changed-files.json'),
        JSON.stringify({ mode, revision: 'probe', files: ['src/probe.ts'] }),
      );
      const stub = `#!/usr/bin/env node
const fs=require('node:fs');fs.appendFileSync('calls.jsonl',JSON.stringify(process.argv.slice(2))+'\\n');
if(process.argv.includes('related'))fs.writeFileSync('.check-logs/related.json',JSON.stringify({numTotalTests:1}));`;
      for (const command of ['npm', 'npx'])
        writeFileSync(path.join(directory, 'bin', command), stub, { mode: 0o755 });
      const result = spawnSync(
        process.execPath,
        [fileURLToPath(new URL('scripts/run-changed-checks.mjs', root))],
        {
          cwd: directory,
          env: { ...process.env, PATH: `${path.join(directory, 'bin')}:${process.env.PATH}` },
          encoding: 'utf8',
        },
      );
      assert.equal(result.status, 0, result.stderr);
      const calls = readFileSync(path.join(directory, 'calls.jsonl'), 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line).join(' '));
      assert.ok(calls.every((call) => !call.includes('playwright')));
      if (mode === 'static') {
        for (const expected of ['check:architecture', 'typecheck', 'oxlint', 'oxfmt'])
          assert.ok(
            calls.some((call) => call.includes(expected)),
            expected,
          );
        assert.ok(calls.every((call) => !call.includes('vitest') && !call.includes('run test ')));
      } else {
        assert.equal(calls.length, 1);
        assert.match(calls[0], /vitest related src\/probe.ts/u);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
