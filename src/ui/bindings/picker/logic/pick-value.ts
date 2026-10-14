import {
  setHoldKey,
  setKeyBehavior,
  setKeycode,
  setModMorphKeys,
  setTapDanceTaps,
} from '@domain/bindings/editing';
import type { Binding, BluetoothCommand, BluetoothProfileCommand, KeyStroke } from '@domain';
import { isProfileCommand } from './binding-slots';
import type { BindingDraft } from './binding-slots';
import { throwUnfitPick, toBindingResult, toStoreResult } from './pick-result';
import type { PickInput, PickResult } from './pick-result';

type KeyDraft = Extract<BindingDraft, { readonly behaviorId: 'kp' | 'sk' | 'kt' | 'mt' }>;
function isKeyDraft(draft: BindingDraft): draft is KeyDraft {
  return (
    draft.behaviorId === 'kp' ||
    draft.behaviorId === 'sk' ||
    draft.behaviorId === 'kt' ||
    draft.behaviorId === 'mt'
  );
}

// Every selected key becomes a key press of the picked key, then the drafted behavior (FR-009).
function completeKeyDraft(input: PickInput, draft: KeyDraft): PickResult {
  const { target } = input;
  const { behaviorId, key } = draft;
  if (key === undefined) {
    return throwUnfitPick(input);
  }
  return toStoreResult((project) => {
    const pressed = setKeyBehavior(setKeycode(project, { ...target, ...key }), {
      ...target,
      behavior: { id: 'kp' },
    });
    if (behaviorId === 'mt') {
      return setHoldKey(pressed, { ...target, hold: draft.hold });
    }
    return setKeyBehavior(pressed, { ...target, behavior: { id: behaviorId } });
  });
}

function toDraftKeycodeResult(input: PickInput, draft: BindingDraft, keycode: string): PickResult {
  if (input.slot.kind === 'hold') {
    if (draft.behaviorId !== 'mt') {
      return throwUnfitPick(input);
    }
    const hold = { keycode, modifiers: [] };
    return { kind: 'draft', draft: { ...draft, hold }, next: { kind: 'tap' } };
  }
  const key = { keycode, modifiers: input.pendingModifiers };
  if (draft.behaviorId === 'lt') {
    return toLayerTapDraftResult(input, { ...draft, key });
  }
  return isKeyDraft(draft) ? completeKeyDraft(input, { ...draft, key }) : throwUnfitPick(input);
}

// A layer-tap draft stores once it has its layer and tap, whichever is picked last (spec 007).
function toLayerTapDraftResult(
  input: PickInput,
  draft: Extract<BindingDraft, { readonly behaviorId: 'lt' }> & { readonly key: KeyStroke },
): PickResult {
  const { layerId, key } = draft;
  if (layerId === undefined) {
    return { kind: 'draft', draft, next: { kind: 'layer' } };
  }
  return toBindingResult(input, { kind: 'lt', layerId, tap: key });
}

// Tap-dance taps and mod-morph sides keep their own modifiers; the next tap or side opens.
function toNodeKeycodeResult(input: PickInput, binding: Binding, keycode: string): PickResult {
  const { slot, target } = input;
  if (slot.kind === 'dance-tap' && binding.kind === 'tap_dance') {
    const taps = binding.taps.map((tap, index) =>
      index === slot.index ? { ...tap, keycode } : tap,
    );
    const next =
      slot.index + 1 < taps.length
        ? { kind: 'dance-tap' as const, index: slot.index + 1 }
        : undefined;
    return toStoreResult((project) => setTapDanceTaps(project, { ...target, taps }), next);
  }
  if (slot.kind === 'morph-side' && binding.kind === 'mod_morph') {
    const keys = { normal: binding.normal, morphed: binding.morphed };
    const changed = { ...keys, [slot.side]: { ...keys[slot.side], keycode } };
    const next =
      slot.side === 'normal'
        ? { kind: 'morph-side' as const, side: 'morphed' as const }
        : undefined;
    return toStoreResult((project) => setModMorphKeys(project, { ...target, ...changed }), next);
  }
  return throwUnfitPick(input);
}

function toStoredKeycodeResult(input: PickInput, binding: Binding, keycode: string): PickResult {
  const { slot, target } = input;
  if (slot.kind === 'key' || slot.kind === 'tap') {
    const modifiers = input.pendingModifiers;
    return toStoreResult((project) => setKeycode(project, { ...target, keycode, modifiers }));
  }
  if (slot.kind === 'hold') {
    const hold = { keycode, modifiers: [] };
    return toStoreResult((project) => setHoldKey(project, { ...target, hold }), { kind: 'tap' });
  }
  return toNodeKeycodeResult(input, binding, keycode);
}

export function toKeycodeResult(input: PickInput, keycode: string): PickResult {
  const { source } = input;
  if (source.kind === 'draft') {
    return toDraftKeycodeResult(input, source.draft, keycode);
  }
  return source.kind === 'binding'
    ? toStoredKeycodeResult(input, source.binding, keycode)
    : throwUnfitPick(input);
}

function findProfile(input: PickInput): number | undefined {
  const { source } = input;
  if (source.kind === 'draft') {
    return source.draft.behaviorId === 'bt' ? source.draft.profile : undefined;
  }
  return source.kind === 'binding' && source.binding.kind === 'bt' && 'profile' in source.binding
    ? source.binding.profile
    : undefined;
}

// A profile command keeps the profile it had, else asks for one as a draft.
export function toBluetoothCommandResult(
  input: PickInput,
  command: BluetoothCommand | BluetoothProfileCommand,
): PickResult {
  if (!isProfileCommand(command)) {
    return toBindingResult(input, { kind: 'bt', command });
  }
  const profile = findProfile(input);
  if (profile === undefined) {
    return {
      kind: 'draft',
      draft: { behaviorId: 'bt', btCommand: command },
      next: { kind: 'profile' },
    };
  }
  return toBindingResult(input, { kind: 'bt', command, profile }, { kind: 'profile' });
}

function findBluetoothCommand(
  input: PickInput,
): BluetoothCommand | BluetoothProfileCommand | undefined {
  const { source } = input;
  if (source.kind === 'draft') {
    return source.draft.behaviorId === 'bt' ? source.draft.btCommand : undefined;
  }
  return source.kind === 'binding' && source.binding.kind === 'bt'
    ? source.binding.command
    : undefined;
}

export function toProfileResult(input: PickInput, profile: number): PickResult {
  const command = findBluetoothCommand(input);
  if (command === undefined || !isProfileCommand(command)) {
    return throwUnfitPick(input);
  }
  return toBindingResult(input, { kind: 'bt', command, profile });
}

// A layer pick: a stored layer behavior changes only its layer; a draft stores once complete,
// layer-tap keeping each key's own key when every key sends one, then opening its tap (spec 007).
export function toLayerResult(input: PickInput, layerId: string): PickResult {
  const { source, target } = input;
  if (source.kind === 'binding' && 'layerId' in source.binding) {
    return toBindingResult(input, { ...source.binding, layerId });
  }
  if (source.kind !== 'draft') {
    return throwUnfitPick(input);
  }
  const { draft } = source;
  const { behaviorId } = draft;
  if (behaviorId === 'mo' || behaviorId === 'tog' || behaviorId === 'to' || behaviorId === 'sl') {
    return toBindingResult(input, { kind: behaviorId, layerId });
  }
  if (behaviorId !== 'lt') {
    return throwUnfitPick(input);
  }
  if (draft.key !== undefined) {
    return toBindingResult(input, { kind: 'lt', layerId, tap: draft.key });
  }
  if (input.isEveryKeySendingKey) {
    const behavior = { id: 'lt', layerId } as const;
    return toStoreResult((project) => setKeyBehavior(project, { ...target, behavior }), {
      kind: 'tap',
    });
  }
  return { kind: 'draft', draft: { ...draft, layerId }, next: { kind: 'tap' } };
}
