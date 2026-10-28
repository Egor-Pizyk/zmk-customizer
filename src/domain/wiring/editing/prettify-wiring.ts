import { getElectricalRelations } from '@domain/wires/nets';
import { getRoutingSettings } from '@domain/wiring';
import type { Project, Result, WiringProposalFailure } from '@domain';
import { resolveWiringScope } from './resolve-wiring-scope';
import { setRoutingSettings } from './set-routing-settings';
import { calculatePrettifyCandidate } from './prettify-candidate';
import { preservePrettifyInsulation } from './prettify-insulation';
import { findWiringProposalFailure } from './find-wiring-proposal-failure';
import type { PrettifyInput, PrettifyCalculation } from './prettify-types';

export function prettifyWiring(
  base: Project,
  input: PrettifyInput,
): Result<PrettifyCalculation, WiringProposalFailure> {
  if (base.wires.length === 0) {
    return { ok: true, value: { project: base, warnings: [] } };
  }
  const scope = resolveWiringScope(base, input.scope);
  if (!scope.ok) {
    return refused(scope.error);
  }
  const configured = setRoutingSettings(base, input);
  if (!configured.ok) {
    return refused(configured.error.map((issue) => issue.message).join(' '));
  }
  const result = calculatePrettifyCandidate(configured.value, {
    wireIds: scope.value.wireIds,
    settings: getRoutingSettings(configured.value),
  });
  if (!result.ok) {
    return refused(result.error);
  }
  return finishPrettify(base, preservePrettifyInsulation(base, result.value));
}

function finishPrettify(
  base: Project,
  candidate: Project,
): Result<PrettifyCalculation, WiringProposalFailure> {
  if (
    nonGeometry(base) !== nonGeometry(candidate) ||
    JSON.stringify(getElectricalRelations(base)) !==
      JSON.stringify(getElectricalRelations(candidate))
  ) {
    return refused(
      'Optimization cannot preserve every ordered attachment and electrical connection. Reduce the scope or protect the affected wires.',
    );
  }
  const failure = findWiringProposalFailure(base, candidate);
  if (failure !== undefined) {
    return { ok: false, error: failure };
  }
  return {
    ok: true,
    value: {
      project:
        JSON.stringify(base.wires) === JSON.stringify(candidate.wires) &&
        JSON.stringify(base.insulatedCrossings) === JSON.stringify(candidate.insulatedCrossings) &&
        JSON.stringify(getRoutingSettings(base)) === JSON.stringify(getRoutingSettings(candidate))
          ? base
          : candidate,
      warnings: [],
    },
  };
}

function refused(message: string): Result<never, WiringProposalFailure> {
  return { ok: false, error: { code: 'operation', message, wireIds: [] } };
}

function nonGeometry(project: Project): string {
  const { wires, routing: _routing, insulatedCrossings: _insulated, ...rest } = project;
  return JSON.stringify({
    ...rest,
    wires: wires.map((wire) => {
      const { bends: _bends, anchors: _anchors, ...meaning } = wire;
      return meaning;
    }),
  });
}
