import { editWiring, getWiringProposalSummary } from '@domain/wiring/editing';
import type { WiringEdit } from '@domain/wiring/editing';
import type { Project, Result } from '@domain';
import type { Commit } from '@ui/schematic/interaction';
import { useState } from 'react';

type Draft = { readonly base: Project; readonly preview: Project };
function getDraftResult(project: Project, result: Result<Project, string>): Draft | undefined {
  return result.ok && result.value !== project
    ? { base: project, preview: result.value }
    : undefined;
}

export function useWiringPreview(project: Project, commit: Commit, onStart: () => void) {
  const [draft, setDraft] = useState<Draft>();
  const feedback = useWiringFeedback();
  const hasPreview = draft?.base === project;
  if (draft !== undefined && !hasPreview) {
    setDraft(undefined);
  }
  const previewProject = hasPreview ? draft.preview : project;
  function handleEdit(input: WiringEdit) {
    onStart();
    const result = editWiring(previewProject, input);
    feedback.report(result, { project, kind: input.kind });
    setDraft(getDraftResult(project, result));
  }
  function handleCancel() {
    setDraft(undefined);
    feedback.clear();
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
  const summary = hasPreview ? getWiringProposalSummary(project, previewProject) : undefined;
  return {
    hasPreview,
    previewProject,
    failure: feedback.failure,
    message: feedback.message,
    summary,
    handleEdit,
    handleCancel,
    handleApply,
  };
}

function useWiringFeedback() {
  const [failure, setFailure] = useState<string>();
  const [message, setMessage] = useState<string>();
  function report(
    result: Result<Project, string>,
    input: { readonly project: Project; readonly kind: WiringEdit['kind'] },
  ) {
    setFailure(result.ok ? undefined : result.error);
    setMessage(
      result.ok && result.value === input.project && input.kind === 'complete'
        ? 'No wiring changes needed.'
        : undefined,
    );
  }
  function clear() {
    setFailure(undefined);
    setMessage(undefined);
  }
  return { failure, message, report, clear };
}
