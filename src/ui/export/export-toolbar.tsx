import { getControllerBoard } from '../../catalog/get-controller-board';
import { SHIELD_TARGET } from '../../catalog/shield-target';
import { Button } from '../components/button';
import { DocsLink } from '../components/docs-link';
import type { useExportActions } from './use-export-actions';

type ExportToolbarProps = {
  readonly controllerId: string;
  readonly includeWorkflow: boolean;
  readonly onWorkflowChange: (value: boolean) => void;
  readonly problemCount: number;
  readonly actions: ReturnType<typeof useExportActions>;
};
export function ExportToolbar({
  controllerId,
  includeWorkflow,
  onWorkflowChange,
  problemCount,
  actions,
}: ExportToolbarProps) {
  const hint = problemCount > 0 ? `Fix ${problemCount} problems to download` : undefined;
  return (
    <div className="flex flex-col items-start gap-2">
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
      <Button
        variant="primary"
        isDisabled={problemCount > 0 || actions.isBuildingZip}
        hint={hint}
        aria-busy={actions.isBuildingZip}
        onClick={() => {
          void actions.handleZipDownload();
        }}
      >
        {actions.isBuildingZip ? 'Building zip…' : 'Download .zip'}
      </Button>
      {hint === undefined ? undefined : <p className="text-text-muted">{hint}</p>}
    </div>
  );
}

function ExportTarget({ controllerId }: { readonly controllerId: string }) {
  const board = getControllerBoard(controllerId);
  return (
    <>
      <p className="flex flex-wrap items-center gap-2 text-text-muted">
        {`Target: ${board.id} · ZMK ${SHIELD_TARGET.zmkVersion}.`}
        <DocsLink href={board.docsUrl} topic="Target controller" />
      </p>
      <p className="text-text-muted">{board.description} Connector pins are shown as D numbers.</p>
    </>
  );
}
