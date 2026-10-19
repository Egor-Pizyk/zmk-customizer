import { useRef } from 'react';
import { addEncoder } from '@domain/encoders';
import { ENCODER_DEFAULTS, ENCODER_OPTIONS } from '@catalog/encoders';
import { useProject } from '@ui/project/logic';
import { Button, DocsLink } from '@ui/components/components';
import { EncoderHardware } from './encoder-hardware';

export function EncoderPanel() {
  const { project, commit } = useProject();
  const addRef = useRef<HTMLButtonElement>(null);
  return (
    <details className="shrink-0 border-b border-border bg-surface-raised px-4 py-2">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
        Encoders
      </summary>
      <div className="flex max-h-80 flex-col gap-3 overflow-auto py-2">
        <p className="text-text-muted">
          {ENCODER_OPTIONS.rotation.description}{' '}
          <DocsLink href={ENCODER_OPTIONS.pins.docsUrl} topic="Encoder hardware" />
        </p>
        <Button
          ref={addRef}
          onClick={() => {
            commit(
              (current) => addEncoder(current, ENCODER_DEFAULTS),
              'Added encoder. Assign its A and B pins.',
            );
          }}
        >
          Add encoder
        </Button>
        {project.encoders.map((encoder, index) => (
          <EncoderHardware
            key={encoder.id}
            encoder={encoder}
            index={index}
            onDelete={() => {
              addRef.current?.focus();
            }}
          />
        ))}
      </div>
    </details>
  );
}
