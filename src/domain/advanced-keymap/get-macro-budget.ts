import type { Binding, Macro, Project } from '@domain';
import { getBehaviorActions } from '@domain/behaviors';

type BudgetContext = {
  readonly project: Project;
  readonly limit: number;
  readonly visiting: Set<string>;
  readonly memo: Map<string, number>;
};

export function getMacroBudget(project: Project, macro: Macro, limit: number) {
  const context: BudgetContext = { project, limit, visiting: new Set(), memo: new Map() };
  const bindingCount = macro.steps.reduce(
    (count, step) => count + (step.kind === 'wait' ? 4 : 2),
    0,
  );
  return { bindingCount, queueEntries: countSteps(macro, context) };
}

function countSteps(macro: Macro, context: BudgetContext): number {
  let total = 0;
  for (const step of macro.steps) {
    total += step.kind === 'tap' ? 2 : 1;
    if (step.kind === 'tap' || step.kind === 'press') {
      total += bindingCost(step.binding, context);
    }
    if (total > context.limit) {
      return total;
    }
  }
  return total;
}

function bindingCost(binding: Binding, context: BudgetContext): number {
  if (binding.kind !== 'macro' && binding.kind !== 'custom') {
    return 0;
  }
  const reference =
    binding.kind === 'macro' ? `macro:${binding.macroId}` : `behavior:${binding.behaviorId}`;
  if (context.visiting.has(reference)) {
    return context.limit + 1;
  }
  const cached = context.memo.get(reference);
  if (cached !== undefined) {
    return cached;
  }
  context.visiting.add(reference);
  const cost = referenceCost(binding, context);
  context.visiting.delete(reference);
  context.memo.set(reference, cost);
  return cost;
}

function referenceCost(
  binding: Extract<Binding, { kind: 'macro' | 'custom' }>,
  context: BudgetContext,
): number {
  if (binding.kind === 'macro') {
    const target = context.project.macros.find((entry) => entry.id === binding.macroId);
    return target === undefined ? 0 : countSteps(target, context);
  }
  const behavior = context.project.behaviors.find((entry) => entry.id === binding.behaviorId);
  let maximum = 0;
  for (const action of behavior === undefined ? [] : getBehaviorActions(behavior)) {
    maximum = Math.max(maximum, bindingCost(action, context));
  }
  return maximum;
}
