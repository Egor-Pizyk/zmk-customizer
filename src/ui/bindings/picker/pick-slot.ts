import { setKeyBehavior, setModMorphBinding, setTapDanceBinding } from '@domain';
import type { KeyBehavior, BehaviorId, LayerBinding } from '@domain';
import type { SlotRef } from './binding-slots';
import { DEFAULT_HOLD, createDraft } from './draft-state';
import { toBindingResult, toStoreResult } from './pick-result';
import type { PickInput, PickResult } from './pick-result';
import {
  toBluetoothCommandResult,
  toKeycodeResult,
  toLayerResult,
  toProfileResult,
} from './pick-value';

// What a pick in the open slot does (spec 006 FR-008, FR-009, FR-011).
export function toPickResult(input: PickInput): PickResult {
  const { pick } = input;
  switch (pick.kind) {
    case 'behavior': {
      return toBehaviorResult(input, pick.behaviorId);
    }
    case 'keycode': {
      return toKeycodeResult(input, pick.keycode);
    }
    case 'bt-command': {
      return toBluetoothCommandResult(input, pick.command);
    }
    case 'profile': {
      return toProfileResult(input, pick.profile);
    }
    case 'out-command': {
      return toBindingResult(input, { kind: 'out', command: pick.command });
    }
    case 'layer': {
      return toLayerResult(input, pick.layerId);
    }
    default: {
      return pick satisfies never;
    }
  }
}

// Every key already sends a key: switch keeping each key; else draft the key (FR-008).
function toKeyBehaviorResult(
  input: PickInput,
  behaviorId: Exclude<KeyBehavior['id'], 'lt'>,
): PickResult {
  if (!input.isEveryKeySendingKey) {
    const next: SlotRef = behaviorId === 'mt' ? { kind: 'tap' } : { kind: 'key' };
    return { kind: 'draft', draft: createDraft(behaviorId), next };
  }
  const behavior: KeyBehavior =
    behaviorId === 'mt' ? { id: 'mt', hold: DEFAULT_HOLD } : { id: behaviorId };
  const next: SlotRef = behaviorId === 'mt' ? { kind: 'hold' } : { kind: 'key' };
  return toStoreResult((project) => setKeyBehavior(project, { ...input.target, behavior }), next);
}

// Behaviors whose values must be picked first start a draft at their first slot (FR-009); a
// layer behavior always asks for its layer first (spec 007).
function toDraftStartResult(behaviorId: 'bt' | 'out' | LayerBinding['kind']): PickResult {
  if (behaviorId === 'bt' || behaviorId === 'out') {
    const next: SlotRef = behaviorId === 'bt' ? { kind: 'bt-command' } : { kind: 'out-command' };
    return { kind: 'draft', draft: createDraft(behaviorId), next };
  }
  return { kind: 'draft', draft: createDraft(behaviorId), next: { kind: 'layer' } };
}

function toBehaviorResult(input: PickInput, behaviorId: BehaviorId): PickResult {
  const { target } = input;
  switch (behaviorId) {
    case 'kp':
    case 'sk':
    case 'kt':
    case 'mt': {
      return toKeyBehaviorResult(input, behaviorId);
    }
    case 'bt':
    case 'out':
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl':
    case 'lt': {
      return toDraftStartResult(behaviorId);
    }
    case 'tap_dance': {
      const next: SlotRef = { kind: 'dance-tap', index: 0 };
      return toStoreResult((project) => setTapDanceBinding(project, target), next);
    }
    case 'mod_morph': {
      const next: SlotRef = { kind: 'morph-side', side: 'normal' };
      return toStoreResult((project) => setModMorphBinding(project, target), next);
    }
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return toBindingResult(input, { kind: behaviorId });
    }
    default: {
      return behaviorId satisfies never;
    }
  }
}
