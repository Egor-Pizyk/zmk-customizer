type KbdProps = {
  readonly children: string;
};

export function Kbd({ children }: KbdProps) {
  return (
    <kbd className="rounded-sm border border-border-strong bg-surface-muted px-1.5 font-mono text-xs">
      {children}
    </kbd>
  );
}
