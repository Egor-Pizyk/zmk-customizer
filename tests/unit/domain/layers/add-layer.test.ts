import { addLayer, removeLayer } from '@domain/layers';
import { validateBindings } from '@domain/validation';
import { setBindings } from '@domain/bindings/editing';
import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';

const KEYS = [
  { id: 'k2', xU: 0, yU: 0 },
  { id: 'k1', xU: 1, yU: 0 },
];

it('keeps a copied reference deleted after its last project reference is replaced', () => {
  const copied = { kind: 'mo', layerId: 'l1' } as const;
  const project = buildProject({
    keys: KEYS,
    layers: [
      { id: 'l0', name: 'Base', bindings: { k1: copied } },
      { id: 'l1', name: 'Nav', bindings: {} },
    ],
  });
  const removed = removeLayer(project, { layerIndex: 1 });
  const replaced = setBindings(removed, {
    layerIndex: 0,
    keyIds: ['k1'],
    binding: { kind: 'none' },
  });
  const added = addLayer(replaced, { reservedLayerIds: [copied.layerId] });
  expect(added.layers[1]?.id).toBe('l2');
  const pasted = setBindings(added, { layerIndex: 0, keyIds: ['k2'], binding: copied });
  const catalog = {
    keycodeNames: new Set<string>(),
    bluetoothProfileCount: 5,
    maxLayerCount: 32,
    advancedLimits: { comboKeys: 20, macroBindings: 256, macroQueue: 64 },
    encoderLimits: { maxSteps: 360, maxTriggers: 360, rotationDegrees: 360 },
    shieldLimits: {
      keyboardNameBytes: 16,
      layerNodeNameLength: 31,
      layerDisplayNameBytes: 19,
      minLayoutCell: -32_768,
      maxLayoutCell: 32_767,
    },
  };
  expect(validateBindings(pasted, catalog).map(({ code }) => code)).toEqual([
    'binding-layer-missing',
  ]);
});

it('appends a layer with pass-through on every key, in key order (spec 007 Q2)', () => {
  const project = addLayer(buildProject({ keys: KEYS }));
  expect(project.layers).toHaveLength(2);
  expect(project.layers[1]).toEqual({
    id: 'l1',
    name: 'Layer 1',
    bindings: { k2: { kind: 'trans' }, k1: { kind: 'trans' } },
  });
  // Key order, not only content: the same project must serialize identically.
  expect(JSON.stringify(project.layers[1]?.bindings)).toBe(
    '{"k2":{"kind":"trans"},"k1":{"kind":"trans"}}',
  );
});

it('takes the next number when "Layer N" would make a duplicate keymap name', () => {
  const project = buildProject({
    layers: [
      { id: 'l0', name: 'Base', bindings: {} },
      { id: 'l1', name: 'layer-2', bindings: {} },
    ],
  });
  expect(addLayer(project).layers[2]?.name).toBe('Layer 3');
});

it('never reuses a layer id', () => {
  const project = buildProject({
    layers: [
      { id: 'l0', name: 'Base', bindings: {} },
      { id: 'l2', name: 'Nav', bindings: {} },
    ],
  });
  expect(addLayer(project).layers[2]?.id).toBe('l3');
});

it('never reuses the id of a deleted layer that a key still points at (research R1)', () => {
  const project = buildProject({
    keys: KEYS,
    layers: [
      { id: 'l0', name: 'Base', bindings: { k1: { kind: 'mo', layerId: 'l1' } } },
      { id: 'l1', name: 'Nav', bindings: {} },
    ],
  });
  const added = addLayer(removeLayer(project, { layerIndex: 1 }));
  expect(added.layers.map((layer) => layer.id)).toEqual(['l0', 'l2']);
  expect(added.layers[0]?.bindings['k1']).toEqual({ kind: 'mo', layerId: 'l1' });
  const catalog = {
    keycodeNames: new Set<string>(),
    bluetoothProfileCount: 5,
    maxLayerCount: 32,
    advancedLimits: { comboKeys: 20, macroBindings: 256, macroQueue: 64 },
    encoderLimits: { maxSteps: 360, maxTriggers: 360, rotationDegrees: 360 },
    shieldLimits: {
      keyboardNameBytes: 16,
      layerNodeNameLength: 31,
      layerDisplayNameBytes: 19,
      minLayoutCell: -32_768,
      maxLayoutCell: 32_767,
    },
  };
  expect(validateBindings(added, catalog).map(({ code }) => code)).toEqual([
    'binding-layer-missing',
  ]);
});
