import { assertNever } from '@domain';
import type { SlotRef } from './binding-slots';

const SLOT_PROMPTS = {
  behavior: 'What should the key do?',
  key: 'Which key?',
  hold: 'Which modifier while held?',
  tap: 'Which key when tapped?',
  'bt-command': 'Which Bluetooth command?',
  profile: 'Which profile?',
  'out-command': 'Where should keys go?',
  layer: 'Which layer?',
} as const;
export function formatSlotPrompt(slot: SlotRef): string {
  switch (slot.kind) {
    case 'behavior':
    case 'key':
    case 'hold':
    case 'tap':
    case 'bt-command':
    case 'profile':
    case 'out-command':
    case 'layer': {
      return SLOT_PROMPTS[slot.kind];
    }
    case 'custom-parameter': {
      return `Which ${slot.parameterKind} for parameter ${slot.index + 1}?`;
    }
    case 'dance-tap': {
      return `Which key for tap ${slot.index + 1}?`;
    }
    case 'morph-side': {
      return slot.side === 'normal'
        ? 'Which key normally?'
        : 'Which key while the triggers are held?';
    }
    default: {
      return assertNever(slot);
    }
  }
}
