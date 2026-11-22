import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { focusedCheckPlan } from '../../scripts/focused-check-plan.mjs';

const exists = () => true;
test('Parts diagnostics include cross-cutting journeys and explain smaller selection', () => {
  const plan = focusedCheckPlan(['src/ui/schematic/parts/components/parts-list.tsx'], exists);
  assert.notDeepEqual(plan.browser, ['tests/e2e']);
  for (const file of [
    'encoders',
    'onboarding-accessibility',
    'onboarding-keyboard',
    'accessibility',
    'product',
  ]) {
    assert.ok(plan.browser.includes(`tests/e2e/${file}.spec.ts`), file);
  }
  assert.ok(plan.reasons.some((reason) => /Parts|parts/u.test(reason)));
  assert.deepEqual(plan.browser, [...new Set(plan.browser)].toSorted());
});
test('unknown/global/shared/deleted changes stay broad; changed specs are included', () => {
  for (const file of [
    'src/ui/unknown/view.tsx',
    'src/styles.css',
    'package-lock.json',
    'tests/helpers/render-app.tsx',
    'tests/e2e/helpers.ts',
    'tests/e2e/parts-fixture.ts',
    'src/domain/keys/move-key.ts',
  ]) {
    assert.deepEqual(focusedCheckPlan([file], exists).browser, ['tests/e2e'], file);
  }
  assert.deepEqual(focusedCheckPlan(['src/ui/schematic/parts/removed.tsx'], () => false).browser, [
    'tests/e2e',
  ]);
  const plan = focusedCheckPlan(
    ['src/ui/shell/components/project-bar.tsx', 'tests/e2e/custom.spec.ts'],
    exists,
  );
  assert.ok(plan.browser.includes('tests/e2e/custom.spec.ts'));
  assert.ok(plan.browser.includes('tests/e2e/kle-import.spec.ts'));
  assert.deepEqual(focusedCheckPlan(['docs/commands.md'], exists).browser, []);
  assert.deepEqual(
    focusedCheckPlan(['src/ui/schematic/parts/a.tsx'], (file) => !file.startsWith('tests/e2e/'))
      .browser,
    ['tests/e2e'],
  );
  assert.deepEqual(focusedCheckPlan(['src/ui/schematic/parts/a.tsx'], () => false).browser, [
    'tests/e2e',
  ]);
});

test('plan uses the staged tree without Docker; focus cache cannot satisfy final checks', () => {
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
    const preview = run('--focus', '--plan');
    assert.equal(preview.status, 0, preview.stderr);
    const plan = JSON.parse(preview.stdout);
    assert.ok(
      plan.browser.includes('tests/e2e/encoders.spec.ts'),
      'indexed file exists despite unstaged deletion',
    );
    assert.equal(existsSync(path.join(directory, '.check-logs')), false);
    writeFileSync(path.join(directory, source), 'unstaged');
    writeFileSync(
      docker,
      `#!/usr/bin/env node
const fs=require('node:fs'),p=require('node:path'); const mount=process.argv[process.argv.indexOf('-v')+1].slice(0,-5); const m=JSON.parse(fs.readFileSync(p.join(mount,'.changed-files.json'))); fs.appendFileSync('runs.jsonl',JSON.stringify({mode:m.mode,bytes:fs.readFileSync(p.join(mount,${JSON.stringify(source)}),'utf8')})+'\\n');`,
      { mode: 0o755 },
    );
    assert.equal(run('--focus').status, 0);
    assert.equal(run().status, 0, 'focus success does not cache a final check');
    assert.equal(run('--focus').status, 0);
    const runs = readFileSync(path.join(directory, 'runs.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.equal(runs.length, 2);
    assert.equal(runs[0].mode, 'focus');
    assert.equal(runs[0].bytes, 'staged');
    writeFileSync(docker, '#!/bin/sh\nexit 3\n', { mode: 0o755 });
    assert.equal(run('--focus', '--force').status, 1);
    assert.equal(run('--focus').status, 1);
    assert.equal(run().status, 0, 'focus failure cannot invalidate final success');
    assert.equal(git('write-tree'), tree);
    assert.equal(readFileSync(path.join(directory, source), 'utf8'), 'unstaged');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
