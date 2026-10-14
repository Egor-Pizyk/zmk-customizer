import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { INPUT_CLASSES } from '@ui/components/logic';

type NumberInputProps = {
  /** Accessible name, e.g. "Key 3 X (u)"; tables show the column header visually. */
  readonly label: string;
  readonly id?: string;
  readonly shouldCommitUnchanged?: boolean;
  readonly value: number;
  readonly step?: number;
  /** Space-separated issue paths the problems panel may focus (`[data-issue-path~=…]`). */
  readonly issuePath?: string;
  readonly isInvalid?: boolean;
  readonly onCommit: (value: number) => void;
};

// Draft while editing; commits a finite number on blur or Enter, Escape restores (react.md "Inputs").
function useNumberDraft(
  value: number,
  onCommit: (value: number) => void,
  shouldCommitUnchanged: boolean,
) {
  const [draft, setDraft] = useState<string | undefined>();

  function commitDraft() {
    const parsed = Number(draft);
    if (
      draft !== undefined &&
      draft.trim() !== '' &&
      Number.isFinite(parsed) &&
      (parsed !== value || shouldCommitUnchanged)
    ) {
      onCommit(parsed);
    }
    setDraft(undefined);
  }

  return {
    text: draft ?? String(value),
    handleBlur: commitDraft,
    handleChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
    },
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        commitDraft();
      }
      if (event.key === 'Escape') {
        setDraft(undefined);
      }
    },
  };
}

export function NumberInput(props: NumberInputProps) {
  const { label, value, step = 0.25, issuePath, isInvalid = false, onCommit } = props;
  const draft = useNumberDraft(value, onCommit, props.shouldCommitUnchanged ?? false);
  return (
    <input
      id={props.id}
      aria-invalid={isInvalid || undefined}
      aria-label={label}
      className={INPUT_CLASSES}
      data-issue-path={issuePath}
      onBlur={draft.handleBlur}
      onChange={draft.handleChange}
      onKeyDown={draft.handleKeyDown}
      step={step}
      type="number"
      value={draft.text}
    />
  );
}
