import type { Binding, Project } from '@domain';
import { getBehaviorActions } from '@domain/behaviors';

export function getDefinitionActions(project: Project, reference: string): readonly Binding[] {
  if (reference.startsWith('macro:')) {
    const macro = project.macros.find((entry) => `macro:${entry.id}` === reference);
    return macro?.steps.flatMap((step) => ('binding' in step ? [step.binding] : [])) ?? [];
  }
  const behavior = project.behaviors.find((entry) => `behavior:${entry.id}` === reference);
  return behavior === undefined ? [] : getBehaviorActions(behavior);
}
