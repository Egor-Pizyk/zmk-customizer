import type { Encoder, Project } from '@domain';
import { getNets } from '@domain/wires/nets';
import type { Net } from '@domain/wires/nets';
import { getWireHalf } from '@domain/wires/geometry';

function channel(net: Net | undefined): number | undefined {
  const pins = [...new Set(net?.boardPins.map((pin) => pin.boardPin))];
  return pins.length === 1 ? pins[0] : undefined;
}

function isGround(project: Project, net: Net | undefined): boolean {
  if (net === undefined) {
    return false;
  }
  const terminalGround = net.terminalIds.some(
    (id) =>
      project.wiring?.terminals.some(
        (terminal) => terminal.id === id && terminal.kind === 'ground',
      ) === true,
  );
  return (
    terminalGround ||
    project.wires.some(
      (wire) =>
        net.wireIds.includes(wire.id) &&
        [wire.start, wire.end].some((end) => end.kind === 'free' && end.ground === true),
    )
  );
}

function hasForeignSignal(project: Project, net: Net | undefined, encoder: Encoder): boolean {
  if (net === undefined) {
    return false;
  }
  return (
    net.pins.length > 0 ||
    net.terminalIds.length > 0 ||
    net.encoderPins?.some((pin) => pin.encoderId !== encoder.id) === true ||
    isGround(project, net) ||
    net.boardPins.length > 1
  );
}

function hasWrongHalf(project: Project, net: Net, encoder: Encoder): boolean {
  return (
    net.wireIds.some((id) => {
      const wire = project.wires.find((entry) => entry.id === id);
      return wire !== undefined && getWireHalf(project, wire) !== encoder.half;
    }) ||
    net.terminalIds.some(
      (id) =>
        project.wiring?.terminals.some(
          (terminal) => terminal.id === id && terminal.half !== encoder.half,
        ) === true,
    ) ||
    net.pins.some((pin) =>
      project.keys.some((key) => key.id === pin.keyId && (key.half ?? 'left') !== encoder.half),
    )
  );
}

function hasReusedPin(
  project: Project,
  input: { readonly nets: readonly Net[]; readonly net: Net; readonly encoder: Encoder },
): boolean {
  const { nets, net, encoder } = input;
  const pin = channel(net);
  return (
    pin !== undefined &&
    nets.some(
      (other) =>
        other !== net &&
        other.boardPins.some((entry) => entry.boardPin === pin) &&
        other.wireIds.some((id) => {
          const wire = project.wires.find((entry) => entry.id === id);
          return wire !== undefined && getWireHalf(project, wire) === encoder.half;
        }),
    )
  );
}

export function getEncoderConnections(
  project: Project,
  encoder: Encoder,
  nets: readonly Net[] = getNets(project),
) {
  const contactNet = (pin: 'A' | 'COM' | 'B') =>
    nets.find(
      (net) =>
        net.encoderPins?.some(
          (contact) => contact.encoderId === encoder.id && contact.pin === pin,
        ) === true,
    );
  const aNet = contactNet('A');
  const bNet = contactNet('B');
  const common = contactNet('COM');
  const joined =
    (aNet !== undefined && (aNet === bNet || aNet === common)) ||
    (bNet !== undefined && bNet === common);
  const signalConflict = [aNet, bNet].some(
    (net) =>
      hasForeignSignal(project, net, encoder) ||
      (net !== undefined && hasReusedPin(project, { nets, net, encoder })),
  );
  const wrongHalf = [aNet, bNet, common].some(
    (net) => net !== undefined && hasWrongHalf(project, net, encoder),
  );
  return {
    aPin: channel(aNet),
    bPin: channel(bNet),
    hasGround: isGround(project, common),
    hasConflict:
      joined ||
      signalConflict ||
      wrongHalf ||
      (common?.boardPins.length ?? 0) > 0 ||
      (channel(aNet) !== undefined && channel(aNet) === channel(bNet)),
  };
}

export function getEncoderOutputPins(project: Project, encoder: Encoder) {
  return encoder.wiringMode === 'schematic'
    ? getEncoderConnections(project, encoder)
    : { aPin: encoder.aPin, bPin: encoder.bPin };
}
