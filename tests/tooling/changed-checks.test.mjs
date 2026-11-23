import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { changedCheckPlan } from '../../scripts/changed-check-plan.mjs';

const exists = () => true;

test('selects units only in the unit stage and never expands browser journeys', () => {
  assert.deepEqual(changedCheckPlan(['src/domain/keys/move.ts'], exists, 'unit').related, [
    'src/domain/keys/move.ts',
  ]);
  assert.deepEqual(changedCheckPlan(['src/domain/keys/move.ts'], exists).browser, []);
  assert.equal(changedCheckPlan(['docs/testing.md'], exists).fullUnit, false);
  assert.deepEqual(changedCheckPlan(['docs/testing.md'], exists).browser, []);
  assert.deepEqual(changedCheckPlan(['tests/e2e/wiring.spec.ts'], exists).browser, []);
});

test('VC-01 static changes never select business/tooling units or browser tests', () => {
  for (const files of [
    ['src/domain/probe.ts'],
    ['package.json'],
    ['scripts/probe.mjs'],
    ['src/deleted.ts'],
  ]) {
    const plan = changedCheckPlan(files, () => !files.includes('src/deleted.ts'));
    assert.equal(plan.static, true);
    assert.equal(plan.fullUnit, false);
    assert.deepEqual(plan.related, []);
    assert.equal(plan.tooling, false);
    assert.deepEqual(plan.browser, []);
  }
});

test('global inputs, deleted files and tooling widen checks', () => {
  for (const file of [
    'package-lock.json',
    'vite.config.ts',
    'tests/fixtures/old.json',
    'src/domain/index.ts',
  ]) {
    assert.equal(changedCheckPlan([file], () => true, 'unit').fullUnit, true, file);
  }
  assert.equal(changedCheckPlan(['src/removed.ts'], () => false, 'unit').fullUnit, true);
  assert.equal(changedCheckPlan(['scripts/check-changes.mjs'], () => true, 'unit').tooling, true);
});

test('snapshot uses staged bytes, includes deleted/renamed paths and preserves working tree/index', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'changed-check-test-'));
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  try {
    git('init', '-q');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    mkdirSync(path.join(directory, 'tests/tooling'), { recursive: true });
    writeFileSync(path.join(directory, 'tests/tooling/probe.test.mjs'), '');
    writeFileSync(path.join(directory, 'probe.txt'), 'original');
    writeFileSync(path.join(directory, 'old.txt'), 'old');
    git('add', '.');
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'initial');
    writeFileSync(path.join(directory, 'probe.txt'), 'staged');
    git('add', 'probe.txt');
    writeFileSync(path.join(directory, 'probe.txt'), 'unstaged');
    git('mv', 'old.txt', 'new.txt');
    const tree = git('write-tree');
    const bin = path.join(directory, 'bin');
    mkdirSync(bin);
    writeFileSync(
      path.join(bin, 'docker'),
      `#!/usr/bin/env node
const fs=require('node:fs'); const p=require('node:path'); const mount=process.argv[process.argv.indexOf('-v')+1].slice(0,-5); fs.writeFileSync(p.join(process.cwd(),'observed.json'),JSON.stringify({manifest:JSON.parse(fs.readFileSync(p.join(mount,'.changed-files.json'))),bytes:fs.readFileSync(p.join(mount,'probe.txt'),'utf8')}));`,
      { mode: 0o755 },
    );
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../../scripts/check-changes.mjs', import.meta.url))],
      {
        cwd: directory,
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const observed = JSON.parse(readFileSync(path.join(directory, 'observed.json'), 'utf8'));
    assert.equal(observed.bytes, 'staged');
    assert.deepEqual(observed.manifest.files.toSorted(), ['new.txt', 'old.txt', 'probe.txt']);
    assert.equal(git('write-tree'), tree);
    assert.equal(readFileSync(path.join(directory, 'probe.txt'), 'utf8'), 'unstaged');
    assert.deepEqual(readdirSync(path.join(directory, '.check-changes')), []);
    // The same index/base reuses the receipt; --force runs the checker again.
    rmSync(path.join(directory, 'observed.json'));
    const command = fileURLToPath(new URL('../../scripts/check-changes.mjs', import.meta.url));
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
    const cached = spawnSync(process.execPath, [command], {
      cwd: directory,
      env,
      encoding: 'utf8',
    });
    assert.equal(cached.status, 0, cached.stderr);
    assert.match(cached.stdout, /Already checked tree/u);
    const forced = spawnSync(process.execPath, [command, '--force'], {
      cwd: directory,
      env,
      encoding: 'utf8',
    });
    assert.equal(forced.status, 0, forced.stderr);
    writeFileSync(path.join(bin, 'docker'), '#!/bin/sh\nexit 3\n', { mode: 0o755 });
    const failed = spawnSync(process.execPath, [command, '--force'], {
      cwd: directory,
      env,
      encoding: 'utf8',
    });
    assert.equal(failed.status, 1);
    const retried = spawnSync(process.execPath, [command], {
      cwd: directory,
      env,
      encoding: 'utf8',
    });
    assert.equal(retried.status, 1, 'failed force run must invalidate an earlier receipt');
    assert.deepEqual(readdirSync(path.join(directory, '.check-changes')), []);
    assert.equal(git('write-tree'), tree);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
