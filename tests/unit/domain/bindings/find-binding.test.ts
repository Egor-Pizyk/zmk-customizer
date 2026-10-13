import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { findBinding } from '@domain';

const KEYS = [{ id: 'k1', xU: 0, yU: 0 }];

it('finds the binding of a key on a layer', () => {
  const project = buildProject({ keys: KEYS, bindings: { k1: { kind: 'none' } } });
  expect(findBinding(project, { layerIndex: 0, keyId: 'k1' })).toEqual({ kind: 'none' });
});

it('returns undefined for an unassigned key or a missing layer', () => {
  const project = buildProject({ keys: KEYS });
  expect(findBinding(project, { layerIndex: 0, keyId: 'k1' })).toBeUndefined();
  expect(findBinding(project, { layerIndex: 3, keyId: 'k1' })).toBeUndefined();
});
