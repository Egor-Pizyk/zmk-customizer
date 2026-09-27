import type { RefObject } from 'react';
import { usePreferences } from '../preferences-context';
import { Minimap } from './minimap';
import { Rulers } from './rulers';
import { SurfaceControls } from './surface-controls';
import { useElementSize } from './use-element-size';
import type { useSurfaceViewport } from './use-surface-viewport';
import type { WorldPoint } from './viewport';

type SurfaceOverlaysProps = {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly surface: ReturnType<typeof useSurfaceViewport>;
  readonly pointer: WorldPoint | undefined;
};

// Rulers along the top/left edges, controls top-right, minimap bottom-right; the tool window
// owns the top-left (US9 scenario 4).
export function SurfaceOverlays({ svgRef, surface, pointer }: SurfaceOverlaysProps) {
  const { gridSizeU, areRulersVisible, isMinimapVisible } = usePreferences().preferences;
  const surfaceSize = useElementSize(svgRef);
  const { viewport } = surface;

  function handleViewportDraft(next: typeof viewport) {
    surface.handleViewportDraft(next);
  }

  function handleViewportCommit(next: typeof viewport) {
    surface.handleViewportCommit(next);
  }

  return (
    <>
      {areRulersVisible ? (
        <Rulers
          gridSizeU={gridSizeU}
          pointer={pointer}
          surfaceSize={surfaceSize}
          viewport={viewport}
        />
      ) : undefined}
      <SurfaceControls
        onViewportCommit={handleViewportCommit}
        svgRef={svgRef}
        viewport={viewport}
      />
      {isMinimapVisible ? (
        <Minimap
          onPanCommit={handleViewportCommit}
          onPanDraft={handleViewportDraft}
          surfaceSize={surfaceSize}
          viewport={viewport}
        />
      ) : undefined}
    </>
  );
}
