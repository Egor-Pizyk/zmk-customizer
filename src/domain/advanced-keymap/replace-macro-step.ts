import type { Project, MacroStep } from '@domain';
import { replaceMacro } from './replace-macro';

export function replaceMacroStep(
  project: Project,
  input: { readonly macroId: string; readonly step: MacroStep },
): Project {
  const macro = project.macros.find((entry) => entry.id === input.macroId);
  if (macro === undefined || !macro.steps.some((step) => step.id === input.step.id)) {
    return project;
  }
  return replaceMacro(project, {
    ...macro,
    steps: macro.steps.map((step) => (step.id === input.step.id ? input.step : step)),
  });
}
