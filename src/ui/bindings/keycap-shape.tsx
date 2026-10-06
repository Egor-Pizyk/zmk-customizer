import type { KeyboardEvent } from 'react';
import type { Key } from '../../domain/types';
import type { BindingLegend } from './format-binding-legend';
import { cornerLegendFontSize, tapLegendFontSize } from './keycap-legend-font-size';

type KeycapShapeProps = {
  readonly keyIndex: number;
  readonly bindingKey: Key;
  readonly label: string;
  /** Full action name for the hover tooltip (FR-007). */
  readonly title: string;
  /** Undefined: unassigned, or the zoom is too small to read (contracts/ui.md). */
  readonly legend: BindingLegend | undefined;
  /** Exact ZMK code for the keycap corner; hidden when it adds nothing (FR-007). */
  readonly corner: string | undefined;
  /** Behavior tag (`&kp`) top right; a press on it opens the behavior slot (spec 006 FR-013). */
  readonly tag: string | undefined;
  readonly isActive: boolean;
  readonly isSelected: boolean;
  readonly hasConflict: boolean;
  readonly onKeyDown: (keyId: string, event: KeyboardEvent<SVGGElement>) => void;
  readonly onFocus: (keyId: string) => void;
};

// A focusable keycap; `data-issue-path` lets a problem in the panel focus it (FR-022).
export function KeycapShape(props: KeycapShapeProps) {
  const { bindingKey, label, title, isActive, isSelected, hasConflict } = props;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    props.onKeyDown(bindingKey.id, event);
  }

  function handleFocus() {
    props.onFocus(bindingKey.id);
  }

  return (
    <g
      aria-label={label}
      className="group"
      data-conflict={hasConflict || undefined}
      data-issue-path={`layers.0.bindings.${bindingKey.id}`}
      data-keycap-id={bindingKey.id}
      data-selected={isSelected || undefined}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      role="graphics-symbol"
      tabIndex={isActive ? 0 : -1}
    >
      <title>{title}</title>
      <KeycapArt {...props} />
    </g>
  );
}

const HOLD_FONT_U = 0.15;
const TAG_FONT_U = 0.09;
/** The Shift symbol beside the tap symbol: a little smaller and muted. */
const SHIFTED_FONT_RATIO = 0.7;

// Seen from above: outer skirt, inner top surface, key number, tap and hold legends (FR-006).
function KeycapArt({ keyIndex, bindingKey, legend, corner, tag, hasConflict }: KeycapShapeProps) {
  const { xU, yU } = bindingKey;
  return (
    <>
      <rect
        className="fill-surface-muted stroke-border-strong group-focus-visible:stroke-focus group-focus-visible:stroke-3 group-data-conflict:stroke-danger group-data-selected:stroke-accent group-data-selected:stroke-3"
        height={0.92}
        rx={0.1}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        width={0.92}
        x={xU + 0.04}
        y={yU + 0.04}
      />
      <rect
        className="fill-surface-raised stroke-border"
        height={0.72}
        rx={0.08}
        vectorEffect="non-scaling-stroke"
        width={0.76}
        x={xU + 0.12}
        y={yU + 0.08}
      />
      <KeycapLegend corner={corner} keyIndex={keyIndex} legend={legend} tag={tag} xU={xU} yU={yU} />
      {hasConflict ? (
        <path
          aria-hidden="true"
          className="fill-danger"
          d={`M ${xU + 0.84} ${yU + 0.08} l 0.1 0.18 h -0.2 z`}
        />
      ) : undefined}
    </>
  );
}

function KeycapLegend(props: {
  readonly keyIndex: number;
  readonly legend: BindingLegend | undefined;
  readonly corner: string | undefined;
  readonly tag: string | undefined;
  readonly xU: number;
  readonly yU: number;
}) {
  const { keyIndex, legend, corner, tag, xU, yU } = props;
  return (
    <g aria-hidden="true" className="fill-text" textAnchor="middle">
      <text
        className="fill-text-muted"
        fontSize={0.12}
        textAnchor="start"
        x={xU + 0.15}
        y={yU + 0.2}
      >
        {keyIndex}
      </text>
      <KeycapTap legend={legend} xU={xU} yU={yU} />
      <text className="fill-text-muted" fontSize={HOLD_FONT_U} x={xU + 0.5} y={yU + 0.74}>
        {legend?.hold}
      </text>
      <KeycapTag tag={tag} xU={xU} yU={yU} />
      <KeycapCorner corner={corner} xU={xU} yU={yU} />
    </g>
  );
}

function KeycapCorner({
  corner,
  xU,
  yU,
}: {
  readonly corner: string | undefined;
  readonly xU: number;
  readonly yU: number;
}) {
  if (corner === undefined) {
    return null;
  }
  return (
    <text
      className="fill-text-muted"
      fontSize={cornerLegendFontSize(corner)}
      textAnchor="end"
      x={xU + 0.9}
      y={yU + 0.92}
    >
      {corner}
    </text>
  );
}

function KeycapTag({
  tag,
  xU,
  yU,
}: {
  readonly tag: string | undefined;
  readonly xU: number;
  readonly yU: number;
}) {
  return (
    <text
      className="fill-accent"
      data-keycap-tag
      fontSize={TAG_FONT_U}
      textAnchor="end"
      x={xU + 0.85}
      y={yU + 0.2}
    >
      {tag}
    </text>
  );
}

// The tap symbol, centred; with a Shift symbol both share the top, the tap symbol larger on the
// left as printed on a keycap (`]` and `}`).
function KeycapTap({
  legend,
  xU,
  yU,
}: {
  readonly legend: BindingLegend | undefined;
  readonly xU: number;
  readonly yU: number;
}) {
  const fontU = tapLegendFontSize(legend?.tap ?? '');
  const shifted = legend?.shifted;
  return (
    <>
      <text
        dominantBaseline="central"
        fontSize={fontU}
        x={xU + (shifted === undefined ? 0.5 : 0.4)}
        y={yU + 0.43}
      >
        {legend?.tap}
      </text>
      {shifted === undefined ? undefined : (
        <text
          className="fill-text-muted"
          dominantBaseline="central"
          fontSize={fontU * SHIFTED_FONT_RATIO}
          x={xU + 0.66}
          y={yU + 0.43}
        >
          {shifted}
        </text>
      )}
    </>
  );
}
