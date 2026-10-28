import type { Project, WiringProposalResult } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';
import type { Dispatch, SetStateAction } from 'react';
import type { createWiringWorkerSession } from './wiring-worker-session';

export type WiringPreviewDraft = {
  readonly base: Project;
  readonly source: Project;
  readonly topologySource?: Project;
  readonly request: number;
  readonly revision: number;
  readonly edit: WiringEdit;
  readonly edits: readonly WiringEdit[];
  readonly phase: 'calculating' | 'ready' | 'stale' | 'refused';
  readonly result?: WiringProposalResult;
};

export type WiringPreviewState = {
  readonly session: ReturnType<typeof createWiringWorkerSession>;
  readonly getRevision: () => number;
  readonly setDraft: Dispatch<SetStateAction<WiringPreviewDraft | undefined>>;
};

export const STALE_WIRING_MESSAGE = 'The project changed. Recalculate the wiring preview.';

export function getWiringPreviewPhase(
  draft: WiringPreviewDraft | undefined,
  project: Project,
  revision: number,
) {
  if (draft === undefined) {
    return 'idle';
  }
  return draft.base !== project || draft.revision !== revision ? 'stale' : draft.phase;
}

export function getWiringEditSource(
  project: Project,
  draft: WiringPreviewDraft | undefined,
  input: WiringEdit,
) {
  if (draft === undefined) {
    return project;
  }
  if (input.kind === 'topology') {
    return draft.topologySource ?? draft.source;
  }
  return draft.result?.kind === 'changed' ? draft.result.candidate : draft.source;
}
