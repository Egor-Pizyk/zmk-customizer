import { useState } from 'react';
import { Button, Field } from '@ui/components/components';
import type { GithubSession } from '@ui/export/logic';

type SignedInProps = { readonly github: GithubSession; readonly token: string };
type GithubRepositoryControlsProps = SignedInProps & { readonly installUrl: string | undefined };

export function GithubRepositoryControls({
  github,
  token,
  installUrl,
}: GithubRepositoryControlsProps) {
  return (
    <>
      <GithubRepositorySession github={github} token={token} installUrl={installUrl} />
      {github.repositories.length === 0 ? (
        <p className="text-sm text-text-muted">
          Grant the app access to a repository on GitHub, then refresh the list.
        </p>
      ) : (
        <GithubRepositorySelection github={github} token={token} />
      )}
      <GithubCreatedRepository github={github} />
      <GithubRepositoryCreate github={github} token={token} />
    </>
  );
}

function GithubRepositorySession({ github, token, installUrl }: GithubRepositoryControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {installUrl === undefined ? undefined : (
        <a
          className="text-sm text-accent underline"
          href={installUrl}
          target="_blank"
          rel="noreferrer"
        >
          Manage repository access
        </a>
      )}
      <Button
        size="sm"
        variant="secondary"
        isDisabled={github.isBusy}
        onClick={() => {
          github.refreshRepositories(token);
        }}
      >
        Refresh repositories
      </Button>
      <Button
        size="sm"
        isDisabled={github.isBusy}
        onClick={() => {
          github.signOut();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

function GithubRepositorySelection({ github, token }: SignedInProps) {
  const { selection, isBusy, repositories } = github;
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <Field
        label="Repository"
        renderControl={(props) => (
          <select
            {...props}
            className="w-full min-w-0 rounded-md border border-border bg-surface px-2 py-1"
            disabled={isBusy}
            value={selection?.repository.id ?? ''}
            onChange={(event) => {
              const selectedId = Number(event.target.value);
              github.selectRepository(
                token,
                repositories.find((item) => item.id === selectedId),
              );
            }}
          >
            <option value="">Choose a repository</option>
            {repositories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.full_name}
              </option>
            ))}
          </select>
        )}
      />
      <GithubBranchSelection github={github} />
    </div>
  );
}

function GithubBranchSelection({ github }: { readonly github: GithubSession }) {
  const { selection, isBusy } = github;
  return (
    <Field
      label="Branch"
      renderControl={(props) => (
        <select
          {...props}
          className="w-full min-w-0 rounded-md border border-border bg-surface px-2 py-1"
          disabled={isBusy || (selection?.branches.length ?? 0) === 0}
          value={selection?.branch ?? ''}
          onChange={(event) => {
            github.selectBranch(event.target.value);
          }}
        >
          <option value="">Choose a branch</option>
          {selection?.branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      )}
    />
  );
}

function GithubCreatedRepository({ github }: { readonly github: GithubSession }) {
  const { created, repositories } = github;
  if (created === undefined) {
    return null;
  }
  return (
    <p className="text-sm wrap-anywhere">
      Created{' '}
      <a
        className="text-accent underline"
        href={`https://github.com/${created.full_name}`}
        target="_blank"
        rel="noreferrer"
      >
        {created.full_name}
      </a>
      {repositories.some((item) => item.id === created.id)
        ? '. Select it above to publish.'
        : '. Grant the app access to this repository and refresh the list.'}
    </p>
  );
}

function GithubRepositoryCreate({ github, token }: SignedInProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { isBusy } = github;
  if (!isCreating) {
    return (
      <Button
        className="self-start"
        variant="secondary"
        isDisabled={isBusy}
        onClick={() => {
          setIsCreating(true);
        }}
      >
        New repository
      </Button>
    );
  }
  return (
    <GithubCreateForm
      github={github}
      token={token}
      onClose={() => {
        setIsCreating(false);
      }}
    />
  );
}

function GithubCreateForm({
  github,
  token,
  onClose: handleClose,
}: SignedInProps & { readonly onClose: () => void }) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <GithubRepositoryName
        value={name}
        isBusy={github.isBusy}
        onChange={(value) => {
          setName(value);
        }}
      />
      <GithubRepositoryVisibility
        value={isPrivate}
        isBusy={github.isBusy}
        onChange={(value) => {
          setIsPrivate(value);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          isDisabled={github.isBusy || name.trim() === ''}
          onClick={() => {
            github.createRepository(token, { name: name.trim(), isPrivate });
          }}
        >
          Create repository
        </Button>
        <Button isDisabled={github.isBusy} onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function GithubRepositoryVisibility({
  value,
  isBusy,
  onChange,
}: {
  readonly value: boolean;
  readonly isBusy: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={value}
        disabled={isBusy}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      Private repository
    </label>
  );
}

function GithubRepositoryName({
  value,
  isBusy,
  onChange,
}: {
  readonly value: string;
  readonly isBusy: boolean;
  readonly onChange: (name: string) => void;
}) {
  return (
    <Field
      label="New repository name"
      renderControl={(props) => (
        <input
          {...props}
          className="w-full rounded-md border border-border bg-surface px-2 py-1"
          disabled={isBusy}
          maxLength={100}
          placeholder="zmk-config"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}
    />
  );
}
