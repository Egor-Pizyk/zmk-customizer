import type { Macro, MacroStep } from '@domain';
import { useProject } from '@ui/project/logic';
import { moveMacroStep, removeMacroStep } from '@domain/advanced-keymap';
import { Button } from '@ui/components/components';

export function MacroStepButtons({
  macro,
  step,
  index,
}: {
  readonly macro: Macro;
  readonly step: MacroStep;
  readonly index: number;
}) {
  const { commit } = useProject();
  function handleRemove() {
    commit((current) => removeMacroStep(current, { macroId: macro.id, stepId: step.id }));
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-macro-summary="${macro.id}"]`)?.focus();
    });
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        isDisabled={index === 0}
        onClick={() => {
          commit((current) =>
            moveMacroStep(current, { macroId: macro.id, stepId: step.id, direction: -1 }),
          );
        }}
      >{`Move step ${index + 1} up`}</Button>
      <Button
        isDisabled={index === macro.steps.length - 1}
        onClick={() => {
          commit((current) =>
            moveMacroStep(current, { macroId: macro.id, stepId: step.id, direction: 1 }),
          );
        }}
      >{`Move step ${index + 1} down`}</Button>
      <Button onClick={handleRemove}>{`Remove step ${index + 1}`}</Button>
    </div>
  );
}
