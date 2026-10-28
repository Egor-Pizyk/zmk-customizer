import type {
  Project,
  Result,
  WiringProposalFailure,
  WiringProposalResult,
  WiringProposalSummary,
} from '@domain';
import { editWiring } from './edit-wiring';
import type { WiringEdit } from './wiring-edit';
import { prepareWiringProposal } from './prepare-wiring-proposal';
import { regenerateWiring } from './regenerate-wiring';

type Calculation = {
  readonly project: Project;
  readonly warnings: WiringProposalSummary['warnings'];
};

/** Trusted typed intent is replayed against one captured Project; no candidate is committed here. */
export function createWiringProposal(
  base: Project,
  edits: readonly WiringEdit[],
): WiringProposalResult {
  const calculation = replay(base, edits);
  if (!calculation.ok) {
    return { kind: 'refused', failure: calculation.error };
  }
  const result = prepareWiringProposal(base, { ok: true, value: calculation.value.project });
  return result.kind === 'refused'
    ? result
    : { ...result, summary: { ...result.summary, warnings: currentWarnings(calculation.value) } };
}

function replay(
  base: Project,
  edits: readonly WiringEdit[],
): Result<Calculation, WiringProposalFailure> {
  let current = base;
  let topologySource: Project | undefined;
  const warnings: WiringProposalSummary['warnings'][number][] = [];
  for (const edit of edits) {
    const source = edit.kind === 'topology' ? (topologySource ?? current) : current;
    topologySource = edit.kind === 'topology' ? source : undefined;
    if (edit.kind === 'regenerate') {
      const result = regenerateWiring(source, { ...edit.input, board: edit.board });
      if (!result.ok) {
        return result;
      }
      current = result.value.project;
      warnings.push(...result.value.warnings);
      continue;
    }
    const result = editWiring(source, edit);
    if (!result.ok) {
      return { ok: false, error: { code: 'operation', message: result.error, wireIds: [] } };
    }
    current = result.value;
  }
  return { ok: true, value: { project: current, warnings } };
}

function currentWarnings(calculation: Calculation): WiringProposalSummary['warnings'] {
  const surviving = new Set(calculation.project.wires.map((wire) => wire.id));
  return calculation.warnings.filter(
    (warning) => warning.wireIds.length === 0 || warning.wireIds.some((id) => surviving.has(id)),
  );
}
