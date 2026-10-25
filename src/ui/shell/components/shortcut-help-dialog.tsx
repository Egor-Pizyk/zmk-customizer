import { Dialog, Kbd } from '@ui/components/components';
import { assertNever } from '@domain';
import { POINTER_GESTURES, SHORTCUTS, formatModifier } from '@ui/shortcuts';
import type { ModifierLabels, Shortcut } from '@ui/shortcuts';

type ShortcutHelpDialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

type HelpRow = {
  readonly keys: string;
  readonly action: string;
};

// Rendered from SHORTCUTS, so the list cannot drift from the handlers (SC-008).
export function ShortcutHelpDialog({ isOpen, onClose }: ShortcutHelpDialogProps) {
  const modifiers = formatModifier(navigator.userAgent);
  const rows = getHelpRows(modifiers);
  const gestureRows = POINTER_GESTURES.map((row) => ({
    keys: row.gesture.replace('{primary}', modifiers.primaryLabel),
    action: row.action,
  }));

  function handleClose() {
    onClose();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Keyboard shortcuts">
      <div className="flex max-h-96 flex-col gap-4 overflow-auto">
        <HelpTable caption="Anywhere" rows={rows.global} />
        <HelpTable caption="Project" rows={rows.project} />
        <HelpTable caption="While a canvas has focus" rows={rows.canvas} />
        <HelpTable caption="While a key has focus" rows={rows.key} />
        <HelpTable
          caption="While the Bindings canvas or Keys table has focus"
          rows={rows.bindings}
        />
        <HelpTable
          caption="While the Schematic canvas or Keys table has focus"
          rows={rows.schematic}
        />
        <HelpTable caption="Pointer" rows={gestureRows} />
      </div>
    </Dialog>
  );
}

function formatShortcutKeys(shortcut: Shortcut, { altLabel, primaryLabel }: ModifierLabels) {
  switch (shortcut.scope) {
    case 'global': {
      return `${altLabel}+Shift+${shortcut.keyLabel}`;
    }
    case 'project': {
      return `${primaryLabel}+${shortcut.shift ? 'Shift+' : ''}${shortcut.keyLabel}`;
    }
    case 'schematic':
    case 'bindings': {
      return `${primaryLabel}+${shortcut.keyLabel}`;
    }
    case 'canvas':
    case 'key': {
      const shiftPrefix = 'shift' in shortcut && shortcut.shift ? 'Shift+' : '';
      return `${shiftPrefix}${shortcut.keys.join(' / ')}`;
    }
    default: {
      return assertNever(shortcut);
    }
  }
}

function getHelpRows(modifiers: ModifierLabels) {
  const rows: Record<Shortcut['scope'], HelpRow[]> = {
    global: [],
    project: [],
    canvas: [],
    key: [],
    bindings: [],
    schematic: [],
  };
  for (const shortcut of SHORTCUTS) {
    rows[shortcut.scope].push({
      keys: formatShortcutKeys(shortcut, modifiers),
      action: shortcut.label,
    });
  }
  return rows;
}

type HelpTableProps = {
  readonly caption: string;
  readonly rows: readonly HelpRow[];
};

function HelpTable({ caption, rows }: HelpTableProps) {
  return (
    <table className="w-full text-left">
      <caption className="mb-1 text-left font-medium">{caption}</caption>
      <tbody>
        {rows.map((row) => (
          <tr className="border-t border-border" key={`${row.keys}:${row.action}`}>
            <td className="py-1 pr-3 whitespace-nowrap">
              <Kbd>{row.keys}</Kbd>
            </td>
            <td className="py-1">{row.action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
