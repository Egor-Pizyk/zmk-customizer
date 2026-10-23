import { getWireSections } from '@domain/wires';
import { BendHandles } from './bend-handles';
import { CrossingBridge } from './crossing-bridge';
import { getWireBendHandles } from '@ui/schematic/rendering/logic';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { WireShape } from './wire-shape';

type WiresLayerProps = Pick<
  SchematicLayerProps,
  'project' | 'view' | 'paths' | 'selection' | 'crossings'
>;

export function WiresLayer({ project, view, paths, selection, crossings }: WiresLayerProps) {
  const sections = getWireSections(project);
  return (
    <>
      {sections.map((section) => (
        <WireShape
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
      <BendHandles handles={getWireBendHandles(project, paths)} pxPerU={view.pxPerU} />
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
