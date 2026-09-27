import { useState } from 'react';
import type { ReactNode } from 'react';
import { FloatingPanel } from '../components/floating-panel';
import type { PanelPosition } from '../components/panel-position';
import { AddKeyIcon } from '../components/icons/add-key-icon';
import { SelectIcon } from '../components/icons/select-icon';
import { WireIcon } from '../components/icons/wire-icon';
import { RadioGroup } from '../components/radio-group';
import type { RadioOption } from '../components/radio-group';
import { usePreferences } from '../preferences-context';
import { TOOLS } from './tools';
import type { ToolId } from './tools';

const ICON_BY_TOOL: Record<ToolId, ReactNode> = {
  select: <SelectIcon />,
  'add-key': <AddKeyIcon />,
  wire: <WireIcon />,
};

const TOOL_OPTIONS: readonly RadioOption<ToolId>[] = TOOLS.map((tool) => ({
  value: tool.id,
  label: tool.label,
  icon: ICON_BY_TOOL[tool.id],
  isDisabled: !tool.isAvailable,
  hint: tool.isAvailable ? tool.label : 'Not available yet',
}));

export function ToolWindow() {
  const { preferences, changePreferences } = usePreferences();
  const { toolWindow } = preferences;
  const [activeToolId, setActiveToolId] = useState<ToolId>('select');

  function handleMoveEnd(position: PanelPosition) {
    changePreferences({ toolWindow: { ...toolWindow, ...position } });
  }

  function handleCollapsedChange(isCollapsed: boolean) {
    changePreferences({ toolWindow: { ...toolWindow, isCollapsed } });
  }

  function handleToolChange(toolId: ToolId) {
    setActiveToolId(toolId);
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
    </FloatingPanel>
  );
}
