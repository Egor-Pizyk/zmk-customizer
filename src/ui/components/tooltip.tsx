type TooltipProps = {
  readonly id: string;
  readonly text: string;
  /** Visibility only, e.g. `lg:hidden` when a visible label replaces the tooltip. */
  readonly className?: string | undefined;
  readonly isDecorative?: boolean;
};

// CSS-only reveal from the parent `group`; Escape dismissal sets data-tooltip-dismissed on the
// group (WCAG 1.4.13, spec 001 research R11).
export function Tooltip({ id, text, className = '', isDecorative = false }: TooltipProps) {
  return (
    <span
      className={`pointer-events-none absolute top-full left-1/2 z-20 mt-1 hidden -translate-x-1/2 rounded-sm bg-text px-2 py-1 text-xs font-normal whitespace-nowrap text-surface group-hover:block group-focus-visible:block group-has-focus-visible:block group-data-tooltip-dismissed:hidden! ${className}`}
      aria-hidden={isDecorative || undefined}
      id={id}
      role="tooltip"
    >
      {text}
    </span>
  );
}
