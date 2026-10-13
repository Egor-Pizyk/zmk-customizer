import type { Binding } from '@domain';
import { Button, Switch } from '@ui/components';
import { PauseInput } from './pause-input';
import { usePreferences } from '@ui/preferences';
import { findModifierTarget } from './binding-slots';
import type { PickHandlers } from './create-pick-handlers';
import { ModifierToggles } from './modifier-toggles';
import type { KeyPickerState } from './use-key-picker';

type SlotExtrasProps = {
  readonly picker: KeyPickerState;
  readonly handlers: PickHandlers;
};

// What the open slot needs besides its value (spec 006 FR-010): modifier chips, tap-dance taps
// and pause, mod-morph triggers, and the automatic next key.
export function SlotExtras({ picker, handlers }: SlotExtrasProps) {
  const { preferences, changePreferences } = usePreferences();
  const stroke = findModifierTarget(picker.source, picker.slot);
  const binding = picker.source.kind === 'binding' ? picker.source.binding : undefined;

  function handleAutoAdvanceChange(isAutoAdvanceEnabled: boolean) {
    changePreferences({ isAutoAdvanceEnabled });
  }

  return (
    <div className="flex flex-col gap-3">
      {stroke === undefined ? undefined : (
        <ModifierToggles
          enabledModifiers={stroke === 'pending' ? picker.pendingModifiers : stroke.modifiers}
          label="Hold with the key"
          onToggle={handlers.handleModifierToggle}
        />
      )}
      {binding?.kind === 'tap_dance' ? (
        <TapDanceExtras binding={binding} handlers={handlers} picker={picker} />
      ) : undefined}
      {binding?.kind === 'mod_morph' ? (
        <ModifierToggles
          enabledModifiers={binding.mods}
          label="Morph while held (at least one)"
          onToggle={handlers.handleTriggerToggle}
        />
      ) : undefined}
      <Switch
        isChecked={preferences.isAutoAdvanceEnabled}
        label="Next key after picking"
        onChange={handleAutoAdvanceChange}
      />
    </div>
  );
}

function TapDanceExtras({
  picker,
  handlers,
  binding,
}: SlotExtrasProps & { readonly binding: Extract<Binding, { kind: 'tap_dance' }> }) {
  const { slot } = picker;
  const isLastTap = binding.taps.length === 1;

  function handleRemoveClick() {
    if (slot.kind === 'dance-tap') {
      handlers.handleRemoveTap(slot.index);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {slot.kind === 'dance-tap' ? (
        <Button
          hint={isLastTap ? 'A tap-dance needs at least one tap' : undefined}
          isDisabled={isLastTap}
          onClick={handleRemoveClick}
          size="sm"
          variant="secondary"
        >
          {`Remove tap ${slot.index + 1}`}
        </Button>
      ) : undefined}
      <PauseInput onCommit={handlers.handlePauseChange} tappingTermMs={binding.tappingTermMs} />
    </div>
  );
}
