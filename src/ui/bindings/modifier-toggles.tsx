import { MODIFIERS } from '../../domain/types';
import type { Modifier } from '../../domain/types';
import { Button } from '../components/button';
import { MODIFIER_LABELS, MODIFIER_SYMBOLS } from './modifier-labels';

type ModifierTogglesProps = {
  readonly enabledModifiers: readonly Modifier[];
  readonly onToggle: (modifier: Modifier, isEnabled: boolean) => void;
};

// Left and right Ctrl, Shift, Alt, GUI for "Send a key" (spec 004 FR-011).
export function ModifierToggles({ enabledModifiers, onToggle }: ModifierTogglesProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-xs font-medium">Modifiers</legend>
      <div className="grid grid-cols-4 gap-1">
        {MODIFIERS.map((modifier) => {
          const isEnabled = enabledModifiers.includes(modifier);
          function handleClick() {
            onToggle(modifier, !isEnabled);
          }
          return (
            <Button
              aria-label={MODIFIER_LABELS[modifier]}
              aria-pressed={isEnabled}
              key={modifier}
              onClick={handleClick}
              size="sm"
              variant="ghost"
            >
              {MODIFIER_SYMBOLS[modifier].startsWith('R')
                ? MODIFIER_SYMBOLS[modifier]
                : `L${MODIFIER_SYMBOLS[modifier]}`}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
