import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { createWiringProposal } from '@domain/wiring/editing';
import { buildProject } from '../../../../helpers/build-project';

const PROJECT = buildProject({ keys: [{ id: 'a', xU: 0, yU: 0 }] });
const EDIT = {
  kind: 'regenerate',
  board: getControllerBoard('nice_nano_v2'),
  input: {
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
} as const;

it('prepares an atomic read-only regeneration proposal with wire, diode and settings changes', () => {
  const result = createWiringProposal(PROJECT, [EDIT]);
  expect(result.kind).toBe('changed');
  expect(result).toMatchObject({
    source: JSON.stringify(PROJECT),
    summary: {
      settingsChanged: true,
      diodeKeyIds: ['a'],
      unconnectedPins: [],
      wireChanges: { added: ['w1', 'w2', 'w3'], removed: [] },
    },
  });
  expect(PROJECT.wires).toEqual([]);
});

it('retains resource refusal details without a candidate or partial changes', () => {
  const result = createWiringProposal(PROJECT, [
    { ...EDIT, board: { ...EDIT.board, gpioPins: [0] } },
  ]);
  expect(result).toMatchObject({ kind: 'refused', failure: { code: 'resources', wireIds: [] } });
  expect(result).not.toHaveProperty('candidate');
});

it('drops superseded routing warnings when a later pending regeneration replaces their wires', () => {
  const source = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 1, yU: 2 },
    ],
  });
  const edit = {
    ...EDIT,
    input: {
      ...EDIT.input,
      cells: [
        { keyId: 'k0', half: 'left', row: 0, col: 0 },
        { keyId: 'k1', half: 'left', row: 0, col: 1 },
      ],
    },
  } as const;
  expect(createWiringProposal(source, [edit, edit])).toMatchObject({
    kind: 'changed',
    summary: {
      warnings: [{ keyIds: ['k0', 'k1'] }],
    },
  });
});
