import type { KeyStroke } from '@domain';
import type { LineSource, SlotRef } from './binding-slots';
import { findSlotStroke } from './find-slot-stroke';

export function findModifierTarget(
  source: LineSource,
  slot: SlotRef,
): KeyStroke | 'pending' | undefined {
  const canHaveModifiers =
    (slot.kind === 'custom-parameter' && slot.parameterKind === 'key') ||
    slot.kind === 'tap' ||
    slot.kind === 'dance-tap' ||
    slot.kind === 'morph-side' ||
    slot.kind === 'key';
  if (!canHaveModifiers) {
    return undefined;
  }
  if (source.kind === 'draft') {
    const { behaviorId } = source.draft;
    return behaviorId === 'kp' || behaviorId === 'mt' || behaviorId === 'lt'
      ? 'pending'
      : undefined;
  }
  if (source.kind === 'binding' && (source.binding.kind === 'sk' || source.binding.kind === 'kt')) {
    return undefined;
  }
  return findSlotStroke(source, slot);
}
