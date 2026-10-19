import type { Project } from '@domain';
import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

export function LayerChoice({
  label,
  project,
  value,
  onChange: handleChange,
}: {
  readonly label: string;
  readonly project: Project;
  readonly value: string;
  readonly onChange: (id: string) => void;
}) {
  return (
    <Field
      label={label}
      renderControl={(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          value={value}
          onChange={(event) => {
            handleChange(event.target.value);
          }}
        >
          <option value="">Choose layer</option>
          {project.layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      )}
    />
  );
}
