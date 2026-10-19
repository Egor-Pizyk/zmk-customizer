import { findBindingIssue } from '@domain/validation';
import type { Binding, Project, ValidationIssue } from '@domain';
import { createBehaviorBinding } from './create-behavior-binding';

type Input = {
  readonly path: readonly (string | number)[];
  readonly label: string;
  readonly keycodeNames: ReadonlySet<string>;
  readonly bluetoothProfileCount: number;
};
export function validateBehaviorBinding(
  project: Project,
  binding: Binding,
  input: Input,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { path, label } = input;
  const issue = findBindingIssue({
    binding,
    keyLabel: label,
    catalog: input,
    layerIds: new Set(project.layers.map((layer) => layer.id)),
  });
  if (issue !== undefined) {
    issues.push({ ...issue, path });
  }
  if (binding.kind !== 'custom') {
    return issues;
  }
  return [...issues, ...validateCustomArguments(project, binding, input)];
}

function validateCustomArguments(
  project: Project,
  binding: Extract<Binding, { kind: 'custom' }>,
  input: Input,
): readonly ValidationIssue[] {
  const { path, label } = input;
  const issues: ValidationIssue[] = [];
  const report = (message: string) => {
    issues.push({ code: 'behavior-invalid', message: `${label}: ${message}`, path });
  };
  const behavior = project.behaviors.find((entry) => entry.id === binding.behaviorId);
  if (behavior === undefined) {
    return [
      ...issues,
      {
        code: 'behavior-reference-missing',
        message: `${label} uses deleted behavior ${binding.behaviorId}. Choose another behavior or Undo deletion.`,
        path,
      },
    ];
  }
  const expected = createBehaviorBinding(project, behavior.id).parameters;
  if (
    expected.length !== binding.parameters.length ||
    expected.some((parameter, index) => parameter.kind !== binding.parameters[index]?.kind)
  ) {
    report(
      `arguments no longer match ${behavior.name}. Assign the behavior again and choose its parameters.`,
    );
  }
  for (const parameter of binding.parameters) {
    if (
      parameter.kind === 'layer' &&
      !project.layers.some((layer) => layer.id === parameter.layerId)
    ) {
      report('uses a deleted layer parameter. Choose an existing layer.');
    }
  }
  return issues;
}
