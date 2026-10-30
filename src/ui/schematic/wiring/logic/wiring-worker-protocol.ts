import type { Project, WiringProposalResult } from '@domain';
import type { WiringEdit } from '@domain/wiring/editing';

export type WiringWorkerRequest = {
  readonly request: number;
  readonly revision: number;
  readonly project: Project;
  readonly edits: readonly WiringEdit[];
};

export type WiringWorkerReply = {
  readonly request: number;
  readonly revision: number;
  readonly result: WiringProposalResult;
};
