import { getDefinedValue } from '../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '@catalog/presets';
import { generateKeymap, renderAdvancedKeymap } from '@generators/keymap';
import golden from '../../../fixtures/expected/advanced-keymap/sections.dtsi?raw';

const modifier = { kind: 'kp', key: { keycode: 'LSHIFT', modifiers: [] } } as const;
const project = {
  ...UNIBODY_PRESET,
  layers: [...UNIBODY_PRESET.layers, { id: 'l2', name: 'Adjust', bindings: {} }],
  combos: [
    {
      id: 'c1',
      name: 'Escape',
      keyIds: ['k0', 'k1'],
      timeoutMs: 50,
      layerIds: ['l1'],
      binding: { kind: 'macro' as const, macroId: 'm1' },
    },
  ],
  macros: [
    {
      id: 'm1',
      name: 'Sequence',
      waitMs: 15,
      tapMs: 30,
      steps: [
        { id: 's1', kind: 'press' as const, binding: modifier },
        {
          id: 's2',
          kind: 'tap' as const,
          binding: { kind: 'kp' as const, key: { keycode: 'A', modifiers: [] } },
        },
        { id: 's3', kind: 'wait' as const, durationMs: 100 },
        { id: 's4', kind: 'release' as const, binding: modifier },
      ],
    },
  ],
  conditionalLayers: [{ id: 'q1', ifLayerIds: ['l0', 'l1'], thenLayerId: 'l2' }],
};
it('matches independent v0.3 combo, macro/pause and conditional golden sections', () => {
  expect(renderAdvancedKeymap(project, () => 'unused')).toBe(golden);
  expect(generateKeymap(project).content).toContain(golden);
  expect(generateKeymap(project)).toEqual(generateKeymap(project));
});
it('resolves keys/layers by identity after reorder and omits empty/all-layers sections', () => {
  const reordered = {
    ...project,
    keys: project.keys.toReversed(),
    layers: [project.layers[1], project.layers[0], project.layers[2]].filter(
      (layer) => layer !== undefined,
    ),
  };
  const output = generateKeymap(reordered).content;
  expect(output).toContain('key-positions = <4 5>;');
  expect(output).toContain('layers = <0>;');
  expect(output).toContain('if-layers = <0 1>;');
  expect(renderAdvancedKeymap(UNIBODY_PRESET, () => 'unused')).toBe('');
  const allLayers = {
    ...project,
    combos: [{ ...getDefinedValue(project.combos[0]), layerIds: [] }],
  };
  expect(renderAdvancedKeymap(allLayers, () => 'unused')).not.toContain('            layers =');
});

it('sorts definitions and numeric layer filters independently of insertion order', () => {
  const combo = getDefinedValue(project.combos[0]);
  const macro = getDefinedValue(project.macros[0]);
  const rule = getDefinedValue(project.conditionalLayers[0]);
  const definitions = {
    ...project,
    combos: [
      { ...combo, id: 'c2', name: 'Zulu', layerIds: ['l2', 'l0'] },
      combo,
      { ...combo, id: 'c3', name: 'Alpha' },
    ],
    macros: [{ ...macro, id: 'm2', name: 'Zulu' }, macro, { ...macro, id: 'm3', name: 'Alpha' }],
    conditionalLayers: [{ ...rule, id: 'q2' }, rule, { ...rule, id: 'q3' }],
  };
  const output = generateKeymap(definitions).content;
  expect(output.indexOf('user_combo_alpha_c3')).toBeLessThan(
    output.indexOf('user_combo_escape_c1'),
  );
  expect(output.indexOf('user_combo_escape_c1')).toBeLessThan(output.indexOf('user_combo_zulu_c2'));
  expect(output.indexOf('user_macro_alpha_m3')).toBeLessThan(
    output.indexOf('user_macro_sequence_m1'),
  );
  expect(output.indexOf('user_rule_q1')).toBeLessThan(output.indexOf('user_rule_q2'));
  expect(output).toContain('layers = <0 2>;');
  expect(
    generateKeymap({
      ...definitions,
      combos: definitions.combos.toReversed(),
      macros: definitions.macros.toReversed(),
      conditionalLayers: definitions.conditionalLayers.toReversed(),
    }).content,
  ).toBe(output);
});

it('collects nested action headers and inline nodes from combos and macro steps', () => {
  const combo = getDefinedValue(project.combos[0]);
  const macro = getDefinedValue(project.macros[0]);
  const nested = {
    ...project,
    combos: [{ ...combo, binding: { kind: 'bt' as const, command: 'BT_CLR' as const } }],
    macros: [
      {
        ...macro,
        steps: [
          {
            id: 's1',
            kind: 'tap' as const,
            binding: {
              kind: 'tap_dance' as const,
              taps: [{ keycode: 'A', modifiers: [] }],
              tappingTermMs: 200,
            },
          },
          {
            id: 's2',
            kind: 'tap' as const,
            binding: { kind: 'out' as const, command: 'OUT_USB' as const },
          },
        ],
      },
    ],
  };
  const output = generateKeymap(nested).content;
  expect(output).toContain('#include <dt-bindings/zmk/bt.h>');
  expect(output).toContain('#include <dt-bindings/zmk/outputs.h>');
  expect(output).toContain('compatible = "zmk,behavior-tap-dance";');
  expect(output.match(/    behaviors \{/gu)).toHaveLength(1);
  expect(output).toContain('&macro_tap &custom_td_');
  expect(() => generateKeymap({ ...project, macros: [] })).toThrow('Validated macro is missing');
});
