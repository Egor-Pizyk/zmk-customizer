import { DiodeControls } from './diode-controls';
import type { Key, KeyPin, Project } from '@domain';
import { WarningIcon } from '@ui/components';
import type { WiresOfPin } from '../format-schematic-labels';

type KeyPinCellProps = {
  readonly schematicKey: Key;
  readonly commit: (change: (project: Project) => Project) => void;
  readonly keyIndex: number;
  readonly pin: KeyPin;
  readonly wireIndices: readonly number[];
};

// Focus target of `key-pin-unconnected` (tabIndex -1: reached from the problems panel only).
// `wireIndices` comes from one getKeyPinWires lookup per table render (perf).
export function KeyPinCell({ keyIndex, pin, wireIndices, schematicKey, commit }: KeyPinCellProps) {
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
      <DiodeControls commit={commit} keyIndex={keyIndex} pin={pin} schematicKey={schematicKey} />
    </td>
  );
}

export function RowPinCells({
  schematicKey,
  commit,
  keyIndex,
  wiresOf,
}: {
  readonly schematicKey: Key;
  readonly commit: (change: (project: Project) => Project) => void;
  readonly keyIndex: number;
  readonly wiresOf: WiresOfPin;
}) {
  return (
    <>
      <KeyPinCell
        commit={commit}
        schematicKey={schematicKey}
        keyIndex={keyIndex}
        pin={1}
        wireIndices={wiresOf({ keyId: schematicKey.id, pin: 1 })}
      />
      <KeyPinCell
        commit={commit}
        schematicKey={schematicKey}
        keyIndex={keyIndex}
        pin={2}
        wireIndices={wiresOf({ keyId: schematicKey.id, pin: 2 })}
      />
    </>
  );
}
