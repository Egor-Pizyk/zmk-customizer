import type { ReactNode } from 'react';
import { Button } from './button';
import type { ButtonProps } from './button';

type IconButtonProps = Omit<ButtonProps, 'size' | 'children' | 'aria-label' | 'aria-pressed'> & {
  readonly label: string;
  readonly icon: ReactNode;
  readonly isPressed?: boolean;
};

export function IconButton({ label, icon, isPressed, ...buttonProps }: IconButtonProps) {
  return (
    <Button {...buttonProps} aria-label={label} aria-pressed={isPressed} size="icon">
      {icon}
    </Button>
  );
}
