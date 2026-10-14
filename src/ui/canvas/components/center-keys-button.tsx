import { findKeyLayoutCenter } from '@domain/geometry';
import type { Viewport } from '@storage/preferences';
import { IconButton } from '@ui/components/components';
import { CenterViewIcon } from '@ui/components/icons';
import { useProject } from '@ui/project/logic';
import { surfaceCenter, centerViewportAt } from '@ui/canvas/logic';

import type { RefObject } from 'react';

export type CenterKeysButtonProps = {
  readonly viewport: Viewport;
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly onViewportCommit: (viewport: Viewport) => void;
};

export function CenterKeysButton({ viewport, svgRef, onViewportCommit }: CenterKeysButtonProps) {
  const { project } = useProject();
  const center = findKeyLayoutCenter(project);

  function handleCenterClick() {
    if (center !== undefined) {
      onViewportCommit(
        centerViewportAt(viewport, { world: center, screen: surfaceCenter(svgRef.current) }),
      );
    }
  }

  return (
    <IconButton
      hint={center === undefined ? 'Add a key to center the keyboard' : 'Center keyboard'}
      icon={<CenterViewIcon />}
      isDisabled={center === undefined}
      isHintDecorative={center !== undefined}
      label="Center keyboard"
      onClick={handleCenterClick}
    />
  );
}
