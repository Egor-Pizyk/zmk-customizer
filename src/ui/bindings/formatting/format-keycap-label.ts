import { BEHAVIORS } from '@catalog/bindings';
import type { Binding, Layer } from '@domain';
import { formatBindingName } from './format-binding-name';
import { formatFullBindingLegend } from './format-binding-legend';
import { formatLegendTitle } from './format-legend-title';

// accessibility.md "SVG": "Key N" first, then what Bindings is about.
export function formatKeycapLabel(input: {
  readonly keyIndex: number;
  readonly layerName: string;
  readonly binding: Binding | undefined;
  /** Every layer, for the targets of layer behaviors (spec 007). */
  readonly layers: readonly Layer[];
  readonly isSelected: boolean;
  readonly problems: readonly string[];
}): string {
  const name = formatBindingName(input.binding, input.layers);
  const parts = [`Key ${input.keyIndex}, ${input.layerName} layer: ${name}`];
  if (input.isSelected) {
    parts.push('selected');
  }
  parts.push(...input.problems.map((problem) => `problem: ${problem}`));
  return parts.join(', ');
}

// SVG <title> hover tooltip: the full legend with the full action name (FR-007).
export function formatKeycapTitle(binding: Binding | undefined, layers: readonly Layer[]): string {
  return formatLegendTitle(
    formatFullBindingLegend(binding, layers)?.tap,
    formatBindingName(binding, layers),
  );
}

/** The behavior tag drawn on the keycap (spec 006 FR-013); none for an unassigned key. */
export function formatKeycapTag(binding: Binding | undefined): string | undefined {
  return BEHAVIORS.find((behavior) => behavior.id === binding?.kind)?.tag;
}
