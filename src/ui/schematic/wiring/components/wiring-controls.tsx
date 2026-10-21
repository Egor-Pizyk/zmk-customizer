import { WiringOptionsControls } from './wiring-options-controls';
import { WiringHalfControls } from './wiring-half-controls';
import { getControllerBoard } from '@catalog/controllers';
import { initializeWiring } from '@domain/wiring/editing';
import type { Half, Project } from '@domain';
import { Button } from '@ui/components/components';
import { WiringTable } from './wiring-table';
import type { useWiringPreview } from '@ui/schematic/wiring/logic';
import { getProjectAnalysis } from '@ui/project/logic';
import { useState } from 'react';

type WiringControlsProps = ReturnType<typeof useWiringPreview>;
export function WiringControls(props: WiringControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const board = getControllerBoard(props.previewProject.controllerId);
  const project = initializeWiring(props.previewProject, board);
  return (
    <section className="shrink-0 border-t border-border bg-surface-raised">
      <details
        name="schematic-editor"
        data-wiring-controls
        open={isOpen || props.hasPreview}
        onToggle={(event) => {
          setIsOpen(event.currentTarget.open);
          if (!event.currentTarget.open && props.hasPreview) {
            props.handleCancel();
          }
        }}
      >
        <summary className="cursor-pointer px-4 py-2 focus-visible:outline-2 focus-visible:outline-focus">
          <h2 className="inline text-base font-semibold">Wiring</h2>
        </summary>
        <WiringContent {...props} project={project} />
      </details>
    </section>
  );
}

function WiringContent(props: WiringControlsProps & { readonly project: Project }) {
  const { project } = props;
  const board = getControllerBoard(project.controllerId);
  const wiring = project.wiring;
  if (wiring === undefined) {
    return null;
  }
  const handleCell = (cell: { keyId: string; row: number; col: number; half: Half }) => {
    props.handleEdit({ kind: 'cell', ...cell, board });
  };
  return (
    <div className="flex max-h-96 flex-col gap-4 overflow-auto px-4 pb-4">
      {props.hasPreview ? <p className="font-semibold">Wiring preview</p> : undefined}
      <p className="text-text-muted">
        Assignments change the actual schematic connections. Inspect rerouted wires and diode
        changes before applying. Rebuild wiring uses visible centers and the current grid; adjust
        irregular clusters in the table. Completion and rebuilding propose free GPIOs; review these
        against your physical hardware before applying. These pins are not detected hardware wiring.
      </p>
      <WiringProposalSummary {...props} />
      <WiringOptionsControls project={project} onEdit={props.handleEdit} />
      {(['left', ...(wiring.topology === 'split' ? (['right'] as const) : [])] as const).map(
        (half) => (
          <WiringHalfControls
            key={half}
            half={half}
            project={project}
            onEdit={props.handleEdit}
            onAssignCell={handleCell}
          />
        ),
      )}
      <WiringTable project={project} onAssignCell={handleCell} />
      <WiringFeedback {...props} />
      <WiringActions {...props} />
    </div>
  );
}

function WiringFeedback(props: WiringControlsProps) {
  const issues = props.hasPreview
    ? getProjectAnalysis(props.previewProject).issues.filter(
        (issue) =>
          issue.code.startsWith('wiring-') ||
          issue.code === 'board-pin-conflict' ||
          issue.code === 'matrix-diode-conflict' ||
          issue.code === 'keys-in-parallel',
      )
    : [];

  return (
    <>
      {props.failure === undefined ? undefined : (
        <p role="alert" className="text-danger">
          {props.failure}
        </p>
      )}
      {issues.length === 0 ? undefined : (
        <ul className="text-danger">
          {issues.map((issue) => (
            <li key={`${issue.code}:${issue.path.join('.')}`}>{issue.message}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function WiringActions(props: WiringControlsProps) {
  return (
    <>
      {' '}
      {props.hasPreview ? (
        <div className="flex gap-2">
          <Button variant="primary" onClick={props.handleApply}>
            Apply wiring
          </Button>
          <Button variant="secondary" onClick={props.handleCancel}>
            Cancel wiring
          </Button>
        </div>
      ) : undefined}
    </>
  );
}

function WiringProposalSummary(props: WiringControlsProps) {
  return (
    <>
      {props.summary === undefined ? undefined : (
        <output>{`Retained ${props.summary.retained}; added ${props.summary.added}; rerouted ${props.summary.rerouted}; removed ${props.summary.removed}. Keys: ${props.summary.keyIds.join(', ') || 'none'}; terminals: ${props.summary.terminalIds.join(', ') || 'none'}.`}</output>
      )}
      {props.message === undefined ? undefined : <output>{props.message}</output>}
    </>
  );
}
