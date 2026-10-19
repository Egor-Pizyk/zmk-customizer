import type { FirmwareOption, FirmwareValue } from '@domain/firmware';
import { useFirmwareDraft } from '@ui/firmware/logic';
import { Button, DocsLink, Field } from '@ui/components/components';
import type { FieldControlProps } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type FirmwareOptionFieldProps = {
  readonly option: FirmwareOption;
  readonly value: FirmwareValue;
  readonly defaultValue: FirmwareValue;
  readonly error: string | undefined;
  readonly isOverridden: boolean;
  readonly onCommit: (value: FirmwareValue) => void;
  readonly onReset: () => void;
};

function DraftInput(props: {
  readonly option: Extract<FirmwareOption, { kind: 'int' | 'string' }>;
  readonly value: FirmwareValue;
  readonly onCommit: (value: FirmwareValue) => void;
  readonly controlProps: FieldControlProps;
}) {
  const draft = useFirmwareDraft(props.value, {
    kind: props.option.kind,
    onCommit: props.onCommit,
  });
  return (
    <input
      {...props.controlProps}
      className={INPUT_CLASSES}
      data-issue-path={`firmware.${props.option.id}`}
      onBlur={() => {
        draft.commit();
      }}
      onChange={(event) => {
        draft.setDraft(event.target.value);
      }}
      onKeyDown={draft.handleKeyDown}
      step={props.option.kind === 'int' ? 1 : undefined}
      type={props.option.kind === 'int' ? 'number' : 'text'}
      value={draft.text}
    />
  );
}

function OptionControl(
  props: FirmwareOptionFieldProps & { readonly controlProps: FieldControlProps },
) {
  const { option, value, onCommit: handleCommit, controlProps } = props;
  if (option.kind === 'int' || option.kind === 'string') {
    return (
      <DraftInput
        controlProps={controlProps}
        onCommit={handleCommit}
        option={option}
        value={value}
      />
    );
  }
  if (option.kind === 'bool') {
    return (
      <input
        {...controlProps}
        aria-checked={value === true}
        checked={value === true}
        className="size-6 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        data-issue-path={`firmware.${option.id}`}
        onChange={(event) => {
          handleCommit(event.target.checked);
        }}
        role="switch"
        type="checkbox"
      />
    );
  }
  return <EnumControl {...props} option={option} />;
}

function EnumControl({
  option,
  value,
  onCommit: handleCommit,
  controlProps,
}: FirmwareOptionFieldProps & {
  readonly option: Extract<FirmwareOption, { kind: 'enum' }>;
  readonly controlProps: FieldControlProps;
}) {
  return (
    <select
      {...controlProps}
      className={INPUT_CLASSES}
      data-issue-path={`firmware.${option.id}`}
      onChange={(event) => {
        handleCommit(event.target.value);
      }}
      value={String(value)}
    >
      {!option.choices.some((choice) => choice.value === value) && (
        <option value={String(value)}>Unsupported: {String(value)}</option>
      )}
      {option.choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  );
}

export function FirmwareOptionField(props: FirmwareOptionFieldProps) {
  const { option } = props;
  const range =
    option.kind === 'int'
      ? ` Allowed: ${option.min}–${option.max} ${option.unit} (product bounds).`
      : '';
  const requirement = getRequirementText(option);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
      <div className="min-w-0 flex-1">
        <Field
          label={option.kind === 'int' ? `${option.label} (${option.unit})` : option.label}
          error={props.error}
          description={
            <>
              {option.description} Default: {String(props.defaultValue)}
              {option.kind === 'int' ? ` ${option.unit}` : ''}.{range}
              {requirement}
              {option.requires === undefined
                ? ''
                : ` Requires: ${option.requires.map((entry) => entry.label).join(', ')}.`}{' '}
              <DocsLink href={option.docsUrl} topic={option.label} />
              <br />
              <code>{option.id}</code>
            </>
          }
          renderControl={(controlProps) => <OptionControl {...props} controlProps={controlProps} />}
        />
      </div>
      <Button isDisabled={!props.isOverridden} onClick={props.onReset} variant="ghost">
        Reset {option.label}
      </Button>
    </div>
  );
}

function getRequirementText(option: FirmwareOption): string {
  if (option.availability === 'split') {
    return ' Requires a BLE split keyboard.';
  }
  if (option.availability === 'ble') {
    return ' Requires a supported BLE board.';
  }
  return '';
}
