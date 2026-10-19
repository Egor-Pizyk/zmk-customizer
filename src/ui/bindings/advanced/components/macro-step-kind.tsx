import { MACRO_STEP_KINDS } from '@catalog/bindings';
import type { Macro, MacroStep } from '@domain';
import { useProject } from '@ui/project/logic';
import { setMacroStepKind } from '@domain/advanced-keymap';
import { INPUT_CLASSES } from '@ui/components/logic';
import { AdvancedField } from './advanced-field';

export function MacroStepKind({
  macro,
  step,
  index,
}: {
  readonly macro: Macro;
  readonly step: MacroStep;
  readonly index: number;
}) {
  const { commit } = useProject();
  return (
    <AdvancedField property="stepKind">
      {(props) => (
        <select
          {...props}
          aria-label={`Step ${index + 1} kind`}
          className={INPUT_CLASSES}
          value={step.kind}
          onChange={(event) => {
            const kind = MACRO_STEP_KINDS.find((value) => value === event.target.value);
            if (kind !== undefined) {
              commit((current) =>
                setMacroStepKind(current, { macroId: macro.id, stepId: step.id, kind }),
              );
            }
          }}
        >
          {MACRO_STEP_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      )}
    </AdvancedField>
  );
}
