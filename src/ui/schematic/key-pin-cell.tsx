import { getKeyPinWires } from '../../domain/get-key-pin-wires';
import type { KeyPin, Project } from '../../domain/types';
import { WarningIcon } from '../components/icons/warning-icon';

type KeyPinCellProps = {
  readonly project: Project;
  readonly keyIndex: number;
  readonly keyId: string;
  readonly pin: KeyPin;
};

// Focus target of `key-pin-unconnected` (tabIndex -1: reached from the problems panel only).
export function KeyPinCell({ project, keyIndex, keyId, pin }: KeyPinCellProps) {
  const wireIndices = getKeyPinWires(project)({ keyId, pin });
  return (
    <td className="pr-2">
      <span data-issue-path={`keys.${keyIndex}.pins.${pin}`} tabIndex={-1}>
        {wireIndices.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-danger">
            <WarningIcon />
            Not connected
          </span>
        ) : (
          wireIndices.map((wireIndex) => `wire ${wireIndex}`).join(', ')
        )}
      </span>
    </td>
  );
}
