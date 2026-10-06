import { setHoldKey } from '../../domain/set-hold-key';
import { setKeyBehavior } from '../../domain/set-key-behavior';
import { setKeycode } from '../../domain/set-keycode';
import { setModMorphKeys } from '../../domain/set-mod-morph-keys';
import { setTapDanceTaps } from '../../domain/set-tap-dance-taps';
import type { Binding, BluetoothCommand, BluetoothProfileCommand } from '../../domain/types';
import { isProfileCommand } from './binding-slots';
import type { BindingDraft } from './binding-slots';
import { DEFAULT_HOLD } from './draft-state';
import { throwUnfitPick, toBindingResult, toStoreResult } from './pick-result';
import type { PickInput, PickResult } from './pick-result';

// Every selected key becomes a key press of the picked key, then the drafted behavior (FR-009).
function completeKeyDraft(input: PickInput, draft: BindingDraft): PickResult {
  const { target } = input;
  const { behaviorId, key, hold } = draft;
  if (key === undefined || behaviorId === 'bt' || behaviorId === 'out') {
    return throwUnfitPick(input);
  }
  return toStoreResult((project) => {
    const pressed = setKeyBehavior(setKeycode(project, { ...target, ...key }), {
      ...target,
      behavior: { id: 'kp' },
    });
    if (behaviorId === 'mt') {
      return setHoldKey(pressed, { ...target, hold: hold ?? DEFAULT_HOLD });
    }
    return setKeyBehavior(pressed, { ...target, behavior: { id: behaviorId } });
  });
}

function toDraftKeycodeResult(input: PickInput, draft: BindingDraft, keycode: string): PickResult {
  if (input.slot.kind === 'hold') {
    const hold = { keycode, modifiers: [] };
    return { kind: 'draft', draft: { ...draft, hold }, next: { kind: 'tap' } };
  }
  return completeKeyDraft(input, {
    ...draft,
    key: { keycode, modifiers: input.pendingModifiers },
  });
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
    return source.draft.profile;
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
    return source.draft.btCommand;
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
