import { createBehaviorBinding, setBehaviorParameter } from '@domain/behaviors';
import type { ActionEditorProps } from '@ui/bindings/behaviors/logic';
import { Button } from '@ui/components/components';
import { StrokeChoice } from './stroke-choice';
import { LayerChoice } from './layer-choice';

export function ReferenceActionParameters({
  label,
  binding,
  project,
  onChange: handleChange,
}: ActionEditorProps) {
  if (binding.kind !== 'custom') {
    return null;
  }
  return (
    <>
      {binding.parameters.map((_parameter, index) => (
        <ReferenceParameter
          key={index === 0 ? 'first' : 'second'}
          label={label}
          project={project}
          binding={binding}
          parameterIndex={index}
          onChange={handleChange}
        />
      ))}
      <Button
        onClick={() => {
          handleChange(createBehaviorBinding(project, binding.behaviorId));
        }}
      >
        Reset parameters to match definition
      </Button>
    </>
  );
}

type ReferenceProps = ActionEditorProps & { readonly parameterIndex: number };
function ReferenceParameter(props: ReferenceProps) {
  const { label, binding, project, parameterIndex, onChange: handleChange } = props;
  if (binding.kind !== 'custom') {
    return null;
  }
  const parameter = binding.parameters[parameterIndex];
  if (parameter === undefined) {
    return null;
  }
  const replace = (value: (typeof binding.parameters)[number]) => {
    handleChange(setBehaviorParameter(binding, { index: parameterIndex, parameter: value }));
  };
  const name = `${label} parameter ${parameterIndex + 1}`;
  if (parameter.kind === 'key') {
    return (
      <StrokeChoice
        label={name}
        stroke={parameter.key}
        onChange={(key) => {
          replace({ ...parameter, key });
        }}
      />
    );
  }
  if (parameter.kind === 'layer') {
    return (
      <LayerChoice
        label={name}
        project={project}
        value={parameter.layerId}
        onChange={(layerId) => {
          replace({ ...parameter, layerId });
        }}
      />
    );
  }
  return null;
}
