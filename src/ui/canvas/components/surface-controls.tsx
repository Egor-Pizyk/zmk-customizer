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
  return (
    <div className="absolute top-7 right-2 flex gap-1 rounded-md border border-border bg-surface-raised p-1">
      <SnapButton />
      <ZoomButtons viewport={viewport} svgRef={svgRef} onViewportCommit={handleViewportCommit} />
      <CenterKeysButton
        onViewportCommit={handleViewportCommit}
        svgRef={svgRef}
        viewport={viewport}
      />
    </div>
  );
}

function SnapButton() {
  const { preferences, changePreferences } = usePreferences();
  function handleSnapClick() {
    changePreferences({ isSnapEnabled: !preferences.isSnapEnabled });
  }
  return (
    <IconButton
      hint={
        preferences.isSnapEnabled
          ? 'Snapping on. Disable snapping'
          : 'Snapping off. Enable snapping'
      }
      hintAlignment="end"
      icon={<MagnetIcon />}
      isPressed={preferences.isSnapEnabled}
      label="Snap to grid"
      onClick={handleSnapClick}
    />
  );
}

function ZoomButtons({ viewport, svgRef, onViewportCommit }: SurfaceControlsProps) {
  function handleZoomInClick() {
    onViewportCommit(zoomAt(viewport, ZOOM_STEP, surfaceCenter(svgRef.current)));
  }
  function handleZoomOutClick() {
    onViewportCommit(zoomAt(viewport, 1 / ZOOM_STEP, surfaceCenter(svgRef.current)));
  }
  return (
    <>
      <IconButton
        hint="Zoom in"
        hintAlignment="end"
        isHintDecorative
        icon={<PlusIcon />}
        label="Zoom in"
        onClick={handleZoomInClick}
      />
      <IconButton
        hint="Zoom out"
        hintAlignment="end"
        isHintDecorative
        icon={<MinusIcon />}
        label="Zoom out"
        onClick={handleZoomOutClick}
      />
    </>
  );
}
