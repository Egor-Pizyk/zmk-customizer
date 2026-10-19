import { expect, it } from 'vitest';
import { createProject, getProjectResourceError } from '@domain/project';
import { addBehavior, setBehaviorParameter } from '@domain/behaviors';
import { getDefinedValue } from '../../../helpers/defined-value';
import { validateControllerBindings } from '@domain/validation';
import { getControllerBoard } from '@catalog/controllers';

const project = createProject({ controllerId: 'nice_nano_v2' });

it('refuses behavior collection, name, tap and positional processing overflows', () => {
  const dance = getDefinedValue(
    addBehavior(project, { kind: 'tap-dance', name: 'Dance' }).behaviors.find(
      (behavior) => behavior.kind === 'tap-dance',
    ),
  );
  const held = getDefinedValue(
    addBehavior(project, { kind: 'hold-tap', name: 'Held' }).behaviors.find(
      (behavior) => behavior.kind === 'hold-tap',
    ),
  );
  expect(
    getProjectResourceError({ ...project, behaviors: Array.from({ length: 129 }, () => dance) }),
  ).toContain('128 custom behaviors');
  expect(
    getProjectResourceError({ ...project, behaviors: [{ ...dance, name: 'x'.repeat(161) }] }),
  ).toContain('160 characters');
  expect(
    getProjectResourceError({
      ...project,
      behaviors: [
        {
          ...dance,
          bindings: Array.from({ length: 33 }, () => getDefinedValue(dance.bindings[0])),
        },
      ],
    }),
  ).toContain('32 actions');
  expect(
    getProjectResourceError({
      ...project,
      behaviors: [{ ...held, triggerKeyIds: Array.from({ length: 257 }, () => 'k0') }],
    }),
  ).toContain('256 trigger keys');
});

it('edits one custom parameter while retaining the other and the original reference', () => {
  const binding = {
    kind: 'custom',
    behaviorId: 'b0',
    parameters: [{ kind: 'key', key: { keycode: 'A', modifiers: [] } }, { kind: 'dummy' }],
  } as const;
  const changed = setBehaviorParameter(binding, {
    index: 0,
    parameter: { kind: 'layer', layerId: 'l1' },
  });
  expect(changed).toEqual({
    kind: 'custom',
    behaviorId: 'b0',
    parameters: [{ kind: 'layer', layerId: 'l1' }, { kind: 'dummy' }],
  });
  expect(binding.parameters[0].key.keycode).toBe('A');
});

it('rejects unavailable Bluetooth actions in unassigned named definitions', () => {
  const configured = {
    ...project,
    behaviors: [
      {
        id: 'b0',
        name: 'Dance',
        kind: 'tap-dance' as const,
        tappingTermMs: 200,
        bindings: [{ id: 'a0', binding: { kind: 'bt' as const, command: 'BT_CLR' as const } }],
      },
      {
        id: 'b1',
        name: 'Morph',
        kind: 'mod-morph' as const,
        normal: { kind: 'none' as const },
        morphed: { kind: 'out' as const, command: 'OUT_BLE' as const },
        mods: ['LS' as const],
        keepMods: [],
      },
    ],
  };
  expect(
    validateControllerBindings(configured, getControllerBoard('sparkfun_pro_micro_rp2040')).map(
      (issue) => issue.path,
    ),
  ).toEqual([
    ['behaviors', 0, 'bindings', 0],
    ['behaviors', 1, 'bindings', 1],
  ]);
});
