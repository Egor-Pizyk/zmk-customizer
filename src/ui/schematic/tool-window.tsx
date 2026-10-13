import { TOOL_OPTIONS } from './tool-options';
import { Button } from '../components/button';
import { FloatingPanel } from '../components/floating-panel';
import type { PanelPosition } from '../components/panel-position';
import { RadioGroup } from '../components/radio-group';
import { usePreferences } from '../preferences-context';
import type { ToolId } from './tools';

type ToolWindowProps = {
  readonly activeToolId: ToolId;
  /** Last canvas hint ("There is already a key here."); also announced by StatusMessage. */
  readonly hint: string | undefined;
  readonly onToolChange: (toolId: ToolId) => void;
};

export function ToolWindow({ activeToolId, hint, onToolChange }: ToolWindowProps) {
  const { preferences, changePreferences } = usePreferences();
  const { toolWindow } = preferences;

  function handleMoveEnd(position: PanelPosition) {
    changePreferences({ toolWindow: { ...toolWindow, ...position } });
  }

  function handleCollapsedChange(isCollapsed: boolean) {
    changePreferences({ toolWindow: { ...toolWindow, isCollapsed } });
  }

  function handleToolChange(toolId: ToolId) {
    onToolChange(toolId);
    // Return focus to the canvas so canvas shortcuts (Escape, Delete, …) work immediately.
    requestAnimationFrame(() => {
      document.querySelector<SVGSVGElement>('[data-canvas-workspace="schematic"]')?.focus();
    });
  }

  return (
    <FloatingPanel
      isCollapsed={toolWindow.isCollapsed}
      onCollapsedChange={handleCollapsedChange}
      onMoveEnd={handleMoveEnd}
      position={toolWindow}
      title="Tools"
    >
      <RadioGroup
        isLabelVisible={false}
        label="Tool"
        onChange={handleToolChange}
        options={TOOL_OPTIONS}
        value={activeToolId}
      />
      <LayoutEditButton />
      {hint === undefined ? undefined : <p className="max-w-40 text-xs text-warning">{hint}</p>}
    </FloatingPanel>
  );
}

function handleEditClick() {
  const details = document.querySelector<HTMLDetailsElement>('[data-precise-properties]');
  if (details !== null) {
    details.open = true;
  }
  requestAnimationFrame(() => {
    document.querySelector<HTMLInputElement>('[data-layout-controls] input')?.focus();
  });
}

function LayoutEditButton() {
  return (
    <Button onClick={handleEditClick} size="sm">
      Edit selected layout
    </Button>
  );
}
