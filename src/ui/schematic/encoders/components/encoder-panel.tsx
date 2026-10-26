import { useRef } from 'react';
import { ENCODER_OPTIONS } from '@catalog/encoders';
import { useProject } from '@ui/project/logic';
import { DocsLink } from '@ui/components/components';
import { AddEncoderButton } from './add-encoder-button';
import { EncoderHardware } from './encoder-hardware';

export function EncoderPanel() {
  const { project } = useProject();
  const addRef = useRef<HTMLButtonElement>(null);
  return (
    <details>
      <summary className="cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-focus">
        <h3 className="inline font-semibold">Encoders</h3>
      </summary>
      <div className="flex flex-col gap-2">
        <EncoderDescription />
        {project.encoders.length === 0 ? (
          <p className="text-text-muted">No encoders yet. Pick the Encoder tool or add one here.</p>
        ) : null}
        {project.encoders.map((encoder, index) => (
          <EncoderHardware
            key={encoder.id}
            encoder={encoder}
            index={index}
            onDelete={() => addRef.current?.focus()}
          />
        ))}
        <AddEncoderButton ref={addRef} />
      </div>
    </details>
  );
}

function EncoderDescription() {
  return (
    <p className="text-text-muted">
      A, COM and B are symbolic rotary contacts, not a physical footprint. Wire A and B to distinct
      GPIOs and COM to ground. The push switch is an ordinary key.{' '}
      {ENCODER_OPTIONS.rotation.description}{' '}
      <DocsLink href={ENCODER_OPTIONS.pins.docsUrl} topic="Encoder hardware" />
    </p>
  );
}
