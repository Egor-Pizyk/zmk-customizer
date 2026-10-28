import type { Project } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';
import { getWiringEditSource } from './wiring-preview-state';
import { startWiringWorker } from './wiring-worker-transport';
import type { WiringWorkerReply } from './wiring-worker-protocol';
import type { WiringPreviewDraft, WiringPreviewState } from './wiring-preview-state';

export function startWiringPreview(draft: WiringPreviewDraft, state: WiringPreviewState) {
  const task = startWiringWorker(
    {
      request: draft.request,
      revision: draft.revision,
      project: draft.base,
      edits: draft.edits,
    },
    {
      onReply: (reply) => {
        receiveReply(draft, reply, state);
      },
      onFailure: (message) => {
        if (state.session.isCurrent(draft.request)) {
          state.setDraft((current) =>
            current?.request === draft.request
              ? {
                  ...current,
                  phase: 'refused',
                  result: { kind: 'refused', failure: { code: 'operation', message, wireIds: [] } },
                }
              : current,
          );
        }
      },
    },
  );
  state.session.attach(draft.request, task);
}

function receiveReply(
  draft: WiringPreviewDraft,
  reply: WiringWorkerReply,
  state: WiringPreviewState,
) {
  if (
    !state.session.isCurrent(draft.request) ||
    reply.request !== draft.request ||
    reply.revision !== draft.revision
  ) {
    return;
  }
  state.setDraft((current) => {
    if (current?.request !== draft.request) {
      return current;
    }
    if (state.getRevision() !== draft.revision) {
      return { ...current, phase: 'stale' };
    }
    const phase = reply.result.kind === 'refused' ? 'refused' : 'ready';
    return { ...current, phase, result: reply.result };
  });
}

export function createWiringPreviewDraft(
  input: {
    readonly project: Project;
    readonly draft: WiringPreviewDraft | undefined;
    readonly edit: WiringEdit;
  },
  state: WiringPreviewState,
): WiringPreviewDraft {
  const source = getWiringEditSource(input.project, input.draft, input.edit);
  return {
    base: input.project,
    source,
    request: state.session.begin(),
    revision: state.getRevision(),
    edit: input.edit,
    edits:
      input.edit.kind === 'prettify' ? [input.edit] : [...(input.draft?.edits ?? []), input.edit],
    phase: 'calculating',
    ...(input.edit.kind === 'topology' ? { topologySource: source } : {}),
  };
}

export function recalculateWiringPreview(
  draft: WiringPreviewDraft | undefined,
  project: Project,
  state: WiringPreviewState,
) {
  if (draft === undefined) {
    return;
  }
  const next: WiringPreviewDraft = {
    base: project,
    source: project,
    request: state.session.begin(),
    revision: state.getRevision(),
    edit: draft.edit,
    edits: draft.edits,
    phase: 'calculating',
  };
  state.setDraft(next);
  startWiringPreview(next, state);
}
