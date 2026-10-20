import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import {
  addCombo,
  replaceCombo,
  removeCombo,
  validateAdvancedKeymap,
} from '@domain/advanced-keymap';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { getDefinedValue } from '../../../helpers/defined-value';

it('creates and edits a combo without changing existing keys or layers', () => {
  const added = addCombo(UNIBODY_PRESET, { name: 'Escape', keyIds: ['k0', 'k1'] });
  const combo = getDefinedValue(added.combos[0]);
  expect(combo).toEqual({
    id: 'c1',
    name: 'Escape',
    keyIds: ['k0', 'k1'],
    timeoutMs: 50,
    layerIds: [],
    binding: { kind: 'kp', key: { keycode: 'ESC', modifiers: [] } },
  });
  expect(added.keys).toBe(UNIBODY_PRESET.keys);
  expect(replaceCombo(added, { ...combo, timeoutMs: 75 }).combos[0]?.timeoutMs).toBe(75);
  expect(removeCombo(added, combo.id).combos).toEqual([]);
  expect(UNIBODY_PRESET.combos).toEqual([]);
});
it('retains stable IDs through key reorder and reports deleted keys', () => {
  const added = addCombo(UNIBODY_PRESET, { name: 'Escape', keyIds: ['k0', 'k1'] });
  const reordered = { ...added, keys: added.keys.toReversed() };
  expect(validateAdvancedKeymap(reordered, BINDINGS_CATALOG)).toEqual([]);
  const removed = { ...added, keys: added.keys.filter((key) => key.id !== 'k0') };
  expect(validateAdvancedKeymap(removed, BINDINGS_CATALOG)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: 'combo-invalid', path: ['combos', 0] }),
    ]),
  );
});
it('reports invalid combo size, duplicate keys, timeout and layer filter', () => {
  const project = addCombo(UNIBODY_PRESET, { name: 'Bad', keyIds: ['k0', 'k0'] });
  const combo = getDefinedValue(project.combos[0]);
  const broken = replaceCombo(project, { ...combo, timeoutMs: 0, layerIds: ['l99'] });
  expect(validateAdvancedKeymap(broken, BINDINGS_CATALOG).length).toBeGreaterThanOrEqual(3);
});
