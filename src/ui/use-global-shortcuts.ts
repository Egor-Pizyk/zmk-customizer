import { useEffect, useEffectEvent } from 'react';
import type { CanvasWorkspaceId } from '../storage/preferences';
import { surfaceCenter } from './canvas/surface-center';
import { usePreferences } from './preferences-context';
import { getShortcutAction } from './shortcut-actions';
import { isRepeatableShortcut, matchShortcut } from './shortcuts';
import type { ShortcutInput } from './shortcuts';
import { isCanvasWorkspaceId } from './workspaces';

type ShortcutDialogs = {
  readonly handleSettingsOpen: () => void;
  readonly handleHelpOpen: () => void;
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

// One keydown listener for Alt+Shift globals and canvas-scoped single keys (research R9).
export function useGlobalShortcuts(dialogs: ShortcutDialogs) {
  const { preferences, changePreferences } = usePreferences();
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
    if (action.kind === 'change-preferences') {
      changePreferences(action.changes);
    } else if (action.kind === 'open-settings') {
      dialogs.handleSettingsOpen();
    } else {
      dialogs.handleHelpOpen();
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
