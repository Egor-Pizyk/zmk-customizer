import { getEncoderPinPosition } from '@domain/geometry';
import { getKeyPinPosition, getWireConductors, getWirePinContacts } from '@domain/wires/geometry';
import type { Encoder, Project, Wire, WirePoint } from '@domain';
import type { WireContacts } from '@domain/wires/contacts';

type Span = { axis: 'xU' | 'yU'; line: number; from: number; to: number };

export function getWireProtectionSnapshot(project: Project, wire: Wire, contacts: WireContacts) {
  return {
    wire,
    pins: getPins(project, wire),
    encoderPins: getEncoderPins(project, wire),
    conductors: getWireConductors(project, wire),
    board: isBoardConnection(wire) ? project.controllerId : undefined,
    terminals: [wire.start, wire.end].flatMap((end) =>
      end.kind === 'free' && end.terminalId !== undefined
        ? [project.wiring?.terminals.find((terminal) => terminal.id === end.terminalId)]
        : [],
    ),
    junctions: getIncomingJunctions(project, wire),
    crossings: getCrossings(project, wire, contacts),
    overlaps: getOverlaps(project, wire, contacts),
  };
}

function isBoardConnection(wire: Wire): boolean {
  return [wire.start, wire.end].some(
    (end) =>
      end.kind === 'encoder-pin' ||
      (end.kind === 'free' &&
        (end.terminalId !== undefined || end.boardPin !== undefined || end.ground === true)),
  );
}

function getPins(project: Project, wire: Wire) {
  return [wire.start, wire.end, ...getWirePinContacts(project, wire)].flatMap((end) => {
    if (!('keyId' in end)) {
      return [];
    }
    const key = project.keys.find((entry) => entry.id === end.keyId);
    return [
      {
        keyId: end.keyId,
        pin: end.pin,
        half: key?.half ?? 'left',
        diode: key?.diode,
        at: key === undefined ? undefined : getKeyPinPosition(key, end.pin),
      },
    ];
  });
}

function getEncoderPins(project: Project, wire: Wire) {
  return [wire.start, wire.end].flatMap((end) => {
    if (end.kind !== 'encoder-pin') {
      return [];
    }
    const encoder = project.encoders.find((entry) => entry.id === end.encoderId);
    return [
      {
        id: end.encoderId,
        pin: end.pin,
        half: encoder?.half,
        mode: encoder?.wiringMode,
        boardPin: findEncoderBoardPin(encoder, end.pin),
        at: encoder === undefined ? undefined : getEncoderPinPosition(project, encoder, end.pin),
      },
    ];
  });
}

function findEncoderBoardPin(encoder: Encoder | undefined, pin: 'A' | 'COM' | 'B') {
  const pins = { A: encoder?.aPin, B: encoder?.bPin, COM: undefined };
  return pins[pin];
}

function getIncomingJunctions(project: Project, wire: Wire) {
  return project.wires
    .flatMap((entry) =>
      (['start', 'end'] as const).flatMap((side) => {
        const end = entry[side];
        return end.kind === 'junction' && end.wireId === wire.id
          ? [{ wireId: entry.id, side, at: end.at }]
          : [];
      }),
    )
    .toSorted((first, second) =>
      compareNames({
        first: `${first.wireId}:${first.side}`,
        second: `${second.wireId}:${second.side}`,
      }),
    );
}

function getCrossings(project: Project, wire: Wire, contacts: WireContacts) {
  return contacts.crossings
    .filter(
      (crossing) =>
        crossing.wireIds.includes(wire.id) &&
        !project.insulatedCrossings.some(
          (ref) =>
            ref.wireIds[0] === crossing.wireIds[0] &&
            ref.wireIds[1] === crossing.wireIds[1] &&
            ref.ordinal === crossing.ordinal,
        ),
    )
    .map((crossing) => ({ wireIds: crossing.wireIds, at: crossing.at }))
    .toSorted((first, second) =>
      compareNames({ first: JSON.stringify(first), second: JSON.stringify(second) }),
    );
}

function getOverlaps(project: Project, wire: Wire, contacts: WireContacts) {
  return contacts.overlaps
    .filter((pair) => pair.includes(wire.id))
    .flatMap((pair) => {
      const peer = project.wires.find((entry) => pair.includes(entry.id) && entry.id !== wire.id);
      return peer === undefined
        ? []
        : [{ wireId: peer.id, spans: getOverlapSpans(project, { wire, peer }) }];
    })
    .toSorted((first, second) => compareNames({ first: first.wireId, second: second.wireId }));
}

function compareNames({ first, second }: { first: string; second: string }): number {
  if (first < second) {
    return -1;
  }
  return first > second ? 1 : 0;
}

function getSegments(project: Project, wire: Wire) {
  return getWireConductors(project, wire).flatMap((path) =>
    path.slice(1).map((to, index) => ({ from: path[index] ?? to, to })),
  );
}

function getOverlapSpans(project: Project, { wire, peer }: { wire: Wire; peer: Wire }): Span[] {
  const spans: Span[] = [];
  for (const first of getSegments(project, wire)) {
    for (const second of getSegments(project, peer)) {
      const span = findOverlap({ first, second });
      if (span !== undefined) {
        spans.push(span);
      }
    }
  }
  const ordered = spans.toSorted((first, second) => compareSpans({ first, second }));
  const merged: Span[] = [];
  for (const span of ordered) {
    const previous = merged.at(-1);
    if (
      previous !== undefined &&
      previous.axis === span.axis &&
      previous.line === span.line &&
      span.from <= previous.to
    ) {
      merged[merged.length - 1] = { ...previous, to: Math.max(previous.to, span.to) };
      continue;
    }
    merged.push(span);
  }
  return merged;
}

function compareSpans({ first, second }: { first: Span; second: Span }): number {
  if (first.axis !== second.axis) {
    return compareNames({ first: first.axis, second: second.axis });
  }
  return first.line - second.line || first.from - second.from || first.to - second.to;
}

function findOverlap({
  first,
  second,
}: {
  first: { from: WirePoint; to: WirePoint };
  second: { from: WirePoint; to: WirePoint };
}): Span | undefined {
  const horizontal = first.from.yU === first.to.yU;
  if (horizontal !== (second.from.yU === second.to.yU)) {
    return undefined;
  }
  const axis = horizontal ? 'xU' : 'yU';
  const cross = horizontal ? 'yU' : 'xU';
  if (first.from[cross] !== second.from[cross]) {
    return undefined;
  }
  const from = Math.max(
    Math.min(first.from[axis], first.to[axis]),
    Math.min(second.from[axis], second.to[axis]),
  );
  const to = Math.min(
    Math.max(first.from[axis], first.to[axis]),
    Math.max(second.from[axis], second.to[axis]),
  );
  return from < to ? { axis, line: first.from[cross], from, to } : undefined;
}
