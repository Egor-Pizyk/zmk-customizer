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

test('formatter skips excluded agent files but still rejects malformed formatting', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'changed-format-'));
  const formatter = fileURLToPath(new URL('../../node_modules/oxfmt/bin/oxfmt', import.meta.url));
  const runner = fileURLToPath(new URL('../../scripts/run-changed-checks.mjs', import.meta.url));
  try {
    for (const name of ['.specify', 'bin', 'node_modules/vitest'])
      mkdirSync(path.join(directory, name), { recursive: true });
    writeFileSync(
      path.join(directory, '.oxfmtrc.json'),
      JSON.stringify({ ignorePatterns: ['.specify/**'] }),
    );
    writeFileSync(path.join(directory, '.specify/integration.json'), '{"version":"1.2.3"}');
    writeFileSync(path.join(directory, 'bin/npm'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    writeFileSync(
      path.join(directory, 'bin/npx'),
      `#!/usr/bin/env node
const {spawnSync}=require('node:child_process');
const args=process.argv.slice(2);
if(args[1]!=='oxfmt') process.exit(0);
const result=spawnSync(process.execPath,[${JSON.stringify(formatter)},...args.slice(2)],{stdio:'inherit'});
process.exit(result.status??1);
`,
      { mode: 0o755 },
    );
    const check = (files) => {
      writeFileSync(
        path.join(directory, '.changed-files.json'),
        JSON.stringify({ files, revision: 'format-tree' }),
      );
      return spawnSync(process.execPath, [runner], {
        cwd: directory,
        env: { ...process.env, PATH: `${path.join(directory, 'bin')}:${process.env.PATH}` },
        encoding: 'utf8',
      });
    };
    const excluded = check(['.specify/integration.json']);
    assert.equal(excluded.status, 0, excluded.stderr);
    writeFileSync(path.join(directory, 'bad.json'), '{"items":[1,2,3]}');
    const malformed = check(['.specify/integration.json', 'bad.json']);
    assert.notEqual(malformed.status, 0, 'formatting errors must still block the snapshot');
    assert.match(malformed.stderr, /bad\.json/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
