import type { KeyboardEvent } from 'react';
import { isKeyPositionFree } from '../../domain/is-key-position-free';
import { moveKey } from '../../domain/move-key';
import type { Project } from '../../domain/types';
import { matchKeyShortcut } from '../shortcuts';
import type { ShortcutId } from '../shortcuts';
import { findNearestKey } from '../canvas/find-nearest-key';
import type { Direction } from '../canvas/find-nearest-key';

type KeyKeyboardOptions = {
  readonly project: Project;
  readonly gridSizeU: number;
  readonly commit: (change: (project: Project) => Project) => void;
  readonly onFocusKey: (keyId: string) => void;
};

const FOCUS_BY_SHORTCUT: Partial<Record<ShortcutId, Direction>> = {
  'focus-key-left': 'left',
  'focus-key-right': 'right',
  'focus-key-up': 'up',
  'focus-key-down': 'down',
};

const NUDGE_BY_SHORTCUT: Partial<Record<ShortcutId, { readonly dx: number; readonly dy: number }>> =
  {
    'nudge-key-left': { dx: -1, dy: 0 },
    'nudge-key-right': { dx: 1, dy: 0 },
    'nudge-key-up': { dx: 0, dy: -1 },
    'nudge-key-down': { dx: 0, dy: 1 },
  };

function findTargetKeyId(
  project: Project,
  input: { readonly keyId: string; readonly shortcutId: ShortcutId },
) {
  if (input.shortcutId === 'focus-first-key') {
    return project.keys[0]?.id;
  }
  if (input.shortcutId === 'focus-last-key') {
    return project.keys.at(-1)?.id;
  }
  const direction = FOCUS_BY_SHORTCUT[input.shortcutId];
  return direction === undefined
    ? undefined
    : findNearestKey(project.keys, { fromKeyId: input.keyId, direction })?.id;
}

// Keys of a focused key (accessibility.md "Canvas"): arrows move focus, Shift+arrows nudge by the
// grid step, Home/End jump. Handled here and stopped so the canvas pan shortcuts do not also run.
export function createKeyKeyboardHandler(options: KeyKeyboardOptions) {
  return (keyId: string, event: KeyboardEvent<SVGGElement>) => {
    const shortcutId = matchKeyShortcut({
      code: event.code,
      key: event.key,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      isTypingTarget: false,
      isDialogOpen: false,
      focusedCanvas: 'schematic',
    });
    if (shortcutId === undefined) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const nudge = NUDGE_BY_SHORTCUT[shortcutId];
    const key = options.project.keys.find((candidate) => candidate.id === keyId);
    if (nudge !== undefined && key !== undefined) {
      const position = {
        xU: key.xU + nudge.dx * options.gridSizeU,
        yU: key.yU + nudge.dy * options.gridSizeU,
      };
      if (isKeyPositionFree(options.project, { position, ignoreKeyId: keyId })) {
        options.commit((project) => moveKey(project, { keyId, position }));
      }
      return;
    }
    const targetKeyId = findTargetKeyId(options.project, { keyId, shortcutId });
    if (targetKeyId !== undefined) {
      options.onFocusKey(targetKeyId);
    }
  };
}
