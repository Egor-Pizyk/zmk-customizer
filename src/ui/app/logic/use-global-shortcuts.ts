import {
  isRepeatableShortcut,
  matchShortcut,
  findCanvas,
  canvasIdOf,
  shortcutInputFrom,
} from '@ui/shortcuts';
import { useEffect, useEffectEvent } from 'react';
import type { Preferences } from '@storage/preferences';
import { surfaceCenter } from '@ui/canvas/logic';
import { usePreferences } from '@ui/preferences';
import { assertNever } from '@domain';
import { useProject } from '@ui/project/logic';
import { getShortcutAction } from './shortcut-actions';
import type { ShortcutAction } from './shortcut-actions';

type ShortcutDialogs = {
  readonly handleSettingsOpen: () => void;
  readonly handleHelpOpen: () => void;
  readonly handleOpenDialogOpen: () => void;
};

type ShortcutHandlers = {
  readonly changePreferences: (changes: Partial<Preferences>) => void;
  readonly dialogs: ShortcutDialogs;
  readonly project: {
    readonly undo: () => void;
    readonly redo: () => void;
    readonly saveProjectFile: () => void;
  };
};

function runShortcutAction(action: ShortcutAction, handlers: ShortcutHandlers) {
  const { changePreferences, dialogs, project } = handlers;
  switch (action.kind) {
    case 'change-preferences': {
      changePreferences(action.changes);
      return;
    }
    case 'open-settings': {
      dialogs.handleSettingsOpen();
      return;
    }
    case 'open-help': {
      dialogs.handleHelpOpen();
      return;
    }
    case 'undo': {
      project.undo();
      return;
    }
    case 'redo': {
      project.redo();
      return;
    }
    case 'save-project': {
      project.saveProjectFile();
      return;
    }
    case 'open-project': {
      dialogs.handleOpenDialogOpen();
      return;
    }
    default: {
      assertNever(action);
    }
  }
}

// One keydown listener for Alt+Shift globals and canvas-scoped single keys (research R9).
export function useGlobalShortcuts(dialogs: ShortcutDialogs) {
  const { preferences, changePreferences } = usePreferences();
  const project = useProject();
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const canvas = findCanvas(event.target);
    const focusedCanvas = canvasIdOf(canvas);
    const matchedId = matchShortcut(shortcutInputFrom(event, focusedCanvas));
    const shortcutId =
      matchedId !== undefined && event.repeat && !isRepeatableShortcut(matchedId)
        ? undefined
        : matchedId;
    const action =
      shortcutId === undefined
        ? undefined
        : getShortcutAction(shortcutId, {
            preferences,
            focusedCanvas,
            surfaceCenter: surfaceCenter(canvas ?? null),
          });
    if (action === undefined) {
      return;
    }
    event.preventDefault();
    runShortcutAction(action, { changePreferences, dialogs, project });
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
