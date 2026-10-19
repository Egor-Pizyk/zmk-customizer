import type { Project, ValidationIssue } from '@domain';
import type { BindingsCatalog } from '@domain/validation';
import { getBehaviorActions } from '@domain/behaviors';
import { validateCombos } from './validate-combos';
import { validateMacros } from './validate-macros';
import { validateConditionalLayers } from './validate-conditional-layers';
import { validateAdvancedBinding } from './validate-advanced-binding';
import { hasReferenceCycle } from './has-reference-cycle';

export function validateAdvancedKeymap(
  project: Project,
  catalog: BindingsCatalog,
): readonly ValidationIssue[] {
  return [
    ...validateCombos(project, catalog),
    ...validateMacros(project, catalog),
    ...validateConditionalLayers(project),
    ...getKeyIssues(project, catalog),
    ...getBehaviorIssues(project, catalog),
  ];
}

function getKeyIssues(project: Project, catalog: BindingsCatalog): readonly ValidationIssue[] {
  return project.layers.flatMap((layer, layerIndex) =>
    project.keys.flatMap((key, keyIndex) => {
      const binding = layer.bindings[key.id];
      return binding?.kind === 'macro'
        ? validateAdvancedBinding(project, binding, {
            catalog,
            path: ['layers', layerIndex, 'bindings', key.id],
            label: `Key ${keyIndex} on layer ${layer.name}`,
          })
        : [];
    }),
  );
}

function getBehaviorIssues(project: Project, catalog: BindingsCatalog): readonly ValidationIssue[] {
  return project.behaviors.flatMap((behavior, index) => {
    const path = ['behaviors', index];
    const issues: ValidationIssue[] = hasReferenceCycle(project, `behavior:${behavior.id}`)
      ? [
          {
            code: 'advanced-reference-cycle',
            path,
            message: `Behavior ${behavior.name} contains a circular macro/behavior reference. Remove the recursive action.`,
          },
        ]
      : [];
    return [
      ...issues,
      ...getBehaviorActions(behavior).flatMap((binding, actionIndex) =>
        binding.kind === 'macro'
          ? validateAdvancedBinding(project, binding, {
              catalog,
              path: [...path, 'bindings', actionIndex],
              label: `Behavior ${behavior.name}`,
            })
          : [],
      ),
    ];
  });
}
