import { describe, expect, it } from 'vitest';
import {
  SHORTCUTS,
  formatModifier,
  isRepeatableShortcut,
  matchKeyShortcut,
  matchShortcut,
} from '@ui/shortcuts';
import type { ShortcutInput } from '@ui/shortcuts';

const BASE: ShortcutInput = {
  code: '',
  key: '',
  altKey: false,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  isTypingTarget: false,
  isDialogOpen: false,
  focusedCanvas: undefined,
};

function input(overrides: Partial<ShortcutInput>): ShortcutInput {
  return { ...BASE, ...overrides };
}

const GLOBAL = { altKey: true, shiftKey: true };
const ON_CANVAS = { focusedCanvas: 'schematic' as const };

describe('matchShortcut: global Alt+Shift shortcuts', () => {
  it.each([
    ['Digit1', 'workspace-schematic'],
    ['Digit2', 'workspace-bindings'],
    ['Digit3', 'workspace-firmware'],
    ['Digit4', 'workspace-export'],
    ['Comma', 'open-settings'],
    ['KeyP', 'toggle-issues-panel'],
    ['Slash', 'open-help'],
  ])('matches %s by code', (code, id) => {
    // macOS Option changes `key`, so only `code` may decide.
    expect(matchShortcut(input({ ...GLOBAL, code, key: '¡' }))).toBe(id);
  });

  it('needs both Alt and Shift and no Ctrl/Meta', () => {
    expect(matchShortcut(input({ altKey: true, code: 'Digit2' }))).toBeUndefined();
    expect(matchShortcut(input({ ...GLOBAL, ctrlKey: true, code: 'Digit2' }))).toBeUndefined();
    expect(matchShortcut(input({ ...GLOBAL, metaKey: true, code: 'Digit2' }))).toBeUndefined();
  });

  it('works with and without a focused canvas', () => {
    expect(matchShortcut(input({ ...GLOBAL, ...ON_CANVAS, code: 'Digit3' }))).toBe(
      'workspace-firmware',
    );
  });
});

describe('matchShortcut: canvas single keys', () => {
  it.each([
    ['s', false, 'toggle-snap'],
    ['S', false, 'toggle-snap'],
    ['g', false, 'toggle-grid'],
    ['=', false, 'zoom-in'],
    ['+', true, 'zoom-in'],
    ['-', false, 'zoom-out'],
    ['0', false, 'reset-view'],
    ['?', true, 'open-help'],
    ['ArrowLeft', false, 'pan-left'],
    ['ArrowLeft', true, 'pan-left-1u'],
    ['ArrowDown', false, 'pan-down'],
    ['ArrowRight', true, 'pan-right-1u'],
  ])('matches %s (shift %s) on a focused canvas', (key, shiftKey, id) => {
    expect(matchShortcut(input({ ...ON_CANVAS, key, shiftKey }))).toBe(id);
  });

  it('does nothing without a focused canvas', () => {
    expect(matchShortcut(input({ key: 's' }))).toBeUndefined();
  });

  it('ignores canvas keys with Ctrl, Meta or Alt', () => {
    expect(matchShortcut(input({ ...ON_CANVAS, key: 's', ctrlKey: true }))).toBeUndefined();
    expect(matchShortcut(input({ ...ON_CANVAS, key: 's', metaKey: true }))).toBeUndefined();
    expect(matchShortcut(input({ ...ON_CANVAS, key: 's', altKey: true }))).toBeUndefined();
  });
});

describe('matchShortcut: blocked contexts', () => {
  it('ignores typing targets', () => {
    expect(
      matchShortcut(input({ ...GLOBAL, code: 'Digit1', isTypingTarget: true })),
    ).toBeUndefined();
    expect(matchShortcut(input({ ...ON_CANVAS, key: 's', isTypingTarget: true }))).toBeUndefined();
  });

  it('ignores everything while a dialog is open', () => {
    expect(matchShortcut(input({ ...GLOBAL, code: 'Digit1', isDialogOpen: true }))).toBeUndefined();
  });
});

describe('SHORTCUTS', () => {
  it('has unique ids per scope entry', () => {
    const keys = SHORTCUTS.map((shortcut) => `${shortcut.scope}:${shortcut.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('formatModifier', () => {
  it.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  ])('uses Option and Cmd on macOS', (userAgent) => {
    expect(formatModifier(userAgent)).toEqual({ altLabel: 'Option', primaryLabel: 'Cmd' });
  });

  it.each([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0',
    'Mozilla/5.0 (X11; Linux x86_64) Firefox/127.0',
    '',
  ])('uses Alt and Ctrl elsewhere', (userAgent) => {
    expect(formatModifier(userAgent)).toEqual({ altLabel: 'Alt', primaryLabel: 'Ctrl' });
  });
});

describe('isRepeatableShortcut', () => {
  it('repeats pan and zoom while a key is held', () => {
    expect(isRepeatableShortcut('pan-left')).toBe(true);
    expect(isRepeatableShortcut('pan-down-1u')).toBe(true);
    expect(isRepeatableShortcut('zoom-in')).toBe(true);
  });

  it('does not repeat toggles and dialog opens', () => {
    expect(isRepeatableShortcut('toggle-snap')).toBe(false);
    expect(isRepeatableShortcut('toggle-issues-panel')).toBe(false);
    expect(isRepeatableShortcut('open-settings')).toBe(false);
  });
});

describe('matchShortcut: project shortcuts (primary modifier)', () => {
  it.each([
    [{ metaKey: true, code: 'KeyZ', key: 'я' }, 'undo'],
    [{ ctrlKey: true, code: 'KeyZ', key: 'z' }, 'undo'],
    [{ ctrlKey: true, shiftKey: true, code: 'KeyZ', key: 'Z' }, 'redo'],
    [{ metaKey: true, code: 'KeyS', key: 's' }, 'save-project'],
    [{ metaKey: true, code: 'KeyO', key: 'o' }, 'open-project'],
  ])('matches %o by code', (overrides, id) => {
    expect(matchShortcut(input(overrides))).toBe(id);
  });

  it('does not match with Alt, in text fields or while a dialog is open', () => {
    expect(matchShortcut(input({ metaKey: true, altKey: true, code: 'KeyZ' }))).toBeUndefined();
    expect(
      matchShortcut(input({ metaKey: true, code: 'KeyZ', isTypingTarget: true })),
    ).toBeUndefined();
    expect(
      matchShortcut(input({ metaKey: true, code: 'KeyS', isDialogOpen: true })),
    ).toBeUndefined();
  });

  it('needs the primary modifier', () => {
    expect(matchShortcut(input({ ...ON_CANVAS, code: 'KeyZ', key: 'z' }))).toBeUndefined();
  });

  it('keeps other Ctrl combinations for the browser', () => {
    expect(matchShortcut(input({ ctrlKey: true, code: 'KeyP', key: 'p' }))).toBeUndefined();
    expect(matchShortcut(input({ metaKey: true, shiftKey: true, code: 'KeyS' }))).toBeUndefined();
  });

  it('repeats undo and redo only', () => {
    expect(isRepeatableShortcut('undo')).toBe(true);
    expect(isRepeatableShortcut('redo')).toBe(true);
    expect(isRepeatableShortcut('save-project')).toBe(false);
    expect(isRepeatableShortcut('open-project')).toBe(false);
  });
});

describe('matchShortcut: Schematic tools and editing (spec 003)', () => {
  it.each([
    ['v', 'select-tool'],
    ['k', 'add-key-tool'],
    ['W', 'wire-tool'],
    ['Enter', 'place-key'],
    ['Delete', 'delete-selection'],
    ['Backspace', 'delete-selection'],
    ['Escape', 'cancel'],
  ])('matches %s on a focused canvas', (key, id) => {
    expect(matchShortcut(input({ ...ON_CANVAS, key }))).toBe(id);
  });
});

describe('matchKeyShortcut: while a key has focus', () => {
  it.each([
    [{ key: 'ArrowLeft' }, 'focus-key-left'],
    [{ key: 'ArrowDown' }, 'focus-key-down'],
    [{ key: 'ArrowRight', shiftKey: true }, 'nudge-key-right'],
    [{ key: 'ArrowUp', shiftKey: true }, 'nudge-key-up'],
    [{ key: 'Home' }, 'focus-first-key'],
    [{ key: 'End' }, 'focus-last-key'],
  ])('matches %o', (overrides, id) => {
    expect(matchKeyShortcut(input({ ...ON_CANVAS, ...overrides }))).toBe(id);
  });

  it('leaves everything else to the canvas', () => {
    expect(matchKeyShortcut(input({ ...ON_CANVAS, key: 'Delete' }))).toBeUndefined();
    expect(
      matchKeyShortcut(input({ ...ON_CANVAS, key: 'ArrowLeft', altKey: true })),
    ).toBeUndefined();
    expect(
      matchKeyShortcut(input({ ...ON_CANVAS, key: 'Home', isTypingTarget: true })),
    ).toBeUndefined();
  });
});
