import { removeLayer } from '@domain/layers';
import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

const KEYS = [{ id: 'k1', xU: 0, yU: 0 }];
const PROJECT = buildProject({
  keys: KEYS,
  layers: [
    { id: 'l0', name: 'Base', bindings: { k1: { kind: 'mo', layerId: 'l1' } } },
    { id: 'l1', name: 'Nav', bindings: { k1: { kind: 'trans' } } },
    { id: 'l2', name: 'Sym', bindings: {} },
  ],
});

it('removes the layer with its bindings', () => {
  expect(removeLayer(PROJECT, { layerIndex: 1 }).layers.map((layer) => layer.id)).toEqual([
    'l0',
    'l2',
  ]);
});

it('keeps references to the removed layer, so validation can report them (FR-012)', () => {
  expect(removeLayer(PROJECT, { layerIndex: 1 }).layers[0]?.bindings['k1']).toEqual({
    kind: 'mo',
    layerId: 'l1',
  });
});

it('never removes the last layer and ignores a position outside the layers', () => {
  const single = buildProject({});
  expect(removeLayer(single, { layerIndex: 0 })).toBe(single);
  expect(removeLayer(PROJECT, { layerIndex: 3 })).toBe(PROJECT);
});
