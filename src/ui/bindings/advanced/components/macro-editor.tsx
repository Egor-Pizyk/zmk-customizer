import type { Macro } from '@domain';
import { useProject } from '@ui/project/logic';
import { replaceMacro, removeMacro, addMacroStep } from '@domain/advanced-keymap';
import { Button } from '@ui/components/components';
import { AdvancedName } from './advanced-name';
import { AdvancedNumber } from './advanced-number';
import { MacroStepEditor } from './macro-step-editor';

export function MacroEditor({ macro, index }: { readonly macro: Macro; readonly index: number }) {
  const { commit } = useProject();
  return (
    <details className="rounded-md border border-border p-2">
      <summary
        className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus"
        data-macro-summary={macro.id}
      >{`Macro: ${macro.name || macro.id}`}</summary>
      <div className="flex flex-col gap-3 p-2">
        <AdvancedName
          label="Macro name"
          value={macro.name}
          collection="macros"
          index={index}
          onCommit={(name) => {
            commit((current) => replaceMacro(current, { ...macro, name }));
          }}
        />
        {(['waitMs', 'tapMs'] as const).map((property) => (
          <AdvancedNumber
            key={property}
            property={property}
            value={macro[property]}
            onCommit={(value) => {
              commit((current) => replaceMacro(current, { ...macro, [property]: value }));
            }}
          />
        ))}
        {macro.steps.map((step, stepIndex) => (
          <MacroStepEditor key={step.id} macro={macro} step={step} index={stepIndex} />
        ))}
        <MacroButtons macro={macro} />
      </div>
    </details>
  );
}

function MacroButtons({ macro }: { readonly macro: Macro }) {
  const { commit } = useProject();
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(['tap', 'wait'] as const).map((kind) => (
          <Button
            key={kind}
            isDisabled={macro.steps.length >= 64}
            onClick={() => {
              commit((current) => addMacroStep(current, { macroId: macro.id, kind }));
            }}
          >
            {kind === 'wait' ? 'Add pause' : 'Add action step'}
          </Button>
        ))}
      </div>
      <Button
        variant="danger"
        onClick={() => {
          commit(
            (current) => removeMacro(current, macro.id),
            `Deleted macro ${macro.name}. Undo to restore it.`,
          );
        }}
      >{`Delete macro ${macro.name}`}</Button>
    </>
  );
}
