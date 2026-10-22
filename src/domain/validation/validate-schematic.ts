import { getWireHalf } from '@domain/wiring';
import { validateNetsWithoutBoardPin } from './validate-nets-without-board-pin';
import { formatBoardPin, getKeyPinWires } from '@domain/wires';
import { getKeyPinPosition } from '@domain/wires/geometry';
import { getNets } from '@domain/wires/nets';
import type { Net, NetBoardPin } from '@domain/wires/nets';
import { isKeyPositionFree } from '@domain/geometry';
import type { KeyPin, Project, ValidationIssue } from '@domain';

const KEY_PINS: readonly KeyPin[] = [1, 2];

function validateKeyOverlaps(project: Project): ValidationIssue[] {
  return project.keys.flatMap((key, keyIndex) => {
    const otherIndex = project.keys.findIndex(
      (other) =>
        other.id !== key.id &&
        !isKeyPositionFree({ ...project, keys: [other] }, { position: key, key }),
    );
    return otherIndex === -1
      ? []
      : [
          {
            code: 'key-overlap',
            message: `Key ${keyIndex} overlaps key ${otherIndex}. Move one of them.`,
            path: ['keys', keyIndex],
          },
        ];
  });
}

function validateUnconnectedPins(project: Project): ValidationIssue[] {
  const wiresOf = getKeyPinWires(project);
  return project.keys.flatMap((key, keyIndex) =>
    KEY_PINS.filter((pin) => wiresOf({ keyId: key.id, pin }).length === 0).map((pin) => ({
      code: 'key-pin-unconnected',
      message: `Key ${keyIndex}, pin ${pin} is not connected. Draw a wire from it.`,
      path: ['keys', keyIndex, 'pins', pin],
    })),
  );
}

function validateFreeEnds(project: Project): ValidationIssue[] {
  const pins = project.keys.flatMap((key) => KEY_PINS.map((pin) => getKeyPinPosition(key, pin)));
  return project.wires.flatMap((wire, wireIndex) =>
    (['start', 'end'] as const)
      .filter((side) => {
        const end = wire[side];
        return (
          end.kind === 'free' &&
          end.boardPin === undefined &&
          end.terminalId === undefined &&
          end.ground !== true &&
          !pins.some((pin) => Math.hypot(pin.xU - end.at.xU, pin.yU - end.at.yU) < 1e-4)
        );
      })
      .map((side) => ({
        code: 'wire-end-unconnected',
        message: `Wire ${wireIndex} has a free end that is not connected to anything. Connect it to a board pin or a key pin.`,
        path: ['wires', wireIndex, side],
      })),
  );
}

type Located = NetBoardPin & {
  readonly netIndex: number;
  readonly wireIndex: number;
  readonly half: string;
};

function locateBoardPins(project: Project, nets: readonly Net[]): Located[] {
  return nets
    .flatMap((net, netIndex) =>
      net.boardPins.map((entry) => ({
        ...entry,
        half: getWireHalf(
          project,
          project.wires.find((wire) => wire.id === entry.wireId) ?? {
            id: '',
            start: { kind: 'free', at: { xU: 0, yU: 0 } },
            end: { kind: 'free', at: { xU: 0, yU: 0 } },
            bends: [],
          },
        ),
        netIndex,
        wireIndex: project.wires.findIndex((wire) => wire.id === entry.wireId),
      })),
    )
    .toSorted(
      (first, second) => first.wireIndex - second.wireIndex || (first.side === 'start' ? -1 : 1),
    );
}

function validateBoardPinConflicts(located: readonly Located[]): ValidationIssue[] {
  return located.flatMap((entry) => {
    const firstOther = located.find(
      (other) =>
        other.half === entry.half &&
        other.boardPin === entry.boardPin &&
        other.netIndex !== entry.netIndex,
    );
    return firstOther === undefined
      ? []
      : [
          {
            code: 'board-pin-conflict',
            message: `Board pin ${formatBoardPin(entry.boardPin)} is used by wire ${entry.wireIndex} and wire ${firstOther.wireIndex}, which are not connected. Pick a different pin for one of them.`,
            path: ['wires', entry.wireIndex, entry.side, 'boardPin'],
          },
        ];
  });
}

function validateShortedBoardPins(located: readonly Located[]): ValidationIssue[] {
  return located.flatMap((entry) => {
    const pinsInNet = new Set(
      located.filter((other) => other.netIndex === entry.netIndex).map((other) => other.boardPin),
    );
    if (pinsInNet.size < 2) {
      return [];
    }
    const labels = [...pinsInNet]
      .toSorted((first, second) => first - second)
      .map((pin) => formatBoardPin(pin));
    return [
      {
        code: 'board-pins-shorted',
        message: `Wire ${entry.wireIndex} connects board pins ${labels.join(' and ')} together. Insulate a crossing or remove a wire.`,
        path: ['wires', entry.wireIndex, entry.side, 'boardPin'],
      },
    ];
  });
}

function validateShortedKeys(project: Project, nets: readonly Net[]): ValidationIssue[] {
  return project.keys.flatMap((key, keyIndex) => {
    const isShorted = nets.some(
      (net) =>
        net.pins.some((entry) => entry.keyId === key.id && entry.pin === 1) &&
        net.pins.some((entry) => entry.keyId === key.id && entry.pin === 2),
    );
    return isShorted
      ? [
          {
            code: 'key-shorted',
            message: `Key ${keyIndex} is shorted: both pins are on the same connection. Insulate a crossing or remove a wire.`,
            path: ['keys', keyIndex],
          },
        ]
      : [];
  });
}

function findNetIndex(nets: readonly Net[], keyId: string, pin: KeyPin): number {
  return nets.findIndex((net) =>
    net.pins.some((entry) => entry.keyId === keyId && entry.pin === pin),
  );
}

function validateParallelKeys(project: Project, nets: readonly Net[]): ValidationIssue[] {
  const pairByKeyId = new Map<string, string>();
  for (const key of project.keys) {
    const first = findNetIndex(nets, key.id, 1);
    const second = findNetIndex(nets, key.id, 2);
    if (first === -1 || second === -1 || first === second) {
      continue;
    }
    const pair = first < second ? `${first}:${second}` : `${second}:${first}`;
    pairByKeyId.set(key.id, pair);
  }
  const keyCountByPair = new Map<string, number>();
  for (const pair of pairByKeyId.values()) {
    keyCountByPair.set(pair, (keyCountByPair.get(pair) ?? 0) + 1);
  }
  return project.keys.flatMap((key, keyIndex) => {
    const pair = pairByKeyId.get(key.id);
    if (pair === undefined || (keyCountByPair.get(pair) ?? 0) < 2) {
      return [];
    }
    const otherIndex = project.keys.findIndex(
      (other, index) => index !== keyIndex && pairByKeyId.get(other.id) === pair,
    );
    return [
      {
        code: 'keys-in-parallel',
        message: `Key ${keyIndex} is in parallel with key ${otherIndex}: both share the same two connections, so the matrix cannot tell them apart. Rewire one of them.`,
        path: ['keys', keyIndex],
      },
    ];
  });
}

// Issue order: by code as in contracts/validation-issues.md, then by path (deterministic).
export function validateSchematic(
  project: Project,
  nets: readonly Net[] = getNets(project),
): readonly ValidationIssue[] {
  const located = locateBoardPins(project, nets);
  return [
    ...validateKeyOverlaps(project),
    ...validateUnconnectedPins(project),
    ...validateFreeEnds(project),
    ...validateBoardPinConflicts(located),
    ...validateShortedBoardPins(located),
    ...validateGroundShorts(project, nets),
    ...validateShortedKeys(project, nets),
    ...validateParallelKeys(project, nets),
    ...validateNetsWithoutBoardPin(
      project,
      nets.filter((net) => net.wireIds.length > 0),
    ),
  ];
}

function validateGroundShorts(project: Project, nets: readonly Net[]): ValidationIssue[] {
  return nets.flatMap((net) => {
    const hasGround =
      net.terminalIds.some(
        (id) =>
          project.wiring?.terminals.some(
            (terminal) => terminal.id === id && terminal.kind === 'ground',
          ) === true,
      ) ||
      project.wires.some(
        (wire) =>
          net.wireIds.includes(wire.id) &&
          [wire.start, wire.end].some((end) => end.kind === 'free' && end.ground === true),
      );
    const first = net.boardPins[0];
    if (!hasGround || first === undefined) {
      return [];
    }
    return [
      {
        code: 'board-pins-shorted',
        message: `GPIO ${first.boardPin} is connected to GND. Remove the short or insulate the crossing.`,
        path: [
          'wires',
          project.wires.findIndex((wire) => wire.id === first.wireId),
          first.side,
          'boardPin',
        ],
      },
    ];
  });
}
