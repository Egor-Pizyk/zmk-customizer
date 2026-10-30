import type { ComponentProps } from 'react';
import { WiringHalfControls } from './wiring-half-controls';
import { WiringPinControls } from './wiring-pin-controls';
import { WiringTable } from './wiring-table';

type Props = Omit<ComponentProps<typeof WiringHalfControls>, 'half'>;

export function WiringAssignments(props: Props) {
  const { project, onEdit: handleEdit } = props;
  const halves =
    project.wiring?.topology === 'split' ? (['left', 'right'] as const) : (['left'] as const);
  return (
    <>
      {halves.map((half) => (
        <fieldset key={half} className="flex flex-wrap gap-2">
          <legend className="font-semibold">{half} GPIO</legend>
          <WiringPinControls project={project} half={half} onEdit={handleEdit} />
        </fieldset>
      ))}
      <details>
        <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-focus">
          Manual assignments
        </summary>
        <div className="flex flex-col gap-4 pt-3">
          {halves.map((half) => (
            <WiringHalfControls key={half} {...props} half={half} />
          ))}
          <WiringTable project={project} onAssignCell={props.onAssignCell} />
        </div>
      </details>
    </>
  );
}
