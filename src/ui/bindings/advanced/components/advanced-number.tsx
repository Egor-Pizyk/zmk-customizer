import { AdvancedField } from './advanced-field';
import type { AdvancedProperty } from './advanced-field';
import { INPUT_CLASSES } from '@ui/components/logic';
import { useFieldDraft } from '@ui/bindings/behaviors/logic';

export function AdvancedNumber({
  property,
  value,
  onCommit,
}: {
  readonly property: AdvancedProperty;
  readonly value: number;
  readonly onCommit: (value: number) => void;
}) {
  const draft = useFieldDraft(String(value), (text) => {
    if (text.trim() !== '' && Number.isFinite(Number(text))) {
      onCommit(Number(text));
    }
  });
  return (
    <AdvancedField property={property}>
      {(props) => (
        <input
          {...props}
          {...draft}
          className={INPUT_CLASSES}
          type="number"
          min={property === 'timeoutMs' ? 1 : 0}
          max={5000}
          step={1}
        />
      )}
    </AdvancedField>
  );
}
