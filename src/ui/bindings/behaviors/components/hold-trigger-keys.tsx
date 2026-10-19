import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { INPUT_CLASSES } from '@ui/components/logic';
import { BehaviorField } from './behavior-field';

export function HoldTriggerKeys({
  behavior,
  project,
  onChange: handleChange,
}: BehaviorEditorProps) {
  if (behavior.kind !== 'hold-tap') {
    return null;
  }
  return (
    <BehaviorField property="triggerKeyIds">
      {(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          multiple
          value={[...behavior.triggerKeyIds]}
          onChange={(event) => {
            handleChange({
              ...behavior,
              triggerKeyIds: Array.from(event.target.selectedOptions, (option) => option.value),
            });
          }}
        >
          {project.keys.map((key, index) => (
            <option key={key.id} value={key.id}>{`Key ${index}`}</option>
          ))}
        </select>
      )}
    </BehaviorField>
  );
}
