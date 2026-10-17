import assert from 'node:assert/strict';
import test from 'node:test';
import { createRelease, nextReleaseTag } from '../../scripts/create-release.mjs';

const pullRequest = {
  number: 42,
  merged: true,
  base: { ref: 'main' },
  merge_commit_sha: 'abc123',
  labels: [{ name: 'release:patch' }],
};

test('starts at 0.0.1 and resets lower version components for minor/major', () => {
  assert.equal(nextReleaseTag([], 'patch'), 'v0.0.1');
  const tags = ['v0.9.9', 'v1.2.8', 'v1.10.3', 'v2.0.0-rc.1', 'unrelated'];
  assert.equal(nextReleaseTag(tags, 'patch'), 'v1.10.4');
  assert.equal(nextReleaseTag(tags, 'minor'), 'v1.11.0');
  assert.equal(nextReleaseTag(tags, 'major'), 'v2.0.0');
  assert.equal(nextReleaseTag(['1.0.0'], 'patch'), 'v1.0.1');
  assert.throws(() => nextReleaseTag([], 'typo'), /Unsupported/);
});

test('only merged main PRs with exactly one release label can publish', () => {
  const api = {
    list() {
      throw new Error('Must not call GitHub');
    },
  };
  assert.equal(createRelease({ pullRequest: { ...pullRequest, merged: false }, api }), undefined);
  assert.equal(
    createRelease({ pullRequest: { ...pullRequest, base: { ref: 'dev' } }, api }),
    undefined,
  );
  assert.equal(createRelease({ pullRequest: { ...pullRequest, labels: [] }, api }), undefined);
  assert.throws(
    () =>
      createRelease({
        pullRequest: {
          ...pullRequest,
          labels: [{ name: 'release:minor' }, { name: 'release:major' }],
        },
        api,
      }),
    /exactly one/,
  );
});

test('publishes changelog at the merge SHA, with a marker preventing duplicate reruns', () => {
  const posts = [];
  const api = {
    list(resource) {
      return resource === 'tags' ? [{ name: 'v0.0.9' }] : [];
    },
    post(resource, body) {
      posts.push({ resource, body });
      return resource.endsWith('generate-notes')
        ? { body: 'Changes in #42' }
        : { html_url: 'release-url' };
    },
  };
  assert.equal(createRelease({ pullRequest, api }).html_url, 'release-url');
  assert.deepEqual(posts, [
    {
      resource: 'releases/generate-notes',
      body: { tag_name: 'v0.0.10', target_commitish: 'abc123' },
    },
    {
      resource: 'releases',
      body: {
        tag_name: 'v0.0.10',
        target_commitish: 'abc123',
        name: 'v0.0.10',
        body: 'Changes in #42\n\n<!-- release-pr:42 -->',
        draft: false,
        prerelease: false,
        make_latest: 'true',
      },
    },
  ]);
  const existing = { body: posts[1].body.body, html_url: 'release-url' };
  api.list = () => [existing];
  assert.equal(createRelease({ pullRequest, api }), existing);
  assert.equal(posts.length, 2);
});

test('API failures abort instead of publishing an incomplete changelog', () => {
  const api = {
    list() {
      return [];
    },
    post() {
      throw new Error('GitHub unavailable');
    },
  };
  assert.throws(() => createRelease({ pullRequest, api }), /GitHub unavailable/);
});
