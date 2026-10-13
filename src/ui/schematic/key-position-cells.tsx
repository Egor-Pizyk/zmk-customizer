import { getKeyGeometry } from '../../domain/get-key-geometry';
import { moveKey } from '../../domain/move-key';
import { setKeyGeometries } from '../../domain/set-key-geometries';
import type { Key, KeyGeometry } from '../../domain/types';
import { usePreferences } from '../preferences-context';
import { NumberInput } from '../components/number-input';
import type { Commit } from './pointer-types';

const FIELDS = [
  { field: 'xU', label: 'X (u)' },
  { field: 'yU', label: 'Y (u)' },
  { field: 'widthU', label: 'Width (u)' },
  { field: 'heightU', label: 'Height (u)' },
  { field: 'rotationDeg', label: 'Rotation (°)' },
  { field: 'rotationOriginXU', label: 'Origin X (u)' },
  { field: 'rotationOriginYU', label: 'Origin Y (u)' },
] as const;

type KeyPositionCellsProps = {
  readonly schematicKey: Key;
  readonly keyIndex: number;
  readonly hasProblem: boolean;
  readonly commit: Commit;
};

export function KeyPositionCells({
  schematicKey,
  keyIndex,
  hasProblem,
  commit,
}: KeyPositionCellsProps) {
  const { gridSizeU } = usePreferences().preferences;
  const geometry = getKeyGeometry(schematicKey);
  function handleCommit(field: keyof KeyGeometry, value: number) {
    commit((current) =>
      field === 'xU' || field === 'yU'
        ? moveKey(current, {
            keyId: schematicKey.id,
            position: { xU: schematicKey.xU, yU: schematicKey.yU, [field]: value },
          })
        : setKeyGeometries(current, {
            changes: [{ keyId: schematicKey.id, geometry: { [field]: value } }],
          }),
    );
  }
  return FIELDS.map(({ field, label }) => (
    <td className="pr-2" key={field}>
      <NumberInput
        isInvalid={hasProblem}
        issuePath={`keys.${keyIndex}`}
        label={`Key ${keyIndex} ${label}`}
        onCommit={(value) => {
          handleCommit(field, value);
        }}
        step={field === 'rotationDeg' ? 1 : gridSizeU}
        value={geometry[field]}
      />
    </td>
  ));
}
