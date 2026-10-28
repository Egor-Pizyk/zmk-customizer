import { getWirePinContacts } from '@domain/wires/geometry';
import type { Project } from '@domain';

type Input = {
  readonly wireIds?: readonly string[];
  readonly keyIds?: readonly string[];
  readonly terminalIds?: readonly string[];
};

export type WireProtection = {
  readonly wireId: string;
  readonly keyIds: readonly string[];
  readonly terminalIds: readonly string[];
};

export function getWireProtection(project: Project, input: Input = {}): readonly WireProtection[] {
  return project.wires
    .filter((wire) => wire.locked === true)
    .flatMap((wire) => {
      const keyIds = [
        ...new Set(
          [wire.start, wire.end, ...getWirePinContacts(project, wire)].flatMap((pin) =>
            'keyId' in pin ? [pin.keyId] : [],
          ),
        ),
      ];
      const terminalIds = [wire.start, wire.end].flatMap((end) =>
        end.kind === 'free' && end.terminalId !== undefined ? [end.terminalId] : [],
      );
      const matches =
        (input.wireIds === undefined &&
          input.keyIds === undefined &&
          input.terminalIds === undefined) ||
        (input.wireIds?.includes(wire.id) ?? false) ||
        keyIds.some((id) => input.keyIds?.includes(id) ?? false) ||
        terminalIds.some((id) => input.terminalIds?.includes(id) ?? false);
      return matches ? [{ wireId: wire.id, keyIds, terminalIds }] : [];
    });
}
