import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { history, openProject, saved, wiredFixture, workspace } from './helpers';

const INITIAL_HEAD = '1'.repeat(40);
const TREE = '2'.repeat(40);
const NEW_HEAD = '3'.repeat(40);
const PROJECT_BLOB = '4'.repeat(40);
const REPOSITORY = {
  id: 7,
  full_name: 'builder/zmk-config',
  default_branch: 'main',
  private: true,
};

async function mockGithubSignIn(page: Page) {
  await page.route('**/github-test-auth/config', async (route) => {
    await route.fulfill({
      json: { clientId: 'github-app-test', callbackUrl: 'http://127.0.0.1:4175/' },
    });
  });
  await page.route('https://github.com/login/oauth/authorize?**', async (route) => {
    const auth = new URL(route.request().url());
    expect(auth.searchParams.get('code_challenge_method')).toBe('S256');
    expect(auth.searchParams.get('code_challenge')).toMatch(/^[\w-]{43}$/u);
    const callback = new URL('http://127.0.0.1:4175/');
    callback.searchParams.set('code', 'test-code');
    callback.searchParams.set('state', auth.searchParams.get('state') ?? '');
    await route.fulfill({ status: 302, headers: { Location: callback.href } });
  });
  await page.route('**/github-test-auth/token', async (route) => {
    expect(route.request().postData()).toMatch(/"verifier":"[a-f0-9]{64}"/u);
    await route.fulfill({ json: { token: 'github-test-user-token' } });
  });
}

async function mockGithubRepository(page: Page, projectJson: string) {
  const receivedCommits: unknown[] = [];
  let created = false;
  await page.route('https://api.github.com/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    switch (path) {
      case '/user/installations': {
        await route.fulfill({ json: { installations: [{ id: 42 }] } });
        return;
      }
      case '/user/installations/42/repositories': {
        await route.fulfill({ json: { repositories: created ? [REPOSITORY] : [] } });
        return;
      }
      case '/user/repos': {
        expect(JSON.parse(route.request().postData() ?? '{}')).toEqual({
          name: 'zmk-config',
          private: true,
          auto_init: true,
        });
        created = true;
        await route.fulfill({ status: 201, json: REPOSITORY });
        return;
      }
      case '/repos/builder/zmk-config/branches': {
        await route.fulfill({ json: [{ name: 'main' }, { name: 'firmware/demo' }] });
        return;
      }
      case '/repos/builder/zmk-config/branches/firmware%2Fdemo': {
        await route.fulfill({
          json: { commit: { sha: INITIAL_HEAD, commit: { tree: { sha: TREE } } } },
        });
        return;
      }
      case `/repos/builder/zmk-config/git/trees/${TREE}`: {
        await route.fulfill({
          json: {
            truncated: false,
            tree: [
              { path: 'README.md', sha: TREE, mode: '100644' },
              { path: '.github/workflows/custom.yaml', sha: TREE, mode: '100644' },
              { path: '.zmk-customizer/project.json', sha: PROJECT_BLOB, mode: '100644' },
            ],
          },
        });
        return;
      }
      case `/repos/builder/zmk-config/git/blobs/${PROJECT_BLOB}`: {
        await route.fulfill({
          json: {
            encoding: 'base64',
            content: Buffer.from(projectJson, 'utf8').toString('base64'),
          },
        });
        return;
      }
      case '/graphql': {
        receivedCommits.push(JSON.parse(route.request().postData() ?? '{}'));
        await route.fulfill({
          json:
            receivedCommits.length === 1
              ? { data: { createCommitOnBranch: { commit: { oid: NEW_HEAD } } } }
              : { data: null, errors: [{ type: 'STALE_DATA' }] },
        });
        return;
      }
      case '/repos/builder/zmk-config/actions/runs': {
        expect(new URL(route.request().url()).searchParams.get('head_sha')).toBe(NEW_HEAD);
        await route.fulfill({
          json: {
            workflow_runs: [
              {
                id: 8,
                name: 'Firmware',
                head_branch: 'firmware/demo',
                head_sha: NEW_HEAD,
                status: 'completed',
                conclusion: 'success',
              },
              {
                id: 9,
                name: 'Other commit',
                head_branch: 'firmware/demo',
                head_sha: INITIAL_HEAD,
                status: 'completed',
                conclusion: 'success',
              },
            ],
          },
        });
        return;
      }
      case '/repos/builder/zmk-config/actions/runs/8/artifacts': {
        await route.fulfill({
          json: { artifacts: [{ id: 12, name: 'firmware', expired: false }] },
        });
        return;
      }
      default: {
        throw new Error(`Unexpected GitHub route ${path}`);
      }
    }
  });
  return receivedCommits;
}

test('GitHub sign-in, repository creation, atomic publish, build artifact and undoable open', async ({
  page,
}) => {
  await openProject(page, wiredFixture);
  const localProject = await saved(page);
  const remoteProject = { ...localProject, name: 'Remote board' };
  await mockGithubSignIn(page);
  const receivedCommits = await mockGithubRepository(page, JSON.stringify(remoteProject));

  await workspace(page, 'Export');
  await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
  await page.getByRole('button', { name: 'New repository' }).click();
  await page.getByRole('textbox', { name: 'New repository name' }).fill('zmk-config');
  await page.getByRole('button', { name: 'Create repository', exact: true }).click();
  await page.getByRole('combobox', { name: 'Repository', exact: true }).selectOption('7');
  await page.getByRole('combobox', { name: 'Branch', exact: true }).selectOption('firmware/demo');

  const reviewButton = page.getByRole('button', { name: 'Review commit' });
  await reviewButton.click();
  const review = page.getByRole('dialog', { name: 'Review GitHub commit' });
  await expect(review).toContainText('builder/zmk-config');
  await expect(review).toContainText('.zmk-customizer/project.json');
  await expect(review).not.toContainText('.github/workflows/build.yml');
  await review.getByRole('button', { name: 'Cancel' }).press('Enter');
  await expect(reviewButton).toBeFocused();
  expect(receivedCommits).toHaveLength(0);
  await reviewButton.click();
  await review.getByRole('button', { name: 'Commit to GitHub' }).click();
  await expect(page.getByRole('link', { name: 'Download firmware', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/builder/zmk-config/actions/runs/8/artifacts/12',
  );
  expect(receivedCommits).toEqual([
    expect.objectContaining({
      variables: {
        input: {
          branch: {
            repositoryNameWithOwner: 'builder/zmk-config',
            refName: 'refs/heads/firmware/demo',
          },
          expectedHeadOid: INITIAL_HEAD,
          message: { headline: 'Update ZMK firmware configuration' },
          fileChanges: {
            additions: expect.arrayContaining([
              expect.objectContaining({ path: '.zmk-customizer/project.json' }),
              expect.objectContaining({ path: 'build.yaml' }),
            ]),
          },
        },
      },
    }),
  ]);
  await expect(page.getByRole('link', { name: 'Other commit' })).toHaveCount(0);

  await reviewButton.click();
  await review.getByRole('button', { name: 'Commit to GitHub' }).click();
  await expect(page.getByText('GitHub rejected the commit', { exact: false })).toBeVisible();
  expect(await saved(page)).toEqual(localProject);

  await page.getByRole('button', { name: 'Open project from GitHub' }).click();
  const open = page.getByRole('dialog', { name: 'Open project from GitHub' });
  await expect(open).toContainText('Remote board');
  await open.getByRole('button', { name: 'Open project', exact: true }).click();
  await expect.poll(() => saved(page)).toEqual(remoteProject);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(localProject);
});

test('a forged GitHub callback leaves the project intact on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openProject(page, wiredFixture);
  const original = await saved(page);
  await workspace(page, 'Export');
  await page.route('**/github-test-auth/token', () => {
    throw new Error('A callback without matching state must never exchange its code');
  });
  await page.goto('/?code=unknown&state=unmatched');
  const panel = page.getByRole('region', { name: 'GitHub firmware' });
  await expect(
    panel.getByText('GitHub sign-in was cancelled or expired. Sign in again.'),
  ).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:4175/');
  await expect(panel.getByRole('button', { name: 'Sign in with GitHub' })).toBeInViewport();
  expect(await panel.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
    await panel.evaluate((element) => element.clientWidth),
  );
  expect(await saved(page)).toEqual(original);
});
