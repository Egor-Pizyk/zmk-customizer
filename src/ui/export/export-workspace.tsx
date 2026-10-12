import { useState } from 'react';
import { useProject } from '../project-context';
import { IssueButton } from '../shell/issue-button';
import { PlaceholderFooter } from '../shell/placeholder-footer';
import type { WorkspaceIssue } from '../shell/workspace-issue';
import { ExportToolbar } from './export-toolbar';
import { FilePreview } from './file-preview';
import { getExportPreview } from './get-export-preview';
import { useExportActions } from './use-export-actions';

export function ExportWorkspace() {
  const { project, analysis, announce } = useProject();
  const [includeWorkflow, setIncludeWorkflow] = useState(true);
  const { files, problems, shieldName } = getExportPreview(analysis, { includeWorkflow });
  function handleWorkflowChange(value: boolean) {
    setIncludeWorkflow(value);
  }
  const actions = useExportActions({
    files,
    shieldName,
    isBlocked: problems.length > 0,
    announce,
  });
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
        <ExportToolbar
          controllerId={project.controllerId}
          includeWorkflow={includeWorkflow}
          onWorkflowChange={handleWorkflowChange}
          problemCount={problems.length}
          actions={actions}
        />
        {actions.feedback === '' ? undefined : <p>{actions.feedback}</p>}
        {problems.length > 0 ? (
          <ExportProblems issues={problems} />
        ) : (
          <FilePreview files={files} actions={actions} />
        )}
      </div>
      <PlaceholderFooter />
    </>
  );
}

function ExportProblems({ issues }: { readonly issues: readonly WorkspaceIssue[] }) {
  return (
    <section aria-labelledby="export-problems-title" className="flex flex-col gap-2">
      <h2 className="text-base font-semibold" id="export-problems-title">
        Fix problems to preview files
      </h2>
      <ul className="flex flex-col gap-2">
        {issues.map((issue) => (
          <li key={`${issue.code}:${issue.path.join('.')}`}>
            <IssueButton issue={issue} />
          </li>
        ))}
      </ul>
    </section>
  );
}
