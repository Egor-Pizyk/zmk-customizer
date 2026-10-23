import { getBendDragBends } from '@ui/schematic/interaction';
import { expect, it } from 'vitest';
import { buildProject, freeEnd } from '../../../../helpers/build-project';

const sourceBends = [{ xU: 2, yU: 1 }];
const project = buildProject({
  wires: [
    {
      id: 'w1',
      start: freeEnd(0, 0),
      end: freeEnd(4, 0),
      bends: sourceBends,
    },
  ],
});

it('removes a dragged bend when it lands on the wire path without that bend', () => {
  expect(
    getBendDragBends(project, {
      kind: 'bend',
      wireId: 'w1',
      bendIndex: 0,
      sourceBends,
      point: { xU: 2, yU: 0 },
      collapseToleranceU: 0.125,
    }),
  ).toEqual([]);
});

it('keeps a dragged bend while it remains outside the existing straight path', () => {
  expect(
    getBendDragBends(project, {
      kind: 'bend',
      wireId: 'w1',
      bendIndex: 0,
      sourceBends,
      point: { xU: 2, yU: 2 },
      collapseToleranceU: 0.125,
    }),
  ).toEqual([{ xU: 2, yU: 2 }]);
});

it('expands an upward-to-right corner without keeping a redundant waypoint as a loop', () => {
  const bends = [
    { xU: 2, yU: 2 },
    { xU: 3, yU: 2 },
    { xU: 4, yU: 2 },
  ];
  const cornerProject = buildProject({
    wires: [{ id: 'w1', start: freeEnd(2, 4), end: freeEnd(6, 2), bends }],
  });
  const moved = getBendDragBends(cornerProject, {
    kind: 'bend',
    wireId: 'w1',
    bendIndex: 0,
    sourceBends: bends,
    point: { xU: 1, yU: 1 },
    collapseToleranceU: 0.125,
  });
  expect(moved).toEqual([{ xU: 1, yU: 1 }]);
});

it('moves the two neighboring corners with the dragged corner instead of creating a return loop', () => {
  const bends = [
    { xU: 2, yU: 4 },
    { xU: 2, yU: 2 },
    { xU: 6, yU: 2 },
  ];
  const cornerProject = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 4), end: freeEnd(6, 0), bends }],
  });
  expect(
    getBendDragBends(cornerProject, {
      kind: 'bend',
      wireId: 'w1',
      bendIndex: 1,
      sourceBends: bends,
      point: { xU: 1, yU: 1 },
      collapseToleranceU: 0.125,
    }),
  ).toEqual([{ xU: 1, yU: 1 }]);
});

it('keeps the original bend list for a press without movement', () => {
  expect(
    getBendDragBends(project, {
      kind: 'bend',
      wireId: 'w1',
      bendIndex: 0,
      sourceBends,
      point: { xU: 2, yU: 1 },
      collapseToleranceU: 0.125,
    }),
  ).toBe(sourceBends);
});
