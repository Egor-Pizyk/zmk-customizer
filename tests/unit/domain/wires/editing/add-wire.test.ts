import { addWire } from '@domain/wires/editing';
import { expect, it } from 'vitest';

import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';

it('appends a wire with the next id', () => {
  const project = addWire(buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] }), {
    start: keyPin('k1', 1),
    end: freeEnd(3, 3),
    bends: [{ xU: 3, yU: 0.25 }],
  });
  expect(project.wires).toEqual([
    { id: 'w1', start: keyPin('k1', 1), end: freeEnd(3, 3), bends: [{ xU: 3, yU: 0.25 }] },
  ]);
});

it('refuses a wire with no key pin end', () => {
  const before = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const after = addWire(before, {
    start: freeEnd(0, 0),
    end: freeEnd(3, 3),
    bends: [],
  });
  expect(after).toBe(before);
});

it('refuses a wire whose ends are the same pin', () => {
  const before = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const after = addWire(before, {
    start: keyPin('k1', 1),
    end: keyPin('k1', 1),
    bends: [],
  });
  expect(after).toBe(before);
});
