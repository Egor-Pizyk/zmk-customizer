import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { regenerateWiring } from '@domain/wiring/editing';
import { serializeProject, parseProjectFile } from '@storage/project';
import { buildProject } from '../../../helpers/build-project';
import { getResultValue } from '../../../helpers/result';

it('round-trips generated buses and explicit junctions through the real project schema', () => {
  const project = getResultValue(
    regenerateWiring(
      buildProject({
        keys: [
          { id: 'k0', xU: 0, yU: 0 },
          { id: 'k1', xU: 1, yU: 0 },
        ],
      }),
      {
        board: getControllerBoard('nice_nano_v2'),
        limits: ZMK_LIMITS,
        scope: { kind: 'all' },
        settings: {
          matrixStyle: 'symmetric-bus',
          offsetU: 0.15,
          clearanceU: 0.1,
          fallbackRowIntervalU: 1,
          preferredScope: 'all',
        },
      },
    ),
  ).project;
  const serialized = serializeProject(project);
  getResultValue(serialized);
  expect(getResultValue(parseProjectFile(getResultValue(serialized)))).toEqual(project);
});
