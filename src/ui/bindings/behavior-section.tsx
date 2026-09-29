import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { BEHAVIORS } from '../../catalog/behaviors';
import type { BehaviorKind } from '../../catalog/behaviors';
import type { SharedBinding } from '../../domain/get-shared-binding';
import { DocsLink } from '../components/docs-link';
import { INPUT_CLASSES } from '../components/input-classes';
import { behaviorActionFor } from './behavior-action';
import type { PickHandlers } from './create-pick-handlers';
import type { PickerTabId } from './picker-tabs';
import { toBindingItem } from './to-picker-item';

type BehaviorSectionProps = {
  readonly shared: SharedBinding;
  readonly onPick: PickHandlers['handlePick'];
  readonly onShowTab: (tabId: PickerTabId) => void;
};

// One line showing the current behavior; expands on demand and collapses after choosing.
// Descriptions, hints and docs links live in the details line below (spec 005 FR-001).
export function BehaviorSection({
  shared,
  onPick: handlePick,
  onShowTab: handleShowTab,
}: BehaviorSectionProps) {
  const current =
    shared.kind === 'same'
      ? BEHAVIORS.find((behavior) => behavior.id === shared.binding.kind)
      : undefined;
  const selectId = useId();

  function handleSelect(entry: BehaviorKind) {
    const action = behaviorActionFor(entry);
    if (action.kind === 'pick') {
      handlePick(toBindingItem(action.binding));
    } else if (action.kind === 'tab') {
      handleShowTab(action.tabId);
    }
  }

  return (
    <section aria-label="Behavior" className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label className="shrink-0 text-sm text-text-muted" htmlFor={selectId}>
          Behavior:
        </label>
        <BehaviorSelect
          current={current}
          id={selectId}
          onSelect={handleSelect}
          placeholder={shared.kind === 'mixed' ? 'Different actions' : 'Not assigned'}
        />
      </div>
      <BehaviorDetails current={current} />
    </section>
  );
}

type BehaviorSelectProps = {
  readonly current: BehaviorKind | undefined;
  readonly id: string;
  readonly onSelect: (entry: BehaviorKind) => void;
  readonly placeholder: string;
};

function BehaviorSelect({ current, id, onSelect: handleSelect, placeholder }: BehaviorSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const entry = BEHAVIORS.find((behavior) => behavior.id === event.target.value);
    if (entry !== undefined) {
      handleSelect(entry);
    }
  }

  return (
    <select className={INPUT_CLASSES} id={id} onChange={handleChange} value={current?.id ?? ''}>
      {current === undefined ? (
        <option disabled value="">
          {placeholder}
        </option>
      ) : undefined}
      {BEHAVIORS.map((entry) => {
        const action = behaviorActionFor(entry);
        return (
          <option
            disabled={action.kind === 'hint'}
            key={entry.id}
            title={action.kind === 'hint' ? action.text : undefined}
            value={entry.id}
          >
            {entry.label}
          </option>
        );
      })}
    </select>
  );
}

function BehaviorDetails({ current }: { readonly current: BehaviorKind | undefined }) {
  if (current === undefined) {
    return <p className="text-xs text-text-muted">Choose what the key does.</p>;
  }
  const action = behaviorActionFor(current);
  return (
    <p className="text-xs text-text-muted">
      {`${current.description} `}
      {action.kind === 'hint' ? `${action.text} ` : ''}
      <DocsLink href={current.docsUrl} topic={current.label} />
    </p>
  );
}
