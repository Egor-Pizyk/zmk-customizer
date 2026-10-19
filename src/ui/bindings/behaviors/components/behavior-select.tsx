import { BehaviorField } from './behavior-field';
import type { Property } from './behavior-field';
import { INPUT_CLASSES } from '@ui/components/logic';

export function BehaviorSelect<Value extends string>({
  property,
  value,
  choices,
  onCommit,
}: {
  readonly property: Property;
  readonly value: Value;
  readonly choices: readonly Value[];
  readonly onCommit: (value: Value) => void;
}) {
  return (
    <BehaviorField property={property}>
      {(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          value={value}
          onChange={(event) => {
            const selected = choices.find((choice) => choice === event.target.value);
            if (selected !== undefined) {
              onCommit(selected);
            }
          }}
        >
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      )}
    </BehaviorField>
  );
}
