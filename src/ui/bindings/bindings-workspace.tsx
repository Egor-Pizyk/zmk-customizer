import { ActionPanel } from './action-panel';
import { BindingsCanvas } from './bindings-canvas';
import { BindingsTable } from './bindings-table';
import { NoKeys } from './no-keys';
import { useBindingsInteraction } from './use-bindings-interaction';
import { useBindingsWorkspace } from './use-bindings-workspace';

// Keycaps over the dimmed schematic, the Action panel, and the Keys table (spec 004).
export function BindingsWorkspace() {
  const workspace = useBindingsWorkspace();
  const { canvasProps, panelProps, tableProps } = useBindingsInteraction(workspace);
  if (workspace.project.keys.length === 0) {
    return <NoKeys />;
  }
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BindingsCanvas {...canvasProps} />
        <BindingsTable {...tableProps} />
      </div>
      <ActionPanel {...panelProps} />
    </div>
  );
}
