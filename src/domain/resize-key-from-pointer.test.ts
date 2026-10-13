import { getDefinedValue } from '../../tests/helpers/defined-value';
import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { getKeyCorners } from './get-key-corners';
import { resizeKeyFromPointer } from './resize-key-from-pointer';

it('snaps corner dimensions while holding the opposite corner fixed and retains electrical data', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } }],
  });
  const next = resizeKeyFromPointer(project, {
    keyId: 'k0',
    direction: { x: -1, y: -1 },
    start: { xU: 0, yU: 0 },
    position: { xU: -0.7, yU: -0.9 },
    snapGridU: 0.25,
  });
  expect(next.keys[0]).toMatchObject({
    xU: -0.75,
    yU: -1,
    widthU: 1.75,
    heightU: 2,
    diode: project.keys[0]?.diode,
  });
  expect(next.layers).toBe(project.layers);
  expect(next.wires).toBe(project.wires);
});
it('resizes in rotated local axes without moving the opposite edge', () => {
  const key = {
    id: 'k0',
    xU: 0,
    yU: 0,
    rotationDeg: 90,
    rotationOriginXU: 0.5,
    rotationOriginYU: 0.5,
  };
  const project = buildProject({ keys: [key] });
  const next = resizeKeyFromPointer(project, {
    keyId: 'k0',
    direction: { x: 1, y: 0 },
    start: { xU: 0.5, yU: 1 },
    position: { xU: 0.5, yU: 2 },
  });
  expect(next.keys[0]).toMatchObject({ xU: 0, yU: 0, widthU: 2 });
  const resized = next.keys.find((candidate) => candidate.id === 'k0');
  expect(getKeyCorners(getDefinedValue(resized))[0]).toEqual(getKeyCorners(key)[0]);
  expect(getKeyCorners(getDefinedValue(resized))[3]).toEqual(getKeyCorners(key)[3]);
});
it('clamps positive dimensions without flipping and preserves no-motion identity', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0, widthU: 1.3 }] });
  const input = {
    keyId: 'k0',
    direction: { x: 1 as const, y: 0 as const },
    start: { xU: 1, yU: 0 },
    position: { xU: 1, yU: 0 },
    snapGridU: 0.25,
  };
  expect(resizeKeyFromPointer(project, input)).toBe(project);
  expect(resizeKeyFromPointer(project, { ...input, keyId: 'missing' })).toBe(project);
  expect(
    resizeKeyFromPointer(project, { ...input, position: { xU: -5, yU: 0 } }).keys[0]?.widthU,
  ).toBe(0.01);
});

it('preserves unsnapped fixed-edge coordinates exactly during a side resize', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0.123456, yU: 0.654321 }] });
  const next = resizeKeyFromPointer(project, {
    keyId: 'k0',
    direction: { x: 1, y: 0 },
    start: { xU: 1, yU: 0 },
    position: { xU: 2, yU: 0 },
  });
  expect(next.keys[0]?.xU).toBe(0.123456);
  expect(next.keys[0]?.yU).toBe(0.654321);
});
