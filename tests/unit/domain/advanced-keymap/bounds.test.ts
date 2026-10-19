import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '@catalog/presets';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { addCombo, addMacro, validateAdvancedKeymap } from '@domain/advanced-keymap';
import { getProjectResourceError } from '@domain/project';
import { getDefinedValue } from '../../../helpers/defined-value';

const base = addMacro(addCombo(UNIBODY_PRESET, { name: 'Escape', keyIds: ['k0', 'k1'] }), {
  name: 'Sequence',
});
const combo = getDefinedValue(base.combos[0]);
const macro = getDefinedValue(base.macros[0]);
it('rejects duplicate names and invalid key/layer filters', () => {
  const project = {
    ...base,
    combos: [
      { ...combo, keyIds: ['k0', 'k0'], layerIds: ['l9', 'l9'], timeoutMs: 0 },
      { ...combo, id: 'c2', name: ' escape ' },
    ],
  };
  const errors = validateAdvancedKeymap(project, BINDINGS_CATALOG)
    .map((issue) => issue.message)
    .join(' ');
  expect(errors).toContain('distinct keys');
  expect(errors).toContain('distinct existing layers');
  expect(errors).toContain('unique name');
  expect(errors).toContain('timeout');
});
it('rejects duplicate conditional targets and circular dependencies', () => {
  const project = {
    ...base,
    layers: [...base.layers, { id: 'l2', name: 'Adjust', bindings: {} }],
    conditionalLayers: [
      { id: 'q1', ifLayerIds: ['l0', 'l1'], thenLayerId: 'l2' },
      { id: 'q2', ifLayerIds: ['l0', 'l2'], thenLayerId: 'l1' },
      { id: 'q3', ifLayerIds: ['l0', 'l1'], thenLayerId: 'l2' },
    ],
  };
  const errors = validateAdvancedKeymap(project, BINDINGS_CATALOG)
    .map((issue) => issue.message)
    .join(' ');
  expect(errors).toContain('only one conditional rule');
  expect(errors).toContain('circular layer dependency');
});
it('rejects oversized runtime collections before analysis/export', () => {
  expect(
    getProjectResourceError({ ...base, combos: Array.from({ length: 129 }, () => combo) }),
  ).toContain('128');
  expect(
    getProjectResourceError({ ...base, combos: [{ ...combo, name: 'a'.repeat(161) }] }),
  ).toContain('combo');
  expect(
    getProjectResourceError({
      ...base,
      combos: [{ ...combo, keyIds: Array.from({ length: 21 }, (_, index) => `k${index}`) }],
    }),
  ).toContain('combo');
  expect(
    getProjectResourceError({
      ...base,
      combos: [{ ...combo, layerIds: Array.from({ length: 33 }, (_, index) => `l${index}`) }],
    }),
  ).toContain('combo');
  expect(
    getProjectResourceError({ ...base, macros: [{ ...macro, name: 'a'.repeat(161) }] }),
  ).toContain('macro');
  expect(
    getProjectResourceError({
      ...base,
      conditionalLayers: [
        {
          id: 'q1',
          ifLayerIds: Array.from({ length: 33 }, (_, index) => `l${index}`),
          thenLayerId: 'l0',
        },
      ],
    }),
  ).toContain('32');
});
