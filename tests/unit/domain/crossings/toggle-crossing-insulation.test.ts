import { toggleCrossingInsulation } from '@domain/crossings';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('adds, then removes, the insulation of one crossing', () => {
  const ref = { wireIds: ['w1', 'w2'] as const, ordinal: 0 };
  const project = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    wires: [
      { id: 'w1', start: keyPin('k1', 1), end: freeEnd(4, 0.3667), bends: [] },
      { id: 'w2', start: keyPin('k1', 2), end: freeEnd(2, -1), bends: [{ xU: 2, yU: 2 }] },
    ],
  });
  const insulated = toggleCrossingInsulation(project, { ref });
  expect(insulated.insulatedCrossings).toEqual([{ wireIds: ['w1', 'w2'], ordinal: 0 }]);
  expect(toggleCrossingInsulation(insulated, { ref }).insulatedCrossings).toEqual([]);
});
