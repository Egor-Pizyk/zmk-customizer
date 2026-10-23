import { IconButton } from '@ui/components/components';
import { MagnetIcon, MinusIcon, PlusIcon } from '@ui/components/icons';
import { usePreferences } from '@ui/preferences';
import { ZOOM_STEP, zoomAt, surfaceCenter } from '@ui/canvas/logic';

import { CenterKeysButton } from './center-keys-button';
import type { CenterKeysButtonProps } from './center-keys-button';

type SurfaceControlsProps = CenterKeysButtonProps;

// Top-right cluster; the tool window owns the top-left.
export function SurfaceControls({
  viewport,
  svgRef,
  onViewportCommit: handleViewportCommit,
}: SurfaceControlsProps) {
  const { preferences, changePreferences } = usePreferences();

  function handleSnapClick() {
    changePreferences({ isSnapEnabled: !preferences.isSnapEnabled });
  }

  function handleZoomInClick() {
    handleViewportCommit(zoomAt(viewport, ZOOM_STEP, surfaceCenter(svgRef.current)));
  }

  function handleZoomOutClick() {
    handleViewportCommit(zoomAt(viewport, 1 / ZOOM_STEP, surfaceCenter(svgRef.current)));
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
      <CenterKeysButton
        onViewportCommit={handleViewportCommit}
        svgRef={svgRef}
        viewport={viewport}
      />
    </div>
  );
}
