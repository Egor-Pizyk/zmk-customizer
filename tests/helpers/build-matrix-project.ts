import { findCrossings } from '../../src/domain/find-crossings';
import { getKeyPinPosition } from '../../src/domain/get-key-pin-position';
import type { Key, KeyDiode, KeyPin, Project, Wire, WireEnd } from '../../src/domain/types';
import { buildProject } from './build-project';

const DEFAULT_DIODE = { pin: 1, cathode: 'away-switch' } as const;

// Edges are GPIO pairs; routes share a trunk per GPIO and insulate geometric crossings.
export function buildMatrixProject(
  pairs: readonly (readonly [number, number])[] = [
    [2, 8],
    [2, 9],
    [6, 8],
    [6, 9],
  ],
  diode: KeyDiode = DEFAULT_DIODE,
  positions?: readonly { readonly xU: number; readonly yU: number }[],
): Project {
  const keys: Key[] = pairs.map((_, keyIndex) => ({
    id: `k${keyIndex}`,
    xU: positions?.[keyIndex]?.xU ?? keyIndex * 4,
    yU: positions?.[keyIndex]?.yU ?? keyIndex * 4,
    diode,
  }));
  const boardPins = [...new Set(pairs.flat())].toSorted((left, right) => left - right);
  const wires: Wire[] = [];
  for (const [keyIndex, pair] of pairs.entries()) {
    const key = keys[keyIndex];
    if (key === undefined) {
      throw new Error('Missing test key');
    }
    for (const keyPin of [1, 2] as const) {
      const boardPin = pair[keyPin - 1];
      if (boardPin === undefined) {
        throw new Error('Missing test pin');
      }
      wires.push(buildWire({ key, keyPin, boardPin, boardPins, wires }));
    }
  }
  const project = buildProject({ keys, wires });
  return { ...project, insulatedCrossings: findCrossings(project).map((crossing) => crossing.ref) };
}

export function withKeyDiode(
  project: Project,
  input: { readonly keyIndex: number; readonly diode?: KeyDiode },
): Project {
  return {
    ...project,
    keys: project.keys.map((key, keyIndex) => {
      if (keyIndex !== input.keyIndex) {
        return key;
      }
      const { diode: _diode, ...withoutDiode } = key;
      return input.diode === undefined ? withoutDiode : { ...withoutDiode, diode: input.diode };
    }),
  };
}

export function swapKeyPins(project: Project): Project {
  const swapped = {
    ...project,
    wires: project.wires.map((wire) => ({ ...wire, start: swap(wire.start), end: swap(wire.end) })),
  };
  return { ...swapped, insulatedCrossings: findCrossings(swapped).map((crossing) => crossing.ref) };
}

function buildWire(input: {
  readonly key: Key;
  readonly keyPin: KeyPin;
  readonly boardPin: number;
  readonly boardPins: readonly number[];
  readonly wires: readonly Wire[];
}): Wire {
  const { key, keyPin, boardPin, boardPins, wires } = input;
  const netIndex = boardPins.indexOf(boardPin);
  const at = { xU: -4 - netIndex * 2, yU: -4 - netIndex * 2 };
  const anchor = wires.find((wire) => wire.end.kind === 'free' && wire.end.boardPin === boardPin);
  const end: WireEnd =
    anchor === undefined
      ? { kind: 'free', at, boardPin }
      : { kind: 'junction', wireId: anchor.id, at };
  const pinPosition = getKeyPinPosition(key, keyPin);
  return {
    id: `w${wires.length}`,
    start: { kind: 'key-pin', keyId: key.id, pin: keyPin },
    end,
    bends: [{ xU: at.xU, yU: pinPosition.yU }],
  };
}

function swap(end: WireEnd): WireEnd {
  if (end.kind !== 'key-pin') {
    return end;
  }
  const pin: KeyPin = end.pin === 1 ? 2 : 1;
  return { ...end, pin };
}
