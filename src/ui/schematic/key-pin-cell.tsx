import type { KeyPin } from '../../domain/types';
import { WarningIcon } from '../components/icons/warning-icon';
import type { WiresOfPin } from './format-schematic-labels';

type KeyPinCellProps = {
  readonly keyIndex: number;
  readonly pin: KeyPin;
  readonly wireIndices: readonly number[];
};

// Focus target of `key-pin-unconnected` (tabIndex -1: reached from the problems panel only).
// `wireIndices` comes from one getKeyPinWires lookup per table render (perf).
export function KeyPinCell({ keyIndex, pin, wireIndices }: KeyPinCellProps) {
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

export function RowPinCells({
  keyId,
  keyIndex,
  wiresOf,
}: {
  readonly keyId: string;
  readonly keyIndex: number;
  readonly wiresOf: WiresOfPin;
}) {
  return (
    <>
      <KeyPinCell keyIndex={keyIndex} pin={1} wireIndices={wiresOf({ keyId, pin: 1 })} />
      <KeyPinCell keyIndex={keyIndex} pin={2} wireIndices={wiresOf({ keyId, pin: 2 })} />
    </>
  );
}
