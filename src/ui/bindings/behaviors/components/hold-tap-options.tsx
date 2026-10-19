import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { getHoldTapControls } from '@ui/bindings/behaviors/logic';
import { BehaviorNumber } from './behavior-number';
import { BehaviorFlag } from './behavior-flag';
import { BehaviorSelect } from './behavior-select';
import { HoldTriggerKeys } from './hold-trigger-keys';

export function HoldTapOptions({ behavior, project, onChange: handleChange }: BehaviorEditorProps) {
  if (behavior.kind !== 'hold-tap') {
    return null;
  }
  const controls = getHoldTapControls(behavior, handleChange);
  return (
    <>
      {controls.targets.map((control) => (
        <BehaviorSelect key={control.property} {...control} />
      ))}
      <BehaviorSelect {...controls.flavor} />
      {controls.numbers.map((control) => (
        <BehaviorNumber key={control.property} {...control} />
      ))}
      {controls.flags.map((control) => (
        <BehaviorFlag key={control.property} {...control} />
      ))}
      <HoldTriggerKeys behavior={behavior} project={project} onChange={handleChange} />
    </>
  );
}
