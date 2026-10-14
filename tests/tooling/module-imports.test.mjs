import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkModuleImport, resolveProjectImport } from '../../scripts/module-imports.mjs';

const cases = [
  ['src/ui/schematic/components/schematic-workspace.tsx', '@domain', undefined],
  ['src/ui/schematic/components/schematic-workspace.tsx', '@domain/keys/add-key', 'public-api'],
  ['tests/unit/domain/keys/add-key.test.ts', '../../../../src/domain/keys/add-key', 'public-api'],
  ['src/ui/schematic/components/schematic-workspace.tsx', '../../../domain/index', 'module-alias'],
  ['src/domain/keys/add-key.ts', '../project/create-entity-id', 'public-api'],
  ['src/domain/keys/add-key.ts', '@domain', undefined],
  ['src/domain/index.ts', './keys/add-key', 'public-api'],
  ['src/main.tsx', './styles.css', undefined],
  ['src/catalog/bindings/keycodes.ts', '../zmk/keys.h?raw', undefined],
  [
    'tests/unit/catalog/bindings/keycodes.test.ts',
    '../../../../src/catalog/zmk/keys.h?raw',
    undefined,
  ],
  ['src/ui/schematic/components/schematic-workspace.tsx', 'react', undefined],
  ['tests/unit/domain/keys/add-key.test.ts', '/src/domain/keys/add-key.ts', 'public-api'],
  [
    'src/ui/schematic/components/schematic-workspace.tsx',
    '../../../domain/index.js',
    'module-alias',
  ],
];
for (const [file, specifier, expected] of cases) {
  test(`${file}: ${specifier}`, () => {
    assert.equal(checkModuleImport(file, specifier)?.rule, expected);
  });
}
test('aliases resolve to the same public file as the compiler', () => {
  assert.equal(
    resolveProjectImport('src/ui/export/get-export-preview.ts', '@generators'),
    'src/generators/index.ts',
  );
});

test('nested groups own their files and reject their own barrel', () => {
  assert.equal(
    checkModuleImport('src/domain/keys/add-key.ts', '@domain/keys')?.rule,
    'self-import',
  );
  assert.equal(checkModuleImport('src/domain/keys/add-key.ts', '@domain/project'), undefined);
  assert.equal(
    checkModuleImport(
      'src/ui/schematic/parts/components/parts-list.tsx',
      '../../interaction/read-canvas-hit',
    )?.rule,
    'public-api',
  );
  assert.equal(
    resolveProjectImport('src/ui/export/get-export-preview.ts', '@generators/shield'),
    'src/generators/shield/index.ts',
  );
});

test('UI logic and components have independent public entries', () => {
  assert.equal(
    resolveProjectImport('src/main.tsx', '@ui/canvas/logic'),
    'src/ui/canvas/logic/index.ts',
  );
  assert.equal(
    resolveProjectImport('src/main.tsx', '@ui/canvas/components'),
    'src/ui/canvas/components/index.ts',
  );
  assert.equal(
    checkModuleImport('src/ui/canvas/components/work-surface.tsx', '@ui/canvas/logic'),
    undefined,
  );
  assert.equal(
    checkModuleImport('src/ui/canvas/logic/snap.ts', '@ui/canvas/logic')?.rule,
    'self-import',
  );
  assert.equal(
    checkModuleImport('src/ui/canvas/components/work-surface.tsx', '../logic/snap')?.rule,
    'public-api',
  );
});
