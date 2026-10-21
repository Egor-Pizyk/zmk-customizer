import { SHIELD_TARGET } from '@catalog/firmware';
import { Button, Dialog } from '@ui/components/components';
import { useProject } from '@ui/project/logic';
import { useAgentPackageDownload } from '@ui/shell/logic';

type CreateWithAgentDialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function CreateWithAgentDialog({ isOpen, onClose }: CreateWithAgentDialogProps) {
  const { announce } = useProject();
  const download = useAgentPackageDownload(announce);

  function handleClose() {
    download.cancelDownload();
    onClose();
  }

  function handleDownload() {
    void download.handleDownload();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Create with agent">
      <AgentInstructions />
      <Button
        aria-busy={download.isBuilding || undefined}
        isDisabled={download.isBuilding}
        onClick={handleDownload}
        variant="primary"
      >
        {download.isBuilding ? 'Building package…' : 'Download agent package'}
      </Button>
      {download.message === undefined ? undefined : <p>{download.message}</p>}
    </Dialog>
  );
}

function AgentInstructions() {
  return (
    <>
      <p>Create a new keyboard with your own AI agent, then review it here.</p>
      <ol className="flex list-decimal flex-col gap-3 pl-5">
        <li>
          Download and unzip the package. Give all files and your keyboard description to your
          agent.
        </li>
        <li>
          Answer hardware questions or approve proposed pins and wiring. Ask for a complete Project
          JSON file.
        </li>
        <li>
          Save your current project, then use Open to load the result. Review Problems, Schematic,
          Bindings and Firmware before downloading from Export.
        </li>
      </ol>
      <p className="text-text-muted">
        The package includes the current schema, supported catalogs, a ready prompt and complete
        examples for ZMK {SHIELD_TARGET.zmkVersion}. It contains no current project data. AI runs in
        your chosen environment.
      </p>
      <p className="text-text-muted">
        Open asks before replacing your project and resets its undo history. Validation does not
        prove firmware compilation or hardware operation. This flow creates a new project; editing
        an existing project is not included.
      </p>
    </>
  );
}
