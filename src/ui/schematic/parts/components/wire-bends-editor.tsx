import { useProject } from '@ui/project/logic';
import { getWirePath } from '@domain/wires/geometry';
import { setWireBends, getWireBendsResourceError } from '@domain/wires/editing';
import { roundU } from '@domain/geometry';
import type { Wire, WirePoint } from '@domain';
import { Button, NumberInput } from '@ui/components/components';
import type { PartsTableProps } from './parts-list';
import { toSlotKeys } from '@ui/schematic/parts/logic';

type WireBendsEditorProps = Pick<PartsTableProps, 'project' | 'commit'> & {
  readonly wire: Wire;
  readonly wireIndex: number;
};

// Keyboard path for bend points (FR-011, FR-028); the canvas drags the same values. A new bend
// goes halfway along the last segment, where it is visible and does not change the shape.
export function WireBendsEditor({ project, commit, wire, wireIndex }: WireBendsEditorProps) {
  const { announce } = useProject();
  function handleBendsChange(bends: readonly WirePoint[]) {
    const resourceError =
      wire.locked === true
        ? `Wire ${wireIndex} is locked. Unlock it before changing bends.`
        : getWireBendsResourceError(project, { wireId: wire.id, bends });
    if (resourceError !== undefined) {
      announce(resourceError);
      return;
    }
    commit((current) => setWireBends(current, { wireId: wire.id, bends }));
  }

  function handleAddClick() {
    const middle = getNewBend(project, wire);
    handleBendsChange([...wire.bends, middle]);
  }

  return (
    <div className="flex flex-col gap-1">
      {toSlotKeys({ prefix: wire.id, count: wire.bends.length }).map((slotKey, bendIndex) => (
        <BendRow
          bend={wire.bends[bendIndex] ?? { xU: 0, yU: 0 }}
          bendIndex={bendIndex}
          bends={wire.bends}
          key={slotKey}
          onBendsChange={handleBendsChange}
          wireIndex={wireIndex}
        />
      ))}
      <Button
        aria-label={`Add a bend to wire ${wireIndex}`}
        className="self-start"
        onClick={handleAddClick}
        size="sm"
      >
        Add bend
      </Button>
    </div>
  );
}

type BendRowProps = {
  readonly bends: readonly WirePoint[];
  readonly bend: WirePoint;
  readonly bendIndex: number;
  readonly wireIndex: number;
  readonly onBendsChange: (bends: readonly WirePoint[]) => void;
};

function BendRow({ bends, bend, bendIndex, wireIndex, onBendsChange }: BendRowProps) {
  const name = `Wire ${wireIndex} bend ${bendIndex}`;

  function handleXCommit(xU: number) {
    onBendsChange(bends.with(bendIndex, { xU, yU: bend.yU }));
  }

  function handleYCommit(yU: number) {
    onBendsChange(bends.with(bendIndex, { xU: bend.xU, yU }));
  }

  function handleRemoveClick() {
    onBendsChange(bends.toSpliced(bendIndex, 1));
  }

  return (
    <div className="flex items-center gap-1">
      <NumberInput label={`${name} X (u)`} onCommit={handleXCommit} value={bend.xU} />
      <NumberInput label={`${name} Y (u)`} onCommit={handleYCommit} value={bend.yU} />
      <Button aria-label={`Remove ${name.toLowerCase()}`} onClick={handleRemoveClick} size="sm">
        Remove
      </Button>
    </div>
  );
}

function getNewBend(project: WireBendsEditorProps['project'], wire: Wire): WirePoint {
  const path = getWirePath(project, wire);
  const end = path.at(-1) ?? { xU: 0, yU: 0 };
  const previous = path.at(-2) ?? end;
  return {
    xU: roundU((previous.xU + end.xU) / 2),
    yU: roundU((previous.yU + end.yU) / 2),
  };
}
