import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type DraftTextFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly description?: ReactNode;
  /** Joined issue path; the problems panel focuses `[data-issue-path]` (research R14). */
  readonly issuePath: string;
  readonly error?: string | undefined;
  readonly onCommit: (text: string) => void;
};

export function DraftTextField({
  label,
  value,
  placeholder,
  description,
  issuePath,
  error,
  onCommit,
}: DraftTextFieldProps) {
  const draft = useTextDraft(value, onCommit);
  return (
    <Field
      description={description}
      error={error}
      label={label}
      renderControl={(controlProps) => (
        <input
          {...controlProps}
          className={INPUT_CLASSES}
          data-issue-path={issuePath}
          onBlur={draft.handleBlur}
          onChange={draft.handleChange}
          onKeyDown={draft.handleKeyDown}
          placeholder={placeholder}
          type="text"
          value={draft.text}
        />
      )}
    />
  );
}

// Keeps a draft while editing; commits on blur or Enter, Escape restores the value (react.md "Inputs").
function useTextDraft(value: string, onCommit: (text: string) => void) {
  const [draft, setDraft] = useState<string | undefined>();

  function commit() {
    if (draft === undefined) {
      return;
    }
    onCommit(draft);
    setDraft(undefined);
  }

  return {
    text: draft ?? value,
    handleBlur: commit,
    handleChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
    },
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        commit();
      }
      if (event.key === 'Escape') {
        setDraft(undefined);
      }
    },
  };
}
