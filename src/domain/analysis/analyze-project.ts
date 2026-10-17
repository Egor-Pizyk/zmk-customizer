import { deriveShieldMatrix, getWiringCells } from '@domain/wiring/matrix';
import type { ShieldTarget } from '@domain/wiring/matrix';
import { findCrossings } from '@domain/crossings';
import { findWireContacts } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import type { ControllerBoard, Project } from '@domain';
import { validateSchematic } from '@domain/validation';
import type { BindingsCatalog } from '@domain/validation';
import { validateShieldProject } from '@domain/validation/shield';

export function analyzeProject(
  project: Project,
  input: {
    readonly bindingsCatalog: BindingsCatalog;
    readonly board: ControllerBoard;
    readonly target: ShieldTarget;
  },
) {
  const contacts = findWireContacts(project);
  const nets = getNets(project, contacts);
  const schematicIssues = validateSchematic(project, nets);
  const matrix = deriveShieldMatrix(project, input.target, { nets, schematicIssues });
  const issues = validateShieldProject(project, { ...input, nets, matrix, schematicIssues });
  return {
    project,
    wiringCells: getWiringCells(project, nets),
    contacts,
    crossings: findCrossings(project, contacts),
    nets,
    matrix,
    issues,
  };
}
