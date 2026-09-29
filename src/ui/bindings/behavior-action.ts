import type { BehaviorKind } from '../../catalog/behaviors';
import { assertNever } from '../../domain/assert-never';
import { MOD_MORPH_STARTER } from '../../domain/set-mod-morph-binding';
import { TAP_DANCE_STARTER } from '../../domain/set-tap-dance-binding';
import type { Binding } from '../../domain/types';
import type { PickerTabId } from './picker-tabs';

export type BehaviorRowAction =
  | { readonly kind: 'pick'; readonly binding: Binding }
  | { readonly kind: 'tab'; readonly tabId: PickerTabId }
  | { readonly kind: 'hint'; readonly text: string };

// Parameter-less behaviors apply at once; key behaviors are built with the controls below;
// Bluetooth and output live in the System tab (spec 005 FR-002–FR-004).
export function behaviorActionFor(entry: BehaviorKind): BehaviorRowAction {
  switch (entry.choices) {
    case 'none': {
      return { kind: 'pick', binding: { kind: entry.id } };
    }
    case 'key': {
      return entry.id === 'kp'
        ? { kind: 'tab', tabId: 'basic' }
        : { kind: 'hint', text: 'Switch with “Press mode” below.' };
    }
    case 'hold-tap': {
      return { kind: 'hint', text: 'Turn on with “When held” below.' };
    }
    case 'bluetooth':
    case 'output': {
      return { kind: 'tab', tabId: 'system' };
    }
    case 'tap-dance': {
      return { kind: 'pick', binding: TAP_DANCE_STARTER };
    }
    case 'mod-morph': {
      return { kind: 'pick', binding: MOD_MORPH_STARTER };
    }
    default: {
      return assertNever(entry);
    }
  }
}
