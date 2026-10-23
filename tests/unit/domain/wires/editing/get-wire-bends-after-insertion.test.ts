import { getWireBendsAfterInsertion } from '@domain/wires/editing';
import { expect, it } from 'vitest';
import { buildProject, freeEnd } from '../../../../helpers/build-project';

const project = buildProject({
  wires: [
    {
      id: 'w1',
      start: freeEnd(0, 0),
      end: freeEnd(4, 0),
      bends: [
        { xU: 1, yU: 1 },
        { xU: 3, yU: 1 },
      ],
    },
  ],
});

it('inserts a bend at the position clicked along the wire path', () => {
  expect(getWireBendsAfterInsertion(project, { wireId: 'w1', point: { xU: 2, yU: 1 } })).toEqual([
    { xU: 1, yU: 1 },
    { xU: 2, yU: 1 },
    { xU: 3, yU: 1 },
  ]);
});

it('does not duplicate an existing bend', () => {
  expect(getWireBendsAfterInsertion(project, { wireId: 'w1', point: { xU: 1, yU: 1 } })).toBe(
    project.wires[0]?.bends,
  );
});
