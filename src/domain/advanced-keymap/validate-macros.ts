import type { Macro, Project, ValidationIssue } from '@domain';
import type { BindingsCatalog } from '@domain/validation';
import { getMacroBudget } from './get-macro-budget';
import { hasReferenceCycle } from './has-reference-cycle';
import { validateAdvancedBinding } from './validate-advanced-binding';

function isTime(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 5000;
}
function getErrors(project: Project, macro: Macro, catalog: BindingsCatalog): readonly string[] {
  const errors: string[] = [];
  if (
    !/[a-z0-9]/iu.test(macro.name) ||
    project.macros.some(
      (other) =>
        other.id !== macro.id &&
        other.name.trim().toLowerCase() === macro.name.trim().toLowerCase(),
    )
  ) {
    errors.push('choose a unique name containing letters or digits.');
  }
  if (macro.steps.length === 0 || macro.steps.length > 64) {
    errors.push('use 1–64 steps.');
  }
  if (!isTime(macro.waitMs) || !isTime(macro.tapMs)) {
    errors.push('tap duration and wait must be whole milliseconds from 0 to 5000.');
  }
  if (macro.steps.some((step) => step.kind === 'wait' && !isTime(step.durationMs))) {
    errors.push('pause durations must be whole milliseconds from 0 to 5000.');
  }
  const budget = getMacroBudget(project, macro, catalog.advancedLimits.macroQueue);
  if (
    budget.bindingCount > catalog.advancedLimits.macroBindings ||
    budget.queueEntries > catalog.advancedLimits.macroQueue
  ) {
    errors.push(
      `sequence exceeds the ZMK budget (${catalog.advancedLimits.macroBindings} bindings / ${catalog.advancedLimits.macroQueue} queue entries). Shorten the sequence.`,
    );
  }
  return errors;
}
export function validateMacros(
  project: Project,
  catalog: BindingsCatalog,
): readonly ValidationIssue[] {
  return project.macros.flatMap((macro, index) => {
    const path = ['macros', index];
    const issues: ValidationIssue[] = getErrors(project, macro, catalog).map((error) => ({
      code: 'macro-invalid',
      path,
      message: `Macro ${macro.name || macro.id}: ${error}`,
    }));
    if (hasReferenceCycle(project, `macro:${macro.id}`)) {
      issues.push({
        code: 'advanced-reference-cycle',
        path,
        message: `Macro ${macro.name} contains a circular action reference. Remove the recursive step.`,
      });
    }
    return [
      ...issues,
      ...macro.steps.flatMap((step, stepIndex) =>
        'binding' in step
          ? validateAdvancedBinding(project, step.binding, {
              catalog,
              path: [...path, 'steps', stepIndex],
              label: `Macro ${macro.name}, step ${stepIndex + 1}`,
            })
          : [],
      ),
    ];
  });
}
