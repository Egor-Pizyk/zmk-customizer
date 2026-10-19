import type { Binding, Project } from '@domain';
import { getProjectBindingEntries } from '@domain/bindings';

export function getProjectBindings(project: Project): readonly Binding[] {
  return getProjectBindingEntries(project).map((entry) => entry.binding);
}
