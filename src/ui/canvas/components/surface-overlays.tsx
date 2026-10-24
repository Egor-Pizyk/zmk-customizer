import type { RefObject } from 'react';
import { usePreferences } from '@ui/preferences';
import { Rulers } from './rulers';
import { useElementSize } from '@ui/canvas/logic';
import type { useSurfaceViewport, WorldPoint } from '@ui/canvas/logic';

type SurfaceOverlaysProps = {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly surface: ReturnType<typeof useSurfaceViewport>;
  readonly pointer: WorldPoint | undefined;
};

// Rulers share the drawing area with Tools; controls occupy a separate row.
export function SurfaceOverlays({ svgRef, surface, pointer }: SurfaceOverlaysProps) {
  const { gridSizeU, areRulersVisible } = usePreferences().preferences;
  const surfaceSize = useElementSize(svgRef);
  const { viewport } = surface;

  return areRulersVisible ? (
    <Rulers gridSizeU={gridSizeU} pointer={pointer} surfaceSize={surfaceSize} viewport={viewport} />
  ) : undefined;
}
