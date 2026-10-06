import type { KeyboardEvent } from 'react';
import { getKeyPinWires } from '../../domain/get-key-pin-wires';
import { formatKeyLabel } from './format-schematic-labels';
import { KeyShape } from './key-shape';
import type { SchematicLayerProps } from './schematic-layer-props';

export function KeysLayer(props: SchematicLayerProps) {
  const { project, selection, activeKeyId, marks, onKeyKeyDown, onKeyFocus } = props;
  // One lookup per render (perf: getKeyPinWires walks every wire for every pin).
  const wiresOf = getKeyPinWires(project);

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
        label={formatKeyLabel(project, { keyIndex, isSelected, problems, wiresOf })}
        onFocus={handleKeyFocus}
        onKeyDown={handleKeyKeyDown}
        schematicKey={key}
      />
    );
  });
}
