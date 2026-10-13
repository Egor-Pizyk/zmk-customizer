import type { ReactNode } from 'react';
import { AddKeyIcon, SelectIcon, WireIcon } from '@ui/components';
import type { RadioOption } from '@ui/components';
import { SHORTCUTS } from '@ui/shortcuts';
import type { ShortcutId } from '@ui/shortcuts';
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

export const TOOL_OPTIONS: readonly RadioOption<ToolId>[] = TOOLS.map((tool) => ({
  value: tool.id,
  label: tool.label,
  icon: ICON_BY_TOOL[tool.id],
  hint: formatToolHint(tool),
}));
