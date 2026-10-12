import type { KeyStroke } from '../../domain/types';
import type { LineSource, SlotRef } from './binding-slots';

/** The key stroke an open slot edits, stored or drafted. */
export function findSlotStroke(source: LineSource, slot: SlotRef): KeyStroke | undefined {
  if (source.kind === 'draft') {
    const { draft } = source;
    if (slot.kind === 'hold') {
      return draft.behaviorId === 'mt' ? draft.hold : undefined;
    }
    return 'key' in draft ? draft.key : undefined;
  }
  if (source.kind !== 'binding') {
    return undefined;
  }
  const { binding } = source;
  if (slot.kind === 'dance-tap' && binding.kind === 'tap_dance') {
    return binding.taps[slot.index];
  }
  if (slot.kind === 'morph-side' && binding.kind === 'mod_morph') {
    return binding[slot.side];
  }
  if (binding.kind === 'mt') {
    return slot.kind === 'hold' ? binding.hold : binding.tap;
  }
  if (binding.kind === 'lt') {
    return slot.kind === 'tap' ? binding.tap : undefined;
  }
  return binding.kind === 'kp' || binding.kind === 'sk' || binding.kind === 'kt'
    ? binding.key
    : undefined;
}
