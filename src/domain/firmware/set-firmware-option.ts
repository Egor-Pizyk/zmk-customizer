import type { ControllerBoard, Project } from '@domain';
import type { FirmwareOption, FirmwareValue } from './firmware-option';
import { getFirmwareDefault } from './get-firmware-default';
import { resetFirmwareOption } from './reset-firmware-option';

export function setFirmwareOption(
  project: Project,
  input: {
    readonly option: FirmwareOption;
    readonly value: FirmwareValue;
    readonly board: Pick<ControllerBoard, 'ble'>;
  },
): Project {
  if (input.value === getFirmwareDefault(project, input)) {
    return resetFirmwareOption(project, input.option.id);
  }
  if (project.firmware[input.option.id] === input.value) {
    return project;
  }
  return { ...project, firmware: { ...project.firmware, [input.option.id]: input.value } };
}
