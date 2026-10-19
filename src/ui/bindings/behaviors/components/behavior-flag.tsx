import { BehaviorField } from './behavior-field';
import type { Property } from './behavior-field';

export function BehaviorFlag({
  property,
  value,
  onCommit,
}: {
  readonly property: Property;
  readonly value: boolean;
  readonly onCommit: (value: boolean) => void;
}) {
  return (
    <BehaviorField property={property}>
      {(props) => (
        <input
          {...props}
          checked={value}
          className="size-5 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onChange={(event) => {
            onCommit(event.target.checked);
          }}
          type="checkbox"
        />
      )}
    </BehaviorField>
  );
}
