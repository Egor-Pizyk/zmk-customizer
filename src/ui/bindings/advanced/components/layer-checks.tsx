import { ADVANCED_OPTIONS } from '@catalog/bindings';
import { DocsLink } from '@ui/components/components';
import { useProject } from '@ui/project/logic';

export function LayerChecks({
  property,
  selectedIds,
  onCommit,
}: {
  readonly property: 'comboLayers' | 'ifLayerIds';
  readonly selectedIds: readonly string[];
  readonly onCommit: (ids: readonly string[]) => void;
}) {
  const { project } = useProject();
  const entry = ADVANCED_OPTIONS[property];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend>{entry.label}</legend>
      <p>
        {entry.description} <DocsLink href={entry.docsUrl} topic={entry.label} />
      </p>
      <div className="flex flex-wrap gap-2">
        {project.layers.map((layer) => (
          <label key={layer.id} className="flex items-center gap-1">
            <input
              className="size-4 focus-visible:outline-2 focus-visible:outline-focus"
              aria-label={`${entry.label}: ${layer.name}`}
              type="checkbox"
              checked={selectedIds.includes(layer.id)}
              onChange={(event) => {
                onCommit(
                  event.target.checked
                    ? [...selectedIds, layer.id]
                    : selectedIds.filter((id) => id !== layer.id),
                );
              }}
            />
            {layer.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
