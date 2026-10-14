import { CrossingBridge } from './crossing-bridge';
import { formatWireLabel } from '@ui/schematic/formatting';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { WireShape } from './wire-shape';

export function WiresLayer({ project, view, paths, selection, crossings }: SchematicLayerProps) {
  return (
    <>
      {project.wires.map((wire, wireIndex) => (
        <WireShape
          bends={wire.bends}
          isSelected={
            (selection?.kind === 'wire' && selection.wireId === wire.id) ||
            (selection?.kind === 'multi' && selection.wireIds.includes(wire.id))
          }
          key={wire.id}
          label={formatWireLabel(project, { wireIndex })}
          path={paths.get(wire.id) ?? []}
          pxPerU={view.pxPerU}
          wireId={wire.id}
        />
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
