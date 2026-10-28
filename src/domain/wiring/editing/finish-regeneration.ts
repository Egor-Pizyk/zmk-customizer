import { findWireContacts } from '@domain/wires/contacts';
import { getNets } from '@domain/wires/nets';
import { getWiringConnections } from '@domain/wiring';
import { findWiringProposalFailure } from './find-wiring-proposal-failure';
import type { Project, Result, WiringProposalFailure } from '@domain';
import type { WiringCell } from '@domain/wiring/matrix';

type Input = {
  readonly cells: readonly WiringCell[];
  readonly keyIds: readonly string[];
  readonly pinIds: readonly string[];
};

export function finishRegeneration(
  base: Project,
  candidate: Project,
  input: Input,
): Result<Project, WiringProposalFailure> {
  // The legacy router has already materialized insulation and validated its intentional
  // same-terminal contacts; blanket insulation would disconnect that existing topology.
  const { project, contacts } =
    candidate.routing?.matrixStyle === 'existing'
      ? { project: candidate, contacts: findWireContacts(candidate) }
      : insulateNewCrossings(base, candidate);
  const failure = findWiringProposalFailure(base, project);
  if (failure !== undefined) {
    return { ok: false, error: failure };
  }
  const nets = getNets(project, contacts);
  if (!matchesTargets(project, { ...input, nets })) {
    return {
      ok: false,
      error: {
        code: 'operation',
        message: 'The proposed routes join different buses or leave a selected pin unconnected.',
        wireIds: [],
      },
    };
  }
  if (!sameOutsideMeaning(base, project, { pinIds: input.pinIds, nets })) {
    return {
      ok: false,
      error: {
        code: 'operation',
        message:
          'The routing scope crosses an existing electrical boundary. Select the complete affected net or keep its contacts fixed.',
        wireIds: [],
      },
    };
  }
  return { ok: true, value: JSON.stringify(project) === JSON.stringify(base) ? base : project };
}

function sameOutsideMeaning(
  base: Project,
  candidate: Project,
  input: {
    readonly pinIds: readonly string[];
    readonly nets: ReturnType<typeof getNets>;
  },
): boolean {
  const before = getNets(base);
  return base.keys.every((key) =>
    ([1, 2] as const).every((pin) => {
      if (input.pinIds.includes(`${key.id}:${pin}`)) {
        return true;
      }
      const matches = (net: ReturnType<typeof getNets>[number]) =>
        net.pins.some((entry) => entry.keyId === key.id && entry.pin === pin);
      const next = candidate.keys.find((entry) => entry.id === key.id);
      return (
        meaning(
          before.find((net) => matches(net)),
          input.pinIds,
        ) ===
          meaning(
            input.nets.find((net) => matches(net)),
            input.pinIds,
          ) &&
        JSON.stringify(key.diode?.pin === pin ? key.diode : undefined) ===
          JSON.stringify(next?.diode?.pin === pin ? next.diode : undefined)
      );
    }),
  );
}

function meaning(
  net: ReturnType<typeof getNets>[number] | undefined,
  scopedPins: readonly string[],
): string {
  return JSON.stringify({
    terminals: net?.terminalIds.toSorted(),
    pins: net?.pins
      .map((pin) => `${pin.keyId}:${pin.pin}`)
      .filter((id) => !scopedPins.includes(id))
      .toSorted(),
    boardPins: [...new Set(net?.boardPins.map((pin) => pin.boardPin))].toSorted(
      (first, second) => first - second,
    ),
    encoderPins: net?.encoderPins?.map((pin) => `${pin.encoderId}:${pin.pin}`).toSorted(),
  });
}

function insulateNewCrossings(base: Project, candidate: Project) {
  const oldIds = new Set(base.wires.map((wire) => wire.id));
  const surviving = new Set(candidate.wires.map((wire) => wire.id));
  const contacts = findWireContacts(candidate);
  const newInsulation = contacts.crossings
    .filter((crossing) => crossing.wireIds.some((id) => !oldIds.has(id)))
    .map(({ wireIds, ordinal }) => ({ wireIds, ordinal }));
  const oldInsulation = base.insulatedCrossings.filter((ref) =>
    ref.wireIds.every((id) => surviving.has(id)),
  );
  const project = { ...candidate, insulatedCrossings: [...oldInsulation, ...newInsulation] };
  return { project, contacts };
}

function matchesTargets(
  project: Project,
  input: Input & { readonly nets: ReturnType<typeof getNets> },
): boolean {
  if (project.wiring === undefined) {
    return false;
  }
  const connections = getWiringConnections(project.wiring, input.cells);
  const scoped = connections.filter((connection) =>
    input.pinIds.includes(`${connection.keyId}:${connection.pin}`),
  );
  return (
    scoped.length === input.pinIds.length &&
    scoped.every((connection) => {
      const net = input.nets.find((entry) =>
        entry.pins.some((pin) => pin.keyId === connection.keyId && pin.pin === connection.pin),
      );
      return net?.terminalIds.length === 1 && net.terminalIds[0] === connection.terminalId;
    })
  );
}
