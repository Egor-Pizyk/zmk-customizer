import type { ConditionalLayer } from '@domain';
import { useProject } from '@ui/project/logic';
import { replaceConditionalLayer, removeConditionalLayer } from '@domain/advanced-keymap';
import { Button } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { LayerChecks } from './layer-checks';
import { AdvancedField } from './advanced-field';

export function ConditionalLayerEditor({
  rule,
  index,
}: {
  readonly rule: ConditionalLayer;
  readonly index: number;
}) {
  const { commit } = useProject();
  function handleChange(value: ConditionalLayer) {
    commit((current) => replaceConditionalLayer(current, value));
  }
  return (
    <details className="rounded-md border border-border p-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">{`Conditional rule ${rule.id}`}</summary>
      <div className="flex flex-col gap-3 p-2">
        <LayerChecks
          property="ifLayerIds"
          selectedIds={rule.ifLayerIds}
          onCommit={(ifLayerIds) => {
            handleChange({ ...rule, ifLayerIds });
          }}
        />
        <ConditionalTarget rule={rule} index={index} onChange={handleChange} />
        <Button
          variant="danger"
          onClick={() => {
            commit(
              (current) => removeConditionalLayer(current, rule.id),
              `Deleted conditional rule ${rule.id}. Undo to restore it.`,
            );
          }}
        >
          Delete conditional rule
        </Button>
      </div>
    </details>
  );
}

type ConditionalTargetProps = {
  readonly rule: ConditionalLayer;
  readonly index: number;
  readonly onChange: (rule: ConditionalLayer) => void;
};
function ConditionalTarget({ rule, index, onChange: handleChange }: ConditionalTargetProps) {
  const { project, issues } = useProject();
  const errors = issues.filter(
    (issue) => issue.path[0] === 'conditionalLayers' && issue.path[1] === index,
  );
  const paths = [`conditionalLayers.${index}`, ...errors.map((issue) => issue.path.join('.'))].join(
    ' ',
  );
  return (
    <>
      <AdvancedField property="thenLayerId">
        {(props) => (
          <select
            {...props}
            className={INPUT_CLASSES}
            data-issue-path={paths}
            aria-invalid={errors.length > 0 || undefined}
            value={rule.thenLayerId}
            onChange={(event) => {
              handleChange({ ...rule, thenLayerId: event.target.value });
            }}
          >
            {project.layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        )}
      </AdvancedField>
      {errors.map((issue) => (
        <p className="text-danger" key={issue.message}>
          {issue.message}
        </p>
      ))}
    </>
  );
}
