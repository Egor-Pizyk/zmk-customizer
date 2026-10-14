import type { Wiring } from '@domain';
import type { WiringCell } from '@domain/wiring/matrix';
import type { WiringConnection } from '@domain/wiring/editing';

export function getWiringConnections(
  wiring: Wiring,
  cells: readonly WiringCell[],
): WiringConnection[] {
  return cells.flatMap((cell) => {
    const terminals = wiring.terminals.filter((terminal) => terminal.half === cell.half);
    const first = terminals.filter(
      (terminal) => terminal.kind === (wiring.kind === 'direct' ? 'input' : 'row'),
    )[wiring.kind === 'direct' ? (cell.col ?? -1) : (cell.row ?? -1)];
    const second =
      wiring.kind === 'direct'
        ? terminals.find((terminal) => terminal.kind === 'ground')
        : terminals.filter((terminal) => terminal.kind === 'col')[cell.col ?? -1];
    return [
      ...(first === undefined
        ? []
        : [{ keyId: cell.keyId, pin: cell.rowPin ?? 1, terminalId: first.id }]),
      ...(second === undefined
        ? []
        : [
            {
              keyId: cell.keyId,
              pin: cell.rowPin === 2 ? (1 as const) : (2 as const),
              terminalId: second.id,
            },
          ]),
    ];
  });
}
