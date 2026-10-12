import { CONTROLLER_BOARDS } from '../../catalog/controller-boards';
import { getControllerBoard } from '../../catalog/get-controller-board';
import { changeController } from '../../domain/change-controller';
import type { Project } from '../../domain/types';
import { DocsLink } from '../components/docs-link';
import { Field } from '../components/field';
import { INPUT_CLASSES } from '../components/input-classes';

type ControllerPanelProps = {
  readonly project: Project;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
};

export function ControllerPanel({ project, commit }: ControllerPanelProps) {
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
  return (
    <section aria-labelledby="controller-title" className="flex shrink-0 flex-col gap-2 px-4">
      <h2 className="text-base font-semibold" id="controller-title">
        Controller
      </h2>
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
      <ControllerDetails controllerId={board.id} />
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
