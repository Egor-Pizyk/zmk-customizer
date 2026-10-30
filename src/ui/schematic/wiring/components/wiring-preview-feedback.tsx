import { Button } from '@ui/components/components';
import type { useWiringPreview } from '@ui/schematic/wiring/logic';

type Props = Pick<
  ReturnType<typeof useWiringPreview>,
  'failure' | 'message' | 'summary' | 'protectedWireIds' | 'operationDescription'
> & {
  readonly onInspectWire: (wireId: string) => void;
};

export function WiringPreviewFeedback({
  failure,
  message,
  summary,
  protectedWireIds,
  operationDescription,
  onInspectWire: handleInspectWire,
}: Props) {
  return (
    <>
      {operationDescription === undefined ? undefined : (
        <p className="text-xs">{operationDescription}</p>
      )}
      {failure === undefined ? undefined : (
        <p role="alert" className="text-danger">
          {failure}
        </p>
      )}
      {message === undefined ? undefined : <output>{message}</output>}
      {summary === undefined ? undefined : (
        <output className="text-xs text-text-muted">
          {`Wires: retained ${summary.wireChanges.retained.length}; added ${summary.wireChanges.added.length}; changed ${summary.wireChanges.changed.length}; removed ${summary.wireChanges.removed.length}. Protected wires: ${summary.protectedWireIds.length}; diode changes: ${summary.diodeKeyIds.length}; unconnected pins: ${summary.unconnectedPins.length}.`}
          {summary.settingsChanged ? ' Routing settings will change.' : ''}
        </output>
      )}
      {summary?.warnings.map((warning) => (
        <p className="text-warning" key={warning.message}>
          {warning.message}
        </p>
      ))}
      <ProtectedWireLinks protectedWireIds={protectedWireIds} onInspectWire={handleInspectWire} />
    </>
  );
}

function ProtectedWireLinks({
  protectedWireIds,
  onInspectWire: handleInspectWire,
}: Pick<Props, 'protectedWireIds' | 'onInspectWire'>) {
  if (protectedWireIds.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {protectedWireIds.map((wireId) => (
        <Button
          key={wireId}
          onClick={() => {
            handleInspectWire(wireId);
          }}
          size="sm"
        >{`Inspect protected wire ${wireId}`}</Button>
      ))}
      <p className="text-xs text-text-muted">Cancel the preview before unlocking wires.</p>
    </div>
  );
}
