import type { Combo, Project, ValidationIssue } from '@domain';
import type { BindingsCatalog } from '@domain/validation';
import { validateAdvancedBinding } from './validate-advanced-binding';

export function validateCombos(
  project: Project,
  catalog: BindingsCatalog,
): readonly ValidationIssue[] {
  return project.combos.flatMap((combo, index) => {
    const errors = getComboErrors(project, combo, catalog);
    const path = ['combos', index];
    const issues: ValidationIssue[] = errors.map((error) => ({
      code: 'combo-invalid',
      path,
      message: `Combo ${combo.name || combo.id}: ${error}`,
    }));
    return [
      ...issues,
      ...validateAdvancedBinding(project, combo.binding, {
        catalog,
        path: [...path, 'binding'],
        label: `Combo ${combo.name}`,
      }),
    ];
  });
}

function getComboErrors(
  project: Project,
  combo: Combo,
  catalog: BindingsCatalog,
): readonly string[] {
  const errors: string[] = [];
  if (combo.keyIds.length < 2 || combo.keyIds.length > catalog.advancedLimits.comboKeys) {
    errors.push(`choose 2–${catalog.advancedLimits.comboKeys} keys.`);
  }
  if (new Set(combo.keyIds).size !== combo.keyIds.length) {
    errors.push('choose distinct keys.');
  }
  if (combo.keyIds.some((id) => !project.keys.some((key) => key.id === id))) {
    errors.push('a key was deleted. Choose existing keys.');
  }
  if (!Number.isInteger(combo.timeoutMs) || combo.timeoutMs < 1 || combo.timeoutMs > 5000) {
    errors.push('timeout must be whole milliseconds from 1 to 5000.');
  }
  if (
    new Set(combo.layerIds).size !== combo.layerIds.length ||
    combo.layerIds.some((id) => !project.layers.some((layer) => layer.id === id))
  ) {
    errors.push('choose distinct existing layers.');
  }
  if (
    !/[a-z0-9]/iu.test(combo.name) ||
    project.combos.some(
      (other) =>
        other.id !== combo.id &&
        other.name.trim().toLowerCase() === combo.name.trim().toLowerCase(),
    )
  ) {
    errors.push('choose a unique name containing letters or digits.');
  }
  return errors;
}
