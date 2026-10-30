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

it('removes an empty-contact bus after its last key branch is removed', () => {
  const trunk = { id: 'w1', start: freeEnd(0, 0), end: freeEnd(0, 4), contacts: [], bends: [] };
  const branch = {
    id: 'w2',
    start: keyPin('k1', 1),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 0, yU: 2.3667 } } as const,
    bends: [],
  };
  const project = buildProject({ keys: [{ id: 'k1', xU: 2, yU: 2 }], wires: [trunk, branch] });
  expect(removeOrphanWires(project, { removedWireIds: ['w2'] }).wires).toEqual([]);
});

it('keeps a bus with a surviving key branch even when it has no direct pin contacts', () => {
  const trunk = { id: 'w1', start: freeEnd(0, 0), end: freeEnd(0, 4), bends: [] };
  const branch = {
    id: 'w2',
    start: keyPin('k1', 1),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 0, yU: 2.3667 } } as const,
    bends: [],
  };
  const removed = { id: 'w3', start: keyPin('k2', 1), end: freeEnd(6, 4.3667), bends: [] };
  const project = buildProject({
    keys: [
      { id: 'k1', xU: 2, yU: 2 },
      { id: 'k2', xU: 4, yU: 4 },
    ],
    wires: [trunk, branch, removed],
  });
  expect(removeOrphanWires(project, { removedWireIds: ['w3'] }).wires).toEqual([trunk, branch]);
});

it('preserves unrelated repairable free fragments when removing another wire', () => {
  const fragment = { id: 'w1', start: freeEnd(0, 0), end: freeEnd(0, 4), contacts: [], bends: [] };
  const removed = { id: 'w2', start: keyPin('k1', 1), end: freeEnd(6, 4.3667), bends: [] };
  const project = buildProject({ keys: [{ id: 'k1', xU: 4, yU: 4 }], wires: [fragment, removed] });
  expect(removeOrphanWires(project, { removedWireIds: ['w2'] }).wires).toEqual([fragment]);
});
