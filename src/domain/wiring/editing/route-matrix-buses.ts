import type { WiringCell } from '@domain/wiring/matrix';
import { createMatrixBusRoutes } from './create-matrix-bus-routes';
import { getNets } from '@domain/wires/nets';
import type { Project, Result, RoutingSettings, WiringProposalSummary } from '@domain';
import type { MatrixBusRoute } from './matrix-bus-types';
import { routeMatrixBusGroup } from './route-matrix-bus-group';

type Input = {
  readonly routes: readonly MatrixBusRoute[];
  readonly settings: RoutingSettings;
  readonly keyIds: readonly string[];
  readonly pinIds: readonly string[];
  readonly existingIds: readonly string[];
};
export function routeMatrixBuses(
  project: Project,
  input: Input,
): Result<
  {
    readonly project: Project;
    readonly warnings: WiringProposalSummary['warnings'];
  },
  string
> {
  const wires = [...project.wires];
  const warnings: WiringProposalSummary['warnings'][number][] = [];
  const existingIds = [...input.existingIds];
  const fixedNets = getNets(project);
  for (const original of input.routes) {
    const route = selectBranches(original, { pinIds: input.pinIds, fixedNets });
    if (route.branches.length === 0) {
      continue;
    }
    const result = routeMatrixBusGroup({ ...project, wires }, route, {
      settings: input.settings,
      existingIds,
      original,
    });
    if (!result.ok) {
      return result;
    }
    wires.push(...result.value.wires);
    warnings.push(...result.value.warnings);
    existingIds.push(...result.value.wires.map((wire) => wire.id));
  }
  return { ok: true, value: { project: { ...project, wires }, warnings } };
}

function selectBranches(
  original: MatrixBusRoute,
  input: { readonly pinIds: readonly string[]; readonly fixedNets: ReturnType<typeof getNets> },
): MatrixBusRoute {
  return {
    ...original,
    branches: original.branches.filter(
      (branch) =>
        input.pinIds.includes(`${branch.keyId}:${branch.pin}`) &&
        !input.fixedNets.some(
          (net) =>
            net.terminalIds.includes(original.terminalId) &&
            net.pins.some((pin) => pin.keyId === branch.keyId && pin.pin === branch.pin),
        ),
    ),
  };
}

export function routeRegeneration(
  project: Project,
  input: Omit<Input, 'routes'> & { readonly cells: readonly WiringCell[] },
) {
  const routes = createMatrixBusRoutes(project, {
    cells: input.cells.filter((cell) => cell.row !== undefined && cell.col !== undefined),
    settings: input.settings,
    pinIds: input.pinIds,
  });
  return routes.ok ? routeMatrixBuses(project, { ...input, routes: routes.value }) : routes;
}
