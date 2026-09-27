type SwitchProps = {
  readonly label: string;
  readonly isChecked: boolean;
  readonly onChange: (isChecked: boolean) => void;
};

export function Switch({ label, isChecked, onChange }: SwitchProps) {
  function handleClick() {
    onChange(!isChecked);
  }

  return (
    <button
      aria-checked={isChecked}
      className="group flex items-center justify-between gap-3 rounded-md py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      onClick={handleClick}
      role="switch"
      type="button"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full border border-border-strong bg-surface-muted group-aria-checked:border-accent group-aria-checked:bg-accent"
      >
        <span className="absolute top-0.5 left-0.5 size-3.5 rounded-full bg-text-muted group-aria-checked:translate-x-4 group-aria-checked:bg-accent-contrast motion-safe:transition-transform" />
      </span>
    </button>
  );
}
