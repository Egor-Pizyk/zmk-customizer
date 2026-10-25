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

test('UI folder grouping ignores indexes and keeps TS logic separate from JSX', async () => {
  const { checkUiFolderLayout } = await import('../../scripts/check-architecture.mjs');
  assert.deepEqual(
    checkUiFolderLayout([
      'src/ui/canvas/logic/snap.ts',
      'src/ui/canvas/logic/index.ts',
      'src/ui/canvas/components/work-surface.tsx',
      'src/ui/canvas/components/index.ts',
      'src/domain/types.ts',
    ]),
    [],
  );
  assert.equal(
    checkUiFolderLayout(['src/ui/canvas/snap.ts', 'src/ui/canvas/work-surface.tsx'])[0]?.rule,
    'ui-folder-layout',
  );
  assert.equal(
    checkUiFolderLayout(['src/ui/canvas/logic/work-surface.tsx'])[0]?.rule,
    'ui-folder-layout',
  );
  assert.equal(
    checkUiFolderLayout(['src/ui/canvas/components/snap.ts'])[0]?.rule,
    'ui-folder-layout',
  );
});

test('onboarding shared contract keeps workspace and app implementations private', () => {
  assert.deepEqual(
    checkSource(
      'src/ui/export/components/probe.tsx',
      "import { getOnboardingContent } from '@ui/onboarding/logic';",
    ),
    [],
  );
  for (const code of [
    "import { SchematicWorkspace } from '@ui/schematic/components';",
    "import { App } from '@ui/app/components';",
  ]) {
    assert.ok(
      checkSource('src/ui/onboarding/logic/probe.ts', code).some(
        (issue) => issue.rule === 'layer-import',
      ),
    );
  }
});
