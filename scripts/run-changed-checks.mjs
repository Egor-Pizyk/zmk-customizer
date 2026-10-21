import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { changedCheckPlan } from './changed-check-plan.mjs';

const manifest = JSON.parse(readFileSync('.changed-files.json', 'utf8'));
const plan = changedCheckPlan(manifest.files);
mkdirSync('.check-logs', { recursive: true });
let commandIndex = 0;
function run(command, args) {
  const log = `.check-logs/${++commandIndex}-${command}.log`;
  console.log(
    `> ${command} ${args.slice(0, 4).join(' ')}${args.length > 4 ? ` (+${args.length - 4} arguments)` : ''}; log: ${log}`,
  );
  const descriptor = openSync(log, 'w');
  let result;
  try {
    result = spawnSync(command, args, { stdio: ['ignore', descriptor, descriptor] });
  } finally {
    closeSync(descriptor);
  }
  if (result.error || result.status !== 0) {
    console.error(readFileSync(log, 'utf8').split('\n').slice(-50).join('\n'));
    throw new Error(`Check failed: ${command}; full log: ${log}`);
  }
  console.log('  passed');
}
const npm = (name) => run('npm', ['run', name]);
if (
  manifest.files.some((file) => /^package(?:-lock)?\.json$/u.test(file)) ||
  !existsSync('node_modules/vitest')
)
  run('npm', ['ci']);
console.log(`Changed checks: ${manifest.files.length} files; ${manifest.revision}`);
// These inspect the whole import/type graph, including cross-file invariants.
npm('typecheck');
npm('test:e2e:types');
npm('check:architecture');
npm('check:guidelines');
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
  run('npx', ['--no-install', 'oxfmt', '--check', ...formatted]);
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
if (plan.browser.length)
  run('npx', ['--no-install', 'playwright', 'test', ...plan.browser, '--project=chromium']);
console.log('Changed checks passed. Full coverage and all browsers run in CI.');
