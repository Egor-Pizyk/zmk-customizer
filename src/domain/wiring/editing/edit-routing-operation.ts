import { regenerateWiring } from './regenerate-wiring';
import type { WiringEdit } from './wiring-edit';
import type { Project, Result } from '@domain';

export function editRoutingOperation(
  project: Project,
  edit: Extract<WiringEdit, { kind: 'regenerate' }>,
): Result<Project, string> {
  const result = regenerateWiring(project, { ...edit.input, board: edit.board });
  return result.ok
    ? { ok: true, value: result.value.project }
    : { ok: false, error: result.error.message };
}
