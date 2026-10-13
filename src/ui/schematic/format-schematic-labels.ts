import { getKeyGeometry, assertNever, formatBoardPin } from '@domain';
import type { getKeyPinWires, Crossing, KeyPin, Project, WireEnd } from '@domain';

const KEY_PINS: readonly KeyPin[] = [1, 2];

export type WiresOfPin = ReturnType<typeof getKeyPinWires>;

function formatPinConnections(
  wiresOf: WiresOfPin,
  input: { readonly keyId: string; readonly pin: KeyPin },
) {
  const wireIndices = wiresOf(input);
  if (wireIndices.length === 0) {
    return 'not connected';
  }
  return wireIndices.length === 1
    ? `wire ${wireIndices.join('')}`
    : `wires ${wireIndices.join(', ')}`;
}

// Key names start with "Key N" (accessibility.md "SVG"); problems follow so they are heard.
// `wiresOf` is built once per render by the caller (perf: one lookup per project, not per key).
export function formatKeyLabel(
  project: Project,
  input: {
    readonly keyIndex: number;
    readonly isSelected: boolean;
    readonly problems: readonly string[];
    readonly wiresOf: WiresOfPin;
  },
): string {
  const key = project.keys[input.keyIndex];
  if (key === undefined) {
    return `Key ${input.keyIndex}`;
  }
  const pins = KEY_PINS.map(
    (pin) => `Pin ${pin}: ${formatPinConnections(input.wiresOf, { keyId: key.id, pin })}`,
  );
  const diode =
    key.diode === undefined
      ? ''
      : `. Diode at pin ${key.diode.pin}, cathode ${key.diode.cathode === 'away-switch' ? 'away from' : 'toward'} switch`;
  const selected = input.isSelected ? ', selected' : '';
  const problems = input.problems.length === 0 ? '' : `. ${input.problems.join(' ')}`;
  const geometry = getKeyGeometry(key);
  const shape =
    geometry.widthU === 1 && geometry.heightU === 1 && geometry.rotationDeg === 0
      ? ''
      : `, ${geometry.widthU}u × ${geometry.heightU}u, rotated ${geometry.rotationDeg}° around ${geometry.rotationOriginXU}, ${geometry.rotationOriginYU}u`;
  return `Key ${input.keyIndex} at ${key.xU}, ${key.yU}${shape}. ${pins.join('. ')}${diode}${selected}${problems}`;
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
      const terminal = project.wiring?.terminals.find((entry) => entry.id === end.terminalId);
      if (terminal !== undefined) {
        const pinLabel =
          terminal.boardPin === undefined ? 'unassigned' : formatBoardPin(terminal.boardPin);
        return `${terminal.half} ${terminal.kind} ${terminal.id}: ${terminal.kind === 'ground' ? 'GND' : pinLabel}`;
      }
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
