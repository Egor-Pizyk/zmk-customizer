import { getDefinedValue } from '../../../helpers/defined-value';
import { replaceBehavior, addBehavior, createBehaviorBinding } from '@domain/behaviors';
import { expect, it } from 'vitest';
import { createProject } from '@domain/project';
import { generateKeymap, renderNamedBehaviors } from '@generators/keymap';
import golden from '../../../fixtures/expected/behaviors/five-types.dtsi?raw';

it('renders independently specified v0.3 nodes for all five types', () => {
  let project = createProject({ controllerId: 'nice_nano_v2' });
  for (const [kind, name] of [
    ['hold-tap', 'Held'],
    ['tap-dance', 'Dance'],
    ['mod-morph', 'Morph'],
    ['sticky-key', 'Sticky key'],
    ['sticky-layer', 'Sticky layer'],
  ] as const) {
    project = addBehavior(project, { kind, name });
  }
  expect(renderNamedBehaviors(project, () => 'unused')).toBe(golden);
  const bound = {
    ...project,
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    layers: [{ id: 'l0', name: 'Base', bindings: { k0: createBehaviorBinding(project, 'b0') } }],
  };
  expect(generateKeymap(bound).content).toContain('&user_held_b0 LSHIFT A');
  expect(generateKeymap(bound).content.match(/    behaviors \{/gu)).toHaveLength(1);
  expect(generateKeymap(bound)).toEqual(generateKeymap(bound));
});

it('emits positional triggers and layer/dummy parameters from stable identities', () => {
  let project = addBehavior(createProject({ controllerId: 'nice_nano_v2' }), {
    kind: 'hold-tap',
    name: 'Held',
  });
  const behavior = getDefinedValue(project.behaviors.find((entry) => entry.kind === 'hold-tap'));
  project = replaceBehavior(project, {
    ...behavior,
    holdBehavior: 'mo',
    tapBehavior: 'none',
    quickTapMs: 175,
    requirePriorIdleMs: 150,
    retroTap: true,
    holdWhileUndecided: true,
    holdWhileUndecidedLinger: true,
    holdTriggerOnRelease: true,
    triggerKeyIds: ['k1'],
  });
  project = {
    ...project,
    keys: [
      { id: 'k1', xU: 2, yU: 0 },
      { id: 'k0', xU: 0, yU: 0 },
    ],
    layers: [{ id: 'l0', name: 'Base', bindings: { k0: createBehaviorBinding(project, 'b0') } }],
  };
  const output = generateKeymap(project).content;
  expect(output).toContain('hold-trigger-key-positions = <0>;');
  expect(output).toContain('&user_held_b0 0 0');
  expect(output).toContain('quick-tap-ms = <175>;');
  expect(output).toContain('require-prior-idle-ms = <150>;');
  expect(output).toContain(
    'retro-tap;\n            hold-while-undecided;\n            hold-while-undecided-linger;\n            hold-trigger-on-release;',
  );
});

it('collects inline child nodes and headers even when the definition is unassigned', () => {
  const project = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    behaviors: [
      {
        id: 'b0',
        name: 'Mixed',
        kind: 'tap-dance' as const,
        tappingTermMs: 200,
        bindings: [
          {
            id: 'a0',
            binding: {
              kind: 'tap_dance' as const,
              tappingTermMs: 220,
              taps: [{ keycode: 'C', modifiers: [] }],
            },
          },
          { id: 'a1', binding: { kind: 'bt' as const, command: 'BT_SEL' as const, profile: 2 } },
          { id: 'a2', binding: { kind: 'out' as const, command: 'OUT_USB' as const } },
        ],
      },
    ],
  };
  const output = generateKeymap(project).content;
  expect(output).toContain('#include <dt-bindings/zmk/bt.h>');
  expect(output).toContain('#include <dt-bindings/zmk/outputs.h>');
  expect(output).toContain('bindings = <&custom_td_0>, <&bt BT_SEL 2>, <&out OUT_USB>;');
  expect(output).toContain('custom_td_0: custom_td_0 {');
});
