import type { Combo } from '@domain';
import type { AdvancedEditorProps } from '@ui/bindings/advanced/logic';
import { useProject } from '@ui/project/logic';
import { replaceCombo, removeCombo } from '@domain/advanced-keymap';
import { Button } from '@ui/components/components';
import { BehaviorAction } from '@ui/bindings/behaviors/components';
import { AdvancedName } from './advanced-name';
import { AdvancedNumber } from './advanced-number';
import { ComboKeys } from './combo-keys';
import { LayerChecks } from './layer-checks';

export function ComboEditor(
  props: AdvancedEditorProps & { readonly combo: Combo; readonly index: number },
) {
  const { combo, index } = props;
  const { commit } = useProject();
  const handleChange = (value: Combo) => {
    commit((current) => replaceCombo(current, value));
  };
  return (
    <details className="rounded-md border border-border p-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">{`Combo: ${combo.name || combo.id}`}</summary>
      <div className="flex flex-col gap-3 p-2">
        <AdvancedName
          label="Combo name"
          value={combo.name}
          collection="combos"
          index={index}
          onCommit={(name) => {
            handleChange({ ...combo, name });
          }}
        />
        <ComboKeys {...props} onChange={handleChange} />
        <ComboTimeout combo={combo} onChange={handleChange} />
        <LayerChecks
          property="comboLayers"
          selectedIds={combo.layerIds}
          onCommit={(layerIds) => {
            handleChange({ ...combo, layerIds });
          }}
        />
        <ComboActions combo={combo} onChange={handleChange} />
      </div>
    </details>
  );
}

function ComboActions({
  combo,
  onChange: handleChange,
}: {
  readonly combo: Combo;
  readonly onChange: (combo: Combo) => void;
}) {
  const { project, commit } = useProject();
  return (
    <>
      <BehaviorAction
        label="Combo action"
        binding={combo.binding}
        project={project}
        onChange={(binding) => {
          handleChange({ ...combo, binding });
        }}
      />
      <Button
        variant="danger"
        onClick={() => {
          commit(
            (current) => removeCombo(current, combo.id),
            `Deleted combo ${combo.name}. Undo to restore it.`,
          );
        }}
      >{`Delete combo ${combo.name}`}</Button>
    </>
  );
}

function ComboTimeout({
  combo,
  onChange: handleChange,
}: {
  readonly combo: Combo;
  readonly onChange: (combo: Combo) => void;
}) {
  return (
    <AdvancedNumber
      property="timeoutMs"
      value={combo.timeoutMs}
      onCommit={(timeoutMs) => {
        handleChange({ ...combo, timeoutMs });
      }}
    />
  );
}
