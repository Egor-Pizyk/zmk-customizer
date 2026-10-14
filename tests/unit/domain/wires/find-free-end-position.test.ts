import { findFreeEndPosition } from '@domain/wires';
import { expect, it } from 'vitest';

import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('places a free end 1u below the start, on the 0.25u grid', () => {
  expect(findFreeEndPosition(buildProject({}), { start: { xU: 0.3, yU: 0.3667 } })).toEqual({
    xU: 0.25,
    yU: 1.25,
  });
});

it('steps further down while the spot holds another free end', () => {
  const wire = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(0.25, 1.25), bends: [] };
  const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }], wires: [wire] });
  expect(findFreeEndPosition(project, { start: { xU: 0.3, yU: 0.3667 } })).toEqual({
    xU: 0.25,
    yU: 2.25,
  });
});
