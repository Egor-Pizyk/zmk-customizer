import type { Project } from '@domain';
import { replaceMacro } from './replace-macro';

export function moveMacroStep(
  project: Project,
  input: { readonly macroId: string; readonly stepId: string; readonly direction: -1 | 1 },
): Project {
  const macro = project.macros.find((entry) => entry.id === input.macroId);
  if (macro === undefined) {
    return project;
  }
  const index = macro.steps.findIndex((step) => step.id === input.stepId);
  const step = macro.steps[index];
  const destination = index + input.direction;
  if (step === undefined || destination < 0 || destination >= macro.steps.length) {
    return project;
  }
  return replaceMacro(project, {
    ...macro,
    steps: macro.steps.toSpliced(index, 1).toSpliced(destination, 0, step),
  });
}
