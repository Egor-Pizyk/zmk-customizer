import { editWiring } from '@domain/wiring/editing';
import type { WiringEdit } from '@domain/wiring/editing';
import type { Project } from '@domain';
import type { Commit } from '@ui/schematic/interaction';
import { useState } from 'react';

export function useWiringPreview(project: Project, commit: Commit, onStart: () => void) {
  const [draft, setDraft] = useState<{ readonly base: Project; readonly preview: Project }>();
  const [failure, setFailure] = useState<string>();
  const hasPreview = draft?.base === project;
  if (draft !== undefined && !hasPreview) {
    setDraft(undefined);
  }
  const previewProject = hasPreview ? draft.preview : project;
  function handleEdit(input: WiringEdit) {
    onStart();
    const result = editWiring(previewProject, input);
    if (!result.ok) {
      setFailure(result.error);
      return;
    }
    setFailure(undefined);
    setDraft(result.value === project ? undefined : { base: project, preview: result.value });
  }
  function handleCancel() {
    setDraft(undefined);
    setFailure(undefined);
  }
  function handleApply() {
    if (hasPreview) {
      commit(
        (current) => (current === draft.base ? draft.preview : current),
        'Applied wiring. Undo',
      );
    }
    handleCancel();
  }
  return { hasPreview, previewProject, failure, handleEdit, handleCancel, handleApply };
}
