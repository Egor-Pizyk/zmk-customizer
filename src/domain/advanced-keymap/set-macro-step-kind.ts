import type { Project, MacroStep } from '@domain';
import { replaceMacroStep } from './replace-macro-step';

export function setMacroStepKind(
  project: Project,
  input: { readonly macroId: string; readonly stepId: string; readonly kind: MacroStep['kind'] },
): Project {
  const step = project.macros
    .find((macro) => macro.id === input.macroId)
    ?.steps.find((entry) => entry.id === input.stepId);
  if (step === undefined || step.kind === input.kind) {
    return project;
  }
  const replacement: MacroStep =
    input.kind === 'wait'
      ? { id: step.id, kind: input.kind, durationMs: 100 }
      : {
          id: step.id,
          kind: input.kind,
          binding:
            'binding' in step ? step.binding : { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
        };
  return replaceMacroStep(project, { macroId: input.macroId, step: replacement });
}
