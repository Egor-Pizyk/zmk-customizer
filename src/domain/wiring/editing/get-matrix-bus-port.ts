import { getKeyCorners, roundU } from '@domain/geometry';
import type { Project, Result, WirePoint } from '@domain';
import type { MatrixBusRoute } from './matrix-bus-types';
import { getRange } from './matrix-bus-order';

/** New symmetric outputs follow the bus, rather than the legacy label fan-out. */
export function getMatrixBusPort(
  project: Project,
  route: MatrixBusRoute,
): Result<WirePoint, string> {
  if (project.wiring?.terminals.some((terminal) => terminal.id === route.terminalId) !== true) {
    return { ok: false, error: 'A matrix bus references a missing terminal.' };
  }
  const existing = project.wires
    .flatMap((wire) => [wire.start, wire.end])
    .find((end) => end.kind === 'free' && end.terminalId === route.terminalId);
  if (existing?.kind === 'free') {
    return { ok: true, value: existing.at };
  }
  const corners = project.keys
    .filter((key) => project.wiring?.topology !== 'split' || (key.half ?? 'left') === route.half)
    .flatMap((key) => getKeyCorners(key));
  if (corners.length === 0) {
    return { ok: false, error: 'No keys belong to this matrix half.' };
  }
  const xs = getRange(corners.map((point) => point.xU));
  const ys = getRange(corners.map((point) => point.yU));
  const value =
    route.kind === 'row'
      ? { xU: roundU(route.half === 'right' ? xs.max + 2.5 : xs.min - 2.5), yU: route.line[0].yU }
      : { xU: route.line[0].xU, yU: columnTop(project, route, ys.min) };
  return { ok: true, value };
}

function columnTop(project: Project, route: MatrixBusRoute, keyTop: number): number {
  const rows = new Set(
    project.wiring?.terminals
      .filter((terminal) => terminal.kind === 'row' && terminal.half === route.half)
      .map((terminal) => terminal.id),
  );
  const rowEnds = project.wires
    .flatMap((wire) => [wire.start, wire.end])
    .flatMap((end) =>
      end.kind === 'free' && end.terminalId !== undefined && rows.has(end.terminalId)
        ? [end.at.yU]
        : [],
    );
  return roundU(getRange([keyTop, ...rowEnds]).min - 0.5);
}
