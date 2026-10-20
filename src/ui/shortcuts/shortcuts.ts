import type { CanvasWorkspaceId } from '@storage/preferences';

// Globals are Alt+Shift matched by `code` (Option on macOS changes `key`; Alt+digit alone
// switches browser tabs on Linux). Single keys work only while a canvas has focus (WCAG 2.1.4).
// Contract: specs/001-app-shell-ui/contracts/shortcuts.md.
export const SHORTCUTS = [
  {
    scope: 'global',
    id: 'workspace-schematic',
    code: 'Digit1',
    keyLabel: '1',
    label: 'Show Schematic',
  },
  {
    scope: 'global',
    id: 'workspace-bindings',
    code: 'Digit2',
    keyLabel: '2',
    label: 'Show Bindings',
  },
  {
    scope: 'global',
    id: 'workspace-firmware',
    code: 'Digit3',
    keyLabel: '3',
    label: 'Show Firmware',
  },
  { scope: 'global', id: 'workspace-export', code: 'Digit4', keyLabel: '4', label: 'Show Export' },
  { scope: 'global', id: 'open-settings', code: 'Comma', keyLabel: ',', label: 'Open settings' },
  {
    scope: 'global',
    id: 'toggle-issues-panel',
    code: 'KeyP',
    keyLabel: 'P',
    label: 'Open or close the problems panel',
  },
  { scope: 'global', id: 'open-help', code: 'Slash', keyLabel: '/', label: 'Keyboard shortcuts' },
  { scope: 'canvas', id: 'toggle-snap', keys: ['s'], label: 'Toggle snap to grid' },
  { scope: 'canvas', id: 'toggle-grid', keys: ['g'], label: 'Show or hide the grid' },
  { scope: 'canvas', id: 'zoom-in', keys: ['=', '+'], label: 'Zoom in' },
  { scope: 'canvas', id: 'zoom-out', keys: ['-'], label: 'Zoom out' },
  { scope: 'canvas', id: 'reset-view', keys: ['0'], label: 'Reset view' },
  {
    scope: 'canvas',
    id: 'pan-left',
    keys: ['ArrowLeft'],
    shift: false,
    label: 'Pan left one grid step',
  },
  {
    scope: 'canvas',
    id: 'pan-right',
    keys: ['ArrowRight'],
    shift: false,
    label: 'Pan right one grid step',
  },
  { scope: 'canvas', id: 'pan-up', keys: ['ArrowUp'], shift: false, label: 'Pan up one grid step' },
  {
    scope: 'canvas',
    id: 'pan-down',
    keys: ['ArrowDown'],
    shift: false,
    label: 'Pan down one grid step',
  },
  { scope: 'canvas', id: 'pan-left-1u', keys: ['ArrowLeft'], shift: true, label: 'Pan left 1u' },
  { scope: 'canvas', id: 'pan-right-1u', keys: ['ArrowRight'], shift: true, label: 'Pan right 1u' },
  { scope: 'canvas', id: 'pan-up-1u', keys: ['ArrowUp'], shift: true, label: 'Pan up 1u' },
  { scope: 'canvas', id: 'pan-down-1u', keys: ['ArrowDown'], shift: true, label: 'Pan down 1u' },
  { scope: 'canvas', id: 'open-help', keys: ['?'], label: 'Keyboard shortcuts' },
  // Schematic canvas (spec 003); handled by schematic/use-schematic-shortcuts.ts.
  { scope: 'canvas', id: 'select-tool', keys: ['v'], label: 'Schematic: Select tool' },
  { scope: 'canvas', id: 'add-key-tool', keys: ['k'], label: 'Schematic: Key tool' },
  { scope: 'canvas', id: 'wire-tool', keys: ['w'], label: 'Schematic: Wire tool' },
  {
    scope: 'canvas',
    id: 'place-key',
    keys: ['Enter'],
    label: 'Schematic, Key tool: add a key at the next free spot',
  },
  {
    scope: 'canvas',
    id: 'delete-selection',
    keys: ['Delete', 'Backspace'],
    label: 'Schematic: delete selected keys or wire sections',
  },
  {
    scope: 'canvas',
    id: 'cancel',
    keys: ['Escape'],
    label:
      'Schematic: cancel the wire being drawn, else clear the selection and switch to the Select tool',
  },
  // While a key on the Schematic has focus; matched by the key itself (matchKeyShortcut).
  {
    scope: 'key',
    id: 'focus-key-left',
    keys: ['ArrowLeft'],
    shift: false,
    label: 'Nearest key left',
  },
  {
    scope: 'key',
    id: 'focus-key-right',
    keys: ['ArrowRight'],
    shift: false,
    label: 'Nearest key right',
  },
  { scope: 'key', id: 'focus-key-up', keys: ['ArrowUp'], shift: false, label: 'Nearest key up' },
  {
    scope: 'key',
    id: 'focus-key-down',
    keys: ['ArrowDown'],
    shift: false,
    label: 'Nearest key down',
  },
  {
    scope: 'key',
    id: 'nudge-key-left',
    keys: ['ArrowLeft'],
    shift: true,
    label: 'Schematic: nudge selected keys left one grid step',
  },
  {
    scope: 'key',
    id: 'nudge-key-right',
    keys: ['ArrowRight'],
    shift: true,
    label: 'Schematic: nudge selected keys right one grid step',
  },
  {
    scope: 'key',
    id: 'nudge-key-up',
    keys: ['ArrowUp'],
    shift: true,
    label: 'Schematic: nudge selected keys up one grid step',
  },
  {
    scope: 'key',
    id: 'nudge-key-down',
    keys: ['ArrowDown'],
    shift: true,
    label: 'Schematic: nudge selected keys down one grid step',
  },
  { scope: 'key', id: 'focus-first-key', keys: ['Home'], label: 'First key (key 0)' },
  { scope: 'key', id: 'focus-last-key', keys: ['End'], label: 'Last key' },
  // Bindings (spec 004 FR-018); handled by bindings/use-bindings-shortcuts.ts.
  { scope: 'bindings', id: 'copy-binding', code: 'KeyC', keyLabel: 'C', label: 'Copy action' },
  { scope: 'bindings', id: 'paste-binding', code: 'KeyV', keyLabel: 'V', label: 'Paste action' },
  // Cmd on macOS, Ctrl elsewhere; matched by `code` so non-Latin layouts work (002 research R12).
  { scope: 'project', id: 'undo', code: 'KeyZ', keyLabel: 'Z', shift: false, label: 'Undo' },
  { scope: 'project', id: 'redo', code: 'KeyZ', keyLabel: 'Z', shift: true, label: 'Redo' },
  {
    scope: 'project',
    id: 'save-project',
    code: 'KeyS',
    keyLabel: 'S',
    shift: false,
    label: 'Save the project to a file',
  },
  {
    scope: 'project',
    id: 'open-project',
    code: 'KeyO',
    keyLabel: 'O',
    shift: false,
    label: 'Open a project file',
  },
] as const;

export type Shortcut = (typeof SHORTCUTS)[number];
export type ShortcutId = Shortcut['id'];

export type ShortcutInput = {
  readonly code: string;
  readonly key: string;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly isTypingTarget: boolean;
  readonly isDialogOpen: boolean;
  readonly focusedCanvas: CanvasWorkspaceId | undefined;
};

function matchesSingleKey(
  shortcut: Shortcut,
  input: ShortcutInput & { readonly scope: 'canvas' | 'key' },
): boolean {
  if (shortcut.scope !== input.scope) {
    return false;
  }
  const isShiftMatched = !('shift' in shortcut) || shortcut.shift === input.shiftKey;
  const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
  return isShiftMatched && shortcut.keys.some((shortcutKey) => shortcutKey === key);
}

function matchProjectShortcut(input: ShortcutInput): ShortcutId | undefined {
  return SHORTCUTS.find(
    (shortcut) =>
      shortcut.scope === 'project' &&
      shortcut.code === input.code &&
      shortcut.shift === input.shiftKey,
  )?.id;
}

export function matchShortcut(input: ShortcutInput): ShortcutId | undefined {
  if (input.isTypingTarget || input.isDialogOpen) {
    return undefined;
  }
  if (input.ctrlKey || input.metaKey) {
    return input.altKey ? undefined : matchProjectShortcut(input);
  }
  if (input.altKey && input.shiftKey) {
    return SHORTCUTS.find((shortcut) => shortcut.scope === 'global' && shortcut.code === input.code)
      ?.id;
  }
  if (input.focusedCanvas === undefined || input.altKey) {
    return undefined;
  }
  return SHORTCUTS.find((shortcut) => matchesSingleKey(shortcut, { ...input, scope: 'canvas' }))
    ?.id;
}

export function matchKeyShortcut(input: ShortcutInput): ShortcutId | undefined {
  if (
    input.isTypingTarget ||
    input.isDialogOpen ||
    input.ctrlKey ||
    input.metaKey ||
    input.altKey
  ) {
    return undefined;
  }
  return SHORTCUTS.find((shortcut) => matchesSingleKey(shortcut, { ...input, scope: 'key' }))?.id;
}

export type ModifierLabels = {
  readonly altLabel: 'Option' | 'Alt';
  readonly primaryLabel: 'Cmd' | 'Ctrl';
};

// navigator.userAgent is typed; User-Agent Client Hints do not type-check without `as`.
export function formatModifier(userAgent: string): ModifierLabels {
  return /mac/iu.test(userAgent)
    ? { altLabel: 'Option', primaryLabel: 'Cmd' }
    : { altLabel: 'Alt', primaryLabel: 'Ctrl' };
}

// Listed in the help dialog next to SHORTCUTS; `{primary}` becomes Cmd or Ctrl.
export const POINTER_GESTURES = [
  { gesture: '{primary} + wheel', action: 'Zoom around the pointer' },
  { gesture: 'Wheel or trackpad scroll', action: 'Pan' },
  { gesture: 'Middle-button drag', action: 'Pan' },
  { gesture: 'Drag the tools window title', action: 'Move the tools window' },
  { gesture: 'Arrow keys on the tools window title', action: 'Move it 16 px (Shift: 64 px)' },
  { gesture: 'Schematic, Key tool: click', action: 'Place a key' },
  { gesture: '{primary} + Space on a Schematic key', action: 'Toggle key selection' },
  {
    gesture: 'Schematic, Select tool: Shift or {primary} + click a key',
    action: 'Toggle key selection',
  },
  {
    gesture: 'Schematic: selected-layout number fields and Preview / Apply',
    action: 'Resize, rotate or move selected keys in one undo step',
  },
  { gesture: 'Schematic, Select tool: drag a key', action: 'Move the key' },
  { gesture: 'Schematic, Wire tool: click, click…, click a pin or wire', action: 'Draw a wire' },
  { gesture: 'Schematic, Wire tool: double-click', action: 'End the wire with a free end' },
  { gesture: 'Schematic, Select tool: drag a bend handle', action: 'Move a wire bend' },
  { gesture: 'Schematic: click a crossing button', action: 'Insulate or connect the crossing' },
] as const;

const REPEATABLE_SHORTCUT_IDS: ReadonlySet<ShortcutId> = new Set([
  'undo',
  'redo',
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'pan-up',
  'pan-down',
  'pan-left-1u',
  'pan-right-1u',
  'pan-up-1u',
  'pan-down-1u',
  'nudge-key-left',
  'nudge-key-right',
  'nudge-key-up',
  'nudge-key-down',
  'focus-key-left',
  'focus-key-right',
  'focus-key-up',
  'focus-key-down',
]);

// Holding a key repeats pan and zoom; toggles and dialog opens fire once per press.
export function isRepeatableShortcut(shortcutId: ShortcutId): boolean {
  return REPEATABLE_SHORTCUT_IDS.has(shortcutId);
}
