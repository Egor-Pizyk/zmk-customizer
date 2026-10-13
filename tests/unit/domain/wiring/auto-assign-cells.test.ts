import { expect, it } from 'vitest';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { buildProject } from '../../../helpers/build-project';
import { autoAssignCells } from '@domain';

it('assigns every electrical preset independently to its documented cells', () => {
  const cells = autoAssignCells(getControllerFixtures().project, {
    gridStepU: 0.25,
    topology: 'unibody',
  });
  expect(cells.map((cell) => [cell.row, cell.col])).toEqual([
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ]);
});
it('uses rotated visible centers, stable ties and per-half rows', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 0 },
      { id: 'k2', xU: 4, yU: 0 },
      { id: 'k3', xU: 0, yU: 2, rotationDeg: 90, rotationOriginXU: 0, rotationOriginYU: 0 },
    ],
  });
  expect(
    autoAssignCells(project, { gridStepU: 0.25, topology: 'split', assignHalves: true }).map(
      (cell) => [cell.half, cell.row, cell.col],
    ),
  ).toEqual([
    ['left', 0, 1],
    ['right', 0, 0],
    ['right', 0, 1],
    ['left', 0, 0],
  ]);
});

it('keeps explicit halves and stable coincident-center ordering when grid input is invalid', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0, half: 'right' },
      { id: 'k1', xU: 0, yU: 0, half: 'right' },
    ],
  });
  expect(
    autoAssignCells(project, { gridStepU: Number.NaN, topology: 'split' }).map((cell) => [
      cell.half,
      cell.row,
      cell.col,
    ]),
  ).toEqual([
    ['right', 0, 0],
    ['right', 0, 1],
  ]);
  expect(
    autoAssignCells(project, { gridStepU: -1, topology: 'unibody' }).map((cell) => [
      cell.half,
      cell.row,
      cell.col,
    ]),
  ).toEqual([
    ['left', 0, 0],
    ['left', 0, 1],
  ]);
});
