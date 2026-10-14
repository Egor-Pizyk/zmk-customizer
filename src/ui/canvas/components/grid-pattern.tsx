import { useId } from 'react';
import type { Viewport } from '@storage/preferences';
import { PX_PER_U, displayGridStep } from '@ui/canvas/logic';

type GridPatternProps = {
  readonly gridSizeU: number;
  readonly viewport: Viewport;
  readonly isVisible: boolean;
};

// Two screen-space patterns (minor = grid step, major = 1u) keep the DOM constant at any size (R5).
export function GridPattern({ gridSizeU, viewport, isVisible }: GridPatternProps) {
  const minorId = useId();
  const majorId = useId();
  if (!isVisible) {
    return null;
  }
  const minorPx = displayGridStep(gridSizeU, viewport.zoom) * PX_PER_U * viewport.zoom;
  const majorPx = PX_PER_U * viewport.zoom;
  return (
    <>
      <defs>
        <GridLines
          id={minorId}
          sizePx={minorPx}
          strokeClassName="stroke-border"
          viewport={viewport}
        />
        <GridLines
          id={majorId}
          sizePx={majorPx}
          strokeClassName="stroke-border-strong"
          viewport={viewport}
        />
      </defs>
      <rect fill={`url(#${minorId})`} height="100%" width="100%" />
      <rect fill={`url(#${majorId})`} height="100%" width="100%" />
    </>
  );
}

type GridLinesProps = {
  readonly id: string;
  readonly sizePx: number;
  readonly strokeClassName: string;
  readonly viewport: Viewport;
};

function GridLines({ id, sizePx, strokeClassName, viewport }: GridLinesProps) {
  return (
    <pattern
      height={sizePx}
      id={id}
      patternUnits="userSpaceOnUse"
      width={sizePx}
      x={viewport.panXPx}
      y={viewport.panYPx}
    >
      <path className={`fill-none ${strokeClassName}`} d={`M ${sizePx} 0 L 0 0 0 ${sizePx}`} />
    </pattern>
  );
}
