import { useId, useState } from 'react';
import type { ComponentProps, FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { Tooltip } from './tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'nav';
export type ButtonSize = 'sm' | 'md' | 'icon';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent/90',
  secondary: 'border border-border-strong bg-surface-raised text-text hover:bg-surface-muted',
  ghost: 'text-text hover:bg-surface-muted aria-pressed:bg-surface-muted aria-pressed:text-accent',
  danger: 'bg-danger text-accent-contrast hover:bg-danger/90',
  nav: 'text-text-muted hover:bg-surface-raised hover:text-text aria-[current=page]:bg-surface-raised aria-[current=page]:text-accent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-xs',
  md: 'h-8 px-3 text-sm',
  icon: 'size-8',
};

const BASE_CLASSES =
  'group relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-safe:transition-colors';

type NativeButtonProps = Omit<ComponentProps<'button'>, 'className' | 'disabled' | 'type'>;

export type ButtonProps = NativeButtonProps & {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Rendered as aria-disabled so the button stays focusable and its hint readable (R11). */
  readonly isDisabled?: boolean;
  readonly hint?: string | undefined;
  /** Visibility of the hint only, e.g. `lg:hidden` when a visible label replaces it. */
  readonly hintClassName?: string | undefined;
  /** The hint repeats the accessible name, so it is hidden from assistive tech. */
  readonly isHintDecorative?: boolean;
  /** Placement only (margin, width, flex placement). */
  readonly className?: string;
};

export function Button({
  variant = 'ghost',
  size = 'md',
  isDisabled = false,
  hint,
  hintClassName,
  isHintDecorative = false,
  className = '',
  children,
  ...nativeProps
}: ButtonProps) {
  const hintId = useId();
  const { isTooltipDismissed, handlers } = useButtonHandlers({
    isDisabled,
    hasHint: hint !== undefined,
    nativeProps,
  });

  return (
    <button
      {...nativeProps}
      {...handlers}
      aria-describedby={hint === undefined || isHintDecorative ? undefined : hintId}
      aria-disabled={isDisabled || undefined}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      data-tooltip-dismissed={isTooltipDismissed || undefined}
      type="button"
    >
      {children}
      {hint === undefined ? undefined : (
        <Tooltip
          className={hintClassName}
          id={hintId}
          isDecorative={isHintDecorative}
          text={hint}
        />
      )}
    </button>
  );
}

type ButtonHandlerOptions = {
  readonly isDisabled: boolean;
  readonly hasHint: boolean;
  readonly nativeProps: NativeButtonProps;
};

// aria-disabled swallows clicks (R11); Escape hides a visible hint until focus or pointer
// leaves (WCAG 1.4.13).
function useButtonHandlers({ isDisabled, hasHint, nativeProps }: ButtonHandlerOptions) {
  const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);
  const { onClick, onKeyDown, onBlur, onPointerLeave } = nativeProps;
  const handlers = {
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (hasHint && event.key === 'Escape') {
        setIsTooltipDismissed(true);
      }
      onKeyDown?.(event);
    },
    onBlur: (event: FocusEvent<HTMLButtonElement>) => {
      setIsTooltipDismissed(false);
      onBlur?.(event);
    },
    onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
      setIsTooltipDismissed(false);
      onPointerLeave?.(event);
    },
  };
  return { isTooltipDismissed, handlers };
}
