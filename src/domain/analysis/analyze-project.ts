import { validateProjectConfiguration } from './validate-project-configuration';
import { validateAdvancedKeymap } from '@domain/advanced-keymap';
import { validateBehaviors } from '@domain/behaviors';
import type { ProjectConfigurationInput } from './validate-project-configuration';
import { deriveShieldMatrix, getWiringCells } from '@domain/wiring/matrix';
import type { ShieldTarget } from '@domain/wiring/matrix';
import { findCrossings } from '@domain/crossings';
import { findWireContacts } from '@domain/wires';
import { getNets } from '@domain/wires/nets';
import type { Project } from '@domain';
import { validateSchematic } from '@domain/validation';
import { validateShieldProject } from '@domain/validation/shield';

export function analyzeProject(
  project: Project,
  input: ProjectConfigurationInput & { readonly target: ShieldTarget },
) {
  const contacts = findWireContacts(project);
  const nets = getNets(project, contacts);
  const schematicIssues = validateSchematic(project, nets);
  const matrix = deriveShieldMatrix(project, input.target, { nets, schematicIssues });
  const issues = [
    ...validateProjectConfiguration(project, input),
    ...validateAdvancedKeymap(project, input.bindingsCatalog),
    ...validateBehaviors(project, input.bindingsCatalog),
    ...validateShieldProject(project, { ...input, nets, matrix, schematicIssues }),
  ];
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
