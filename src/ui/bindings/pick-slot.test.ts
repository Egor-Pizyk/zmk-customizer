import { describe, expect, it } from 'vitest';
import { buildProject } from '../../../tests/helpers/build-project';
import type { Binding, Modifier, Project } from '../../domain/types';
import type { LineSource, SlotRef } from './binding-slots';
import type { PickResult } from './pick-result';
import { toPickResult } from './pick-slot';
import type { PickerPick } from './to-picker-item';

const KEYS = ['k1', 'k2'].map((id, index) => ({ id, xU: index, yU: 0 }));
const TARGET = { layerIndex: 0, keyIds: ['k1', 'k2'] };
const KEY_A = { keycode: 'A', modifiers: [] } as const;
const LEFT_SHIFT = { keycode: 'LEFT_SHIFT', modifiers: [] } as const;

type PickCase = {
  readonly source: LineSource;
  readonly slot: SlotRef;
  readonly pick: PickerPick;
  readonly isEveryKeySendingKey?: boolean;
  readonly pendingModifiers?: readonly Modifier[];
};

function pickOn(pickCase: PickCase): PickResult {
  return toPickResult({
    target: TARGET,
    isEveryKeySendingKey: false,
    pendingModifiers: [],
    ...pickCase,
  });
}

function storedBindings(result: PickResult, project: Project) {
  return result.kind === 'store' ? result.change(project).layers[0]?.bindings : undefined;
}

function storedOn(binding: Binding): LineSource {
  return { kind: 'binding', binding };
}

const EMPTY = buildProject({ keys: KEYS });
const NONE: LineSource = { kind: 'none', isMixed: false };

describe('behavior picks (spec 006 FR-008)', () => {
  it('stores parameter-less behaviors at once and finishes the binding', () => {
    const result = pickOn({
      source: NONE,
      slot: { kind: 'behavior' },
      pick: { kind: 'behavior', behaviorId: 'trans' },
    });
    expect(result).toMatchObject({ kind: 'store', next: undefined });
    expect(storedBindings(result, EMPTY)).toEqual({ k1: { kind: 'trans' }, k2: { kind: 'trans' } });
  });

  it('switches key behaviors keeping each key when every key sends one', () => {
    const project = buildProject({
      keys: KEYS,
      bindings: { k1: { kind: 'kp', key: KEY_A }, k2: { kind: 'kt', key: KEY_A } },
    });
    const result = pickOn({
      source: { kind: 'none', isMixed: true },
      slot: { kind: 'behavior' },
      pick: { kind: 'behavior', behaviorId: 'mt' },
      isEveryKeySendingKey: true,
    });
    expect(result).toMatchObject({ kind: 'store', next: { kind: 'hold' } });
    expect(storedBindings(result, project)).toEqual({
      k1: { kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A },
      k2: { kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A },
    });
  });

  it('starts a draft when the values cannot come from the binding', () => {
    expect(
      pickOn({
        source: NONE,
        slot: { kind: 'behavior' },
        pick: { kind: 'behavior', behaviorId: 'kp' },
      }),
    ).toEqual({
      kind: 'draft',
      draft: { behaviorId: 'kp' },
      next: { kind: 'key' },
    });
    expect(
      pickOn({
        source: storedOn({ kind: 'kp', key: KEY_A }),
        slot: { kind: 'behavior' },
        pick: { kind: 'behavior', behaviorId: 'bt' },
      }),
    ).toEqual({ kind: 'draft', draft: { behaviorId: 'bt' }, next: { kind: 'bt-command' } });
  });

  it('opens the first slot of a new tap-dance', () => {
    const result = pickOn({
      source: NONE,
      slot: { kind: 'behavior' },
      pick: { kind: 'behavior', behaviorId: 'tap_dance' },
    });
    expect(result).toMatchObject({ kind: 'store', next: { kind: 'dance-tap', index: 0 } });
  });
});

describe('value picks (spec 006 FR-009, FR-011)', () => {
  it('stores a key press draft with the held modifiers', () => {
    const project = buildProject({
      keys: KEYS,
      bindings: { k2: { kind: 'bt', command: 'BT_NXT' } },
    });
    const result = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'sk' } },
      slot: { kind: 'key' },
      pick: { kind: 'keycode', keycode: 'Q' },
      pendingModifiers: ['LC'],
    });
    expect(result).toMatchObject({ kind: 'store', next: undefined });
    expect(storedBindings(result, project)).toEqual({
      k1: { kind: 'sk', key: { keycode: 'Q', modifiers: ['LC'] } },
      k2: { kind: 'sk', key: { keycode: 'Q', modifiers: ['LC'] } },
    });
  });

  it('completes a mod-tap draft with its hold', () => {
    const result = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'mt', hold: LEFT_SHIFT } },
      slot: { kind: 'tap' },
      pick: { kind: 'keycode', keycode: 'A' },
    });
    expect(storedBindings(result, EMPTY)).toEqual({
      k1: { kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A },
      k2: { kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A },
    });
  });

  it('moves from hold to tap on a stored mod-tap', () => {
    const result = pickOn({
      source: storedOn({ kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A }),
      slot: { kind: 'hold' },
      pick: { kind: 'keycode', keycode: 'LEFT_ALT' },
    });
    expect(result).toMatchObject({ kind: 'store', next: { kind: 'tap' } });
  });

  it('asks for a profile after a profile command, keeping a stored one', () => {
    const toSel = pickOn({
      source: storedOn({ kind: 'bt', command: 'BT_NXT' }),
      slot: { kind: 'bt-command' },
      pick: { kind: 'bt-command', command: 'BT_SEL' },
    });
    expect(toSel).toEqual({
      kind: 'draft',
      draft: { behaviorId: 'bt', btCommand: 'BT_SEL' },
      next: { kind: 'profile' },
    });
    const profile = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'bt', btCommand: 'BT_SEL' } },
      slot: { kind: 'profile' },
      pick: { kind: 'profile', profile: 2 },
    });
    expect(storedBindings(profile, EMPTY)?.['k1']).toEqual({
      kind: 'bt',
      command: 'BT_SEL',
      profile: 2,
    });
    const toDisc = pickOn({
      source: storedOn({ kind: 'bt', command: 'BT_SEL', profile: 1 }),
      slot: { kind: 'bt-command' },
      pick: { kind: 'bt-command', command: 'BT_DISC' },
    });
    expect(toDisc).toMatchObject({ kind: 'store', next: { kind: 'profile' } });
    expect(storedBindings(toDisc, EMPTY)?.['k1']).toEqual({
      kind: 'bt',
      command: 'BT_DISC',
      profile: 1,
    });
  });

  it('walks tap-dance taps and mod-morph sides, keeping their modifiers', () => {
    const dance: Binding = {
      kind: 'tap_dance',
      taps: [KEY_A, { keycode: 'B', modifiers: ['LS'] }],
      tappingTermMs: 200,
    };
    const project = buildProject({ keys: KEYS, bindings: { k1: dance, k2: dance } });
    const result = pickOn({
      source: storedOn(dance),
      slot: { kind: 'dance-tap', index: 1 },
      pick: { kind: 'keycode', keycode: 'C' },
    });
    expect(result).toMatchObject({ kind: 'store', next: undefined });
    expect(storedBindings(result, project)?.['k1']).toEqual({
      ...dance,
      taps: [KEY_A, { keycode: 'C', modifiers: ['LS'] }],
    });
    const morph: Binding = { kind: 'mod_morph', normal: KEY_A, morphed: KEY_A, mods: ['LS'] };
    expect(
      pickOn({
        source: storedOn(morph),
        slot: { kind: 'morph-side', side: 'normal' },
        pick: { kind: 'keycode', keycode: 'B' },
      }),
    ).toMatchObject({ kind: 'store', next: { kind: 'morph-side', side: 'morphed' } });
  });
});

function pickLayer(layerId: string): PickerPick {
  return { kind: 'layer', layerId };
}

describe('layer picks (spec 007)', () => {
  const LAYER_SLOT: SlotRef = { kind: 'layer' };

  it('starts a draft with the layer slot open for every layer behavior', () => {
    for (const behaviorId of ['mo', 'tog', 'to', 'sl', 'lt'] as const) {
      expect(
        pickOn({
          source: storedOn({ kind: 'kp', key: KEY_A }),
          slot: { kind: 'behavior' },
          pick: { kind: 'behavior', behaviorId },
          isEveryKeySendingKey: true,
        }),
      ).toEqual({ kind: 'draft', draft: { behaviorId }, next: LAYER_SLOT });
    }
  });

  it('stores a momentary layer once its layer is picked', () => {
    const result = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'mo' } },
      slot: LAYER_SLOT,
      pick: pickLayer('l1'),
    });
    expect(result).toMatchObject({ kind: 'store', next: undefined });
    expect(storedBindings(result, EMPTY)).toEqual({
      k1: { kind: 'mo', layerId: 'l1' },
      k2: { kind: 'mo', layerId: 'l1' },
    });
  });

  it('keeps each key for layer-tap when every key sends one, then opens the tap', () => {
    const project = buildProject({
      keys: KEYS,
      bindings: {
        k1: { kind: 'kp', key: KEY_A },
        k2: { kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A },
      },
    });
    const result = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'lt' } },
      slot: LAYER_SLOT,
      pick: pickLayer('l1'),
      isEveryKeySendingKey: true,
    });
    expect(result).toMatchObject({ kind: 'store', next: { kind: 'tap' } });
    expect(storedBindings(result, project)).toEqual({
      k1: { kind: 'lt', layerId: 'l1', tap: KEY_A },
      k2: { kind: 'lt', layerId: 'l1', tap: KEY_A },
    });
  });

  it('asks for the tap of a layer-tap draft when a key sends none', () => {
    expect(
      pickOn({
        source: { kind: 'draft', draft: { behaviorId: 'lt' } },
        slot: LAYER_SLOT,
        pick: pickLayer('l1'),
      }),
    ).toEqual({
      kind: 'draft',
      draft: { behaviorId: 'lt', layerId: 'l1' },
      next: { kind: 'tap' },
    });
    const tapped = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'lt', layerId: 'l1' } },
      slot: { kind: 'tap' },
      pick: { kind: 'keycode', keycode: 'SPACE' },
      pendingModifiers: ['LS'],
    });
    expect(tapped).toMatchObject({ kind: 'store', next: undefined });
    expect(storedBindings(tapped, EMPTY)?.['k1']).toEqual({
      kind: 'lt',
      layerId: 'l1',
      tap: { keycode: 'SPACE', modifiers: ['LS'] },
    });
  });

  it('keeps a tap picked before the layer', () => {
    const first = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'lt' } },
      slot: { kind: 'tap' },
      pick: { kind: 'keycode', keycode: 'SPACE' },
    });
    const space = { keycode: 'SPACE', modifiers: [] };
    expect(first).toEqual({
      kind: 'draft',
      draft: { behaviorId: 'lt', key: space },
      next: LAYER_SLOT,
    });
    const result = pickOn({
      source: { kind: 'draft', draft: { behaviorId: 'lt', key: space } },
      slot: LAYER_SLOT,
      pick: pickLayer('l2'),
      isEveryKeySendingKey: true,
    });
    expect(result).toMatchObject({ kind: 'store', next: undefined });
    expect(storedBindings(result, EMPTY)?.['k2']).toEqual({
      kind: 'lt',
      layerId: 'l2',
      tap: space,
    });
  });

  it('changes only the layer of a stored layer behavior', () => {
    const lt: Binding = { kind: 'lt', layerId: 'l1', tap: KEY_A };
    const result = pickOn({ source: storedOn(lt), slot: LAYER_SLOT, pick: pickLayer('l0') });
    expect(storedBindings(result, EMPTY)?.['k1']).toEqual({ ...lt, layerId: 'l0' });
    const mo = pickOn({
      source: storedOn({ kind: 'tog', layerId: 'l1' }),
      slot: LAYER_SLOT,
      pick: pickLayer('l2'),
    });
    expect(storedBindings(mo, EMPTY)?.['k2']).toEqual({ kind: 'tog', layerId: 'l2' });
  });
});
