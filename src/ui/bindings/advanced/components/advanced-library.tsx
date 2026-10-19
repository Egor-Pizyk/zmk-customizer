import type { AdvancedEditorProps } from '@ui/bindings/advanced/logic';
import { ComboLibrary } from './combo-library';
import { MacroLibrary } from './macro-library';
import { ConditionalLayerLibrary } from './conditional-layer-library';

export function AdvancedLibrary(props: AdvancedEditorProps) {
  return (
    <details className="shrink-0 border-b border-border bg-surface-raised p-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
        Combos, macros and conditional layers
      </summary>
      <div className="flex max-h-96 flex-col gap-4 overflow-auto p-2">
        <ComboLibrary {...props} />
        <MacroLibrary reservedIds={props.reservedMacroIds} />
        <ConditionalLayerLibrary />
      </div>
    </details>
  );
}
