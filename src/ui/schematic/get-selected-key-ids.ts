import type { SchematicSelection } from './schematic-selection';

export function getSelectedKeyIds(selection: SchematicSelection): readonly string[] {
  if (selection?.kind === 'key') {
    return [selection.keyId];
  }
  return selection?.kind === 'multi' ? selection.keyIds : [];
}
