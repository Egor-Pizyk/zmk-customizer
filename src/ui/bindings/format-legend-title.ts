// Hover text anywhere a keycap legend is shown: the legend with the full action name in
// parentheses, or just the name when they match (spec 004 FR-007).
export function formatLegendTitle(legend: string | undefined, name: string): string {
  if (legend === undefined || legend === name) {
    return name;
  }
  return `${legend} (${name})`;
}
