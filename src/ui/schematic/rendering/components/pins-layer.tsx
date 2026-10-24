import { getSchematicGeometry } from '@ui/schematic/interaction';
import { DiodeSymbol } from './diode-symbol';
import type { KeyPin } from '@domain';
import { KeyPins } from './key-pins';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';

export function PinsLayer({ project, view, marks }: SchematicLayerProps) {
  const { diodes } = getSchematicGeometry(project);
  const encoderPushKeys = new Set(project.encoders.map((encoder) => encoder.pushKeyId));
  return project.keys.map((key, keyIndex) => {
    function isPinConnected(pin: KeyPin) {
      return !marks.unconnectedPins.has(`${keyIndex}:${pin}`);
    }
    return (
      <g key={key.id}>
        <DiodeSymbol schematicKey={key} placement={diodes.get(key.id)} pxPerU={view.pxPerU} />
        {encoderPushKeys.has(key.id) ? null : (
          <KeyPins
            isPinConnected={isPinConnected}
            key={key.id}
            pxPerU={view.pxPerU}
            schematicKey={key}
          />
        )}
      </g>
    );
  });
}
