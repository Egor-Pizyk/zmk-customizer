import { useId } from 'react';
import type { ReactNode } from 'react';

export type FieldControlProps = {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': boolean | undefined;
};

type FieldProps = {
  readonly label: string;
  readonly description?: ReactNode;
  readonly error?: string | undefined;
  /** Renders the control; spread the given props onto it so label and messages are linked. */
  readonly renderControl: (controlProps: FieldControlProps) => ReactNode;
};

export function Field({ label, description, error, renderControl }: FieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [
    description === undefined ? '' : descriptionId,
    error === undefined ? '' : errorId,
  ]
    .filter((part) => part !== '')
    .join(' ');
  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium" htmlFor={id}>
        {label}
      </label>
      {renderControl({
        id,
        'aria-describedby': describedBy === '' ? undefined : describedBy,
        'aria-invalid': error === undefined ? undefined : true,
      })}
      {description === undefined ? undefined : (
        <p className="text-xs text-text-muted" id={descriptionId}>
          {description}
        </p>
      )}
      {error === undefined ? undefined : (
        <p className="text-xs text-danger" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
