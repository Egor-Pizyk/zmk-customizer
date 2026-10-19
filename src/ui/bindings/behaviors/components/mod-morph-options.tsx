import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { MODIFIERS } from '@domain';
import { INPUT_CLASSES } from '@ui/components/logic';
import { BehaviorField } from './behavior-field';
import { BehaviorAction } from './behavior-action';

export function ModMorphOptions({
  behavior,
  project,
  onChange: handleChange,
}: BehaviorEditorProps) {
  if (behavior.kind !== 'mod-morph') {
    return null;
  }
  return (
    <>
      {(['normal', 'morphed'] as const).map((side) => (
        <BehaviorAction
          key={side}
          binding={behavior[side]}
          label={side === 'normal' ? 'Normal action' : 'Morphed action'}
          project={project}
          onChange={(binding) => {
            handleChange({ ...behavior, [side]: binding });
          }}
        />
      ))}
      <MorphModifiers behavior={behavior} onChange={handleChange} />
    </>
  );
}

function MorphModifiers({
  behavior,
  onChange: handleChange,
}: Pick<BehaviorEditorProps, 'behavior' | 'onChange'>) {
  if (behavior.kind !== 'mod-morph') {
    return null;
  }
  return (
    <>
      {(['mods', 'keepMods'] as const).map((property) => (
        <BehaviorField key={property} property={property}>
          {(props) => (
            <select
              {...props}
              className={INPUT_CLASSES}
              multiple
              value={[...behavior[property]]}
              onChange={(event) => {
                const selected = new Set(
                  Array.from(event.target.selectedOptions, (option) => option.value),
                );
                handleChange({
                  ...behavior,
                  [property]: MODIFIERS.filter((modifier) => selected.has(modifier)),
                });
              }}
            >
              {MODIFIERS.map((modifier) => (
                <option key={modifier}>{modifier}</option>
              ))}
            </select>
          )}
        </BehaviorField>
      ))}
    </>
  );
}
