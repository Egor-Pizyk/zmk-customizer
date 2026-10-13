import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { validateLayers } from '@domain';

const CATALOG = {
  maxLayerCount: 32,
  shieldLimits: {
    keyboardNameBytes: 16,
    layerNodeNameLength: 31,
    layerDisplayNameBytes: 19,
    minLayoutCell: -32_768,
    maxLayoutCell: 32_767,
  },
};

function withNames(names: readonly string[]) {
  return buildProject({
    layers: names.map((name, index) => ({ id: `l${index}`, name, bindings: {} })),
  });
}

function codesAndPaths(names: readonly string[]) {
  return validateLayers(withNames(names), CATALOG).map(({ code, path }) => ({ code, path }));
}

it('accepts unique usable names', () => {
  expect(validateLayers(withNames(['Base', 'Nav & Sym', '2nd']), CATALOG)).toEqual([]);
});

it('reports a name without Latin letters or digits', () => {
  expect(codesAndPaths(['Base', 'Ω'])).toEqual([
    { code: 'layer-name-empty', path: ['layers', 1, 'name'] },
  ]);
});

it.each(['Say "hi"', String.raw`back\slash`, 'two\nlines', 'tab\there', 'nul\u0000', 'del\u007F'])(
  'reports a quote, backslash or control character in %j',
  (name) => {
    expect(codesAndPaths(['Base', name])).toEqual([
      { code: 'layer-name-invalid-character', path: ['layers', 1, 'name'] },
    ]);
  },
);

// Both sides, so the field the user just renamed shows the problem too (FR-006).
it('reports every layer whose keymap node name another layer has, naming the other', () => {
  expect(codesAndPaths(['Nav', 'Base', 'nav', 'Nav Sym', 'Nav-Sym'])).toEqual([
    { code: 'layer-name-duplicate', path: ['layers', 0, 'name'] },
    { code: 'layer-name-duplicate', path: ['layers', 2, 'name'] },
    { code: 'layer-name-duplicate', path: ['layers', 3, 'name'] },
    { code: 'layer-name-duplicate', path: ['layers', 4, 'name'] },
  ]);
  const [first, second] = validateLayers(withNames(['Nav', 'nav']), CATALOG);
  expect(first?.message).toContain('layer 1 "nav"');
  expect(second?.message).toContain('layer 0 "Nav"');
  expect(second?.message).toContain('nav_layer');
});

it('reports layers beyond the ZMK limit once, at the first layer over it', () => {
  const names = Array.from({ length: 33 }, (_, index) => `Layer ${index}`);
  expect(codesAndPaths(names)).toEqual([{ code: 'layer-count-exceeded', path: ['layers', 32] }]);
  expect(validateLayers(withNames(names.slice(0, 32)), CATALOG)).toEqual([]);
});
