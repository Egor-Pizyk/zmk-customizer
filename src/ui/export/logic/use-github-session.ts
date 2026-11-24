import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  beginGithubAuthorization,
  completeGithubAuthorization,
  createGithubRepository,
  hasGithubAuthorizationCallback,
  listGithubBranches,
  listGithubBuilds,
  listGithubRepositories,
} from '@storage/github';
import type { GithubDestination, GithubRepository, GithubResult, GithubRun } from '@storage/github';

type PublishedCommit = GithubDestination & {
  readonly commit: string;
  readonly runs: readonly GithubRun[];
};
type RunGithubRequest = ReturnType<typeof useGithubRequest>['run'];
type RepositorySelection = {
  readonly repository: GithubRepository;
  readonly branch: string;
  readonly branches: readonly string[];
};

function useGithubRequest() {
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const busy = useRef(false);

  async function run<Value>(operation: () => Promise<GithubResult<Value>>) {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setIsBusy(true);
    setFeedback('');
    try {
      const result = await operation();
      if (!result.ok) {
        setFeedback(result.error);
      }
    } finally {
      busy.current = false;
      setIsBusy(false);
    }
  }
  return { isBusy, feedback, setFeedback, run };
}

function useGithubAuthorization(
  run: RunGithubRequest,
  onSignedIn: (token: string) => Promise<GithubResult<unknown>>,
) {
  const [token, setToken] = useState<string>();
  const handleCallback = useEffectEvent(() => {
    void run(async () => {
      const result = await completeGithubAuthorization();
      if (!result.ok) {
        return result;
      }
      setToken(result.value);
      return onSignedIn(result.value);
    });
  });

  useEffect(() => {
    // The callback URL is consumed before the first await, including under Strict Mode.
    if (hasGithubAuthorizationCallback()) {
      handleCallback();
    }
  }, []);

  function signIn() {
    void run(async () => {
      const authorization = await beginGithubAuthorization();
      if (authorization.ok) {
        globalThis.location.assign(authorization.value);
      }
      return authorization;
    });
  }

  return {
    token,
    signIn,
    clearAuthorization: () => {
      setToken(undefined);
    },
  };
}

function useGithubSelection(run: RunGithubRequest) {
  const [selection, setSelection] = useState<RepositorySelection>();

  function selectRepository(token: string, repository: GithubRepository | undefined) {
    setSelection(repository === undefined ? undefined : { repository, branch: '', branches: [] });
    if (repository !== undefined) {
      void run(async () => {
        const result = await listGithubBranches(token, repository);
        if (!result.ok) {
          return result;
        }
        if (result.value.length === 0) {
          return {
            ok: false,
            error: 'Initialize this repository with a README on GitHub, then select it again.',
          };
        }
        setSelection({
          repository,
          branches: result.value,
          branch: result.value.includes(repository.default_branch) ? repository.default_branch : '',
        });
        return result;
      });
    }
  }

  return {
    selection,
    selectRepository,
    setSelection,
    selectBranch: (branch: string) => {
      setSelection((current) => (current === undefined ? undefined : { ...current, branch }));
    },
  };
}

function useGithubRepositories(run: RunGithubRequest) {
  const [repositories, setRepositories] = useState<readonly GithubRepository[]>([]);
  const [created, setCreated] = useState<GithubRepository>();
  const { setSelection, selection, selectBranch, selectRepository } = useGithubSelection(run);

  async function loadRepositories(token: string) {
    const result = await listGithubRepositories(token);
    if (result.ok) {
      setRepositories(result.value);
      setSelection((current) =>
        result.value.some((repository) => repository.id === current?.repository.id)
          ? current
          : undefined,
      );
    }
    return result;
  }

  return {
    repositories,
    created,
    selection,
    selectRepository,
    selectBranch,
    loadRepositories,
    setCreated,
    clearRepositories: () => {
      setRepositories([]);
      setCreated(undefined);
      setSelection(undefined);
    },
  };
}

function useGithubBuilds(run: RunGithubRequest, destination: GithubDestination | undefined) {
  const [publication, setPublication] = useState<PublishedCommit>();
  const current =
    publication !== undefined &&
    destination?.repository.id === publication.repository.id &&
    destination.branch === publication.branch
      ? publication
      : undefined;

  async function readBuilds(token: string, next: PublishedCommit) {
    const result = await listGithubBuilds(token, next, next.commit);
    if (result.ok) {
      setPublication({ ...next, runs: result.value });
    }
    return result;
  }

  return {
    publication: current,
    trackPublication: (token: string, next: GithubDestination, commit: string) => {
      const pending = { ...next, commit, runs: [] };
      setPublication(pending);
      return readBuilds(token, pending);
    },
    refreshBuilds: (token: string) => {
      if (current !== undefined) {
        void run(() => readBuilds(token, current));
      }
    },
    clearPublication: () => {
      setPublication(undefined);
    },
  };
}

export type GithubSession = ReturnType<typeof useGithubSession>;

export function useGithubSession() {
  const request = useGithubRequest();
  const repositories = useGithubRepositories(request.run);
  const authorization = useGithubAuthorization(request.run, repositories.loadRepositories);
  const { selection } = repositories;
  const destination = selection === undefined || selection.branch === '' ? undefined : selection;
  const builds = useGithubBuilds(request.run, destination);

  function signOut() {
    authorization.clearAuthorization();
    repositories.clearRepositories();
    builds.clearPublication();
    request.setFeedback('');
  }

  return {
    ...request,
    ...authorization,
    ...builds,
    destination,
    signOut,
    repositories: repositories.repositories,
    created: repositories.created,
    selection,
    selectBranch: repositories.selectBranch,
    selectRepository: repositories.selectRepository,
    refreshRepositories: (token: string) => {
      void request.run(() => repositories.loadRepositories(token));
    },
    createRepository: createGithubRepositoryAction(request.run, repositories),
  };
}

function createGithubRepositoryAction(
  run: RunGithubRequest,
  repositories: ReturnType<typeof useGithubRepositories>,
) {
  return (token: string, options: { readonly name: string; readonly isPrivate: boolean }) => {
    void run(async () => {
      const result = await createGithubRepository(token, options.name, options.isPrivate);
      if (!result.ok) {
        return result;
      }
      repositories.setCreated(result.value);
      return repositories.loadRepositories(token);
    });
  };
}
