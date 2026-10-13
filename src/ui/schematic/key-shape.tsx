import { formatKeyTransform } from '../canvas/format-key-transform';
import type { KeyboardEvent } from 'react';
import type { Key } from '../../domain/types';
import { KeyArt } from './key-art';

type KeyShapeProps = {
  readonly keyIndex: number;
  readonly schematicKey: Key;
  readonly label: string;
  readonly isActive: boolean;
  readonly isSelected: boolean;
  readonly hasConflict: boolean;
  readonly onKeyDown: (keyId: string, event: KeyboardEvent<SVGGElement>) => void;
  readonly onFocus: (keyId: string) => void;
};

// `graphics-symbol` is the WAI-ARIA Graphics role for a focusable picture part; listbox/option
// roles fail jsx-a11y prefer-tag-over-role (003 T003). Pins are drawn in their own layer above
// the wires so they stay clickable (schematic-content.tsx).
export function KeyShape(props: KeyShapeProps) {
  const { keyIndex, schematicKey, label, isActive, isSelected, hasConflict, onKeyDown, onFocus } =
    props;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    onKeyDown(schematicKey.id, event);
  }

  function handleFocus() {
    onFocus(schematicKey.id);
  }

  return (
    <g
      aria-label={label}
      className="group"
      data-conflict={hasConflict || undefined}
      data-key-focus-id={schematicKey.id}
      data-key-id={schematicKey.id}
      data-selected={isSelected || undefined}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      role="graphics-symbol"
      tabIndex={isActive ? 0 : -1}
      transform={formatKeyTransform(schematicKey)}
    >
      <KeyArt hasConflict={hasConflict} keyIndex={keyIndex} schematicKey={schematicKey} />
    </g>
  );
}
