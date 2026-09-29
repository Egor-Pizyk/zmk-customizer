import { Switch } from '../components/switch';
import { ModMorphSection } from './mod-morph-options';
import type { ModMorphControls } from './mod-morph-options';
import { TapDanceSection } from './tap-dance-options';
import type { TapDanceControls } from './tap-dance-options';

export type BehaviorControls = {
  readonly tapDance: TapDanceControls | undefined;
  readonly modMorph: ModMorphControls | undefined;
};

export type BehaviorOptionsProps = {
  readonly behavior: BehaviorControls;
  readonly isAutoAdvanceEnabled: boolean;
  readonly onAutoAdvanceChange: (isEnabled: boolean) => void;
};

// Parameter section for the shared configurable behavior, then auto-advance (spec 005).
export function BehaviorOptions({
  behavior,
  isAutoAdvanceEnabled,
  onAutoAdvanceChange: handleAutoAdvanceChange,
}: BehaviorOptionsProps) {
  const { tapDance, modMorph } = behavior;
  return (
    <div className="flex flex-col gap-3">
      {tapDance === undefined ? undefined : <TapDanceSection controls={tapDance} />}
      {modMorph === undefined ? undefined : <ModMorphSection controls={modMorph} />}
      <Switch
        isChecked={isAutoAdvanceEnabled}
        label="Next key after picking"
        onChange={handleAutoAdvanceChange}
      />
    </div>
  );
}
