import { useProject } from '@ui/project/logic';
import { addConditionalLayer } from '@domain/advanced-keymap';
import { Button } from '@ui/components/components';
import { ConditionalLayerEditor } from './conditional-layer-editor';

export function ConditionalLayerLibrary() {
  const { project, commit } = useProject();
  return (
    <section aria-label="Conditional layers" className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">Conditional layers</h2>
      <Button
        isDisabled={project.conditionalLayers.length >= 128}
        onClick={() => {
          commit((current) => addConditionalLayer(current), 'Created conditional layer rule');
        }}
      >
        Create conditional rule
      </Button>
      {project.conditionalLayers.length === 0 ? (
        <p>No conditional rules yet. Add layers, then choose inputs and a target.</p>
      ) : undefined}
      {project.conditionalLayers.map((rule, index) => (
        <ConditionalLayerEditor key={rule.id} rule={rule} index={index} />
      ))}
    </section>
  );
}
