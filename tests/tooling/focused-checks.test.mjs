import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('VC-04 plans use staged bytes; unit and static receipts cannot satisfy each other', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'focused-check-'));
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  const command = fileURLToPath(new URL('../../scripts/check-changes.mjs', import.meta.url));
  try {
    git('init', '-q');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    for (const folder of ['src/ui/schematic/parts', 'tests/tooling', 'tests/e2e', 'bin'])
      mkdirSync(path.join(directory, folder), { recursive: true });
    const source = 'src/ui/schematic/parts/panel.tsx';
    writeFileSync(path.join(directory, source), 'original');
    for (const name of ['encoders', 'onboarding-accessibility'])
      writeFileSync(path.join(directory, `tests/e2e/${name}.spec.ts`), '');
    writeFileSync(path.join(directory, 'tests/tooling/probe.test.mjs'), '');
    git('add', '.');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'initial');
    writeFileSync(path.join(directory, source), 'staged');
    git('add', source);
    const tree = git('write-tree');
    rmSync(path.join(directory, source));
    const docker = path.join(directory, 'bin/docker');
    writeFileSync(docker, '#!/bin/sh\nexit 99\n', { mode: 0o755 });
    const env = { ...process.env, PATH: `${path.join(directory, 'bin')}:${process.env.PATH}` };
    const run = (...args) =>
      spawnSync(process.execPath, [command, ...args], { cwd: directory, env, encoding: 'utf8' });
    const preview = run('--unit-only', '--plan');
    assert.equal(preview.status, 0, preview.stderr);
    const plan = JSON.parse(preview.stdout);
    assert.deepEqual(plan.unit, [source], 'indexed source exists despite unstaged deletion');
    assert.deepEqual(plan.browser, []);
    assert.equal(plan.static, false);
    assert.equal(existsSync(path.join(directory, '.check-logs')), false);
    writeFileSync(path.join(directory, source), 'unstaged');
    writeFileSync(
      docker,
      `#!/usr/bin/env node
const fs=require('node:fs'),p=require('node:path'); const mount=process.argv[process.argv.indexOf('-v')+1].slice(0,-5); const m=JSON.parse(fs.readFileSync(p.join(mount,'.changed-files.json'))); fs.appendFileSync('runs.jsonl',JSON.stringify({mode:m.mode,bytes:fs.readFileSync(p.join(mount,${JSON.stringify(source)}),'utf8')})+'\\n');`,
      { mode: 0o755 },
    );
    assert.equal(run('--unit-only').status, 0);
    assert.equal(run().status, 0, 'unit success does not cache a static check');
    assert.equal(run('--unit-only').status, 0);
    const runs = readFileSync(path.join(directory, 'runs.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.equal(runs.length, 2);
    assert.equal(runs[0].mode, 'unit');
    assert.equal(runs[1].mode, 'static');
    assert.equal(runs[0].bytes, 'staged');
    writeFileSync(docker, '#!/bin/sh\nexit 3\n', { mode: 0o755 });
    assert.equal(run('--unit-only', '--force').status, 1);
    assert.equal(run('--unit-only').status, 1);
    assert.equal(run().status, 0, 'unit failure cannot invalidate static success');
    assert.equal(git('write-tree'), tree);
    assert.equal(readFileSync(path.join(directory, source), 'utf8'), 'unstaged');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
