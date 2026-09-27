import { Dialog } from '../components/dialog';
import { Kbd } from '../components/kbd';
import { assertNever } from '../../domain/assert-never';
import { POINTER_GESTURES, SHORTCUTS, formatModifier } from '../shortcuts';
import type { ModifierLabels, Shortcut } from '../shortcuts';

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
        <HelpTable caption="Pointer" rows={gestureRows} />
      </div>
    </Dialog>
  );
}

function getHelpRows({ altLabel, primaryLabel }: ModifierLabels) {
  const rows: Record<Shortcut['scope'], HelpRow[]> = { global: [], project: [], canvas: [] };
  for (const shortcut of SHORTCUTS) {
    switch (shortcut.scope) {
      case 'global': {
        rows.global.push({
          keys: `${altLabel}+Shift+${shortcut.keyLabel}`,
          action: shortcut.label,
        });
        break;
      }
      case 'project': {
        const shiftPrefix = shortcut.shift ? 'Shift+' : '';
        const keys = `${primaryLabel}+${shiftPrefix}${shortcut.keyLabel}`;
        rows.project.push({ keys, action: shortcut.label });
        break;
      }
      case 'canvas': {
        const shiftPrefix = 'shift' in shortcut && shortcut.shift ? 'Shift+' : '';
        const keys = `${shiftPrefix}${shortcut.keys.join(' / ')}`;
        rows.canvas.push({ keys, action: shortcut.label });
        break;
      }
      default: {
        assertNever(shortcut);
      }
    }
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
