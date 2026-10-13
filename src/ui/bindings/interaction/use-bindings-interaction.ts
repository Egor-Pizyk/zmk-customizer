import { createPickHandlers } from '../picker/create-pick-handlers';
import { createKeycapKeyboardHandler } from './create-keycap-keyboard-handler';
import { focusActionPanel } from '../panel/focus-action-panel';
import { focusKeycap } from './focus-keycap';
import { useBindingsPointer } from './use-bindings-pointer';
import { useBindingsShortcuts } from './use-bindings-shortcuts';
import type { BindingsWorkspaceState } from '../use-bindings-workspace';

// Props for the canvas, Action panel and Keys table, built from the workspace state.
export function useBindingsInteraction(workspace: BindingsWorkspaceState) {
  const { project, selectedKeyIds, activeKeyId, problemsByKeyId, copied } = workspace;
  const onSelectionChange = workspace.handleSelectionChange;
  const onTagPress = workspace.picker.handleBehaviorOpen;
  const pointer = useBindingsPointer({ project, selectedKeyIds, onSelectionChange, onTagPress });
  useBindingsShortcuts({ onCopy: copied.handleCopy, onPaste: copied.handlePaste });
  const { layerIndex } = workspace.layers;
  const shared = { project, layerIndex, selectedKeyIds, activeKeyId, problemsByKeyId };
  return {
    canvasProps: {
      ...shared,
      marquee: pointer.marquee,
      pointerHandlers: pointer.handlers,
      onKeyFocus: (keyId: string) => {
        workspace.handleActiveKeyChange(keyId);
        // Focusing a key (keyboard, problem button, or pointer) selects it so the panel
        // follows; selecting an already-selected key is skipped to avoid extra renders.
        if (!selectedKeyIds.includes(keyId)) {
          onSelectionChange([keyId]);
        }
      },
      onKeyKeyDown: createKeycapKeyboardHandler({
        project,
        selectedKeyIds,
        onSelectionChange,
        onOpenPanel: focusActionPanel,
      }),
    },
    panelProps: toPanelProps(workspace),
    tableProps: {
      ...shared,
      onSelectionChange,
      onActiveKeyChange: workspace.handleActiveKeyChange,
      onChooseAction: (keyId: string) => {
        onSelectionChange([keyId]);
        focusActionPanel();
      },
    },
  };
}

function toPanelProps(workspace: BindingsWorkspaceState) {
  const { project, selectedKeyIds, selectionName, picker, copied, activeKeyId } = workspace;
  const onPicked = workspace.handlePicked;
  return {
    picker,
    handlers: createPickHandlers({
      project,
      selectedKeyIds,
      selectionName,
      picker,
      commit: workspace.commit,
      onPicked,
    }),
    selectionName: workspace.selectionName,
    selectedCount: workspace.selectedKeyIds.length,
    canPaste: copied.canPaste,
    onCopy: copied.handleCopy,
    onPaste: copied.handlePaste,
    onEscapeToCanvas: () => {
      if (activeKeyId !== undefined) {
        focusKeycap(activeKeyId);
      }
    },
  };
}
