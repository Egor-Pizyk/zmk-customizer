import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { renumberKeys } from '@domain';

it('orders transformed centers by Y then X with stable ties and preserves references', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 2 },
      { id: 'k1', xU: 0, yU: 0, widthU: 2, rotationDeg: 90 },
      { id: 'k2', xU: 3, yU: 0 },
      { id: 'k3', xU: 3, yU: 0 },
    ],
    bindings: { k0: { kind: 'trans' }, k1: { kind: 'none' } },
  });
  const next = renumberKeys(project);
  expect(next.keys.map((key) => key.id)).toEqual(['k2', 'k3', 'k1', 'k0']);
  expect(next.layers).toBe(project.layers);
  expect(next.wires).toBe(project.wires);
  expect(next.keys[0]).toBe(project.keys[2]);
  expect(renumberKeys(next)).toBe(next);
  expect(renumberKeys(buildProject({})).keys).toEqual([]);
});
