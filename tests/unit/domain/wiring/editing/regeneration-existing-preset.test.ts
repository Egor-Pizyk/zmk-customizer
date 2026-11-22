import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { regenerateWiring } from '@domain/wiring/editing';
import { getRoutingSettings } from '@domain/wiring';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { UNIBODY_PRESET } from '../../../../helpers/unibody-preset';
import { getResultValue } from '../../../../helpers/result';

it('retains intentional same-bus contacts when regenerating an existing-style preset', () => {
  const source = UNIBODY_PRESET;
  const board = getControllerBoard(source.controllerId);
  const before = getResultValue(deriveShieldMatrix(source, { ...board, boardId: board.id }));
  const result = regenerateWiring(source, {
    board,
    settings: getRoutingSettings(source),
    limits: ZMK_LIMITS,
    scope: { kind: 'all' },
  });
  expect(result.ok).toBe(true);
  const candidate = getResultValue(result).project;
  expect(getResultValue(deriveShieldMatrix(candidate, { ...board, boardId: board.id }))).toEqual({
    ...before,
    kind: 'matrix',
  });
  expect(candidate.keys).toEqual(source.keys);
});
