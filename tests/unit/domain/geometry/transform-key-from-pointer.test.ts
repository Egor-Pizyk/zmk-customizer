import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { transformKeyFromPointer } from '@domain';

it('shows overlapping resize previews but refuses conflicting release', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 0 },
    ],
  });
  const gesture = {
    kind: 'resize' as const,
    keyId: 'k0',
    direction: { x: 1 as const, y: 0 as const },
    start: { xU: 1, yU: 0 },
    position: { xU: 3, yU: 0 },
  };
  expect(transformKeyFromPointer(project, { gesture, phase: 'preview' }).keys[0]?.widthU).toBe(3);
  expect(transformKeyFromPointer(project, { gesture, phase: 'commit' })).toBe(project);
  expect(
    transformKeyFromPointer(project, {
      gesture: { ...gesture, position: { xU: 2, yU: 0 } },
      phase: 'commit',
    }).keys[0]?.widthU,
  ).toBe(2);
});
