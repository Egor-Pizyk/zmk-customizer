import { createWiringProposal } from '@domain/wiring/editing';
import type { WiringWorkerRequest, WiringWorkerReply } from './wiring-worker-protocol';

export function calculateWiringProposal(input: WiringWorkerRequest): WiringWorkerReply {
  return {
    request: input.request,
    revision: input.revision,
    result: createWiringProposal(input.project, input.edits),
  };
}
