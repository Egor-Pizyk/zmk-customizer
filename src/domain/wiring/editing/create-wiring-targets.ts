import { autoAssignCells } from '@domain/wiring';
import { getNets } from '@domain/wires/nets';
import { getWiringCells } from '@domain/wiring/matrix';
import type { WiringCell } from '@domain/wiring/matrix';
import type { Project, Result, RoutingTargetCell, KeyPin } from '@domain';
import { resolveWiringScope } from './resolve-wiring-scope';
import type { ResolvedWiringScope, WiringScope } from './resolve-wiring-scope';
import { completeTargetCells } from './complete-target-cells';

type Input = {
  readonly scope: WiringScope;
  readonly rowPin?: KeyPin;
  /** Explicitly accepted desired assignments; persisted intent alone never overrides actual nets. */
  readonly cells?: readonly RoutingTargetCell[];
};
type Targets = {
  readonly scope: ResolvedWiringScope;
  readonly cells: readonly WiringCell[];
  readonly proposedKeyIds: readonly string[];
};

/** Builds transient matrix targets without changing wires, terminal identities or assigned GPIO. */
export function createWiringTargets(project: Project, input: Input): Result<Targets, string> {
  if (project.wiring?.kind === 'direct') {
    return {
      ok: false,
      error: 'Choose matrix topology explicitly before constructing matrix targets.',
    };
  }
  const scope = resolveWiringScope(project, input.scope);
  if (!scope.ok) {
    return scope;
  }
  const desired = input.cells ?? [];
  const failure = findDesiredFailure(project, desired, scope.value.keyIds);
  if (failure !== undefined) {
    return { ok: false, error: failure };
  }
  const source = getSourceCells(project, { scope: scope.value, rowPin: input.rowPin });
  if (!source.ok) {
    return source;
  }
  const actual = source.value;
  const proposedKeyIds = actual
    .filter(
      (cell) =>
        scope.value.keyIds.includes(cell.keyId) &&
        (cell.row === undefined || cell.col === undefined),
    )
    .map((cell) => cell.keyId)
    .toSorted();
  const automatic = autoAssignCells(project, {
    gridStepU: 0.25,
    topology: project.wiring?.topology ?? 'split',
  });
  const cells = completeTargetCells({ actual, automatic, desired, keyIds: scope.value.keyIds });
  return cells.ok
    ? { ok: true, value: { scope: scope.value, cells: cells.value, proposedKeyIds } }
    : cells;
}

function findDesiredFailure(
  project: Project,
  cells: readonly RoutingTargetCell[],
  keyIds: readonly string[],
): string | undefined {
  if (keyIds.length === 0) {
    return 'No keys belong to this routing scope. Select keys or an electrical net containing keys.';
  }
  if (new Set(cells.map((cell) => cell.keyId)).size !== cells.length) {
    return 'Provide one explicit assignment per key.';
  }
  const invalid = cells.find((cell) => {
    const key = project.keys.find((entry) => entry.id === cell.keyId);
    return (
      !keyIds.includes(cell.keyId) ||
      key === undefined ||
      (key.half ?? 'left') !== cell.half ||
      ![cell.row, cell.col].every((value) => Number.isInteger(value) && value >= 0 && value <= 254)
    );
  });
  return invalid === undefined
    ? undefined
    : `The explicit assignment of ${invalid.keyId} is invalid or outside the routing scope.`;
}

function withDefaultPin(
  cell: WiringCell,
  input: { readonly keyIds: readonly string[]; readonly rowPin: KeyPin | undefined },
): WiringCell {
  return cell.rowPin === undefined &&
    input.keyIds.includes(cell.keyId) &&
    input.rowPin !== undefined
    ? { ...cell, rowPin: input.rowPin }
    : cell;
}

function getSourceCells(
  project: Project,
  input: { readonly scope: ResolvedWiringScope; readonly rowPin: KeyPin | undefined },
): Result<readonly WiringCell[], string> {
  const nets = getNets(project);
  const ambiguous = nets.find(
    (net) =>
      net.terminalIds.length > 1 &&
      net.pins.some((pin) => input.scope.pinIds.includes(`${pin.keyId}:${pin.pin}`)),
  );
  if (ambiguous !== undefined) {
    return {
      ok: false,
      error:
        'A selected pin joins different matrix terminals. Repair the short before generating; its logical assignment is ambiguous.',
    };
  }
  return {
    ok: true,
    value: getWiringCells(project, nets).map((cell) =>
      withDefaultPin(cell, { keyIds: input.scope.keyIds, rowPin: input.rowPin }),
    ),
  };
}
