import { Button } from '../components/button';

const PROJECT_ACTIONS = ['New', 'Open', 'Save', 'Undo', 'Redo'] as const;

// Actions become available with the project feature (roadmap 002); until then they stay
// focusable with a hint (research R11).
export function ProjectBar() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface-raised px-4">
      <span className="font-semibold">Untitled keyboard</span>
      <span className="text-text-muted">Nothing to save</span>
      <div className="ml-auto flex gap-1">
        {PROJECT_ACTIONS.map((action) => (
          <Button hint="Not available yet" isDisabled key={action} size="sm">
            {action}
          </Button>
        ))}
      </div>
    </header>
  );
}
