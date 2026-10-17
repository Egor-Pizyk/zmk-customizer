import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { reverseKeyDiode } from '@domain/diodes';
import { expect, it } from 'vitest';
import { buildMatrixProject } from '../../../helpers/build-matrix-project';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { getDefinedValue } from '../../../helpers/defined-value';
import { getResultValue } from '../../../helpers/result';

const DIMENSIONS = [1, 2, 3, 4].flatMap((rows) => [1, 2, 3].map((cols) => [rows, cols] as const));

it.each(DIMENSIONS)(
  'derives a %i × %i matrix preserving every physical connection in key order',
  (rows, cols) => {
    const { getBoard } = getControllerFixtures();
    const board = getBoard('nice_nano_v2');
    const rowPins = [0, 1, 2, 3].slice(0, rows);
    const colPins = [8, 9, 10].slice(0, cols);
    const pairs = rowPins.flatMap((row) => colPins.map((col) => [row, col] as const));
    const project = buildMatrixProject(pairs);
    const target = { boardId: board.id, ble: board.ble, gpioPins: board.gpioPins };
    const matrix = getResultValue(deriveShieldMatrix(project, target));
    expect(matrix.cells).toHaveLength(pairs.length);
    expect(new Set(matrix.cells.map((cell) => `${cell.row}:${cell.col}`)).size).toBe(pairs.length);
    for (const [index, pair] of pairs.entries()) {
      const cell = getDefinedValue(matrix.cells[index]);
      expect(
        [
          getDefinedValue(matrix.rowPins[cell.row]),
          getDefinedValue(matrix.colPins[cell.col]),
        ].toSorted((left, right) => left - right),
      ).toEqual([...pair].toSorted((left, right) => left - right));
    }
    let reversed = project;
    for (const key of project.keys) {
      reversed = reverseKeyDiode(reversed, { keyId: key.id });
    }
    const reverseMatrix = getResultValue(deriveShieldMatrix(reversed, target));
    expect(reverseMatrix.cells).toEqual(matrix.cells);
    expect(reverseMatrix.rowPins).toEqual(matrix.rowPins);
    expect(reverseMatrix.colPins).toEqual(matrix.colPins);
    expect(reverseMatrix.diodeDirection).not.toBe(matrix.diodeDirection);
    expect(
      getResultValue(deriveShieldMatrix({ ...project, wires: project.wires.toReversed() }, target)),
    ).toEqual(matrix);
  },
);
