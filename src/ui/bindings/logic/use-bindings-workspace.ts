import { usePreferences } from '@ui/preferences';
import { useProject } from '@ui/project/logic';
import {
  advanceSelection,
  useCopiedBinding,
  useKeySelection,
  useLayerActions,
} from '@ui/bindings/interaction';
import { formatSelectionName } from '@ui/bindings/formatting';
import { getProblemsByKeyId } from '@ui/bindings/rendering/logic';
import { useKeyPicker } from '@ui/bindings/picker/logic';

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
