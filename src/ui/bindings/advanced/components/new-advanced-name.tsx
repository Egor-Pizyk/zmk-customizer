import { useState } from 'react';
import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type NewAdvancedNameProps = {
  readonly kind: string;
  readonly onCreate: (name: string) => void;
  readonly isDisabled: boolean;
};
export function NewAdvancedName({ kind, onCreate, isDisabled }: NewAdvancedNameProps) {
  const [name, setName] = useState('');
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onCreate(name);
        setName('');
      }}
    >
      <Field
        label={`New ${kind} name`}
        renderControl={(props) => (
          <input
            {...props}
            className={INPUT_CLASSES}
            maxLength={160}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        )}
      />
      <button
        className="h-8 rounded-md bg-accent px-3 text-accent-contrast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        disabled={isDisabled}
        type="submit"
      >{`Create ${kind}`}</button>
    </form>
  );
}
