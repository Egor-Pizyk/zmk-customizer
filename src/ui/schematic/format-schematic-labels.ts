import { assertNever } from '../../domain/assert-never';
import { formatBoardPin } from '../../domain/board-pin';
import { getKeyPinWires } from '../../domain/get-key-pin-wires';
import type { Crossing } from '../../domain/find-crossings';
import type { KeyPin, Project, WireEnd } from '../../domain/types';

const KEY_PINS: readonly KeyPin[] = [1, 2];

function formatPinConnections(
  project: Project,
  input: { readonly keyId: string; readonly pin: KeyPin },
) {
  const wireIndices = getKeyPinWires(project)(input);
  if (wireIndices.length === 0) {
    return 'not connected';
  }
  return wireIndices.length === 1
    ? `wire ${wireIndices.join('')}`
    : `wires ${wireIndices.join(', ')}`;
}

// Key names start with "Key N" (accessibility.md "SVG"); problems follow so they are heard.
export function formatKeyLabel(
  project: Project,
  input: {
    readonly keyIndex: number;
    readonly isSelected: boolean;
    readonly problems: readonly string[];
  },
): string {
  const key = project.keys[input.keyIndex];
  if (key === undefined) {
    return `Key ${input.keyIndex}`;
  }
  const pins = KEY_PINS.map(
    (pin) => `Pin ${pin}: ${formatPinConnections(project, { keyId: key.id, pin })}`,
  );
  const selected = input.isSelected ? ', selected' : '';
  const problems = input.problems.length === 0 ? '' : `. ${input.problems.join(' ')}`;
  return `Key ${input.keyIndex} at ${key.xU}, ${key.yU}. ${pins.join('. ')}${selected}${problems}`;
}

export function formatWireEnd(project: Project, end: WireEnd): string {
  switch (end.kind) {
    case 'key-pin': {
      const keyIndex = project.keys.findIndex((key) => key.id === end.keyId);
      return `key ${keyIndex} pin ${end.pin}`;
    }
    case 'junction': {
      return `wire ${project.wires.findIndex((wire) => wire.id === end.wireId)}`;
    }
    case 'free': {
      return end.boardPin === undefined
        ? 'a free end'
        : `board pin ${formatBoardPin(end.boardPin)}`;
    }
    default: {
      return assertNever(end);
    }
  }
}

export function formatWireLabel(project: Project, input: { readonly wireIndex: number }): string {
  const wire = project.wires[input.wireIndex];
  if (wire === undefined) {
    return `Wire ${input.wireIndex}`;
  }
  return `Wire ${input.wireIndex} from ${formatWireEnd(project, wire.start)} to ${formatWireEnd(project, wire.end)}`;
}

export function formatCrossingLabel(project: Project, crossing: Crossing): string {
  const [first, second] = crossing.ref.wireIds.map((wireId) =>
    project.wires.findIndex((wire) => wire.id === wireId),
  );
  const state = crossing.isInsulated ? 'insulated' : 'connected';
  return `Crossing of wire ${first} and wire ${second}, ${state}`;
}
