import { Button } from '@ui/components/components';
import { LayoutPreviewButtons } from '@ui/schematic/layout/components';
import type { useSchematicWorkspace } from '@ui/schematic/logic';

type SchematicPreviewBarProps = {
  readonly workspace: ReturnType<typeof useSchematicWorkspace>;
};

export function SchematicPreviewBar({ workspace }: SchematicPreviewBarProps) {
  const { wiring, layout } = workspace;
  if (!wiring.hasPreview && !layout.hasPreview) {
    return null;
  }
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface-raised p-2 xl:ml-6">
      <p className="font-semibold text-warning">
        <span>{wiring.hasPreview ? 'Wiring preview' : 'Layout preview'}</span> — unsaved
      </p>
      {wiring.hasPreview ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={wiring.handleApply}>
            Apply wiring
          </Button>
          <Button variant="secondary" onClick={wiring.handleCancel}>
            Cancel wiring
          </Button>
        </div>
      ) : (
        <>
          {layout.canApply ? undefined : (
            <p className="text-xs">
              No layout changes: existing electrical connections and processing limits are
              preserved. Adjust the geometry or repair the affected wires.
            </p>
          )}
          <LayoutPreviewButtons
            hasPreview
            canApply={layout.canApply}
            onApply={layout.handleApply}
            onCancel={layout.handleCancel}
          />
        </>
      )}
    </div>
  );
}
