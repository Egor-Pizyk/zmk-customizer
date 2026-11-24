import type { Project } from '@domain';
import { planPublication } from '@domain/publication';
import { PROJECT_BUDGET } from '@domain/project';
import type { PublicationChange } from '@domain/publication';
import type { GeneratedFile } from '@generators';
import { parseProjectFile, serializeProject } from '@storage/project';
import { z } from 'zod';
import { requestGithubApi } from './github-repositories';
import type { GithubDestination } from './github-repositories';
import type { GithubResult } from './request-github';

const PROJECT_PATH = '.zmk-customizer/project.json';
const oidSchema = z.string().regex(/^[a-f\d]{40}$/u);
const branchSchema = z.object({
  commit: z.object({
    sha: oidSchema,
    commit: z.object({ tree: z.object({ sha: oidSchema }) }),
  }),
});
const treeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(
    z.object({ path: z.string(), sha: oidSchema, mode: z.string(), size: z.number().optional() }),
  ),
});
const commitSchema = z.object({
  data: z
    .object({
      createCommitOnBranch: z.object({ commit: z.object({ oid: oidSchema }) }),
    })
    .nullish(),
  errors: z.array(z.object({ type: z.string().optional() })).optional(),
});
const projectBlobSchema = z.object({
  encoding: z.literal('base64'),
  content: z.string(),
});
const runSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  head_branch: z.string().nullable(),
  head_sha: oidSchema,
  status: z.string().nullable(),
  conclusion: z.string().nullable(),
});
const runsSchema = z.object({ workflow_runs: z.array(runSchema) });

const artifactsSchema = z.object({
  artifacts: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string(),
      expired: z.boolean(),
    }),
  ),
});

export type GithubRun = z.infer<typeof runSchema> & {
  readonly artifacts: z.infer<typeof artifactsSchema>['artifacts'];
};
export type GithubReview = {
  readonly destination: GithubDestination;
  readonly head: string;
  readonly changes: readonly PublicationChange[];
};

async function toGitBlobOid(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const header = encoder.encode(`blob ${bytes.length}\0`);
  const blob = new Uint8Array(header.length + bytes.length);
  blob.set(header);
  blob.set(bytes, header.length);
  const hash = await crypto.subtle.digest('SHA-1', blob);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readGithubTree(token: string, destination: GithubDestination) {
  const repoPath = `/repos/${destination.repository.full_name}`;
  const branch = await requestGithubApi(
    token,
    `${repoPath}/branches/${encodeURIComponent(destination.branch)}`,
    { schema: branchSchema },
  );
  if (!branch.ok) {
    return branch;
  }
  const { sha: head, commit } = branch.value.commit;
  const tree = await requestGithubApi(
    token,
    `${repoPath}/git/trees/${commit.tree.sha}?recursive=1`,
    { schema: treeSchema },
  );
  if (!tree.ok) {
    return tree;
  }
  if (tree.value.truncated) {
    return {
      ok: false,
      error: 'GitHub could not list the entire branch. Use a dedicated ZMK repository.',
    } as const;
  }
  return { ok: true, value: { head, entries: tree.value.tree } } as const;
}

type PublicationInput = {
  readonly files: readonly GeneratedFile[];
  readonly project: Project;
  readonly useGeneratedWorkflow: boolean;
};

export async function reviewGithubPublication(
  token: string,
  destination: GithubDestination,
  { files, project, useGeneratedWorkflow }: PublicationInput,
): Promise<GithubResult<GithubReview>> {
  const serialized = serializeProject(project);
  if (!serialized.ok) {
    return { ok: false, error: `Could not prepare the project file: ${serialized.error}.` };
  }
  const tree = await readGithubTree(token, destination);
  if (!tree.ok) {
    return tree;
  }
  const publicationFiles = [...files, { path: PROJECT_PATH, content: serialized.value }];
  let checksummedFiles;
  try {
    checksummedFiles = await Promise.all(
      publicationFiles.map(async (file) => ({
        path: file.path,
        content: file.content,
        oid: await toGitBlobOid(file.content),
      })),
    );
  } catch {
    return { ok: false, error: 'Could not compare files. Open ZMK Customizer over HTTPS.' };
  }
  const changes = planPublication(checksummedFiles, tree.value.entries, useGeneratedWorkflow);
  if (!changes.ok) {
    return {
      ok: false,
      error: `GitHub has a special entry at ${changes.error}. Move it or choose another branch.`,
    };
  }
  return { ok: true, value: { destination, head: tree.value.head, changes: changes.value } };
}

const COMMIT_MUTATION = `mutation PublishFirmware($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) { commit { oid } }
}`;

function toBase64(content: string): string {
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 24_576) {
    binary += String.fromCodePoint(...bytes.subarray(offset, offset + 24_576));
  }
  return btoa(binary);
}

function getCommitMutation(review: GithubReview, headline: string) {
  return {
    query: COMMIT_MUTATION,
    variables: {
      input: {
        branch: {
          repositoryNameWithOwner: review.destination.repository.full_name,
          refName: `refs/heads/${review.destination.branch}`,
        },
        expectedHeadOid: review.head,
        message: { headline },
        fileChanges: {
          additions: review.changes.map((file) => ({
            path: file.path,
            contents: toBase64(file.content),
          })),
        },
      },
    },
  };
}

export async function commitGithubPublication(
  token: string,
  review: GithubReview,
  message: string,
): Promise<GithubResult<string>> {
  if (review.changes.length === 0 || message.trim() === '') {
    return { ok: false, error: 'Review changed files and enter a commit message first.' };
  }
  const result = await requestGithubApi(token, '/graphql', {
    schema: commitSchema,
    json: getCommitMutation(review, message.trim()),
  });
  if (!result.ok) {
    return {
      ok: false,
      error: `${result.error} Review changes again to check whether the commit was saved.`,
    };
  }
  const commit = result.value.data?.createCommitOnBranch.commit;
  if (commit === undefined) {
    return {
      ok: false,
      error:
        'GitHub rejected the commit. Review again to check for branch changes, then verify write access and branch rules.',
    };
  }
  return { ok: true, value: commit.oid };
}

export async function openGithubProject(
  token: string,
  destination: GithubDestination,
): Promise<GithubResult<Project>> {
  const tree = await readGithubTree(token, destination);
  if (!tree.ok) {
    return tree;
  }
  const entry = tree.value.entries.find((item) => item.path === PROJECT_PATH);
  if (entry?.mode !== '100644') {
    return {
      ok: false,
      error: 'This branch does not contain a project published by ZMK Customizer.',
    };
  }
  if ((entry.size ?? 0) > PROJECT_BUDGET.bytes) {
    return { ok: false, error: 'The project file on GitHub is too large to open.' };
  }
  const result = await requestGithubApi(
    token,
    `/repos/${destination.repository.full_name}/git/blobs/${entry.sha}`,
    { schema: projectBlobSchema },
  );
  if (!result.ok) {
    return result;
  }
  try {
    const binary = atob(result.value.content);
    const bytes = Uint8Array.from(binary, (character) => character.codePointAt(0) ?? 0);
    const project = parseProjectFile(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return project.ok
      ? project
      : {
          ok: false,
          error: 'This branch contains an invalid or unsupported ZMK Customizer project.',
        };
  } catch {
    return { ok: false, error: 'Could not decode the project file on GitHub.' };
  }
}

export async function listGithubBuilds(
  token: string,
  destination: GithubDestination,
  commit: string,
): Promise<GithubResult<readonly GithubRun[]>> {
  const query = new URLSearchParams({
    head_sha: commit,
    branch: destination.branch,
    per_page: '100',
  });
  const result = await requestGithubApi(
    token,
    `/repos/${destination.repository.full_name}/actions/runs?${query}`,
    { schema: runsSchema },
  );
  if (!result.ok) {
    return result;
  }
  const runs = result.value.workflow_runs.filter(
    (run) => run.head_sha === commit && run.head_branch === destination.branch,
  );
  const builds = await Promise.all(
    runs.map(async (run) => {
      if (run.conclusion !== 'success') {
        return Object.assign(run, { artifacts: [] });
      }
      const artifacts = await requestGithubApi(
        token,
        `/repos/${destination.repository.full_name}/actions/runs/${run.id}/artifacts`,
        { schema: artifactsSchema },
      );
      return Object.assign(run, { artifacts: artifacts.ok ? artifacts.value.artifacts : [] });
    }),
  );
  return { ok: true, value: builds };
}
