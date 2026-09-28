import { expect, it } from 'vitest';
import { moveKey } from './move-key';
import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import { setWireBends } from './set-wire-bends';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';

const PROJECT = buildProject({
  keys: [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 2, yU: -2 },
  ],
  wires: [
    { id: 'w1', start: keyPin('k1', 1), end: freeEnd(5, 0.3667), bends: [] },
    { id: 'w2', start: keyPin('k2', 1), end: freeEnd(2.3, 3), bends: [] },
  ],
  insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 0 }],
});

it('keeps insulation while the wires still cross', () => {
  expect(pruneInsulatedCrossings(PROJECT)).toBe(PROJECT);
  expect(moveKey(PROJECT, { keyId: 'k2', position: { xU: 3, yU: -2 } }).insulatedCrossings).toEqual(
    PROJECT.insulatedCrossings,
  );
});

it('drops insulation when the wires no longer cross (FR-017)', () => {
  expect(moveKey(PROJECT, { keyId: 'k2', position: { xU: 2, yU: 4 } }).insulatedCrossings).toEqual(
    [],
  );
  const rerouted = setWireBends(PROJECT, {
    wireId: 'w2',
    bends: [
      { xU: 7, yU: -1.6333 },
      { xU: 7, yU: 3 },
    ],
  });
  expect(rerouted.insulatedCrossings).toEqual([]);
});
