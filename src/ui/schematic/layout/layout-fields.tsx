import { useId } from 'react';
import { getKeyGeometry } from '@domain';
import type { LayoutEdit, Key } from '@domain';
import { NumberInput } from '@ui/components';
import { usePreferences } from '@ui/preferences';

const FIELDS = [
  { field: 'widthU', label: 'Selected width (u)' },
  { field: 'heightU', label: 'Selected height (u)' },
  { field: 'rotationDeg', label: 'Selected rotation (°)' },
  { field: 'rotationOriginXU', label: 'Selected origin X (u)' },
  { field: 'rotationOriginYU', label: 'Selected origin Y (u)' },
] as const;

type LayoutFieldsProps = {
  readonly edit: LayoutEdit;
  readonly schematicKey: Key;
  readonly onEditChange: (edit: LayoutEdit) => void;
};

export function LayoutFields({ edit, schematicKey, onEditChange }: LayoutFieldsProps) {
  const { gridSizeU } = usePreferences().preferences;
  const geometry = getKeyGeometry(schematicKey);
  return (
    <div className="flex flex-wrap gap-2">
      {FIELDS.map(({ field, label }) => (
        <LayoutNumber
          label={label}
          key={field}
          onCommit={(value) => {
            onEditChange({ ...edit, geometry: { ...edit.geometry, [field]: value } });
          }}
          step={field === 'rotationDeg' ? 1 : gridSizeU}
          value={edit.geometry[field] ?? geometry[field]}
        />
      ))}
      {(['xU', 'yU'] as const).map((field) => (
        <LayoutNumber
          key={field}
          label={`Move ${field === 'xU' ? 'X' : 'Y'} (u)`}
          onCommit={(value) => {
            onEditChange({ ...edit, offset: { ...edit.offset, [field]: value } });
          }}
          step={gridSizeU}
          value={edit.offset[field]}
        />
      ))}
    </div>
  );
}

function LayoutNumber(props: {
  readonly label: string;
  readonly value: number;
  readonly step: number;
  readonly onCommit: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex w-36 flex-col gap-1 text-xs">
      <label htmlFor={id}>{props.label}</label>
      <NumberInput {...props} id={id} shouldCommitUnchanged />
    </div>
  );
}
