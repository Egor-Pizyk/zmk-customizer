import { getProjectResourceError } from '@domain/project';
import { validateWireProtection } from '@domain/wires/protection';
import type { Project, WiringProposalFailure } from '@domain';

export function findWiringProposalFailure(
  base: Project,
  candidate: Project,
): WiringProposalFailure | undefined {
  const resourceError = getProjectResourceError(candidate);
  if (resourceError !== undefined) {
    return { code: 'resources', message: resourceError, wireIds: [] };
  }
  const issues = validateWireProtection(base, candidate);
  const first = issues[0];
  return first === undefined
    ? undefined
    : {
        code: 'locked',
        message: first.message,
        wireIds: base.wires
          .filter((_, index) => issues.some((issue) => issue.path[1] === index))
          .map((wire) => wire.id),
      };
}
