import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';
import { editLayout } from '@domain';

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
