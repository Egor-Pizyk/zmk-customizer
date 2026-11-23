import { getWirePath } from '@domain/wires/geometry';
import { setWireLocked } from '@domain/wires/protection';
import type { Project, Wire } from '@domain';
import { toScreenPoint } from '@ui/canvas/logic';
import type { ContentView } from '@ui/canvas/logic';
import { getSelectedWireIds } from '@ui/schematic/rendering/logic';
import type { SchematicSelection } from '@ui/schematic/interaction';
import { WireLockIcon } from '@ui/components/icons';

type Props = {
  readonly project: Project;
  readonly selection?: SchematicSelection;
  readonly view: ContentView;
  readonly isReadOnly?: boolean | undefined;
  readonly commit: (change: (project: Project) => Project) => void;
};

export function WireLockButtons({ project, view, commit, isReadOnly, selection }: Props) {
  if (isReadOnly === true || view.zoom < 0.5) {
    return null;
  }
  const selected =
    project.wiring?.kind === 'direct' ? getSelectedWireIds(project, selection) : undefined;
  return project.wires.map((wire, index) => {
    const at = lockPosition(project, wire, view);
    if (at === undefined) {
      return null;
    }
    const isLocked = wire.locked === true;
    const concealed = selected !== undefined && !selected.has(wire.id) && !isLocked;
    const label = `${isLocked ? 'Unlock' : 'Lock'} wire ${index} on diagram`;
    function handleToggle() {
      commit((current) => setWireLocked(current, { wireId: wire.id, isLocked: !isLocked }));
    }
    return (
      <foreignObject
        height={24}
        width={24}
        x={at.xPx + 4}
        y={at.yPx - 28}
        key={wire.id}
        pointerEvents={concealed ? 'none' : undefined}
      >
        <button
          aria-label={label}
          aria-pressed={isLocked}
          title={label}
          type="button"
          onClick={handleToggle}
          className={`flex size-6 items-center justify-center rounded-sm bg-surface text-text focus-visible:outline-2 focus-visible:outline-focus aria-pressed:text-accent ${concealed ? 'pointer-events-none opacity-0 focus:pointer-events-auto focus:opacity-100' : 'pointer-events-auto'}`}
        >
          <WireLockIcon isLocked={isLocked} />
        </button>
      </foreignObject>
    );
  });
}

function lockPosition(
  project: Project,
  wire: Wire,
  view: ContentView,
): ReturnType<typeof toScreenPoint> | undefined {
  const [first, next] = getWirePath(project, wire);
  if (first === undefined || next === undefined) {
    return undefined;
  }
  return toScreenPoint(view, { xU: (first.xU + next.xU) / 2, yU: (first.yU + next.yU) / 2 });
}
