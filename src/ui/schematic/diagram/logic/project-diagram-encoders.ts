import { getEncoderGeometry, getEncoderPinPosition, rotatePoint } from '@domain/geometry';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { buildDiagramCell, diagramNode } from './diagram-node';
import { projectPinDot } from './project-diagram-pins';
import type { Project, Encoder, Key, KeyPin } from '@domain';
import type { DiagramArtworkInput } from './project-diagram';

type EncoderInput = {
  readonly project: Project;
  readonly encoder: Encoder;
  readonly index: number;
  readonly pxPerU: number;
};

export function projectDiagramEncoders({ project, view, selection }: DiagramArtworkInput) {
  return project.encoders.map((encoder, index) => {
    const { xU, yU } = getEncoderGeometry(project, encoder);
    const input = { project, encoder, index, pxPerU: view.pxPerU };
    const push = project.keys.find((key) => key.id === encoder.pushKeyId);
    const isSelected = selection?.kind === 'encoder' && selection.encoderId === encoder.id;
    return buildDiagramCell(
      `encoder:${encoder.id}`,
      diagramNode(
        'g',
        {
          ...(isSelected ? { 'data-selected': 'true' } : {}),
          role: 'graphics-symbol',
          'aria-label': `Encoder ${index}, ${encoder.half}, at ${xU}, ${yU}. Edit in Encoders below.`,
        },
        [
          encoderBody(input, isSelected),
          ...encoderLegs(input),
          ...(encoder.wiringMode === 'schematic'
            ? (['A', 'COM', 'B'] as const).map((pin) => encoderContact(input, pin))
            : []),
          ...(push === undefined
            ? []
            : ([1, 2] as const).map((pin) => pushContact(input, push, pin))),
        ],
      ),
      { kind: 'encoder', encoderId: encoder.id, rotate: false },
    );
  });
}
function encoderBody({ project, encoder, index }: EncoderInput, isSelected: boolean) {
  const { xU, yU, rotationDeg } = getEncoderGeometry(project, encoder);
  const cx = xU + 0.5;
  const cy = yU + 0.5;
  return diagramNode(
    'g',
    { transform: `rotate(${rotationDeg} ${cx} ${cy})`, 'data-encoder-id': encoder.id },
    [
      diagramNode('circle', {
        cx,
        cy,
        r: 0.4,
        fill: 'transparent',
        class: 'cursor-move stroke-accent',
        'stroke-width': isSelected ? 0.08 : 0.05,
      }),
      diagramNode('path', {
        d: `M ${cx} ${cy - 0.34} v 0.18`,
        class: 'pointer-events-none stroke-accent',
        'stroke-width': 0.05,
      }),
      diagramNode('text', {
        x: cx,
        y: cy + 0.25,
        'text-anchor': 'middle',
        'font-size': 0.2,
        class: 'pointer-events-none fill-text',
        'aria-hidden': 'true',
        text: `E${index}`,
      }),
    ],
  );
}
function encoderLegs({ project, encoder }: EncoderInput) {
  if (encoder.wiringMode !== 'schematic') {
    return [];
  }
  const geometry = getEncoderGeometry(project, encoder);
  const origin = { xU: geometry.xU + 0.5, yU: geometry.yU + 0.5 };
  const attachments = {
    A: { xU: geometry.xU + 0.3, yU: geometry.yU + 0.16 },
    COM: { xU: geometry.xU + 0.5, yU: geometry.yU + 0.1 },
    B: { xU: geometry.xU + 0.7, yU: geometry.yU + 0.16 },
  };
  return (['A', 'COM', 'B'] as const).map((pin) => {
    const from = rotatePoint(attachments[pin], { rotationDeg: geometry.rotationDeg, origin });
    const to = getEncoderPinPosition(project, encoder, pin);
    return diagramNode('line', {
      'aria-hidden': 'true',
      class: 'pointer-events-none stroke-border-strong',
      'stroke-width': 0.045,
      x1: from.xU,
      y1: from.yU,
      x2: to.xU,
      y2: to.yU,
    });
  });
}
function encoderContact({ project, encoder, index, pxPerU }: EncoderInput, pin: 'A' | 'COM' | 'B') {
  const point = getEncoderPinPosition(project, encoder, pin);
  const isConnected = project.wires.some((wire) =>
    [wire.start, wire.end].some(
      (end) => end.kind === 'encoder-pin' && end.encoderId === encoder.id && end.pin === pin,
    ),
  );
  return diagramNode(
    'g',
    { 'data-encoder-id': encoder.id, 'data-encoder-pin': pin, class: 'cursor-crosshair' },
    [
      diagramNode('circle', {
        cx: point.xU,
        cy: point.yU,
        r: 12 / pxPerU,
        class: 'fill-none',
        'pointer-events': 'all',
        'stroke-width': 0,
      }),
      ...projectPinDot({ ...point, radius: 3.5 / pxPerU }, isConnected),
      diagramNode('text', {
        x: point.xU,
        y: point.yU - (pin === 'COM' ? 0.4 : 0.18),
        'text-anchor': 'middle',
        'font-size': 0.25,
        class: 'pointer-events-none fill-text',
        'aria-hidden': 'true',
        text: pin,
      }),
      diagramNode('title', { text: `Encoder ${index} ${pin} symbolic contact` }),
    ],
  );
}
function pushContact({ project, index, pxPerU }: EncoderInput, key: Key, pin: KeyPin) {
  const at = getKeyPinPosition(key, pin);
  const isConnected = project.wires.some((wire) =>
    [wire.start, wire.end].some(
      (end) => end.kind === 'key-pin' && end.keyId === key.id && end.pin === pin,
    ),
  );
  return diagramNode(
    'g',
    { 'aria-hidden': 'true', 'data-key-id': key.id, 'data-pin': pin, class: 'cursor-crosshair' },
    [
      diagramNode('circle', {
        cx: at.xU,
        cy: at.yU,
        r: 12 / pxPerU,
        class: 'fill-none',
        'pointer-events': 'all',
        'stroke-width': 0,
      }),
      ...projectPinDot({ ...at, radius: 3.5 / pxPerU }, isConnected),
      diagramNode('text', {
        x: at.xU + (pin === 1 ? -0.12 : 0.12),
        y: at.yU + 0.17,
        'text-anchor': 'middle',
        'font-size': 0.11,
        class: 'pointer-events-none fill-text-muted',
        text: `SW${pin}`,
      }),
      diagramNode('title', { text: `Encoder ${index} push switch contact ${pin}` }),
    ],
  );
}
