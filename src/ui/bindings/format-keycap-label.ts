import { BEHAVIORS } from '../../catalog/behaviors';
import type { Binding } from '../../domain/types';
import { formatBindingName } from './format-binding-name';
import { formatFullBindingLegend } from './format-binding-legend';
import { formatLegendTitle } from './format-legend-title';

// accessibility.md "SVG": "Key N" first, then what Bindings is about.
export function formatKeycapLabel(input: {
  readonly keyIndex: number;
  readonly layerName: string;
  readonly binding: Binding | undefined;
  readonly isSelected: boolean;
  readonly problems: readonly string[];
}): string {
  const parts = [
    `Key ${input.keyIndex}, ${input.layerName} layer: ${formatBindingName(input.binding)}`,
  ];
  if (input.isSelected) {
    parts.push('selected');
  }
  parts.push(...input.problems.map((problem) => `problem: ${problem}`));
  return parts.join(', ');
}

// SVG <title> hover tooltip: the full legend with the full action name (FR-007).
export function formatKeycapTitle(binding: Binding | undefined): string {
  return formatLegendTitle(formatFullBindingLegend(binding)?.tap, formatBindingName(binding));
}

/** The behavior tag drawn on the keycap (spec 006 FR-013); none for an unassigned key. */
export function formatKeycapTag(binding: Binding | undefined): string | undefined {
  return BEHAVIORS.find((behavior) => behavior.id === binding?.kind)?.tag;
}
