import { setBindings } from '../../domain/set-bindings';
import type { Binding, Modifier, Project } from '../../domain/types';
import type { BindingDraft, LineSource, SlotRef } from './binding-slots';
import type { PickerPick } from './to-picker-item';

export type PickInput = {
  readonly source: LineSource;
  readonly slot: SlotRef;
  readonly pick: PickerPick;
  readonly target: { readonly layerIndex: number; readonly keyIds: readonly string[] };
  /** Chips chosen before the key of a draft (spec 004 FR-011). */
  readonly pendingModifiers: readonly Modifier[];
  readonly isEveryKeySendingKey: boolean;
};

/** Store now and open `next` (undefined: the binding is done), or keep drafting (spec 006). */
export type PickResult =
  | {
      readonly kind: 'store';
      readonly change: (project: Project) => Project;
      readonly next: SlotRef | undefined;
    }
  | { readonly kind: 'draft'; readonly draft: BindingDraft; readonly next: SlotRef };

export function toStoreResult(change: (project: Project) => Project, next?: SlotRef): PickResult {
  return { kind: 'store', change, next };
}

export function toBindingResult(input: PickInput, binding: Binding, next?: SlotRef): PickResult {
  return toStoreResult((project) => setBindings(project, { ...input.target, binding }), next);
}

/** The picker only offers choices of the open slot; anything else is a programmer error. */
export function throwUnfitPick(input: PickInput): never {
  throw new Error(`A ${input.pick.kind} pick does not fit the ${input.slot.kind} slot`);
}
