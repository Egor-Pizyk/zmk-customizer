import { useState } from 'react';
import { Button } from '@ui/components/components';
import { formatIssueCount } from '@ui/issues';
import { useProject } from '@ui/project/logic';
import { IssueButton, PlaceholderFooter } from '@ui/shell/components';
import type { WorkspaceIssue } from '@ui/issues';
import { ExportToolbar } from './export-toolbar';
import { FilePreview } from './file-preview';
import { getExportPreview, useExportActions } from '@ui/export/logic';

export function ExportWorkspace() {
  const { project, analysis, announce, tutorialDownloadStarted } = useProject();
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
    onZipStarted: () => {
      tutorialDownloadStarted(project);
    },
  });
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
        {problems.length > 0 ? (
          <ExportProblems issues={problems} />
        ) : (
          <>
            <ExportToolbar
              controllerId={project.controllerId}
              includeWorkflow={includeWorkflow}
              onWorkflowChange={handleWorkflowChange}
              actions={actions}
            />
            {actions.feedback === '' ? undefined : <p>{actions.feedback}</p>}
            <FilePreview files={files} actions={actions} />
          </>
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
        Fix {formatIssueCount(issues.length)} to export
      </h2>
      <ul className="flex flex-col gap-2">
        {issues.map((issue) => (
          <li key={`${issue.code}:${issue.path.join('.')}`}>
            <IssueButton issue={issue} />
          </li>
        ))}
      </ul>
      <Button
        aria-describedby="export-problems-title"
        className="self-start"
        isDisabled
        variant="primary"
      >
        Download .zip
      </Button>
    </section>
  );
}
