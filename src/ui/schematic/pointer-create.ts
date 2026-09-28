import { addKey } from '../../domain/add-key';
import { addWire } from '../../domain/add-wire';
import { createEntityId } from '../../domain/create-entity-id';
import { isKeyPositionFree } from '../../domain/is-key-position-free';
import type { WirePoint } from '../../domain/types';
import type { PointerState } from './pointer-types';
import type { CanvasHit } from './read-canvas-hit';
import { reduceWireDraft } from './reduce-wire-draft';
import { snapPoint } from './snap-point';
import { toDraftTarget } from './to-draft-target';

// Key tool: a key centered on the pointer, its top-left on the grid (003 R9).
export function placeKeyAt(state: PointerState, world: WirePoint) {
  const position = snapPoint({ xU: world.xU - 0.5, yU: world.yU - 0.5 }, state.snapGridU);
  if (!isKeyPositionFree(state.project, { position })) {
    state.onHint('There is already a key here.');
    return;
  }
  const existingIds = state.project.keys.map((key) => key.id);
  const keyId = createEntityId({ prefix: 'k', existingIds });
  state.commit((project) => addKey(project, { position }), `Added key ${existingIds.length}`);
  state.onSelectionChange({ kind: 'key', keyId });
}

export function clickWireTool(
  state: PointerState,
  click: { readonly hit: CanvasHit; readonly world: WirePoint; readonly timeMs: number },
) {
  const snapped = snapPoint(click.world, state.snapGridU);
  const target = toDraftTarget(state.project, { hit: click.hit, world: click.world, snapped });
  const result = reduceWireDraft(state.draft, {
    kind: 'click',
    target,
    timeMs: click.timeMs,
    project: state.project,
  });
  state.onDraftChange(result.draft);
  if (result.hint !== undefined) {
    state.onHint(result.hint);
  }
  const { finished } = result;
  if (finished === undefined) {
    return;
  }
  const existingIds = state.project.wires.map((wire) => wire.id);
  const wireId = createEntityId({ prefix: 'w', existingIds });
  state.commit((project) => addWire(project, finished), `Added wire ${existingIds.length}`);
  state.onSelectionChange({ kind: 'wire', wireId });
}
