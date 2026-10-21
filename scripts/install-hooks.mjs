import { existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
if (!process.env.CI) {
  const current = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
    encoding: 'utf8',
  }).stdout.trim();
  const legacy = execFileSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], {
    encoding: 'utf8',
  }).trim();
  if (!current && existsSync(legacy))
    throw new Error('Existing pre-commit hook; integrate explicitly before installing.');
  if (current && current !== '.githooks')
    throw new Error(`Existing hooksPath ${current}; integrate explicitly before installing.`);
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
}
