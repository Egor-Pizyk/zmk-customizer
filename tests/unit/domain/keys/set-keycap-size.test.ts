import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { setKeycapSize } from '@domain/keys';
import { getKeyCenter } from '@domain/geometry';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { KEYCAP_SIZES } from '@catalog/keycaps';
import { buildProject } from '../../../helpers/build-project';

it('changes a rotated custom key around its fixed center and pins without touching layers/wiring', () => {
  const project = buildProject({
    keys: [
      {
        id: 'k0',
        xU: 2,
        yU: 3,
        widthU: 1.37,
        heightU: 1.5,
        rotationDeg: 37,
        rotationOriginXU: 1,
        rotationOriginYU: 2,
        diode: { pin: 1, cathode: 'away-switch' },
      },
      { id: 'k1', xU: 10, yU: 3 },
    ],
    bindings: { k0: { kind: 'trans' } },
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: 0, yU: 1 }, boardPin: 2 },
        bends: [],
      },
    ],
  });
  const before = structuredClone(project);
  const next = setKeycapSize(project, { keyIds: ['k0'], sizeId: '2.25', sizes: KEYCAP_SIZES });
  const oldKey = requireKey(project);
  const key = requireKey(next);
  expect(key).toMatchObject({
    widthU: 2.25,
    heightU: 1,
    rotationDeg: 37,
    rotationOriginXU: 1,
    rotationOriginYU: 2,
    diode: oldKey.diode,
  });
  expect(getKeyCenter(key).xU).toBeCloseTo(getKeyCenter(oldKey).xU, 10);
  expect(getKeyCenter(key).yU).toBeCloseTo(getKeyCenter(oldKey).yU, 10);
  for (const pin of [1, 2] as const) {
    const oldPin = getKeyPinPosition(oldKey, pin);
    const nextPin = getKeyPinPosition(key, pin);
    expect(nextPin.xU).toBeCloseTo(oldPin.xU, 10);
    expect(nextPin.yU).toBeCloseTo(oldPin.yU, 10);
  }
  expect(next.keys[1]).toBe(project.keys[1]);
  expect(next.layers).toBe(project.layers);
  expect(next.wires).toEqual(project.wires);
  expect(project).toEqual(before);
});

it('changes a group once and preserves identity for unknown, empty and effective-default choices', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 4, yU: 0 },
    ],
  });
  const input = { keyIds: ['k0', 'k1'], sizeId: '1', sizes: KEYCAP_SIZES };
  expect(setKeycapSize(project, input)).toBe(project);
  expect(setKeycapSize(project, { ...input, sizeId: 'arbitrary' })).toBe(project);
  expect(setKeycapSize(project, { ...input, keyIds: [] })).toBe(project);
  expect(setKeycapSize(project, { ...input, keyIds: ['missing'], sizeId: '2' })).toBe(project);
  const next = setKeycapSize(project, { ...input, sizeId: '2' });
  expect(next.keys.map((key) => [key.xU, key.widthU, key.heightU])).toEqual([
    [-0.5, 2, 1],
    [3.5, 2, 1],
  ]);
});

function requireKey(project: Project) {
  const key = project.keys[0];
  if (key === undefined) {
    throw new Error('Missing key');
  }
  return key;
}
