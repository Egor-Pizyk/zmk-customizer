import type { ControllerBoard, Project } from '@domain';
import type { FirmwareOption, FirmwareValue } from './firmware-option';

export function getFirmwareDefault(
  project: Project,
  input: { readonly option: FirmwareOption; readonly board: Pick<ControllerBoard, 'ble'> },
): FirmwareValue {
  if (
    input.option.kind === 'bool' &&
    input.option.defaultRequires !== undefined &&
    project.firmware[input.option.defaultRequires] === false
  ) {
    return false;
  }
  return input.option.kind === 'bool' && input.option.boardDefault === 'ble'
    ? input.board.ble
    : input.option.default;
}
