import type { ResizeDirection } from '@domain';

export const TRANSFORM_HANDLES = [
  { name: 'top left', x: -1, y: -1, cursor: 'cursor-nwse-resize' },
  { name: 'top', x: 0, y: -1, cursor: 'cursor-ns-resize' },
  { name: 'top right', x: 1, y: -1, cursor: 'cursor-nesw-resize' },
  { name: 'right', x: 1, y: 0, cursor: 'cursor-ew-resize' },
  { name: 'bottom right', x: 1, y: 1, cursor: 'cursor-nwse-resize' },
  { name: 'bottom', x: 0, y: 1, cursor: 'cursor-ns-resize' },
  { name: 'bottom left', x: -1, y: 1, cursor: 'cursor-nesw-resize' },
  { name: 'left', x: -1, y: 0, cursor: 'cursor-ew-resize' },
] as const satisfies readonly (ResizeDirection & {
  readonly name: string;
  readonly cursor: string;
})[];
