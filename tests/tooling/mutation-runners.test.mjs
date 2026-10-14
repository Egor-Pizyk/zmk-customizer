import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { runCommand, withSourceMutation } from '../../scripts/mutation-runner.mjs';
import { assertUnitDetection } from '../../scripts/check-test-mutations.mjs';
import { assertBrowserDetection } from '../../scripts/check-e2e-mutations.mjs';

function withFile(run) {
  const directory = mkdtempSync(path.join(tmpdir(), 'zmk-mutation-contract-'));
  const file = path.join(directory, 'source.ts');
  const original = Buffer.concat([Buffer.from([255]), Buffer.from('anchor anchor\r\n')]);
  writeFileSync(file, original);
  try {
    run(file, original);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('mutation replaces only the first bytes and restores the exact original on success', () => {
  withFile((file, original) => {
    const result = withSourceMutation(file, { anchor: 'anchor', replacement: 'changed' }, () => {
      assert.deepEqual(
        readFileSync(file),
        Buffer.concat([Buffer.from([255]), Buffer.from('changed anchor\r\n')]),
      );
      return 42;
    });
    assert.equal(result, 42);
    assert.deepEqual(readFileSync(file), original);
  });
});

test('runner failure still restores bytes; concurrent edits are preserved and rejected', () => {
  withFile((file, original) => {
    assert.throws(
      () =>
        withSourceMutation(file, { anchor: 'anchor', replacement: '' }, () => {
          throw new Error('runner failure');
        }),
      /runner failure/u,
    );
    assert.deepEqual(readFileSync(file), original);
    assert.throws(
      () =>
        withSourceMutation(file, { anchor: 'anchor', replacement: '' }, () => {
          writeFileSync(file, 'concurrent edit');
        }),
      /refusing to overwrite/u,
    );
    assert.equal(readFileSync(file, 'utf8'), 'concurrent edit');
  });
});

test('missing and non-unique browser anchors stop before running or changing source', () => {
  withFile((file, original) => {
    for (const options of [
      { anchor: 'missing', replacement: '' },
      { anchor: 'anchor', replacement: '', unique: true },
    ]) {
      assert.throws(() => withSourceMutation(file, options, () => assert.fail('must not run')));
      assert.deepEqual(readFileSync(file), original);
    }
  });
});

test('unit runner accepts failed assertions but rejects green runs and runner-only failures', () => {
  const failed = { status: 'failed', fullName: 'observable behavior' };
  const report = { testResults: [{ assertionResults: [failed, { status: 'passed' }] }] };
  assert.deepEqual(assertUnitDetection(report, 1, 'seed'), [failed]);
  assert.throws(() => assertUnitDetection(report, 0, 'seed'), /not detected/u);
  assert.throws(() => assertUnitDetection({ testResults: [] }, 1, 'seed'), /not detected/u);
});

test('browser runner requires the intended assertion in a failed result and no runner errors', () => {
  const result = { status: 'failed', errors: [{ message: 'expect(actual).toEqual(expected)' }] };
  const report = { suites: [{ suites: [{ specs: [{ tests: [{ results: [result] }] }] }] }] };
  assert.doesNotThrow(() => assertBrowserDetection(report, 1, 'seed', 'toEqual'));
  assert.throws(() => assertBrowserDetection(report, 0, 'seed', 'toEqual'));
  assert.throws(() => assertBrowserDetection(report, 1, 'seed', 'toBeVisible'));
  assert.throws(
    () => assertBrowserDetection({ ...report, errors: [{}] }, 1, 'seed', 'toEqual'),
    /runner failure/u,
  );
  result.status = 'timedOut';
  assert.throws(() => assertBrowserDetection(report, 1, 'seed', 'toEqual'));
});

test('command runner preserves nonzero results and surfaces timeouts', () => {
  const result = runCommand(
    process.execPath,
    ['-e', "process.stdout.write('result'); process.exitCode = 2;"],
    { cwd: tmpdir() },
  );
  assert.equal(result.status, 2);
  assert.equal(result.stdout, 'result');
  assert.throws(
    () =>
      runCommand(process.execPath, ['-e', 'setTimeout(() => {}, 10000);'], {
        cwd: tmpdir(),
        timeout: 100,
      }),
    /ETIMEDOUT/u,
  );
});
