import { getKeyPinPosition } from '@domain/wires/geometry';
import { buildDiagramCell, diagramNode } from './diagram-node';
import type { Key, KeyPin } from '@domain';
import type { DiodePlacement } from '@ui/schematic/interaction';
import type { DiagramArtworkInput } from './project-diagram';

export function projectDiagramPins({ project, view, marks, diodes }: DiagramArtworkInput) {
  const pushKeys = new Set(project.encoders.map((encoder) => encoder.pushKeyId));
  return project.keys.map((key, index) =>
    buildDiagramCell(
      `pins:${key.id}`,
      diagramNode('g', {}, [
        ...projectDiode(key, diodes.get(key.id), view.pxPerU),
        ...(pushKeys.has(key.id)
          ? []
          : ([1, 2] as const).map((pin) =>
              projectPin(key, pin, {
                pxPerU: view.pxPerU,
                isConnected: !marks.unconnectedPins.has(`${index}:${pin}`),
              }),
            )),
      ]),
    ),
  );
}

function projectPin(
  key: Key,
  pin: KeyPin,
  { pxPerU, isConnected }: { readonly pxPerU: number; readonly isConnected: boolean },
) {
  const { xU, yU } = getKeyPinPosition(key, pin);
  const radius = 3.5 / pxPerU;
  return diagramNode('g', { 'aria-hidden': 'true', 'data-key-id': key.id, 'data-pin': pin }, [
    diagramNode('circle', {
      class: 'fill-none',
      cx: xU,
      cy: yU,
      'pointer-events': 'all',
      'stroke-width': 0,
      r: 12 / pxPerU,
    }),
    ...projectPinDot({ xU, yU, radius }, isConnected),
    diagramNode('text', {
      class: 'fill-text-muted',
      'font-size': 0.11,
      x: xU - 0.05,
      y: yU + 0.17,
      text: String(pin),
    }),
  ]);
}
export function projectPinDot(
  { xU, yU, radius }: { readonly xU: number; readonly yU: number; readonly radius: number },
  isConnected: boolean,
) {
  return isConnected
    ? [diagramNode('circle', { class: 'fill-text', cx: xU, cy: yU, r: radius })]
    : [
        diagramNode('circle', {
          class: 'fill-surface stroke-danger',
          cx: xU,
          cy: yU,
          r: radius,
          'stroke-width': 1.5,
          'vector-effect': 'non-scaling-stroke',
        }),
        diagramNode('path', {
          class: 'fill-danger',
          d: `M ${xU + radius * 1.4} ${yU - radius * 3.2} l ${radius} ${radius * 1.8} h ${-radius * 2} z`,
        }),
      ];
}
function projectDiode(key: Key, placement: DiodePlacement | undefined, pxPerU: number) {
  if (key.diode === undefined) {
    return [];
  }
  const at = getKeyPinPosition(key, key.diode.pin);
  const rotation = key.diode.cathode === 'away-switch' ? 0 : 180;
  return [
    diagramNode(
      'g',
      {
        'aria-hidden': 'true',
        class: 'fill-surface-raised stroke-text',
        'data-key-id': key.id,
        'data-pin': key.diode.pin,
        transform: `translate(${at.xU} ${at.yU}) rotate(${placement?.angle ?? -90})`,
      },
      [
        diagramNode('path', {
          d: 'M0 0 H0.105 M0.215 0 H0.32',
          fill: 'none',
          'stroke-width': 1.5,
          'vector-effect': 'non-scaling-stroke',
        }),
        diodeBody(rotation),
        diagramNode('circle', {
          class: 'fill-none stroke-none',
          cx: 0.32,
          cy: 0,
          r: 12 / pxPerU,
          'pointer-events': 'all',
        }),
      ],
    ),
  ];
}

function diodeBody(rotation: number) {
  return diagramNode(
    'g',
    { 'pointer-events': 'none', transform: `translate(0.16 0) rotate(${rotation})` },
    [
      diagramNode('path', {
        d: 'M-0.055 -0.055 V0.055 L0.055 0 Z M0.055 -0.065 V0.065',
        'stroke-width': 1.5,
        'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
      }),
    ],
  );
}
