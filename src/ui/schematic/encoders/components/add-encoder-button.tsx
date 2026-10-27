import type { RefObject } from 'react';
import { placeEncoder } from '@domain/encoders';
import { findFreeKeyPosition } from '@domain/geometry';
import { ENCODER_DEFAULTS } from '@catalog/encoders';
import { useProject } from '@ui/project/logic';
import { Button } from '@ui/components/components';

export function AddEncoderButton({ ref }: { readonly ref: RefObject<HTMLButtonElement | null> }) {
  const { commit } = useProject();
  function handleAddClick() {
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
  return (
    <Button ref={ref} onClick={handleAddClick} className="self-start" size="sm" variant="secondary">
      Add encoder
    </Button>
  );
}
