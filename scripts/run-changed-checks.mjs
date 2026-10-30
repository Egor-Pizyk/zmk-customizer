import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, openSync, closeSync, writeFileSync } from 'node:fs';
import { changedCheckPlan, describeCheckPlan } from './changed-check-plan.mjs';

const manifest = JSON.parse(readFileSync('.changed-files.json', 'utf8'));
const mode = manifest.mode ?? 'static';
if (!['static', 'unit'].includes(mode)) throw new Error(`Unsupported verification stage: ${mode}`);
const plan = changedCheckPlan(manifest.files, existsSync, mode);
mkdirSync('.check-logs', { recursive: true });
const startedAt = performance.now();
const summary = {
  mode,
  revision: manifest.revision,
  status: 'running',
  selection: describeCheckPlan(plan),
  checks: [],
};
const saveSummary = () => {
  summary.durationMs = Math.round(performance.now() - startedAt);
  writeFileSync('.check-logs/summary.json', JSON.stringify(summary, null, 2));
};
saveSummary();
let commandIndex = 0;
function run(command, args) {
  const log = `.check-logs/${++commandIndex}-${command}.log`;
  console.log(
    `> ${command} ${args.slice(0, 4).join(' ')}${args.length > 4 ? ` (+${args.length - 4} arguments)` : ''}; log: ${log}`,
  );
  const descriptor = openSync(log, 'w');
  let result;
  const started = performance.now();
  try {
    result = spawnSync(command, args, { stdio: ['ignore', descriptor, descriptor] });
  } finally {
    closeSync(descriptor);
  }
  const failed = result.error !== undefined || result.status !== 0;
  const check = {
    command: [command, ...args.slice(0, 3)].join(' '),
    status: failed ? 'failed' : 'passed',
    durationMs: Math.round(performance.now() - started),
    log,
  };
  if (failed) {
    // ANSI escapes are expected in captured compiler/test output.
    // oxlint-disable-next-line no-control-regex
    const ansi = /\x1b\[[0-9;]*m/gu;
    const lines = readFileSync(log, 'utf8').replace(ansi, '').split('\n');
    const relevant = lines.filter((line) =>
      /error|FAIL|Expected:|Received:|Locator:|^\s*x |\d+\) \[|✘/iu.test(line),
    );
    check.excerpt = (relevant.length ? relevant.slice(0, 12) : lines.slice(-12)).map((line) =>
      line.slice(0, 240),
    );
    summary.checks.push(check);
    summary.status = 'failed';
    saveSummary();
    console.error(check.excerpt.join('\n'));
    throw new Error(
      `Check failed: ${command}; full log: ${log}; summary: .check-logs/summary.json`,
    );
  }
  summary.checks.push(check);
  saveSummary();
  console.log('  passed');
}
const npm = (name) => run('npm', ['run', name]);
try {
  if (
    manifest.files.some((file) => /^package(?:-lock)?\.json$/u.test(file)) ||
    !existsSync('node_modules/vitest')
  )
    run('npm', ['ci']);
  console.log(`Changed checks: ${manifest.files.length} files; ${manifest.revision}`);
  if (plan.static) {
    // These inspect the whole import/type graph, including cross-file invariants.
    npm('typecheck');
    npm('test:e2e:types');
    npm('check:architecture');
    const production = plan.code.filter((file) =>
      /^(?:src\/|tests\/(?:unit|helpers|e2e)\/|vite\.config|playwright\.config)/u.test(file),
    );
    const tooling = plan.code.filter((file) => /^(?:scripts|tests\/tooling)\//u.test(file));
    if (plan.fullLint) {
      npm('lint');
      npm('format:check');
    }
    if (!plan.fullLint && production.length) run('npx', ['--no-install', 'oxlint', ...production]);
    if (!plan.fullLint && tooling.length)
      run('npx', [
        '--no-install',
        'oxlint',
        '--disable-typescript-plugin',
        '-c',
        'scripts/.oxlintrc.json',
        ...tooling,
      ]);
    const formatted = manifest.files.filter(
      (file) => existsSync(file) && /\.(?:[cm]?[jt]sx?|json|css|ya?ml)$/u.test(file),
    );
    if (!plan.fullLint && formatted.length)
      run('npx', [
        '--no-install',
        'oxfmt',
        '--check',
        '--no-error-on-unmatched-pattern',
        ...formatted,
      ]);
  }
  if (plan.tooling)
    run('node', ['--test', ...JSON.parse(readFileSync('.tooling-tests.json', 'utf8'))]);
  if (plan.fullUnit) npm('test');
  else if (plan.related.length) {
    run('npx', [
      '--no-install',
      'vitest',
      'related',
      ...plan.related,
      '--run',
      '--passWithNoTests',
      '--reporter=json',
      '--outputFile=.check-logs/related.json',
    ]);
    const report = existsSync('.check-logs/related.json')
      ? JSON.parse(readFileSync('.check-logs/related.json', 'utf8'))
      : null;
    if (!report?.numTotalTests) {
      console.log('No dependency-linked tests found: falling back to the full unit suite.');
      npm('test');
    }
  }
  summary.status = 'passed';
  saveSummary();
  console.log(
    `${mode === 'unit' ? 'Unit checks passed.' : 'Static checks passed.'} E2E is a separate explicit stage. Elapsed: ${summary.durationMs}ms. Summary: .check-logs/summary.json`,
  );
} catch (error) {
  summary.status = 'failed';
  saveSummary();
  console.error(error.message);
  process.exitCode = 1;
}
