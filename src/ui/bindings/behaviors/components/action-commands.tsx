import { BLUETOOTH_COMMANDS, OUTPUT_COMMANDS } from '@catalog/bindings';
import type { ActionEditorProps } from '@ui/bindings/behaviors/logic';
import { Field, NumberInput } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

export function ActionCommands(props: ActionEditorProps) {
  const { binding, label, onChange: handleChange } = props;
  if (binding.kind === 'out') {
    return (
      <OutputCommand {...{ binding, label, project: props.project, onChange: handleChange }} />
    );
  }
  if (binding.kind !== 'bt') {
    return null;
  }
  return (
    <>
      <Field
        label={`${label} Bluetooth command`}
        renderControl={(control) => (
          <select
            {...control}
            className={INPUT_CLASSES}
            value={binding.command}
            onChange={(event) => {
              handleBluetoothCommand(event.target.value, handleChange);
            }}
          >
            <BluetoothChoices />
          </select>
        )}
      />
      {'profile' in binding ? (
        <NumberInput
          label={`${label} Bluetooth profile`}
          value={binding.profile}
          step={1}
          onCommit={(profile) => {
            handleChange({ ...binding, profile });
          }}
        />
      ) : undefined}
    </>
  );
}

function OutputCommand({ binding, label, onChange: handleChange }: ActionEditorProps) {
  if (binding.kind === 'out') {
    return (
      <Field
        label={`${label} output`}
        renderControl={(control) => (
          <select
            {...control}
            className={INPUT_CLASSES}
            value={binding.command}
            onChange={(event) => {
              const entry = OUTPUT_COMMANDS.find((command) => command.id === event.target.value);
              if (entry !== undefined) {
                handleChange({ kind: 'out', command: entry.id });
              }
            }}
          >
            {OUTPUT_COMMANDS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        )}
      />
    );
  }
  return null;
}

function handleBluetoothCommand(value: string, onChange: ActionEditorProps['onChange']) {
  const entry = BLUETOOTH_COMMANDS.find((command) => command.id === value);
  if (entry === undefined) {
    return;
  }
  const command = entry.id;
  onChange(
    command === 'BT_SEL' || command === 'BT_DISC'
      ? { kind: 'bt', command, profile: 0 }
      : { kind: 'bt', command },
  );
}

function BluetoothChoices() {
  return (
    <>
      {BLUETOOTH_COMMANDS.map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entry.label}
        </option>
      ))}
    </>
  );
}
