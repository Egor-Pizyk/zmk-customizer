import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { FirmwareValue } from '@domain/firmware';

export function useFirmwareDraft(
  value: FirmwareValue,
  input: { readonly kind: 'int' | 'string'; readonly onCommit: (value: FirmwareValue) => void },
) {
  const [draft, setDraft] = useState<string | undefined>();
  function commit() {
    if (draft === undefined) {
      return;
    }
    const next = input.kind === 'int' ? Number(draft) : draft;
    if (
      input.kind === 'string' ||
      (draft.trim() !== '' && typeof next === 'number' && Number.isFinite(next))
    ) {
      input.onCommit(next);
    }
    setDraft(undefined);
  }
  return {
    text: draft ?? String(value),
    setDraft,
    commit,
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setDraft(undefined);
      }
    },
  };
}
