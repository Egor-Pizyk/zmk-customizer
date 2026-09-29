import { BEHAVIORS } from '../../catalog/behaviors';
import { assertNever } from '../../domain/assert-never';
import type { SharedBinding } from '../../domain/get-shared-binding';
import type { Binding } from '../../domain/types';
import { DocsLink } from '../components/docs-link';
import type { PickHandlers } from './create-pick-handlers';
import type { PickerTabId } from './picker-tabs';
import { toBindingItem } from './to-picker-item';

type BehaviorSectionProps = {
  readonly shared: SharedBinding;
  readonly onPick: PickHandlers['handlePick'];
  readonly onShowTab: (tabId: PickerTabId) => void;
};

type BehaviorRow = (typeof BEHAVIORS)[number];

type RowAction =
  | { readonly kind: 'pick'; readonly binding: Binding }
  | { readonly kind: 'tab'; readonly tabId: PickerTabId }
  | { readonly kind: 'hint'; readonly text: string }
  | { readonly kind: 'soon' };

// Parameter-less behaviors apply at once; key behaviors are built with the controls below;
// Bluetooth and output live in the System tab (spec 005 FR-002–FR-004).
function rowActionFor(entry: BehaviorRow): RowAction {
  switch (entry.choices) {
    case 'none': {
      return { kind: 'pick', binding: { kind: entry.id } };
    }
    case 'key': {
      return entry.id === 'kp'
        ? { kind: 'tab', tabId: 'basic' }
        : { kind: 'hint', text: 'Switch with “Press mode” below.' };
    }
    case 'hold-tap': {
      return { kind: 'hint', text: 'Turn on with “When held” below.' };
    }
    case 'bluetooth':
    case 'output': {
      return { kind: 'tab', tabId: 'system' };
    }
    case 'tap-dance':
    case 'mod-morph': {
      return { kind: 'soon' };
    }
    default: {
      return assertNever(entry);
    }
  }
}

function behaviorName(shared: SharedBinding): string {
  if (shared.kind === 'unassigned') {
    return 'Not assigned';
  }
  if (shared.kind !== 'same') {
    return 'Different actions';
  }
  const binding = shared.binding;
  if (binding.kind === 'kp') {
    return 'Key press';
  }
  return BEHAVIORS.find((behavior) => behavior.id === binding.kind)?.label ?? binding.kind;
}

function isCurrentBehavior(entry: BehaviorRow, shared: SharedBinding): boolean {
  return shared.kind === 'same' && shared.binding.kind === entry.id;
}

// The behavior of the selected keys first, its parameters after (spec 005 FR-001, FR-019).
export function BehaviorSection({
  shared,
  onPick: handlePick,
  onShowTab: handleShowTab,
}: BehaviorSectionProps) {
  return (
    <section aria-label="Behavior">
      <p className="text-sm">
        <span className="text-text-muted">Behavior: </span>
        {behaviorName(shared)}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {BEHAVIORS.map((entry) => (
          <BehaviorRowItem
            entry={entry}
            isCurrent={isCurrentBehavior(entry, shared)}
            key={entry.id}
            onPick={handlePick}
            onShowTab={handleShowTab}
          />
        ))}
      </ul>
    </section>
  );
}

type RowItemProps = {
  readonly entry: BehaviorRow;
  readonly isCurrent: boolean;
  readonly onPick: PickHandlers['handlePick'];
  readonly onShowTab: (tabId: PickerTabId) => void;
};

function BehaviorRowItem({
  entry,
  isCurrent,
  onPick: handlePick,
  onShowTab: handleShowTab,
}: RowItemProps) {
  const action = rowActionFor(entry);
  return (
    <li className="flex flex-col gap-0.5 rounded-md px-2 py-1">
      <span className="flex items-center gap-2">
        <RowControl
          action={action}
          entry={entry}
          isCurrent={isCurrent}
          onPick={handlePick}
          onShowTab={handleShowTab}
        />
        <DocsLink href={entry.docsUrl} topic={entry.label} />
      </span>
      <span className="text-xs text-text-muted">{entry.description}</span>
      {action.kind === 'hint' ? (
        <span className="text-xs text-text-muted">{action.text}</span>
      ) : undefined}
      {action.kind === 'soon' ? (
        <span className="text-xs text-text-muted">Coming soon.</span>
      ) : undefined}
    </li>
  );
}

function RowControl({
  action,
  entry,
  isCurrent,
  onPick: handlePick,
  onShowTab: handleShowTab,
}: RowItemProps & { readonly action: RowAction }) {
  if (action.kind === 'pick') {
    const { binding } = action;
    return (
      <RowButton
        isCurrent={isCurrent}
        label={entry.label}
        onClick={() => {
          handlePick(toBindingItem(binding));
        }}
      />
    );
  }
  if (action.kind === 'tab') {
    const { tabId } = action;
    return (
      <RowButton
        isCurrent={isCurrent}
        label={entry.label}
        onClick={() => {
          handleShowTab(tabId);
        }}
      />
    );
  }
  return (
    <span aria-current={isCurrent} className="text-sm font-medium">
      {entry.label}
      {isCurrent ? ' ✓' : ''}
    </span>
  );
}

type RowButtonProps = {
  readonly label: string;
  readonly isCurrent: boolean;
  readonly onClick: () => void;
};

function RowButton({ label, isCurrent, onClick: handleClick }: RowButtonProps) {
  return (
    <button
      aria-current={isCurrent}
      className="rounded-md text-left text-sm font-medium hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      onClick={handleClick}
      type="button"
    >
      {label}
      {isCurrent ? ' ✓' : ''}
    </button>
  );
}
