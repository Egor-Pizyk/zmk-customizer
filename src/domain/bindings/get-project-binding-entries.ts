import type { Binding, CustomBehavior, Project } from '@domain';

export type ProjectBindingEntry = {
  readonly binding: Binding;
  readonly path: readonly (string | number)[];
  readonly label: string;
};
export function getProjectBindingEntries(project: Project): readonly ProjectBindingEntry[] {
  const keys = project.layers.flatMap((layer, layerIndex) =>
    project.keys.flatMap((key, keyIndex) => {
      const binding = layer.bindings[key.id];
      return binding === undefined
        ? []
        : [
            {
              binding,
              path: ['layers', layerIndex, 'bindings', key.id],
              label: `Key ${keyIndex} on layer ${layer.name}`,
            },
          ];
    }),
  );
  const behaviors = project.behaviors.flatMap((behavior, index) =>
    getActions(behavior).map((binding, actionIndex) => ({
      binding,
      path: ['behaviors', index, 'bindings', actionIndex],
      label: `Behavior ${behavior.name}`,
    })),
  );
  const combos = project.combos.map((combo, index) => ({
    binding: combo.binding,
    path: ['combos', index, 'binding'],
    label: `Combo ${combo.name}`,
  }));

  return [
    ...keys,
    ...behaviors,
    ...combos,
    ...getMacroEntries(project),
    ...getEncoderEntries(project),
  ];
}
function getActions(behavior: CustomBehavior): readonly Binding[] {
  if (behavior.kind === 'tap-dance') {
    return behavior.bindings.map((action) => action.binding);
  }
  if (behavior.kind === 'mod-morph') {
    return [behavior.normal, behavior.morphed];
  }
  return [];
}

function getMacroEntries(project: Project): readonly ProjectBindingEntry[] {
  return project.macros.flatMap((macro, index) =>
    macro.steps.flatMap((step, stepIndex) =>
      'binding' in step
        ? [
            {
              binding: step.binding,
              path: ['macros', index, 'steps', stepIndex],
              label: `Macro ${macro.name}, step ${stepIndex + 1}`,
            },
          ]
        : [],
    ),
  );
}

function getEncoderEntries(project: Project): readonly ProjectBindingEntry[] {
  return project.layers.flatMap((layer, layerIndex) =>
    project.encoders.flatMap((encoder, index) => {
      const binding = layer.encoderBindings?.[encoder.id];
      return binding === undefined
        ? []
        : (['clockwise', 'counterclockwise'] as const).map((direction) => ({
            binding: binding[direction],
            path: ['layers', layerIndex, 'encoderBindings', encoder.id, direction],
            label: `Encoder ${index} ${direction} on layer ${layer.name}`,
          }));
    }),
  );
}
