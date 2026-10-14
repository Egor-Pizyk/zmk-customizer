import { getKeyGeometry } from '@domain/geometry';
import { moveKey, setKeyGeometries } from '@domain/keys';
import type { Key, KeyGeometry } from '@domain';
import { usePreferences } from '@ui/preferences';
import { NumberInput } from '@ui/components/components';
import type { Commit } from '@ui/schematic/interaction';

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
