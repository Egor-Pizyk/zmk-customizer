import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export function coverageBody(run, data) {
  const rows = ['statements', 'branches', 'functions', 'lines'].map((name) => {
    const value = data?.total?.[name]?.pct;
    return `| ${name} | ${typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? `${value}%` : 'unavailable'} |`;
  });
  const pending = run.status !== 'completed';
  const passed =
    data?.result === 'success' &&
    ['statements', 'branches', 'functions', 'lines'].every(
      (name) =>
        Number.isFinite(data?.total?.[name]?.pct) &&
        data.total[name].pct >= 0 &&
        data.total[name].pct <= 100,
    );
  return `<!-- zmk-coverage -->\nCoverage for \`${run.head_sha}\`\n\n${pending ? '⏳ Current CI run pending; coverage unavailable.' : passed ? '✅ Tests and coverage thresholds passed.' : '❌ Tests/coverage failed or unavailable; previous coverage is not current.'}\n\n| Metric | Coverage |\n|---|---|\n${rows.join('\n')}\n\n[CI run](${run.html_url})`;
}

export async function publishCoverage({ run, api, load }) {
  if (run.event !== 'pull_request') return;
  const prs = await api(`/commits/${run.head_sha}/pulls`);
  for (const pr of prs) {
    if (pr.state !== 'open' || pr.head.sha !== run.head_sha) continue;
    let data;
    try {
      data = run.status === 'completed' ? await load() : null;
    } catch {
      data = null;
    }
    const comments = await api(`/issues/${pr.number}/comments?per_page=100`, undefined, true);
    const own = comments.find(
      (comment) =>
        comment.user?.login === 'github-actions[bot]' &&
        comment.body.includes('<!-- zmk-coverage -->'),
    );
    // Recheck after artifact/network I/O; stale runs never replace a newer head.
    const current = await api(`/pulls/${pr.number}`);
    if (current.head.sha !== run.head_sha || current.state !== 'open') continue;
    const runs = await api(
      `/actions/workflows/ci.yml/runs?event=pull_request&head_sha=${run.head_sha}&per_page=100`,
    );
    if (
      runs.workflow_runs.some(
        (other) =>
          other.id > run.id || (other.id === run.id && other.run_attempt > run.run_attempt),
      )
    )
      continue;
    const body = coverageBody(run, data);
    await api(own ? `/issues/comments/${own.id}` : `/issues/${pr.number}/comments`, {
      method: own ? 'PATCH' : 'POST',
      body: JSON.stringify({ body }),
    });
  }
}

if (process.argv[1]?.endsWith('/coverage-comment.mjs')) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const run = event.workflow_run;
  const prefix = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
  const api = async (route, options, pages = false) => {
    const response = await fetch(prefix + route, {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${route}`);
    const result = await response.json();
    const next = response.headers.get('link')?.match(/<([^>]+)>; rel="next"/u)?.[1];
    if (pages && next)
      return [...result, ...(await api(next.slice(prefix.length), undefined, true))];
    return result;
  };
  await publishCoverage({
    run,
    api,
    load: () => {
      const result = spawnSync(
        'gh',
        [
          'run',
          'download',
          String(run.id),
          '--repo',
          process.env.GITHUB_REPOSITORY,
          '--name',
          'coverage',
          '--dir',
          process.env.RUNNER_TEMP + '/coverage',
        ],
        { stdio: 'inherit' },
      );
      if (result.status !== 0) throw new Error('Coverage artifact unavailable');
      return JSON.parse(readFileSync(process.env.RUNNER_TEMP + '/coverage/result.json', 'utf8'));
    },
  });
}
