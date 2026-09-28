import { useEffect, useEffectEvent } from 'react';
import { matchShortcut } from '../shortcuts';
import type { ShortcutId } from '../shortcuts';
import { readShortcutInput } from '../use-global-shortcuts';
import type { ToolId } from './tools';

type SchematicShortcutHandlers = {
  readonly onToolChange: (toolId: ToolId) => void;
  readonly onPlaceKey: () => void;
  readonly onDeleteSelection: () => void;
  readonly onCancel: () => void;
};

const TOOL_BY_SHORTCUT: Partial<Record<ShortcutId, ToolId>> = {
  'select-tool': 'select',
  'add-key-tool': 'add-key',
  'wire-tool': 'wire',
};

function runShortcut(shortcutId: ShortcutId, handlers: SchematicShortcutHandlers): boolean {
  const toolId = TOOL_BY_SHORTCUT[shortcutId];
  if (toolId !== undefined) {
    handlers.onToolChange(toolId);
    return true;
  }
  if (shortcutId === 'place-key') {
    handlers.onPlaceKey();
    return true;
  }
  if (shortcutId === 'delete-selection') {
    handlers.onDeleteSelection();
    return true;
  }
  if (shortcutId === 'cancel') {
    handlers.onCancel();
    return true;
  }
  return false;
}

// Schematic-only canvas keys (SHORTCUTS "Schematic: …"). The app-wide listener ignores these ids
// because getShortcutAction has no action for them; this one owns the workspace state they need.
export function useSchematicShortcuts(handlers: SchematicShortcutHandlers) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const input = readShortcutInput(event);
    if (input.focusedCanvas !== 'schematic' || event.repeat) {
      return;
    }
    const shortcutId = matchShortcut(input);
    if (shortcutId !== undefined && runShortcut(shortcutId, handlers)) {
      event.preventDefault();
    }
  });

  useEffect(() => {
    function handleNativeKeyDown(event: KeyboardEvent) {
      handleKeyDown(event);
    }
    globalThis.addEventListener('keydown', handleNativeKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleNativeKeyDown);
    };
  }, []);
}
