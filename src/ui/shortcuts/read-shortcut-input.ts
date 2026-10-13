import type { CanvasWorkspaceId } from '@storage/preferences';
import { isCanvasWorkspaceId } from '@ui/navigation';
import type { ShortcutInput } from './shortcuts';

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

export function findCanvas(target: EventTarget | null): SVGElement | undefined {
  const canvas = target instanceof Element ? target.closest('[data-canvas-workspace]') : null;
  return canvas instanceof SVGElement ? canvas : undefined;
}

export function canvasIdOf(canvas: SVGElement | undefined): CanvasWorkspaceId | undefined {
  const id = canvas?.dataset['canvasWorkspace'] ?? '';
  return isCanvasWorkspaceId(id) ? id : undefined;
}

export function readShortcutInput(event: KeyboardEvent): ShortcutInput {
  return shortcutInputFrom(event, canvasIdOf(findCanvas(event.target)));
}

export function shortcutInputFrom(
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
