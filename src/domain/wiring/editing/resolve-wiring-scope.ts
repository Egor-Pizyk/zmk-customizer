import { getNets } from '@domain/wires/nets';
import type { Net } from '@domain/wires/nets';
import { getWireHalf, getWirePinContacts } from '@domain/wires/geometry';
import type { Half, Project, Result, Wire } from '@domain';

export type WiringScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'half'; readonly half: Half }
  | {
      readonly kind: 'selection';
      readonly keyIds?: readonly string[];
      /** Selecting a net explicitly permits including all its key participants. */
      readonly netWireIds?: readonly string[];
    };

export type ResolvedWiringScope = {
  readonly keyIds: readonly string[];
  readonly wireIds: readonly string[];
  /** Locked, out-of-scope and shared-boundary conductors must remain byte-identical. */
  readonly fixedWireIds: readonly string[];
};

export function resolveWiringScope(
  project: Project,
  scope: WiringScope,
): Result<ResolvedWiringScope, string> {
  const selectedNets =
    scope.kind === 'selection' && (scope.netWireIds?.length ?? 0) > 0
      ? getNets(project).filter((net) =>
          net.wireIds.some((id) => (scope.netWireIds ?? []).includes(id)),
        )
      : [];
  const selected = selectKeys(project, scope, selectedNets);
  if (!selected.ok) {
    return selected;
  }
  const keyIds = new Set(selected.value);
  const selectedNetWires = new Set(selectedNets.flatMap((net) => net.wireIds));
  const explicitKeys = scope.kind === 'selection' ? new Set(scope.keyIds) : keyIds;
  const editable = project.wires.filter((wire) =>
    isEditable(project, wire, {
      scope,
      keyIds: explicitKeys,
      selectedNetWires,
    }),
  );
  const wireIds = new Set(editable.map((wire) => wire.id));
  return {
    ok: true,
    value: {
      keyIds: [...keyIds].toSorted(),
      wireIds: [...wireIds].toSorted(),
      fixedWireIds: project.wires
        .filter((wire) => !wireIds.has(wire.id))
        .map((wire) => wire.id)
        .toSorted(),
    },
  };
}

function selectKeys(
  project: Project,
  scope: WiringScope,
  nets: readonly Net[],
): Result<readonly string[], string> {
  if (scope.kind !== 'selection') {
    return {
      ok: true,
      value: project.keys
        .filter((key) => scope.kind === 'all' || (key.half ?? 'left') === scope.half)
        .map((key) => key.id),
    };
  }
  if ((scope.keyIds?.length ?? 0) + (scope.netWireIds?.length ?? 0) === 0) {
    return { ok: false, error: 'Select keys or electrical nets before routing.' };
  }
  if (
    (scope.keyIds ?? []).some((id) => !project.keys.some((key) => key.id === id)) ||
    (scope.netWireIds ?? []).some((id) => !project.wires.some((wire) => wire.id === id))
  ) {
    return {
      ok: false,
      error: 'The routing selection contains a missing key or wire. Select it again.',
    };
  }
  return {
    ok: true,
    value: [...(scope.keyIds ?? []), ...nets.flatMap((net) => net.pins.map((pin) => pin.keyId))],
  };
}

function getParticipantIds(project: Project, wire: Wire): readonly string[] {
  return [
    ...[wire.start, wire.end].flatMap((end) => (end.kind === 'key-pin' ? [end.keyId] : [])),
    ...getWirePinContacts(project, wire).map((contact) => contact.keyId),
  ];
}

function isEditable(
  project: Project,
  wire: Wire,
  input: {
    readonly scope: WiringScope;
    readonly keyIds: ReadonlySet<string>;
    readonly selectedNetWires: ReadonlySet<string>;
  },
): boolean {
  if (wire.locked === true) {
    return false;
  }
  const { scope, keyIds, selectedNetWires } = input;
  if (scope.kind === 'all') {
    return true;
  }
  const participants = getParticipantIds(project, wire);
  if (scope.kind === 'half') {
    return getWireHalf(project, wire) === scope.half && participants.every((id) => keyIds.has(id));
  }
  return (
    selectedNetWires.has(wire.id) ||
    (participants.length > 0 && participants.every((id) => keyIds.has(id)))
  );
}
