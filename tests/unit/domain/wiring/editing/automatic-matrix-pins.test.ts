import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { getControllerBoard } from '@catalog/controllers';
import { editWiring } from '@domain/wiring/editing';
import { deriveWiring } from '@domain/wiring/matrix';
import { buildProject } from '../../../../helpers/build-project';
import { getResultError, getResultValue } from '../../../../helpers/result';

const BOARD = getControllerBoard('nice_nano_v2');
const GRID = buildProject({
  keys: Array.from({ length: 9 }, (_, index) => ({
    id: `k${index}`,
    xU: index % 3,
    yU: Math.floor(index / 3),
  })),
});

it('BM-085 binds all six 3x3 Matrix buses to controller GPIOs on mode conversion', () => {
  const direct = getResultValue(editWiring(GRID, { kind: 'mode', mode: 'direct', board: BOARD }));
  const before = structuredClone(direct);
  const edit = { kind: 'mode' as const, mode: 'matrix' as const, board: BOARD };
  const candidate = getResultValue(editWiring(direct, edit));
  expect(candidate.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([
    0, 1, 2, 3, 4, 5,
  ]);
  expect(getResultValue(deriveWiring(candidate, BOARD))).toMatchObject({
    rowPins: [0, 1, 2],
    colPins: [3, 4, 5],
  });
  expect(candidate.wires.some((wire) => wire.end.kind === 'junction')).toBe(true);
  expect(getResultValue(editWiring(direct, edit))).toEqual(candidate);
  expect(direct).toEqual(before);
});

it('BM-086 preserves valid left pins and allocates right GPIOs independently on a split change', () => {
  const source: Project = {
    ...buildProject({
      keys: [
        { id: 'a', xU: 0, yU: 0 },
        { id: 'b', xU: 1, yU: 0 },
        { id: 'c', xU: 0, yU: 1 },
        { id: 'd', xU: 1, yU: 1 },
      ],
    }),
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [
        { id: 'r0', half: 'left', kind: 'row', boardPin: 8 },
        { id: 'r1', half: 'left', kind: 'row', boardPin: 9 },
        { id: 'c0', half: 'left', kind: 'col', boardPin: 10 },
        { id: 'c1', half: 'left', kind: 'col', boardPin: 14 },
      ],
    },
  };
  const candidate = getResultValue(
    editWiring(source, { kind: 'topology', topology: 'split', board: BOARD }),
  );
  expect(candidate.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([
    8, 9, 10, 0, 1, 2,
  ]);
  expect(getResultValue(deriveWiring(candidate, BOARD)).halves).toEqual({
    left: { rowPins: [8, 9], colPins: [10] },
    right: { rowPins: [0, 1], colPins: [2] },
  });
});

it('BM-087 excludes retained manual GPIOs instead of shorting them to an automatic Matrix bus', () => {
  const direct = getResultValue(editWiring(GRID, { kind: 'mode', mode: 'direct', board: BOARD }));
  const reserved = {
    id: 'reserved',
    start: { kind: 'free' as const, at: { xU: -3, yU: -3 }, boardPin: 0 },
    end: { kind: 'free' as const, at: { xU: -2, yU: -3 } },
    bends: [],
  };
  const source = { ...direct, wires: [...direct.wires, reserved] };
  const candidate = getResultValue(
    editWiring(source, { kind: 'mode', mode: 'matrix', board: BOARD }),
  );
  expect(candidate.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([
    1, 2, 3, 4, 5, 6,
  ]);
  expect(candidate.wires.find((wire) => wire.id === 'reserved')).toEqual(reserved);
});

it('BM-088 refuses a six-net Matrix on five GPIOs without changing the source', () => {
  const direct = getResultValue(editWiring(GRID, { kind: 'mode', mode: 'direct', board: BOARD }));
  const before = structuredClone(direct);
  expect(
    getResultError(
      editWiring(direct, {
        kind: 'mode',
        mode: 'matrix',
        board: { ...BOARD, gpioPins: [0, 1, 2, 3, 4] },
      }),
    ),
  ).toContain('GPIO');
  expect(direct).toEqual(before);
});
