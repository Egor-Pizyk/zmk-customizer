import { regenerateWiring } from './regenerate-wiring';
import { editWiring } from './edit-wiring';
import type { WiringEdit } from './wiring-edit';
import type { Project, Result, WiringProposalFailure, WiringProposalSummary } from '@domain';

export function calculateRegeneration(
  project: Project,
  edit: Extract<WiringEdit, { kind: 'regenerate' }>,
): Result<
  { readonly project: Project; readonly warnings: WiringProposalSummary['warnings'] },
  WiringProposalFailure
> {
  if (project.wiring?.kind !== 'direct') {
    return regenerateWiring(project, { ...edit.input, board: edit.board });
  }
  if (edit.input.scope.kind !== 'all') {
    return {
      ok: false,
      error: {
        code: 'operation',
        wireIds: [],
        message:
          'Direct generation requires Whole schematic scope. Prettify supports the selected scope.',
      },
    };
  }
  const result = editWiring(project, {
    kind: 'auto',
    board: edit.board,
    gridStepU: edit.gridStepU ?? 0.25,
  });
  return result.ok
    ? { ok: true, value: { project: result.value, warnings: [] } }
    : { ok: false, error: { code: 'operation', wireIds: [], message: result.error } };
}
