import type { ElectricalRoutingPath } from '@domain/wires/nets';
import { getElectricalRelationAnalysis, getElectricalRelations } from '@domain/wires/nets';
import type { Project, Result, RoutingSettings } from '@domain';
import { getRoutingSegments } from './routing-segments';
import { prettifySpine, replaceRoutingSegments } from './prettify-spans';
import { preservePrettifyInsulation } from './prettify-insulation';

type Input = {
  readonly wireIds: readonly string[];
  readonly settings: RoutingSettings;
};
type SweepInput = {
  readonly order: readonly string[];
  readonly paths: readonly ElectricalRoutingPath[];
  readonly settings: RoutingSettings;
  readonly segments: ReturnType<typeof getRoutingSegments>;
  readonly relaxEditable: boolean;
};

export function calculatePrettifyCandidate(base: Project, input: Input): Result<Project, string> {
  const seed = calculatePass(base, { ...input, relaxEditable: true });
  if (seed.ok) {
    const candidate = preservePrettifyInsulation(base, seed.value);
    if (sameRelations({ base, candidate })) {
      const checked = calculatePass(candidate, { ...input, relaxEditable: false });
      if (
        checked.ok &&
        sameRelations({ base, candidate: preservePrettifyInsulation(base, checked.value) })
      ) {
        return checked;
      }
    }
  }
  return calculatePass(base, { ...input, relaxEditable: false });
}

function sameRelations({
  base,
  candidate,
}: {
  readonly base: Project;
  readonly candidate: Project;
}): boolean {
  return (
    JSON.stringify(getElectricalRelations(base)) ===
    JSON.stringify(getElectricalRelations(candidate))
  );
}

function calculatePass(
  base: Project,
  input: Input & { readonly relaxEditable: boolean },
): Result<Project, string> {
  const paths = getElectricalRelationAnalysis(base).paths.filter((path) => path.id === 'spine');
  const order = [...input.wireIds].toSorted();
  const visited = new Set<string>();
  let current = base;
  let segments = getRoutingSegments(base);
  for (let sweep = 0; sweep < 8; sweep += 1) {
    const before = JSON.stringify(current.wires);
    if (visited.has(before)) {
      return {
        ok: false,
        error:
          'Routing optimization cycled between alternatives. Adjust spacing or reduce the scope.',
      };
    }
    visited.add(before);
    const result = calculateSweep(current, {
      order,
      paths,
      settings: input.settings,
      segments,
      relaxEditable: input.relaxEditable,
    });
    if (!result.ok) {
      return result;
    }
    current = result.value.project;
    segments = result.value.segments;
    if (before === JSON.stringify(current.wires)) {
      return { ok: true, value: current };
    }
  }
  return {
    ok: false,
    error: 'Routing did not stabilize within eight sweeps. Reduce the scope or adjust spacing.',
  };
}

function calculateSweep(
  base: Project,
  input: SweepInput,
): Result<
  { readonly project: Project; readonly segments: ReturnType<typeof getRoutingSegments> },
  string
> {
  let current = base;
  let segments = input.segments;
  for (const id of input.order) {
    const wire = current.wires.find((entry) => entry.id === id);
    const path = input.paths.find((entry) => entry.wireId === id);
    if (wire === undefined || path === undefined || wire.locked === true) {
      continue;
    }
    const obstacles = input.relaxEditable
      ? segments.filter((segment) => !input.order.includes(segment.wireId))
      : segments;
    const result = prettifySpine(current, wire, {
      path,
      settings: input.settings,
      segments,
      obstacles,
    });
    if (!result.ok) {
      return result;
    }
    if (result.value === wire) {
      continue;
    }
    current = {
      ...base,
      wires: current.wires.map((entry) => (entry.id === id ? result.value : entry)),
    };
    segments = replaceRoutingSegments(current, { wire: result.value, segments });
  }
  return { ok: true, value: { project: current, segments } };
}
