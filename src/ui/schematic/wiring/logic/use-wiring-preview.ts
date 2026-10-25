import { editWiring, getWiringProposalSummary } from '@domain/wiring/editing';
import type { WiringEdit } from '@domain/wiring/editing';
import type { Project, Result } from '@domain';
import type { Commit } from '@ui/schematic/interaction';
import { useState } from 'react';

type Draft = {
  readonly base: Project;
  readonly preview: Project;
  readonly topologySource?: Project;
};

function getDraftResult(
  project: Project,
  {
    result,
    source,
    input,
  }: {
    readonly result: Result<Project, string>;
    readonly source: Project;
    readonly input: WiringEdit;
  },
): Draft | undefined {
  if (!result.ok || result.value === project) {
    return undefined;
  }
  return {
    base: project,
    preview: result.value,
    ...(input.kind === 'topology' ? { topologySource: source } : {}),
  };
}

function getEditSource(preview: Project, input: WiringEdit, draft: Draft | undefined): Project {
  return input.kind === 'topology' ? (draft?.topologySource ?? preview) : preview;
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
    const source = getEditSource(previewProject, input, hasPreview ? draft : undefined);
    const result = editWiring(source, input);
    feedback.report(result, { project, kind: input.kind });
    setDraft(getDraftResult(project, { result, source, input }));
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
