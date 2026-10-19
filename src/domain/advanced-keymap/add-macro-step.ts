import type { Project, MacroStep } from '@domain';
import { createEntityId } from '@domain/project';
import { replaceMacro } from './replace-macro';

export function addMacroStep(
  project: Project,
  input: { readonly macroId: string; readonly kind: MacroStep['kind'] },
): Project {
  const macro = project.macros.find((entry) => entry.id === input.macroId);
  if (macro === undefined || macro.steps.length >= 64) {
    return project;
  }
  const id = createEntityId({ prefix: 's', existingIds: macro.steps.map((step) => step.id) });
  const step: MacroStep =
    input.kind === 'wait'
      ? { id, kind: input.kind, durationMs: 100 }
      : { id, kind: input.kind, binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } };
  return replaceMacro(project, { ...macro, steps: [...macro.steps, step] });
}
