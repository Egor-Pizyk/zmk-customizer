import type { Binding, Project, ValidationIssue } from '@domain';
import type { BindingsCatalog } from '@domain/validation';
import { validateBehaviorBinding } from '@domain/behaviors';

export function validateAdvancedBinding(
  project: Project,
  binding: Binding,
  input: {
    readonly catalog: BindingsCatalog;
    readonly path: readonly (string | number)[];
    readonly label: string;
  },
): readonly ValidationIssue[] {
  const issues = validateBehaviorBinding(project, binding, {
    ...input.catalog,
    path: input.path,
    label: input.label,
  });
  if (binding.kind === 'macro' && !project.macros.some((macro) => macro.id === binding.macroId)) {
    return [
      ...issues,
      {
        code: 'macro-reference-missing',
        path: input.path,
        message: `${input.label} uses deleted macro ${binding.macroId}. Choose another action or Undo deletion.`,
      },
    ];
  }
  return issues;
}
