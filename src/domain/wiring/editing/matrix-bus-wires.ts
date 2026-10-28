import { roundU } from '@domain/geometry';
import { getOutputPosition } from './get-output-position';
import type { Project, Result, RoutingSettings, Wire, WirePoint } from '@domain';
import type { MatrixBusRoute } from './matrix-bus-types';

export function createBusTrunk(
  project: Project,
  input: {
    readonly route: MatrixBusRoute;
    readonly id: string;
    readonly settings: RoutingSettings;
  },
): Result<Wire, string> {
  const { route, id, settings } = input;
  const output = getBusPort(project, { route, settings });
  if (!output.ok) {
    return output;
  }
  const port = output.value;
  const bend =
    route.kind === 'row'
      ? { xU: port.xU, yU: route.line[0].yU }
      : { xU: route.line[0].xU, yU: port.yU };
  const end = route.kind === 'row' && route.half === 'right' ? route.line[0] : route.line[1];
  return {
    ok: true,
    value: {
      id,
      half: route.half,
      start: { kind: 'free', at: port, terminalId: route.terminalId },
      end: { kind: 'free', at: end },
      bends: [bend],
      anchors: { start: port, end },
      contacts: route.branches
        .filter((branch) => equalPoints({ first: branch.pinAt, second: branch.busAt }))
        .map((branch) => ({ keyId: branch.keyId, pin: branch.pin, at: branch.busAt })),
    },
  };
}

export function shiftMatrixBus(
  route: MatrixBusRoute,
  input: { readonly attempt: number; readonly step: number },
): MatrixBusRoute {
  const distance = roundU(input.attempt * input.step);
  const shift = (point: WirePoint): WirePoint =>
    route.kind === 'row'
      ? { xU: point.xU, yU: roundU(point.yU - distance) }
      : { xU: roundU(point.xU + distance * (route.half === 'right' ? 1 : -1)), yU: point.yU };
  return {
    ...route,
    line: [shift(route.line[0]), shift(route.line[1])],
    branches: route.branches.map((branch) => ({
      ...branch,
      busAt: shift(branch.busAt),
      requiresDetour: route.kind === 'row' && shift(branch.busAt).yU >= branch.pinAt.yU,
    })),
  };
}

export function equalPoints({
  first,
  second,
}: {
  readonly first: WirePoint;
  readonly second: WirePoint;
}): boolean {
  return first.xU === second.xU && first.yU === second.yU;
}

function getBusPort(
  project: Project,
  { route, settings }: { readonly route: MatrixBusRoute; readonly settings: RoutingSettings },
): Result<WirePoint, string> {
  const terminal = project.wiring?.terminals.find((entry) => entry.id === route.terminalId);
  if (terminal === undefined) {
    return { ok: false, error: 'A matrix bus references a missing terminal.' };
  }
  const output = getOutputPosition(project, { terminal, index: route.index });
  if (!output.ok) {
    return output;
  }
  const existing = project.wires
    .flatMap((wire) => [wire.start, wire.end])
    .find((end) => end.kind === 'free' && end.terminalId === route.terminalId);
  const step = Math.max(settings.offsetU, settings.clearanceU);
  const port =
    existing?.kind === 'free'
      ? existing.at
      : {
          xU: roundU(
            output.value.xU +
              (route.kind === 'row'
                ? route.index * (step - 0.07) * (route.half === 'right' ? 1 : -1)
                : 0),
          ),
          yU: roundU(output.value.yU - (route.kind === 'col' ? route.index * step : 0)),
        };
  return { ok: true, value: port };
}
