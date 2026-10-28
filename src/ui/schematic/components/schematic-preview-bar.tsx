import { WiringPreviewFeedback } from '@ui/schematic/wiring/components';
import { Button } from '@ui/components/components';
import { LayoutPreviewButtons } from '@ui/schematic/layout/components';
import type { useSchematicWorkspace } from '@ui/schematic/logic';

type Props = { readonly workspace: ReturnType<typeof useSchematicWorkspace> };

export function SchematicPreviewBar({ workspace }: Props) {
  const { wiring, layout } = workspace;
  if (!wiring.hasPreview && !layout.hasPreview) {
    return null;
  }
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface-raised p-2 xl:mr-6">
      <p className="font-semibold text-warning">
        <span>{wiring.hasPreview ? 'Wiring preview' : 'Layout preview'}</span> —{' '}
        {wiring.hasPreview ? getWiringStatus(wiring) : 'unsaved'}
      </p>
      {wiring.hasPreview ? (
        <WiringPreviewSection workspace={workspace} />
      ) : (
        <LayoutPreviewSection layout={layout} />
      )}
    </div>
  );
}

function WiringPreviewSection({ workspace }: Props) {
  const { wiring } = workspace;
  function handleInspectWire(wireId: string) {
    workspace.handleSelectionChange({ kind: 'wire', wireId });
  }
  return (
    <>
      <WiringPreviewFeedback {...wiring} onInspectWire={handleInspectWire} />
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" isDisabled={!wiring.canApply} onClick={wiring.handleApply}>
          Apply wiring
        </Button>
        {wiring.phase === 'stale' || wiring.phase === 'refused' ? (
          <Button onClick={wiring.handleRecalculate}>Recalculate wiring</Button>
        ) : undefined}
        <Button variant="secondary" onClick={wiring.handleCancel}>
          Cancel wiring
        </Button>
      </div>
    </>
  );
}

function LayoutPreviewSection({ layout }: { readonly layout: Props['workspace']['layout'] }) {
  return (
    <>
      {layout.canApply ? undefined : (
        <p className="text-xs">
          No layout changes: existing electrical connections and processing limits are preserved.
          Adjust the geometry or repair the affected wires.
        </p>
      )}
      <LayoutPreviewButtons
        hasPreview
        canApply={layout.canApply}
        onApply={layout.handleApply}
        onCancel={layout.handleCancel}
      />
    </>
  );
}

function getWiringStatus(wiring: Props['workspace']['wiring']) {
  if (wiring.phase === 'calculating') {
    return 'calculating';
  }
  if (wiring.phase === 'stale') {
    return 'out of date';
  }
  if (wiring.phase === 'refused') {
    return 'not applied';
  }
  return wiring.canApply ? 'unsaved' : 'no changes';
}
