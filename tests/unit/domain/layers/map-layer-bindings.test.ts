import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import type { Project } from '@domain';
import { mapLayerBindings } from '@domain';

const PROJECT = buildProject({
  keys: [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 1, yU: 0 },
  ],
  bindings: { k1: { kind: 'none' } },
});

function bindingKeyOrder(project: Project): readonly string[] {
  const bindings = project.layers[0]?.bindings ?? {};
  return Object.keys(bindings);
}

it('returns the same project when the change keeps every binding', () => {
  expect(
    mapLayerBindings(PROJECT, { layerIndex: 0, keyIds: ['k1', 'k2'] }, (binding) => binding),
  ).toBe(PROJECT);
});

it('skips unknown key ids', () => {
  const next = mapLayerBindings(PROJECT, { layerIndex: 0, keyIds: ['k9'] }, () => ({
    kind: 'none',
  }));
  expect(next).toBe(PROJECT);
});

it('returns the same project for a missing layer', () => {
  expect(mapLayerBindings(PROJECT, { layerIndex: 2, keyIds: ['k1'] }, (binding) => binding)).toBe(
    PROJECT,
  );
});

it('applies the change in key order', () => {
  const empty = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
    ],
  });
  const next = mapLayerBindings(empty, { layerIndex: 0, keyIds: ['k2', 'k1'] }, () => ({
    kind: 'trans',
  }));
  expect(bindingKeyOrder(next)).toEqual(['k1', 'k2']);
});
