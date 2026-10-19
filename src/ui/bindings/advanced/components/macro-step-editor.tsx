import type { Macro, MacroStep } from '@domain';
import { useProject } from '@ui/project/logic';
import { replaceMacroStep } from '@domain/advanced-keymap';
import { BehaviorAction } from '@ui/bindings/behaviors/components';
import { AdvancedNumber } from './advanced-number';
import { MacroStepKind } from './macro-step-kind';
import { MacroStepButtons } from './macro-step-buttons';

export function MacroStepEditor({
  macro,
  step,
  index,
}: {
  readonly macro: Macro;
  readonly step: MacroStep;
  readonly index: number;
}) {
  const { project, commit } = useProject();
  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-border p-2">
      <legend>{`Step ${index + 1}`}</legend>
      <MacroStepKind macro={macro} step={step} index={index} />
      {step.kind === 'wait' ? (
        <AdvancedNumber
          property="durationMs"
          value={step.durationMs}
          onCommit={(durationMs) => {
            commit((current) =>
              replaceMacroStep(current, { macroId: macro.id, step: { ...step, durationMs } }),
            );
          }}
        />
      ) : (
        <BehaviorAction
          label={`Step ${index + 1} action`}
          project={project}
          binding={step.binding}
          onChange={(binding) => {
            commit((current) =>
              replaceMacroStep(current, { macroId: macro.id, step: { ...step, binding } }),
            );
          }}
        />
      )}
      <MacroStepButtons macro={macro} step={step} index={index} />
    </fieldset>
  );
}
