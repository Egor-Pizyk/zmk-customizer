import { useId } from 'react';
import type { Encoder, EncoderBinding, Layer } from '@domain';
import { setEncoderBinding } from '@domain/encoders';
import { ENCODER_OPTIONS } from '@catalog/encoders';
import { BehaviorAction } from '@ui/bindings/behaviors/components';
import { useProject } from '@ui/project/logic';
import { DocsLink } from '@ui/components/components';

export function EncoderBindings({ layerIndex }: { readonly layerIndex: number }) {
  const { project } = useProject();
  const layer = project.layers[layerIndex];
  if (layer === undefined || project.encoders.length === 0) {
    return null;
  }
  return (
    <details className="shrink-0 border-b border-border bg-surface-raised p-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
        Encoder actions
      </summary>
      <div className="flex max-h-80 flex-col gap-3 overflow-auto p-2">
        <p>
          {`Layer: ${layer.name}. ${ENCODER_OPTIONS.rotation.description}`}{' '}
          <DocsLink
            href={ENCODER_OPTIONS.rotation.docsUrl}
            topic={ENCODER_OPTIONS.rotation.label}
          />
        </p>
        {project.encoders.map((encoder, index) => (
          <EncoderDirections
            key={encoder.id}
            encoder={encoder}
            index={index}
            layer={layer}
            layerIndex={layerIndex}
          />
        ))}
      </div>
    </details>
  );
}

function EncoderDirections({
  encoder,
  index,
  layer,
  layerIndex,
}: {
  readonly encoder: Encoder;
  readonly index: number;
  readonly layer: Layer;
  readonly layerIndex: number;
}) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-md border border-border p-2">
      <legend>{`Encoder ${index} (${encoder.half})`}</legend>
      {(['clockwise', 'counterclockwise'] as const).map((direction) => (
        <EncoderDirection
          key={direction}
          encoder={encoder}
          index={index}
          layer={layer}
          layerIndex={layerIndex}
          direction={direction}
        />
      ))}
    </fieldset>
  );
}

type EncoderDirectionProps = {
  readonly encoder: Encoder;
  readonly index: number;
  readonly layer: Layer;
  readonly layerIndex: number;
  readonly direction: keyof EncoderBinding;
};
function EncoderDirection({ encoder, index, layer, layerIndex, direction }: EncoderDirectionProps) {
  const { project, issues, commit } = useProject();
  const path = `layers.${layerIndex}.encoderBindings.${encoder.id}.${direction}`;
  const errors = issues.filter((issue) => issue.path.join('.') === path);
  const errorId = useId();
  return (
    <fieldset
      tabIndex={-1}
      data-issue-path={path}
      aria-invalid={errors.length > 0 || undefined}
      aria-describedby={errors.length === 0 ? undefined : errorId}
      className="flex flex-col gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-focus"
    >
      <legend className="sr-only">{`Edit encoder ${index} ${direction}`}</legend>
      <BehaviorAction
        label={`Encoder ${index} ${direction}`}
        project={project}
        binding={layer.encoderBindings?.[encoder.id]?.[direction] ?? { kind: 'none' }}
        onChange={(binding) => {
          commit((current) =>
            setEncoderBinding(current, {
              layerId: layer.id,
              encoderId: encoder.id,
              direction,
              binding,
            }),
          );
        }}
      />
      {errors.length === 0 ? undefined : (
        <p id={errorId} className="text-danger">
          {errors.map((issue) => issue.message).join(' ')}
        </p>
      )}
    </fieldset>
  );
}
