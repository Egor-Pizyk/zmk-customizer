import { useState } from 'react';
import type { Binding, KeyStroke, Modifier } from '../../domain/types';
import { Button } from '../components/button';
import { NumberInput } from '../components/number-input';
import { formatBindingName } from './format-binding-name';
import { ModifierToggles } from './modifier-toggles';
import { Switch } from '../components/switch';

/** Tap-dance parameter controls, present when the selection shares one tap-dance (US2). */
export type TapDanceControls = {
  readonly binding: Extract<Binding, { kind: 'tap_dance' }>;
  readonly editingTap: number | undefined;
  readonly handleArmTap: (index: number) => void;
  readonly handleTapModifiersChange: (index: number, modifiers: readonly Modifier[]) => void;
  readonly handleAddTap: () => void;
  readonly handleRemoveTap: (index: number) => void;
  readonly handlePauseChange: (tappingTermMs: number) => void;
};

export type TapDanceSectionProps = {
  readonly controls: TapDanceControls;
  readonly isAutoAdvanceEnabled: boolean;
  readonly onAutoAdvanceChange: (isEnabled: boolean) => void;
};

const MIN_PAUSE_MS = 0;
const MAX_PAUSE_MS = 5000;

function isSameTap(first: KeyStroke, second: KeyStroke): boolean {
  return (
    first.keycode === second.keycode &&
    first.modifiers.length === second.modifiers.length &&
    first.modifiers.every((modifier) => second.modifiers.includes(modifier))
  );
}

// One tap action per row, the resolving pause below (spec 005 FR-007–FR-008).
export function TapDanceSection({
  controls,
  isAutoAdvanceEnabled,
  onAutoAdvanceChange: handleAutoAdvanceChange,
}: TapDanceSectionProps) {
  const { binding } = controls;
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {binding.taps.map((tap, index) => (
          <TapRow
            controls={controls}
            index={index}
            isLast={binding.taps.length === 1}
            key={tapKey(binding.taps, tap, index)}
            tap={tap}
          />
        ))}
      </ol>
      <Button onClick={controls.handleAddTap} size="sm" variant="secondary">
        Add tap
      </Button>
      <PauseInput controls={controls} />
      <Switch
        isChecked={isAutoAdvanceEnabled}
        label="Next key after picking"
        onChange={handleAutoAdvanceChange}
      />
    </div>
  );
}

// Content-based key with an occurrence suffix, so identical taps stay distinct without the
// row index (react/no-array-index-key); rows are stateless, so content keys reconcile safely.
function tapKey(taps: readonly KeyStroke[], tap: KeyStroke, index: number): string {
  const occurrence = taps.slice(0, index).filter((other) => isSameTap(other, tap)).length;
  return `${tap.keycode}:${[...tap.modifiers].join('+')}:${occurrence}`;
}

type TapRowProps = {
  readonly controls: TapDanceControls;
  readonly index: number;
  readonly isLast: boolean;
  readonly tap: KeyStroke;
};

function TapRow({ controls, index, isLast, tap }: TapRowProps) {
  return (
    <li className="flex flex-col gap-1 rounded-md border border-border px-2 py-1">
      <TapRowHeader controls={controls} index={index} isLast={isLast} tap={tap} />
      {controls.editingTap === index ? (
        <span className="text-xs text-text-muted">Pick a key below to set this tap.</span>
      ) : undefined}
      <TapModifiers controls={controls} index={index} tap={tap} />
    </li>
  );
}

function TapRowHeader({ controls, index, isLast, tap }: TapRowProps) {
  const isArmed = controls.editingTap === index;
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium">{`Tap ${index + 1}: ${formatBindingName({ kind: 'kp', key: tap })}`}</span>
      <span className="flex gap-1">
        <Button
          hint={
            isArmed ? 'Pick a key below to set this tap' : `Choose another key for tap ${index + 1}`
          }
          onClick={() => {
            controls.handleArmTap(index);
          }}
          size="sm"
          variant="ghost"
        >
          {isArmed ? 'Pick below…' : 'Change'}
        </Button>
        <Button
          hint={isLast ? 'A tap-dance needs at least one tap' : `Remove tap ${index + 1}`}
          isDisabled={isLast}
          onClick={() => {
            controls.handleRemoveTap(index);
          }}
          size="sm"
          variant="ghost"
        >
          Remove
        </Button>
      </span>
    </span>
  );
}

type TapModifiersProps = {
  readonly controls: TapDanceControls;
  readonly index: number;
  readonly tap: KeyStroke;
};

function TapModifiers({ controls, index, tap }: TapModifiersProps) {
  function handleToggle(modifier: Modifier, isEnabled: boolean) {
    const modifiers = isEnabled
      ? [...tap.modifiers, modifier]
      : tap.modifiers.filter((active) => active !== modifier);
    controls.handleTapModifiersChange(index, modifiers);
  }
  return <ModifierToggles enabledModifiers={tap.modifiers} onToggle={handleToggle} />;
}

// Out-of-range pauses never reach the project: rejected where entered (spec 005 FR-008).
function PauseInput({ controls }: { readonly controls: TapDanceControls }) {
  const [isInvalid, setIsInvalid] = useState(false);

  function handlePauseCommit(tappingTermMs: number) {
    if (
      !Number.isInteger(tappingTermMs) ||
      tappingTermMs < MIN_PAUSE_MS ||
      tappingTermMs > MAX_PAUSE_MS
    ) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    controls.handlePauseChange(tappingTermMs);
  }

  return (
    <div className="flex flex-col gap-1">
      <NumberInput
        isInvalid={isInvalid}
        label="Pause after the last tap in milliseconds"
        onCommit={handlePauseCommit}
        step={10}
        value={controls.binding.tappingTermMs}
      />
      <p className="text-xs text-text-muted">
        {isInvalid
          ? 'Use a whole number of 0–5000 ms.'
          : 'Pauses after this, the tap count resolves. 0–5000 ms.'}
      </p>
    </div>
  );
}
