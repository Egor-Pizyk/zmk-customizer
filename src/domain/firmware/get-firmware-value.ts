import type { ControllerBoard, Project } from '@domain';
import type { FirmwareOption, FirmwareValue } from './firmware-option';
import { getFirmwareDefault } from './get-firmware-default';

export function getFirmwareValue(
  project: Project,
  input: { readonly option: FirmwareOption; readonly board: Pick<ControllerBoard, 'ble'> },
): FirmwareValue {
  return project.firmware[input.option.id] ?? getFirmwareDefault(project, input);
}
