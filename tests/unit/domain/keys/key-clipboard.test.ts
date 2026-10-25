import type { Project } from '@domain';
import { copyKeys, pasteKeys, removeKeys } from '@domain/keys';
import { expect, it } from 'vitest';
import { buildProject, keyPin, freeEnd } from '../../../helpers/build-project';

it('captures source order and all layers, excludes push keys, and pastes a snapshot without wiring', () => {
  const project = buildProject({
    keys: [
      {
        id: 'k0',
        xU: 2,
        yU: 3,
        widthU: 2,
        half: 'right',
        diode: { pin: 1, cathode: 'away-switch' },
      },
      { id: 'k1', xU: 6, yU: 3 },
      { id: 'k2', xU: 9, yU: 3 },
    ],
    layers: [
      { id: 'l0', name: 'Base', bindings: { k0: { kind: 'trans' } } },
      { id: 'l1', name: 'Nav', bindings: { k0: { kind: 'mo', layerId: 'l0' } } },
    ],
    wires: [{ id: 'w0', start: keyPin('k0', 1), end: freeEnd(0, 3), bends: [] }],
  });
  const withEncoder: Project = {
    ...project,
    encoders: [
      { id: 'e0', half: 'left', xU: 9, yU: 3, pushKeyId: 'k2', steps: 20, triggersPerRotation: 20 },
    ],
  };
  const clipboard = copyKeys(withEncoder, { keyIds: ['k2', 'k1', 'k0', 'k0'] });
  expect(clipboard.keys.map((key) => key.id)).toEqual(['k0', 'k1']);
  const current = removeKeys(withEncoder, { keyIds: ['k0'] });
  const next = pasteKeys(current, { clipboard, maxKeyCount: 512 });
  expect(next.keys.slice(-2)).toEqual([
    { ...project.keys[0], id: 'k3', xU: 11, rotationOriginXU: 9 },
    { ...project.keys[1], id: 'k4', xU: 15, rotationOriginXU: 9 },
  ]);
  expect(next.layers[0]?.bindings['k3']).toEqual({ kind: 'trans' });
  expect(next.layers[1]?.bindings['k3']).toEqual({ kind: 'mo', layerId: 'l0' });
  expect(next.layers[0]?.bindings).not.toHaveProperty('k4');
  expect(next.wires).toBe(current.wires);
  expect(next.encoders).toBe(current.encoders);
  expect(pasteKeys(current, { clipboard, maxKeyCount: 3 })).toBe(current);
  expect(
    pasteKeys(current, { clipboard: copyKeys(project, { keyIds: [] }), maxKeyCount: 512 }),
  ).toBe(current);
  expect(project.keys[0]?.xU).toBe(2);
});

it('pastes into an empty layout with finite original geometry and repeats with fresh IDs', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 5, yU: 4 }] });
  const clipboard = copyKeys(project, { keyIds: ['k0'] });
  const empty = removeKeys(project, { keyIds: ['k0'] });
  const pasted = pasteKeys(empty, { clipboard, maxKeyCount: 512 });
  expect(pasted.keys[0]).toMatchObject({ xU: 5, yU: 4 });
  const repeated = pasteKeys(pasted, { clipboard, maxKeyCount: 512 });
  expect(repeated.keys[1]).toMatchObject({ id: 'k2', xU: 7, yU: 4 });
});
