import { useRef } from 'react';
import { placeEncoder } from '@domain/encoders';
import { findFreeKeyPosition } from '@domain/geometry';
import { ENCODER_DEFAULTS, ENCODER_OPTIONS } from '@catalog/encoders';
import { useProject } from '@ui/project/logic';
import { Button, DocsLink } from '@ui/components/components';
import { EncoderHardware } from './encoder-hardware';

export function EncoderPanel() {
  const { project, commit } = useProject();
  function handleAdd() {
    commit(
      (current) =>
        placeEncoder(current, {
          position: findFreeKeyPosition(current),
          defaults: ENCODER_DEFAULTS,
          hasPushSwitch: true,
        }),
      'Added encoder with push switch. Wire A and B to GPIOs and COM to ground.',
    );
  }
  const addRef = useRef<HTMLButtonElement>(null);
  return (
    <details
      name="schematic-editor"
      className="shrink-0 border-b border-border bg-surface-raised px-4 py-2"
    >
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
        Encoders
      </summary>
      <div className="flex max-h-80 flex-col gap-3 overflow-auto py-2">
        <EncoderDescription />
        <Button ref={addRef} onClick={handleAdd}>
          Add encoder
        </Button>
        {project.encoders.map((encoder, index) => (
          <EncoderHardware
            key={encoder.id}
            encoder={encoder}
            index={index}
            onDelete={() => addRef.current?.focus()}
          />
        ))}
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
