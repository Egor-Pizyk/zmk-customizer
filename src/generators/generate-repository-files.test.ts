import { expect, it } from 'vitest';
import { buildUnibodyProject } from '../../tests/helpers/build-unibody-project';
import { getResultValue } from '../../tests/helpers/result';
import { SHIELD_TARGET } from '../catalog/shield-target';
import { deriveShieldMatrix } from '../domain/derive-shield-matrix';
import { generateRepositoryFiles } from './generate-repository-files';

const root = '../../tests/fixtures/generated/repository/';
const goldenFiles = import.meta.glob<string>(
  [
    '../../tests/fixtures/generated/repository/**/*',
    '../../tests/fixtures/generated/repository/.github/workflows/*',
  ],
  { query: '?raw', import: 'default', eager: true },
);
function expected() {
  return Object.entries(goldenFiles)
    .filter(([path]) => !path.endsWith('DIFFERENCES.md'))
    .map(([path, content]) => ({ path: path.slice(root.length), content }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));
}
function generate(includeWorkflow: boolean) {
  const project = buildUnibodyProject();
  const matrix = getResultValue(deriveShieldMatrix(project, SHIELD_TARGET));
  return generateRepositoryFiles(project, { matrix, target: SHIELD_TARGET, includeWorkflow });
}
it('matches independent complete repository paths and every byte of text', () => {
  expect(generate(true)).toEqual(expected());
  expect(generate(true)).toHaveLength(10);
});
it('omits only workflow when unchecked and never includes shield user conf', () => {
  expect(generate(false)).toEqual(expected().filter((file) => !file.path.startsWith('.github/')));
  expect(
    generate(false).some((file) => file.path === 'boards/shields/unibody_six/unibody_six.conf'),
  ).toBe(false);
});
it('uses current project shield name without changing inputs or pinned target', () => {
  const project = { ...buildUnibodyProject(), shieldName: 'custom_pad' };
  const before = structuredClone(project);
  const matrix = getResultValue(deriveShieldMatrix(project, SHIELD_TARGET));
  const files = generateRepositoryFiles(project, {
    matrix,
    target: SHIELD_TARGET,
    includeWorkflow: true,
  });
  expect(files.find((file) => file.path === 'build.yaml')?.content).toContain('shield: custom_pad');
  expect(files.some((file) => file.path === 'config/custom_pad.keymap')).toBe(true);
  expect(files.find((file) => file.path === 'config/west.yml')?.content).toContain(
    'revision: v0.3',
  );
  expect(project).toEqual(before);
});
