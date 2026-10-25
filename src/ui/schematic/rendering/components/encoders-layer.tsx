import type { Project, Encoder } from '@domain';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { getEncoderGeometry, getEncoderPinPosition, rotatePoint } from '@domain/geometry';
import { PinDot } from './key-pins';

export function EncodersLayer({
  project,
  pxPerU,
  selectedEncoderId,
}: {
  readonly selectedEncoderId: string | undefined;
  readonly project: Project;
  readonly pxPerU: number;
}) {
  return project.encoders.map((encoder, index) => (
    <EncoderShape
      isSelected={encoder.id === selectedEncoderId}
      pxPerU={pxPerU}
      key={encoder.id}
      project={project}
      encoder={encoder}
      index={index}
    />
  ));
}

function EncoderShape({
  project,
  encoder,
  index,
  pxPerU,
  isSelected,
}: {
  readonly isSelected: boolean;
  readonly project: Project;
  readonly pxPerU: number;
  readonly encoder: Encoder;
  readonly index: number;
}) {
  const { xU, yU, rotationDeg } = getEncoderGeometry(project, encoder);
  return (
    <g
      data-selected={isSelected || undefined}
      role="graphics-symbol"
      aria-label={`Encoder ${index}, ${encoder.half}, at ${xU}, ${yU}. Edit in Encoders below.`}
    >
      <EncoderBody
        isSelected={isSelected}
        encoder={encoder}
        index={index}
        xU={xU}
        yU={yU}
        rotationDeg={rotationDeg}
      />
      <EncoderLegs project={project} encoder={encoder} />
      <EncoderPushContacts pxPerU={pxPerU} project={project} encoder={encoder} index={index} />
      <EncoderContacts pxPerU={pxPerU} project={project} encoder={encoder} index={index} />
    </g>
  );
}

function EncoderLegs({
  project,
  encoder,
}: {
  readonly project: Project;
  readonly encoder: Encoder;
}) {
  if (encoder.wiringMode !== 'schematic') {
    return null;
  }
  const geometry = getEncoderGeometry(project, encoder);
  const origin = { xU: geometry.xU + 0.5, yU: geometry.yU + 0.5 };
  const attachments = {
    A: { xU: geometry.xU + 0.3, yU: geometry.yU + 0.16 },
    COM: { xU: geometry.xU + 0.5, yU: geometry.yU + 0.1 },
    B: { xU: geometry.xU + 0.7, yU: geometry.yU + 0.16 },
  } as const;
  return (['A', 'COM', 'B'] as const).map((pin) => {
    const from = rotatePoint(attachments[pin], {
      rotationDeg: geometry.rotationDeg,
      origin,
    });
    const to = getEncoderPinPosition(project, encoder, pin);
    return (
      <line
        aria-hidden="true"
        className="pointer-events-none stroke-border-strong"
        key={pin}
        strokeWidth={0.045}
        x1={from.xU}
        x2={to.xU}
        y1={from.yU}
        y2={to.yU}
      />
    );
  });
}

type EncoderBodyProps = {
  readonly isSelected: boolean;
  readonly encoder: Encoder;
  readonly index: number;
  readonly xU: number;
  readonly yU: number;
  readonly rotationDeg: number;
};
function EncoderBody({ encoder, index, xU, yU, rotationDeg, isSelected }: EncoderBodyProps) {
  const cx = xU + 0.5;
  const cy = yU + 0.5;
  return (
    <g transform={`rotate(${rotationDeg} ${cx} ${cy})`} data-encoder-id={encoder.id}>
      <circle
        cx={cx}
        cy={cy}
        r={0.4}
        fill="transparent"
        className="cursor-move stroke-accent"
        strokeWidth={isSelected ? 0.08 : 0.05}
      />
      <path
        d={`M ${cx} ${cy - 0.34} v 0.18`}
        className="pointer-events-none stroke-accent"
        strokeWidth={0.05}
      />
      <text
        x={cx}
        y={cy + 0.25}
        textAnchor="middle"
        fontSize={0.2}
        className="pointer-events-none fill-text"
        aria-hidden="true"
      >{`E${index}`}</text>
    </g>
  );
}

function EncoderContacts({
  project,
  encoder,
  index,
  pxPerU,
}: {
  readonly project: Project;
  readonly pxPerU: number;
  readonly encoder: Encoder;
  readonly index: number;
}) {
  if (encoder.wiringMode !== 'schematic') {
    return null;
  }
  return (['A', 'COM', 'B'] as const).map((pin) => (
    <EncoderContact
      pxPerU={pxPerU}
      key={pin}
      project={project}
      encoder={encoder}
      index={index}
      pin={pin}
    />
  ));
}

type EncoderContactProps = {
  readonly project: Project;
  readonly pxPerU: number;
  readonly encoder: Encoder;
  readonly index: number;
  readonly pin: 'A' | 'COM' | 'B';
};
function EncoderContact({ project, encoder, index, pxPerU, pin }: EncoderContactProps) {
  const point = getEncoderPinPosition(project, encoder, pin);
  const isConnected = project.wires.some((wire) =>
    [wire.start, wire.end].some(
      (end) => end.kind === 'encoder-pin' && end.encoderId === encoder.id && end.pin === pin,
    ),
  );
  return (
    <g data-encoder-id={encoder.id} data-encoder-pin={pin} className="cursor-crosshair">
      <circle
        cx={point.xU}
        cy={point.yU}
        r={12 / pxPerU}
        className="fill-none"
        pointerEvents="all"
        strokeWidth={0}
      />
      <PinDot at={point} isConnected={isConnected} radiusU={3.5 / pxPerU} />
      <text
        x={point.xU}
        y={point.yU - (pin === 'COM' ? 0.4 : 0.18)}
        textAnchor="middle"
        fontSize={0.25}
        className="pointer-events-none fill-text"
        aria-hidden="true"
      >
        {pin}
      </text>
      <title>{`Encoder ${index} ${pin} symbolic contact`}</title>
    </g>
  );
}

function EncoderPushContacts({
  project,
  encoder,
  index,
  pxPerU,
}: {
  readonly project: Project;
  readonly encoder: Encoder;
  readonly index: number;
  readonly pxPerU: number;
}) {
  const pushKey = project.keys.find((key) => key.id === encoder.pushKeyId);
  if (pushKey === undefined) {
    return null;
  }
  return ([1, 2] as const).map((pin) => (
    <EncoderPushContact
      index={index}
      key={pin}
      pin={pin}
      project={project}
      pushKey={pushKey}
      pxPerU={pxPerU}
    />
  ));
}

function EncoderPushContact({ project, pushKey, pin, index, pxPerU }: PushContactProps) {
  const at = getKeyPinPosition(pushKey, pin);
  const isConnected = project.wires.some((wire) =>
    [wire.start, wire.end].some(
      (end) => end.kind === 'key-pin' && end.keyId === pushKey.id && end.pin === pin,
    ),
  );
  return (
    <g aria-hidden="true" data-key-id={pushKey.id} data-pin={pin} className="cursor-crosshair">
      <circle
        cx={at.xU}
        cy={at.yU}
        r={12 / pxPerU}
        className="fill-none"
        pointerEvents="all"
        strokeWidth={0}
      />
      <PinDot at={at} isConnected={isConnected} radiusU={3.5 / pxPerU} />
      <text
        x={at.xU + (pin === 1 ? -0.12 : 0.12)}
        y={at.yU + 0.17}
        textAnchor="middle"
        fontSize={0.11}
        className="pointer-events-none fill-text-muted"
      >{`SW${pin}`}</text>
      <title>{`Encoder ${index} push switch contact ${pin}`}</title>
    </g>
  );
}

type PushContactProps = {
  readonly project: Project;
  readonly pushKey: Project['keys'][number];
  readonly pin: 1 | 2;
  readonly index: number;
  readonly pxPerU: number;
};
