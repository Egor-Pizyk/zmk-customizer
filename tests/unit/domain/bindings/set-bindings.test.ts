import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { setBindings } from '@domain';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
  { id: 'k3', xU: 2, yU: 0 },
];
const SPACE = { kind: 'kp', key: { keycode: 'SPACE', modifiers: [] } } as const;

it('sets one binding on every listed key and keeps the others', () => {
  const project = buildProject({ keys: KEYS, bindings: { k3: { kind: 'trans' } } });
  const next = setBindings(project, { layerIndex: 0, keyIds: ['k1', 'k2'], binding: SPACE });
  expect(next.layers[0]?.bindings).toEqual({ k1: SPACE, k2: SPACE, k3: { kind: 'trans' } });
});

it('returns the same project when nothing changes', () => {
  const project = buildProject({ keys: KEYS, bindings: { k1: SPACE } });
  expect(setBindings(project, { layerIndex: 0, keyIds: ['k1'], binding: SPACE })).toBe(project);
  expect(setBindings(project, { layerIndex: 0, keyIds: [], binding: SPACE })).toBe(project);
  expect(setBindings(project, { layerIndex: 5, keyIds: ['k1'], binding: SPACE })).toBe(project);
});

it('ignores unknown key ids', () => {
  const project = buildProject({ keys: KEYS });
  const next = setBindings(project, { layerIndex: 0, keyIds: ['k9', 'k1'], binding: SPACE });
  expect(next.layers[0]?.bindings).toEqual({ k1: SPACE });
});
