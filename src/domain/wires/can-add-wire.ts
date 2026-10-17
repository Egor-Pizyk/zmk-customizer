import { getProjectResourceError, createEntityId } from '@domain/project';
import type { Project, WireEnd, WirePoint } from '@domain';

export type WireCheck =
  | 'ok'
  | 'no-key-pin'
  | 'same-pin'
  | 'missing-reference'
  | { readonly resourceError: string };

function isResolved(project: Project, end: WireEnd): boolean {
  if (end.kind === 'key-pin') {
    return project.keys.some((key) => key.id === end.keyId);
  }
  if (end.kind === 'junction') {
    return project.wires.some((wire) => wire.id === end.wireId);
  }
  return true;
}

// FR-009 plus reference checks: a stale form value or a draft started on a key deleted since
// must never produce a wire the schema would reject on reload (003 review M1).
export function canAddWire(
  project: Project,
  input: { readonly start: WireEnd; readonly end: WireEnd; readonly bends?: readonly WirePoint[] },
): WireCheck {
  const { start, end } = input;
  if (start.kind !== 'key-pin' && end.kind !== 'key-pin') {
    return 'no-key-pin';
  }
  if (!isResolved(project, start) || !isResolved(project, end)) {
    return 'missing-reference';
  }
  const isSamePin =
    start.kind === 'key-pin' &&
    end.kind === 'key-pin' &&
    start.keyId === end.keyId &&
    start.pin === end.pin;
  if (isSamePin) {
    return 'same-pin';
  }
  const resourceError = getProjectResourceError({
    ...project,
    wires: [
      ...project.wires,
      {
        id: createEntityId({ prefix: 'w', existingIds: project.wires.map((wire) => wire.id) }),
        start,
        end,
        bends: input.bends ?? [],
      },
    ],
  });
  return resourceError === undefined ? 'ok' : { resourceError };
}
