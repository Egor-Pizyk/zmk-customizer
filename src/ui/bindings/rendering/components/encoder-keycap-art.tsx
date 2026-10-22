import { getKeyGeometry } from '@domain/geometry';
import type { Key } from '@domain';
import type { ReactNode } from 'react';

type Contact = {
  readonly label: string;
  readonly xU: number;
  readonly yU: number;
};

type EncoderKeycapArtProps = {
  readonly bindingKey: Key;
  readonly hasConflict: boolean;
  readonly children: ReactNode;
};

export function EncoderKeycapArt(props: EncoderKeycapArtProps) {
  const { bindingKey, hasConflict, children } = props;
  const { xU, yU } = getKeyGeometry(bindingKey);
  const cx = xU + 0.5;
  const cy = yU + 0.5;
  return (
    <>
      <circle
        className="fill-surface-muted stroke-border-strong group-focus-visible:stroke-focus group-focus-visible:stroke-3 group-data-conflict:stroke-danger group-data-selected:stroke-accent group-data-selected:stroke-3"
        cx={cx}
        cy={cy}
        r={0.4}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M ${cx} ${cy - 0.34} v 0.18`}
        className="pointer-events-none stroke-accent"
        strokeWidth={0.05}
      />
      <EncoderLegs xU={xU} yU={yU} />
      {encoderContacts(xU, yU).map((contact) => (
        <EncoderContact contact={contact} key={contact.label} />
      ))}
      {children}
      {hasConflict ? (
        <path
          aria-hidden="true"
          className="fill-danger"
          d={`M ${xU + 0.78} ${yU + 0.12} l 0.1 0.18 h -0.2 z`}
        />
      ) : undefined}
    </>
  );
}

function EncoderLegs({ xU, yU }: { readonly xU: number; readonly yU: number }) {
  return encoderLegs(xU, yU).map((leg) => (
    <line
      aria-hidden="true"
      className="pointer-events-none stroke-border-strong"
      key={leg.label}
      strokeWidth={0.045}
      x1={leg.from.xU}
      x2={leg.to.xU}
      y1={leg.from.yU}
      y2={leg.to.yU}
    />
  ));
}

function encoderLegs(xU: number, yU: number) {
  return [
    {
      label: 'A',
      from: { xU: xU + 0.3, yU: yU + 0.16 },
      to: { xU: xU + 0.15, yU: yU - 0.15 },
    },
    {
      label: 'COM',
      from: { xU: xU + 0.5, yU: yU + 0.1 },
      to: { xU: xU + 0.5, yU: yU - 0.15 },
    },
    {
      label: 'B',
      from: { xU: xU + 0.7, yU: yU + 0.16 },
      to: { xU: xU + 0.85, yU: yU - 0.15 },
    },
  ] as const;
}

function encoderContacts(xU: number, yU: number): readonly Contact[] {
  return [
    { label: 'A', xU: xU + 0.15, yU: yU - 0.15 },
    { label: 'COM', xU: xU + 0.5, yU: yU - 0.15 },
    { label: 'B', xU: xU + 0.85, yU: yU - 0.15 },
    { label: 'SW1', xU: xU + 0.3, yU: yU + 0.37 },
    { label: 'SW2', xU: xU + 0.63, yU: yU + 0.23 },
  ];
}

function EncoderContact({ contact }: { readonly contact: Contact }) {
  return (
    <g aria-hidden="true">
      <circle className="fill-text" cx={contact.xU} cy={contact.yU} r={0.07} />
      <text
        className="fill-text-muted"
        fontSize={0.1}
        textAnchor="middle"
        x={contact.xU}
        y={contact.yU - 0.1}
      >
        {contact.label}
      </text>
    </g>
  );
}
