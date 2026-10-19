import { assertNever } from '@domain';
import type { Binding, CustomBehavior, Modifier, Project } from '@domain';
import { getBehaviorLabel } from '@domain/behaviors';
import { MODIFIER_BITS } from '@catalog/bindings';
import { renderBinding } from './render-binding';

type InlineBinding = Extract<Binding, { kind: 'tap_dance' | 'mod_morph' }>;
function renderMask(modifiers: readonly Modifier[]): string {
  return modifiers.length === 0
    ? '0'
    : `(${modifiers.map((modifier) => MODIFIER_BITS[modifier]).join(' | ')})`;
}
function renderBooleans(values: readonly (readonly [string, boolean])[]): readonly string[] {
  return values.flatMap(([name, enabled]) => (enabled ? [`${name};`] : []));
}
function renderProperties(behavior: CustomBehavior, project: Project): readonly string[] {
  switch (behavior.kind) {
    case 'hold-tap': {
      return renderHoldTapProperties(behavior, project);
    }
    case 'sticky-key':
    case 'sticky-layer': {
      return [
        'compatible = "zmk,behavior-sticky-key";',
        '#binding-cells = <1>;',
        `bindings = <&${behavior.kind === 'sticky-key' ? 'kp' : 'mo'}>;`,
        `release-after-ms = <${behavior.releaseAfterMs}>;`,
        ...renderBooleans([
          ['quick-release', behavior.quickRelease],
          ['lazy', behavior.lazy],
          ['ignore-modifiers', behavior.ignoreModifiers],
        ]),
      ];
    }
    case 'tap-dance': {
      return [
        'compatible = "zmk,behavior-tap-dance";',
        '#binding-cells = <0>;',
        `tapping-term-ms = <${behavior.tappingTermMs}>;`,
      ];
    }
    case 'mod-morph': {
      return ['compatible = "zmk,behavior-mod-morph";', '#binding-cells = <0>;'];
    }
    default: {
      return assertNever(behavior);
    }
  }
}
export function renderNamedBehaviors(
  project: Project,
  findCustomLabel: (binding: InlineBinding) => string,
): string {
  return project.behaviors
    .toSorted((first, second) => (getBehaviorLabel(first) < getBehaviorLabel(second) ? -1 : 1))
    .map((behavior) => {
      const properties = [...renderProperties(behavior, project)];
      const render = (binding: Binding) =>
        `<${renderBinding(binding, { project, findCustomLabel })}>`;
      if (behavior.kind === 'tap-dance') {
        properties.push(
          `bindings = ${behavior.bindings.map((action) => render(action.binding)).join(', ')};`,
        );
      }
      if (behavior.kind === 'mod-morph') {
        properties.push(
          `bindings = ${render(behavior.normal)}, ${render(behavior.morphed)};`,
          `mods = <${renderMask(behavior.mods)}>;`,
          `keep-mods = <${renderMask(behavior.keepMods)}>;`,
        );
      }
      const label = getBehaviorLabel(behavior);
      return `        ${label}: ${label} {\n${properties.map((line) => `            ${line}`).join('\n')}\n        };\n`;
    })
    .join('');
}

function renderHoldTapProperties(
  behavior: Extract<CustomBehavior, { kind: 'hold-tap' }>,
  project: Project,
): readonly string[] {
  return [
    'compatible = "zmk,behavior-hold-tap";',
    '#binding-cells = <2>;',
    `bindings = <&${behavior.holdBehavior}>, <&${behavior.tapBehavior}>;`,
    `flavor = "${behavior.flavor}";`,
    `tapping-term-ms = <${behavior.tappingTermMs}>;`,
    `quick-tap-ms = <${behavior.quickTapMs < 0 ? `(${behavior.quickTapMs})` : behavior.quickTapMs}>;`,
    `require-prior-idle-ms = <${behavior.requirePriorIdleMs < 0 ? `(${behavior.requirePriorIdleMs})` : behavior.requirePriorIdleMs}>;`,
    ...renderBooleans([
      ['retro-tap', behavior.retroTap],
      ['hold-while-undecided', behavior.holdWhileUndecided],
      ['hold-while-undecided-linger', behavior.holdWhileUndecidedLinger],
      ['hold-trigger-on-release', behavior.holdTriggerOnRelease],
    ]),
    ...(behavior.triggerKeyIds.length === 0
      ? []
      : [
          `hold-trigger-key-positions = <${behavior.triggerKeyIds.map((id) => project.keys.findIndex((key) => key.id === id)).join(' ')}>;`,
        ]),
  ];
}
