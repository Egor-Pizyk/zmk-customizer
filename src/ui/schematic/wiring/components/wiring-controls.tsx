import type { ReactNode, ComponentProps } from 'react';
import { WiringRoutingControls } from './wiring-routing-controls';
import { WiringOptionsControls } from './wiring-options-controls';
import { WiringAssignments } from './wiring-assignments';
import { getControllerBoard } from '@catalog/controllers';
import { initializeWiring } from '@domain/wiring/editing';
import type { Half, Project } from '@domain';
import type { useWiringPreview } from '@ui/schematic/wiring/logic';
import { useProject, getProjectAnalysis } from '@ui/project/logic';
import { useState } from 'react';

type WiringControlsProps = ReturnType<typeof useWiringPreview> & {
  readonly children?: ReactNode;
  readonly selection?: ComponentProps<typeof WiringRoutingControls>['selection'];
};
export function WiringControls(props: WiringControlsProps) {
  const { tutorial } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const board = getControllerBoard(props.previewProject.controllerId);
  const project = initializeWiring(props.previewProject, board);
  return (
    <section className="shrink-0 border-t border-border bg-surface-raised">
      <details
        name="schematic-editor"
        data-wiring-controls
        open={
          isOpen ||
          props.hasPreview ||
          tutorial?.record.stepId === 'wiring' ||
          tutorial?.record.stepId === 'pins'
        }
        onToggle={(event) => {
          setIsOpen(event.currentTarget.open);
          if (!event.currentTarget.open && props.hasPreview) {
            props.handleCancel();
          }
        }}
      >
        <summary className="cursor-pointer px-4 py-2 focus-visible:outline-2 focus-visible:outline-focus">
          <h2 className="inline text-base font-semibold">Wiring</h2>
          {props.hasPreview ? <span className="ml-2 text-xs text-warning">Preview</span> : null}
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
  const configuration = <WiringOptionsControls project={project} onEdit={props.handleEdit} />;
  return (
    <WiringRoutingControls
      project={props.previewProject}
      selection={props.selection}
      hasPreview={props.hasPreview}
      onEdit={props.handleEdit}
      configuration={configuration}
    >
      {props.hasPreview ? <WiringPreviewInfo {...props} /> : undefined}
      <WiringAssignments project={project} onEdit={props.handleEdit} onAssignCell={handleCell} />
      <WiringFeedback {...props} />
    </WiringRoutingControls>
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

  return issues.length === 0 ? undefined : (
    <ul className="text-danger">
      {issues.map((issue) => (
        <li key={`${issue.code}:${issue.path.join('.')}`}>{issue.message}</li>
      ))}
    </ul>
  );
}

function WiringPreviewInfo(props: WiringControlsProps) {
  return (
    <>
      <p>
        Select keys and wires to inspect. Apply to save; Cancel or Escape to discard. Opening
        another editor discards this preview.
      </p>
      <details aria-label="Inspect wire sections">
        <summary className="cursor-pointer focus-visible:outline-2 focus-visible:outline-focus">
          Inspect wire sections
        </summary>
        {props.children}
      </details>
    </>
  );
}
