import type { KeyboardEvent } from 'react';
import { formatKeyLabel } from './format-schematic-labels';
import { KeyShape } from './key-shape';
import type { SchematicLayerProps } from './schematic-layer-props';

export function KeysLayer(props: SchematicLayerProps) {
  const { project, selection, activeKeyId, marks, onKeyKeyDown, onKeyFocus } = props;

  function handleKeyKeyDown(keyId: string, event: KeyboardEvent<SVGGElement>) {
    onKeyKeyDown(keyId, event);
  }

  function handleKeyFocus(keyId: string) {
    onKeyFocus(keyId);
  }

  return project.keys.map((key, keyIndex) => {
    const isSelected =
      (selection?.kind === 'key' && selection.keyId === key.id) ||
      (selection?.kind === 'multi' && selection.keyIds.includes(key.id));
    const problems = marks.problemsByKeyIndex.get(keyIndex) ?? [];
    return (
      <KeyShape
        hasConflict={problems.length > 0}
        isActive={key.id === activeKeyId}
        isSelected={isSelected}
        key={key.id}
        keyIndex={keyIndex}
        label={formatKeyLabel(project, { keyIndex, isSelected, problems })}
        onFocus={handleKeyFocus}
        onKeyDown={handleKeyKeyDown}
        schematicKey={key}
      />
    );
  });
}
