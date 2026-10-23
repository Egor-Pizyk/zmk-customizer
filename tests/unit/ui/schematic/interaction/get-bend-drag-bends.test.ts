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
