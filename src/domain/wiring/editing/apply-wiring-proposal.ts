import { findWiringProposalFailure } from './find-wiring-proposal-failure';
import type { Project, Result, WiringProposalFailure, WiringProposalResult } from '@domain';

type Input = { readonly base: Project; readonly proposal: WiringProposalResult };

export function applyWiringProposal(
  project: Project,
  { base, proposal }: Input,
): Result<Project, WiringProposalFailure> {
  if (
    project !== base ||
    (proposal.kind === 'changed' && JSON.stringify(project) !== proposal.source)
  ) {
    return {
      ok: false,
      error: {
        code: 'stale',
        message: 'The project changed. Recalculate the wiring preview.',
        wireIds: [],
      },
    };
  }
  if (proposal.kind === 'refused') {
    return { ok: false, error: proposal.failure };
  }
  if (proposal.kind === 'no-change') {
    return { ok: true, value: project };
  }
  const failure = findWiringProposalFailure(project, proposal.candidate);
  return failure === undefined
    ? { ok: true, value: proposal.candidate }
    : { ok: false, error: failure };
}
