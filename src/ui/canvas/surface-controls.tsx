import { IconButton, MagnetIcon, MinusIcon, PlusIcon, ResetViewIcon } from '@ui/components';
import { usePreferences } from '@ui/preferences';
import { ZOOM_STEP, resetViewport, zoomAt } from './viewport';
import { surfaceCenter } from './surface-center';
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

  function handleResetClick() {
    handleViewportCommit(resetViewport());
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
      <IconButton icon={<ResetViewIcon />} label="Reset view" onClick={handleResetClick} />
    </div>
  );
}
