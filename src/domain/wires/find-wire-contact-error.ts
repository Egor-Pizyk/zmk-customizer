import { getWirePinContacts, getWirePath } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';

export function findWireContactError(project: Project, wire: Wire): string | undefined {
  if (getWirePinContacts(project, wire).length === 0) {
    return undefined;
  }
  const anchors = wire.anchors;
  if (anchors === undefined) {
    return 'Intermediate pin contacts need fixed spine anchors.';
  }
  const spine = getWirePath(project, {
    ...wire,
    start: { kind: 'free', at: anchors.start },
    end: { kind: 'free', at: anchors.end },
  });
  const missing = getWirePinContacts(project, wire).some(
    ({ at }) =>
      !spine.some((from, index) => {
        const to = spine[index + 1] ?? from;
        return (
          at.xU >= Math.min(from.xU, to.xU) - 0.0001 &&
          at.xU <= Math.max(from.xU, to.xU) + 0.0001 &&
          at.yU >= Math.min(from.yU, to.yU) - 0.0001 &&
          at.yU <= Math.max(from.yU, to.yU) + 0.0001
        );
      }),
  );
  return missing ? 'An intermediate pin contact is not on its conductor spine.' : undefined;
}
