import { useState } from 'react';
import type { KeyboardEvent } from 'react';

export function useFieldDraft(value: string, onCommit: (value: string) => void) {
  const [draft, setDraft] = useState<string | undefined>();
  function handleCommit() {
    if (draft !== undefined && draft !== value) {
      onCommit(draft);
    }
    setDraft(undefined);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCommit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(undefined);
    }
  }
  return {
    value: draft ?? value,
    onChange: (event: { readonly target: { readonly value: string } }) => {
      setDraft(event.target.value);
    },
    onBlur: handleCommit,
    onKeyDown: handleKeyDown,
  };
}
