import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import {
  addConditionalLayer,
  replaceConditionalLayer,
  removeConditionalLayer,
  validateAdvancedKeymap,
} from '@domain/advanced-keymap';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { getDefinedValue } from '../../../helpers/defined-value';

const project = {
  ...UNIBODY_PRESET,
  layers: [
    ...UNIBODY_PRESET.layers,
    { id: 'l2', name: 'Upper', bindings: {} },
    { id: 'l3', name: 'Adjust', bindings: {} },
  ],
};
it('creates a conditional chain and preserves targets through immutable edits', () => {
  let changed = addConditionalLayer(project);
  changed = replaceConditionalLayer(changed, {
    id: 'q1',
    ifLayerIds: ['l0', 'l1'],
    thenLayerId: 'l2',
  });
  changed = addConditionalLayer(changed);
  changed = replaceConditionalLayer(changed, {
    id: 'q2',
    ifLayerIds: ['l1', 'l2'],
    thenLayerId: 'l3',
  });
  expect(validateAdvancedKeymap(changed, BINDINGS_CATALOG)).toEqual([]);
  expect(removeConditionalLayer(changed, 'q2').conditionalLayers).toHaveLength(1);
  expect(project.conditionalLayers).toEqual([]);
});
it('reports missing/repeated inputs, duplicate target and backwards dependencies', () => {
  const changed = addConditionalLayer(project);
  const rule = getDefinedValue(changed.conditionalLayers[0]);
  const broken = replaceConditionalLayer(changed, {
    ...rule,
    ifLayerIds: ['l3', 'l3'],
    thenLayerId: 'l1',
  });
  expect(validateAdvancedKeymap(broken, BINDINGS_CATALOG).length).toBeGreaterThanOrEqual(2);
  const missing = { ...broken, layers: broken.layers.filter((layer) => layer.id !== 'l3') };
  expect(validateAdvancedKeymap(missing, BINDINGS_CATALOG).map((issue) => issue.code)).toContain(
    'conditional-layer-invalid',
  );
});
