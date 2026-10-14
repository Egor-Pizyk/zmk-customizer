import { getKeyCenter } from '@domain/geometry';
import { rotateKeyFromPointer } from '@domain/geometry/transforms';
import { getDefinedValue } from '../../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { buildProject } from '../../../../helpers/build-project';

it('rotates about visible center and rebases arbitrary origins without a center jump', () => {
  const key = { id: 'k0', xU: 2, yU: 3, widthU: 2, rotationDeg: 30 };
  const project = buildProject({ keys: [key] });
  const center = getKeyCenter(key);
  const next = rotateKeyFromPointer(project, {
    keyId: 'k0',
    start: { xU: center.xU + 1, yU: center.yU },
    position: { xU: center.xU, yU: center.yU + 1 },
  });
  const rotated = next.keys.find((candidate) => candidate.id === 'k0');
  expect(rotated).toMatchObject({
    rotationDeg: 120,
    rotationOriginXU: center.xU,
    rotationOriginYU: center.yU,
  });
  expect(getKeyCenter(getDefinedValue(rotated)).xU).toBeCloseTo(center.xU, 4);
  expect(getKeyCenter(getDefinedValue(rotated)).yU).toBeCloseTo(center.yU, 4);
  expect(next.layers).toBe(project.layers);
  expect(next.wires).toBe(project.wires);
});
it('snaps Shift rotation to 15 degrees, handles angle wrap and preserves no-op identity', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const input = { keyId: 'k0', start: { xU: 1.5, yU: 0.5 }, position: { xU: 1.5, yU: 0.5 } };
  expect(rotateKeyFromPointer(project, input)).toBe(project);
  expect(rotateKeyFromPointer(project, { ...input, keyId: 'missing' })).toBe(project);
  const angle = (20 * Math.PI) / 180;
  expect(
    rotateKeyFromPointer(project, {
      ...input,
      position: { xU: 0.5 + Math.cos(angle), yU: 0.5 + Math.sin(angle) },
      isAngleSnapEnabled: true,
    }).keys[0]?.rotationDeg,
  ).toBe(15);
});

it('does not invent an angle when the pointer reaches the pivot', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  expect(
    rotateKeyFromPointer(project, {
      keyId: 'k0',
      start: { xU: 0.5, yU: -0.5 },
      position: { xU: 0.5, yU: 0.5 },
    }),
  ).toBe(project);
});
it('takes the short delta across the angle branch cut', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const angle = (179 * Math.PI) / 180;
  expect(
    rotateKeyFromPointer(project, {
      keyId: 'k0',
      start: { xU: 0.5 + Math.cos(angle), yU: 0.5 + Math.sin(angle) },
      position: { xU: 0.5 + Math.cos(-angle), yU: 0.5 + Math.sin(-angle) },
    }).keys[0]?.rotationDeg,
  ).toBe(2);
});
