import type { ActionEditorProps } from '@ui/bindings/behaviors/logic';
import { ActionBehaviorChoice } from './action-behavior-choice';
import { StrokeActionParameters } from './stroke-action-parameters';
import { ReferenceActionParameters } from './reference-action-parameters';
import { LayerChoice } from './layer-choice';
import { ActionCommands } from './action-commands';

export function BehaviorAction(props: ActionEditorProps) {
  const { label, binding, project, onChange: handleChange } = props;
  return (
    <fieldset className="flex min-w-0 flex-col gap-2 rounded-md border border-border p-2">
      <legend>{label}</legend>
      <ActionBehaviorChoice {...props} />
      <StrokeActionParameters {...props} />
      {'layerId' in binding ? (
        <LayerChoice
          label={`${label} layer`}
          project={project}
          value={binding.layerId}
          onChange={(layerId) => {
            handleChange({ ...binding, layerId });
          }}
        />
      ) : undefined}
      <ReferenceActionParameters {...props} />
      <ActionCommands {...props} />
    </fieldset>
  );
}
