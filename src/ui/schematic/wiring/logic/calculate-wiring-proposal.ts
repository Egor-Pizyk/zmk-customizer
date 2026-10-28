import { editWiring, prepareWiringProposal } from '@domain/wiring/editing';
import type { Project, Result } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';
import type { WiringWorkerRequest, WiringWorkerReply } from './wiring-worker-protocol';

export function calculateWiringProposal(input: WiringWorkerRequest): WiringWorkerReply {
  return {
    request: input.request,
    revision: input.revision,
    result: prepareWiringProposal(input.project, replayEdits(input.project, input.edits)),
  };
}

function replayEdits(project: Project, edits: readonly WiringEdit[]): Result<Project, string> {
  let current = project;
  let topologySource: Project | undefined;
  for (const edit of edits) {
    const source = edit.kind === 'topology' ? (topologySource ?? current) : current;
    topologySource = edit.kind === 'topology' ? source : undefined;
    const result = editWiring(source, edit);
    if (!result.ok) {
      return result;
    }
    current = result.value;
  }
  return { ok: true, value: current };
}
