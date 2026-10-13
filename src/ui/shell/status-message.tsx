import { useProject } from '@ui/project';

// The one polite status region, always mounted and empty on load. Only the inner span remounts:
// screen readers ignore a region inserted already filled, but announce a new child (R15).
export function StatusMessage() {
  const { announcement } = useProject();
  return (
    <output className="sr-only">
      {announcement === undefined ? undefined : (
        <span key={announcement.id}>{announcement.text}</span>
      )}
    </output>
  );
}
