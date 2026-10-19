import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { addBehaviorTap } from '@domain/behaviors';
import { Button } from '@ui/components/components';
import { BehaviorNumber } from './behavior-number';
import { TapActionRow } from './tap-action-row';

export function TapDanceOptions(props: BehaviorEditorProps) {
  const { behavior, onChange: handleChange } = props;
  if (behavior.kind !== 'tap-dance') {
    return null;
  }
  return (
    <>
      <BehaviorNumber
        property="tappingTermMs"
        value={behavior.tappingTermMs}
        onCommit={(tappingTermMs) => {
          handleChange({ ...behavior, tappingTermMs });
        }}
      />
      {behavior.bindings.map((action, index) => (
        <TapActionRow key={action.id} {...props} actionId={action.id} index={index} />
      ))}
      <Button
        isDisabled={behavior.bindings.length >= 32}
        onClick={() => {
          handleChange(addBehaviorTap(behavior));
        }}
      >
        Add tap action
      </Button>
    </>
  );
}
