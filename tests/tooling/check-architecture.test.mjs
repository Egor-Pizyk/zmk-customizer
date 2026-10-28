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

const diagramLogic = 'src/ui/schematic/diagram/logic/create-diagram.ts';
test('JointJS core is confined to the private Schematic adapter', () => {
  assert.deepEqual(checkSource(diagramLogic, "import { dia } from '@joint/core';"), []);
  for (const file of [
    'src/domain/probe.ts',
    'src/catalog/probe.ts',
    'src/storage/probe.ts',
    'src/generators/probe.ts',
    'src/ui/bindings/probe.ts',
    'src/ui/schematic/diagram/components/probe.tsx',
    'src/ui/schematic/interaction/probe.ts',
  ]) {
    assert.ok(
      checkSource(file, "import { dia } from '@joint/core';").some(
        (issue) => issue.rule === 'external-import',
      ),
      file,
    );
  }
  for (const target of ['@joint/core/src/dia/Graph', '@joint/core/dist/joint.js', '@joint/plus']) {
    assert.ok(
      checkSource(diagramLogic, `import * as core from '${target}';`).some(
        (issue) => issue.rule === 'external-import',
      ),
      target,
    );
  }
});

test('routing protection exposes only its safe wire operations and provider commit guard', () => {
  const sourceByFile = {
    'src/domain/wires/protection/index.ts': [
      "export { validateWireProtection } from './validate-wire-protection.ts';",
      "export { getWireProtection } from './get-wire-protection.ts';",
      "export { setWireLocked } from './set-wire-locked.ts';",
    ].join('\n'),
  };
  const options = { loadSource: (file) => sourceByFile[file] };
  assert.deepEqual(
    checkSource(
      'src/ui/project/logic/project-state.ts',
      "import { validateWireProtection } from '@domain/wires/protection';",
      options,
    ),
    [],
  );
  for (const name of ['getWireProtection', 'setWireLocked']) {
    assert.deepEqual(
      checkSource(
        'src/ui/schematic/parts/components/probe.tsx',
        `import { ${name} } from '@domain/wires/protection';`,
        options,
      ),
      [],
    );
  }
  assert.ok(
    checkSource(
      'src/ui/schematic/parts/components/probe.tsx',
      "import { validateWireProtection } from '@domain/wires/protection';",
      options,
    ).some((issue) => issue.rule === 'layer-import'),
  );
});

test('inline worker query suffixes retain engine and pure-layer boundaries', () => {
  for (const module of ['@domain/wires/nets', '@domain/wires/contacts', '@domain/wiring/matrix']) {
    assert.ok(
      checkSource(
        'src/ui/schematic/wiring/logic/wiring-worker.ts',
        `import * as engine from '${module}?worker&inline';`,
      ).some((issue) => issue.rule === 'layer-import'),
    );
  }
  assert.ok(
    checkSource(
      'src/domain/wiring/editing/probe.ts',
      'const worker = new Worker("routing.js");',
    ).some((issue) => issue.rule === 'purity'),
  );
  assert.ok(
    checkSource(
      'src/ui/schematic/wiring/logic/wiring-worker.ts',
      "import { dia } from '@joint/core';",
    ).some((issue) => issue.rule === 'external-import'),
  );
});

test('cached project analysis has one provider-owned bridge after extracting history composition', () => {
  assert.deepEqual(
    checkSource(
      'src/ui/project/logic/project-analysis.ts',
      "import { analyzeProject } from '@domain/analysis';",
    ),
    [],
  );
  assert.ok(
    checkSource(
      'src/ui/schematic/wiring/logic/probe.ts',
      "import { analyzeProject } from '@domain/analysis';",
    ).some((issue) => issue.rule === 'layer-import'),
  );
});
