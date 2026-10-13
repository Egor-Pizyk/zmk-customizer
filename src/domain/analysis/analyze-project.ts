import { deriveShieldMatrix } from './derive-shield-matrix';
import type { ShieldTarget } from './derive-shield-matrix';
import { findCrossings } from '../crossings/find-crossings';
import { findWireContacts } from '../wires/find-wire-contacts';
import { getNets } from './get-nets';
import type { ControllerBoard, Project } from '../types';
import type { BindingsCatalog } from '../validation/validate-bindings';
import { validateSchematic } from '../validation/validate-schematic';
import { validateShieldProject } from '../validation/validate-shield-project';

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
  return { project, contacts, crossings: findCrossings(project, contacts), nets, matrix, issues };
}
