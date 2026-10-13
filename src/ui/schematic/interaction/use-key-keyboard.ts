import type { KeyboardEvent } from 'react';
import { isKeyPositionFree, moveKeys } from '@domain';
import { getSelectedKeyIds } from './get-selected-key-ids';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import type { Project } from '@domain';
import { matchKeyShortcut } from '@ui/shortcuts';
import type { ShortcutId } from '@ui/shortcuts';
import { findNearestKey } from '@ui/canvas';
import type { Direction } from '@ui/canvas';

type KeyKeyboardOptions = {
  readonly project: Project;
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
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
    if (toggleSelection(options, keyId, event)) {
      return;
    }
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
      nudgeSelection(options, { keyId, nudge });
      return;
    }
    const targetKeyId = findTargetKeyId(options.project, { keyId, shortcutId });
    if (targetKeyId !== undefined) {
      options.onFocusKey(targetKeyId);
    }
  };
}

function toggleSelection(
  options: KeyKeyboardOptions,
  keyId: string,
  event: KeyboardEvent<SVGGElement>,
): boolean {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.code === 'Space') {
    event.preventDefault();
    event.stopPropagation();
    const selected = getSelectedKeyIds(options.selection);
    const keyIds = selected.includes(keyId)
      ? selected.filter((id) => id !== keyId)
      : [...selected, keyId];
    options.onSelectionChange({ kind: 'multi', keyIds, wireIds: [] });
    return true;
  }
  return false;
}

function nudgeSelection(
  options: KeyKeyboardOptions,
  {
    keyId,
    nudge,
  }: { readonly keyId: string; readonly nudge: { readonly dx: number; readonly dy: number } },
) {
  const selected = getSelectedKeyIds(options.selection);
  const keyIds = selected.includes(keyId) ? selected : [keyId];
  const moves = options.project.keys
    .filter((candidate) => keyIds.includes(candidate.id))
    .map((candidate) => ({
      keyId: candidate.id,
      position: {
        xU: candidate.xU + nudge.dx * options.gridSizeU,
        yU: candidate.yU + nudge.dy * options.gridSizeU,
      },
    }));
  if (
    moves.every((move) =>
      isKeyPositionFree(options.project, {
        position: move.position,
        key: options.project.keys.find((candidate) => candidate.id === move.keyId),
        ignoreKeyIds: keyIds,
      }),
    )
  ) {
    options.commit((project) => moveKeys(project, { moves }));
  }
}
