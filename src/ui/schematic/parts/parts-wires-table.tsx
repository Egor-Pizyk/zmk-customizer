import { removeWire } from '@domain';
import type { Wire, WireEndSide } from '@domain';
import { Button } from '@ui/components';
import { AddWireForm } from './add-wire-form';
import { BoardPinSelect } from '../wiring/board-pin-select';
import { focusAfterDelete } from '../interaction/focus-after-delete';
import { formatWireEnd } from '../format-schematic-labels';
import type { PartsTableProps } from './parts-list';
import { PartsTableHead } from './parts-table-head';
import { WireBendsEditor } from './wire-bends-editor';

const COLUMNS = ['Wire', 'From', 'To', 'Bends'];

export function PartsWiresTable(props: PartsTableProps) {
  const { project } = props;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">Wires</h3>
      {project.wires.length === 0 ? (
        <p className="text-text-muted">
          No wires yet. Pick the Wire tool and click a pin, or add one here.
        </p>
      ) : (
        <table className="w-full text-left">
          <PartsTableHead columns={COLUMNS} hasActions />
          <tbody>
            {project.wires.map((wire, wireIndex) => (
              <WireRow {...props} key={wire.id} wire={wire} wireIndex={wireIndex} />
            ))}
          </tbody>
        </table>
      )}
      {project.keys.length === 0 ? undefined : <AddWireForm {...props} />}
    </div>
  );
}

type WireRowProps = PartsTableProps & { readonly wire: Wire; readonly wireIndex: number };

function WireRow(props: WireRowProps) {
  const { project, selection, onSelectionChange, commit, wire, wireIndex } = props;
  const isSelected =
    (selection?.kind === 'wire' && selection.wireId === wire.id) ||
    (selection?.kind === 'multi' && selection.wireIds.includes(wire.id));

  function handleFocus() {
    onSelectionChange({ kind: 'wire', wireId: wire.id });
  }

  function handleDeleteClick() {
    commit((current) => removeWire(current, { wireId: wire.id }), `Deleted wire ${wireIndex}`);
    onSelectionChange();
    focusAfterDelete({ table: 'wire', index: wireIndex });
  }

  return (
    <tr
      className="align-top data-selected:bg-surface-muted"
      data-selected={isSelected || undefined}
      onFocus={handleFocus}
    >
      <th className="pr-2 font-medium" scope="row">{`Wire ${wireIndex}`}</th>
      <WireEndCell {...props} side="start" />
      <WireEndCell {...props} side="end" />
      <td className="pr-2">
        <WireBendsEditor commit={commit} project={project} wire={wire} wireIndex={wireIndex} />
      </td>
      <td>
        <Button
          aria-label={`Delete wire ${wireIndex}`}
          data-parts-delete={`wire:${wireIndex}`}
          onClick={handleDeleteClick}
          size="sm"
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}

function WireEndCell(props: WireRowProps & { readonly side: WireEndSide }) {
  const { project, wire, wireIndex, side } = props;
  const end = wire[side];
  return (
    <td className="pr-2">
      {end.kind === 'free' ? (
        <BoardPinSelect {...props} boardPin={end.boardPin} side={side} wireIndex={wireIndex} />
      ) : (
        <span data-issue-path={`wires.${wireIndex} wires.${wireIndex}.${side}`} tabIndex={-1}>
          {formatWireEnd(project, end)}
        </span>
      )}
    </td>
  );
}
