import type { SharedBinding } from '../../domain/get-shared-binding';
import { Button } from '../components/button';
import { DocsLink } from '../components/docs-link';
import {
  countGraphemes,
  formatBindingLegend,
  formatFullBindingLegend,
} from './format-binding-legend';
import { formatBindingName } from './format-binding-name';
import { formatLegendTitle } from './format-legend-title';
import type { PickerItem } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

type PickerPreviewProps = {
  readonly picker: KeyPickerState;
  readonly shared: SharedBinding;
  readonly selectionName: string;
  readonly selectedCount: number;
  readonly canPaste: boolean;
  readonly onCopy: () => void;
  readonly onPaste: () => void;
};

// The selection's keycap as it will look, its full action, hover details and copy/paste (FR-009, FR-010, FR-018).
export function PickerPreview(props: PickerPreviewProps) {
  const { picker, shared, selectionName, selectedCount } = props;
  const binding = shared.kind === 'same' ? shared.binding : undefined;
  const legend = formatBindingLegend(binding);
  const isMixed = shared.kind === 'mixed';
  const fullName = isMixed ? 'Different actions' : formatBindingName(binding);
  const tapLegend = isMixed ? '…' : (legend?.tap ?? '');
  const tapClasses =
    countGraphemes(tapLegend) > 5 ? 'text-sm leading-none' : 'text-xl leading-none';
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="flex size-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-border-strong bg-surface-muted shadow-sm"
      >
        <span className={tapClasses}>{tapLegend}</span>
        <span className="text-xs text-text-muted">{legend?.hold}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold">
          {selectedCount === 1 ? selectionName : `${selectionName} selected`}
        </p>
        <p
          className="truncate text-text-muted"
          title={formatLegendTitle(formatFullBindingLegend(binding)?.tap, fullName)}
        >
          {fullName}
        </p>
        <div
          onPointerEnter={picker.handleDetailsFreeze}
          onPointerLeave={picker.handleDetailsUnfreeze}
        >
          <PickerDetailsText item={picker.detailsItem} />
        </div>
        <CopyPasteButtons {...props} />
      </div>
    </div>
  );
}

// Hovered or focused item: names, description and docs link (FR-010).
function PickerDetailsText({ item }: { readonly item: PickerItem | undefined }) {
  if (item === undefined) {
    return <p className="text-xs text-text-muted">Hover or focus a key to see what it does.</p>;
  }
  return (
    <p className="text-xs text-text-muted">
      <span className="font-medium text-text">{`${item.name}. `}</span>
      {item.aliases.length === 0 ? '' : `${[item.id, ...item.aliases].join(', ')}. `}
      {`${item.description} `}
      <DocsLink href={item.docsUrl} topic={item.name} />
    </p>
  );
}

function CopyPasteButtons({ selectedCount, canPaste, onCopy, onPaste }: PickerPreviewProps) {
  function handleCopyClick() {
    onCopy();
  }

  function handlePasteClick() {
    onPaste();
  }

  return (
    <details>
      <summary
        aria-label="Copy or paste action"
        className="cursor-pointer rounded-md text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        …
      </summary>
      <div className="flex flex-wrap gap-1">
        <Button
          hint={selectedCount === 1 ? undefined : 'Select one key to copy its action'}
          isDisabled={selectedCount !== 1}
          onClick={handleCopyClick}
          size="sm"
          variant="ghost"
        >
          Copy
        </Button>
        <Button
          hint={canPaste ? undefined : 'Copy an action first'}
          isDisabled={!canPaste}
          onClick={handlePasteClick}
          size="sm"
          variant="ghost"
        >
          Paste
        </Button>
      </div>
    </details>
  );
}
