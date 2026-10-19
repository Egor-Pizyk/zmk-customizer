import type { LineBehavior, LineSource, SlotRef } from '@ui/bindings/picker/logic';
import type { CustomBehavior, Layer, Macro } from '@domain';
import { Button, DocsLink } from '@ui/components/components';
import { findLineBehavior, getLineSlots, isSameSlot } from '@ui/bindings/picker/logic';

type BindingLineProps = {
  readonly behaviors?: readonly CustomBehavior[];
  readonly macros?: readonly Macro[];
  readonly source: LineSource;
  readonly slot: SlotRef;
  /** Every layer, so a layer slot reads "1 Nav" (spec 007). */
  readonly layers: readonly Layer[];
  readonly onSlotOpen: (slot: SlotRef) => void;
  readonly onAddTap: () => void;
};

// The binding as the keymap reads it, one button per part (spec 006 FR-001): the behavior tag,
// then each slot with its label and value; the open part is pressed.
export function BindingLine(props: BindingLineProps) {
  const { source, slot, onSlotOpen: handleSlotOpen } = props;
  const behavior = findLineBehavior(source, props.behaviors, props.macros);
  const isTapDance = source.kind === 'binding' && source.binding.kind === 'tap_dance';
  return (
    <section aria-label="Binding" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-stretch gap-2">
        <SlotButton
          isOpen={slot.kind === 'behavior'}
          isTag
          label="behavior"
          onOpen={handleSlotOpen}
          slotRef={{ kind: 'behavior' }}
          value={behavior?.tag}
        />
        {getLineSlots(source, props.layers).map((lineSlot) => (
          <SlotButton
            isOpen={isSameSlot(lineSlot.ref, slot)}
            isTag={false}
            key={JSON.stringify(lineSlot.ref)}
            label={lineSlot.label}
            onOpen={handleSlotOpen}
            slotRef={lineSlot.ref}
            value={lineSlot.value}
          />
        ))}
        {isTapDance ? (
          <Button onClick={props.onAddTap} size="sm" variant="secondary">
            Add tap
          </Button>
        ) : undefined}
      </div>
      <BindingSummary behavior={behavior} source={source} />
    </section>
  );
}

type SlotButtonProps = {
  readonly slotRef: SlotRef;
  readonly label: string;
  readonly value: string | undefined;
  readonly isOpen: boolean;
  readonly isTag: boolean;
  readonly onOpen: (slot: SlotRef) => void;
};

function SlotButton({ slotRef, label, value, isOpen, isTag, onOpen }: SlotButtonProps) {
  function handleClick() {
    onOpen(slotRef);
  }

  return (
    <button
      aria-label={`${label}: ${value ?? 'not chosen'}`}
      aria-pressed={isOpen}
      className="flex min-h-14 max-w-full min-w-20 flex-col items-start justify-end gap-0.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 font-mono text-base break-all text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent data-empty:border-dashed data-empty:text-text-muted data-tag:text-accent"
      data-empty={value === undefined || undefined}
      data-tag={isTag || undefined}
      onClick={handleClick}
      type="button"
    >
      <span className="font-sans text-xs text-text-muted uppercase">{label}</span>
      {value ?? 'choose…'}
    </button>
  );
}

function BindingSummary({
  behavior,
  source,
}: {
  readonly behavior: LineBehavior | undefined;
  readonly source: LineSource;
}) {
  if (behavior === undefined) {
    return (
      <p className="text-xs text-text-muted">
        {source.kind === 'none' && source.isMixed
          ? 'The selected keys do different things. Choose a behavior to give them all the same one.'
          : 'Not assigned. Choose what the key does.'}
      </p>
    );
  }
  return (
    <p className="text-xs text-text-muted">
      <span className="font-medium text-text">{`${behavior.label}. `}</span>
      {`${behavior.description} `}
      <DocsLink href={behavior.docsUrl} topic={behavior.label} />
      {source.kind === 'draft' ? (
        <span className="block text-accent">Draft: stored when every part is chosen.</span>
      ) : undefined}
    </p>
  );
}
