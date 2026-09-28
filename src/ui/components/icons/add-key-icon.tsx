// A mechanical switch seen from above: housing with the cross-shaped stem (spec 003 FR-005).
export function AddKeyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
      <circle cx="8" cy="7" r="0.5" />
      <circle cx="15" cy="5.5" r="0.5" />
    </svg>
  );
}
