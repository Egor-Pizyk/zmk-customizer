import { getWireProtection } from '@domain/wires/protection';
import { getSelectedKeyIds } from '@ui/schematic/interaction';
import { Button } from '@ui/components/components';
import type { PartsTableProps } from './parts-list';

type Props = Pick<PartsTableProps, 'project' | 'selection' | 'onSelectionChange'>;

export function SelectionProtectionNotice({ project, selection, onSelectionChange }: Props) {
  const keyIds = getSelectedKeyIds(selection, { project });
  const encoderIds = selection?.kind === 'encoder' ? [selection.encoderId] : [];
  if (keyIds.length === 0 && encoderIds.length === 0) {
    return null;
  }
  return getWireProtection(project, { keyIds, encoderIds }).map(({ wireId }) => {
    const index = project.wires.findIndex((wire) => wire.id === wireId);
    function handleFind() {
      onSelectionChange({ kind: 'wire', wireId });
      const controls = document.querySelectorAll<HTMLButtonElement>('[data-wire-lock]');
      [...controls].find((control) => control.dataset['wireLock'] === wireId)?.focus();
    }
    return (
      <div className="flex flex-wrap items-center gap-2" key={wireId}>
        <p>{`Selection contains a connection protected by wire ${index}. Unlock it before editing the group.`}</p>
        <Button aria-label={`Find protecting wire ${index}`} onClick={handleFind} size="sm">
          Find wire
        </Button>
      </div>
    );
  });
}
