import { NO_ISSUES, formatIssueCount } from './workspace-issue';

// The one status region in the shell. Its initial text is not announced; later changes of the
// total are, politely (FR-037).
export function IssuesAnnouncer() {
  return <output className="sr-only">{formatIssueCount(NO_ISSUES.length)}</output>;
}
