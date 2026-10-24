import { rotateEncoder } from '@domain/encoders';
import { getEncoderGeometry } from '@domain/geometry';
import type { Project } from '@domain';
import { getDefinedValue } from '../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

it('rotates linked legacy-origin push keys at their visible center, including stale stored angles', () => {
  const project: Project = {
    ...buildProject({ keys: [{ id: 'k0', xU: 2, yU: 3, widthU: 2, rotationDeg: 90 }] }),
    encoders: [
      {
        id: 'e0',
        half: 'left',
        xU: 2,
        yU: 3,
        rotationDeg: 0,
        pushKeyId: 'k0',
        steps: 20,
        triggersPerRotation: 20,
      },
    ],
  };
  const next = rotateEncoder(project, { encoderId: 'e0', rotationDeg: 0 });
  expect(getEncoderGeometry(next, getDefinedValue(next.encoders[0]))).toEqual({
    xU: -4,
    yU: 2.5,
    rotationDeg: 0,
  });
  expect(next.keys[0]).toMatchObject({
    xU: -4.5,
    yU: 2.5,
    rotationOriginXU: -3.5,
    rotationOriginYU: 3,
  });
  expect(next.layers).toBe(project.layers);
  expect(rotateEncoder(project, { encoderId: 'e0', rotationDeg: 90 })).toBe(project);
  expect(rotateEncoder(project, { encoderId: 'missing', rotationDeg: 90 })).toBe(project);
});

it('rotates buttonless encoders without translation, retaining other project data', () => {
  const project: Project = {
    ...buildProject({}),
    encoders: [{ id: 'e0', half: 'left', xU: 7, yU: 4, steps: 20, triggersPerRotation: 20 }],
  };
  const next = rotateEncoder(project, { encoderId: 'e0', rotationDeg: -45 });
  expect(next.encoders[0]).toMatchObject({ xU: 7, yU: 4, rotationDeg: -45 });
  expect(next.keys).toBe(project.keys);
  expect(next.layers).toBe(project.layers);
});
