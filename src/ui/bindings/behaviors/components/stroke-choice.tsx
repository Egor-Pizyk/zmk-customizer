import { KEYCODES } from '@catalog/bindings';
import type { KeyStroke } from '@domain';
import { Field, DocsLink } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { StrokeModifiers } from './stroke-modifiers';

export function StrokeChoice({
  label,
  stroke,
  onChange: handleChange,
}: {
  readonly label: string;
  readonly stroke: KeyStroke;
  readonly onChange: (stroke: KeyStroke) => void;
}) {
  return (
    <>
      <StrokeKeyChoice label={label} stroke={stroke} onChange={handleChange} />
      <StrokeModifiers label={label} stroke={stroke} onChange={handleChange} />
    </>
  );
}

type StrokeProps = {
  readonly label: string;
  readonly stroke: KeyStroke;
  readonly onChange: (stroke: KeyStroke) => void;
};
function StrokeKeyChoice({ label, stroke, onChange: handleChange }: StrokeProps) {
  const entry = KEYCODES.find(
    (key) => key.name === stroke.keycode || key.aliases.includes(stroke.keycode),
  );
  return (
    <Field
      label={label}
      description={
        entry === undefined ? undefined : (
          <>
            {entry.description} <DocsLink href={entry.docsUrl} topic={entry.name} />
          </>
        )
      }
      renderControl={(props) => (
        <select
          {...props}
          className={INPUT_CLASSES}
          value={entry?.name ?? stroke.keycode}
          onChange={(event) => {
            handleChange({ ...stroke, keycode: event.target.value });
          }}
        >
          {KEYCODES.map((key) => (
            <option key={key.name} value={key.name}>
              {key.name}
            </option>
          ))}
        </select>
      )}
    />
  );
}
