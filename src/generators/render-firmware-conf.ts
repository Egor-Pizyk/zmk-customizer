import type { Project } from '@domain';
import { getFirmwareDefault } from '@domain/firmware';
import type { FirmwareOption, FirmwareValue } from '@domain/firmware';
import { FIRMWARE_OPTIONS } from '@catalog/firmware';
import { getControllerBoard } from '@catalog/controllers';

function renderValue(option: FirmwareOption, value: FirmwareValue): string {
  if (option.kind === 'enum') {
    const choice = option.choices.find((entry) => entry.value === value);
    return choice === undefined ? '' : `${choice.symbol}=y`;
  }
  if (typeof value === 'boolean') {
    return `${option.id}=${value ? 'y' : 'n'}`;
  }
  if (typeof value === 'string') {
    return `${option.id}="${value.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`)}"`;
  }
  return `${option.id}=${value}`;
}

export function renderFirmwareConf(
  project: Project,
  input: { readonly half?: 'central' | 'peripheral' } = {},
): string {
  const board = getControllerBoard(project.controllerId);
  const options: readonly FirmwareOption[] = FIRMWARE_OPTIONS;
  const lines = options
    .flatMap((option) => {
      const value = project.firmware[option.id];
      if (value === undefined || value === getFirmwareDefault(project, { option, board })) {
        return [];
      }
      if (input.half === 'peripheral' && option.centralOnly === true) {
        return [];
      }
      return [renderValue(option, value)];
    })
    .toSorted();
  return lines.length === 0
    ? '# No user settings; use ZMK v0.3 defaults.\n'
    : `${lines.join('\n')}\n`;
}
