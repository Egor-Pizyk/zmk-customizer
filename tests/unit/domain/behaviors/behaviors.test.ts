import {
  addBehaviorTap,
  setBehaviorTap,
  getTargetParameterKind,
  createActionBinding,
  addBehavior,
  removeBehavior,
  replaceBehavior,
  createBehaviorBinding,
  getBehaviorLabel,
} from '@domain/behaviors';
import { getDefinedValue } from '../../../helpers/defined-value';
import { describe, expect, it } from 'vitest';
import { createProject } from '@domain/project';

const project = createProject({ controllerId: 'nice_nano_v2' });

describe('named behavior lifecycle (016 US1)', () => {
  it('creates five configurations without changing the input and replaces by stable id', () => {
    let current = project;
    for (const kind of [
      'hold-tap',
      'tap-dance',
      'mod-morph',
      'sticky-key',
      'sticky-layer',
    ] as const) {
      current = addBehavior(current, { kind, name: `My ${kind}` });
    }
    expect(project.behaviors).toEqual([]);
    expect(current.behaviors.map((behavior) => behavior.id)).toEqual([
      'b0',
      'b1',
      'b2',
      'b3',
      'b4',
    ]);
    const first = getDefinedValue(current.behaviors[0]);
    const renamed = replaceBehavior(current, { ...first, name: 'Renamed!' });
    expect(renamed.behaviors[0]?.id).toBe('b0');
    expect(getBehaviorLabel({ ...first, name: 'Renamed!' })).toBe('user_renamed_b0');
    expect(current.behaviors[0]?.name).toBe('My hold-tap');
  });

  it('constructs typed hold/tap and sticky arguments', () => {
    let current = addBehavior(project, { kind: 'hold-tap', name: 'Home' });
    expect(createBehaviorBinding(current, 'b0')).toEqual({
      kind: 'custom',
      behaviorId: 'b0',
      parameters: [
        { kind: 'key', key: { keycode: 'LSHIFT', modifiers: [] } },
        { kind: 'key', key: { keycode: 'A', modifiers: [] } },
      ],
    });
    current = addBehavior(current, { kind: 'sticky-layer', name: 'Sticky nav' });
    expect(createBehaviorBinding(current, 'b1')).toEqual({
      kind: 'custom',
      behaviorId: 'b1',
      parameters: [{ kind: 'layer', layerId: 'l0' }],
    });
  });

  it('retains dangling references and never reuses their identity', () => {
    const added = addBehavior(project, { kind: 'tap-dance', name: 'Dance' });
    const bound = {
      ...added,
      keys: [{ id: 'k0', xU: 0, yU: 0 }],
      layers: [{ id: 'l0', name: 'Base', bindings: { k0: createBehaviorBinding(added, 'b0') } }],
    };
    const removed = removeBehavior(bound, 'b0');
    expect(removed.behaviors).toEqual([]);
    expect(removed.layers).toBe(bound.layers);
    expect(addBehavior(removed, { kind: 'tap-dance', name: 'New' }).behaviors[0]?.id).toBe('b1');
    expect(removeBehavior(removed, 'missing')).toBe(removed);
  });
});

it('keeps action identity and makes tap edits independently undoable', () => {
  const dance = getDefinedValue(
    addBehavior(project, { kind: 'tap-dance', name: 'Dance' }).behaviors.find(
      (behavior) => behavior.kind === 'tap-dance',
    ),
  );
  const added = addBehaviorTap(dance);
  expect(added).toMatchObject({
    bindings: [
      { id: 'a0' },
      { id: 'a1' },
      { id: 'a2', binding: { kind: 'kp', key: { keycode: 'A' } } },
    ],
  });
  const changed = setBehaviorTap(dance, { actionId: 'a0', binding: { kind: 'mo', layerId: 'l0' } });
  expect(dance.bindings[0]?.binding).toEqual({ kind: 'kp', key: { keycode: 'A', modifiers: [] } });
  expect(changed).toMatchObject({
    bindings: [{ id: 'a0', binding: { kind: 'mo', layerId: 'l0' } }, { id: 'a1' }],
  });
});

it('does not replace missing definitions or create history for identical replacements', () => {
  const current = addBehavior(project, { kind: 'sticky-key', name: 'Sticky' });
  const behavior = getDefinedValue(current.behaviors[0]);
  expect(replaceBehavior(current, behavior)).toBe(current);
  expect(replaceBehavior(project, behavior)).toBe(project);
  expect(createBehaviorBinding(current, behavior.id)).toMatchObject({
    parameters: [{ kind: 'key', key: { keycode: 'LSHIFT' } }],
  });
});

it('builds hold-tap arguments from child arity and keeps layer identity', () => {
  const current = addBehavior(project, { kind: 'hold-tap', name: 'Layer held' });
  const behavior = getDefinedValue(current.behaviors.find((entry) => entry.kind === 'hold-tap'));
  const changed = replaceBehavior(current, {
    ...behavior,
    holdBehavior: 'mo',
    tapBehavior: 'caps_word',
  });
  expect(createBehaviorBinding(changed, behavior.id)).toEqual({
    kind: 'custom',
    behaviorId: 'b0',
    parameters: [{ kind: 'layer', layerId: 'l0' }, { kind: 'dummy' }],
  });
  expect(getTargetParameterKind('none')).toBe('dummy');
  expect(getTargetParameterKind('tog')).toBe('layer');
  expect(getTargetParameterKind('sk')).toBe('key');
});

it('constructs supported child actions with typed defaults', () => {
  for (const kind of [
    'kp',
    'sk',
    'kt',
    'mt',
    'mo',
    'tog',
    'to',
    'sl',
    'lt',
    'trans',
    'none',
    'caps_word',
    'key_repeat',
    'gresc',
    'sys_reset',
    'bootloader',
    'bt',
    'out',
  ]) {
    expect(createActionBinding(project, kind).kind).toBe(kind);
  }
  expect(createActionBinding(project, 'b99')).toEqual({
    kind: 'custom',
    behaviorId: 'b99',
    parameters: [],
  });
});

it('reserves deleted behavior IDs still held by the session clipboard', () => {
  expect(
    addBehavior(project, { kind: 'tap-dance', name: 'New', reservedIds: ['b7'] }).behaviors[0]?.id,
  ).toBe('b8');
});

it('bounds definition/tap collections and allocates IDs without numeric rounding', () => {
  const current = addBehavior(project, { kind: 'tap-dance', name: 'Dance' });
  const dance = getDefinedValue(
    current.behaviors.find((behavior) => behavior.kind === 'tap-dance'),
  );
  const full = { ...project, behaviors: Array.from({ length: 128 }, () => dance) };
  expect(addBehavior(full, { kind: 'sticky-key', name: 'Extra' })).toBe(full);
  const taps = {
    ...dance,
    bindings: Array.from({ length: 32 }, (_, index) => ({
      id: `a${index}`,
      binding: { kind: 'none' as const },
    })),
  };
  expect(addBehaviorTap(taps)).toBe(taps);
  expect(
    addBehavior(project, {
      kind: 'sticky-key',
      name: 'Large',
      reservedIds: ['not-an-id', 'b9007199254740993'],
    }).behaviors[0]?.id,
  ).toBe('b9007199254740994');
});
