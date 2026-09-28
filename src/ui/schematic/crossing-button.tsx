type CrossingButtonProps = {
  readonly xPx: number;
  readonly yPx: number;
  readonly label: string;
  readonly isInsulated: boolean;
  readonly sizePx: number;
  readonly onToggle: () => void;
};

// A native button in screen space (foreignObject, T003); out of the tab order because the
// Crossings table in the Parts list is the keyboard path (003 R10).
export function CrossingButton({
  xPx,
  yPx,
  label,
  isInsulated,
  sizePx,
  onToggle,
}: CrossingButtonProps) {
  function handleClick() {
    onToggle();
  }

  return (
    <foreignObject height={sizePx} width={sizePx} x={xPx} y={yPx}>
      <button
        aria-label={label}
        aria-pressed={isInsulated}
        className="group flex size-full items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus aria-pressed:text-accent"
        onClick={handleClick}
        tabIndex={-1}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 16 16"
        >
          <circle className="group-aria-pressed:fill-accent/20" cx="8" cy="8" r="6" />
          {isInsulated ? <path d="M4 9 A4 4 0 0 1 12 9" /> : <path d="M2 8 H14 M8 2 V14" />}
        </svg>
      </button>
    </foreignObject>
  );
}
