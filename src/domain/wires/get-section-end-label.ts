import type { Project, Wire, WirePoint } from '@domain';
import { getKeyPinPosition, getWirePath, getWirePinContacts } from '@domain/wires/geometry';

export function createSectionEndLabel(project: Project, wire: Wire) {
  const labels = new Map<string, string[]>();
  const keys = new Map(project.keys.map((key, index) => [key.id, { key, index }]));
  for (const end of [wire.start, wire.end, ...getWirePinContacts(project, wire)]) {
    if (!('keyId' in end)) {
      continue;
    }
    const found = keys.get(end.keyId);
    if (found === undefined) {
      continue;
    }
    const at = getKeyPinPosition(found.key, end.pin);
    const identity = JSON.stringify(at);
    const names = labels.get(identity) ?? [];
    names.push(`Key ${found.index} pin ${end.pin}`);
    labels.set(identity, names);
  }
  const path = getWirePath(project, wire);
  for (const [index, end] of [wire.start, wire.end].entries()) {
    const at = index === 0 ? path[0] : path.at(-1);
    if (end.kind !== 'free' || at === undefined) {
      continue;
    }
    const terminal = project.wiring?.terminals.find((entry) => entry.id === end.terminalId);
    if (terminal !== undefined) {
      labels.set(JSON.stringify(at), [`${terminal.half} ${terminal.kind} ${terminal.id}`]);
    } else if (end.boardPin !== undefined) {
      labels.set(JSON.stringify(at), [`GPIO ${end.boardPin}`]);
    }
  }
  return (point: WirePoint) =>
    labels.get(JSON.stringify(point))?.join(', ') ?? `${point.xU}, ${point.yU}`;
}
