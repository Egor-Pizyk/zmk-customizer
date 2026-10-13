import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkSource } from '../../scripts/check-architecture.mjs';
const cases = JSON.parse(
  readFileSync(new URL('../fixtures/architecture/cases.json', import.meta.url), 'utf8'),
);
for (const [index, fixture] of cases.entries()) {
  test(`${index}: ${fixture.file} ${fixture.diagnostic ?? 'allowed'}`, () => {
    const diagnostics = checkSource(fixture.file, fixture.code);
    if (fixture.diagnostic === null) {
      assert.deepEqual(diagnostics, []);
    } else {
      assert.ok(
        diagnostics.some((issue) => issue.rule === fixture.diagnostic),
        JSON.stringify(diagnostics),
      );
    }
  });
}
