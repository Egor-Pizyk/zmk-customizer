import { addWire } from '@domain/wires/editing';
import { canAddWire } from '@domain/wires';
import type { WireEnd } from '@domain';
import { Button } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import { FREE_END_VALUE, listPinOptions, toStartPin, toTargetEnd } from '@ui/schematic/interaction';
import { formatWireCheck } from '@ui/schematic/formatting';
import type { PartsTableProps } from './parts-list';
import { useState } from 'react';
import type { ChangeEvent } from 'react';

function useAddWireEnds(project: PartsTableProps['project']) {
  const pinOptions = listPinOptions(project);
  const [fromValue, setFromValue] = useState<string | undefined>();
  const [toValue, setToValue] = useState(FREE_END_VALUE);
  // A stored choice whose key or wire was deleted falls back to the first option (003 review M1).
  const isFromListed = pinOptions.some((option) => option.value === fromValue);
  const from = isFromListed && fromValue !== undefined ? fromValue : (pinOptions[0]?.value ?? '');
  const isToListed =
    toValue === FREE_END_VALUE ||
    toValue === 'ground' ||
    pinOptions.some((option) => option.value === toValue) ||
    project.wires.some((wire) => `wire:${wire.id}` === toValue);
  const startPin = toStartPin(from);
  const start = startPin === undefined ? undefined : startEndpoint(startPin);
  const end =
    startPin === undefined
      ? undefined
      : toTargetEnd(project, { value: isToListed ? toValue : FREE_END_VALUE, start: startPin });
  const shownToValue = isToListed ? toValue : FREE_END_VALUE;
  return { pinOptions, from, toValue: shownToValue, start, end, setFromValue, setToValue };
}

export function AddWireForm({ project, commit }: PartsTableProps) {
  const state = useAddWireEnds(project);
  const { start, end } = state;
  const check =
    start === undefined || end === undefined ? 'no-key-pin' : canAddWire(project, { start, end });
  const isAllowed = check === 'ok';

  function handleAddClick() {
    if (start !== undefined && end !== undefined && isAllowed) {
      commit(
        (current) => addWire(current, { start, end, bends: [] }),
        `Added wire ${project.wires.length}`,
      );
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <WireEndSelects project={project} state={state} />
      <Button
        data-parts-add="wire"
        hint={check === 'ok' ? undefined : formatWireCheck(check)}
        isDisabled={!isAllowed}
        onClick={handleAddClick}
        size="sm"
        variant="secondary"
      >
        Add wire
      </Button>
    </div>
  );
}

function PinOptions({ options }: { readonly options: ReturnType<typeof listPinOptions> }) {
  return options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));
}

type WireEndSelectsProps = {
  readonly project: PartsTableProps['project'];
  readonly state: ReturnType<typeof useAddWireEnds>;
};

function WireEndSelects({ project, state }: WireEndSelectsProps) {
  function handleFromChange(event: ChangeEvent<HTMLSelectElement>) {
    state.setFromValue(event.target.value);
  }

  function handleToChange(event: ChangeEvent<HTMLSelectElement>) {
    state.setToValue(event.target.value);
  }

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-text-muted">From</span>
        <select className={INPUT_CLASSES} onChange={handleFromChange} value={state.from}>
          <PinOptions options={state.pinOptions} />
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-text-muted">To</span>
        <select className={INPUT_CLASSES} onChange={handleToChange} value={state.toValue}>
          <option value="ground">GND</option>
          <option value={FREE_END_VALUE}>Free end</option>
          <PinOptions options={state.pinOptions} />
          {project.wires.map((wire, wireIndex) => (
            <option
              key={wire.id}
              value={`wire:${wire.id}`}
            >{`Wire ${wireIndex} (junction)`}</option>
          ))}
        </select>
      </label>
    </>
  );
}

function startEndpoint(pin: NonNullable<ReturnType<typeof toStartPin>>): WireEnd {
  if ('encoderId' in pin) {
    return { kind: 'encoder-pin', ...pin };
  }
  return { kind: 'key-pin', ...pin };
}
