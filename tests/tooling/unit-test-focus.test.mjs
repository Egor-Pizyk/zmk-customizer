import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unitFocusCommand } from '../../scripts/unit-test-focus.mjs';

const exists = () => true;
test('VC-05 app diagnosis names an explicit test file and preserves the test filter', () => {
  assert.deepEqual(
    unitFocusCommand(['tests/unit/domain/wiring.test.ts', '-t', 'allocates pins'], exists),
    {
      command: 'npx',
      args: [
        '--no-install',
        'vitest',
        'run',
        'tests/unit/domain/wiring.test.ts',
        '-t',
        'allocates pins',
      ],
    },
  );
});
test('VC-05 tooling diagnosis uses Node test runner rather than Vitest', () => {
  assert.deepEqual(
    unitFocusCommand(['tests/tooling/checks.test.mjs', '-t', 'staged bytes'], exists),
    {
      command: process.execPath,
      args: ['--test', '--test-name-pattern', 'staged bytes', 'tests/tooling/checks.test.mjs'],
    },
  );
});
test('VC-05 no target, missing files, mixed runners and broad/unknown options fail before execution', () => {
  for (const args of [
    [],
    ['-t', 'only a name'],
    ['src/domain/wiring.ts'],
    ['tests/unit/a.test.ts', 'tests/tooling/a.test.mjs'],
    ['--all'],
    ['tests/unit/a.test.ts', '-t'],
  ]) {
    assert.throws(() => unitFocusCommand(args, exists));
  }
  assert.throws(() => unitFocusCommand(['tests/unit/a.test.ts'], () => false));
});

test('VC-05 an explicit application module directory stays bounded', () => {
  assert.deepEqual(
    unitFocusCommand(['tests/unit/domain/wiring'], exists, () => true),
    {
      command: 'npx',
      args: ['--no-install', 'vitest', 'run', 'tests/unit/domain/wiring'],
    },
  );
});
