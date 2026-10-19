import type { Binding, Macro, MacroStep, Project } from '@domain';
import { getMacroLabel } from '@domain/advanced-keymap';
import { renderBinding } from './render-binding';

type FindLabel = (binding: Extract<Binding, { kind: 'tap_dance' | 'mod_morph' }>) => string;
function renderStep(
  step: MacroStep,
  input: { readonly project: Project; readonly macro: Macro; readonly findCustomLabel: FindLabel },
): string {
  if (step.kind === 'wait') {
    return `<&macro_wait_time ${step.durationMs} &macro_press &none &macro_wait_time ${input.macro.waitMs}>`;
  }
  return `<&macro_${step.kind} ${renderBinding(step.binding, input)}>`;
}
function renderMacro(
  macro: Macro,
  input: { readonly project: Project; readonly findCustomLabel: FindLabel },
): string {
  const label = getMacroLabel(macro);
  const bindings = macro.steps.map((step) => renderStep(step, { ...input, macro })).join(', ');
  return `        ${label}: ${label} {
            compatible = "zmk,behavior-macro";
            #binding-cells = <0>;
            wait-ms = <${macro.waitMs}>;
            tap-ms = <${macro.tapMs}>;
            bindings = ${bindings};
        };`;
}
export function renderMacros(project: Project, findCustomLabel: FindLabel): string {
  if (project.macros.length === 0) {
    return '';
  }
  const definitions = project.macros
    .toSorted((first, second) => (getMacroLabel(first) < getMacroLabel(second) ? -1 : 1))
    .map((macro) => renderMacro(macro, { project, findCustomLabel }));
  return `    macros {\n${definitions.join('\n')}\n    };\n\n`;
}
