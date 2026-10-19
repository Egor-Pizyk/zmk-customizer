import { useState } from 'react';
import { CUSTOM_BEHAVIOR_TYPES } from '@catalog/bindings';
import { addBehavior } from '@domain/behaviors';
import type { CustomBehavior } from '@domain';
import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { useProject } from '@ui/project/logic';

export function BehaviorCreateForm({ reservedIds }: { readonly reservedIds: readonly string[] }) {
  const { project, commit } = useProject();
  const [kind, setKind] = useState<CustomBehavior['kind']>('hold-tap');
  const [name, setName] = useState('');
  function handleCreate(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    commit(
      (current) => addBehavior(current, { kind, name, reservedIds }),
      `Created behavior ${name}`,
    );
    setName('');
  }
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={handleCreate}>
      <BehaviorTypeChoice
        value={kind}
        onChange={(value) => {
          setKind(value);
        }}
      />
      <NewBehaviorName
        value={name}
        onChange={(value) => {
          setName(value);
        }}
      />
      <button
        className="h-8 rounded-md bg-accent px-3 text-accent-contrast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        disabled={project.behaviors.length >= 128}
        type="submit"
      >
        Create behavior
      </button>
    </form>
  );
}

function BehaviorTypeChoice({
  value: kind,
  onChange: setKind,
}: {
  readonly value: CustomBehavior['kind'];
  readonly onChange: (kind: CustomBehavior['kind']) => void;
}) {
  return (
    <Field
      label="Behavior type"
      renderControl={(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          value={kind}
          onChange={(event) => {
            const entry = CUSTOM_BEHAVIOR_TYPES.find((value) => value.kind === event.target.value);
            if (entry !== undefined) {
              setKind(entry.kind);
            }
          }}
        >
          {CUSTOM_BEHAVIOR_TYPES.map((entry) => (
            <option key={entry.kind} value={entry.kind}>
              {entry.label}
            </option>
          ))}
        </select>
      )}
    />
  );
}

function NewBehaviorName({
  value,
  onChange: handleChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Field
      label="New behavior name"
      renderControl={(props) => (
        <input
          {...props}
          className={INPUT_CLASSES}
          maxLength={160}
          value={value}
          onChange={(event) => {
            handleChange(event.target.value);
          }}
        />
      )}
    />
  );
}
