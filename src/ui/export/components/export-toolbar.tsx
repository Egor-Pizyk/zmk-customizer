import { getControllerBoard } from '@catalog/controllers';
import { SHIELD_TARGET } from '@catalog/firmware';
import { Button, DocsLink } from '@ui/components/components';
import type { useExportActions } from '@ui/export/logic';

type ExportToolbarProps = {
  readonly controllerId: string;
  readonly includeWorkflow: boolean;
  readonly onWorkflowChange: (value: boolean) => void;
  readonly actions: ReturnType<typeof useExportActions>;
};
export function ExportToolbar({
  controllerId,
  includeWorkflow,
  onWorkflowChange,
  actions,
}: ExportToolbarProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="primary"
        isDisabled={actions.isBuildingZip}
        aria-busy={actions.isBuildingZip}
        onClick={() => {
          void actions.handleZipDownload();
        }}
      >
        {actions.isBuildingZip ? 'Building zip…' : 'Download .zip'}
      </Button>
      <ExportTarget controllerId={controllerId} />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={includeWorkflow}
          onChange={(event) => {
            onWorkflowChange(event.target.checked);
          }}
        />
        Include GitHub Actions workflow
      </label>
      <p className="flex flex-wrap items-center gap-2 text-text-muted">
        {SHIELD_TARGET.workflowDescription}
        <DocsLink href={SHIELD_TARGET.workflowDocsUrl} topic="GitHub Actions builds" />
      </p>
    </div>
  );
}

function ExportTarget({ controllerId }: { readonly controllerId: string }) {
  const board = getControllerBoard(controllerId);
  return (
    <p className="flex flex-wrap items-center gap-2 text-text-muted">
      {`Target: ${board.id} · ZMK ${SHIELD_TARGET.zmkVersion}.`}
      <DocsLink href={board.docsUrl} topic="Target controller" />
    </p>
  );
}
