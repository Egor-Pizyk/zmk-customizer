type BadgeProps = {
  readonly count: number;
};

export function Badge({ count }: BadgeProps) {
  return (
    <span
      aria-hidden="true"
      className="ml-auto min-w-5 rounded-full bg-danger px-1.5 text-center text-xs/5 font-semibold text-accent-contrast"
    >
      {count}
    </span>
  );
}
