import { findBindingIssue } from './find-binding-issue';
import type { BindingIssueInput } from './find-binding-issue';
import type { Layer, Project, ValidationIssue } from '@domain';

/** ZMK facts from src/catalog/, passed in so domain imports nothing (AGENTS §3.1, spec 004 R8). */
export type BindingsCatalog = {
  readonly encoderLimits: {
    readonly maxSteps: number;
    readonly maxTriggers: number;
    readonly rotationDegrees: number;
  };
  readonly keycodeNames: ReadonlySet<string>;
  readonly bluetoothProfileCount: number;
  readonly maxLayerCount: number;
  readonly advancedLimits: {
    readonly comboKeys: number;
    readonly macroBindings: number;
    readonly macroQueue: number;
  };
  readonly shieldLimits: {
    readonly keyboardNameBytes: number;
    readonly layerNodeNameLength: number;
    readonly layerDisplayNameBytes: number;
    readonly minLayoutCell: number;
    readonly maxLayoutCell: number;
  };
};

function validateLayer(
  project: Project,
  input: Pick<BindingIssueInput, 'catalog' | 'layerIds'> & {
    readonly layer: Layer;
    readonly layerIndex: number;
  },
): readonly ValidationIssue[] {
  const { layer, layerIndex, catalog, layerIds } = input;
  return project.keys.flatMap((key, keyIndex) => {
    const binding = layer.bindings[key.id];
    const keyLabel = `Key ${keyIndex} on layer ${layer.name}`;
    const issue =
      binding === undefined
        ? undefined
        : findBindingIssue({ binding, keyLabel, catalog, layerIds });
    return issue === undefined
      ? []
      : [{ ...issue, path: ['layers', layerIndex, 'bindings', key.id] }];
  });
}

// Key names, profiles and layer targets are checked here, not by the schema, so old files still
// open (R7) and a deleted layer's references stay until the user repicks them (spec 007 R2).
export function validateBindings(
  project: Project,
  catalog: BindingsCatalog,
): readonly ValidationIssue[] {
  const layerIds = new Set(project.layers.map((layer) => layer.id));
  return project.layers.flatMap((layer, layerIndex) =>
    validateLayer(project, { layer, layerIndex, catalog, layerIds }),
  );
}
