import { useDiagramHost } from '@ui/schematic/diagram/logic';
import { Button } from '@ui/components/components';
import type { DiagramHostInput } from '@ui/schematic/diagram/logic';

export function SchematicDiagram(props: DiagramHostInput) {
  const { hostRef, isUnavailable, retry: handleRetry } = useDiagramHost(props);
  return (
    <>
      <div
        className="absolute inset-0"
        data-canvas-input-disabled={isUnavailable || undefined}
        ref={hostRef}
      />
      {isUnavailable ? (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface">
          <output>Diagram unavailable. Use the Parts list to inspect your project.</output>
          <Button onClick={handleRetry}>Retry diagram</Button>
        </div>
      ) : undefined}
    </>
  );
}
