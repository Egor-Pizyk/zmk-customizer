type TooltipProps = {
  readonly placement?: 'bottom' | 'right' | undefined;
  readonly alignment?: 'center' | 'end' | undefined;
  readonly id: string;
  readonly text: string | undefined;
  /** Visibility only, e.g. `lg:hidden` when a visible label replaces the tooltip. */
  readonly className?: string | undefined;
  readonly isDecorative?: boolean;
};

// CSS-only reveal from the parent `group`; Escape dismissal sets data-tooltip-dismissed on the
// group (WCAG 1.4.13, spec 001 research R11).
export function Tooltip({
  id,
  text,
  className = '',
  isDecorative = false,
  alignment = 'center',
  placement = 'bottom',
}: TooltipProps) {
  if (text === undefined) {
    return null;
  }
  const positionClasses =
    placement === 'right'
      ? 'top-1/2 left-full ml-1 -translate-y-1/2'
      : `top-full mt-1 ${alignment === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`;
  return (
    <span
      className={`pointer-events-none absolute z-20 hidden rounded-sm bg-text px-2 py-1 text-xs font-normal whitespace-nowrap text-surface group-hover:block group-focus-visible:block group-has-focus-visible:block group-data-tooltip-dismissed:hidden! ${positionClasses} ${className}`}
      aria-hidden={isDecorative || undefined}
      id={id}
      role="tooltip"
    >
      {text}
    </span>
  );
}
