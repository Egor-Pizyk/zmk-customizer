import { toLayerNodeName } from './to-layer-node-name';
import type { Layer, Project, ValidationIssue } from './types';
import type { BindingsCatalog } from './validate-bindings';

// Kept out of the display-name string until escaping is verified (spec 007 R4): quote,
// backslash and every control character (line breaks, tab, NUL…).
const UNSAFE_CHARACTER_PATTERN = /["\\\p{Cc}]/u;

function findNameIssue(input: {
  readonly layer: Layer;
  readonly layerIndex: number;
  readonly indicesByNodeName: ReadonlyMap<string, readonly number[]>;
  readonly layers: readonly Layer[];
}): Pick<ValidationIssue, 'code' | 'message'> | undefined {
  const { layer, layerIndex, indicesByNodeName, layers } = input;
  const label = `Layer ${layerIndex} "${layer.name}"`;
  const nodeName = toLayerNodeName(layer.name);
  if (UNSAFE_CHARACTER_PATTERN.test(layer.name)) {
    return {
      code: 'layer-name-invalid-character',
      message: `${label} contains a quote, backslash, line break or other control character. Remove it in Bindings.`,
    };
  }
  if (nodeName === '') {
    return {
      code: 'layer-name-empty',
      message: `${label} has no letters or digits usable in the keymap. Use at least one Latin letter or digit in Bindings.`,
    };
  }
  const otherIndex = indicesByNodeName.get(nodeName)?.find((index) => index !== layerIndex);
  if (otherIndex === undefined) {
    return undefined;
  }
  return {
    code: 'layer-name-duplicate',
    message: `${label} and layer ${otherIndex} "${layers[otherIndex]?.name ?? ''}" both become ${nodeName} in the keymap. Rename one of them in Bindings.`,
  };
}

function validateLayerCount(
  project: Project,
  catalog: Pick<BindingsCatalog, 'maxLayerCount'>,
): readonly ValidationIssue[] {
  const extraCount = project.layers.length - catalog.maxLayerCount;
  if (extraCount <= 0) {
    return [];
  }
  const noun = extraCount === 1 ? 'layer' : 'layers';
  return [
    {
      code: 'layer-count-exceeded',
      message: `The keymap has ${project.layers.length} layers; ZMK v0.3 supports ${catalog.maxLayerCount}. Delete ${extraCount} ${noun} in Bindings.`,
      path: ['layers', catalog.maxLayerCount],
    },
  ];
}

// Layer names must work as keymap node names and display names (spec 007 FR-005, FR-006);
// ZMK v0.3 supports at most maxLayerCount layers (FR-017, docs/zmk/keymap.md §2).
export function validateLayers(
  project: Project,
  catalog: Pick<BindingsCatalog, 'maxLayerCount'>,
): readonly ValidationIssue[] {
  // Every layer sharing a node name is reported, so the field just renamed shows it too.
  const indicesByNodeName = Map.groupBy(project.layers.keys(), (layerIndex) =>
    toLayerNodeName(project.layers[layerIndex]?.name ?? ''),
  );
  const nameIssues = project.layers.flatMap((layer, layerIndex) => {
    const issue = findNameIssue({
      layer,
      layerIndex,
      indicesByNodeName,
      layers: project.layers,
    });
    return issue === undefined ? [] : [{ ...issue, path: ['layers', layerIndex, 'name'] }];
  });
  return [...nameIssues, ...validateLayerCount(project, catalog)];
}
