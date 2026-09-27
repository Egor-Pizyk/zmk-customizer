import { useId } from 'react';
import type { Viewport } from '../../storage/preferences';
import { PX_PER_U, displayGridStep } from './viewport';
import type { ElementSize } from './use-element-size';
import type { WorldPoint } from './viewport';

const RULER_PX = 20;
const MIN_LABEL_SPACING_PX = 48;

type RulersProps = {
  readonly viewport: Viewport;
  readonly gridSizeU: number;
  readonly surfaceSize: ElementSize;
  readonly pointer: WorldPoint | undefined;
};

// Decorative (aria-hidden): the status bar carries the same position as text.
export function Rulers({ viewport, gridSizeU, surfaceSize, pointer }: RulersProps) {
  const pxPerU = PX_PER_U * viewport.zoom;
  const tickPx = displayGridStep(gridSizeU, viewport.zoom) * pxPerU;
  const labelEveryU = Math.max(1, Math.ceil(MIN_LABEL_SPACING_PX / pxPerU));
  return (
    <>
      <RulerStrip
        axis="x"
        labelEveryU={labelEveryU}
        lengthPx={surfaceSize.widthPx}
        offsetPx={viewport.panXPx}
        pointerPx={pointer === undefined ? undefined : pointer.xU * pxPerU + viewport.panXPx}
        pxPerU={pxPerU}
        tickPx={tickPx}
      />
      <RulerStrip
        axis="y"
        labelEveryU={labelEveryU}
        lengthPx={surfaceSize.heightPx}
        offsetPx={viewport.panYPx}
        pointerPx={pointer === undefined ? undefined : pointer.yU * pxPerU + viewport.panYPx}
        pxPerU={pxPerU}
        tickPx={tickPx}
      />
    </>
  );
}

type RulerStripProps = {
  readonly axis: 'x' | 'y';
  readonly lengthPx: number;
  readonly offsetPx: number;
  readonly pxPerU: number;
  readonly tickPx: number;
  readonly labelEveryU: number;
  readonly pointerPx: number | undefined;
};

function rulerLabelsU({ lengthPx, offsetPx, pxPerU, labelEveryU }: RulerStripProps) {
  const labelsU: number[] = [];
  const firstU = Math.ceil(-offsetPx / pxPerU / labelEveryU) * labelEveryU;
  for (let valueU = firstU; valueU * pxPerU + offsetPx < lengthPx; valueU += labelEveryU) {
    labelsU.push(valueU);
  }
  return labelsU;
}

// ponytail: tick labels are <text> nodes, one per labelled unit; fine for surfaces up to a few
// thousand px, switch to a label pattern if rulers ever get slow.
function RulerStrip(props: RulerStripProps) {
  const { axis, offsetPx, tickPx } = props;
  const patternId = useId();
  const isHorizontal = axis === 'x';
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 left-0 bg-surface-muted text-text-muted ${isHorizontal ? 'h-5 w-full border-b border-border' : 'h-full w-5 border-r border-border'}`}
    >
      <defs>
        <pattern
          height={isHorizontal ? RULER_PX : tickPx}
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={isHorizontal ? tickPx : RULER_PX}
          x={isHorizontal ? offsetPx : 0}
          y={isHorizontal ? 0 : offsetPx}
        >
          <path
            className="stroke-border-strong"
            d={isHorizontal ? `M 0 14 V ${RULER_PX}` : `M 14 0 H ${RULER_PX}`}
          />
        </pattern>
      </defs>
      <rect fill={`url(#${patternId})`} height="100%" width="100%" />
      <RulerMarks {...props} />
    </svg>
  );
}

function RulerMarks(props: RulerStripProps) {
  const { axis, offsetPx, pxPerU, pointerPx } = props;
  const isHorizontal = axis === 'x';
  return (
    <>
      {rulerLabelsU(props).map((valueU) => (
        <text
          className="fill-current text-xs"
          key={valueU}
          x={isHorizontal ? valueU * pxPerU + offsetPx + 2 : 2}
          y={isHorizontal ? 11 : valueU * pxPerU + offsetPx - 2}
        >
          {valueU}
        </text>
      ))}
      {pointerPx === undefined ? undefined : (
        <path
          className="stroke-accent"
          d={isHorizontal ? `M ${pointerPx} 0 V ${RULER_PX}` : `M 0 ${pointerPx} H ${RULER_PX}`}
        />
      )}
    </>
  );
}
