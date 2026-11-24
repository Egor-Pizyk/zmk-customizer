import { z } from 'zod';
import { requestGithub } from './request-github';
import type { GithubResult } from './request-github';
import type { ZodType } from 'zod';

const repositorySchema = z.object({
  id: z.number().int().positive(),
  full_name: z.string().regex(/^[a-z\d][a-z\d-]*\/(?!\.{1,2}$)[\w.-]+$/iu),
  default_branch: z.string().min(1),
  private: z.boolean(),
});
const installationsSchema = z.object({
  installations: z.array(z.object({ id: z.number().int().positive() })),
});
const repositoriesSchema = z.object({ repositories: z.array(repositorySchema) });
const branchesSchema = z.array(z.object({ name: z.string().min(1) }));

export type GithubRepository = z.infer<typeof repositorySchema>;
export type GithubDestination = {
  readonly repository: GithubRepository;
  readonly branch: string;
};

export function requestGithubApi<Value>(
  token: string,
  path: string,
  { schema, json }: { readonly schema: ZodType<Value>; readonly json?: object },
): Promise<GithubResult<Value>> {
  return requestGithub(`https://api.github.com${path}`, schema, {
    method: json === undefined ? 'GET' : 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(json === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(json === undefined ? {} : { body: JSON.stringify(json) }),
  });
}

async function readPages<Value>(
  getPage: (page: number) => Promise<GithubResult<readonly Value[]>>,
): Promise<GithubResult<readonly Value[]>> {
  const values: Value[] = [];
  for (let page = 1; ; page += 1) {
    // eslint-disable-next-line eslint/no-await-in-loop -- Each response determines whether another page exists.
    const result = await getPage(page);
    if (!result.ok) {
      return result;
    }
    values.push(...result.value);
    if (result.value.length < 100) {
      return { ok: true, value: values };
    }
  }
}

export async function listGithubRepositories(
  token: string,
): Promise<GithubResult<readonly GithubRepository[]>> {
  const installations = await readPages(async (page) => {
    const result = await requestGithubApi(token, `/user/installations?per_page=100&page=${page}`, {
      schema: installationsSchema,
    });
    return result.ok ? { ok: true, value: result.value.installations } : result;
  });
  if (!installations.ok) {
    return installations;
  }
  const repositoryById = new Map<number, GithubRepository>();
  for (const installation of installations.value) {
    // eslint-disable-next-line eslint/no-await-in-loop -- Bound concurrent GitHub API requests.
    const repositories = await readPages(async (page) => {
      const result = await requestGithubApi(
        token,
        `/user/installations/${installation.id}/repositories?per_page=100&page=${page}`,
        { schema: repositoriesSchema },
      );
      return result.ok ? { ok: true, value: result.value.repositories } : result;
    });
    if (!repositories.ok) {
      return repositories;
    }
    for (const repository of repositories.value) {
      repositoryById.set(repository.id, repository);
    }
  }
  const repositories = [...repositoryById.values()].toSorted((first, second) =>
    first.full_name.localeCompare(second.full_name),
  );
  return { ok: true, value: repositories };
}

export async function createGithubRepository(
  token: string,
  name: string,
  isPrivate: boolean,
): Promise<GithubResult<GithubRepository>> {
  if (!/^[a-z\d][a-z\d._-]{0,99}$/iu.test(name)) {
    return {
      ok: false,
      error: 'Enter a repository name using letters, digits, dots, hyphens or underscores.',
    };
  }
  return requestGithubApi(token, '/user/repos', {
    schema: repositorySchema,
    json: { name, private: isPrivate, auto_init: true },
  });
}

export async function listGithubBranches(
  token: string,
  repository: GithubRepository,
): Promise<GithubResult<readonly string[]>> {
  return readPages(async (page) => {
    const result = await requestGithubApi(
      token,
      `/repos/${repository.full_name}/branches?per_page=100&page=${page}`,
      { schema: branchesSchema },
    );
    return result.ok ? { ok: true, value: result.value.map((branch) => branch.name) } : result;
  });
}
