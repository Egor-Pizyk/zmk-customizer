import { MODIFIER_BITS } from '@catalog/bindings';
import { MODIFIERS } from '@domain';
import type { KeyStroke } from '@domain';

export function StrokeModifiers({
  label,
  stroke,
  onChange: handleChange,
}: {
  readonly label: string;
  readonly stroke: KeyStroke;
  readonly onChange: (stroke: KeyStroke) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend>{`${label} modifiers`}</legend>
      {MODIFIERS.map((modifier) => (
        <label key={modifier}>
          <input
            checked={stroke.modifiers.includes(modifier)}
            onChange={(event) => {
              const modifiers = MODIFIERS.filter((value) =>
                value === modifier ? event.target.checked : stroke.modifiers.includes(value),
              );
              handleChange({ ...stroke, modifiers });
            }}
            type="checkbox"
          />
          {MODIFIER_BITS[modifier]}
        </label>
      ))}
    </fieldset>
  );
}
