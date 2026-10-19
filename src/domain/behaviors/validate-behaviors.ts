import type { CustomBehavior, Project, ValidationIssue } from '@domain';
import { getBehaviorActions } from './get-behavior-actions';
import { getBehaviorLabel } from './get-behavior-label';
import { validateBehaviorBinding } from './validate-behavior-binding';

type Input = { readonly keycodeNames: ReadonlySet<string>; readonly bluetoothProfileCount: number };
function isValidTime(value: number, minimum = 0): boolean {
  return Number.isInteger(value) && value >= minimum && value <= 5000;
}
function hasCycle(
  project: Project,
  input: {
    readonly id: string;
    readonly ancestors: ReadonlySet<string>;
    readonly visited: Set<string>;
  },
): boolean {
  if (input.ancestors.has(input.id)) {
    return true;
  }
  if (input.visited.has(input.id)) {
    return false;
  }
  input.visited.add(input.id);
  const behavior = project.behaviors.find((entry) => entry.id === input.id);
  if (behavior === undefined) {
    return false;
  }
  const ancestors = new Set([...input.ancestors, input.id]);
  return getBehaviorActions(behavior).some(
    (binding) =>
      binding.kind === 'custom' &&
      hasCycle(project, { id: binding.behaviorId, ancestors, visited: input.visited }),
  );
}
function getPropertyErrors(project: Project, behavior: CustomBehavior): readonly string[] {
  if (behavior.kind === 'hold-tap') {
    return [
      ...(!isValidTime(behavior.tappingTermMs) ||
      !isValidTime(behavior.quickTapMs, -1) ||
      !isValidTime(behavior.requirePriorIdleMs, -1)
        ? [
            'timing must be whole milliseconds from 0 to 5000 (-1 disables quick tap or prior idle).',
          ]
        : []),
      ...(behavior.triggerKeyIds.some((id) => !project.keys.some((key) => key.id === id))
        ? ['a hold trigger key was deleted. Choose existing keys.']
        : []),
    ];
  }
  if (behavior.kind === 'tap-dance') {
    return [
      ...(isValidTime(behavior.tappingTermMs)
        ? []
        : ['tapping term must be whole milliseconds from 0 to 5000.']),
      ...(behavior.bindings.length === 0 ? ['add at least one tap action.'] : []),
    ];
  }
  if (behavior.kind === 'mod-morph') {
    return [
      ...(behavior.mods.length === 0 ? ['choose at least one trigger modifier.'] : []),
      ...(behavior.keepMods.every((modifier) => behavior.mods.includes(modifier))
        ? []
        : ['retained modifiers must also be trigger modifiers.']),
    ];
  }
  return isValidTime(behavior.releaseAfterMs)
    ? []
    : ['release timeout must be whole milliseconds from 0 to 5000.'];
}
function validateDefinition(
  project: Project,
  input: Input & { readonly behavior: CustomBehavior; readonly index: number },
): readonly ValidationIssue[] {
  const { behavior, index } = input;
  const path = ['behaviors', index];
  const errors = [...getPropertyErrors(project, behavior)];
  if (!/[a-z0-9]/iu.test(behavior.name)) {
    errors.push('enter a name containing letters or digits.');
  }
  if (hasDuplicateName(project, behavior)) {
    errors.push('choose a unique behavior name.');
  }
  const issues: ValidationIssue[] = errors.map((error) => ({
    code: 'behavior-invalid',
    message: `Behavior ${behavior.name || behavior.id}: ${error}`,
    path,
  }));
  if (hasCycle(project, { id: behavior.id, ancestors: new Set(), visited: new Set() })) {
    issues.push({
      code: 'behavior-cycle',
      message: `Behavior ${behavior.name} contains a circular reference. Remove the recursive action.`,
      path,
    });
  }
  const actions = getBehaviorActions(behavior);
  return [
    ...issues,
    ...actions.flatMap((binding, actionIndex) =>
      validateBehaviorBinding(project, binding, {
        ...input,
        path: [...path, 'bindings', actionIndex],
        label: `Behavior ${behavior.name}, action ${actionIndex + 1}`,
      }),
    ),
  ];
}
export function validateBehaviors(project: Project, input: Input): readonly ValidationIssue[] {
  const labels = project.behaviors.map((behavior) => getBehaviorLabel(behavior));
  const duplicates: ValidationIssue[] = labels.flatMap((label, index) =>
    labels.indexOf(label) === index
      ? []
      : [
          {
            code: 'behavior-invalid',
            message: `Behavior label ${label} is duplicated. Rename the behavior.`,
            path: ['behaviors', index],
          },
        ],
  );
  return [
    ...duplicates,
    ...project.behaviors.flatMap((behavior, index) =>
      validateDefinition(project, { ...input, behavior, index }),
    ),
    ...project.layers.flatMap((layer, layerIndex) =>
      project.keys.flatMap((key, keyIndex) => {
        const binding = layer.bindings[key.id];
        return binding?.kind === 'custom'
          ? validateBehaviorBinding(project, binding, {
              ...input,
              path: ['layers', layerIndex, 'bindings', key.id],
              label: `Key ${keyIndex} on layer ${layer.name}`,
            })
          : [];
      }),
    ),
  ];
}

function hasDuplicateName(project: Project, behavior: CustomBehavior): boolean {
  return project.behaviors.some(
    (other) =>
      other.id !== behavior.id &&
      other.name.trim().toLowerCase() === behavior.name.trim().toLowerCase(),
  );
}
