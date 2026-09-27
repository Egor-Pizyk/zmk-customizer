import { useEffect, useEffectEvent } from 'react';
import type { CanvasWorkspaceId, Preferences } from '../storage/preferences';
import { surfaceCenter } from './canvas/surface-center';
import { usePreferences } from './preferences-context';
import { assertNever } from '../domain/assert-never';
import { useProject } from './project-context';
import { getShortcutAction } from './shortcut-actions';
import type { ShortcutAction } from './shortcut-actions';
import { isRepeatableShortcut, matchShortcut } from './shortcuts';
import type { ShortcutInput } from './shortcuts';
import { isCanvasWorkspaceId } from './workspaces';

type ShortcutDialogs = {
  readonly handleSettingsOpen: () => void;
  readonly handleHelpOpen: () => void;
  readonly handleOpenDialogOpen: () => void;
};

// Radios, checkboxes and buttons keep shortcuts working; only text entry blocks them (FR-039).
const NON_TEXT_INPUT_TYPES: ReadonlySet<string> = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function isTypingTarget(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(target.type);
  }
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function findCanvas(target: EventTarget | null): SVGElement | undefined {
  const canvas = target instanceof Element ? target.closest('[data-canvas-workspace]') : null;
  return canvas instanceof SVGElement ? canvas : undefined;
}

function canvasIdOf(canvas: SVGElement | undefined): CanvasWorkspaceId | undefined {
  const id = canvas?.dataset['canvasWorkspace'] ?? '';
  return isCanvasWorkspaceId(id) ? id : undefined;
}

function shortcutInputFrom(
  event: KeyboardEvent,
  focusedCanvas: CanvasWorkspaceId | undefined,
): ShortcutInput {
  return {
    code: event.code,
    key: event.key,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    isTypingTarget: isTypingTarget(event.target),
    isDialogOpen: document.querySelector('dialog[open]') !== null,
    focusedCanvas,
  };
}

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
