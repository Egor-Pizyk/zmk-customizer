import { assertNever } from '@domain';
import type { ControllerBoard, Project, ValidationIssue } from '@domain';
import type { FirmwareOption, FirmwareValue } from './firmware-option';
import { getFirmwareDefault } from './get-firmware-default';
import { getFirmwareValue } from './get-firmware-value';

function describeInvalidValue(option: FirmwareOption, value: FirmwareValue): string | undefined {
  switch (option.kind) {
    case 'bool': {
      return typeof value === 'boolean' ? undefined : 'Choose on or off.';
    }
    case 'int': {
      return typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= option.min &&
        value <= option.max
        ? undefined
        : `Enter a whole number from ${option.min} to ${option.max} ${option.unit}.`;
    }
    case 'enum': {
      return option.choices.some((choice) => choice.value === value)
        ? undefined
        : 'Choose a supported value from the list.';
    }
    case 'string': {
      return typeof value === 'string' &&
        value.length > 0 &&
        value.isWellFormed() &&
        !/[\p{Cc}]/u.test(value) &&
        new TextEncoder().encode(value).length <= option.maxBytes
        ? undefined
        : `Enter one line of text, 1–${option.maxBytes} UTF-8 bytes, without control characters.`;
    }
    default: {
      return assertNever(option);
    }
  }
}

export function validateFirmware(
  project: Project,
  input: {
    readonly options: readonly FirmwareOption[];
    readonly board: Pick<ControllerBoard, 'ble'>;
  },
): readonly ValidationIssue[] {
  return Object.entries(project.firmware).flatMap(([id, value]) => {
    const option = input.options.find((entry) => entry.id === id);
    const issue = (message: string): ValidationIssue[] => [
      { code: 'firmware-option-invalid', path: ['firmware', id], message },
    ];
    if (option === undefined) {
      return issue(`${id} is unsupported by ZMK v0.3. Reset this setting.`);
    }
    const invalid = describeInvalidValue(option, value);
    if (invalid !== undefined) {
      return issue(`${option.label}: ${invalid}`);
    }
    if (value === getFirmwareDefault(project, { option, board: input.board })) {
      return [];
    }
    if (option.availability !== undefined && !input.board.ble) {
      return issue(`${option.label} requires a BLE board. Reset it or select a supported board.`);
    }
    if (option.availability === 'split' && project.wiring?.topology !== 'split') {
      return issue(
        `${option.label} requires a split keyboard. Reset it or configure split wiring.`,
      );
    }
    if (option.kind === 'bool' && value === false) {
      return [];
    }
    const missing = findMissingRequirement(project, { ...input, option });
    return missing === undefined
      ? []
      : issue(`${option.label} requires ${missing.label}. Enable it or reset ${option.label}.`);
  });
}

function findMissingRequirement(
  project: Project,
  input: {
    readonly option: FirmwareOption;
    readonly options: readonly FirmwareOption[];
    readonly board: Pick<ControllerBoard, 'ble'>;
  },
) {
  return input.option.requires?.find((requirement) => {
    const prerequisite = input.options.find((entry) => entry.id === requirement.id);
    return (
      prerequisite === undefined ||
      getFirmwareValue(project, { option: prerequisite, board: input.board }) !== requirement.value
    );
  });
}
