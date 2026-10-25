import { useProject } from '@ui/project/logic';
import { useState } from 'react';
import { CONTROLLER_BOARDS, getControllerBoard } from '@catalog/controllers';
import { changeController } from '@domain/project';
import type { Project } from '@domain';
import { DocsLink, Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';

type ControllerPanelProps = {
  readonly project: Project;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
};

export function ControllerPanel({ project, commit }: ControllerPanelProps) {
  const { tutorial } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const { board, handleChange } = useControllerActions({ project, commit });
  return (
    <section data-onboarding-target="controller" aria-labelledby="controller-title">
      <details
        name="schematic-editor"
        open={isOpen || tutorial?.record.stepId === 'controller'}
        onToggle={(event) => {
          setIsOpen(event.currentTarget.open);
        }}
        className="shrink-0 border-b border-border px-4 py-2"
      >
        <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-focus">
          <h2 className="inline text-base font-semibold" id="controller-title">
            Controller
          </h2>
        </summary>
        <ControllerField board={board} onChange={handleChange} />
        <ControllerDetails controllerId={board.id} />
      </details>
    </section>
  );
}

function ControllerDetails({ controllerId }: { readonly controllerId: string }) {
  const board = getControllerBoard(controllerId);
  return (
    <>
      <p className="text-text-muted">
        Reserved contacts: {board.reservedContacts.join(', ')}. Use connector GPIO pins for
        switches. <DocsLink href={board.docsUrl} topic={board.name} />
      </p>
      <p className="text-text-muted">
        Changing between Pro Micro and XIAO clears pin assignments. Reassign the listed endpoints or
        undo the change.
      </p>
    </>
  );
}

function useControllerActions({ project, commit }: ControllerPanelProps) {
  const board = getControllerBoard(project.controllerId);
  function handleChange(event: { readonly target: { readonly value: string } }) {
    const next = CONTROLLER_BOARDS.find((entry) => entry.id === event.target.value);
    if (next === undefined || next.id === project.controllerId) {
      return;
    }
    commit(
      (current) => changeController(current, { boardId: next.id, boards: CONTROLLER_BOARDS }),
      `Selected ${next.name}. Undo`,
    );
  }
  return { board, handleChange };
}

function ControllerField({
  board,
  onChange: handleChange,
}: {
  readonly board: ReturnType<typeof getControllerBoard>;
  readonly onChange: ReturnType<typeof useControllerActions>['handleChange'];
}) {
  return (
    <Field
      label="Controller board"
      description={board.description}
      renderControl={(controlProps) => (
        <select
          {...controlProps}
          className={INPUT_CLASSES}
          value={board.id}
          onChange={handleChange}
          data-issue-path="controllerId"
        >
          {CONTROLLER_BOARDS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      )}
    />
  );
}
