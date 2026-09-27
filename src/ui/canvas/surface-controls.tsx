import type { RefObject } from 'react';
import type { Viewport } from '../../storage/preferences';
import { IconButton } from '../components/icon-button';
import { MagnetIcon } from '../components/icons/magnet-icon';
import { MinusIcon } from '../components/icons/minus-icon';
import { PlusIcon } from '../components/icons/plus-icon';
import { ResetViewIcon } from '../components/icons/reset-view-icon';
import { usePreferences } from '../preferences-context';
import { ZOOM_STEP, resetViewport, zoomAt } from './viewport';
import { surfaceCenter } from './surface-center';

type SurfaceControlsProps = {
  readonly viewport: Viewport;
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly onViewportCommit: (viewport: Viewport) => void;
};

// Top-right cluster: the tool window owns the top-left, the minimap the bottom-right.
export function SurfaceControls({ viewport, svgRef, onViewportCommit }: SurfaceControlsProps) {
  const { preferences, changePreferences } = usePreferences();

  function handleSnapClick() {
    changePreferences({ isSnapEnabled: !preferences.isSnapEnabled });
  }

  function handleZoomInClick() {
    onViewportCommit(zoomAt(viewport, ZOOM_STEP, surfaceCenter(svgRef.current)));
  }

  function handleZoomOutClick() {
    onViewportCommit(zoomAt(viewport, 1 / ZOOM_STEP, surfaceCenter(svgRef.current)));
  }

  function handleResetClick() {
    onViewportCommit(resetViewport());
  }

  return (
    <div className="absolute top-7 right-2 flex gap-1 rounded-md border border-border bg-surface-raised p-1">
      <IconButton
        icon={<MagnetIcon />}
        isPressed={preferences.isSnapEnabled}
        label="Snap to grid"
        onClick={handleSnapClick}
      />
      <IconButton icon={<PlusIcon />} label="Zoom in" onClick={handleZoomInClick} />
      <IconButton icon={<MinusIcon />} label="Zoom out" onClick={handleZoomOutClick} />
      <IconButton icon={<ResetViewIcon />} label="Reset view" onClick={handleResetClick} />
    </div>
  );
}
