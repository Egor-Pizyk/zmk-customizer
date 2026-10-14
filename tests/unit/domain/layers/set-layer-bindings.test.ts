import { setLayerBindings } from '@domain/layers';
import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

it('replaces the bindings of one layer', () => {
  const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const next = setLayerBindings(project, { layerIndex: 0, bindings: { k1: { kind: 'none' } } });
  expect(next.layers).toEqual([{ id: 'l0', name: 'Base', bindings: { k1: { kind: 'none' } } }]);
});

it('returns the same project for the same bindings or a missing layer', () => {
  const bindings = { k1: { kind: 'none' } } as const;
  const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }], bindings });
  expect(setLayerBindings(project, { layerIndex: 0, bindings })).toBe(project);
  expect(setLayerBindings(project, { layerIndex: 2, bindings: {} })).toBe(project);
});

it('drops bindings for missing keys and returns the same project when only dangling changed', () => {
  const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const next = setLayerBindings(project, {
    layerIndex: 0,
    bindings: { k1: { kind: 'none' }, k9: { kind: 'none' } },
  });
  expect(next.layers[0]?.bindings).toEqual({ k1: { kind: 'none' } });
  expect(setLayerBindings(project, { layerIndex: 0, bindings: { k9: { kind: 'none' } } })).toBe(
    project,
  );
});
