import type { WirePoint } from '@domain';
import type { WireSection } from '@domain/wires';

export function getSurvivingWireSpans(
  sections: readonly WireSection[],
  selected: ReadonlySet<string>,
): readonly WireSection[] {
  const spans: WireSection[] = [];
  let current: { section: WireSection; path: WirePoint[] } | undefined;
  for (const section of sections) {
    if (selected.has(section.id)) {
      current = undefined;
      continue;
    }
    const last = current?.path.at(-1);
    const first = section.path[0];
    if (
      current !== undefined &&
      current.section.conductorIndex === section.conductorIndex &&
      last?.xU === first?.xU &&
      last?.yU === first?.yU
    ) {
      current.path.push(...section.path.slice(1));
      continue;
    }
    const path = [...section.path];
    current = { section, path };
    spans.push({ ...section, path });
  }
  return spans;
}
