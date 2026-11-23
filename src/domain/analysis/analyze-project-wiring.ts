import { createBoardPinUserLookup } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import { getWiringCells } from '@domain/wiring/matrix';
import type { WireContacts } from '@domain/wires/contacts';
import type { Project } from '@domain';

export function analyzeProjectWiring(project: Project, contacts: WireContacts) {
  const nets = getNets(project, contacts);
  return {
    nets,
    wiringCells: getWiringCells(project, nets),
    boardPinUsers: createBoardPinUserLookup(project),
  };
}
