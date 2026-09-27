import { Dialog } from '../components/dialog';
import { Kbd } from '../components/kbd';
import { POINTER_GESTURES, SHORTCUTS, formatModifier } from '../shortcuts';

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
  const { altLabel, primaryLabel } = formatModifier(navigator.userAgent);
  const globalRows: HelpRow[] = [];
  const canvasRows: HelpRow[] = [];
  for (const shortcut of SHORTCUTS) {
    if (shortcut.scope === 'global') {
      globalRows.push({ keys: `${altLabel}+Shift+${shortcut.keyLabel}`, action: shortcut.label });
    } else {
      const shiftPrefix = 'shift' in shortcut && shortcut.shift ? 'Shift+' : '';
      canvasRows.push({
        keys: `${shiftPrefix}${shortcut.keys.join(' / ')}`,
        action: shortcut.label,
      });
    }
  }
  const gestureRows = POINTER_GESTURES.map((row) => ({
    keys: row.gesture.replace('{primary}', primaryLabel),
    action: row.action,
  }));

  function handleClose() {
    onClose();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Keyboard shortcuts">
      <div className="flex max-h-96 flex-col gap-4 overflow-auto">
        <HelpTable caption="Anywhere" rows={globalRows} />
        <HelpTable caption="While a canvas has focus" rows={canvasRows} />
        <HelpTable caption="Pointer" rows={gestureRows} />
      </div>
    </Dialog>
  );
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
