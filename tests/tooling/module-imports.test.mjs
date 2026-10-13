import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkModuleImport, resolveProjectImport } from '../../scripts/module-imports.mjs';

const cases = [
  ['src/ui/schematic/schematic-workspace.tsx', '@domain', undefined],
  ['src/ui/schematic/schematic-workspace.tsx', '@domain/keys/add-key', 'public-api'],
  ['tests/unit/domain/keys/add-key.test.ts', '../../../../src/domain/keys/add-key', 'public-api'],
  ['src/ui/schematic/schematic-workspace.tsx', '../../domain/index', 'module-alias'],
  ['src/domain/keys/add-key.ts', '../project/create-entity-id', undefined],
  ['src/domain/keys/add-key.ts', '@domain', 'self-import'],
  ['src/domain/index.ts', './keys/add-key', undefined],
  ['src/main.tsx', './styles.css', undefined],
  ['src/catalog/bindings/keycodes.ts', '../zmk/keys.h?raw', undefined],
  [
    'tests/unit/catalog/bindings/keycodes.test.ts',
    '../../../../src/catalog/zmk/keys.h?raw',
    undefined,
  ],
  ['src/ui/schematic/schematic-workspace.tsx', 'react', undefined],
  ['tests/unit/domain/keys/add-key.test.ts', '/src/domain/keys/add-key.ts', 'public-api'],
  ['src/ui/schematic/schematic-workspace.tsx', '../../domain/index.js', 'module-alias'],
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
