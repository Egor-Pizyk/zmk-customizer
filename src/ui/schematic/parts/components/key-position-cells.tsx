import { getKeyGeometry } from '@domain/geometry';
import { editLayout, moveKey, setKeyGeometries } from '@domain/keys';
import type { Key, KeyGeometry } from '@domain';
import { usePreferences } from '@ui/preferences';
import { NumberInput } from '@ui/components/components';
import type { Commit } from '@ui/schematic/interaction';

const FIELDS = [
  { field: 'xU', label: 'X (u)' },
  { field: 'yU', label: 'Y (u)' },
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
  return FIELDS.map(({ field, label }) => (
    <td className="pr-2" key={field}>
      <NumberInput
        isInvalid={hasProblem}
        issuePath={`keys.${keyIndex}`}
        label={`Key ${keyIndex} ${label}`}
        onCommit={(value) => {
          commitPosition(commit, { schematicKey, field, value });
        }}
        step={field === 'rotationDeg' ? 1 : gridSizeU}
        value={geometry[field]}
      />
    </td>
  ));
}

function commitPosition(
  commit: Commit,
  input: { readonly schematicKey: Key; readonly field: keyof KeyGeometry; readonly value: number },
) {
  const { schematicKey, field, value } = input;
  commit((current) => {
    if (field === 'xU' || field === 'yU') {
      return moveKey(current, {
        keyId: schematicKey.id,
        position: { xU: schematicKey.xU, yU: schematicKey.yU, [field]: value },
      });
    }
    if (field === 'rotationDeg') {
      return editLayout(current, {
        keyIds: [schematicKey.id],
        offset: { xU: 0, yU: 0 },
        geometry: { rotationDeg: value },
      });
    }
    return setKeyGeometries(current, {
      changes: [{ keyId: schematicKey.id, geometry: { [field]: value } }],
    });
  });
}
