import { isEveryKeyPress } from '../../domain/is-every-key-press';
import { setKeyPressModifier } from '../../domain/set-key-press-modifier';
import { MODIFIERS } from '../../domain/types';
import type { Modifier, Project } from '../../domain/types';
import type { KeyPickerState } from './use-key-picker';

type ToggleModifierOptions = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly selectionName: string;
  readonly picker: KeyPickerState;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
};

// With every selected key sending a key the chip changes them now; otherwise it waits for the
// key picked next (FR-011).
export function toggleKeyModifier(
  { project, selectedKeyIds: keyIds, selectionName, picker, commit }: ToggleModifierOptions,
  { modifier, isEnabled }: { readonly modifier: Modifier; readonly isEnabled: boolean },
) {
  const target = { layerIndex: 0, keyIds };
  if (isEveryKeyPress(project, target)) {
    const change = { ...target, modifier, isEnabled };
    commit(
      (current) => setKeyPressModifier(current, change),
      `${selectionName}: modifiers changed`,
    );
    return;
  }
  picker.setPendingModifiers(
    MODIFIERS.filter((candidate) =>
      candidate === modifier ? isEnabled : picker.pendingModifiers.includes(candidate),
    ),
  );
}
