import { getWireSections } from '@domain/wires';
import { BendHandles } from './bend-handles';
import { CrossingBridge } from './crossing-bridge';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { WireShape } from './wire-shape';

type WiresLayerProps = Pick<
  SchematicLayerProps,
  'project' | 'view' | 'paths' | 'selection' | 'crossings'
>;

export function WiresLayer({ project, view, paths, selection, crossings }: WiresLayerProps) {
  const sections = getWireSections(project);
  const selectedWireIds = getSelectedWireIds({ project, sections, selection });
  return (
    <>
      {sections.map((section) => (
        <WireShape
          bends={[]}
          isSelected={
            selection?.kind === 'sections' &&
            selection.base === project &&
            selection.sectionIds.includes(section.id)
          }
          key={section.id}
          label={`Wire section ${section.id}`}
          path={section.path}
          pxPerU={view.pxPerU}
          wireId={section.wireId}
          sectionId={section.id}
        />
      ))}
      {project.wires
        .filter((wire) => selectedWireIds.has(wire.id))
        .map((wire) => (
          <BendHandles key={wire.id} wireId={wire.id} bends={wire.bends} pxPerU={view.pxPerU} />
        ))}
      {crossings
        .filter((crossing) => crossing.isInsulated)
        .map((crossing) => (
          <CrossingBridge
            at={crossing.at}
            hoppingPath={paths.get(crossing.ref.wireIds[1]) ?? []}
            key={`${crossing.ref.wireIds.join('×')}:${crossing.ref.ordinal}`}
            pxPerU={view.pxPerU}
          />
        ))}
    </>
  );
}

function getSelectedWireIds({
  project,
  sections,
  selection,
}: Pick<WiresLayerProps, 'project' | 'selection'> & {
  readonly sections: ReturnType<typeof getWireSections>;
}) {
  if (selection?.kind === 'wire') {
    return new Set([selection.wireId]);
  }
  if (selection?.kind !== 'sections' || selection.base !== project) {
    return new Set<string>();
  }
  return new Set(
    sections
      .filter((section) => selection.sectionIds.includes(section.id))
      .map((section) => section.wireId),
  );
}
