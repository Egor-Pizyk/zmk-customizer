import { moveKey } from '../../domain/move-key';
import type { Key, WirePoint } from '../../domain/types';
import { NumberInput } from '../components/number-input';
import type { Commit } from './pointer-types';

type KeyPositionCellsProps = {
  readonly schematicKey: Key;
  readonly keyIndex: number;
  readonly hasProblem: boolean;
  readonly commit: Commit;
};

// No free-cell check here: an overlap shows as `key-overlap` on the row (003 I5, totality).
export function KeyPositionCells({
  schematicKey,
  keyIndex,
  hasProblem,
  commit,
}: KeyPositionCellsProps) {
  function commitPosition(position: WirePoint) {
    commit((current) => moveKey(current, { keyId: schematicKey.id, position }));
  }

  function handleXCommit(xU: number) {
    commitPosition({ xU, yU: schematicKey.yU });
  }

  function handleYCommit(yU: number) {
    commitPosition({ xU: schematicKey.xU, yU });
  }

  return (
    <>
      <td className="pr-2">
        <NumberInput
          isInvalid={hasProblem}
          issuePath={`keys.${keyIndex}`}
          label={`Key ${keyIndex} X (u)`}
          onCommit={handleXCommit}
          value={schematicKey.xU}
        />
      </td>
      <td className="pr-2">
        <NumberInput
          label={`Key ${keyIndex} Y (u)`}
          onCommit={handleYCommit}
          value={schematicKey.yU}
        />
      </td>
    </>
  );
}
