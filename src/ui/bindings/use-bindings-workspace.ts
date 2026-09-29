import { useState } from 'react';
import type { Project } from '../../domain/types';
import { usePreferences } from '../preferences-context';
import { useProject } from '../project-context';
import { advanceSelection } from './advance-selection';
import { focusActionPanel } from './focus-action-panel';
import { formatSelectionName } from './format-selection-name';
import { getProblemsByKeyId } from './get-problems-by-key-id';
import { useCopiedBinding } from './use-copied-binding';
import { useKeyPicker } from './use-key-picker';

// Bindings UI state (selection, active key, key picker, copied action); the project changes
// only through domain operations committed via ProjectProvider (react.md "Project state").
export function useBindingsWorkspace() {
  const { project, issues, commit, announce } = useProject();
  const { isAutoAdvanceEnabled } = usePreferences().preferences;
  const [selection, setSelection] = useState<readonly string[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | undefined>();
  // Keys deleted in Schematic drop out of the selection (spec 004 edge cases), derived in render.
  const selectedKeyIds = selection.filter((keyId) => project.keys.some((key) => key.id === keyId));
  const picker = useKeyPicker(project, selectedKeyIds);
  const selectionName = formatSelectionName(project, selectedKeyIds);
  const copied = useCopiedBinding({ project, selectedKeyIds, selectionName, commit, announce });

  function handleSelectionChange(keyIds: readonly string[]) {
    setSelection(keyIds);
    picker.syncSelection(keyIds);
  }

  function handlePicked() {
    advanceSelection({
      project,
      selectedKeyIds,
      isEnabled: isAutoAdvanceEnabled,
      onSelect: (keyId) => {
        handleSelectionChange([keyId]);
      },
    });
  }

  return {
    project,
    problemsByKeyId: getProblemsByKeyId(issues),
    selectedKeyIds,
    activeKeyId: findActiveKeyId(project, activeKeyId),
    picker,
    selectionName,
    copied,
    commit,
    handlePicked,
    handleSelectionChange,
    handleActiveKeyChange: setActiveKeyId,
    handleOpenPanel: focusActionPanel,
  };
}

// The roving tab stop: the last focused key if it still exists, else key 0.
function findActiveKeyId(project: Project, activeKeyId: string | undefined) {
  return project.keys.some((key) => key.id === activeKeyId) ? activeKeyId : project.keys[0]?.id;
}

export type BindingsWorkspaceState = ReturnType<typeof useBindingsWorkspace>;
