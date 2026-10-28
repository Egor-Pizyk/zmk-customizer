import type { WiringEdit } from '@domain/wiring/editing';
import type { Project, WiringProposalResult } from '@domain';
import type { Commit } from '@ui/schematic/interaction';
import { useProject } from '@ui/project/logic';
import { useEffect, useState } from 'react';
import { createWiringWorkerSession } from './wiring-worker-session';
import { getWiringPreviewPhase, STALE_WIRING_MESSAGE } from './wiring-preview-state';
import type { WiringPreviewDraft } from './wiring-preview-state';
import {
  startWiringPreview,
  createWiringPreviewDraft,
  recalculateWiringPreview,
} from './start-wiring-preview';
import { applyWiringPreview } from './apply-wiring-preview';

export function useWiringPreview(project: Project, commit: Commit, onStart: () => void) {
  const { importSession, announce } = useProject();
  const [draft, setDraft] = useState<WiringPreviewDraft>();
  const [session, setSession] = useState(createWiringWorkerSession);
  useWorkerCleanup(session);
  const phase = getWiringPreviewPhase(draft, project, importSession.getRevision());
  const state = { session, setDraft, getRevision: importSession.getRevision };
  function handleEdit(edit: WiringEdit) {
    session.captureFocus(document.activeElement);
    onStart();
    const next = createWiringPreviewDraft({ project, draft, edit }, state);
    setDraft(next);
    startWiringPreview(next, state);
  }
  function handleCancel() {
    session.cancel();
    setDraft(undefined);
    session.restoreFocus();
    setSession(createWiringWorkerSession());
  }
  return {
    ...describePreview(project, draft, phase),
    handleEdit,
    handleCancel,
    handleRecalculate: () => {
      recalculateWiringPreview(draft, project, state);
    },
    handleApply: () => {
      applyWiringPreview(draft, { ...state, commit, announce });
    },
  };
}

function describePreview(
  project: Project,
  draft: WiringPreviewDraft | undefined,
  phase: ReturnType<typeof getWiringPreviewPhase>,
) {
  const result = draft?.result;
  return {
    phase,
    operationDescription: describeOperation(draft?.edit, getPreviewProject(project, draft)),
    hasPreview: draft !== undefined,
    canApply: phase === 'ready' && result?.kind === 'changed',
    previewProject: getPreviewProject(project, draft),
    protectedWireIds: result?.kind === 'refused' ? result.failure.wireIds : [],
    summary: result !== undefined && result.kind !== 'refused' ? result.summary : undefined,
    failure: getFailure(phase, result),
    message: getMessage(phase, result, draft),
  };
}

function getFailure(phase: string, result: WiringProposalResult | undefined) {
  if (phase === 'stale') {
    return STALE_WIRING_MESSAGE;
  }
  return result?.kind === 'refused' ? result.failure.message : undefined;
}
function getMessage(
  phase: string,
  result: WiringProposalResult | undefined,
  draft: WiringPreviewDraft | undefined,
) {
  if (phase === 'calculating') {
    return 'Calculating wiring…';
  }
  if (
    result?.kind === 'no-change' &&
    draft?.edit.kind === 'prettify' &&
    draft.base.wires.length === 0
  ) {
    return 'No wires to prettify. Generate or draw wiring first.';
  }
  return result?.kind === 'no-change' ? 'No wiring changes needed.' : undefined;
}

function getPreviewProject(project: Project, draft: WiringPreviewDraft | undefined) {
  if (draft?.result?.kind === 'changed') {
    return draft.result.candidate;
  }
  if (draft?.result?.kind === 'no-change') {
    return draft.base;
  }
  return draft?.source ?? project;
}

function useWorkerCleanup(session: ReturnType<typeof createWiringWorkerSession>) {
  useEffect(
    () => () => {
      session.cancel();
    },
    [session],
  );
}

function describeOperation(edit: WiringEdit | undefined, project: Project): string | undefined {
  if (edit?.kind === 'prettify') {
    return 'Prettify existing wiring';
  }
  if (edit?.kind !== 'regenerate') {
    return undefined;
  }
  if (project.wiring?.kind === 'direct') {
    return 'Generate direct wiring · Whole schematic';
  }
  const style =
    edit.input.settings.matrixStyle === 'symmetric-bus'
      ? 'Symmetric matrix buses'
      : 'Existing matrix routes';
  const scope = edit.input.scope;
  if (scope.kind === 'half') {
    return `Generate ${style} · ${scope.half} half`;
  }
  return `Generate ${style} · ${scope.kind === 'all' ? 'Whole schematic' : 'Selected keys and nets'}`;
}
