import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setKeyGeometries } from './set-key-geometries';
import { moveKeys } from './move-keys';

it('patches selected keys atomically without losing identity, layers or electrical references', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } },
      { id: 'k1', xU: 3, yU: 0 },
    ],
    bindings: { k0: { kind: 'trans' } },
  });
  const before = structuredClone(project);
  const next = setKeyGeometries(project, {
    changes: [
      {
        keyId: 'k0',
        geometry: { widthU: 2.25, rotationDeg: -30, rotationOriginXU: 1, rotationOriginYU: 1 },
      },
    ],
  });
  expect(next.keys[0]).toMatchObject({
    id: 'k0',
    widthU: 2.25,
    rotationDeg: -30,
    diode: project.keys[0]?.diode,
  });
  expect(next.keys[1]).toBe(project.keys[1]);
  expect(next.layers).toBe(project.layers);
  expect(next.wires).toBe(project.wires);
  expect(project).toEqual(before);
});
it('keeps original project identity for empty, unknown and effective-default edits', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  expect(setKeyGeometries(project, { changes: [] })).toBe(project);
  expect(
    setKeyGeometries(project, { changes: [{ keyId: 'absent', geometry: { widthU: 2 } }] }),
  ).toBe(project);
  expect(
    setKeyGeometries(project, {
      changes: [{ keyId: 'k0', geometry: { widthU: 1, rotationDeg: 0 } }],
    }),
  ).toBe(project);
});
it('moves a rotated cluster and its absolute origins together while retaining world bends', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 2, yU: 3, rotationDeg: 30, rotationOriginXU: 1, rotationOriginYU: 4 }],
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: 5, yU: 6 }, boardPin: 0 },
        bends: [{ xU: 4, yU: 4 }],
      },
    ],
  });
  const next = moveKeys(project, { moves: [{ keyId: 'k0', position: { xU: 4, yU: 2 } }] });
  expect(next.keys[0]).toMatchObject({ xU: 4, yU: 2, rotationOriginXU: 3, rotationOriginYU: 3 });
  expect(next.wires).toBe(project.wires);
});
