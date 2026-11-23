import { getKeyPinWires } from '@domain/wires';
import { getWiringProposalSummary } from './get-wiring-proposal-summary';
import { findWiringProposalFailure } from './find-wiring-proposal-failure';
import type { Project, Result, WiringProposalResult, WiringProposalSummary } from '@domain';

export function prepareWiringProposal(
  base: Project,
  result: Result<Project, string>,
): WiringProposalResult {
  if (!result.ok) {
    return { kind: 'refused', failure: { code: 'operation', message: result.error, wireIds: [] } };
  }
  const failure = findWiringProposalFailure(base, result.value);
  if (failure !== undefined) {
    return { kind: 'refused', failure };
  }
  const source = JSON.stringify(base);
  const summary = summarize(base, result.value);
  return source === JSON.stringify(result.value)
    ? { kind: 'no-change', summary }
    : { kind: 'changed', source, candidate: result.value, summary };
}

function summarize(base: Project, candidate: Project): WiringProposalSummary {
  const findWires = getKeyPinWires(candidate);
  const before = new Map(base.keys.map((key) => [key.id, key.diode]));
  const after = new Map(candidate.keys.map((key) => [key.id, key.diode]));
  const keyIds = [...new Set([...before.keys(), ...after.keys()])];
  return {
    ...getWiringProposalSummary(base, candidate),
    wireChanges: getWireChanges(base, candidate),
    protectedWireIds: base.wires.filter((wire) => wire.locked === true).map((wire) => wire.id),
    diodeKeyIds: keyIds.filter(
      (id) => JSON.stringify(before.get(id)) !== JSON.stringify(after.get(id)),
    ),
    settingsChanged: JSON.stringify(base.routing) !== JSON.stringify(candidate.routing),
    unconnectedPins: candidate.keys.flatMap((key) =>
      ([1, 2] as const).flatMap((pin) =>
        findWires({ keyId: key.id, pin }).length === 0 ? [{ keyId: key.id, pin }] : [],
      ),
    ),
    warnings: [],
  };
}

function getWireChanges(base: Project, candidate: Project): WiringProposalSummary['wireChanges'] {
  const before = new Map(base.wires.map((wire) => [wire.id, JSON.stringify(wire)]));
  const after = new Map(candidate.wires.map((wire) => [wire.id, JSON.stringify(wire)]));
  return {
    retained: candidate.wires
      .filter((wire) => before.get(wire.id) === after.get(wire.id))
      .map((wire) => wire.id),
    added: candidate.wires.filter((wire) => !before.has(wire.id)).map((wire) => wire.id),
    changed: candidate.wires
      .filter((wire) => before.has(wire.id) && before.get(wire.id) !== after.get(wire.id))
      .map((wire) => wire.id),
    removed: base.wires.filter((wire) => !after.has(wire.id)).map((wire) => wire.id),
  };
}
