import type { RefObject } from 'react';
import { findKeyLayoutCenter } from '../../domain/find-key-layout-center';
import type { Viewport } from '../../storage/preferences';
import { IconButton } from '../components/icon-button';
import { CenterViewIcon } from '../components/icons/center-view-icon';
import { useProject } from '../project-context';
import { surfaceCenter } from './surface-center';
import { centerViewportAt } from './viewport';

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
