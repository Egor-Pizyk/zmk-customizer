import type { Result, RoutingTargetCell } from '@domain';
import type { WiringCell } from '@domain/wiring/matrix';

type Input = {
  readonly actual: readonly WiringCell[];
  readonly automatic: readonly WiringCell[];
  readonly desired: readonly RoutingTargetCell[];
  readonly keyIds: readonly string[];
};

export function completeTargetCells(input: Input): Result<readonly WiringCell[], string> {
  const targets = input.actual.map((cell) => ({
    ...cell,
    ...input.desired.find((desired) => desired.keyId === cell.keyId),
  }));
  const occupied = new Set<string>();
  for (const cell of targets) {
    if (cell.row === undefined || cell.col === undefined) {
      continue;
    }
    const id = identity(cell);
    if (occupied.has(id)) {
      return {
        ok: false,
        error: `Multiple keys occupy logical cell ${id}. Choose distinct assignments.`,
      };
    }
    occupied.add(id);
  }
  const completed = new Map<string, WiringCell>();
  for (const cell of targets.toSorted((first, second) =>
    compareIds({ first: first.keyId, second: second.keyId }),
  )) {
    if (!input.keyIds.includes(cell.keyId) || (cell.row !== undefined && cell.col !== undefined)) {
      completed.set(cell.keyId, cell);
      continue;
    }
    const result = fillCell(cell, input.automatic, occupied);
    if (!result.ok) {
      return result;
    }
    completed.set(cell.keyId, result.value);
    occupied.add(identity(result.value));
  }
  return { ok: true, value: targets.map((cell) => completed.get(cell.keyId) ?? cell) };
}

function fillCell(
  cell: WiringCell,
  automatic: readonly WiringCell[],
  occupied: ReadonlySet<string>,
): Result<WiringCell, string> {
  const suggested = automatic.find((entry) => entry.keyId === cell.keyId);
  const preferred = {
    ...cell,
    row: cell.row ?? suggested?.row ?? 0,
    col: cell.col ?? suggested?.col ?? 0,
    rowPin: cell.rowPin ?? 1,
  };
  if (!occupied.has(identity(preferred))) {
    return { ok: true, value: preferred };
  }
  for (let index = 0; index <= 254; index += 1) {
    const candidate =
      cell.col === undefined ? { ...preferred, col: index } : { ...preferred, row: index };
    if (!occupied.has(identity(candidate))) {
      return { ok: true, value: candidate };
    }
  }
  return {
    ok: false,
    error: `No available logical cell for key ${cell.keyId}; assign it explicitly.`,
  };
}

function identity(cell: WiringCell): string {
  return `${cell.half}:${cell.row}:${cell.col}`;
}

function compareIds({
  first,
  second,
}: {
  readonly first: string;
  readonly second: string;
}): number {
  return first < second ? -1 : Number(first > second);
}
