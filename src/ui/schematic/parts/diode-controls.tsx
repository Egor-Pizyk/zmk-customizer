import { getKeyDiodeState, reverseKeyDiode, toggleKeyDiode } from '@domain';
import type { Key, KeyPin, Project } from '@domain';
import { Button } from '@ui/components';

type DiodeControlsProps = {
  readonly schematicKey: Key;
  readonly keyIndex: number;
  readonly pin: KeyPin;
  readonly commit: (change: (project: Project) => Project) => void;
};

export function DiodeControls({ schematicKey, keyIndex, pin, commit }: DiodeControlsProps) {
  const state = getKeyDiodeState(schematicKey, pin);
  const label = `${state.isPresent ? 'Remove' : 'Add'} diode at key ${keyIndex} pin ${pin}`;
  function handleToggle() {
    commit((current) => toggleKeyDiode(current, { keyId: schematicKey.id, pin }));
  }
  function handleReverse() {
    commit((current) => reverseKeyDiode(current, { keyId: schematicKey.id }));
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        aria-label={label}
        aria-pressed={state.isPresent}
        hint={state.isDisabled ? 'Remove the diode at the other pin first' : label}
        isDisabled={state.isDisabled}
        onClick={handleToggle}
        size="sm"
      >
        Diode
      </Button>
      {state.isPresent ? (
        <>
          <span className="text-xs text-text-muted">
            Cathode {schematicKey.diode?.cathode === 'away-switch' ? 'away from' : 'toward'} switch
          </span>
          <Button
            aria-label={`Reverse diode at key ${keyIndex} pin ${pin}`}
            onClick={handleReverse}
            size="sm"
          >
            Reverse
          </Button>
        </>
      ) : undefined}
    </div>
  );
}
