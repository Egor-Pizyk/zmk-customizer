import { BEHAVIORS } from '@catalog/bindings';
import { createActionBinding } from '@domain/behaviors';
import type { ActionEditorProps } from '@ui/bindings/behaviors/logic';
import { Field, DocsLink } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

export function ActionBehaviorChoice({
  label,
  binding,
  project,
  onChange: handleChange,
}: ActionEditorProps) {
  const value = findActionValue(binding);
  const entry = BEHAVIORS.find((behavior) => behavior.id === binding.kind);
  return (
    <Field
      label={`${label} behavior`}
      description={
        entry === undefined ? undefined : (
          <>
            {entry.description} <DocsLink href={entry.docsUrl} topic={entry.label} />
          </>
        )
      }
      renderControl={(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          value={value}
          onChange={(event) => {
            handleChange(createActionBinding(project, event.target.value));
          }}
        >
          <ActionChoices project={project} />
        </select>
      )}
    />
  );
}

function ActionChoices({ project }: Pick<ActionEditorProps, 'project'>) {
  return (
    <>
      {BEHAVIORS.filter(
        (behavior) => behavior.id !== 'tap_dance' && behavior.id !== 'mod_morph',
      ).map((behavior) => (
        <option key={behavior.id} value={behavior.id}>
          {behavior.label}
        </option>
      ))}
      {project.macros.map((macro) => (
        <option key={macro.id} value={macro.id}>
          {macro.name}
        </option>
      ))}
      {project.behaviors.map((behavior) => (
        <option key={behavior.id} value={behavior.id}>
          {behavior.name}
        </option>
      ))}
    </>
  );
}

function findActionValue(binding: ActionEditorProps['binding']): string {
  if (binding.kind === 'macro') {
    return binding.macroId;
  }
  return binding.kind === 'custom' ? binding.behaviorId : binding.kind;
}
