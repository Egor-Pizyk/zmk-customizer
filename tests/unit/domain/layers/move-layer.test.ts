import { moveLayer } from '@domain/layers';
import type { Binding, Layer, Project } from '@domain';
import { describe, expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

const KEYS = ['k1', 'k2', 'k3', 'k4', 'k5'].map((id, index) => ({ id, xU: index, yU: 0 }));
const NAMES = ['Base', 'Nav', 'Sym', 'Fn'];
const SPACE = { keycode: 'SPACE', modifiers: [] };

// Every layer points at every other layer with each of the five layer behaviors.
function pointingBindings(layerIndex: number): Layer['bindings'] {
  const target = (offset: number) => `l${(layerIndex + offset) % NAMES.length}`;
  const bindings: readonly Binding[] = [
    { kind: 'mo', layerId: target(1) },
    { kind: 'lt', layerId: target(2), tap: SPACE },
    { kind: 'tog', layerId: target(3) },
    { kind: 'to', layerId: target(0) },
    { kind: 'sl', layerId: target(1) },
  ];
  return Object.fromEntries(bindings.map((binding, index) => [`k${index + 1}`, binding]));
}

const PROJECT = buildProject({
  keys: KEYS,
  layers: NAMES.map((name, index) => ({
    id: `l${index}`,
    name,
    bindings: pointingBindings(index),
  })),
});

// "Key k1 on Nav → Sym" for every layer behavior, independent of layer order.
function describeTargets(project: Project): readonly string[] {
  const nameById = new Map(project.layers.map((layer) => [layer.id, layer.name]));
  return project.layers
    .flatMap((layer) =>
      Object.entries(layer.bindings).map(
        ([keyId, binding]) =>
          `${keyId} on ${layer.name} → ${'layerId' in binding ? nameById.get(binding.layerId) : '-'}`,
      ),
    )
    .toSorted();
}

describe('moveLayer', () => {
  it('moves one layer to the given position', () => {
    const moved = moveLayer(PROJECT, { layerIndex: 3, toIndex: 1 });
    expect(moved.layers.map((layer) => layer.name)).toEqual(['Base', 'Fn', 'Nav', 'Sym']);
    expect(
      moveLayer(PROJECT, { layerIndex: 0, toIndex: 2 }).layers.map((layer) => layer.name),
    ).toEqual(['Nav', 'Sym', 'Base', 'Fn']);
  });

  it('returns the same project for a move to the same place or outside the layers', () => {
    expect(moveLayer(PROJECT, { layerIndex: 1, toIndex: 1 })).toBe(PROJECT);
    expect(moveLayer(PROJECT, { layerIndex: 4, toIndex: 0 })).toBe(PROJECT);
    expect(moveLayer(PROJECT, { layerIndex: 0, toIndex: 4 })).toBe(PROJECT);
    expect(moveLayer(PROJECT, { layerIndex: 0, toIndex: -1 })).toBe(PROJECT);
  });

  // SC-002: every reorder keeps every layer behavior on the same named layer.
  const moves = NAMES.flatMap((_, layerIndex) =>
    NAMES.map((__, toIndex) => ({ layerIndex, toIndex })),
  );
  it.each(moves)('keeps every reference on its named layer when moving %j', (move) => {
    expect(describeTargets(moveLayer(PROJECT, move))).toEqual(describeTargets(PROJECT));
  });
});
