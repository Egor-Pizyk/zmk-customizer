import type { ChangeEvent } from 'react';
import { MODIFIER_KEYCODES } from '../../catalog/keycodes';
import { INPUT_CLASSES } from '../components/input-classes';
import { formatKeycodeName } from './format-keycode-name';

type HoldSelectProps = {
  readonly holdKeycode: string | undefined;
  readonly isDisabled: boolean;
  readonly onHoldChange: (holdKeycode: string | undefined) => void;
};

// "When held" turns a key into modifier-on-hold, key-on-tap (spec 004 FR-012).
export function HoldSelect(props: HoldSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onHoldChange(event.target.value === '' ? undefined : event.target.value);
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium">When held</span>
      <select
        className={INPUT_CLASSES}
        disabled={props.isDisabled}
        onChange={handleChange}
        value={props.holdKeycode ?? ''}
      >
        <option value="">Nothing (just the key)</option>
        {MODIFIER_KEYCODES.map((keycode) => (
          <option key={keycode.name} value={keycode.name}>
            {formatKeycodeName(keycode.name)}
          </option>
        ))}
      </select>
    </label>
  );
}
