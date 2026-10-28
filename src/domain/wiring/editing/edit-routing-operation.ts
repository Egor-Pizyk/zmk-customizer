import { prettifyWiring } from './prettify-wiring';
import { regenerateWiring } from './regenerate-wiring';
import type { WiringEdit } from './wiring-edit';
import type { Project, Result } from '@domain';

export function editRoutingOperation(
  project: Project,
  edit: Extract<WiringEdit, { kind: 'regenerate' | 'prettify' }>,
): Result<Project, string> {
  const result =
    edit.kind === 'prettify'
      ? prettifyWiring(project, edit.input)
      : regenerateWiring(project, { ...edit.input, board: edit.board });
  return result.ok
    ? { ok: true, value: result.value.project }
    : { ok: false, error: result.error.message };
}
