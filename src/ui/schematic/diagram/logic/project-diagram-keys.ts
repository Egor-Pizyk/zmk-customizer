import { getKeyGeometry } from '@domain/geometry';
import { getKeyPinWires } from '@domain/wires';
import { getSelectedKeyIds } from '@ui/schematic/interaction';
import { formatKeyLabel } from '@ui/schematic/formatting';
import { formatKeyTransform } from '@ui/canvas/logic';
import { buildDiagramCell, diagramNode } from './diagram-node';
import type { Key } from '@domain';
import type { DiagramArtworkInput } from './project-diagram';

export function projectDiagramKeys({
  project,
  selection,
  marks,
  activeKeyId,
}: DiagramArtworkInput) {
  const pushKeys = new Set(project.encoders.map((encoder) => encoder.pushKeyId));
  const wiresOf = getKeyPinWires(project);
  const selected =
    selection?.kind === 'sections' && selection.base !== project
      ? []
      : getSelectedKeyIds(selection);
  return project.keys.flatMap((key, keyIndex) => {
    if (pushKeys.has(key.id)) {
      return [];
    }
    const isSelected = selected.includes(key.id);
    const problems = marks.problemsByKeyIndex.get(keyIndex) ?? [];
    const root = diagramNode(
      'g',
      {
        'aria-label': formatKeyLabel(project, { keyIndex, isSelected, problems, wiresOf }),
        class: 'group',
        'data-key-focus-id': key.id,
        'data-key-id': key.id,
        ...(problems.length > 0 ? { 'data-conflict': 'true' } : {}),
        ...(isSelected ? { 'data-selected': 'true' } : {}),
        role: 'graphics-symbol',
        tabindex: key.id === activeKeyId ? 0 : -1,
        transform: formatKeyTransform(key),
      },
      keyArtwork(key, { keyIndex, hasConflict: problems.length > 0 }),
    );
    return [buildDiagramCell(`key:${key.id}`, root, { kind: 'key', keyId: key.id })];
  });
}

function keyArtwork(
  key: Key,
  { keyIndex, hasConflict }: { readonly keyIndex: number; readonly hasConflict: boolean },
) {
  const { xU, yU, widthU, heightU } = getKeyGeometry(key);
  return [
    diagramNode('rect', {
      class:
        'fill-surface-raised stroke-border-strong group-focus-visible:stroke-focus group-focus-visible:stroke-3 group-data-conflict:stroke-danger group-data-selected:stroke-accent',
      height: Math.max(0.01, heightU - 0.08),
      width: Math.max(0.01, widthU - 0.08),
      x: xU + 0.04,
      y: yU + 0.04,
      rx: 0.08,
      'stroke-width': 1.5,
      'vector-effect': 'non-scaling-stroke',
    }),
    ...keyStem(xU + widthU / 2, yU + heightU / 2),
    diagramNode('text', {
      'aria-hidden': 'true',
      class: 'fill-text-muted',
      'font-size': 0.16,
      x: xU + 0.1,
      y: yU + heightU - 0.1,
      text: String(keyIndex),
    }),
    ...(hasConflict
      ? [
          diagramNode('path', {
            'aria-hidden': 'true',
            class: 'fill-danger',
            d: `M ${xU + 0.84} ${yU + 0.08} l 0.1 0.18 h -0.2 z`,
          }),
        ]
      : []),
  ];
}
function keyStem(centerXU: number, centerYU: number) {
  const length = 0.26;
  const width = 0.07;
  return [
    diagramNode('path', {
      class: 'fill-surface-muted stroke-border',
      d: `M ${centerXU - 0.32} ${centerYU - 0.32} h 0.64 v 0.64 h -0.64 z`,
      'vector-effect': 'non-scaling-stroke',
    }),
    diagramNode('path', {
      class: 'fill-text-muted',
      d:
        `M ${centerXU - length / 2} ${centerYU - width / 2} h ${length} v ${width} h ${-length} z ` +
        `M ${centerXU - width / 2} ${centerYU - length / 2} h ${width} v ${length} h ${-width} z`,
    }),
  ];
}
