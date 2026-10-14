import { removeKey } from '@domain/keys';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import type { Project } from '@domain';
import { generateShieldFiles } from '@generators/shield';
import layoutGolden from '../../../fixtures/generated/layout/layout.overlay?raw';

import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';
import { buildMatrixProject } from '../../../helpers/build-matrix-project';

const target = {
  boardId: 'nice_nano_v2',
  connector: 'pro_micro' as const,
  gpioPins: [2, 8, 9, 10],
};
function files(project: Project) {
  return generateShieldFiles(project, getResultValue(deriveShieldMatrix(project, target)), target);
}
function fileContent(generated: ReturnType<typeof files>, suffix: string): string {
  return generated.find((file) => file.path.endsWith(suffix))?.content ?? '';
}

it('exports all seven sized rotated physical cells against an independent golden', () => {
  const project = buildMatrixProject([[2, 8]]);
  const edited = {
    ...project,
    keys: project.keys.map((key) => ({
      id: key.id,
      diode: { pin: 1 as const, cathode: 'away-switch' as const },
      widthU: 2.25,
      heightU: 1.5,
      xU: -1.235,
      yU: -0.5,
      rotationDeg: -30,
      rotationOriginXU: 1,
      rotationOriginYU: 2,
    })),
  };
  const generated = files(edited);
  expect(fileContent(generated, '.overlay')).toBe(layoutGolden);
  expect(files(edited)).toEqual(generated);
});
it('deleting a key exports n-1 corresponding physical cells, matrix cells and bindings in every layer', () => {
  const project = buildMatrixProject([
    [2, 8],
    [2, 9],
    [2, 10],
  ]);
  const bound: Project = {
    ...project,
    layers: [
      {
        id: 'l0',
        name: 'Base',
        bindings: {
          k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
          k1: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
          k2: { kind: 'kp', key: { keycode: 'C', modifiers: [] } },
        },
      },
      {
        id: 'l1',
        name: 'Fn',
        bindings: { k0: { kind: 'trans' }, k1: { kind: 'trans' }, k2: { kind: 'none' } },
      },
    ],
  };
  const deleted = removeKey(bound, { keyId: 'k1' });
  const output = files(deleted);
  const overlay = fileContent(output, '.overlay');
  expect(overlay.match(/RC\(\d+,\d+\)/gu)).toEqual(['RC(0,0)', 'RC(0,1)']);
  expect(overlay.match(/<&key_physical_attrs[^>]+>/gu)).toEqual([
    '<&key_physical_attrs 100 100 0 0 0 0 0>',
    '<&key_physical_attrs 100 100 800 800 0 0 0>',
  ]);
  expect(fileContent(output, '.keymap')).toContain('                &kp A\n                &kp C');
  expect(fileContent(output, '.keymap')).toContain('                &trans\n                &none');
  expect(deleted.layers.map((layer) => Object.keys(layer.bindings))).toEqual([
    ['k0', 'k2'],
    ['k0', 'k2'],
  ]);
});
