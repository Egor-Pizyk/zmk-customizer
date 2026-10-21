import { spawnSync, execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  readdirSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import path from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const root = git('rev-parse', '--show-toplevel');
process.chdir(root);
const baseArg = process.argv.indexOf('--base');
const base = baseArg < 0 ? null : process.argv[baseArg + 1];
if (baseArg >= 0 && !base) throw new Error('--base requires a Git revision');
// Index mode is exact even with partially staged files. --base compares committed HEAD.
const baseRevision = git('rev-parse', '--verify', `${base ?? 'HEAD'}^{commit}`);
const revision = base ? git('rev-parse', 'HEAD^{tree}') : git('write-tree');
const files = execFileSync(
  'git',
  ['diff', '--no-renames', '--name-only', '-z', baseRevision, revision, '--'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
if (!files.length) {
  console.log('No changed files to check.');
  process.exit(0);
}
mkdirSync('.check-changes', { recursive: true });
const logs = path.join(
  root,
  '.check-logs',
  `${revision.slice(0, 12)}-${baseRevision.slice(0, 12)}`,
);
mkdirSync(logs, { recursive: true });
const receipt = path.join(logs, 'passed.json');
if (!process.argv.includes('--force') && existsSync(receipt)) {
  const previous = JSON.parse(readFileSync(receipt, 'utf8'));
  if (
    previous.revision === revision &&
    previous.base === baseRevision &&
    JSON.stringify(previous.files) === JSON.stringify(files)
  ) {
    console.log(`Already checked tree ${revision}; receipt: ${receipt}`);
    process.exit(0);
  }
}
rmSync(receipt, { force: true });
console.log(`Checking tree ${revision}; logs: ${logs}`);
const snapshot = mkdtempSync(path.join(root, '.check-changes', 'snapshot-'));
try {
  const archive = execFileSync('git', ['archive', revision], { maxBuffer: 100 * 1024 * 1024 });
  execFileSync('tar', ['-xf', '-', '-C', snapshot], { input: archive });
  writeFileSync(path.join(snapshot, '.changed-files.json'), JSON.stringify({ files, revision }));
  const tests = readdirSync(path.join(snapshot, 'tests/tooling'))
    .filter((name) => name.endsWith('.test.mjs'))
    .map((name) => `tests/tooling/${name}`);
  writeFileSync(path.join(snapshot, '.tooling-tests.json'), JSON.stringify(tests));
  const result = spawnSync(
    'docker',
    [
      'compose',
      '-p',
      'zmk-customizer',
      '-f',
      'infra/compose.e2e.yaml',
      'run',
      '--rm',
      '-v',
      `${snapshot}:/app`,
      '-v',
      `${logs}:/app/.check-logs`,
      'e2e',
      'node',
      'scripts/run-changed-checks.mjs',
    ],
    { stdio: 'inherit' },
  );
  if (result.error || result.status !== 0) process.exitCode = 1;
  if (!base && git('write-tree') !== revision)
    throw new Error('Index changed during checks; retry the commit.');
  if (!process.exitCode)
    writeFileSync(receipt, JSON.stringify({ revision, base: baseRevision, files }));
} finally {
  rmSync(snapshot, { recursive: true, force: true });
}
