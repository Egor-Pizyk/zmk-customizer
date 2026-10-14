import { duplicateKeys } from '@domain/keys';
import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('clones source-order geometry, diode and all bindings with exact fresh IDs and no wires', () => {
  const project = buildProject({
    keys: [
      {
        id: 'k9007199254740993',
        xU: 0,
        yU: 0,
        widthU: 2,
        rotationDeg: 90,
        diode: { pin: 1, cathode: 'away-switch' },
      },
      { id: 'k1', xU: 4, yU: 0 },
    ],
    wires: [
      {
        id: 'w0',
        start: keyPin('k9007199254740993', 1),
        end: freeEnd(4, 0),
        bends: [{ xU: 2, yU: 0 }],
      },
    ],
    layers: [
      { id: 'l0', name: 'Base', bindings: { k9007199254740993: { kind: 'trans' } } },
      {
        id: 'l1',
        name: 'Fn',
        bindings: { k9007199254740993: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
      },
    ],
  });
  const before = structuredClone(project);
  const next = duplicateKeys(project, {
    keyIds: ['k1', 'k9007199254740993', 'k1'],
    maxKeyCount: 512,
  });
  expect(next.keys.map((key) => key.id)).toEqual([
    'k9007199254740993',
    'k1',
    'k9007199254740994',
    'k9007199254740995',
  ]);
  expect(next.keys[2]).toMatchObject({
    widthU: 2,
    rotationDeg: 90,
    diode: project.keys[0]?.diode,
    xU: 7,
    rotationOriginXU: 7,
  });
  expect(next.layers[0]?.bindings['k9007199254740994']).toEqual({ kind: 'trans' });
  expect(next.layers[1]?.bindings['k9007199254740994']).toEqual({
    kind: 'kp',
    key: { keycode: 'A', modifiers: [] },
  });
  expect(next.layers[0]?.bindings).not.toHaveProperty('k9007199254740995');
  expect(next.wires).toBe(project.wires);
  expect(project).toEqual(before);
  expect(duplicateKeys(project, { keyIds: [], maxKeyCount: 512 })).toBe(project);
  expect(duplicateKeys(project, { keyIds: ['absent'], maxKeyCount: 512 })).toBe(project);
  expect(duplicateKeys(project, { keyIds: ['k1'], maxKeyCount: 2 })).toBe(project);
});
