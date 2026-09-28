import type { KeyPin } from '../../domain/types';
import { KeyPins } from './key-pins';
import type { SchematicLayerProps } from './schematic-layer-props';

export function PinsLayer({ project, view, marks }: SchematicLayerProps) {
  return project.keys.map((key, keyIndex) => {
    function isPinConnected(pin: KeyPin) {
      return !marks.unconnectedPins.has(`${keyIndex}:${pin}`);
    }
    return (
      <KeyPins
        isPinConnected={isPinConnected}
        key={key.id}
        pxPerU={view.pxPerU}
        schematicKey={key}
      />
    );
  });
}
