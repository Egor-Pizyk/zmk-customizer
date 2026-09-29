import type { Binding, KeyStroke, Modifier } from '../../domain/types';
import { Button } from '../components/button';
import { formatBindingName } from './format-binding-name';
import { ModifierToggles } from './modifier-toggles';

/** Which mod-morph side the next picked key writes: normal or morphed (spec 005 US3). */
export type ModMorphSide = 'normal' | 'morphed';

/** Mod-morph parameter controls, present when the selection shares one mod-morph (US3). */
export type ModMorphControls = {
  readonly binding: Extract<Binding, { kind: 'mod_morph' }>;
  readonly editingSide: ModMorphSide | undefined;
  readonly handleArmSide: (side: ModMorphSide) => void;
  readonly handleSideModifiersChange: (side: ModMorphSide, modifiers: readonly Modifier[]) => void;
  readonly handleTriggerModifiersChange: (modifiers: readonly Modifier[]) => void;
};

type ModMorphSectionProps = {
  readonly controls: ModMorphControls;
};

// Normal and morphed actions with their modifiers, then the trigger set (spec 005 FR-010).
export function ModMorphSection({ controls }: ModMorphSectionProps) {
  const { binding } = controls;
  return (
    <div className="flex flex-col gap-3">
      <MorphSideRow controls={controls} label="Normal" side="normal" tap={binding.normal} />
      <MorphSideRow controls={controls} label="Morphed" side="morphed" tap={binding.morphed} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Morph while held</p>
        <MorphTriggers controls={controls} />
        <p className="text-xs text-text-muted">At least one trigger stays.</p>
      </div>
    </div>
  );
}

type MorphSideRowProps = {
  readonly controls: ModMorphControls;
  readonly label: string;
  readonly side: ModMorphSide;
  readonly tap: KeyStroke;
};

type MorphSideModifiersProps = {
  readonly controls: ModMorphControls;
  readonly side: ModMorphSide;
  readonly tap: KeyStroke;
};

function MorphSideRow({ controls, label, side, tap }: MorphSideRowProps) {
  const isArmed = controls.editingSide === side;
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border px-2 py-1">
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{`${label}: ${formatBindingName({ kind: 'kp', key: tap })}`}</span>
        <Button
          hint={isArmed ? 'Pick a key below' : `Choose another key for ${label.toLowerCase()}`}
          onClick={() => {
            controls.handleArmSide(side);
          }}
          size="sm"
          variant="ghost"
        >
          {isArmed ? 'Pick below…' : 'Change'}
        </Button>
      </span>
      {isArmed ? (
        <span className="text-xs text-text-muted">Pick a key below to set this action.</span>
      ) : undefined}
      <MorphSideModifiers controls={controls} side={side} tap={tap} />
    </div>
  );
}

function MorphSideModifiers({ controls, side, tap }: MorphSideModifiersProps) {
  function handleToggle(modifier: Modifier, isEnabled: boolean) {
    const modifiers = isEnabled
      ? [...tap.modifiers, modifier]
      : tap.modifiers.filter((active) => active !== modifier);
    controls.handleSideModifiersChange(side, modifiers);
  }
  return <ModifierToggles enabledModifiers={tap.modifiers} onToggle={handleToggle} />;
}

function MorphTriggers({ controls }: ModMorphSectionProps) {
  const { binding } = controls;

  function handleToggle(modifier: Modifier, isEnabled: boolean) {
    const modifiers = isEnabled
      ? [...binding.mods, modifier]
      : binding.mods.filter((active) => active !== modifier);
    controls.handleTriggerModifiersChange(modifiers);
  }
  return <ModifierToggles enabledModifiers={binding.mods} onToggle={handleToggle} />;
}
