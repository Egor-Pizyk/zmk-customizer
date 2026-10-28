import { getWirePath } from '@domain/wires/geometry';
import { setWireLocked } from '@domain/wires/protection';
import type { Project } from '@domain';
import { toScreenPoint } from '@ui/canvas/logic';
import type { ContentView } from '@ui/canvas/logic';
import { WireLockIcon } from '@ui/components/icons';

type Props = {
  readonly project: Project;
  readonly view: ContentView;
  readonly isReadOnly?: boolean | undefined;
  readonly commit: (change: (project: Project) => Project) => void;
};

export function WireLockButtons({ project, view, commit, isReadOnly }: Props) {
  if (isReadOnly === true || view.zoom < 0.5) {
    return null;
  }
  return project.wires.map((wire, index) => {
    const path = getWirePath(project, wire);
    const first = path[0];
    const next = path[1];
    if (first === undefined || next === undefined) {
      return null;
    }
    const at = toScreenPoint(view, { xU: (first.xU + next.xU) / 2, yU: (first.yU + next.yU) / 2 });
    const isLocked = wire.locked === true;
    const label = `${isLocked ? 'Unlock' : 'Lock'} wire ${index} on diagram`;
    function handleToggle() {
      commit((current) => setWireLocked(current, { wireId: wire.id, isLocked: !isLocked }));
    }
    return (
      <foreignObject height={24} width={24} x={at.xPx + 4} y={at.yPx - 28} key={wire.id}>
        <button
          aria-label={label}
          aria-pressed={isLocked}
          title={label}
          type="button"
          onClick={handleToggle}
          className="pointer-events-auto flex size-6 items-center justify-center rounded-sm bg-surface text-text focus-visible:outline-2 focus-visible:outline-focus aria-pressed:text-accent"
        >
          <WireLockIcon isLocked={isLocked} />
        </button>
      </foreignObject>
    );
  });
}
