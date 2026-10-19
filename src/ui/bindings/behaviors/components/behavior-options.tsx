import type { BehaviorEditorProps } from '@ui/bindings/behaviors/logic';
import { HoldTapOptions } from './hold-tap-options';
import { TapDanceOptions } from './tap-dance-options';
import { ModMorphOptions } from './mod-morph-options';
import { StickyOptions } from './sticky-options';

export function BehaviorOptions(props: BehaviorEditorProps) {
  if (props.behavior.kind === 'hold-tap') {
    return <HoldTapOptions {...props} />;
  }
  if (props.behavior.kind === 'tap-dance') {
    return <TapDanceOptions {...props} />;
  }
  if (props.behavior.kind === 'mod-morph') {
    return <ModMorphOptions {...props} />;
  }
  return <StickyOptions {...props} />;
}
