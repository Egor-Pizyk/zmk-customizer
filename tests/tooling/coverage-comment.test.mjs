import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coverageBody, publishCoverage } from '../../scripts/coverage-comment.mjs';

const run = {
  id: 40,
  run_attempt: 1,
  event: 'pull_request',
  head_sha: 'abc',
  html_url: 'https://example.com/run/40',
  status: 'completed',
};
const total = Object.fromEntries(
  ['statements', 'branches', 'functions', 'lines'].map((name) => [name, { pct: 93.5 }]),
);
function fixture({ stale = false, newer = false, comment = true } = {}) {
  const writes = [];
  const api = async (route, options) => {
    if (options) {
      writes.push({ route, ...options });
      return {};
    }
    if (route.startsWith('/commits/')) return [{ number: 15, state: 'open', head: { sha: 'abc' } }];
    if (route.startsWith('/issues/'))
      return comment
        ? [{ id: 7, user: { login: 'github-actions[bot]' }, body: '<!-- zmk-coverage -->' }]
        : [];
    if (route.startsWith('/pulls/')) return { state: 'open', head: { sha: stale ? 'new' : 'abc' } };
    return { workflow_runs: newer ? [{ id: 41, run_attempt: 1 }] : [run] };
  };
  return { api, writes };
}
test('coverage result includes all metrics, SHA, threshold failure and missing/pending evidence', () => {
  const body = coverageBody(run, { result: 'success', total });
  assert.match(body, /93.5%/u);
  assert.match(body, /`abc`/u);
  assert.match(body, /thresholds passed/u);
  assert.match(coverageBody(run, { result: 'failure', total }), /failed or unavailable/u);
  assert.match(coverageBody(run, null), /unavailable/u);
  assert.match(coverageBody({ ...run, status: 'in_progress' }, null), /pending/u);
  assert.doesNotMatch(coverageBody(run, { result: 'success', total: {} }), /thresholds passed/u);
});
test('updates the existing bot comment, creates once if absent', async () => {
  for (const comment of [true, false]) {
    const { api, writes } = fixture({ comment });
    await publishCoverage({ run, api, load: () => ({ result: 'success', total }) });
    assert.equal(writes.length, 1);
    assert.equal(writes[0].method, comment ? 'PATCH' : 'POST');
  }
});
test('stale head and older runs cannot overwrite current coverage', async () => {
  for (const setting of [{ stale: true }, { newer: true }]) {
    const { api, writes } = fixture(setting);
    await publishCoverage({ run, api, load: () => ({ result: 'success', total }) });
    assert.equal(writes.length, 0);
  }
});
test('artifact failure replaces old coverage with an explicit unavailable result', async () => {
  const { api, writes } = fixture();
  await publishCoverage({
    run,
    api,
    load: () => {
      throw new Error('missing');
    },
  });
  assert.match(JSON.parse(writes[0].body).body, /failed or unavailable/u);
});

test('a previous attempt of the same run cannot overwrite a rerun', async () => {
  const original = fixture();
  const api = (route, options, pages) =>
    route.startsWith('/actions/')
      ? { workflow_runs: [{ ...run, run_attempt: 2 }] }
      : original.api(route, options, pages);
  await publishCoverage({ run, api, load: () => ({ result: 'success', total }) });
  assert.equal(original.writes.length, 0);
});
