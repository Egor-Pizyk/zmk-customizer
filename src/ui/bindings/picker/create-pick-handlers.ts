import { isEveryKeySendingKey } from '@domain';
import type { Project } from '@domain';
import { createOptionHandlers } from './create-option-handlers';
import { createDraft } from './draft-state';
import type { DraftState } from './draft-state';
import type { PickResult } from './pick-result';
import { toPickResult } from './pick-slot';
import type { PickerItem } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

export type PickHandlerOptions = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly selectionName: string;
  readonly picker: KeyPickerState;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
  /** Called once a binding is done (auto-advance, spec 004 FR-014a). */
  readonly onPicked: () => void;
};

// After storing: a behavior pick ends any draft; a completed draft leaves a blank one of the
// same behavior for the next empty key (spec 006 US1 AS6); other picks keep the draft as is.
function findDraftStateAfterStore(
  picker: KeyPickerState,
  item: PickerItem,
): DraftState | undefined {
  if (item.pick.kind === 'behavior') {
    return undefined;
  }
  const { source, draftState } = picker;
  if (source.kind === 'draft' && draftState !== undefined) {
    return { ...draftState, draft: createDraft(source.draft.behaviorId) };
  }
  return draftState;
}

function applyPickResult(options: PickHandlerOptions, item: PickerItem, result: PickResult) {
  const { picker } = options;
  if (result.kind === 'draft') {
    picker.setDraftState({
      draft: result.draft,
      over: picker.shared,
      layerIndex: picker.target.layerIndex,
    });
    picker.handleSlotOpen(result.next);
    return;
  }
  options.commit(result.change, `${options.selectionName}: ${item.name}`);
  picker.setDraftState(findDraftStateAfterStore(picker, item));
  picker.setPendingModifiers([]);
  picker.handleSlotOpen(result.next);
  if (result.next === undefined) {
    options.onPicked();
  }
}

// Every pick is one commit for all selected keys (spec 004 FR-015), or a draft step (spec 006).
export function createPickHandlers(options: PickHandlerOptions) {
  const { project, picker } = options;
  const { target } = picker;
  return {
    ...createOptionHandlers({ ...options, target }),
    handlePick: (item: PickerItem) => {
      const result = toPickResult({
        source: picker.source,
        slot: picker.slot,
        pick: item.pick,
        target,
        pendingModifiers: picker.pendingModifiers,
        isEveryKeySendingKey: isEveryKeySendingKey(project, target),
      });
      applyPickResult(options, item, result);
    },
  };
}

export type PickHandlers = ReturnType<typeof createPickHandlers>;
