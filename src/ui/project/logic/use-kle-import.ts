import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { replaceProjectLayout } from '@domain/project';
import type { Project } from '@domain';
import { readKleFile } from '@storage/kle';
import type { KleLayout } from '@storage/kle';
import { useProject } from './project-context';
import type { createImportSession } from './import-session';

type ImportToken = ReturnType<ReturnType<typeof createImportSession>['begin']>;
type Review = {
  readonly base: Project;
  readonly layout: KleLayout;
  readonly token: ImportToken;
};
type ImportState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'reading'; readonly token: ImportToken }
  | { readonly kind: 'error'; readonly error: string }
  | { readonly kind: 'review'; readonly review: Review };

export function useKleImport(inputId: string) {
  const { project, commit, importSession } = useProject();
  const [state, setState] = useState<ImportState>({ kind: 'idle' });
  const review = state.kind === 'review' ? state.review : undefined;
  const error = state.kind === 'error' ? state.error : undefined;
  const isReading = state.kind === 'reading';
  const isStale = review !== undefined && importSession.status(review.token) !== 'current';
  function handleFileChange(file: File) {
    return readReview(file, { base: project, session: importSession, onChange: setState });
  }
  function handleCancel() {
    importSession.begin();
    setState({ kind: 'idle' });
    document.querySelector<HTMLElement>(`[id="${inputId}"]`)?.focus();
  }
  function handleApply() {
    if (review === undefined || importSession.status(review.token) !== 'current') {
      return false;
    }
    commit(
      (latest) =>
        latest === review.base ? replaceProjectLayout(latest, review.layout.geometries) : latest,
      `Imported ${review.layout.geometries.length} KLE keys. Configure wiring and actions before exporting firmware. Undo restores the previous project.`,
    );
    setState({ kind: 'idle' });
    document.querySelector<HTMLElement>(`[id="${inputId}"]`)?.focus();
    return true;
  }
  return { review, error, isReading, isStale, handleFileChange, handleCancel, handleApply };
}

async function readReview(
  file: File,
  input: {
    readonly base: Project;
    readonly session: ReturnType<typeof createImportSession>;
    readonly onChange: Dispatch<SetStateAction<ImportState>>;
  },
) {
  const token = input.session.begin();
  input.onChange({ kind: 'reading', token });
  const result = await readKleFile(file);
  if (input.session.status(token) === 'superseded') {
    input.onChange((current) =>
      current.kind === 'reading' && current.token === token ? { kind: 'idle' } : current,
    );
    return;
  }
  if (input.session.status(token) === 'changed') {
    input.onChange({
      kind: 'error',
      error: 'KLE import cancelled because the project changed. Choose the file again.',
    });
    return;
  }
  input.onChange(
    result.ok
      ? { kind: 'review', review: { base: input.base, layout: result.value, token } }
      : { kind: 'error', error: result.error },
  );
}
