import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { PROJECT_ROOT } from '../../scripts/module-imports.mjs';

test('Oxlint rejects private imports and re-exports but accepts module APIs', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'zmk-module-lint-'));
  const file = path.join(directory, 'probe.ts');
  try {
    for (const [source, valid] of [
      ["export { addKey } from '@domain';", true],
      ["export { addKey } from '@domain/keys/add-key';", false],
      ["import { addKey } from '@domain/keys/add-key'; export const add = addKey;", false],
      ["export const load = () => import('@domain/keys/add-key');", false],
      ["export type Input = import('/src/domain/types').Project;", false],
      ["export type Input = import('@domain').Project;", true],
    ]) {
      writeFileSync(file, source);
      const result = spawnSync(
        path.join(PROJECT_ROOT, 'node_modules/.bin/oxlint'),
        ['--disable-typescript-plugin', '-c', path.join(PROJECT_ROOT, '.oxlintrc.json'), file],
        { encoding: 'utf8', cwd: PROJECT_ROOT },
      );
      assert.equal(result.status, valid ? 0 : 1, result.stdout + result.stderr);
      if (!valid) assert.match(result.stdout + result.stderr, /modules\(public-api\)/u);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
