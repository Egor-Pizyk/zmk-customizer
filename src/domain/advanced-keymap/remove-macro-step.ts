import type { Project } from '@domain';
import { replaceMacro } from './replace-macro';

export function removeMacroStep(
  project: Project,
  input: { readonly macroId: string; readonly stepId: string },
): Project {
  const macro = project.macros.find((entry) => entry.id === input.macroId);
  if (macro === undefined) {
    return project;
  }
  return replaceMacro(project, {
    ...macro,
    steps: macro.steps.filter((step) => step.id !== input.stepId),
  });
}
