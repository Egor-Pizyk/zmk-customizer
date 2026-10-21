import { getWirePinContacts } from '@domain/wires/geometry';
import type { Project } from '@domain';
import { getWireSections } from '@domain/wires';

export function getWiringProposalSummary(before: Project, after: Project) {
  const oldSections = getWireSections(before);
  const sections = getWireSections(after);
  const matches = (one: (typeof sections)[number], other: (typeof sections)[number]) =>
    one.wireId === other.wireId && JSON.stringify(one.path) === JSON.stringify(other.path);
  const retained = sections.filter((section) =>
    oldSections.some((other) => matches(section, other)),
  );
  const changedWires = after.wires.filter(
    (wire) =>
      JSON.stringify(wire) !== JSON.stringify(before.wires.find((entry) => entry.id === wire.id)),
  );
  return {
    retained: retained.length,
    added: sections.filter((section) => !before.wires.some((wire) => wire.id === section.wireId))
      .length,
    rerouted: sections.filter(
      (section) =>
        before.wires.some((wire) => wire.id === section.wireId) && !retained.includes(section),
    ).length,
    removed: oldSections.filter((section) => !sections.some((other) => matches(section, other)))
      .length,
    keyIds: getChangedKeyIds(after, changedWires),
    terminalIds:
      after.wiring?.terminals
        .filter(
          (terminal) =>
            JSON.stringify(terminal) !==
            JSON.stringify(before.wiring?.terminals.find((entry) => entry.id === terminal.id)),
        )
        .map((terminal) => terminal.id) ?? [],
  };
}

function getChangedKeyIds(project: Project, changedWires: Project['wires']) {
  return [
    ...new Set(
      changedWires.flatMap((wire) =>
        [wire.start, wire.end, ...getWirePinContacts(project, wire)].flatMap((end) =>
          'keyId' in end ? [end.keyId] : [],
        ),
      ),
    ),
  ];
}
