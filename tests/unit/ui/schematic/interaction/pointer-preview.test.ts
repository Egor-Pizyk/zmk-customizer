import { expect, it } from 'vitest';
import { buildProject, keyPin } from '../../../../helpers/build-project';
import { getPreviewProject } from '@ui/schematic';

it('evaluates multi-key crossings after the complete preview move', () => {
  const project = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 2, yU: -2 },
      { id: 'k3', xU: 5, yU: 0 },
      { id: 'k4', xU: 2, yU: 3 },
    ],
    wires: [
      { id: 'w1', start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
      { id: 'w2', start: keyPin('k2', 1), end: keyPin('k4', 1), bends: [] },
    ],
    insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 0 }],
  });
  const preview = getPreviewProject(project, {
    kind: 'multi-key',
    keyIds: ['k1', 'k2', 'k3', 'k4'],
    origin: { xU: 0, yU: 0 },
    position: { xU: 10, yU: 0 },
    keyStarts: [
      { keyId: 'k1', start: { xU: 0, yU: 0 } },
      { keyId: 'k2', start: { xU: 2, yU: -2 } },
      { keyId: 'k3', start: { xU: 5, yU: 0 } },
      { keyId: 'k4', start: { xU: 2, yU: 3 } },
    ],
  });
  expect(preview.insulatedCrossings).toEqual(project.insulatedCrossings);
  expect(preview.wires).toBe(project.wires);
  expect(project.keys[0]?.xU).toBe(0);
});
