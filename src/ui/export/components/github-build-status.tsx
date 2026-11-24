import type { GithubRun } from '@storage/github';
import { Button } from '@ui/components/components';
import type { GithubSession } from '@ui/export/logic';

type GithubBuildStatusProps = { readonly github: GithubSession; readonly token: string };

export function GithubBuildStatus({ github, token }: GithubBuildStatusProps) {
  const { publication } = github;
  if (publication === undefined) {
    return null;
  }
  const repoUrl = `https://github.com/${publication.repository.full_name}`;
  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <a
          className="text-accent underline"
          href={`${repoUrl}/commit/${publication.commit}`}
          target="_blank"
          rel="noreferrer"
        >
          Commit {publication.commit.slice(0, 7)}
        </a>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            github.refreshBuilds(token);
          }}
          isDisabled={github.isBusy}
        >
          Refresh builds
        </Button>
      </div>
      <GithubBuildRuns runs={publication.runs} repoUrl={repoUrl} />
    </div>
  );
}

function GithubBuildRuns({
  runs,
  repoUrl,
}: {
  readonly runs: readonly GithubRun[];
  readonly repoUrl: string;
}) {
  if (runs.length === 0) {
    return (
      <p className="text-text-muted">
        Waiting for a build on this commit. Check{' '}
        <a
          className="text-accent underline"
          href={`${repoUrl}/actions`}
          target="_blank"
          rel="noreferrer"
        >
          GitHub Actions
        </a>{' '}
        if one does not start.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {runs.map((run) => (
        <GithubBuildRun key={run.id} run={run} repoUrl={repoUrl} />
      ))}
    </ul>
  );
}

function GithubBuildRun({ run, repoUrl }: { readonly run: GithubRun; readonly repoUrl: string }) {
  const runUrl = `${repoUrl}/actions/runs/${run.id}`;
  const availableArtifacts = run.artifacts.filter((artifact) => !artifact.expired);
  return (
    <li className="flex flex-wrap items-baseline gap-2 wrap-anywhere">
      <a className="text-accent underline" href={runUrl} target="_blank" rel="noreferrer">
        {run.name}
      </a>
      <span>{(run.conclusion ?? run.status ?? 'pending').replaceAll('_', ' ')}</span>
      {availableArtifacts.map((artifact) => (
        <a
          key={artifact.id}
          className="text-accent underline"
          href={`${runUrl}/artifacts/${artifact.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Download {artifact.name}
        </a>
      ))}
      {run.conclusion === 'success' && availableArtifacts.length === 0 ? (
        <a
          className="text-accent underline"
          href={`${runUrl}#artifacts`}
          target="_blank"
          rel="noreferrer"
        >
          Open build artifacts
        </a>
      ) : undefined}
    </li>
  );
}
