import { getWireSections } from '@domain/wires';
import { BendHandles } from './bend-handles';
import { CrossingBridge } from './crossing-bridge';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { WireShape } from './wire-shape';

export function WiresLayer({ project, view, paths, selection, crossings }: SchematicLayerProps) {
  return (
    <>
      {getWireSections(project).map((section) => (
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
        .filter((wire) => selection?.kind === 'wire' && selection.wireId === wire.id)
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
