import type { ControllerBoard, Project, ValidationIssue } from '@domain';
import { validateFirmware } from '@domain/firmware';
import type { FirmwareOption } from '@domain/firmware';
import { validateEncoders } from '@domain/encoders';
import type { BindingsCatalog } from '@domain/validation';

export type ProjectConfigurationInput = {
  readonly board: ControllerBoard;
  readonly firmwareOptions: readonly FirmwareOption[];
  readonly bindingsCatalog: BindingsCatalog;
};
export function validateProjectConfiguration(
  project: Project,
  input: ProjectConfigurationInput,
): readonly ValidationIssue[] {
  return [
    ...validateFirmware(project, { options: input.firmwareOptions, board: input.board }),
    ...validateEncoders(project, { board: input.board, catalog: input.bindingsCatalog }),
  ];
}
