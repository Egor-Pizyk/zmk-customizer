import { useId, useState } from 'react';
import { removeWire } from '@domain/wires/editing';
import { getWireProtection, setWireLocked } from '@domain/wires/protection';
import type { Wire } from '@domain';
import { WireLockIcon } from '@ui/components/icons';
import { Button } from '@ui/components/components';
import { focusAfterDelete } from '@ui/schematic/interaction';
import type { PartsTableProps } from './parts-list';

type Props = Pick<PartsTableProps, 'project' | 'commit' | 'onSelectionChange'> & {
  readonly wire: Wire;
  readonly wireIndex: number;
};

export function WireActions(props: Props) {
  const actions = useWireActions(props);
  const { wire, wireIndex } = props;
  const isLocked = wire.locked === true;
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        aria-label={`${isLocked ? 'Unlock' : 'Lock'} wire ${wireIndex}`}
        aria-pressed={isLocked}
        onClick={actions.handleToggle}
        id={actions.lockButtonId}
        data-wire-lock={wire.id}
        size="sm"
      >
        <WireLockIcon isLocked={isLocked} />
        {isLocked ? 'Locked' : 'Unlocked'}
      </Button>
      <Button
        aria-label={`Delete wire ${wireIndex}`}
        data-parts-delete={`wire:${wireIndex}`}
        onClick={actions.handleDelete}
        size="sm"
      >
        Delete
      </Button>
      {actions.guardingIndex === undefined ? undefined : (
        <output>
          <p>{`Wire ${actions.guardingIndex} is locked. Unlock it before changing this connection.`}</p>
          <Button
            aria-label={`Find protecting wire ${actions.guardingIndex}`}
            onClick={actions.handleFind}
            size="sm"
          >
            Find wire
          </Button>
        </output>
      )}
    </div>
  );
}
function useWireActions({ project, wire, wireIndex, commit, onSelectionChange }: Props) {
  const [guardingWireId, setGuardingWireId] = useState<string>();
  const guardingIndex = project.wires.findIndex(
    (entry) => entry.id === guardingWireId && entry.locked === true,
  );
  const lockButtonId = useId();
  const isLocked = wire.locked === true;
  function handleToggle() {
    commit(
      (current) => setWireLocked(current, { wireId: wire.id, isLocked: !isLocked }),
      `${isLocked ? 'Unlocked' : 'Locked'} wire ${wireIndex}`,
    );
    setGuardingWireId(undefined);
  }
  function handleDelete() {
    const guard = getWireProtection(project, { wireIds: [wire.id], includeAttachments: true })[0];
    if (guard !== undefined) {
      setGuardingWireId(guard.wireId);
      return;
    }
    commit((current) => removeWire(current, { wireId: wire.id }), `Deleted wire ${wireIndex}`);
    onSelectionChange();
    focusAfterDelete({ table: 'wire', index: wireIndex });
  }
  function handleFind() {
    if (guardingWireId !== undefined) {
      onSelectionChange({ kind: 'wire', wireId: guardingWireId });
      const buttons = document.querySelectorAll<HTMLButtonElement>('[data-wire-lock]');
      [...buttons].find((button) => button.dataset['wireLock'] === guardingWireId)?.focus();
    }
  }
  return {
    guardingIndex: guardingIndex === -1 ? undefined : guardingIndex,
    lockButtonId,
    handleToggle,
    handleDelete,
    handleFind,
  };
}
