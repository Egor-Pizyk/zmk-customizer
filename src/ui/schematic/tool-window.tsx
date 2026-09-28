import type { ReactNode } from 'react';
import { FloatingPanel } from '../components/floating-panel';
import type { PanelPosition } from '../components/panel-position';
import { AddKeyIcon } from '../components/icons/add-key-icon';
import { SelectIcon } from '../components/icons/select-icon';
import { WireIcon } from '../components/icons/wire-icon';
import { RadioGroup } from '../components/radio-group';
import type { RadioOption } from '../components/radio-group';
import { usePreferences } from '../preferences-context';
import { SHORTCUTS } from '../shortcuts';
import type { ShortcutId } from '../shortcuts';
import { TOOLS } from './tools';
import type { ToolId } from './tools';

const ICON_BY_TOOL: Record<ToolId, ReactNode> = {
  select: <SelectIcon />,
  'add-key': <AddKeyIcon />,
  wire: <WireIcon />,
};

const SHORTCUT_BY_TOOL: Record<ToolId, ShortcutId> = {
  select: 'select-tool',
  'add-key': 'add-key-tool',
  wire: 'wire-tool',
};

// The hint names the key from SHORTCUTS, so it cannot drift from the handler.
function formatToolHint(tool: (typeof TOOLS)[number]): string {
  const shortcut = SHORTCUTS.find((candidate) => candidate.id === SHORTCUT_BY_TOOL[tool.id]);
  const key = shortcut !== undefined && 'keys' in shortcut ? shortcut.keys[0] : undefined;
  return key === undefined ? tool.label : `${tool.label} (${key.toUpperCase()})`;
}

const TOOL_OPTIONS: readonly RadioOption<ToolId>[] = TOOLS.map((tool) => ({
  value: tool.id,
  label: tool.label,
  icon: ICON_BY_TOOL[tool.id],
  hint: formatToolHint(tool),
}));

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
      {hint === undefined ? undefined : <p className="max-w-40 text-xs text-warning">{hint}</p>}
    </FloatingPanel>
  );
}
