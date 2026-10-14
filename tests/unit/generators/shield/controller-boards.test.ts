import { CONTROLLER_BOARDS } from '@catalog/controllers';
import { SHIELD_TARGET } from '@catalog/firmware';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { generateRepositoryFiles } from '@generators/repository';
import { expect, it } from 'vitest';

import { buildUnibodyProject } from '../../../helpers/build-unibody-project';
import { getResultValue } from '../../../helpers/result';

const variants = import.meta.glob<string>('../../../fixtures/generated/controllers/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const baseline = import.meta.glob<string>(
  [
    '../../../fixtures/generated/repository/**/*',
    '../../../fixtures/generated/repository/.github/workflows/*',
  ],
  { query: '?raw', import: 'default', eager: true },
);
function buildBoardProject(board: (typeof CONTROLLER_BOARDS)[number]) {
  const initial = buildUnibodyProject();
  if (board.ble) {
    return { ...initial, controllerId: board.id };
  }
  const layers = initial.layers.map((layer) =>
    layer.id === 'l1'
      ? { ...layer, bindings: { ...layer.bindings, k3: { kind: 'none' as const } } }
      : layer,
  );
  return { ...initial, controllerId: board.id, layers };
}
function expectedFiles(board: (typeof CONTROLLER_BOARDS)[number]) {
  return Object.entries(baseline)
    .filter(([path]) => !path.endsWith('DIFFERENCES.md'))
    .map(([path, content]) => {
      const outputPath = path.replace('../../../fixtures/generated/repository/', '');
      let variantName: string | undefined;
      if (outputPath === 'build.yaml') {
        variantName = 'build.yaml';
      }
      if (outputPath.endsWith('.overlay')) {
        variantName = 'unibody_six.overlay';
      }
      if (!board.ble && outputPath.endsWith('.keymap')) {
        variantName = 'unibody_six.keymap';
      }
      return {
        path: outputPath,
        content:
          variantName === undefined
            ? content
            : variants[`../../../fixtures/generated/controllers/${board.id}/${variantName}`],
      };
    })
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));
}
it.each(CONTROLLER_BOARDS)(
  'matches the complete independent directory for $id deterministically',
  (board) => {
    const project = buildBoardProject(board);
    const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
    const matrix = getResultValue(deriveShieldMatrix(project, target));
    const options = { matrix, target, includeWorkflow: true };
    expect(generateRepositoryFiles(project, options)).toEqual(expectedFiles(board));
    expect(generateRepositoryFiles(project, options)).toEqual(
      generateRepositoryFiles(project, options),
    );
  },
);
