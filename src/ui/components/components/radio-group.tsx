import { useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Tooltip } from './tooltip';

export type RadioOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly isDisabled?: boolean;
  readonly hint?: string;
};

type RadioGroupProps<Value extends string> = {
  readonly label: string;
  readonly isLabelVisible?: boolean;
  readonly options: readonly RadioOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
};

// Native radios give arrow-key navigation and roving focus. An aria-disabled option takes
// focus but onChange ignores it, so the selection stays (spec 001 T037).
export function RadioGroup<Value extends string>(props: RadioGroupProps<Value>) {
  const { label, isLabelVisible = true, options, value, onChange } = props;
  const name = useId();

  function handleSelect(selected: Value) {
    onChange(selected);
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={isLabelVisible ? 'mb-1 font-medium' : 'sr-only'}>{label}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <RadioItem
            isChecked={option.value === value}
            key={option.value}
            name={name}
            onSelect={handleSelect}
            option={option}
          />
        ))}
      </div>
    </fieldset>
  );
}

type RadioItemProps<Value extends string> = {
  readonly name: string;
  readonly option: RadioOption<Value>;
  readonly isChecked: boolean;
  readonly onSelect: (value: Value) => void;
};

function RadioItem<Value extends string>({
  name,
  option,
  isChecked,
  onSelect,
}: RadioItemProps<Value>) {
  const hintId = useId();
  const hint = useHintDismissal(option.hint !== undefined);
  const isDisabled = option.isDisabled === true;

  function handleChange() {
    if (!isDisabled) {
      onSelect(option.value);
    }
  }

  return (
    <label
      className={radioItemClasses(isDisabled)}
      data-tooltip-dismissed={hint.isDismissed || undefined}
    >
      <input
        aria-label={option.label}
        aria-describedby={option.hint === undefined ? undefined : hintId}
        aria-disabled={isDisabled || undefined}
        checked={isChecked}
        className="sr-only"
        name={name}
        onBlur={hint.handleBlur}
        onChange={handleChange}
        onKeyDown={hint.handleKeyDown}
        type="radio"
        value={option.value}
      />
      {option.icon}
      <span className={option.icon === undefined ? undefined : 'sr-only'}>{option.label}</span>
      {option.hint === undefined ? undefined : <Tooltip id={hintId} text={option.hint} />}
    </label>
  );
}

function radioItemClasses(isDisabled: boolean): string {
  const state = isDisabled
    ? 'cursor-not-allowed opacity-60'
    : 'cursor-pointer hover:bg-surface-muted';
  return `group relative inline-flex h-8 items-center gap-2 rounded-md px-3 text-text has-checked:bg-surface-muted has-checked:text-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus ${state}`;
}

// Escape hides the hint until focus leaves (WCAG 1.4.13).
function useHintDismissal(hasHint: boolean) {
  const [isDismissed, setIsDismissed] = useState(false);
  return {
    isDismissed,
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (hasHint && event.key === 'Escape') {
        setIsDismissed(true);
      }
    },
    handleBlur: () => {
      setIsDismissed(false);
    },
  };
}
