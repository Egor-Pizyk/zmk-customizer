import { getDefinedValue } from '../../../helpers/defined-value';
import { describe, expect, it } from 'vitest';
import { createProject } from '@domain/project';
import {
  addBehavior,
  createBehaviorBinding,
  removeBehavior,
  validateBehaviors,
} from '@domain/behaviors';
import { KEYCODES } from '@catalog/bindings';

const keycodeNames = new Set(KEYCODES.flatMap((key) => [key.name, key.aliases].flat()));
const project = addBehavior(createProject({ controllerId: 'nice_nano_v2' }), {
  kind: 'tap-dance',
  name: 'Dance',
});

describe('016 behavior validation', () => {
  it('reports each key referencing a removed behavior without destroying references', () => {
    const binding = createBehaviorBinding(project, 'b0');
    const bound = {
      ...project,
      keys: [
        { id: 'k0', xU: 0, yU: 0 },
        { id: 'k1', xU: 2, yU: 0 },
      ],
      layers: [{ id: 'l0', name: 'Base', bindings: { k0: binding, k1: binding } }],
    };
    const issues = validateBehaviors(removeBehavior(bound, 'b0'), {
      keycodeNames,
      bluetoothProfileCount: 5,
    });
    expect(issues.map((issue) => [issue.code, issue.path])).toEqual([
      ['behavior-reference-missing', ['layers', 0, 'bindings', 'k0']],
      ['behavior-reference-missing', ['layers', 0, 'bindings', 'k1']],
    ]);
  });
  it('rejects cycles and empty dance actions', () => {
    const cyclic = {
      ...project,
      behaviors: [
        {
          id: 'b0',
          name: 'Cycle',
          kind: 'tap-dance' as const,
          tappingTermMs: 200,
          bindings: [{ id: 'a0', binding: createBehaviorBinding(project, 'b0') }],
        },
      ],
    };
    expect(validateBehaviors(cyclic, { keycodeNames, bluetoothProfileCount: 5 })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'behavior-cycle', path: ['behaviors', 0] }),
      ]),
    );
    expect(
      validateBehaviors(
        {
          ...cyclic,
          behaviors: [
            {
              ...getDefinedValue(cyclic.behaviors[0]),
              id: 'b0',
              name: 'Empty',
              kind: 'tap-dance',
              tappingTermMs: -2,
              bindings: [],
            },
          ],
        },
        { keycodeNames, bluetoothProfileCount: 5 },
      ).map((issue) => issue.code),
    ).toContain('behavior-invalid');
  });
  it('reports typed argument mismatch and missing layer/key targets', () => {
    const held = addBehavior(project, { kind: 'hold-tap', name: 'Held' });
    const behavior = getDefinedValue(held.behaviors.find((entry) => entry.kind === 'hold-tap'));
    const broken = {
      ...held,
      behaviors: [
        getDefinedValue(held.behaviors[0]),
        { ...behavior, quickTapMs: -2, triggerKeyIds: ['k99'] },
      ],
      keys: [{ id: 'k0', xU: 0, yU: 0 }],
      layers: [
        {
          id: 'l0',
          name: 'Base',
          bindings: {
            k0: {
              kind: 'custom' as const,
              behaviorId: behavior.id,
              parameters: [{ kind: 'layer' as const, layerId: 'l99' }],
            },
          },
        },
      ],
    };
    const issues = validateBehaviors(broken, { keycodeNames, bluetoothProfileCount: 5 });
    expect(issues.some((issue) => issue.path[0] === 'behaviors')).toBe(true);
    expect(issues.some((issue) => issue.path[0] === 'layers')).toBe(true);
  });
  it('rejects unknown nested keys, missing layers and retained modifiers outside triggers', () => {
    const morphed = {
      ...project,
      behaviors: [
        {
          id: 'b0',
          name: 'Morph',
          kind: 'mod-morph' as const,
          normal: { kind: 'kp' as const, key: { keycode: 'NOT_A_KEY', modifiers: [] } },
          morphed: { kind: 'mo' as const, layerId: 'l99' },
          mods: ['LS' as const],
          keepMods: ['RC' as const],
        },
      ],
    };
    expect(
      validateBehaviors(morphed, { keycodeNames, bluetoothProfileCount: 5 }).length,
    ).toBeGreaterThanOrEqual(3);
  });
});

it('validates legacy inline timing and Bluetooth profiles inside named actions', () => {
  const nested = {
    ...project,
    behaviors: [
      {
        id: 'b0',
        name: 'Nested',
        kind: 'tap-dance' as const,
        tappingTermMs: 200,
        bindings: [
          {
            id: 'a0',
            binding: {
              kind: 'tap_dance' as const,
              tappingTermMs: -2,
              taps: [{ keycode: 'A', modifiers: [] }],
            },
          },
          { id: 'a1', binding: { kind: 'bt' as const, command: 'BT_SEL' as const, profile: 99 } },
        ],
      },
    ],
  };
  expect(
    validateBehaviors(nested, { keycodeNames, bluetoothProfileCount: 5 }).map(
      (issue) => issue.code,
    ),
  ).toEqual(['binding-tapping-term-out-of-range', 'binding-profile-out-of-range']);
});

it('reports invalid names, missing nested definitions, empty triggers and sticky timeouts', () => {
  const definitions = {
    ...project,
    behaviors: [
      {
        id: 'b0',
        name: 'Duplicate',
        kind: 'tap-dance' as const,
        tappingTermMs: 200,
        bindings: [
          { id: 'a0', binding: { kind: 'custom' as const, behaviorId: 'b99', parameters: [] } },
        ],
      },
      {
        id: 'b1',
        name: 'duplicate',
        kind: 'sticky-key' as const,
        releaseAfterMs: 5001,
        quickRelease: false,
        lazy: false,
        ignoreModifiers: true,
      },
      {
        id: 'b2',
        name: '!!!',
        kind: 'mod-morph' as const,
        normal: { kind: 'none' as const },
        morphed: { kind: 'trans' as const },
        mods: [],
        keepMods: [],
      },
    ],
  };
  const issues = validateBehaviors(definitions, { keycodeNames, bluetoothProfileCount: 5 });
  expect(issues.filter((issue) => issue.code === 'behavior-invalid')).toHaveLength(5);
  expect(issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'behavior-reference-missing',
        path: ['behaviors', 0, 'bindings', 0],
      }),
    ]),
  );
});

it('validates assigned layer arguments after deletion', () => {
  const tuned = addBehavior(project, { kind: 'sticky-layer', name: 'Sticky layer' });
  const bound = {
    ...tuned,
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    layers: [
      {
        id: 'l0',
        name: 'Base',
        bindings: {
          k0: {
            kind: 'custom' as const,
            behaviorId: 'b1',
            parameters: [{ kind: 'layer' as const, layerId: 'l99' }],
          },
        },
      },
    ],
  };
  expect(validateBehaviors(bound, { keycodeNames, bluetoothProfileCount: 5 })).toEqual([
    expect.objectContaining({ code: 'behavior-invalid', path: ['layers', 0, 'bindings', 'k0'] }),
  ]);
});
