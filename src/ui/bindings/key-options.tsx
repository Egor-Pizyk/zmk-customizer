import { keycodeByName } from '../../catalog/keycodes';
import { getPressMode } from '../../domain/get-press-mode';
import type { SharedBinding } from '../../domain/get-shared-binding';
import type { PressMode } from '../../domain/set-press-mode';
import type { Binding, KeyStroke, Modifier } from '../../domain/types';
import { RadioGroup } from '../components/radio-group';
import type { RadioOption } from '../components/radio-group';
import { Switch } from '../components/switch';
import { HoldSelect } from './hold-select';
import { ModifierToggles } from './modifier-toggles';

type KeyOptionsProps = {
  readonly shared: SharedBinding;
  readonly pendingModifiers: readonly Modifier[];
  /** Every selected key is a key press or mod-tap, so chips and hold apply now (FR-011, FR-012). */
  readonly isKeyPress: boolean;
  readonly isAutoAdvanceEnabled: boolean;
  readonly onModifierToggle: (modifier: Modifier, isEnabled: boolean) => void;
  readonly onHoldChange: (holdKeycode: string | undefined) => void;
  readonly onModeChange: (mode: PressMode) => void;
  readonly onAutoAdvanceChange: (isEnabled: boolean) => void;
};

function findTapStroke(binding: Binding | undefined): KeyStroke | undefined {
  if (binding?.kind === 'kp') {
    return binding.key;
  }
  return binding?.kind === 'mt' ? binding.tap : undefined;
}

const MODE_OPTIONS: readonly RadioOption<PressMode>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'toggle', label: 'Toggle' },
];

// Press mode applies only to keys that send a key.
const DISABLED_MODE_OPTIONS: readonly RadioOption<PressMode>[] = [
  { value: 'normal', label: 'Normal', isDisabled: true, hint: 'Pick a key first' },
  { value: 'sticky', label: 'Sticky', isDisabled: true, hint: 'Pick a key first' },
  { value: 'toggle', label: 'Toggle', isDisabled: true, hint: 'Pick a key first' },
];

// Chips, "When held", press mode and automatic next key (spec 004 FR-011–FR-014a).
export function KeyOptions(props: KeyOptionsProps) {
  if (props.isKeyPress) {
    return <KeyPressOptions {...props} />;
  }
  return <NonKeyOptions {...props} />;
}

function KeyPressOptions(props: KeyOptionsProps) {
  const { shared, pendingModifiers, isKeyPress, isAutoAdvanceEnabled } = props;
  const binding = shared.kind === 'same' ? shared.binding : undefined;
  const mode = getPressMode(binding);
  const tap = findTapStroke(binding);
  return (
    <div className="flex flex-col gap-3">
      <ModifierToggles
        enabledModifiers={tap?.modifiers ?? pendingModifiers}
        onToggle={props.onModifierToggle}
      />
      <HoldSelect
        holdKeycode={
          binding?.kind === 'mt' ? keycodeByName.get(binding.hold.keycode)?.name : undefined
        }
        isDisabled={!isKeyPress}
        onHoldChange={props.onHoldChange}
      />
      <RadioGroup
        label="Press mode"
        onChange={props.onModeChange}
        options={mode === undefined ? DISABLED_MODE_OPTIONS : MODE_OPTIONS}
        value={mode ?? 'normal'}
      />
      <Switch
        isChecked={isAutoAdvanceEnabled}
        label="Next key after picking"
        onChange={props.onAutoAdvanceChange}
      />
    </div>
  );
}

// Modifiers, hold and press mode are meaningless for non-key actions;
// auto-advance still matters because it controls picking any action.
function NonKeyOptions(props: KeyOptionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-muted">
        Key options (modifiers, hold, press mode) apply to keys.
      </p>
      <Switch
        isChecked={props.isAutoAdvanceEnabled}
        label="Next key after picking"
        onChange={props.onAutoAdvanceChange}
      />
    </div>
  );
}
