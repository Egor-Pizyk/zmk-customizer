import { expect, it } from 'vitest';
import { isKeyPositionFree } from '@domain';
import { buildProject } from '../../../helpers/build-project';

const PROJECT = buildProject({ keys: [{ id: 'k1', xU: 1, yU: 1 }] });

it('rejects an overlapping 1u cell', () => {
  expect(isKeyPositionFree(PROJECT, { position: { xU: 1.5, yU: 1.25 } })).toBe(false);
});

it('accepts a cell that only touches an edge', () => {
  expect(isKeyPositionFree(PROJECT, { position: { xU: 2, yU: 1 } })).toBe(true);
  expect(isKeyPositionFree(PROJECT, { position: { xU: 1, yU: 0 } })).toBe(true);
});

it('ignores the key being moved', () => {
  expect(isKeyPositionFree(PROJECT, { position: { xU: 1.25, yU: 1 }, ignoreKeyId: 'k1' })).toBe(
    true,
  );
});

it('uses actual sized rotated rectangles, allowing touching edges', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0, widthU: 2, heightU: 1, rotationDeg: 90 }],
  });
  expect(isKeyPositionFree(project, { position: { xU: -1, yU: 1.5 } })).toBe(false);
  expect(isKeyPositionFree(project, { position: { xU: 0, yU: 1 } })).toBe(true);
});
