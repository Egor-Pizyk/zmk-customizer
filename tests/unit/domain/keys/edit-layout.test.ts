import { editLayout } from '@domain/keys';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('moves and patches the selected cluster in one pure operation, retaining unrelated keys', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0, rotationDeg: 20 },
      { id: 'k1', xU: 3, yU: 0 },
    ],
  });
  const next = editLayout(project, {
    keyIds: ['k0'],
    offset: { xU: 1, yU: -1 },
    geometry: { widthU: 2, rotationOriginXU: 3 },
  });
  expect(next.keys[0]).toMatchObject({
    xU: 1,
    yU: -1,
    widthU: 2,
    rotationOriginXU: 3,
    rotationOriginYU: -1,
  });
  expect(next.keys[1]).toBe(project.keys[1]);
  expect(
    editLayout(project, { keyIds: [], offset: { xU: 2, yU: 0 }, geometry: { widthU: 2 } }),
  ).toBe(project);
});

it('checks insulation only after the complete move and rotation', () => {
  const project = buildProject({
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
  const next = editLayout(project, {
    keyIds: ['k2'],
    offset: { xU: 0, yU: 6 },
    geometry: { rotationDeg: 180, rotationOriginXU: 2.5, rotationOriginYU: 1.5 },
  });
  expect(next.insulatedCrossings).toEqual(project.insulatedCrossings);
  expect(next.wires).toBe(project.wires);
});

it('numeric angles preserve every visible center in a pre-rotated selection and add only explicit translation', () => {
  const project = buildProject({
    keys: [
      {
        id: 'k0',
        xU: 2,
        yU: 3,
        widthU: 2,
        heightU: 1,
        rotationDeg: 90,
        rotationOriginXU: 0,
        rotationOriginYU: 0,
      },
      { id: 'k1', xU: 8, yU: 5 },
      { id: 'k2', xU: 20, yU: 20 },
    ],
  });
  // k0's visible center is (-3.5, 3), k1's is (8.5, 5.5).
  const next = editLayout(project, {
    keyIds: ['k0', 'k1'],
    offset: { xU: 1, yU: -2 },
    geometry: { rotationDeg: -30 },
  });
  expect(next.keys[0]).toMatchObject({
    xU: -3.5,
    yU: 0.5,
    widthU: 2,
    heightU: 1,
    rotationDeg: -30,
    rotationOriginXU: -2.5,
    rotationOriginYU: 1,
  });
  expect(next.keys[1]).toMatchObject({
    xU: 9,
    yU: 3,
    rotationDeg: -30,
    rotationOriginXU: 9.5,
    rotationOriginYU: 3.5,
  });
  expect(next.keys[2]).toBe(project.keys[2]);
  const explicit = editLayout(project, {
    keyIds: ['k0'],
    offset: { xU: 0, yU: 0 },
    geometry: { rotationDeg: -30, rotationOriginXU: 4 },
  });
  expect(explicit.keys[0]).toMatchObject({
    xU: 2,
    yU: 3,
    rotationOriginXU: 4,
    rotationOriginYU: 0,
  });
  expect(
    editLayout(project, {
      keyIds: ['k0'],
      offset: { xU: 0, yU: 0 },
      geometry: { rotationDeg: 90 },
    }),
  ).toBe(project);
});
