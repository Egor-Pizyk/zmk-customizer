import type { Project } from '@domain';
import type { SchematicSelection } from './schematic-selection';

export function getSelectedKeyIds(
  selection: SchematicSelection,
  input?: { readonly project: Project },
): readonly string[] {
  if (selection?.kind === 'sections' && input !== undefined && selection.base !== input.project) {
    return [];
  }
  if (selection?.kind === 'key') {
    return [selection.keyId];
  }
  if (selection?.kind === 'sections') {
    return selection.keyIds ?? [];
  }
  return selection?.kind === 'multi' ? selection.keyIds : [];
}
