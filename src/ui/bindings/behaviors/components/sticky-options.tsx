import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { BehaviorNumber } from './behavior-number';
import { BehaviorFlag } from './behavior-flag';

export function StickyOptions({ behavior, onChange: handleChange }: BehaviorEditorProps) {
  if (behavior.kind !== 'sticky-key' && behavior.kind !== 'sticky-layer') {
    return null;
  }
  return (
    <>
      <BehaviorNumber
        property="releaseAfterMs"
        value={behavior.releaseAfterMs}
        onCommit={(releaseAfterMs) => {
          handleChange({ ...behavior, releaseAfterMs });
        }}
      />
      {(['quickRelease', 'lazy', 'ignoreModifiers'] as const).map((property) => (
        <BehaviorFlag
          key={property}
          property={property}
          value={behavior[property]}
          onCommit={(value) => {
            handleChange({ ...behavior, [property]: value });
          }}
        />
      ))}
    </>
  );
}
