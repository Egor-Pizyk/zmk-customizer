import { usePreferences } from '../preferences-context';
import { useProject } from '../project-context';
import { advanceSelection } from './advance-selection';
import { formatSelectionName } from './format-selection-name';
import { getProblemsByKeyId } from './get-problems-by-key-id';
import { useCopiedBinding } from './use-copied-binding';
import { useKeyPicker } from './use-key-picker';
import { useKeySelection } from './use-key-selection';
import { useLayerActions } from './use-layer-actions';

// Bindings UI state (selection, active key, key picker, copied action); the project changes
// only through domain operations committed via ProjectProvider (react.md "Project state").
export function useBindingsWorkspace() {
  const { project, issues, commit } = useProject();
  const { isAutoAdvanceEnabled, bindingsLayerIndex } = usePreferences().preferences;
  const layerIndex = Math.min(bindingsLayerIndex, project.layers.length - 1);
  const { selectedKeyIds, activeKeyId, setSelection, setActiveKeyId } = useKeySelection(project);
  const picker = useKeyPicker(project, { layerIndex, keyIds: selectedKeyIds });
  const selectionName = formatSelectionName(project, selectedKeyIds);
  const copied = useCopiedBinding({ target: picker.target, selectionName });
  const { reservedLayerIds } = copied;
  const layers = useLayerActions({ project, issues, commit, layerIndex, reservedLayerIds });

  function handleSelectionChange(keyIds: readonly string[]) {
    setSelection(keyIds);
    picker.syncSelection();
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
    layers,
    problemsByKeyId: getProblemsByKeyId(issues, { layerIndex: layers.layerIndex }),
    selectedKeyIds,
    activeKeyId,
    picker,
    selectionName,
    copied,
    commit,
    handlePicked,
    handleSelectionChange,
    handleActiveKeyChange: setActiveKeyId,
  };
}

export type BindingsWorkspaceState = ReturnType<typeof useBindingsWorkspace>;
