import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { removeKey } from '@domain/keys';
import { reduceProjectHistory } from '@ui/project/logic';
import { buildProject } from '../../../helpers/build-project';

it('undoes and redoes deletion together with the desired assignment', () => {
  const project: Project = {
    ...buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] }),
    routing: {
      matrixStyle: 'existing',
      offsetU: 0.15,
      clearanceU: 0.1,
      fallbackRowIntervalU: 1,
      preferredScope: 'all',
      targetCells: [{ keyId: 'k0', half: 'left', row: 0, col: 0 }],
    },
  };
  const changed = reduceProjectHistory(
    { past: [], present: project, future: [] },
    { kind: 'commit', update: (current) => removeKey(current, { keyId: 'k0' }) },
  );
  expect(changed.present.routing?.targetCells).toEqual([]);
  const undone = reduceProjectHistory(changed, { kind: 'undo' });
  expect(undone.present).toBe(project);
  expect(reduceProjectHistory(undone, { kind: 'redo' }).present).toBe(changed.present);
});
