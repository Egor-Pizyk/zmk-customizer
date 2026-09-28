import type { Key } from '../../domain/types';

type KeyArtProps = {
  readonly keyIndex: number;
  readonly schematicKey: Key;
  readonly hasConflict: boolean;
};

const STEM_LENGTH_U = 0.26;
const STEM_WIDTH_U = 0.07;

// An MX switch seen from above (FR-005): keycap cell, housing, cross-shaped stem, key number.
export function KeyArt({ keyIndex, schematicKey, hasConflict }: KeyArtProps) {
  const { xU, yU } = schematicKey;
  return (
    <>
      <rect
        className="fill-surface-raised stroke-border-strong group-focus-visible:stroke-focus group-focus-visible:stroke-3 group-data-conflict:stroke-danger group-data-selected:stroke-accent group-data-selected:stroke-3"
        height={0.92}
        rx={0.08}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        width={0.92}
        x={xU + 0.04}
        y={yU + 0.04}
      />
      <KeyStem centerXU={xU + 0.5} centerYU={yU + 0.5} />
      <text
        aria-hidden="true"
        className="fill-text-muted"
        fontSize={0.16}
        x={xU + 0.1}
        y={yU + 0.9}
      >
        {keyIndex}
      </text>
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

function KeyStem({ centerXU, centerYU }: { readonly centerXU: number; readonly centerYU: number }) {
  const housing = `M ${centerXU - 0.32} ${centerYU - 0.32} h 0.64 v 0.64 h -0.64 z`;
  const cross =
    `M ${centerXU - STEM_LENGTH_U / 2} ${centerYU - STEM_WIDTH_U / 2} h ${STEM_LENGTH_U} v ${STEM_WIDTH_U} h ${-STEM_LENGTH_U} z ` +
    `M ${centerXU - STEM_WIDTH_U / 2} ${centerYU - STEM_LENGTH_U / 2} h ${STEM_WIDTH_U} v ${STEM_LENGTH_U} h ${-STEM_WIDTH_U} z`;
  return (
    <>
      <path
        className="fill-surface-muted stroke-border"
        d={housing}
        vectorEffect="non-scaling-stroke"
      />
      <path className="fill-text-muted" d={cross} />
    </>
  );
}
