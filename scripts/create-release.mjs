import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const VERSION = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const RELEASE_LABELS = ['release:patch', 'release:minor', 'release:major'];

export function nextReleaseTag(tags, bump) {
  const versions = tags
    .filter((tag) => VERSION.test(tag))
    .map((tag) => tag.replace(/^v/, '').split('.').map(Number))
    .toSorted((left, right) => right[0] - left[0] || right[1] - left[1] || right[2] - left[2]);
  const [major, minor, patch] = versions[0] ?? [0, 0, 0];
  switch (bump) {
    case 'major':
      return `v${major + 1}.0.0`;
    case 'minor':
      return `v${major}.${minor + 1}.0`;
    case 'patch':
      return `v${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unsupported release increment: ${bump}`);
  }
}

export function createRelease({ pullRequest, api }) {
  if (!pullRequest.merged || pullRequest.base.ref !== 'main') return;
  const labels = pullRequest.labels.filter((label) => RELEASE_LABELS.includes(label.name));
  if (labels.length === 0) return;
  if (labels.length !== 1)
    throw new Error('Use exactly one release:patch, release:minor or release:major label.');

  const marker = `<!-- release-pr:${pullRequest.number} -->`;
  const releases = api.list('releases');
  const existing = releases.find((release) => release.body?.includes(marker));
  if (existing) return existing;

  const tags = api.list('tags').map((tag) => tag.name);
  const tag = nextReleaseTag(tags, labels[0].name.slice('release:'.length));
  const notes = api.post('releases/generate-notes', {
    tag_name: tag,
    target_commitish: pullRequest.merge_commit_sha,
  });
  return api.post('releases', {
    tag_name: tag,
    target_commitish: pullRequest.merge_commit_sha,
    name: tag,
    body: `${notes.body}\n\n${marker}`,
    draft: false,
    prerelease: false,
    make_latest: 'true',
  });
}

function githubApi(repository) {
  const root = `repos/${repository}/`;
  return {
    list(resource) {
      return JSON.parse(
        execFileSync('gh', ['api', '--paginate', '--slurp', `${root}${resource}?per_page=100`], {
          encoding: 'utf8',
        }),
      ).flat();
    },
    post(resource, body) {
      return JSON.parse(
        execFileSync('gh', ['api', '--method', 'POST', `${root}${resource}`, '--input', '-'], {
          input: JSON.stringify(body),
          encoding: 'utf8',
        }),
      );
    },
  };
}

if (import.meta.main) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const release = createRelease({
    pullRequest: event.pull_request,
    api: githubApi(process.env.GITHUB_REPOSITORY),
  });
  console.log(release ? `Release ready: ${release.html_url}` : 'No release requested.');
}
