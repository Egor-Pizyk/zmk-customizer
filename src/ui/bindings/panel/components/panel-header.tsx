import { ChevronIcon } from '@ui/components/icons';
import { IconButton } from '@ui/components/components';

type PanelHeaderProps = {
  readonly isOpen: boolean;
  readonly headingId: string;
  readonly bodyId: string;
  readonly onToggle: () => void;
};

// Title bar with the collapse toggle (spec 004 FR-008, R14).
export function PanelHeader({ isOpen, headingId, bodyId, onToggle }: PanelHeaderProps) {
  function handleCollapseClick() {
    onToggle();
  }

  return (
    <div className="flex items-center gap-2 border-b border-border p-2">
      <h2 className={isOpen ? 'flex-1 px-2 text-base font-semibold' : 'sr-only'} id={headingId}>
        Action
      </h2>
      <IconButton
        aria-controls={bodyId}
        aria-expanded={isOpen}
        icon={<ChevronIcon />}
        label={isOpen ? 'Collapse action panel' : 'Expand action panel'}
        onClick={handleCollapseClick}
      />
    </div>
  );
}
