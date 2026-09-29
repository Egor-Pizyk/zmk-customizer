import type { KeyboardEvent } from 'react';
import type { Project } from '../../domain/types';
import { findNearestKey } from '../canvas/find-nearest-key';
import type { Direction } from '../canvas/find-nearest-key';
import { matchKeyShortcut } from '../shortcuts';
import type { ShortcutId } from '../shortcuts';
import { focusKeycap } from './focus-keycap';

type KeycapKeyboardOptions = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly onSelectionChange: (keyIds: readonly string[]) => void;
  readonly onOpenPanel: () => void;
};

const DIRECTION_BY_SHORTCUT: Partial<Record<ShortcutId, Direction>> = {
  'focus-key-left': 'left',
  'focus-key-right': 'right',
  'focus-key-up': 'up',
  'focus-key-down': 'down',
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
  const direction = DIRECTION_BY_SHORTCUT[input.shortcutId];
  return direction === undefined
    ? undefined
    : findNearestKey(project.keys, { fromKeyId: input.keyId, direction })?.id;
}

// Returns false when the key is not one of ours, so the canvas shortcuts (pan, zoom) still run.
function runKey(keyId: string, event: KeyboardEvent<SVGGElement>, options: KeycapKeyboardOptions) {
  const { selectedKeyIds, onSelectionChange } = options;
  if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
    const isSelected = selectedKeyIds.includes(keyId);
    onSelectionChange(
      isSelected ? selectedKeyIds.filter((id) => id !== keyId) : [...selectedKeyIds, keyId],
    );
    return true;
  }
  if (event.key === 'Enter') {
    onSelectionChange(selectedKeyIds.includes(keyId) ? selectedKeyIds : [keyId]);
    options.onOpenPanel();
    return true;
  }
  if (event.key === 'Escape') {
    onSelectionChange([]);
    return true;
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
    focusedCanvas: 'bindings',
  });
  const targetKeyId =
    shortcutId === undefined ? undefined : findTargetKeyId(options.project, { keyId, shortcutId });
  if (targetKeyId === undefined) {
    return false;
  }
  onSelectionChange([targetKeyId]);
  focusKeycap(targetKeyId);
  return true;
}

// Keys of a focused keycap (accessibility.md "Canvas"); no nudge or delete in Bindings (FR-002).
export function createKeycapKeyboardHandler(options: KeycapKeyboardOptions) {
  return (keyId: string, event: KeyboardEvent<SVGGElement>) => {
    if (runKey(keyId, event, options)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
}
