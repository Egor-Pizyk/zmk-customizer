import { EncoderBindings } from '@ui/bindings/encoders/components';
import { AdvancedLibrary } from '@ui/bindings/advanced/components';
import { BehaviorLibrary } from '@ui/bindings/behaviors/components';
import { toTabId } from '@ui/components/logic';
import { ActionPanel } from '@ui/bindings/panel/components';
import {
  BindingsCanvas,
  BindingsTable,
  LayerBar,
  NoKeys,
  KeycapSizeDialog,
} from '@ui/bindings/rendering/components';
import { useBindingsInteraction, useKeycapSize } from '@ui/bindings/interaction';
import { useBindingsWorkspace } from '@ui/bindings/logic';
import { useId } from 'react';

// Layer tabs over the keycaps on the dimmed schematic, the Action panel, and the Keys table
// (specs 004, 007). The canvas and the table are the panel of the open layer's tab.
export function BindingsWorkspace() {
  const workspace = useBindingsWorkspace();
  const { canvasProps, panelProps, tableProps } = useBindingsInteraction(workspace);
  const size = useKeycapSize({
    selectedKeyIds: workspace.selectedKeyIds,
    onSelectionChange: workspace.handleSelectionChange,
  });
  const tabIdPrefix = useId();
  const panelId = useId();
  const { project, layers } = workspace;
  if (project.keys.length === 0) {
    return <EmptyBindingsWorkspace workspace={workspace} />;
  }
  const openLayerId = project.layers[layers.layerIndex]?.id ?? '';
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BindingLibraries workspace={workspace} />
        <LayerBar
          actions={layers}
          layers={project.layers}
          panelId={panelId}
          tabIdPrefix={tabIdPrefix}
        />
        <div
          aria-labelledby={toTabId(tabIdPrefix, openLayerId)}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          id={panelId}
          role="tabpanel"
        >
          <BindingsCanvas {...canvasProps} onKeycapSize={size.handleOpen} />
          <BindingsTable {...tableProps} onKeycapSize={size.handleOpen} />
          <KeycapSizeDialog {...size.dialogProps} />
        </div>
      </div>
      <ActionPanel {...panelProps} />
    </div>
  );
}

function BindingLibraries({
  workspace,
}: {
  readonly workspace: ReturnType<typeof useBindingsWorkspace>;
}) {
  return (
    <>
      <EncoderBindings layerIndex={workspace.layers.layerIndex} />
      <BehaviorLibrary reservedIds={workspace.copied.reservedBehaviorIds} />
      <AdvancedLibrary
        selectedKeyIds={workspace.selectedKeyIds}
        onSelectKeys={workspace.handleSelectionChange}
        reservedMacroIds={workspace.copied.reservedMacroIds}
      />
    </>
  );
}

function EmptyBindingsWorkspace({
  workspace,
}: {
  readonly workspace: ReturnType<typeof useBindingsWorkspace>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BindingLibraries workspace={workspace} />
      <NoKeys />
    </div>
  );
}
