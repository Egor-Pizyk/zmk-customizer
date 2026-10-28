import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { regenerateWiring } from '@domain/wiring/editing';
import { validateSchematic } from '@domain/validation';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { UNIBODY_PRESET } from '../../../../helpers/unibody-preset';
import { getResultValue } from '../../../../helpers/result';

it('keeps the complete routed matrix exportable with its original scan configuration', () => {
  const board = getControllerBoard(UNIBODY_PRESET.controllerId);
  const target = { ...board, boardId: board.id };
  const source = getResultValue(deriveShieldMatrix(UNIBODY_PRESET, target));
  const candidate = getResultValue(
    regenerateWiring(UNIBODY_PRESET, {
      board,
      limits: ZMK_LIMITS,
      scope: { kind: 'all' },
      settings: {
        matrixStyle: 'symmetric-bus',
        offsetU: 0.15,
        clearanceU: 0.1,
        fallbackRowIntervalU: 1,
        preferredScope: 'all',
      },
    }),
  ).project;
  expect(validateSchematic(candidate)).toEqual([]);
  expect(getResultValue(deriveShieldMatrix(candidate, target))).toEqual({
    ...source,
    kind: 'matrix',
  });
});
