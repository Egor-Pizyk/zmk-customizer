import { getSchematicGeometry } from '@ui/schematic/interaction';
import { DiodeSymbol } from './diode-symbol';
import type { KeyPin } from '@domain';
import { KeyPins } from './key-pins';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';

export function PinsLayer({ project, view, marks }: SchematicLayerProps) {
  const { diodes } = getSchematicGeometry(project);
  return project.keys.map((key, keyIndex) => {
    function isPinConnected(pin: KeyPin) {
      return !marks.unconnectedPins.has(`${keyIndex}:${pin}`);
    }
    return (
      <g key={key.id}>
        <DiodeSymbol schematicKey={key} placement={diodes.get(key.id)} pxPerU={view.pxPerU} />
        <KeyPins
          isPinConnected={isPinConnected}
          key={key.id}
          pxPerU={view.pxPerU}
          schematicKey={key}
        />
      </g>
    );
  });
}
