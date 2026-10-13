import { expect, it } from 'vitest';
import { removeWire } from '@domain';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 0 },
];

it('turns junctions onto the removed wire into free ends at their drawn point', () => {
  const trunk = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(0.3, 3), bends: [] };
  const branch = {
    id: 'w2',
    start: keyPin('k2', 1),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 0.2, yU: 2 } } as const,
    bends: [],
  };
  const project = removeWire(buildProject({ keys: KEYS, wires: [trunk, branch] }), {
    wireId: 'w1',
  });
  expect(project.wires).toEqual([{ ...branch, end: freeEnd(0.3, 2) }]);
});

it('drops insulation that referenced the wire', () => {
  const one = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(4, 0.3667), bends: [] };
  const two = { id: 'w2', start: keyPin('k2', 1), end: freeEnd(2.3, -3), bends: [] };
  const before = buildProject({
    keys: KEYS,
    wires: [one, two],
    insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 0 }],
  });
  expect(removeWire(before, { wireId: 'w2' }).insulatedCrossings).toEqual([]);
});
