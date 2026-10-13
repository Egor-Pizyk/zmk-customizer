import { SHORTCUTS, readShortcutInput } from '@ui/shortcuts';
import { useEffect, useEffectEvent } from 'react';

type BindingsShortcutHandlers = {
  readonly onCopy: () => void;
  readonly onPaste: () => void;
};

function isInBindingsTable(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-bindings-table]'));
}

// Mod+C / Mod+V on the Bindings canvas or Keys table; in a text field the native copy and
// paste win (accessibility.md checklist 6, spec 004 R12).
export function useBindingsShortcuts(handlers: BindingsShortcutHandlers) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const input = readShortcutInput(event);
    const isModOnly = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
    const isInScope = input.focusedCanvas === 'bindings' || isInBindingsTable(event.target);
    if (!isModOnly || !isInScope || input.isTypingTarget || input.isDialogOpen || event.repeat) {
      return;
    }
    const shortcut = SHORTCUTS.find(
      (candidate) => candidate.scope === 'bindings' && candidate.code === event.code,
    );
    if (shortcut === undefined) {
      return;
    }
    event.preventDefault();
    if (shortcut.id === 'copy-binding') {
      handlers.onCopy();
      return;
    }
    handlers.onPaste();
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
