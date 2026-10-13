import { getResultValue, getResultError } from '../../../helpers/result';
import { expect, it } from 'vitest';
import {
  buildMatrixProject,
  swapKeyPins,
  withKeyDiode,
} from '../../../helpers/build-matrix-project';
import { buildProject } from '../../../helpers/build-project';
import { deriveShieldMatrix } from '@domain';

const target = {
  boardId: 'nice_nano_v2',
  gpioPins: [2, 6, 8, 9, 10, 11, 17, 20, 22, 24, 29, 31],
} as const;

it('derives sorted matrix pins and cells in keys order independent of wire order', () => {
  const project = buildMatrixProject([
    [6, 9],
    [2, 8],
    [6, 8],
    [2, 9],
  ]);
  const result = deriveShieldMatrix(project, target);
  expect(result).toEqual({
    ok: true,
    value: {
      rowPins: [2, 6],
      colPins: [8, 9],
      cells: [
        { row: 1, col: 1 },
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: 1 },
      ],
      diodeDirection: 'col2row',
    },
  });
  expect(deriveShieldMatrix({ ...project, wires: project.wires.toReversed() }, target)).toEqual(
    result,
  );
});
it.each([
  { pin: 1, cathode: 'away-switch', direction: 'col2row' },
  { pin: 1, cathode: 'toward-switch', direction: 'row2col' },
  { pin: 2, cathode: 'away-switch', direction: 'row2col' },
  { pin: 2, cathode: 'toward-switch', direction: 'col2row' },
] as const)('uses saved pin $pin / $cathode', ({ pin, cathode, direction }) => {
  const result = deriveShieldMatrix(buildMatrixProject(undefined, { pin, cathode }), target);
  expect(getResultValue(result).diodeDirection).toBe(direction);
});
it('does not assume switch pin 1 is always a row', () => {
  const project = swapKeyPins(buildMatrixProject());
  const result = deriveShieldMatrix(project, target);
  expect(getResultValue(result).diodeDirection).toBe('row2col');
});
it('orients disconnected components from minimum GPIO without flipping for polarity', () => {
  const result = deriveShieldMatrix(
    buildMatrixProject([
      [6, 9],
      [2, 8],
    ]),
    target,
  );
  expect(getResultValue(result).cells).toEqual([
    { row: 1, col: 1 },
    { row: 0, col: 0 },
  ]);
  const incompatible = deriveShieldMatrix(
    buildMatrixProject([
      [2, 8],
      [10, 6],
    ]),
    target,
  );
  expect(getResultError(incompatible)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: 'matrix-diode-conflict', path: ['keys', 1] }),
    ]),
  );
});
it('rejects odd cycles, parallel keys and shorted switches', () => {
  for (const pairs of [
    [
      [2, 8],
      [8, 9],
      [9, 2],
    ],
    [
      [2, 8],
      [8, 2],
    ],
    [[2, 2]],
  ] as const) {
    expect(deriveShieldMatrix(buildMatrixProject(pairs), target).ok).toBe(false);
  }
  const result = deriveShieldMatrix(
    buildMatrixProject([
      [2, 8],
      [8, 9],
      [9, 2],
    ]),
    target,
  );
  expect(getResultError(result).some((issue) => issue.code === 'matrix-not-bipartite')).toBe(true);
});
it('reports mixed direction and each missing diode by key path', () => {
  const project = withKeyDiode(buildMatrixProject(), {
    keyIndex: 1,
    diode: { pin: 1, cathode: 'toward-switch' },
  });
  const mixed = deriveShieldMatrix(project, target);
  expect(getResultError(mixed)).toContainEqual(
    expect.objectContaining({ code: 'matrix-diode-conflict', path: ['keys', 1] }),
  );
  const absent = deriveShieldMatrix(withKeyDiode(project, { keyIndex: 0 }), target);
  expect(getResultError(absent)).toContainEqual(
    expect.objectContaining({ code: 'key-diode-missing', path: ['keys', 0] }),
  );
});
it('blocks empty and unsupported GPIOs with actionable paths', () => {
  const empty = deriveShieldMatrix(buildProject({}), target);
  expect(getResultError(empty)).toContainEqual(
    expect.objectContaining({ code: 'shield-empty', path: ['keys'] }),
  );
  const unsupported = deriveShieldMatrix(buildMatrixProject([[13, 8]]), target);
  expect(getResultError(unsupported)).toContainEqual(
    expect.objectContaining({
      code: 'shield-pin-unsupported',
      path: ['wires', 0, 'end', 'boardPin'],
    }),
  );
});
it('rejects a net without a board pin and unused wiring', () => {
  const project = buildMatrixProject([[2, 8]]);
  const withoutPin = removeBoardPins(project);
  expect(deriveShieldMatrix(withoutPin, target).ok).toBe(false);
  const unused = {
    ...project,
    wires: [
      ...project.wires,
      {
        id: 'w99',
        start: { kind: 'free', at: { xU: 20, yU: 20 }, boardPin: 6 },
        end: { kind: 'free', at: { xU: 21, yU: 20 }, boardPin: 6 },
        bends: [],
      } as const,
    ],
  };
  expect(deriveShieldMatrix(unused, target).ok).toBe(false);
});

it('reports missing diodes even when the wiring has other blockers', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  expect(getResultError(deriveShieldMatrix(project, target))).toContainEqual(
    expect.objectContaining({ code: 'key-diode-missing', path: ['keys', 0] }),
  );
});

function removeBoardPins(project: ReturnType<typeof buildProject>) {
  return {
    ...project,
    wires: project.wires.map((wire) => {
      if (wire.end.kind !== 'free') {
        return wire;
      }
      return { ...wire, end: { kind: 'free', at: wire.end.at } as const };
    }),
  };
}
