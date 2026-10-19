import type { Project } from '@domain';
import { getMacroLabel } from '@domain/advanced-keymap';

export function renderMacroReference(project: Project, macroId: string): string {
  const macro = project.macros.find((entry) => entry.id === macroId);
  if (macro === undefined) {
    throw new Error('Validated macro is missing');
  }
  return `&${getMacroLabel(macro)}`;
}
