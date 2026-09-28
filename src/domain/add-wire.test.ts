import { expect, it } from 'vitest';
import { addWire } from './add-wire';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';

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
