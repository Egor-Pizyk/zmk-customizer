import { Button } from '../components/button';
import { BindingLine } from './binding-line';
import type { PickHandlers } from './create-pick-handlers';
import { SlotExtras } from './slot-extras';
import { SlotPicker } from './slot-picker';
import type { KeyPickerState } from './use-key-picker';

type ActionPanelBodyProps = {
  readonly picker: KeyPickerState;
  readonly handlers: PickHandlers;
  readonly selectionName: string;
  readonly selectedCount: number;
  readonly canPaste: boolean;
  readonly onCopy: () => void;
  readonly onPaste: () => void;
  readonly onEscapeToCanvas: () => void;
};

// The selection, its binding line, the open slot's picker and options (spec 006 FR-001–FR-010).
export function ActionPanelBody(props: ActionPanelBodyProps) {
  const { picker, handlers, selectedCount } = props;
  if (selectedCount === 0) {
    return <p className="text-text-muted">Select a keycap to choose what it does.</p>;
  }
  return (
    <>
      <SelectionHeader {...props} />
      <BindingLine
        onAddTap={handlers.handleAddTap}
        onSlotOpen={picker.handleSlotOpen}
        slot={picker.slot}
        source={picker.source}
      />
      <SlotPicker
        onEscapeToCanvas={props.onEscapeToCanvas}
        onPick={handlers.handlePick}
        picker={picker}
      />
      <SlotExtras handlers={handlers} picker={picker} />
    </>
  );
}

// Which keys the panel edits, with copy and paste of their action (spec 004 FR-018).
function SelectionHeader(props: ActionPanelBodyProps) {
  const { selectionName, selectedCount, canPaste } = props;
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="font-semibold">
        {selectedCount === 1 ? selectionName : `${selectionName} selected`}
      </p>
      <div className="flex gap-1">
        <Button
          hint={selectedCount === 1 ? 'Copy this action' : 'Select one key to copy its action'}
          isDisabled={selectedCount !== 1}
          onClick={props.onCopy}
          size="sm"
          variant="ghost"
        >
          Copy
        </Button>
        <Button
          hint={canPaste ? 'Paste the copied action' : 'Copy an action first'}
          isDisabled={!canPaste}
          onClick={props.onPaste}
          size="sm"
          variant="ghost"
        >
          Paste
        </Button>
      </div>
    </div>
  );
}
