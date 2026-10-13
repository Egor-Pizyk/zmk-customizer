import { getWirePath, isKeyPositionFree } from '@domain';
import type { Project, WirePoint } from '@domain';
import type { CanvasHit } from './read-canvas-hit';
import type { WireDraft } from './reduce-wire-draft';
import { snapPoint } from './snap-point';
import { toDraftTarget } from './to-draft-target';
import type { ToolId } from '../tools/tools';

export type Hover = { readonly world: WirePoint; readonly hit: CanvasHit };

export type HoverPreview = {
  /** The wire being drawn, ending where a click would put it. */
  readonly draftPath: readonly WirePoint[] | undefined;
  /** Pin or wire point the Wire tool would attach to under the cursor. */
  readonly snapTarget: WirePoint | undefined;
  /** Where the Key tool would place a key, and whether the cell is free. */
  readonly ghostKey: { readonly position: WirePoint; readonly isFree: boolean } | undefined;
};

const NO_PREVIEW: HoverPreview = {
  draftPath: undefined,
  snapTarget: undefined,
  ghostKey: undefined,
};

// Shows the result of a click before it happens (user request 2026-09-28): the Wire tool snaps
// to the same pin or wire point a click would use; the Key tool shows the key it would place.
export function getHoverPreview(
  project: Project,
  input: {
    readonly activeToolId: ToolId;
    readonly hover: Hover | undefined;
    readonly snapGridU: number | undefined;
    readonly draft: WireDraft | undefined;
  },
): HoverPreview {
  const { activeToolId, hover, snapGridU, draft } = input;
  if (hover === undefined || hover.hit.kind === 'control') {
    return NO_PREVIEW;
  }
  const snapped = snapPoint(hover.world, snapGridU);
  if (activeToolId === 'add-key') {
    const position = snapPoint({ xU: hover.world.xU - 0.5, yU: hover.world.yU - 0.5 }, snapGridU);
    return {
      ...NO_PREVIEW,
      ghostKey: { position, isFree: isKeyPositionFree(project, { position }) },
    };
  }
  if (activeToolId !== 'wire') {
    return NO_PREVIEW;
  }
  const target = toDraftTarget(project, { hit: hover.hit, world: hover.world, snapped });
  const snapTarget = target.kind === 'empty' ? undefined : target.point;
  const draftPath =
    draft === undefined
      ? undefined
      : getWirePath(project, {
          id: 'draft',
          start: { kind: 'free', at: draft.startPoint },
          end: { kind: 'free', at: target.point },
          bends: draft.bends,
        });
  return { draftPath, snapTarget, ghostKey: undefined };
}
