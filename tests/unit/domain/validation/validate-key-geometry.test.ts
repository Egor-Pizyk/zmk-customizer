import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { buildProject } from '../../../helpers/build-project';
import { validateKeyGeometry } from '@domain';

it('accepts rounded positive dimension cells and all signed int16 geometry bounds', () => {
  expect(
    validate(
      buildProject({
        keys: [
          {
            id: 'k0',
            xU: -327.68,
            yU: 327.67,
            widthU: 0.005,
            heightU: 327.67,
            rotationDeg: -327.68,
            rotationOriginXU: 327.67,
          },
        ],
      }),
    ),
  ).toEqual([]);
});
it.each(['xU', 'yU', 'widthU', 'heightU', 'rotationDeg', 'rotationOriginXU', 'rotationOriginYU'])(
  'reports an out-of-range %s at the affected key',
  (field) => {
    const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0, [field]: 327.68 }] });
    expect(validate(project)).toMatchObject([
      { code: 'physical-layout-out-of-range', path: ['keys', 0] },
    ]);
  },
);
it.each([0, -1, 0.004])('reports width %s that rounds to a nonpositive cell', (widthU) => {
  expect(validate(buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0, widthU }] }))).toHaveLength(1);
});

function validate(project: Project) {
  return validateKeyGeometry(project, { minLayoutCell: -32_768, maxLayoutCell: 32_767 });
}
