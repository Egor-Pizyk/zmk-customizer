import { ADVANCED_OPTIONS } from '@catalog/bindings';
import type { Combo } from '@domain';
import type { AdvancedEditorProps } from '@ui/bindings/advanced/logic';
import { useProject } from '@ui/project/logic';
import { Button, DocsLink } from '@ui/components/components';

export function ComboKeys({
  combo,
  selectedKeyIds,
  onSelectKeys,
  onChange: handleChange,
}: AdvancedEditorProps & { readonly combo: Combo; readonly onChange: (combo: Combo) => void }) {
  const { project } = useProject();
  const entry = ADVANCED_OPTIONS.comboKeys;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend>{entry.label}</legend>
      <p>
        {entry.description} <DocsLink href={entry.docsUrl} topic={entry.label} />
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            handleChange({ ...combo, keyIds: selectedKeyIds });
          }}
        >
          Use selected layout keys
        </Button>
        <Button
          onClick={() => {
            onSelectKeys(combo.keyIds.filter((id) => project.keys.some((key) => key.id === id)));
          }}
        >
          Select combo keys on layout
        </Button>
      </div>
      <ComboKeyChoices combo={combo} onChange={handleChange} />
    </fieldset>
  );
}

function ComboKeyChoices({
  combo,
  onChange: handleChange,
}: {
  readonly combo: Combo;
  readonly onChange: (combo: Combo) => void;
}) {
  const { project } = useProject();
  return (
    <div className="flex max-h-40 flex-wrap gap-2 overflow-auto">
      {project.keys.map((key, index) => (
        <label key={key.id} className="flex items-center gap-1">
          <input
            className="size-4 focus-visible:outline-2 focus-visible:outline-focus"
            type="checkbox"
            aria-label={`Combo key ${index}`}
            checked={combo.keyIds.includes(key.id)}
            onChange={(event) => {
              const keyIds = event.target.checked
                ? [...combo.keyIds, key.id]
                : combo.keyIds.filter((id) => id !== key.id);
              handleChange({ ...combo, keyIds });
            }}
          />
          {`Key ${index}`}
        </label>
      ))}
    </div>
  );
}
