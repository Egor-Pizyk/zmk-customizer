import { EncodersLayer } from './encoders-layer';
import type { HoverPreview } from '@ui/schematic/interaction';
import { HoverPreviewLayer } from './hover-preview-layer';
import { KeysLayer } from './keys-layer';
import { PinsLayer } from './pins-layer';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { WireEndsLayer } from './wire-ends-layer';
import { WiresLayer } from './wires-layer';
import { MarqueeLayer } from '@ui/canvas/components';

type SchematicContentProps = SchematicLayerProps & {
  readonly hoverPreview: HoverPreview;
};

// Layers bottom to top: keys, wires and bridges, wire ends, pins (clickable above wires), preview.
export function SchematicContent({ hoverPreview, ...layerProps }: SchematicContentProps) {
  return (
    <>
      <KeysLayer {...layerProps} />
      <EncodersLayer project={layerProps.project} />
      <WiresLayer {...layerProps} />
      <WireEndsLayer {...layerProps} />
      <PinsLayer {...layerProps} />
      <MarqueeLayer marquee={layerProps.marquee} />
      <HoverPreviewLayer preview={hoverPreview} view={layerProps.view} />
    </>
  );
}
