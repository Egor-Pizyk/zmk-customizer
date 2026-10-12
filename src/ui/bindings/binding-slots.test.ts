import { describe, expect, it } from 'vitest';
import type { Binding, Layer } from '../../domain/types';
import {
  findModifierTarget,
  findSlotValueId,
  formatStrokeCode,
  getLineSlots,
  resolveOpenSlot,
} from './binding-slots';
import type { LineSource } from './binding-slots';

const KEY_A = { keycode: 'A', modifiers: [] } as const;
const LEFT_SHIFT = { keycode: 'LEFT_SHIFT', modifiers: [] } as const;
const LAYERS: readonly Layer[] = [
  { id: 'l0', name: 'Base', bindings: {} },
  { id: 'l1', name: 'Nav', bindings: {} },
];

function fromBinding(binding: Binding): LineSource {
  return { kind: 'binding', binding };
}

function toText(source: LineSource): readonly string[] {
  return getLineSlots(source, LAYERS).map((slot) => `${slot.label}=${slot.value ?? '?'}`);
}

describe('getLineSlots (spec 006 FR-001–FR-002)', () => {
  it('spells values as the keymap does, modifiers as functions', () => {
    expect(formatStrokeCode({ keycode: 'A', modifiers: ['LC', 'LS'] })).toBe('LC(LS(A))');
    expect(toText(fromBinding({ kind: 'kp', key: { keycode: 'A', modifiers: ['LC'] } }))).toEqual([
      'key=LC(A)',
    ]);
    expect(toText(fromBinding({ kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A }))).toEqual([
      'hold=LEFT_SHIFT',
      'tap=A',
    ]);
  });

  it('adds the profile slot only for profile commands', () => {
    expect(toText(fromBinding({ kind: 'bt', command: 'BT_SEL', profile: 2 }))).toEqual([
      'command=BT_SEL',
      'profile=2',
    ]);
    expect(toText(fromBinding({ kind: 'bt', command: 'BT_NXT' }))).toEqual(['command=BT_NXT']);
    expect(toText(fromBinding({ kind: 'out', command: 'OUT_USB' }))).toEqual(['command=OUT_USB']);
  });

  it('lists tap-dance taps and mod-morph sides, nothing for parameter-less behaviors', () => {
    const dance = fromBinding({
      kind: 'tap_dance',
      taps: [KEY_A, { keycode: 'B', modifiers: [] }],
      tappingTermMs: 200,
    });
    expect(toText(dance)).toEqual(['tap 1=A', 'tap 2=B']);
    const morph = fromBinding({ kind: 'mod_morph', normal: KEY_A, morphed: KEY_A, mods: ['LS'] });
    expect(toText(morph)).toEqual(['normal=A', 'morphed=A']);
    expect(getLineSlots(fromBinding({ kind: 'trans' }), LAYERS)).toEqual([]);
    expect(getLineSlots({ kind: 'none', isMixed: false }, LAYERS)).toEqual([]);
  });

  it('shows the empty slots of a draft', () => {
    expect(toText({ kind: 'draft', draft: { behaviorId: 'mt', hold: LEFT_SHIFT } })).toEqual([
      'hold=LEFT_SHIFT',
      'tap=?',
    ]);
    expect(toText({ kind: 'draft', draft: { behaviorId: 'bt' } })).toEqual(['command=?']);
    expect(toText({ kind: 'draft', draft: { behaviorId: 'bt', btCommand: 'BT_DISC' } })).toEqual([
      'command=BT_DISC',
      'profile=?',
    ]);
  });
});

describe('layer slot (spec 007)', () => {
  it('names the target layer by position and name, a missing one as deleted', () => {
    for (const kind of ['mo', 'tog', 'to', 'sl'] as const) {
      expect(toText(fromBinding({ kind, layerId: 'l1' }))).toEqual(['layer=1 Nav']);
    }
    expect(toText(fromBinding({ kind: 'lt', layerId: 'l1', tap: KEY_A }))).toEqual([
      'layer=1 Nav',
      'tap=A',
    ]);
    expect(toText(fromBinding({ kind: 'mo', layerId: 'l7' }))).toEqual(['layer=deleted layer']);
    expect(toText({ kind: 'draft', draft: { behaviorId: 'lt' } })).toEqual(['layer=?', 'tap=?']);
    expect(toText({ kind: 'draft', draft: { behaviorId: 'tog', layerId: 'l0' } })).toEqual([
      'layer=0 Base',
    ]);
  });

  it('opens the layer slot of a new draft and marks the current layer', () => {
    expect(resolveOpenSlot({ kind: 'draft', draft: { behaviorId: 'mo' } })).toEqual({
      kind: 'layer',
    });
    expect(resolveOpenSlot({ kind: 'draft', draft: { behaviorId: 'lt' } })).toEqual({
      kind: 'layer',
    });
    expect(findSlotValueId(fromBinding({ kind: 'sl', layerId: 'l1' }), { kind: 'layer' })).toBe(
      'l1',
    );
    expect(findSlotValueId({ kind: 'draft', draft: { behaviorId: 'mo' } }, { kind: 'layer' })).toBe(
      undefined,
    );
  });

  it('offers chips for the tap of layer-tap, stored or drafted', () => {
    const ctrlA = { keycode: 'A', modifiers: ['LC'] } as const;
    const lt = fromBinding({ kind: 'lt', layerId: 'l1', tap: ctrlA });
    expect(findModifierTarget(lt, { kind: 'tap' })).toEqual(ctrlA);
    expect(findModifierTarget(lt, { kind: 'layer' })).toBeUndefined();
    expect(findSlotValueId(lt, { kind: 'tap' })).toBe('A');
    expect(
      findModifierTarget({ kind: 'draft', draft: { behaviorId: 'lt' } }, { kind: 'tap' }),
    ).toBe('pending');
  });
});

describe('resolveOpenSlot', () => {
  const mt = fromBinding({ kind: 'mt', hold: LEFT_SHIFT, tap: KEY_A });

  it('keeps an open slot the line still has', () => {
    expect(resolveOpenSlot(mt, { kind: 'tap' })).toEqual({ kind: 'tap' });
    expect(resolveOpenSlot(mt, { kind: 'behavior' })).toEqual({ kind: 'behavior' });
  });

  it('falls back to the first empty slot, the first slot, or the behavior', () => {
    expect(resolveOpenSlot(mt, { kind: 'dance-tap', index: 3 })).toEqual({ kind: 'hold' });
    expect(resolveOpenSlot(mt)).toEqual({ kind: 'hold' });
    expect(
      resolveOpenSlot({ kind: 'draft', draft: { behaviorId: 'mt', hold: LEFT_SHIFT } }),
    ).toEqual({ kind: 'tap' });
    expect(resolveOpenSlot(fromBinding({ kind: 'none' }))).toEqual({ kind: 'behavior' });
  });
});

describe('findSlotValueId and findModifierTarget', () => {
  const mt = fromBinding({ kind: 'mt', hold: { keycode: 'LSHIFT', modifiers: [] }, tap: KEY_A });

  it('names the current choice by canonical id', () => {
    expect(findSlotValueId(mt, { kind: 'hold' })).toBe('LEFT_SHIFT');
    expect(findSlotValueId(mt, { kind: 'behavior' })).toBe('mt');
    expect(
      findSlotValueId(fromBinding({ kind: 'bt', command: 'BT_SEL', profile: 3 }), {
        kind: 'profile',
      }),
    ).toBe('3');
    expect(findSlotValueId({ kind: 'none', isMixed: true }, { kind: 'behavior' })).toBeUndefined();
  });

  it('offers chips for sent keys and drafted key presses only', () => {
    expect(findModifierTarget(mt, { kind: 'tap' })).toEqual(KEY_A);
    expect(findModifierTarget(mt, { kind: 'hold' })).toBeUndefined();
    expect(
      findModifierTarget(fromBinding({ kind: 'sk', key: KEY_A }), { kind: 'key' }),
    ).toBeUndefined();
    expect(
      findModifierTarget({ kind: 'draft', draft: { behaviorId: 'kp' } }, { kind: 'key' }),
    ).toBe('pending');
    expect(
      findModifierTarget({ kind: 'draft', draft: { behaviorId: 'kt' } }, { kind: 'key' }),
    ).toBeUndefined();
  });
});
