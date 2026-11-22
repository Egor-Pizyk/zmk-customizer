import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runCommand, withSourceMutation } from './mutation-runner.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MUTATIONS = [
  [
    'cross-family pin retention',
    'src/domain/project/change-controller.ts',
    'previous.family === next.family && next.gpioPins.includes(end.boardPin)',
    'next.gpioPins.includes(end.boardPin)',
    ['tests/unit/domain/project/change-controller.test.ts'],
  ],
  [
    'lost same-family pin retention',
    'src/domain/project/change-controller.ts',
    'previous.family === next.family && next.gpioPins.includes(end.boardPin)',
    'false',
    ['tests/unit/domain/project/change-controller.test.ts'],
  ],
  [
    'deleted key keeps layer bindings',
    'src/domain/keys/remove-key.ts',
    'keyId !== input.keyId',
    'true',
    ['tests/unit/domain/keys/remove-key.test.ts'],
  ],
  [
    'undo restores current state',
    'src/ui/project/logic/project-history.ts',
    'present: previous,',
    'present: history.present,',
    ['tests/unit/ui/project/logic/project-history.test.ts'],
  ],
  [
    'new edit retains redo history',
    'src/ui/project/logic/project-history.ts',
    'present, future: []',
    'present, future: history.future',
    ['tests/unit/ui/project/logic/project-history.test.ts'],
  ],
  [
    'keymap shifts layer target',
    'src/generators/keymap/render-binding.ts',
    'project.layers.findIndex((layer) => layer.id === binding.layerId)',
    'project.layers.findIndex((layer) => layer.id === binding.layerId) + 1',
    ['tests/unit/generators/shield/generate-shield-files.test.ts'],
  ],
  [
    'export ignores validation',
    'src/ui/export/logic/get-export-preview.ts',
    'issues.length === 0 && matrix.ok',
    'matrix.ok',
    ['tests/unit/ui/export/logic/get-export-preview.test.ts'],
  ],
  [
    'controller select loses change handler',
    'src/ui/schematic/wiring/components/controller-panel.tsx',
    'onChange={handleChange}',
    'onChange={() => {}}',
    ['tests/unit/ui/integration/app.test.ts'],
  ],
  [
    'reverse diode button loses handler',
    'src/ui/schematic/parts/components/diode-controls.tsx',
    'onClick={handleReverse}',
    'onClick={() => {}}',
    ['tests/unit/ui/integration/app.test.ts'],
  ],
  [
    'explicit shield name ignored',
    'src/domain/project/get-shield-name.ts',
    'project.shieldName ?? toShieldName(project.name)',
    'toShieldName(project.name)',
    ['tests/unit/domain/project/get-shield-name.test.ts'],
  ],
  [
    'backup discard leaves damaged bytes',
    'src/storage/project/project-storage.ts',
    'localStorage.removeItem(PROJECT_BACKUP_STORAGE_KEY);',
    '',
    ['tests/unit/ui/integration/app-storage.test.tsx'],
  ],
  [
    'imprecise entity IDs',
    'src/domain/project/create-entity-id.ts',
    'BigInt(suffix)',
    'BigInt(Number(suffix))',
    [
      'tests/unit/domain/project/create-entity-id.test.ts',
      'tests/unit/storage/project/project-file.test.ts',
    ],
  ],
  [
    'stale imports replace newest request',
    'src/ui/project/logic/import-session.ts',
    "return 'superseded';",
    "return 'current';",
    ['tests/unit/ui/integration/app-project-files.test.ts'],
  ],
  [
    'import overwrites edited project',
    'src/ui/project/logic/import-session.ts',
    "token.revision === revision ? 'current' : 'changed'",
    "'current'",
    ['tests/unit/ui/integration/app-project-files.test.ts'],
  ],
  [
    'empty move destroys redo',
    'src/domain/keys/move-keys.ts',
    '? project',
    '? { ...project }',
    ['tests/unit/ui/state/project-noops.test.ts'],
  ],
  [
    'identical bends creates a new project',
    'src/domain/wires/editing/set-wire-bends.ts',
    '? project',
    '? { ...project }',
    ['tests/unit/domain/wires/editing/set-wire-bends.test.ts'],
  ],
  [
    'geometry argument stack overflow',
    'src/domain/geometry/find-key-layout-center.ts',
    'return {',
    'Math.max(...project.keys.map(key => key.xU)); return {',
    ['tests/unit/domain/geometry/find-key-layout-center.test.ts'],
  ],
  [
    'oversized wire bends accepted',
    'src/storage/project/project-schema.ts',
    '.max(PROJECT_BUDGET.bendsPerWire)',
    '',
    ['tests/unit/storage/project/project-budget.test.ts'],
  ],
  [
    'invalid project mislabeled as unavailable',
    'src/storage/project/project-storage.ts',
    "error: { kind: 'invalid-project', reason: serialized.error }",
    "error: { kind: 'storage-unavailable' }",
    ['tests/unit/ui/integration/app-storage.test.tsx'],
  ],
  [
    'incompatible draft accepts hold key',
    'src/ui/bindings/picker/logic/pick-value.ts',
    "draft.behaviorId !== 'mt'",
    'false',
    ['tests/unit/ui/bindings/picker/logic/pick-slot.test.ts'],
  ],
  [
    'layout rotation reversed',
    'src/domain/geometry/rotate-point.ts',
    '(input.rotationDeg * Math.PI)',
    '(-input.rotationDeg * Math.PI)',
    ['tests/unit/domain/wires/geometry/get-key-pin-position.test.ts'],
  ],
  [
    'layout export loses width',
    'src/generators/shield/generate-overlay.ts',
    'geometry.widthU,',
    '1,',
    ['tests/unit/generators/shield/layout-export.test.ts'],
  ],
  [
    'duplicate loses layer bindings',
    'src/domain/keys/paste-keys.ts',
    'bindings[copy.id] = binding;',
    '',
    ['tests/unit/domain/keys/duplicate-keys.test.ts'],
  ],
  [
    'geometry no-op destroys redo',
    'src/domain/keys/set-key-geometries.ts',
    '? project',
    '? { ...project }',
    ['tests/unit/ui/state/layout-noops.test.ts'],
  ],
  [
    'pointer resize loses fixed anchor',
    'src/domain/geometry/transforms/resize-key-from-pointer.ts',
    'input.direction.x === -1 ? geometry.widthU - widthU : 0',
    '0',
    ['tests/unit/domain/geometry/transforms/resize-key-from-pointer.test.ts'],
  ],
  [
    'pointer rotation loses center pivot',
    'src/domain/geometry/transforms/rotate-key-from-pointer.ts',
    'rotationOriginXU: center.xU',
    'rotationOriginXU: 0',
    ['tests/unit/domain/geometry/transforms/rotate-key-from-pointer.test.ts'],
  ],
  [
    'pointer release accepts overlap',
    'src/domain/geometry/transforms/transform-key-from-pointer.ts',
    "input.phase === 'commit'",
    'false',
    [
      'tests/unit/domain/geometry/transforms/transform-key-from-pointer.test.ts',
      'tests/unit/ui/integration/app-key-transforms.test.ts',
    ],
  ],
  [
    'cancelled numeric geometry resurfaces',
    'src/ui/components/components/number-input.tsx',
    '        setDraft(undefined);',
    '',
    ['tests/unit/ui/integration/app-switch-size.test.ts'],
  ],
  [
    'numeric editing loses committed geometry',
    'src/ui/schematic/parts/components/key-position-cells.tsx',
    'commitPosition(commit, { schematicKey, field, value });',
    '',
    ['tests/unit/ui/integration/app-switch-size.test.ts'],
  ],
];

export function assertUnitDetection(report, status, label) {
  const failures = report.testResults.flatMap((suite) =>
    suite.assertionResults.filter((test) => test.status === 'failed'),
  );
  if (status === 0 || failures.length === 0) {
    throw new Error(`Regression not detected by assertions: ${label}`);
  }
  return failures;
}

export function runMutation(mutation, reportPath) {
  const [label, relative, anchor, replacement, tests] = mutation;
  const file = path.join(ROOT, relative);
  const result = withSourceMutation(file, { anchor, replacement }, () => {
    rmSync(reportPath, { force: true });
    return runCommand(
      'docker',
      [
        'compose',
        '-p',
        'zmk-customizer',
        '-f',
        'infra/compose.yaml',
        'run',
        '--rm',
        'app',
        'npm',
        'exec',
        '--',
        'vitest',
        'run',
        ...tests,
        '--reporter=json',
        `--outputFile=${path.relative(ROOT, reportPath)}`,
      ],
      { cwd: ROOT, timeout: 120_000 },
    );
  });
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  let failures;
  try {
    failures = assertUnitDetection(report, result.status, label);
  } catch (error) {
    throw new Error(`${error.message}\n${result.stdout}\n${result.stderr}`, { cause: error });
  }
  process.stdout.write(`Detected: ${label} (${failures.length} failing tests)\n`);
  return { label, status: result.status, failures: failures.map((test) => test.fullName) };
}

export function main() {
  const directory = mkdtempSync(path.join(ROOT, '.test-mutations-'));
  const results = [];
  try {
    for (const mutation of MUTATIONS) {
      results.push(runMutation(mutation, path.join(directory, 'result.json')));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  process.stdout.write(
    `Detected ${MUTATIONS.length}/${MUTATIONS.length} seeded regressions; original files restored.\n`,
  );
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main();
