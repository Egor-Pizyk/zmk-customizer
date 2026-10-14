import { BINDING_POLICY, isValidTappingTerm } from '@domain/bindings';
import { NumberInput } from '@ui/components/components';
import { useState } from 'react';

export function PauseInput({
  tappingTermMs,
  onCommit,
}: {
  readonly tappingTermMs: number;
  readonly onCommit: (tappingTermMs: number) => void;
}) {
  const [isInvalid, setIsInvalid] = useState(false);
  function handlePauseCommit(value: number) {
    const isValid = isValidTappingTerm(value);
    setIsInvalid(!isValid);
    if (isValid) {
      onCommit(value);
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <NumberInput
        isInvalid={isInvalid}
        label="Pause after the last tap in milliseconds"
        onCommit={handlePauseCommit}
        step={10}
        value={tappingTermMs}
      />
      <p className="text-xs text-text-muted">
        {isInvalid
          ? `Use a whole number of ${BINDING_POLICY.minPauseMs}–${BINDING_POLICY.maxPauseMs} ms.`
          : `Pauses after this, the tap count resolves. ${BINDING_POLICY.minPauseMs}–${BINDING_POLICY.maxPauseMs} ms.`}
      </p>
    </div>
  );
}
