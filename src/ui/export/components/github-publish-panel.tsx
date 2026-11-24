import { useState } from 'react';
import type { GeneratedFile } from '@generators';
import { getGithubInstallUrl, isGithubConfigured } from '@storage/github';
import { Button, Dialog } from '@ui/components/components';
import { useGithubOpen, useGithubPublication } from '@ui/export/logic';
import type { GithubSession } from '@ui/export/logic';
import { GithubRepositoryControls } from './github-repository-controls';
import { GithubBuildStatus } from './github-build-status';
import { GithubCommitDialog } from './github-commit-dialog';

type GithubPublishPanelProps = {
  readonly github: GithubSession;
  readonly files: readonly GeneratedFile[];
};

export function GithubPublishPanel({ github, files }: GithubPublishPanelProps) {
  return (
    <section
      aria-labelledby="github-publish-title"
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface-raised p-3"
    >
      <h2 className="text-base font-semibold" id="github-publish-title">
        GitHub firmware
      </h2>
      {github.token === undefined ? (
        <GithubSignIn github={github} />
      ) : (
        <GithubRepositoryControls
          github={github}
          token={github.token}
          installUrl={getGithubInstallUrl()}
        />
      )}
      {github.destination === undefined || github.token === undefined ? undefined : (
        <GithubPublishActions
          key={`${github.destination.repository.id}/${github.destination.branch}`}
          github={github}
          files={files}
          token={github.token}
        />
      )}
      <output className="text-sm text-text-muted empty:hidden">
        {github.isBusy ? 'Working with GitHub…' : github.feedback}
      </output>
    </section>
  );
}

function GithubSignIn({ github }: { readonly github: GithubSession }) {
  const isConfigured = isGithubConfigured();
  return (
    <>
      <p className="text-sm text-text-muted">
        Publish your configuration and build firmware with GitHub Actions.
      </p>
      <Button
        className="self-start"
        variant="secondary"
        isDisabled={github.isBusy || !isConfigured}
        onClick={() => {
          github.signIn();
        }}
      >
        Sign in with GitHub
      </Button>
      {isConfigured ? undefined : (
        <p className="text-sm text-text-muted">GitHub sign-in is unavailable on this deployment.</p>
      )}
    </>
  );
}

function GithubPublishActions({
  github,
  files,
  token,
}: GithubPublishPanelProps & { readonly token: string }) {
  const [useGeneratedWorkflow, setUseGeneratedWorkflow] = useState(false);
  const publication = useGithubPublication(github, files, useGeneratedWorkflow);
  const open = useGithubOpen(github);
  return (
    <>
      <GithubWorkflowChoice
        value={useGeneratedWorkflow}
        isBusy={github.isBusy}
        onChange={(value) => {
          setUseGeneratedWorkflow(value);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          isDisabled={github.isBusy || files.length === 0}
          hint={files.length === 0 ? 'Fix the project issues to publish.' : undefined}
          onClick={publication.handleReview}
        >
          Review commit
        </Button>
        <Button variant="secondary" isDisabled={github.isBusy} onClick={open.handleOpen}>
          Open project from GitHub
        </Button>
      </div>
      <GithubBuildStatus github={github} token={token} />
      <GithubCommitDialog publication={publication} isBusy={github.isBusy} />
      <GithubOpenDialog open={open} />
    </>
  );
}

function GithubWorkflowChoice({
  value,
  isBusy,
  onChange,
}: {
  readonly value: boolean;
  readonly isBusy: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        className="mt-1"
        type="checkbox"
        checked={value}
        disabled={isBusy}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      Use the ZMK Customizer build workflow alongside or in place of an existing one
    </label>
  );
}

function GithubOpenDialog({ open }: { readonly open: ReturnType<typeof useGithubOpen> }) {
  return (
    <Dialog
      isOpen={open.name !== undefined}
      title="Open project from GitHub"
      onClose={open.handleCloseOpen}
    >
      <p className="text-sm wrap-anywhere">
        Open <strong>{open.name}</strong> from this branch. You can undo the change to restore your
        current project.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={open.handleCloseOpen}>
          Cancel
        </Button>
        <Button variant="primary" isDisabled={open.isOpenStale} onClick={open.handleConfirmOpen}>
          Open project
        </Button>
      </div>
    </Dialog>
  );
}
