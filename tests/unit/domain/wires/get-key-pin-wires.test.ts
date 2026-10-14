import { getKeyPinWires } from '@domain/wires';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 0 },
  { id: 'k3', xU: 4, yU: 0 },
];

it('lists wires that end on a key pin, in wire order', () => {
  const project = buildProject({
    keys: KEYS,
    wires: [
      { id: 'w1', start: keyPin('k1', 2), end: freeEnd(0.6333, 3), bends: [] },
      { id: 'w2', start: keyPin('k1', 1), end: freeEnd(0.3, 3), bends: [] },
      { id: 'w3', start: freeEnd(2, 3), end: keyPin('k1', 2), bends: [] },
    ],
  });
  const wiresOf = getKeyPinWires(project);
  expect(wiresOf({ keyId: 'k1', pin: 2 })).toEqual([0, 2]);
  expect(wiresOf({ keyId: 'k9', pin: 1 })).toEqual([]);
});

// A wire running over a pin connects it, so a row wire can pass through every key of the row.
it('connects a pin that a wire passes over', () => {
  const row = { id: 'w1', start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] };
  const wiresOf = getKeyPinWires(buildProject({ keys: KEYS, wires: [row] }));
  expect(wiresOf({ keyId: 'k2', pin: 1 })).toEqual([0]);
  expect(wiresOf({ keyId: 'k2', pin: 2 })).toEqual([]);
});
