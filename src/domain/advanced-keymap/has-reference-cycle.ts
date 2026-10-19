import type { Binding, Project } from '@domain';
import { getDefinitionActions } from './get-definition-actions';

export function hasReferenceCycle(project: Project, reference: string): boolean {
  const visited = new Set<string>();
  function visit(current: string, ancestors: ReadonlySet<string>): boolean {
    if (ancestors.has(current)) {
      return true;
    }
    if (visited.has(current)) {
      return false;
    }
    visited.add(current);
    const next = new Set([...ancestors, current]);
    return getDefinitionActions(project, current).some((binding) => {
      const target = findReference(binding);
      return target !== undefined && visit(target, next);
    });
  }
  return visit(reference, new Set());
}
function findReference(binding: Binding): string | undefined {
  if (binding.kind === 'macro') {
    return `macro:${binding.macroId}`;
  }
  if (binding.kind === 'custom') {
    return `behavior:${binding.behaviorId}`;
  }
  return undefined;
}
