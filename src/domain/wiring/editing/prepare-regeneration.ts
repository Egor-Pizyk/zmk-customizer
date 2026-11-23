import { preserveManualRoutingPins } from './preserve-manual-routing-pins';
import { getRegenerationTerminals } from './regeneration-terminals';
import { getRegenerationWires } from './get-regeneration-wires';
import type { Project, Result, Wiring, Wire, WiringTerminal } from '@domain';
import type { WiringCell } from '@domain/wiring/matrix';
import type { WiringRegenerationInput } from './regeneration-types';
import type { ResolvedWiringScope } from './resolve-wiring-scope';
import { assignAutoPins } from './assign-auto-pins';

export function prepareRegeneration(
  project: Project & { readonly wiring: Wiring },
  input: WiringRegenerationInput,
  targets: { readonly cells: readonly WiringCell[]; readonly scope: ResolvedWiringScope },
): Result<Project, string> {
  const { cells, scope } = targets;
  const wires = getRegenerationWires(project, scope);
  const assigned = assignRegenerationTerminals(project, { input, targets, wires });
  if (!assigned.ok) {
    return assigned;
  }
  return {
    ok: true,
    value: {
      ...project,
      wires,
      routing: input.settings,
      keys: project.keys.map((key) =>
        prepareKey(key, { cells, scope, input, wiring: project.wiring }),
      ),
      wiring: { ...project.wiring, terminals: assigned.value },
    },
  };
}

function assignRegenerationTerminals(
  project: Project & { readonly wiring: Wiring },
  context: {
    readonly input: WiringRegenerationInput;
    readonly targets: {
      readonly cells: readonly WiringCell[];
      readonly scope: ResolvedWiringScope;
    };
    readonly wires: readonly Wire[];
  },
): Result<readonly WiringTerminal[], string> {
  const { terminals: proposed, requiredIds } = getRegenerationTerminals(project, context.targets);
  const preserved = preserveManualRoutingPins(project, {
    terminals: proposed,
    cells: context.targets.cells,
    pinIds: context.targets.scope.pinIds,
  });
  if (!preserved.ok) {
    return preserved;
  }
  const terminals = preserved.value;
  const candidate = { ...project, wires: context.wires, wiring: { ...project.wiring, terminals } };
  const assigned = assignAutoPins(candidate, {
    board: context.input.board,
    retainAllWires: true,
    terminals: terminals.filter(
      (terminal) => terminal.boardPin !== undefined || requiredIds.has(terminal.id),
    ),
  });
  return assigned.ok
    ? {
        ok: true,
        value: terminals.map(
          (terminal) => assigned.value.find((entry) => entry.id === terminal.id) ?? terminal,
        ),
      }
    : assigned;
}

function prepareKey(
  key: Project['keys'][number],
  context: {
    readonly cells: readonly WiringCell[];
    readonly scope: ResolvedWiringScope;
    readonly input: WiringRegenerationInput;
    readonly wiring: Wiring;
  },
): Project['keys'][number] {
  if (!context.scope.keyIds.includes(key.id)) {
    return key;
  }
  const cell = context.cells.find((entry) => entry.keyId === key.id);
  const rowPin = cell?.rowPin ?? 1;
  const rowSide = (context.input.settings.diodeSide ?? 'row') === 'row';
  const colPin = rowPin === 1 ? 2 : 1;
  const pin = rowSide ? rowPin : colPin;
  if (
    !context.scope.pinIds.includes(`${key.id}:${pin}`) ||
    (key.diode !== undefined && !context.scope.pinIds.includes(`${key.id}:${key.diode.pin}`))
  ) {
    return key;
  }
  const away = rowSide === (context.wiring.diodeDirection === 'col2row');
  return { ...key, diode: { pin, cathode: away ? 'away-switch' : 'toward-switch' } };
}
