import { getWireSections } from '@domain/wires';
import { isKeyCellInMarquee, isPathInMarquee } from '@ui/canvas/logic';
import type { Project, WirePoint } from '@domain';
import type { SchematicSelection } from './schematic-selection';
import { getSelectedKeyIds } from './get-selected-key-ids';
import { getSelectedSectionIds } from './get-selected-section-ids';
import { getKeySectionSelection } from './get-key-section-selection';

export function getMarqueeSelection(
  project: Project,
  input: {
    readonly marquee: { readonly start: WirePoint; readonly end: WirePoint };
    readonly selection: SchematicSelection;
    readonly additive: boolean;
  },
): SchematicSelection {
  const previous =
    input.additive && !(input.selection?.kind === 'sections' && input.selection.base !== project)
      ? input.selection
      : undefined;
  const hiddenKeys = new Set(project.encoders.map((encoder) => encoder.pushKeyId));
  const keyIds = project.keys
    .filter((key) => !hiddenKeys.has(key.id) && isKeyCellInMarquee(key, input.marquee))
    .map((key) => key.id);
  const sectionIds = getWireSections(project)
    .filter((section) => isPathInMarquee(section.path, input.marquee))
    .map((section) => section.id);
  return getKeySectionSelection(project, {
    keyIds: [...getSelectedKeyIds(previous), ...keyIds],
    sectionIds: [...getSelectedSectionIds(project, previous), ...sectionIds],
  });
}
