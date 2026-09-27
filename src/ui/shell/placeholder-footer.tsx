import { IssuesToggle } from './issues-toggle';

// Placeholder workspaces have no status bar; this keeps the problems toggle reachable.
export function PlaceholderFooter() {
  return (
    <footer className="flex h-8 shrink-0 items-center border-t border-border bg-surface-muted px-3">
      <IssuesToggle />
    </footer>
  );
}
