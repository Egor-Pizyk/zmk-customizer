import { getControllerBoard } from '@catalog/controllers';
import type { FirmwareOption } from '@domain/firmware';
import {
  getFirmwareDefault,
  getFirmwareValue,
  resetFirmwareOption,
  setFirmwareOption,
} from '@domain/firmware';
import { useProject } from '@ui/project/logic';
import { FirmwareOptionField } from './firmware-option-field';

export function FirmwareSetting({ option }: { readonly option: FirmwareOption }) {
  const { project, commit, issues } = useProject();
  const board = getControllerBoard(project.controllerId);
  return (
    <FirmwareOptionField
      option={option}
      value={getFirmwareValue(project, { option, board })}
      defaultValue={getFirmwareDefault(project, { option, board })}
      error={
        issues.find((issue) => issue.path[0] === 'firmware' && issue.path[1] === option.id)?.message
      }
      isOverridden={Object.hasOwn(project.firmware, option.id)}
      onCommit={(value) => {
        commit(
          (latest) =>
            setFirmwareOption(latest, {
              option,
              value,
              board: getControllerBoard(latest.controllerId),
            }),
          `Changed ${option.label}`,
        );
      }}
      onReset={() => {
        commit((latest) => resetFirmwareOption(latest, option.id), `Reset ${option.label}`);
      }}
    />
  );
}
