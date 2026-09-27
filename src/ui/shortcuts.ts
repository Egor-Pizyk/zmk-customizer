import type { CanvasWorkspaceId } from '../storage/preferences';

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

function matchesCanvasKey(shortcut: Shortcut, input: ShortcutInput): boolean {
  if (shortcut.scope !== 'canvas') {
    return false;
  }
  const isShiftMatched = !('shift' in shortcut) || shortcut.shift === input.shiftKey;
  const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
  return isShiftMatched && shortcut.keys.some((shortcutKey) => shortcutKey === key);
}

export function matchShortcut(input: ShortcutInput): ShortcutId | undefined {
  if (input.isTypingTarget || input.isDialogOpen || input.ctrlKey || input.metaKey) {
    return undefined;
  }
  if (input.altKey && input.shiftKey) {
    return SHORTCUTS.find((shortcut) => shortcut.scope === 'global' && shortcut.code === input.code)
      ?.id;
  }
  if (input.focusedCanvas === undefined || input.altKey) {
    return undefined;
  }
  return SHORTCUTS.find((shortcut) => matchesCanvasKey(shortcut, input))?.id;
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
] as const;

const REPEATABLE_SHORTCUT_IDS: ReadonlySet<ShortcutId> = new Set([
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
]);

// Holding a key repeats pan and zoom; toggles and dialog opens fire once per press.
export function isRepeatableShortcut(shortcutId: ShortcutId): boolean {
  return REPEATABLE_SHORTCUT_IDS.has(shortcutId);
}
