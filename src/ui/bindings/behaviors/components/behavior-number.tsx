import { BehaviorField } from './behavior-field';
import type { Property } from './behavior-field';
import { INPUT_CLASSES } from '@ui/components/logic';
import { useFieldDraft } from '@ui/bindings/behaviors/logic';

export function BehaviorNumber({
  property,
  value,
  onCommit,
}: {
  readonly property: Property;
  readonly value: number;
  readonly onCommit: (value: number) => void;
}) {
  const draft = useFieldDraft(String(value), (text) => {
    if (text.trim() !== '' && Number.isFinite(Number(text))) {
      onCommit(Number(text));
    }
  });
  return (
    <BehaviorField property={property}>
      {(props) => (
        <input
          {...props}
          {...draft}
          className={INPUT_CLASSES}
          max={5000}
          min={property === 'quickTapMs' || property === 'requirePriorIdleMs' ? -1 : 0}
          step={1}
          type="number"
        />
      )}
    </BehaviorField>
  );
}
