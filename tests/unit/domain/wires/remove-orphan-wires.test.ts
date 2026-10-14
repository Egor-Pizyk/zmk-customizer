import { removeOrphanWires } from '@domain/wires';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('removes the given wires and frees junctions onto them at their drawn point', () => {
  const trunk = { id: 'w1', start: freeEnd(0, 0), end: freeEnd(0, 4), bends: [] };
  const branch = {
    id: 'w2',
    start: keyPin('k1', 1),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 0.4, yU: 2 } } as const,
    bends: [],
  };
  const project = buildProject({ keys: [{ id: 'k1', xU: 2, yU: 2 }], wires: [trunk, branch] });
  expect(removeOrphanWires(project, { removedWireIds: ['w1'] }).wires).toEqual([
    { ...branch, end: freeEnd(0, 2) },
  ]);
});

it('keeps the project when nothing is removed', () => {
  const project = buildProject({});
  expect(removeOrphanWires(project, { removedWireIds: [] })).toBe(project);
});
