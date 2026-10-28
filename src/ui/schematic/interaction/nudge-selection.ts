import { isKeyPositionFree } from '@domain/geometry';
import { moveKeys } from '@domain/keys';
import { getSelectedKeyIds } from './get-selected-key-ids';
import { refuseProtectedEdit } from './refuse-protected-edit';
import type { KeyKeyboardOptions } from './use-key-keyboard';

export function nudgeSelection(
  options: KeyKeyboardOptions,
  {
    keyId,
    nudge,
  }: { readonly keyId: string; readonly nudge: { readonly dx: number; readonly dy: number } },
) {
  const selected = getSelectedKeyIds(options.selection, { project: options.project });
  const keyIds = selected.includes(keyId) ? selected : [keyId];
  if (
    refuseProtectedEdit(
      { project: options.project, onHint: (text) => options.announce?.(text) },
      { keyIds },
    )
  ) {
    return;
  }
  const moves = options.project.keys
    .filter((candidate) => keyIds.includes(candidate.id))
    .map((candidate) => ({
      keyId: candidate.id,
      position: {
        xU: candidate.xU + nudge.dx * options.gridSizeU,
        yU: candidate.yU + nudge.dy * options.gridSizeU,
      },
    }));
  if (
    moves.every((move) =>
      isKeyPositionFree(options.project, {
        position: move.position,
        key: options.project.keys.find((candidate) => candidate.id === move.keyId),
        ignoreKeyIds: keyIds,
      }),
    )
  ) {
    options.commit((project) => moveKeys(project, { moves }));
  }
}
